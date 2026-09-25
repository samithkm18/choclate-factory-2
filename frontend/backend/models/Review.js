import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  order_id: { type: String },
  product_id: { type: Number },
  customer_name: { type: String, required: true },
  rating: { type: Number, required: true },
  text: { type: String, required: true },
  image_url: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  flagged: { type: Number, default: 0 }, // 0 or 1
  reply: { type: String },
  created_at: { type: Date, default: Date.now }
});

export const Review = mongoose.model('Review', ReviewSchema);
export default Review;
