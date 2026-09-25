import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Setting from '../models/Setting.js';
import Poster from '../models/Poster.js';
import Review from '../models/Review.js';
import Coupon from '../models/Coupon.js';
import Location from '../models/Location.js';
import Job from '../models/Job.js';
import os from 'os';
import JobApplication from '../models/JobApplication.js';
import ContactSubmission from '../models/ContactSubmission.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { logAction } from '../utils/audit.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/storage.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Setup folder structure for uploads (uses /tmp on Vercel to avoid EROFS)
const uploadBase = process.env.VERCEL ? path.join(os.tmpdir(), 'uploads') : path.resolve(__dirname, '../public/uploads');
try {
  const folders = ['/images', '/videos', '/alerts'];
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
    } else if (file.mimetype.startsWith('audio/')) {
      subfolder = '/alerts';
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
    fileSize: 50 * 1024 * 1024 // 50MB maximum size (for videos)
  },
  fileFilter: (req, file, cb) => {
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    const allowedAudioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav'];

    if (file.fieldname === 'image' || file.fieldname === 'video_thumbnail' || file.fieldname === 'logo') {
      if (!allowedImageTypes.includes(file.mimetype)) {
        return cb(new Error('Invalid image file format. Supported: JPG, JPEG, PNG, WEBP, SVG'), false);
      }
    } else if (file.fieldname === 'video') {
      if (!allowedVideoTypes.includes(file.mimetype)) {
        return cb(new Error('Invalid video file format. Supported: MP4, WebM, MOV'), false);
      }
    } else if (file.fieldname === 'ringtone') {
      if (!allowedAudioTypes.includes(file.mimetype) && !file.originalname.endsWith('.mp3')) {
        return cb(new Error('Invalid audio file format. Supported: MP3, WAV'), false);
      }
    }
    cb(null, true);
  }
});

// Multer error handling wrapper middlewares
const uploadFieldsMiddleware = (fields) => {
  const uploadFields = upload.fields(fields);
  return (req, res, next) => {
    uploadFields(req, res, (err) => {
      if (err) {
        console.error('Multer fields upload error:', err);
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
        console.error('Multer single file upload error:', err);
        return res.status(400).json({ message: err.message || 'File upload error.' });
      }
      next();
    });
  };
};

// Compatibility helper to map mongoose models to frontend compatibility objects
const mapProduct = (item) => {
  if (!item) return null;
  const obj = item.toObject ? item.toObject() : item;
  return {
    ...obj,
    id: obj._id.toString(),
    dietary_tags: obj.dietary_tags || [],
    flavor_profile: obj.flavor_profile || {},
    fallback_ingredients: obj.fallback_ingredients || [],
    images: obj.images || [],
    allergens: obj.allergens || [],
    specifications: obj.specifications || {},
    nutrition: obj.nutrition || {}
  };
};

// Protect all /owner routes with authentication and role check ('owner')
router.use(authenticate);
router.use(authorizeRoles('owner'));

// GET /api/owner/overall-review - Aggregated real customer activity overview
router.get('/overall-review', async (req, res) => {
  try {
    const orders = await Order.find().sort({ created_at: -1 });
    const reviews = await Review.find().sort({ created_at: -1 });
    const jobApplications = await JobApplication.find().sort({ submitted_at: -1 });
    const productsCount = await Product.countDocuments();

    const mappedOrders = orders.map(o => {
      const obj = o.toObject ? o.toObject() : o;
      const custName = obj.customer_name || (obj.guest_info ? obj.guest_info.name : '') || 'Customer';
      const custEmail = obj.customer_email || (obj.guest_info ? obj.guest_info.email : '') || '';
      const custPhone = obj.customer_phone || (obj.guest_info ? obj.guest_info.phone : '') || '';
      return {
        ...obj,
        id: obj._id.toString(),
        customer_name: custName,
        customer_email: custEmail,
        customer_phone: custPhone,
        items: obj.items || []
      };
    });

    const totalRevenue = mappedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1) : '5.0';

    return res.json({
      summary: {
        totalOrders: mappedOrders.length,
        totalRevenue: Math.round(totalRevenue),
        totalReviews: reviews.length,
        avgRating: parseFloat(avgRating),
        totalApplications: jobApplications.length,
        activeProductsCount: productsCount
      },
      orders: mappedOrders,
      reviews,
      jobApplications
    });
  } catch (error) {
    console.error('Error loading overall review:', error);
    return res.status(500).json({ message: 'Internal server error loading overall review.' });
  }
});

// GET /api/owner/messages - Retrieve real customer contact messages (Owner only)
router.get('/messages', async (req, res) => {
  try {
    const messages = await ContactSubmission.find().sort({ created_at: -1 });
    return res.json(messages);
  } catch (error) {
    console.error('Error fetching customer messages:', error);
    return res.status(500).json({ message: 'Error retrieving messages.' });
  }
});

// PUT /api/owner/messages/:id/status - Update message status
router.put('/messages/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    const msg = await ContactSubmission.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    return res.json(msg);
  } catch (error) {
    console.error('Error updating message status:', error);
    return res.status(500).json({ message: 'Error updating message status.' });
  }
});

// GET /api/owner/analytics - Live sales data and summary metrics
router.get('/analytics', async (req, res) => {
  try {
    const revenueRes = await Order.aggregate([
      { $match: { payment_status: 'paid' } },
      { $group: { _id: null, rev: { $sum: '$total_amount' } } }
    ]);
    const totalRevenue = revenueRes[0] ? revenueRes[0].rev : 0;

    const totalOrders = await Order.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'user' });
    const stockAlertsCount = await Product.countDocuments({ stock: { $lt: 15 } });

    // Fetch low stock products details
    const lowStockProductsRaw = await Product.find({ stock: { $lt: 15 } }).sort({ stock: 1 });
    const lowStockProducts = lowStockProductsRaw.map(mapProduct);

    // Calculate repeat customer rate
    const distinctOrderedUsers = await Order.distinct('user_id', { user_id: { $ne: null } });
    const totalOrderedUsers = distinctOrderedUsers.length;

    const repeatUsersRes = await Order.aggregate([
      { $match: { user_id: { $ne: null } } },
      { $group: { _id: '$user_id', count: { $sum: 1 } } },
      { $match: { count: { $gte: 2 } } },
      { $count: 'count' }
    ]);
    const repeatUsers = repeatUsersRes[0] ? repeatUsersRes[0].count : 0;

    const repeatCustomerRate = totalOrderedUsers > 0 
      ? Math.round((repeatUsers / totalOrderedUsers) * 100) 
      : 0;

    // Sales over past 7 days
    const past7DaysOrders = await Order.find({
      payment_status: 'paid',
      created_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
    
    const trendMap = {};
    past7DaysOrders.forEach(o => {
      const dStr = o.created_at.toISOString().split('T')[0];
      if (!trendMap[dStr]) {
        trendMap[dStr] = { date: dStr, amount: 0, count: 0 };
      }
      trendMap[dStr].amount += o.total_amount;
      trendMap[dStr].count += 1;
    });
    const salesTrend = Object.values(trendMap).sort((a,b) => a.date.localeCompare(b.date));

    // Popular products breakdown
    const popularProductsRaw = await Product.find().sort({ stock: 1 }).limit(5);
    const popularProducts = popularProductsRaw.map(mapProduct);

    return res.json({
      totalRevenue,
      totalOrders,
      totalCustomers,
      stockAlertsCount,
      repeatCustomerRate,
      lowStockProducts,
      salesTrend,
      popularProducts
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return res.status(500).json({ message: 'Error retrieving analytics.' });
  }
});

// GET /api/owner/orders - Get all customer orders
router.get('/orders', async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) {
    filter.status = status;
  }

  try {
    const orders = await Order.find(filter)
      .populate('user_id', 'name email phone')
      .sort({ created_at: -1 });

    const mapped = orders.map(o => {
      const obj = o.toObject();
      const custName = obj.customer_name || (obj.guest_info ? obj.guest_info.name : '') || (obj.user_id ? obj.user_id.name : 'Valued Customer');
      const custEmail = obj.customer_email || (obj.guest_info ? obj.guest_info.email : '') || (obj.user_id ? obj.user_id.email : '');
      const custPhone = obj.customer_phone || (obj.guest_info ? obj.guest_info.phone : '') || (obj.user_id ? obj.user_id.phone : '');

      return {
        ...obj,
        id: obj._id.toString(),
        customer_name: custName,
        customer_email: custEmail,
        customer_phone: custPhone
      };
    });
    return res.json(mapped);
  } catch (error) {
    console.error('Error getting owner orders:', error);
    return res.status(500).json({ message: 'Error retrieving orders.' });
  }
});

// PUT /api/owner/orders/:id/status - Update order status (Owner/Admin only)
router.put('/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  const validStatuses = [
    'Packing', 'Out for Delivery', 'Delivered', 'Cancelled',
    'packing', 'out_for_delivery', 'delivered', 'cancelled', 'preparing', 'packed', 'pending'
  ];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid or missing order status.' });
  }

  // Standardize status label for DB storage
  let normalizedStatus = status;
  const sLower = status.toLowerCase();
  if (sLower.includes('deliver')) {
    normalizedStatus = 'Delivered';
  } else if (sLower.includes('out') || sLower.includes('transit')) {
    normalizedStatus = 'Out for Delivery';
  } else if (sLower.includes('cancel')) {
    normalizedStatus = 'Cancelled';
  } else {
    normalizedStatus = 'Packing';
  }

  try {
    const existingOrder = await Order.findById(req.params.id);
    if (!existingOrder) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const oldStatus = existingOrder.status;
    existingOrder.status = normalizedStatus;
    await existingOrder.save();

    // Broadcast status change to connected clients/owners
    const broadcast = req.app.get('broadcastOwnerMessage');
    if (broadcast) {
      broadcast({ type: 'ORDER_UPDATE', orderId: req.params.id, status: normalizedStatus });
    }

    await logAction(req.user.id, 'ORDER_STATUS_UPDATE', { orderId: req.params.id, from: oldStatus, to: normalizedStatus }, req.ip);

    return res.json({ message: 'Order status updated successfully.', orderId: req.params.id, status: normalizedStatus });
  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({ message: 'Error updating order.' });
  }
});

// PUT /api/owner/orders/:id/confirm-payment - Manually approve payment
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
      console.log(`[Manual Approval] Broadcasting paid order alert for Order ID: ${req.params.id}`);
      
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

// PUT /api/owner/orders/:id/reject-payment - Manually decline payment
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

// POST /api/owner/products - Add a new chocolate item
router.post('/products', uploadFieldsMiddleware([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 },
  { name: 'video_thumbnail', maxCount: 1 }
]), async (req, res) => {
  const { 
    name, slug, description, price, stock, category, dietary_tags, 
    flavor_profile, fallback_ingredients, video_url, video_thumbnail_url, image_url,
    cocoa_percentage, weight, origin, allergens, specifications, nutrition, is_new
  } = req.body;

  if (!name || !slug || !price || stock === undefined || !category) {
    return res.status(400).json({ message: 'Required fields are missing.' });
  }

  try {
    // Check slug uniqueness
    const exists = await Product.findOne({ slug });
    if (exists) {
      return res.status(400).json({ message: 'Product slug already exists. Please choose a unique URL name.' });
    }

    // Set paths from uploaded files or image_url
    let imagePath = '/assets/products/placeholder.jpg';
    if (image_url) {
      imagePath = image_url;
    } else if (req.files && req.files.image && req.files.image[0]) {
      const cUrl = await uploadToCloudinary(req.files.image[0].path, 'image');
      imagePath = cUrl || `/uploads/images/${req.files.image[0].filename}`;
    }

    let videoPath = video_url || '';
    if (req.files && req.files.video && req.files.video[0]) {
      const cUrl = await uploadToCloudinary(req.files.video[0].path, 'video');
      videoPath = cUrl || `/uploads/videos/${req.files.video[0].filename}`;
    }

    let thumbnailPath = video_thumbnail_url || '';
    if (req.files && req.files.video_thumbnail && req.files.video_thumbnail[0]) {
      const cUrl = await uploadToCloudinary(req.files.video_thumbnail[0].path, 'image');
      thumbnailPath = cUrl || `/uploads/images/${req.files.video_thumbnail[0].filename}`;
    }

    const imagesArr = [imagePath];
    const dTags = dietary_tags ? dietary_tags.split(',').map(t => t.trim()) : [];
    const fIngredients = fallback_ingredients ? fallback_ingredients.split(',').map(i => i.trim()) : [];
    
    let fProfile = { cocoa: cocoa_percentage ? parseInt(cocoa_percentage) : 50, sweetness: 3, notes: [] };
    if (flavor_profile) {
      fProfile = typeof flavor_profile === 'string' ? JSON.parse(flavor_profile) : flavor_profile;
    }

    const product = new Product({
      name,
      slug,
      description,
      price: parseFloat(price),
      stock: parseInt(stock),
      category,
      dietary_tags: dTags,
      flavor_profile: fProfile,
      video_url: videoPath,
      video_thumbnail: thumbnailPath,
      fallback_ingredients: fIngredients,
      images: imagesArr,
      cocoa_percentage: cocoa_percentage ? parseInt(cocoa_percentage) : null,
      weight: weight || null,
      origin: origin || null,
      allergens: allergens ? allergens.split(',').map(a => a.trim()) : [],
      specifications: specifications ? (typeof specifications === 'string' ? JSON.parse(specifications) : specifications) : {},
      nutrition: nutrition ? (typeof nutrition === 'string' ? JSON.parse(nutrition) : nutrition) : {},
      is_new: is_new !== undefined ? (is_new === 'true' || is_new === 1 || is_new === '1') : false
    });
    await product.save();

    await logAction(req.user.id, 'PRODUCT_CREATE', { productId: product._id.toString(), name }, req.ip);

    return res.status(201).json({ message: 'Product created successfully.', productId: product._id.toString() });
  } catch (error) {
    console.error('Error adding product:', error);
    return res.status(500).json({ message: 'Internal server error adding product.' });
  }
});

// PUT /api/owner/products/:id - Update product details and media
router.put('/products/:id', uploadFieldsMiddleware([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 },
  { name: 'video_thumbnail', maxCount: 1 }
]), async (req, res) => {
  const { 
    name, description, price, stock, category, dietary_tags, 
    flavor_profile, fallback_ingredients, video_url, video_thumbnail_url, image_url,
    cocoa_percentage, weight, origin, allergens, specifications, nutrition, is_new
  } = req.body;
  const productId = req.params.id;

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Determine values to update
    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    if (price) product.price = parseFloat(price);
    if (stock !== undefined) product.stock = parseInt(stock);
    if (category) product.category = category;

    if (dietary_tags !== undefined) {
      product.dietary_tags = dietary_tags.split(',').map(t => t.trim());
    }
    if (fallback_ingredients !== undefined) {
      product.fallback_ingredients = fallback_ingredients.split(',').map(i => i.trim());
    }
    
    if (flavor_profile !== undefined) {
      product.flavor_profile = typeof flavor_profile === 'string' ? JSON.parse(flavor_profile) : flavor_profile;
    } else if (cocoa_percentage !== undefined) {
      product.flavor_profile.cocoa = parseInt(cocoa_percentage);
    }

    if (req.files && req.files.image && req.files.image[0]) {
      const cUrl = await uploadToCloudinary(req.files.image[0].path, 'image');
      product.images = [cUrl || `/uploads/images/${req.files.image[0].filename}`];
    } else if (image_url) {
      product.images = [image_url];
    }

    if (req.files && req.files.video && req.files.video[0]) {
      const cUrl = await uploadToCloudinary(req.files.video[0].path, 'video');
      product.video_url = cUrl || `/uploads/videos/${req.files.video[0].filename}`;
    } else if (video_url !== undefined) {
      product.video_url = video_url;
    }

    if (req.files && req.files.video_thumbnail && req.files.video_thumbnail[0]) {
      const cUrl = await uploadToCloudinary(req.files.video_thumbnail[0].path, 'image');
      product.video_thumbnail = cUrl || `/uploads/images/${req.files.video_thumbnail[0].filename}`;
    } else if (video_thumbnail_url !== undefined) {
      product.video_thumbnail = video_thumbnail_url;
    }

    if (cocoa_percentage !== undefined) product.cocoa_percentage = parseInt(cocoa_percentage);
    if (weight !== undefined) product.weight = weight;
    if (origin !== undefined) product.origin = origin;
    
    if (allergens !== undefined) {
      product.allergens = allergens.split(',').map(a => a.trim());
    }
      
    if (specifications !== undefined) {
      product.specifications = typeof specifications === 'string' ? JSON.parse(specifications) : specifications;
    }
      
    if (nutrition !== undefined) {
      product.nutrition = typeof nutrition === 'string' ? JSON.parse(nutrition) : nutrition;
    }

    if (is_new !== undefined) {
      product.is_new = (is_new === 'true' || is_new === 1 || is_new === '1');
    }

    await product.save();
    await logAction(req.user.id, 'PRODUCT_UPDATE', { productId, updatedName: product.name }, req.ip);

    return res.json({ message: 'Product updated successfully.' });
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({ message: 'Internal server error updating product.' });
  }
});

// DELETE /api/owner/products/:id - Delete chocolate from inventory
router.delete('/products/:id', async (req, res) => {
  const productId = req.params.id;

  try {
    const existing = await Product.findById(productId);
    if (!existing) {
      return res.status(404).json({ message: 'Product not found.' });
    }

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
            console.error('Failed to unlink local file:', e);
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
    await logAction(req.user.id, 'PRODUCT_DELETE', { productId, name: existing.name }, req.ip);

    return res.json({ message: 'Product deleted successfully.' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ message: 'Error deleting product.' });
  }
});

// GET /api/owner/settings - Load private settings configs
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

// PUT /api/owner/settings - Update dashboard custom settings
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

// POST /api/owner/settings/logo - Upload brand logo file
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

// POST /api/owner/settings/qr - Upload payment QR code file
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

// POST /api/owner/settings/ringtone - Upload custom order ringtone file
router.post('/settings/ringtone', uploadSingleMiddleware('ringtone'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No audio file uploaded.' });
  }

  try {
    const fileUrl = `/uploads/alerts/${req.file.filename}`;
    
    await Setting.findOneAndUpdate({ key: 'custom_ringtone_url' }, { value: fileUrl }, { upsert: true });
    await Setting.findOneAndUpdate({ key: 'alert_sound' }, { value: 'custom' }, { upsert: true });
    
    await logAction(req.user.id, 'RINGTONE_UPLOAD', { fileUrl }, req.ip);

    return res.json({ 
      message: 'Custom alert sound uploaded and set successfully.',
      url: fileUrl 
    });
  } catch (error) {
    console.error('Error uploading ringtone:', error);
    return res.status(500).json({ message: 'Error uploading ringtone.' });
  }
});

// GET /api/owner/posters - Fetch all posters
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

// POST /api/owner/posters - Add a poster
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

    return res.status(201).json({ 
      id: poster._id.toString(), 
      title, 
      image_url: imageUrl, 
      link_url: link_url || null, 
      start_date: start_date || null, 
      end_date: end_date || null 
    });
  } catch (error) {
    console.error('Error adding poster:', error);
    return res.status(500).json({ message: 'Error adding poster.' });
  }
});

// DELETE /api/owner/posters/:id - Delete a poster
router.delete('/posters/:id', async (req, res) => {
  const posterId = req.params.id;
  try {
    const poster = await Poster.findById(posterId);
    if (!poster) {
      return res.status(404).json({ message: 'Poster not found.' });
    }

    // Delete physical file if exists
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

// GET /api/owner/reviews - Fetch all reviews for moderation queue
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

// PUT /api/owner/reviews/:id/status - Approve or reject a customer review
router.put('/reviews/:id/status', async (req, res) => {
  const reviewId = req.params.id;
  const { status } = req.body;

  if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ message: 'Invalid or missing status parameter.' });
  }

  try {
    await Review.findByIdAndUpdate(reviewId, { status });
    await logAction(req.user.id, 'REVIEW_MODERATION', { id: reviewId, status }, req.ip);

    return res.json({ message: `Review status updated to ${status}.` });
  } catch (error) {
    console.error('Error moderating review:', error);
    return res.status(500).json({ message: 'Error updating review status.' });
  }
});

// PUT /api/owner/reviews/:id/reply - Reply to a customer review
router.put('/reviews/:id/reply', async (req, res) => {
  const reviewId = req.params.id;
  const { reply } = req.body;

  try {
    await Review.findByIdAndUpdate(reviewId, { reply: reply || null });
    await logAction(req.user.id, 'REVIEW_REPLY', { id: reviewId, reply }, req.ip);

    return res.json({ message: 'Owner reply added successfully.' });
  } catch (error) {
    console.error('Error replying to review:', error);
    return res.status(500).json({ message: 'Error saving owner reply.' });
  }
});

// DELETE /api/owner/reviews/:id - Delete a customer review
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

// GET /api/owner/coupons - Fetch all promo codes
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

// POST /api/owner/coupons - Create a promo code
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

// PUT /api/owner/coupons/:id - Update a promo code
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

// DELETE /api/owner/coupons/:id - Delete a promo code
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

// GET /api/owner/locations - Fetch all locations
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

// POST /api/owner/locations - Create a map location
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

// PUT /api/owner/locations/:id - Update a map location
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

// DELETE /api/owner/locations/:id - Delete a map location
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

// PUT /api/owner/products/:id - Update product details (price, stock, bestseller, delivery charge, dates)
router.put('/products/:id', authenticate, authorizeRoles('owner'), async (req, res) => {
  const { price, stock, is_bestseller, delivery_charge, expected_delivery_date, cancellation_deadline, cod_available } = req.body;
  try {
    const updateData = {};
    if (price !== undefined) updateData.price = parseFloat(price);
    if (stock !== undefined) updateData.stock = parseInt(stock);
    if (is_bestseller !== undefined) updateData.is_bestseller = Boolean(is_bestseller);
    if (delivery_charge !== undefined) updateData.delivery_charge = parseFloat(delivery_charge);
    if (expected_delivery_date !== undefined) updateData.expected_delivery_date = expected_delivery_date;
    if (cancellation_deadline !== undefined) updateData.cancellation_deadline = cancellation_deadline;
    if (cod_available !== undefined) updateData.cod_available = Boolean(cod_available);

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    await logAction(req.user.id, 'PRODUCT_UPDATE', { id: req.params.id, updateData }, req.ip);
    return res.json({ message: 'Product updated successfully.', product });
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({ message: 'Error updating product.' });
  }
});

// JOB MANAGEMENT ROUTES (OWNER)

// GET /api/owner/jobs - Get all jobs (published & unpublished)
router.get('/jobs', authenticate, authorizeRoles('owner'), async (req, res) => {
  try {
    const jobs = await Job.find({}).sort({ posted_date: -1 });
    const mapped = jobs.map(j => {
      const obj = j.toObject();
      return { ...obj, id: obj._id.toString() };
    });
    return res.json(mapped);
  } catch (error) {
    console.error('Error fetching jobs for owner:', error);
    return res.status(500).json({ message: 'Error retrieving jobs.' });
  }
});

// POST /api/owner/jobs - Create a new job opening
router.post('/jobs', authenticate, authorizeRoles('owner'), async (req, res) => {
  const { title, department, description, responsibilities, required_skills, qualifications, experience, location, employment_type, application_deadline, is_published } = req.body;
  if (!title || !department || !description) {
    return res.status(400).json({ message: 'Title, department, and description are required.' });
  }
  try {
    const job = new Job({
      title,
      department,
      description,
      responsibilities: responsibilities || '',
      required_skills: required_skills || '',
      qualifications: qualifications || '',
      experience: experience || '',
      location: location || 'Mysuru, Karnataka',
      employment_type: employment_type || 'Full-Time',
      application_deadline: application_deadline || 'Open until filled',
      is_published: is_published !== undefined ? Boolean(is_published) : true
    });
    await job.save();
    await logAction(req.user.id, 'JOB_CREATE', { id: job._id.toString(), title }, req.ip);
    return res.status(201).json({ id: job._id.toString(), message: 'Job opening created successfully.' });
  } catch (error) {
    console.error('Error creating job:', error);
    return res.status(500).json({ message: 'Error creating job opening.' });
  }
});

// PUT /api/owner/jobs/:id - Update job opening
router.put('/jobs/:id', authenticate, authorizeRoles('owner'), async (req, res) => {
  const { title, department, description, responsibilities, required_skills, qualifications, experience, location, employment_type, application_deadline, is_published } = req.body;
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, {
      title,
      department,
      description,
      responsibilities,
      required_skills,
      qualifications,
      experience,
      location,
      employment_type,
      application_deadline,
      is_published
    }, { new: true });

    if (!job) {
      return res.status(404).json({ message: 'Job opening not found.' });
    }
    await logAction(req.user.id, 'JOB_UPDATE', { id: req.params.id, title }, req.ip);
    return res.json({ message: 'Job updated successfully.', job });
  } catch (error) {
    console.error('Error updating job:', error);
    return res.status(500).json({ message: 'Error updating job.' });
  }
});

// PATCH /api/owner/jobs/:id/publish - Toggle publish/unpublish job
router.patch('/jobs/:id/publish', authenticate, authorizeRoles('owner'), async (req, res) => {
  const { is_published } = req.body;
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, { is_published: Boolean(is_published) }, { new: true });
    if (!job) {
      return res.status(404).json({ message: 'Job opening not found.' });
    }
    await logAction(req.user.id, 'JOB_TOGGLE_PUBLISH', { id: req.params.id, is_published }, req.ip);
    return res.json({ message: `Job ${is_published ? 'published' : 'unpublished'} successfully.` });
  } catch (error) {
    console.error('Error toggling job publish status:', error);
    return res.status(500).json({ message: 'Error updating publish status.' });
  }
});

// DELETE /api/owner/jobs/:id - Delete job opening
router.delete('/jobs/:id', authenticate, authorizeRoles('owner'), async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    await JobApplication.deleteMany({ job_id: req.params.id });
    await logAction(req.user.id, 'JOB_DELETE', { id: req.params.id }, req.ip);
    return res.json({ message: 'Job opening deleted successfully.' });
  } catch (error) {
    console.error('Error deleting job:', error);
    return res.status(500).json({ message: 'Error deleting job opening.' });
  }
});

// GET /api/owner/jobs/:id/applications - Get applications for a specific job
router.get('/jobs/:id/applications', authenticate, authorizeRoles('owner'), async (req, res) => {
  try {
    const apps = await JobApplication.find({ job_id: req.params.id }).sort({ submitted_at: -1 });
    const mapped = apps.map(a => {
      const obj = a.toObject();
      return { ...obj, id: obj._id.toString() };
    });
    return res.json(mapped);
  } catch (error) {
    console.error('Error fetching job applications:', error);
    return res.status(500).json({ message: 'Error retrieving applications.' });
  }
});

export default router;
