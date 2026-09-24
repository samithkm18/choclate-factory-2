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
  is_bestseller: { type: Boolean, default: false },
  delivery_charge: { type: Number, default: 0 },
  expected_delivery_date: { type: String, default: '3-5 Business Days' },
  cancellation_deadline: { type: String, default: 'Within 24 hours of order placement' },
  cod_available: { type: Boolean, default: true },
});

// Performance Database Indexes
ProductSchema.index({ category: 1, price: 1 });
ProductSchema.index({ is_spotlight: 1 });
ProductSchema.index({ is_bestseller: 1 });
ProductSchema.index({ created_at: -1 });

export const Product = mongoose.model('Product', ProductSchema);
export default Product;
