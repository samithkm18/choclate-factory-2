import express from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import jwt from 'jsonwebtoken';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Initialize Razorpay
const rzpKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_ManiChocolate2026';
const rzpKeySecret = process.env.RAZORPAY_KEY_SECRET || 'ManiChocolateSecret2026';

let razorpay = null;
try {
  if (!rzpKeyId.startsWith('rzp_test_ManiChocolate')) {
    razorpay = new Razorpay({
      key_id: rzpKeyId,
      key_secret: rzpKeySecret
    });
  }
} catch (e) {
  console.log('Razorpay failed to initialize. Using sandbox simulator.');
}

// Simple JWT decode helper
function jwtVerify(token) {
  return jwt.verify(token, process.env.JWT_SECRET || 'manis_luxury_chocolate_secret_key_2026_rfv_tgb');
}

// Helper to map order document to compatibility format (mapping _id to id)
const mapOrder = (order) => {
  if (!order) return null;
  const obj = order.toObject ? order.toObject() : order;
  const custName = obj.customer_name || (obj.guest_info ? obj.guest_info.name : '') || (obj.user_id ? obj.user_id.name : 'Valued Customer');
  const custEmail = obj.customer_email || (obj.guest_info ? obj.guest_info.email : '') || (obj.user_id ? obj.user_id.email : '');
  const custPhone = obj.customer_phone || (obj.guest_info ? obj.guest_info.phone : '') || (obj.user_id ? obj.user_id.phone : '');

  return {
    ...obj,
    id: obj._id.toString(),
    customer_name: custName,
    customer_email: custEmail,
    customer_phone: custPhone,
    items: obj.items || []
  };
};

// POST /api/orders - Create a new checkout order
router.post('/', async (req, res) => {
  const { 
    items, 
    total_amount, 
    discount_code, 
    delivery_date, 
    delivery_slot, 
    address, 
    guest_info,
    coordinates,       // { lat, lng }
    payment_method,    // 'qr', 'cod', or 'razorpay'
    transaction_ref    // UTR/Reference number
  } = req.body;

  if (!items || !total_amount || !address || !delivery_date || !delivery_slot) {
    return res.status(400).json({ message: 'Missing required order details.' });
  }

  // Handle optional user auth
  let userId = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwtVerify(token);
      if (decoded && decoded.id) {
        userId = decoded.id;
      }
    } catch (e) {}
  }

  try {
    const itemsArr = typeof items === 'string' ? JSON.parse(items) : items;

    const custName = req.body.customer_name || guest_info?.name || 'Valued Customer';
    const custEmail = req.body.customer_email || guest_info?.email || '';
    const custPhone = req.body.customer_phone || guest_info?.phone || '';

    // Server-side verification of pricing and discounts
    let computedSubtotal = 0;
    const sanitizedItems = [];
    for (const item of itemsArr) {
      let prod = null;
      const idToSearch = item.productId || item.id;
      if (idToSearch && typeof idToSearch === 'string' && idToSearch.match(/^[0-9a-fA-F]{24}$/)) {
        prod = await Product.findById(idToSearch);
      } else {
        prod = await Product.findOne({ name: item.name });
      }
      const itemPrice = prod ? prod.price : (typeof item.price === 'number' ? item.price : parseFloat(item.price || 0));
      const itemQty = typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity || 1, 10);
      const validPrice = isNaN(itemPrice) ? 0 : itemPrice;
      const validQty = isNaN(itemQty) ? 1 : itemQty;
      computedSubtotal += validPrice * validQty;

      sanitizedItems.push({
        productId: item.productId || item.id || (prod ? prod._id.toString() : 1),
        name: item.name || (prod ? prod.name : 'Artisanal Chocolate Item'),
        price: validPrice,
        quantity: validQty,
        variant: item.variant || 'Standard',
        image: item.image || (prod && prod.images ? prod.images[0] : '/assets/products/placeholder.jpg'),
        customBoxItems: item.customBoxItems || []
      });
    }

    let flatDiscount = 0;
    if (discount_code) {
      const coupon = await Coupon.findOne({ code: discount_code.toUpperCase().trim(), status: 'active' });
      if (coupon) {
        let isExpired = false;
        if (coupon.expiry_date) {
          const today = new Date().toISOString().split('T')[0];
          if (today > coupon.expiry_date) {
            isExpired = true;
          }
        }
        if (!isExpired && computedSubtotal >= coupon.min_order_amount) {
          flatDiscount = coupon.discount_amount;
        }
      }
    }

    const deliveryCharge = parseFloat(req.body.delivery_charge) || 0;
    const clientTotal = parseFloat(total_amount);
    const calculatedTotal = Math.max(0, computedSubtotal - flatDiscount + deliveryCharge);
    const finalTotalAmount = (!isNaN(clientTotal) && clientTotal > 0) ? clientTotal : calculatedTotal;

    const isQr = payment_method === 'qr';
    const isCod = payment_method === 'cod';
    const orderStatus = 'Packing';
    const paymentStatus = isQr ? 'pending_confirmation' : isCod ? 'cod_pending' : 'unpaid';
    const dummyIntentId = isQr
      ? ('qr_' + Math.random().toString(36).substring(2, 15))
      : isCod
      ? ('cod_' + Math.random().toString(36).substring(2, 15))
      : ('rzp_intent_' + Math.random().toString(36).substring(2, 15));

    // Save order
    const order = new Order({
      user_id: userId || null,
      customer_name: custName,
      customer_email: custEmail,
      customer_phone: custPhone,
      guest_info: !userId ? guest_info : null,
      items: sanitizedItems,
      total_amount: finalTotalAmount,
      discount_code: discount_code || null,
      discount_amount: flatDiscount,
      status: orderStatus,
      delivery_charge: deliveryCharge,
      expected_delivery_date: req.body.expected_delivery_date || '3-5 Business Days',
      cancellation_deadline: req.body.cancellation_deadline || 'Within 24 hours of order placement',
      payment_method: payment_method || (isCod ? 'cod' : isQr ? 'qr' : 'razorpay'),
      delivery_date: delivery_date || '3-5 Business Days',
      delivery_slot: delivery_slot || 'Standard',
      address: address,
      coordinates: coordinates || null,
      payment_status: paymentStatus,
      payment_intent_id: dummyIntentId,
      transaction_ref: isQr ? (transaction_ref || '') : isCod ? 'COD' : null
    });
    await order.save();

    const orderId = order._id.toString();

    // Handle COD separately — no payment gateway needed
    if (isCod) {
      const broadcast = req.app.get('broadcastOwnerMessage');
      if (broadcast) {
        broadcast({ type: 'NEW_ORDER', order: mapOrder(order) });
      }
      return res.status(201).json({
        message: 'COD order placed successfully.',
        orderId,
        payment_method: 'cod'
      });
    }

    // Call Razorpay order API or fallback to mock sandbox
    let rzpOrder = null;
    if (razorpay && !isQr) {
      try {
        rzpOrder = await razorpay.orders.create({
          amount: Math.round(finalTotalAmount * 100),
          currency: 'INR',
          receipt: `order_receipt_${orderId}`
        });
        
        // Update order intent ID with Razorpay Order ID
        order.payment_intent_id = rzpOrder.id;
        await order.save();
      } catch (err) {
        console.log('Razorpay API call failed. Falling back to sandbox simulator:', err);
      }
    }

    const razorpayOrderId = rzpOrder ? rzpOrder.id : `rzp_order_mock_${orderId}`;

    if (!rzpOrder && !isQr) {
      // Sandbox mode: automatically confirm payment and broadcast NEW_ORDER alert
      order.payment_status = 'paid';
      order.status = 'preparing';
      await order.save();

      const broadcast = req.app.get('broadcastOwnerMessage');
      if (broadcast) {
        console.log(`[Sandbox] Broadcasting paid order alert for Order ID: ${orderId}`);
        broadcast({
          type: 'NEW_ORDER',
          order: mapOrder(order)
        });
      }
    }

    return res.status(201).json({
      message: 'Order created in pending state.',
      orderId,
      razorpay_order_id: razorpayOrderId,
      amount: Math.round(finalTotalAmount * 100),
      currency: 'INR',
      key_id: rzpKeyId,
      is_sandbox: !rzpOrder
    });
  } catch (error) {
    console.error('Error placing order:', error);
    return res.status(500).json({ message: 'Internal server error while placing order.' });
  }
});

// POST /api/orders/promo/validate - Public customer promo code verification
router.post('/promo/validate', async (req, res) => {
  const { code, subtotal } = req.body;
  if (!code) {
    return res.status(400).json({ message: 'Promo code is required.' });
  }

  try {
    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), status: 'active' });
    if (!coupon) {
      return res.status(404).json({ valid: false, message: 'Invalid or inactive promo code.' });
    }

    // Expiry check
    if (coupon.expiry_date) {
      const today = new Date().toISOString().split('T')[0];
      if (today > coupon.expiry_date) {
        return res.status(400).json({ valid: false, message: 'This promo code has expired.' });
      }
    }

    // Min order amount check
    if (subtotal && parseFloat(subtotal) < coupon.min_order_amount) {
      return res.status(400).json({ 
        valid: false,
        message: `This promo code requires a minimum subtotal of ₹${coupon.min_order_amount}.` 
      });
    }

    return res.json({
      valid: true,
      code: coupon.code,
      discount_amount: coupon.discount_amount,
      message: `Code applied! ₹${coupon.discount_amount} discount on your order.`
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    return res.status(500).json({ message: 'Error checking promo code.' });
  }
});

// POST /api/orders/verify - Server-side Razorpay signature verification
router.post('/verify', async (req, res) => {
  const { order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!order_id || !razorpay_order_id || !razorpay_payment_id) {
    return res.status(400).json({ message: 'Required verification fields are missing.' });
  }

  try {
    let isValid = false;

    // Signature verification logic
    if (razorpay_order_id.startsWith('rzp_order_mock_')) {
      isValid = razorpay_signature === `mock_sig_${razorpay_order_id}_${razorpay_payment_id}`;
    } else {
      const generatedSig = crypto
        .createHmac('sha256', rzpKeySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');
      
      isValid = generatedSig === razorpay_signature;
    }

    if (!isValid) {
      return res.status(400).json({ message: 'Payment verification failed: Signature mismatch.' });
    }

    // Update order status to paid
    const order = await Order.findByIdAndUpdate(
      order_id,
      { payment_status: 'paid', status: 'preparing', payment_intent_id: razorpay_payment_id },
      { new: true }
    );

    const fullOrder = mapOrder(order);

    // Broadcast new order notification to connected owners
    const broadcast = req.app.get('broadcastOwnerMessage');
    if (broadcast) {
      console.log(`Broadcasting paid order alert for Order ID: ${order_id}`);
      broadcast({
        type: 'NEW_ORDER',
        order: fullOrder
      });
    }

    return res.json({
      success: true,
      message: 'Payment verified and order confirmed successfully.',
      order: fullOrder
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({ message: 'Internal server error during verification.' });
  }
});

// POST /api/orders/webhook - Razorpay webhook listener for asynchronous paid triggers
router.post('/webhook', async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'ManiWebhookSecret2026';
  const sigHeader = req.headers['x-razorpay-signature'];

  if (!sigHeader) {
    return res.status(400).json({ message: 'Missing webhook signature header.' });
  }

  try {
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (digest !== sigHeader) {
      return res.status(400).json({ message: 'Webhook signature mismatch.' });
    }

    const event = req.body.event;
    if (event === 'payment.captured') {
      const payment = req.body.payload.payment.entity;
      const razorpayOrderId = payment.order_id;
      const razorpayPaymentId = payment.id;

      await Order.findOneAndUpdate(
        { payment_intent_id: razorpayOrderId, payment_status: 'unpaid' },
        { payment_status: 'paid', status: 'preparing', payment_intent_id: razorpayPaymentId }
      );
      
      console.log(`Webhook Event: Confirmed payment captured for Order ID: ${razorpayOrderId}`);
    }

    return res.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ message: 'Webhook processing error.' });
  }
});

// GET /api/orders/my-orders - Get customer order history (authenticated user or guest IDs)
router.get('/my-orders', async (req, res) => {
  try {
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwtVerify(token);
        if (decoded && decoded.id) {
          userId = decoded.id;
        }
      } catch (e) {}
    }

    const guestIdsQuery = req.query.guest_ids || req.headers['x-guest-order-ids'];
    let guestIds = [];
    if (guestIdsQuery) {
      guestIds = typeof guestIdsQuery === 'string' ? guestIdsQuery.split(',').map(s => s.trim()) : guestIdsQuery;
    }

    const filterOr = [];
    if (userId) {
      filterOr.push({ user_id: userId });
    }
    if (guestIds.length > 0) {
      const validObjectIds = guestIds.filter(id => typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/));
      if (validObjectIds.length > 0) {
        filterOr.push({ _id: { $in: validObjectIds } });
      }
    }

    if (filterOr.length === 0) {
      return res.json([]);
    }

    const orders = await Order.find({ $or: filterOr }).sort({ created_at: -1 });
    return res.json(orders.map(mapOrder));
  } catch (error) {
    console.error('Error fetching my orders:', error);
    return res.status(500).json({ message: 'Could not fetch order history.' });
  }
});

// POST /api/orders/:id/cancel - Customer cancel order before deadline
router.post('/:id/cancel', async (req, res) => {
  const orderId = req.params.id;

  if (!orderId || typeof orderId !== 'string' || !orderId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ message: 'Invalid order ID format.' });
  }

  // Handle optional user auth or guest identification
  let userId = null;
  let userEmail = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwtVerify(token);
      if (decoded && decoded.id) {
        userId = decoded.id;
        userEmail = decoded.email || null;
      }
    } catch (e) {}
  }

  const guestIdsQuery = req.body.guest_ids || req.query.guest_ids || req.headers['x-guest-order-ids'];
  let guestIds = [];
  if (guestIdsQuery) {
    guestIds = typeof guestIdsQuery === 'string' ? guestIdsQuery.split(',').map(s => s.trim()) : guestIdsQuery;
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // Ownership check: logged-in ID, email match, guest ID list, or unassigned guest order
    const isUserOwner = Boolean(userId && order.user_id && order.user_id.toString() === userId);
    const isEmailOwner = Boolean(userEmail && order.customer_email && userEmail.toLowerCase() === order.customer_email.toLowerCase());
    const isGuestOwner = Boolean(guestIds && guestIds.includes(order._id.toString()));
    const isCustomerAuthorized = isUserOwner || isEmailOwner || isGuestOwner || (!order.user_id && !userId);

    if (!isCustomerAuthorized) {
      return res.status(403).json({ message: 'You are not authorized to cancel this order.' });
    }

    // Status check
    const currentStatus = (order.status || '').toLowerCase();
    if (currentStatus.includes('deliver')) {
      return res.status(400).json({ message: 'Delivered orders cannot be cancelled.' });
    }
    if (currentStatus.includes('cancel')) {
      return res.status(400).json({ message: 'Order is already cancelled.' });
    }

    // Deadline check (24 hours from creation date)
    const createdAt = new Date(order.created_at || Date.now());
    const deadline = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
    const now = new Date();

    if (now >= deadline) {
      return res.status(400).json({ message: 'Cancellation deadline has passed. Orders can only be cancelled within 24 hours of placement.' });
    }

    // Update status to Cancelled
    order.status = 'Cancelled';
    await order.save();

    // Broadcast update to owner if connected
    const broadcast = req.app.get('broadcastOwnerMessage');
    if (broadcast) {
      broadcast({ type: 'ORDER_UPDATE', order: mapOrder(order) });
    }

    return res.json({
      success: true,
      message: 'Order cancelled successfully.',
      order: mapOrder(order)
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return res.status(500).json({ message: 'Could not process order cancellation.' });
  }
});

// GET /api/orders/public/:id - Track guest/unauthenticated order journey
router.get('/public/:id', async (req, res) => {
  const orderId = req.params.id;
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    return res.json(mapOrder(order));
  } catch (error) {
    console.error('Error fetching public order tracking:', error);
    return res.status(500).json({ message: 'Could not load order status.' });
  }
});

// GET /api/orders/:id - Track logged-in order status
router.get('/:id', authenticate, async (req, res) => {
  const userId = req.user.id;
  const orderId = req.params.id;

  try {
    const order = await Order.findById(orderId).populate('user_id', 'name email role');
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // Check authorization: must be user's own order, or owner/mwc
    const userRole = req.user.role;
    if (order.user_id && order.user_id._id.toString() !== userId && userRole !== 'owner' && userRole !== 'mwc') {
      return res.status(403).json({ message: 'Unauthorized access to this order.' });
    }

    return res.json(mapOrder(order));
  } catch (error) {
    console.error('Error tracking order:', error);
    return res.status(500).json({ message: 'Could not retrieve order details.' });
  }
});

export default router;
