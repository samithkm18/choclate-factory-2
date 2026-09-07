import mongoose from 'mongoose';

const CouponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  discount_amount: { type: Number, required: true },
  min_order_amount: { type: Number, default: 0 },
  expiry_date: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  created_at: { type: Date, default: Date.now }
});

export const Coupon = mongoose.model('Coupon', CouponSchema);
export default Coupon;
