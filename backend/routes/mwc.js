import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Setting from '../models/Setting.js';
import Poster from '../models/Poster.js';
import Review from '../models/Review.js';
import Coupon from '../models/Coupon.js';
import Location from '../models/Location.js';
import os from 'os';
import AuditLog from '../models/AuditLog.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { logAction } from '../utils/audit.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/storage.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Setup folder structure for uploads (uses /tmp on Vercel to avoid EROFS)
const uploadBase = process.env.VERCEL ? path.join(os.tmpdir(), 'uploads') : path.resolve(__dirname, '../public/uploads');
try {
  const folders = ['/images', '/videos'];
  folders.forEach(f => {
    const dir = path.join(uploadBase, f);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
} catch (err) {
  console.warn('[Storage] Upload directory creation skipped:', err.message);
}

// Multer disk storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subfolder = '/images';
    if (file.mimetype.startsWith('video/')) {
      subfolder = '/videos';
    }
    cb(null, path.join(uploadBase, subfolder));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB maximum size
  }
});

// Multer fields handler wrapper
const uploadFieldsMiddleware = (fields) => {
  const uploadFields = upload.fields(fields);
  return (req, res, next) => {
    uploadFields(req, res, (err) => {
      if (err) {
        console.error('Multer fields upload error in MWC:', err);
        return res.status(400).json({ message: err.message || 'File upload error.' });
      }
      next();
    });
  };
};

const uploadSingleMiddleware = (fieldName) => {
  const uploadSingle = upload.single(fieldName);
  return (req, res, next) => {
    uploadSingle(req, res, (err) => {
      if (err) {
        console.error('Multer single file upload error in MWC:', err);
        return res.status(400).json({ message: err.message || 'File upload error.' });
      }
      next();
    });
  };
};

// Protect all /mwc routes with authentication and role check ('mwc')
router.use(authenticate);
router.use(authorizeRoles('mwc'));

// GET /api/mwc/health - Returns system health metrics (Uptime, Memory, CPU, DB size)
router.get('/health', async (req, res) => {
  try {
    let dbStats = { ok: 0, dataSize: 0 };
    try {
      if (mongoose.connection.db) {
        dbStats = await mongoose.connection.db.stats();
      }
    } catch (e) {
      console.error('Failed to get mongoose db stats:', e);
    }

    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    const cpuUsage = process.cpuUsage();

    return res.json({
      status: 'healthy',
      uptime,
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB'
      },
      cpu: cpuUsage,
      database: {
        size: ((dbStats.dataSize || 0) / 1024).toFixed(2) + ' KB',
        connectionState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
      },
      nodeVersion: process.version,
      platform: process.platform
    });
  } catch (error) {
    console.error('Error fetching system health:', error);
    return res.status(500).json({ message: 'Error retrieving system health details.' });
  }
});

// GET /api/mwc/users - Get list of users
router.get('/users', async (req, res) => {
  const { search, role } = req.query;
  const filter = {};

  if (role) {
    filter.role = role;
  }

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    filter.$or = [
      { name: searchRegex },
      { email: searchRegex }
    ];
  }

  try {
    const users = await User.find(filter).sort({ role: -1, name: 1 });
    const mapped = users.map(u => ({
      ...u.toObject(),
      id: u._id.toString()
    }));
    return res.json(mapped);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ message: 'Error retrieving users.' });
  }
});

// PUT /api/mwc/users/:id/role - Demote or promote accounts
router.put('/users/:id/role', async (req, res) => {
  const { role } = req.body;
  const userId = req.params.id;
  const allowedRoles = ['user', 'owner', 'mwc'];

  if (!role || !allowedRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid or missing role parameter.' });
  }

  try {
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (targetUser._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'You cannot demote or modify your own role.' });
    }

    const oldRole = targetUser.role;
    targetUser.role = role;
    await targetUser.save();

    await logAction(req.user.id, 'USER_ROLE_CHANGE', { targetUserId: userId, targetUsername: targetUser.name, newRole: role }, req.ip);

    return res.json({ message: `User role successfully updated to ${role}.` });
  } catch (error) {
    console.error('Error updating user role:', error);
    return res.status(500).json({ message: 'Error updating user role.' });
  }
});

// PUT /api/mwc/users/:id/status - Block or activate account access
router.put('/users/:id/status', async (req, res) => {
  const { status } = req.body;
  const userId = req.params.id;
  const allowedStatuses = ['active', 'disabled'];

  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid or missing status parameter.' });
  }

  try {
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (targetUser._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'You cannot disable your own account.' });
    }

    targetUser.status = status;
    await targetUser.save();

    await logAction(req.user.id, 'USER_STATUS_CHANGE', { targetUserId: userId, targetUsername: targetUser.name, newStatus: status }, req.ip);

    return res.json({ message: `User account successfully ${status === 'active' ? 'enabled' : 'disabled'}.` });
  } catch (error) {
    console.error('Error updating user status:', error);
    return res.status(500).json({ message: 'Error updating user status.' });
  }
});

// GET /api/mwc/audit-logs - Fetch the audit trails
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await AuditLog.find({})
      .populate('user_id', 'name email')
      .sort({ created_at: -1 })
      .limit(100);

    const mapped = logs.map(l => {
      const obj = l.toObject();
      return {
        ...obj,
        id: obj._id.toString(),
        operator_name: obj.user_id ? obj.user_id.name : 'System',
        operator_email: obj.user_id ? obj.user_id.email : ''
      };
    });
    return res.json(mapped);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return res.status(500).json({ message: 'Error retrieving audit logs.' });
  }
});

// GET /api/mwc/activity-logs - Fetch the audit trails specifically for MWC users
router.get('/activity-logs', async (req, res) => {
  try {
    // First, find all users with role 'mwc'
    const mwcUsers = await User.find({ role: 'mwc' }).select('_id');
    const mwcUserIds = mwcUsers.map(u => u._id);

    const logs = await AuditLog.find({ user_id: { $in: mwcUserIds } })
      .populate('user_id', 'name email')
      .sort({ created_at: -1 })
      .limit(100);

    const mapped = logs.map(l => {
      const obj = l.toObject();
      return {
        ...obj,
        id: obj._id.toString(),
        operator_name: obj.user_id ? obj.user_id.name : 'MWC Dev',
        operator_email: obj.user_id ? obj.user_id.email : ''
      };
    });
    return res.json(mapped);
  } catch (error) {
    console.error('Error fetching MWC activity logs:', error);
    return res.status(500).json({ message: 'Error retrieving MWC logs.' });
  }
});

// PUT /api/mwc/announcement - Manage site banner announcement and spotlight chocolate
router.put('/announcement', async (req, res) => {
  const { announcement_banner, spotlight_product_id } = req.body;

  try {
    if (announcement_banner !== undefined) {
      await Setting.findOneAndUpdate({ key: 'announcement_banner' }, { value: announcement_banner }, { upsert: true });
    }

    if (spotlight_product_id !== undefined) {
      await Product.updateMany({}, { is_spotlight: false });
      await Product.findByIdAndUpdate(spotlight_product_id, { is_spotlight: true });
    }

    await logAction(req.user.id, 'CMS_BANNER_SPOTLIGHT_UPDATE', { announcement_banner, spotlight_product_id }, req.ip);

    return res.json({ message: 'Announcement and spotlight preferences updated successfully.' });
  } catch (error) {
    console.error('Error updating site banner settings:', error);
    return res.status(500).json({ message: 'Error updating CMS settings.' });
  }
});

// GET /api/mwc/posters - Fetch all posters
router.get('/posters', async (req, res) => {
  try {
    const rows = await Poster.find({}).sort({ created_at: -1 });
    const mapped = rows.map(r => ({ ...r.toObject(), id: r._id.toString() }));
    return res.json(mapped);
  } catch (error) {
    console.error('Error fetching posters:', error);
    return res.status(500).json({ message: 'Error retrieving posters.' });
  }
});

// POST /api/mwc/posters - Add a poster
router.post('/posters', uploadSingleMiddleware('image'), async (req, res) => {
  const { title, link_url, start_date, end_date } = req.body;
  if (!title || !req.file) {
    return res.status(400).json({ message: 'Title and image are required.' });
  }

  try {
    const imageUrl = `/uploads/images/${req.file.filename}`;
    const poster = new Poster({
      title,
      image_url: imageUrl,
      link_url: link_url || null,
      start_date: start_date || null,
      end_date: end_date || null
    });
    await poster.save();

    await logAction(req.user.id, 'POSTER_CREATE', { id: poster._id.toString(), title }, req.ip);

    return res.status(201).json({ id: poster._id.toString(), title, image_url: imageUrl });
  } catch (error) {
    console.error('Error adding poster:', error);
    return res.status(500).json({ message: 'Error adding poster.' });
  }
});

// DELETE /api/mwc/posters/:id - Delete a poster
router.delete('/posters/:id', async (req, res) => {
  const posterId = req.params.id;
  try {
    const poster = await Poster.findById(posterId);
    if (!poster) return res.status(404).json({ message: 'Poster not found.' });

    const filePath = path.join(__dirname, '../public', poster.image_url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Poster.findByIdAndDelete(posterId);
    await logAction(req.user.id, 'POSTER_DELETE', { id: posterId, title: poster.title }, req.ip);

    return res.json({ message: 'Poster deleted successfully.' });
  } catch (error) {
    console.error('Error deleting poster:', error);
    return res.status(500).json({ message: 'Error deleting poster.' });
  }
});

// GET /api/mwc/reviews - Fetch reviews
router.get('/reviews', async (req, res) => {
  try {
    const rows = await Review.find({}).sort({ created_at: -1 });
    const mapped = rows.map(r => ({ ...r.toObject(), id: r._id.toString() }));
    return res.json(mapped);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return res.status(500).json({ message: 'Error retrieving reviews.' });
  }
});

// PUT /api/mwc/reviews/:id/status - Moderate reviews
router.put('/reviews/:id/status', async (req, res) => {
  const reviewId = req.params.id;
  const { status } = req.body;
  try {
    await Review.findByIdAndUpdate(reviewId, { status });
    await logAction(req.user.id, 'REVIEW_MODERATION', { id: reviewId, status }, req.ip);
    return res.json({ message: 'Review status updated successfully.' });
  } catch (error) {
    console.error('Error moderating review:', error);
    return res.status(500).json({ message: 'Error moderating review.' });
  }
});

// PUT /api/mwc/reviews/:id/reply - Reply to reviews
router.put('/reviews/:id/reply', async (req, res) => {
  const reviewId = req.params.id;
  const { reply } = req.body;
  try {
    await Review.findByIdAndUpdate(reviewId, { reply: reply || null });
    await logAction(req.user.id, 'REVIEW_REPLY', { id: reviewId }, req.ip);
    return res.json({ message: 'Reply added successfully.' });
  } catch (error) {
    console.error('Error replying to review:', error);
    return res.status(500).json({ message: 'Error replying to review.' });
  }
});

// DELETE /api/mwc/reviews/:id - Delete reviews
router.delete('/reviews/:id', async (req, res) => {
  const reviewId = req.params.id;
  try {
    await Review.findByIdAndDelete(reviewId);
    await logAction(req.user.id, 'REVIEW_DELETE', { id: reviewId }, req.ip);
    return res.json({ message: 'Review deleted successfully.' });
  } catch (error) {
    console.error('Error deleting review:', error);
    return res.status(500).json({ message: 'Error deleting review.' });
  }
});

// PUT /api/mwc/about - Update brand About content
router.put('/about', async (req, res) => {
  const { story, usps, quality_claims, images } = req.body;
  try {
    const value = JSON.stringify({ story, usps, quality_claims, images });
    await Setting.findOneAndUpdate({ key: 'about_us_content' }, { value }, { upsert: true });
    await logAction(req.user.id, 'ABOUT_CONTENT_UPDATE', {}, req.ip);
    return res.json({ message: 'About content updated successfully.' });
  } catch (error) {
    console.error('Error saving about details:', error);
    return res.status(500).json({ message: 'Error updating brand details.' });
  }
});

// GET /api/mwc/products - Fetch products
router.get('/products', async (req, res) => {
  try {
    const rows = await Product.find({}).sort({ created_at: -1 });
    const mapped = rows.map(r => ({ ...r.toObject(), id: r._id.toString() }));
    return res.json(mapped);
  } catch (error) {
    console.error('Error loading products for developer:', error);
    return res.status(500).json({ message: 'Error fetching catalog.' });
  }
});

// POST /api/mwc/products - Add product
router.post('/products', uploadFieldsMiddleware([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 },
  { name: 'video_thumbnail', maxCount: 1 }
]), async (req, res) => {
  const { name, slug, price, stock, category, description, is_new } = req.body;
  
  if (!name || !slug || !price || !stock || !category) {
    return res.status(400).json({ message: 'Required fields are missing.' });
  }

  try {
    let imageUrl = '';
    let videoUrl = '';
    let thumbnail = '';

    if (req.files) {
      if (req.files.image && req.files.image[0]) {
        const cUrl = await uploadToCloudinary(req.files.image[0].path, 'image');
        imageUrl = cUrl || `/uploads/images/${req.files.image[0].filename}`;
      }
      if (req.files.video && req.files.video[0]) {
        const cUrl = await uploadToCloudinary(req.files.video[0].path, 'video');
        videoUrl = cUrl || `/uploads/videos/${req.files.video[0].filename}`;
      }
      if (req.files.video_thumbnail && req.files.video_thumbnail[0]) {
        const cUrl = await uploadToCloudinary(req.files.video_thumbnail[0].path, 'image');
        thumbnail = cUrl || `/uploads/images/${req.files.video_thumbnail[0].filename}`;
      }
    }

    const imagesJson = imageUrl ? [imageUrl] : [];

    const product = new Product({
      name,
      slug,
      price: parseFloat(price),
      stock: parseInt(stock),
      category,
      description: description || '',
      images: imagesJson,
      video_url: videoUrl,
      video_thumbnail: thumbnail,
      is_new: is_new === 'true' || is_new === '1'
    });
    await product.save();

    await logAction(req.user.id, 'PRODUCT_CREATE', { id: product._id.toString(), name }, req.ip);

    return res.status(201).json({ id: product._id.toString(), message: 'Product added successfully.' });
  } catch (error) {
    console.error('Error adding product:', error);
    return res.status(500).json({ message: 'Error adding product.' });
  }
});

// PUT /api/mwc/products/:id - Edit product
router.put('/products/:id', uploadFieldsMiddleware([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 },
  { name: 'video_thumbnail', maxCount: 1 }
]), async (req, res) => {
  const productId = req.params.id;
  const { name, price, stock, category, description, is_new } = req.body;

  try {
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found.' });

    let imageUrl = product.images ? product.images[0] : '';
    let videoUrl = product.video_url || '';
    let thumbnail = product.video_thumbnail || '';

    if (req.files) {
      if (req.files.image && req.files.image[0]) {
        const cUrl = await uploadToCloudinary(req.files.image[0].path, 'image');
        imageUrl = cUrl || `/uploads/images/${req.files.image[0].filename}`;
      }
      if (req.files.video && req.files.video[0]) {
        const cUrl = await uploadToCloudinary(req.files.video[0].path, 'video');
        videoUrl = cUrl || `/uploads/videos/${req.files.video[0].filename}`;
      }
      if (req.files.video_thumbnail && req.files.video_thumbnail[0]) {
        const cUrl = await uploadToCloudinary(req.files.video_thumbnail[0].path, 'image');
        thumbnail = cUrl || `/uploads/images/${req.files.video_thumbnail[0].filename}`;
      }
    }

    const imagesJson = imageUrl ? [imageUrl] : [];

    product.name = name;
    product.price = parseFloat(price);
    product.stock = parseInt(stock);
    product.category = category;
    product.description = description || '';
    product.images = imagesJson;
    product.video_url = videoUrl;
    product.video_thumbnail = thumbnail;
    product.is_new = (is_new === 'true' || is_new === '1');
    
    await product.save();
    await logAction(req.user.id, 'PRODUCT_UPDATE', { id: productId, name }, req.ip);

    return res.json({ message: 'Product updated successfully.' });
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({ message: 'Error updating product.' });
  }
});

// DELETE /api/mwc/products/:id - Delete product
router.delete('/products/:id', async (req, res) => {
  const productId = req.params.id;
  try {
    const existing = await Product.findById(productId);
    if (!existing) return res.status(404).json({ message: 'Product not found.' });

    // Clean up local or Cloudinary media assets
    const cleanupMedia = async (url) => {
      if (!url) return;
      if (url.includes('res.cloudinary.com')) {
        await deleteFromCloudinary(url);
      } else {
        const filePath = path.join(__dirname, '../public', url);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (e) {
            console.error('Failed to delete local file:', e);
          }
        }
      }
    };

    if (existing.images && existing.images.length > 0) {
      for (const img of existing.images) {
        await cleanupMedia(img);
      }
    }
    await cleanupMedia(existing.video_url);
    await cleanupMedia(existing.video_thumbnail);

    await Product.findByIdAndDelete(productId);
    await logAction(req.user.id, 'PRODUCT_DELETE', { id: productId, name: existing.name }, req.ip);

    return res.json({ message: 'Product deleted successfully.' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ message: 'Error deleting product.' });
  }
});

// GET /api/mwc/translations/:lang - Read dynamic locale translation JSON bundle
router.get('/translations/:lang', async (req, res) => {
  const lang = req.params.lang;
  const filePath = path.resolve(__dirname, `../../frontend/src/locales/${lang}.json`);
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return res.json(JSON.parse(content));
    }
    return res.json({});
  } catch (error) {
    console.error('Error loading translation file:', error);
    return res.status(500).json({ message: 'Error loading locale translation file.' });
  }
});

// PUT /api/mwc/translations/:lang - Overwrite/save dynamic locale translation JSON bundle
router.put('/translations/:lang', async (req, res) => {
  const lang = req.params.lang;
  const filePath = path.resolve(__dirname, `../../frontend/src/locales/${lang}.json`);
  
  const localeDir = path.dirname(filePath);
  if (!fs.existsSync(localeDir)) {
    fs.mkdirSync(localeDir, { recursive: true });
  }

  try {
    const content = JSON.stringify(req.body, null, 2);
    fs.writeFileSync(filePath, content, 'utf8');
    await logAction(req.user.id, 'TRANSLATION_FILE_UPDATE', { lang }, req.ip);
    return res.json({ message: `Locale translation file for '${lang}' saved successfully.` });
  } catch (error) {
    console.error('Error saving translation file:', error);
    return res.status(500).json({ message: 'Error saving translation file.' });
  }
});

// GET /api/mwc/coupons - Fetch all promo codes
router.get('/coupons', async (req, res) => {
  try {
    const rows = await Coupon.find({}).sort({ created_at: -1 });
    const mapped = rows.map(r => ({ ...r.toObject(), id: r._id.toString() }));
    return res.json(mapped);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error fetching coupons.' });
  }
});

// POST /api/mwc/coupons - Create a promo code
router.post('/coupons', async (req, res) => {
  const { code, discount_amount, min_order_amount, expiry_date, status } = req.body;
  if (!code || !discount_amount) {
    return res.status(400).json({ message: 'Code and Discount amount are required.' });
  }
  try {
    const coupon = new Coupon({
      code: code.toUpperCase().trim(),
      discount_amount: parseFloat(discount_amount),
      min_order_amount: parseFloat(min_order_amount || 0),
      expiry_date: expiry_date || null,
      status: status || 'active'
    });
    await coupon.save();
    
    await logAction(req.user.id, 'COUPON_CREATE', { id: coupon._id.toString(), code }, req.ip);
    return res.status(201).json({ id: coupon._id.toString(), message: 'Coupon created successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error creating coupon.' });
  }
});

// PUT /api/mwc/coupons/:id - Update a promo code
router.put('/coupons/:id', async (req, res) => {
  const { code, discount_amount, min_order_amount, expiry_date, status } = req.body;
  try {
    await Coupon.findByIdAndUpdate(req.params.id, {
      code: code.toUpperCase().trim(),
      discount_amount: parseFloat(discount_amount),
      min_order_amount: parseFloat(min_order_amount || 0),
      expiry_date: expiry_date || null,
      status
    });

    await logAction(req.user.id, 'COUPON_UPDATE', { id: req.params.id, code }, req.ip);
    return res.json({ message: 'Coupon updated successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error updating coupon.' });
  }
});

// DELETE /api/mwc/coupons/:id - Delete a promo code
router.delete('/coupons/:id', async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    await logAction(req.user.id, 'COUPON_DELETE', { id: req.params.id }, req.ip);
    return res.json({ message: 'Coupon deleted successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error deleting coupon.' });
  }
});

// GET /api/mwc/locations - Fetch all locations
router.get('/locations', async (req, res) => {
  try {
    const rows = await Location.find({}).sort({ created_at: -1 });
    const mapped = rows.map(r => ({ ...r.toObject(), id: r._id.toString() }));
    return res.json(mapped);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error fetching locations.' });
  }
});

// POST /api/mwc/locations - Create a map location
router.post('/locations', async (req, res) => {
  const { name, address, latitude, longitude, phone, description, status } = req.body;
  if (!name || !address || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ message: 'Required fields missing.' });
  }
  try {
    const location = new Location({
      name,
      address,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      phone: phone || null,
      description: description || null,
      status: status || 'active'
    });
    await location.save();

    await logAction(req.user.id, 'LOCATION_CREATE', { id: location._id.toString(), name }, req.ip);
    return res.status(201).json({ id: location._id.toString(), message: 'Location created successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error creating location.' });
  }
});

// PUT /api/mwc/locations/:id - Update a map location
router.put('/locations/:id', async (req, res) => {
  const { name, address, latitude, longitude, phone, description, status } = req.body;
  try {
    await Location.findByIdAndUpdate(req.params.id, {
      name,
      address,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      phone: phone || null,
      description: description || null,
      status
    });

    await logAction(req.user.id, 'LOCATION_UPDATE', { id: req.params.id, name }, req.ip);
    return res.json({ message: 'Location updated successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error updating location.' });
  }
});

// DELETE /api/mwc/locations/:id - Delete a map location
router.delete('/locations/:id', async (req, res) => {
  try {
    await Location.findByIdAndDelete(req.params.id);
    await logAction(req.user.id, 'LOCATION_DELETE', { id: req.params.id }, req.ip);
    return res.json({ message: 'Location deleted successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error deleting location.' });
  }
});

// GET /api/mwc/orders - Get all orders (with optional status filter)
router.get('/orders', async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) {
    filter.status = status;
  }

  try {
    const orders = await Order.find(filter)
      .populate('user_id', 'name email')
      .sort({ created_at: -1 });

    const mapped = orders.map(o => {
      const obj = o.toObject();
      return {
        ...obj,
        id: obj._id.toString(),
        customer_name: obj.user_id ? obj.user_id.name : (obj.guest_info ? obj.guest_info.name : 'Guest'),
        customer_email: obj.user_id ? obj.user_id.email : (obj.guest_info ? obj.guest_info.email : '')
      };
    });
    return res.json(mapped);
  } catch (error) {
    console.error('Error getting mwc orders:', error);
    return res.status(500).json({ message: 'Error retrieving orders.' });
  }
});

// PUT /api/mwc/orders/:id/status - Update order status
router.put('/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['preparing', 'packed', 'out_for_delivery', 'delivered', 'cancelled'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid or missing order status.' });
  }

  try {
    const existingOrder = await Order.findById(req.params.id);
    if (!existingOrder) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const oldStatus = existingOrder.status;
    existingOrder.status = status;
    await existingOrder.save();

    await logAction(req.user.id, 'ORDER_STATUS_UPDATE', { orderId: req.params.id, from: oldStatus, to: status }, req.ip);

    return res.json({ message: 'Order status updated successfully.', orderId: req.params.id, status });
  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({ message: 'Error updating order.' });
  }
});

// PUT /api/mwc/orders/:id/confirm-payment - Manually approve payment
router.put('/orders/:id/confirm-payment', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    order.payment_status = 'paid';
    order.status = 'preparing';
    await order.save();

    await logAction(req.user.id, 'ORDER_PAYMENT_CONFIRM', { orderId: req.params.id }, req.ip);

    // Broadcast new order notification to connected owners (starts ringtone on frontend!)
    const broadcast = req.app.get('broadcastOwnerMessage');
    if (broadcast) {
      console.log(`[MWC Manual Approval] Broadcasting paid order alert for Order ID: ${req.params.id}`);
      
      // Map to compatibility layout
      const mappedOrder = {
        ...order.toObject(),
        id: order._id.toString(),
        customer_name: order.user_id ? 'Authenticated User' : (order.guest_info ? order.guest_info.name : 'Guest'),
        customer_email: order.user_id ? 'user@manis.com' : (order.guest_info ? order.guest_info.email : '')
      };

      broadcast({
        type: 'NEW_ORDER',
        order: mappedOrder
      });
    }

    return res.json({ message: 'Order payment manually confirmed and marked as preparing.', orderId: req.params.id });
  } catch (error) {
    console.error('Error confirming payment:', error);
    return res.status(500).json({ message: 'Error confirming payment.' });
  }
});

// PUT /api/mwc/orders/:id/reject-payment - Manually decline payment
router.put('/orders/:id/reject-payment', async (req, res) => {
  const { reason } = req.body;
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    order.payment_status = 'rejected';
    order.status = 'cancelled';
    order.rejection_reason = reason || 'Payment could not be verified.';
    await order.save();

    await logAction(req.user.id, 'ORDER_PAYMENT_REJECT', { orderId: req.params.id, reason }, req.ip);

    return res.json({ message: 'Order payment manually rejected and cancelled.', orderId: req.params.id });
  } catch (error) {
    console.error('Error rejecting payment:', error);
    return res.status(500).json({ message: 'Error rejecting payment.' });
  }
});

// GET /api/mwc/settings - Load private settings configs
router.get('/settings', async (req, res) => {
  try {
    const rows = await Setting.find({});
    const settings = {};
    rows.forEach(r => {
      if (r.key === 'delivery_zones') {
        settings[r.key] = JSON.parse(r.value);
      } else {
        settings[r.key] = r.value;
      }
    });

    return res.json(settings);
  } catch (error) {
    console.error('Error loading settings:', error);
    return res.status(500).json({ message: 'Error loading settings.' });
  }
});

// PUT /api/mwc/settings - Update custom settings
router.put('/settings', async (req, res) => {
  const { business_name, tagline, contact_email, contact_phone, contact_address, delivery_zones, alert_sound, brand_logo_url, instagram_username, payment_instructions, payment_qr_code } = req.body;

  try {
    const updates = {
      business_name,
      tagline,
      contact_email,
      contact_phone,
      contact_address,
      alert_sound,
      brand_logo_url,
      instagram_username,
      payment_instructions,
      payment_qr_code
    };

    if (delivery_zones) {
      updates.delivery_zones = Array.isArray(delivery_zones) ? JSON.stringify(delivery_zones) : delivery_zones;
    }

    for (const [key, val] of Object.entries(updates)) {
      if (val !== undefined) {
        await Setting.findOneAndUpdate({ key }, { value: val }, { upsert: true });
      }
    }

    await logAction(req.user.id, 'SETTINGS_UPDATE', updates, req.ip);

    return res.json({ message: 'Settings updated successfully.' });
  } catch (error) {
    console.error('Error updating settings:', error);
    return res.status(500).json({ message: 'Error updating settings.' });
  }
});

// POST /api/mwc/settings/logo - Upload brand logo file
router.post('/settings/logo', uploadSingleMiddleware('logo'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No logo image file uploaded.' });
  }

  try {
    const fileUrl = `/uploads/images/${req.file.filename}`;
    
    await Setting.findOneAndUpdate({ key: 'brand_logo_url' }, { value: fileUrl }, { upsert: true });
    await logAction(req.user.id, 'LOGO_UPLOAD', { fileUrl }, req.ip);

    return res.json({ 
      message: 'Custom brand logo uploaded and set successfully.',
      url: fileUrl 
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    return res.status(500).json({ message: 'Error uploading logo.' });
  }
});

// POST /api/mwc/settings/qr - Upload payment QR code file
router.post('/settings/qr', uploadSingleMiddleware('logo'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No QR code image file uploaded.' });
  }

  try {
    const fileUrl = `/uploads/images/${req.file.filename}`;
    
    await Setting.findOneAndUpdate({ key: 'payment_qr_code' }, { value: fileUrl }, { upsert: true });
    await logAction(req.user.id, 'QR_UPLOAD', { fileUrl }, req.ip);

    return res.json({ 
      message: 'Custom payment QR code uploaded and set successfully.',
      url: fileUrl 
    });
  } catch (error) {
    console.error('Error uploading QR code:', error);
    return res.status(500).json({ message: 'Error uploading QR code.' });
  }
});

export default router;
