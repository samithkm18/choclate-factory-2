import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  guest_info: {
    name: { type: String },
    email: { type: String },
    phone: { type: String }
  },
  items: [{
    productId: { type: Number },
    name: { type: String },
    price: { type: Number },
    quantity: { type: Number },
    variant: { type: String },
    customBoxItems: { type: [String], default: [] }
  }],
  total_amount: { type: Number, required: true },
  discount_code: { type: String },
  discount_amount: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'preparing', 'packed', 'out_for_delivery', 'delivered', 'cancelled'], default: 'pending' },
  delivery_date: { type: String },
  delivery_slot: { type: String },
  address: { type: String, required: true },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  payment_status: { type: String, enum: ['unpaid', 'pending_confirmation', 'paid', 'rejected'], default: 'unpaid' },
  payment_intent_id: { type: String },
  transaction_ref: { type: String },
  rejection_reason: { type: String },
  created_at: { type: Date, default: Date.now }
});

export const Order = mongoose.model('Order', OrderSchema);
export default Order;
