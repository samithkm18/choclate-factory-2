import mongoose from 'mongoose';

const WishlistSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  created_at: { type: Date, default: Date.now }
});

WishlistSchema.index({ user_id: 1, product_id: 1 }, { unique: true });

export const Wishlist = mongoose.model('Wishlist', WishlistSchema);
export default Wishlist;
