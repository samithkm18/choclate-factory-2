import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Package, Truck, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  variant?: string;
  image?: string;
}

interface Order {
  id: string;
  _id?: string;
  items: OrderItem[];
  total_amount: number;
  delivery_charge?: number;
  expected_delivery_date?: string;
  cancellation_deadline?: string;
  payment_method?: string;
  payment_status?: string;
  status: string;
  created_at: string;
  address?: string;
}

export const MyOrders: React.FC = () => {
  const { userToken } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const headers: any = {};
      if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
      }
      let guestIds = [];
      try {
        guestIds = JSON.parse(localStorage.getItem('manis_guest_orders') || '[]');
      } catch (e) {}
      
      const queryStr = guestIds.length > 0 ? `?guest_ids=${encodeURIComponent(guestIds.join(','))}` : '';
      const res = await fetch(`http://localhost:5000/api/orders/my-orders${queryStr}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Error fetching my orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!orderId) {
      alert('Invalid order reference.');
      return;
    }
    if (cancellingId === orderId) return; // Prevent duplicate cancellation requests
    if (!confirm('Are you sure you want to cancel this order?')) return;
    
    setCancellingId(orderId);
    try {
      const headers: any = { 'Content-Type': 'application/json' };
      if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
      }
      let guestIds: string[] = [];
      try {
        guestIds = JSON.parse(localStorage.getItem('manis_guest_orders') || '[]');
      } catch (e) {}

      if (guestIds.length > 0) {
        headers['x-guest-order-ids'] = guestIds.join(',');
      }

      const res = await fetch(`http://localhost:5000/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ guest_ids: guestIds })
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        // Optimistically update order status in state immediately
        setOrders(prev => prev.map(o => (o.id === orderId || o._id === orderId) ? { ...o, status: 'Cancelled' } : o));
        alert(data.message || 'Order cancelled successfully.');
        fetchOrders();
      } else {
        alert(data.message || 'Could not process order cancellation.');
      }
    } catch (e: any) {
      console.error('Cancel order error:', e);
      alert(e?.message || 'Error connecting to server. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [userToken]);

  const getStatusBadge = (status: string) => {
    const norm = status.toLowerCase();
    if (norm.includes('cancel')) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-red-500/20 text-red-400 border border-red-500/40">
          <AlertCircle size={12} /> Cancelled
        </span>
      );
    }
    if (norm.includes('deliver')) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
          <CheckCircle2 size={12} /> Delivered
        </span>
      );
    }
    if (norm.includes('out') || norm.includes('transit')) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
          <Truck size={12} /> Out for Delivery
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/40">
        <Package size={12} /> Packing
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto py-12 md:py-24 px-4 sm:px-6 md:px-12 font-sans overflow-x-hidden text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-brand-maroon/20 pb-6 mb-8 gap-4">
        <div>
          <span className="text-[10px] text-brand-gold uppercase tracking-[0.3em] font-extrabold block">
            Customer Portal
          </span>
          <h1 className="text-2xl md:text-4xl font-serif text-white uppercase tracking-wider font-bold mt-1">
            My Orders
          </h1>
        </div>
        
        <button
          onClick={fetchOrders}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-panelBg border border-brand-gold/30 hover:border-brand-gold text-brand-gold text-xs font-bold rounded-xl transition-all cursor-pointer w-fit"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh Orders
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-zinc-400 uppercase tracking-widest font-bold">Loading Order History...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-brand-panelBg border border-brand-maroon/20 rounded-3xl p-8 space-y-4">
          <ShoppingBag size={40} className="text-zinc-600 mx-auto" />
          <h3 className="text-lg font-serif text-zinc-300 uppercase">No Orders Found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            You haven't placed any orders yet. Explore our handcrafted artisanal chocolate collection and treat yourself!
          </p>
          <Link
            to="/shop"
            className="inline-block px-6 py-3 bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md mt-2"
          >
            Explore Shop
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const orderId = order.id || order._id || '';
            const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });

            return (
              <div
                key={orderId}
                className="bg-brand-panelBg border border-brand-maroon/20 rounded-3xl p-5 md:p-6 space-y-4 hover:border-brand-gold/30 transition-all shadow-xl"
              >
                {/* Order Top Bar */}
                <div className="flex flex-wrap items-center justify-between border-b border-white/5 pb-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">Order Number</span>
                    <span className="font-mono text-brand-gold font-bold">#{orderId}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">Order Date</span>
                    <span className="text-zinc-300 font-semibold">{orderDate}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">Payment Method</span>
                    <span className="text-white font-bold uppercase">{order.payment_method || 'COD'}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block mb-0.5">Status</span>
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-3 py-1">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-darkBg border border-white/10 rounded-lg flex items-center justify-center p-1 font-serif text-brand-gold text-[10px] font-bold">
                          🍫
                        </div>
                        <div>
                          <span className="font-bold text-white block">{item.name}</span>
                          <span className="text-[10px] text-zinc-400">Qty: {item.quantity} × ₹{item.price}</span>
                        </div>
                      </div>
                      <span className="font-bold text-brand-goldLight">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Metadata & Pricing Summary */}
                <div className="bg-brand-darkBg/60 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-zinc-300 border border-white/5">
                  <div>
                    <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold block">Delivery Charge</span>
                    <span className="font-bold text-white">
                      {order.delivery_charge && order.delivery_charge > 0 ? `₹${order.delivery_charge}` : 'FREE'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold block">Expected Delivery</span>
                    <span className="font-semibold text-white">{order.expected_delivery_date || '3-5 Business Days'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold block">Cancellation Deadline</span>
                    <span className="font-semibold text-white">{order.cancellation_deadline || 'Within 24 hours of order placement'}</span>
                  </div>
                </div>

                {/* Bottom Bar: Total & Action Buttons */}
                <div className="flex flex-wrap items-center justify-between border-t border-white/5 pt-4 gap-3">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">Total Amount</span>
                    <span className="text-xl font-extrabold text-brand-gold">₹{order.total_amount}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {(() => {
                      const createdAt = new Date(order.created_at || Date.now()).getTime();
                      const deadlineTime = createdAt + 24 * 60 * 60 * 1000;
                      const isBeforeDeadline = Date.now() < deadlineTime;
                      const statusLower = (order.status || '').toLowerCase();
                      const isDelivered = statusLower.includes('deliver');
                      const isCancelled = statusLower.includes('cancel');

                      if (isCancelled) {
                        return (
                          <span className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-extrabold uppercase tracking-widest rounded-xl">
                            Cancelled
                          </span>
                        );
                      }

                      if (!isDelivered) {
                        const isCancellingThis = cancellingId === orderId;
                        return (
                          <button
                            disabled={!isBeforeDeadline || isCancellingThis}
                            onClick={() => handleCancelOrder(orderId)}
                            className={`px-4 py-2.5 rounded-xl font-extrabold text-[10px] uppercase tracking-widest transition-all cursor-pointer ${
                              isCancellingThis
                                ? 'bg-red-500/40 text-white border border-red-500/60 animate-pulse cursor-wait'
                                : isBeforeDeadline
                                  ? 'bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white border border-red-500/40 shadow-sm'
                                  : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed opacity-50'
                            }`}
                            title={isBeforeDeadline ? 'Cancel this order before 24h deadline' : 'Cancellation deadline has passed'}
                          >
                            {isCancellingThis ? 'Cancelling...' : isBeforeDeadline ? 'Cancel Order' : 'Deadline Passed'}
                          </button>
                        );
                      }
                      return null;
                    })()}

                    <button
                      onClick={() => setTrackingOrder(order)}
                      className="px-5 py-2.5 bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Truck size={14} /> Track Order
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Track Order Modal */}
      {trackingOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9990] flex items-center justify-center p-4">
          <div className="bg-brand-panelBg border border-brand-gold/30 rounded-3xl p-6 md:p-8 max-w-lg w-full space-y-6 text-left relative shadow-2xl">
            <button
              onClick={() => setTrackingOrder(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 rounded-full hover:bg-white/10"
            >
              ✕
            </button>

            <div>
              <span className="text-[10px] text-brand-gold uppercase tracking-[0.2em] font-bold block">Live Order Tracking</span>
              <h3 className="text-xl font-serif text-white font-bold uppercase mt-1">Order #{trackingOrder.id || trackingOrder._id}</h3>
            </div>

            {/* Stepper Display */}
            <div className="space-y-6 relative py-2">
              {[
                { title: 'Packing', desc: 'Order received and being hand-crafted', icon: Package, key: 'packing' },
                { title: 'Out for Delivery', desc: 'Handed over to courier express team', icon: Truck, key: 'out' },
                { title: 'Delivered', desc: 'Enjoy your artisanal chocolate!', icon: CheckCircle2, key: 'delivered' }
              ].map((step, idx) => {
                const currentStatus = (trackingOrder.status || 'Packing').toLowerCase();
                let isCompleted = false;
                let isCurrent = false;

                if (currentStatus.includes('deliver')) {
                  isCompleted = true;
                  if (step.key === 'delivered') isCurrent = true;
                } else if (currentStatus.includes('out') || currentStatus.includes('transit')) {
                  if (step.key === 'packing' || step.key === 'out') isCompleted = true;
                  if (step.key === 'out') isCurrent = true;
                } else {
                  if (step.key === 'packing') {
                    isCompleted = true;
                    isCurrent = true;
                  }
                }

                const StepIcon = step.icon;

                return (
                  <div key={idx} className="flex items-start gap-4 relative">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                        isCompleted
                          ? 'bg-brand-gold text-brand-maroonDark border-brand-gold'
                          : 'bg-zinc-900 text-zinc-600 border-zinc-700'
                      }`}
                    >
                      <StepIcon size={18} />
                    </div>
                    <div className="flex-1">
                      <h4 className={`text-sm font-bold uppercase ${isCurrent ? 'text-brand-gold' : isCompleted ? 'text-white' : 'text-zinc-500'}`}>
                        {step.title} {isCurrent && '(Current Status)'}
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-brand-darkBg/80 rounded-2xl p-4 border border-white/5 space-y-1 text-xs text-zinc-300">
              <p><strong className="text-zinc-400">Expected Delivery:</strong> {trackingOrder.expected_delivery_date || '3-5 Business Days'}</p>
              <p><strong className="text-zinc-400">Cancellation Deadline:</strong> {trackingOrder.cancellation_deadline || 'Within 24 hours of order placement'}</p>
            </div>

            <button
              onClick={() => setTrackingOrder(null)}
              className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
            >
              Close Tracker
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyOrders;
