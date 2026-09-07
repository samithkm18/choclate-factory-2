import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  category: { type: String, required: true },
  dietary_tags: { type: [String], default: [] },
  flavor_profile: {
    cocoa: { type: Number },
    sweetness: { type: Number },
    notes: { type: [String], default: [] }
  },
  video_url: { type: String },
  video_thumbnail: { type: String },
  fallback_ingredients: { type: [String], default: [] },
  images: { type: [String], default: [] },
  is_spotlight: { type: Boolean, default: false },
  cocoa_percentage: { type: Number },
  weight: { type: String },
  origin: { type: String },
  allergens: { type: [String], default: [] },
  specifications: {
    packaging: { type: String },
    shelf_life: { type: String },
    storage: { type: String }
  },
  nutrition: {
    calories: { type: String },
    fat: { type: String },
    sugar: { type: String },
    protein: { type: String }
  },
  is_new: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

export const Product = mongoose.model('Product', ProductSchema);
export default Product;
