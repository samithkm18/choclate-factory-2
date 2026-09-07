import express from 'express';
import Product from '../models/Product.js';
import Wishlist from '../models/Wishlist.js';
import Setting from '../models/Setting.js';
import Poster from '../models/Poster.js';
import Review from '../models/Review.js';
import Location from '../models/Location.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Helper to map mongoose documents to compatibility format (mapping _id to id)
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

// GET /api/products - Get all chocolates (with filters, search, and ordering)
router.get('/', async (req, res) => {
  const { category, search, tags, minPrice, maxPrice } = req.query;
  
  const queryObj = {};

  if (category) {
    queryObj.category = category;
  }

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    queryObj.$or = [
      { name: searchRegex },
      { description: searchRegex },
      { category: searchRegex }
    ];
  }

  if (minPrice || maxPrice) {
    queryObj.price = {};
    if (minPrice) queryObj.price.$gte = parseFloat(minPrice);
    if (maxPrice) queryObj.price.$lte = parseFloat(maxPrice);
  }

  try {
    let products = await Product.find(queryObj);
    let rows = products.map(mapProduct);

    // Filter by tags in JS (case-insensitive check)
    if (tags) {
      const tagList = tags.split(',').map(t => t.trim().toLowerCase());
      rows = rows.filter(item => 
        tagList.every(t => item.dietary_tags.map(dt => dt.toLowerCase()).includes(t))
      );
    }

    return res.json(rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ message: 'Error retrieving products.' });
  }
});

// GET /api/products/spotlight - Get the featured chocolate spotlight for the homepage hero
router.get('/spotlight', async (req, res) => {
  try {
    let product = await Product.findOne({ is_spotlight: true });
    
    // If no spotlight set, grab the first product
    if (!product) {
      product = await Product.findOne({});
    }

    if (!product) {
      return res.status(404).json({ message: 'No products found.' });
    }

    return res.json(mapProduct(product));
  } catch (error) {
    console.error('Error fetching spotlight product:', error);
    return res.status(500).json({ message: 'Error retrieving spotlight product.' });
  }
});

// GET /api/products/:slug - Get a single product by slug
router.get('/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    return res.json(mapProduct(product));
  } catch (error) {
    console.error('Error fetching product detail:', error);
    return res.status(500).json({ message: 'Error retrieving product.' });
  }
});

// POST /api/products/:id/wishlist - Add a product to the user's wishlist
router.post('/:id/wishlist', authenticate, async (req, res) => {
  const userId = req.user.id;
  const productId = req.params.id;

  try {
    // Validate ObjectIds
    const exists = await Wishlist.findOne({ user_id: userId, product_id: productId });
    if (exists) {
      return res.json({ message: 'Product already in wishlist.' });
    }

    const newItem = new Wishlist({ user_id: userId, product_id: productId });
    await newItem.save();
    return res.status(201).json({ message: 'Product added to wishlist.' });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return res.status(500).json({ message: 'Could not add product to wishlist.' });
  }
});

// DELETE /api/products/:id/wishlist - Remove a product from the user's wishlist
router.delete('/:id/wishlist', authenticate, async (req, res) => {
  const userId = req.user.id;
  const productId = req.params.id;

  try {
    await Wishlist.deleteOne({ user_id: userId, product_id: productId });
    return res.json({ message: 'Product removed from wishlist.' });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return res.status(500).json({ message: 'Could not remove product from wishlist.' });
  }
});

// GET /api/products/wishlist/me - Get current user's wishlist
router.get('/wishlist/me', authenticate, async (req, res) => {
  const userId = req.user.id;
  try {
    const wishlistItems = await Wishlist.find({ user_id: userId }).populate('product_id');
    const rows = wishlistItems
      .filter(item => item.product_id)
      .map(item => mapProduct(item.product_id));

    return res.json(rows);
  } catch (error) {
    console.error('Error fetching user wishlist:', error);
    return res.status(500).json({ message: 'Could not fetch wishlist.' });
  }
});

// GET /api/products/about - Get About Us content
router.get('/about/content', async (req, res) => {
  try {
    const row = await Setting.findOne({ key: 'about_us_content' });
    if (row) {
      return res.json(JSON.parse(row.value));
    }
    // Return high-end default About Us data
    const defaultAbout = {
      story: "Crafted in the heart of Orinoco volcanic deltas, Mani's Chocolate represents the absolute pinnacle of artisanal confectionery. Established in 1985, our commitment is simple: no compromises, no shortcuts, and no mediocrity. Every single batch is stone-ground, conched to 12 microns, and hand-wrapped with 24k gold leaf details.",
      usps: [
        { title: "Criollo Reserve", description: "Single-origin wild cacao sourced ethically from Orinoco delta organic micro-farms." },
        { title: "Granite Conching", description: "Granite stone conched for 72 continuous hours to achieve a micro-refined 12-micron velvet texture." },
        { title: "Sommelier Pairings", description: "Expertly graded flavor notes tested to sync perfectly with premium spirits and coffees." }
      ],
      quality_claims: "Organic Certified, Fair Trade Sourced, Edible 24k Gold Dressed, and completely allergen checked.",
      images: []
    };
    return res.json(defaultAbout);
  } catch (error) {
    console.error('Error fetching about us details:', error);
    return res.status(500).json({ message: 'Error retrieving brand details.' });
  }
});

// GET /api/products/posters/active - Get current active announcement posters
router.get('/posters/active', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    // Fetch posters that are within schedule or have no dates set
    const rows = await Poster.find({
      $and: [
        { $or: [{ start_date: null }, { start_date: '' }, { start_date: { $lte: today } }] },
        { $or: [{ end_date: null }, { end_date: '' }, { end_date: { $gte: today } }] }
      ]
    }).sort({ created_at: -1 });

    const mapped = rows.map(r => ({ ...r.toObject(), id: r._id.toString() }));
    return res.json(mapped);
  } catch (error) {
    console.error('Error fetching active posters:', error);
    return res.status(500).json({ message: 'Error retrieving active posters.' });
  }
});

// GET /api/products/reviews/approved - Get approved customer reviews
router.get('/reviews/approved', async (req, res) => {
  try {
    const rows = await Review.find({ status: 'approved' }).sort({ created_at: -1 });
    const mapped = rows.map(r => ({ ...r.toObject(), id: r._id.toString() }));
    return res.json(mapped);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return res.status(500).json({ message: 'Error retrieving customer feedback.' });
  }
});

// POST /api/products/reviews - Submit customer review (moderation queue)
router.post('/reviews', async (req, res) => {
  const { order_id, product_id, customer_name, rating, text, image_url } = req.body;

  if (!customer_name || !rating || !text) {
    return res.status(400).json({ message: 'Missing required review fields.' });
  }

  try {
    const newReview = new Review({
      order_id: order_id || null,
      product_id: product_id || null,
      customer_name,
      rating: parseInt(rating),
      text,
      image_url: image_url || null,
      status: 'pending'
    });
    await newReview.save();
    
    return res.status(201).json({ message: 'Review submitted. Awaiting moderation.' });
  } catch (error) {
    console.error('Error saving review:', error);
    return res.status(500).json({ message: 'Could not post customer feedback.' });
  }
});

// POST /api/products/reviews/:id/flag - Flag/report a customer review
router.post('/reviews/:id/flag', async (req, res) => {
  try {
    await Review.findByIdAndUpdate(req.params.id, { flagged: 1 });
    return res.json({ message: 'Review successfully reported.' });
  } catch (error) {
    console.error('Error flagging review:', error);
    return res.status(500).json({ message: 'Error processing review report.' });
  }
});

// GET /api/products/locations - Get all active map locations
router.get('/locations', async (req, res) => {
  try {
    const rows = await Location.find({ status: 'active' }).sort({ name: 1 });
    const mapped = rows.map(l => ({ ...l.toObject(), id: l._id.toString() }));
    return res.json(mapped);
  } catch (error) {
    console.error('Error fetching public locations:', error);
    return res.status(500).json({ message: 'Error retrieving store locations.' });
  }
});

export default router;
