import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Package, Truck, Compass, Calendar, MapPin, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Order {
  id: number;
  items: { name: string; quantity: number; price: number; variant: string }[];
  total_amount: number;
  status: 'pending' | 'preparing' | 'packed' | 'out_for_delivery' | 'delivered' | 'cancelled';
  delivery_date: string;
  delivery_slot: string;
  address: string;
  payment_status: string;
  created_at: string;
}

export const OrderTrack: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { userToken } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Poll status or load once
  useEffect(() => {
    if (!id) return;

    const fetchOrder = () => {
      const url = userToken 
        ? `http://localhost:5000/api/orders/${id}`
        : `http://localhost:5000/api/orders/public/${id}`;
        
      const headers: any = {};
      if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
      }

      fetch(url, { headers })
        .then(res => {
          if (!res.ok) throw new Error('Order not found');
          return res.json();
        })
        .then(data => {
          setOrder(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    };

    fetchOrder();
    
    // Set interval to poll status every 15 seconds to simulate real-time updates!
    const interval = setInterval(fetchOrder, 15000);
    return () => clearInterval(interval);
  }, [id, userToken]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-brand-darkBg text-white">
        <div className="w-8 h-8 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Connecting satellite tracking...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-brand-darkBg text-white text-center">
        <p className="text-sm text-zinc-400">This order tracking record is not found or unauthorized.</p>
        <Link to="/catalog" className="text-brand-gold text-xs uppercase tracking-widest font-bold hover:underline">
          Return to Catalog
        </Link>
      </div>
    );
  }

  const statuses = [
    { label: 'Preparing', state: 'preparing', desc: 'Crafting luxury recipe', icon: <Compass size={18} /> },
    { label: 'Packed', state: 'packed', desc: 'Thermally sealed case', icon: <Package size={18} /> },
    { label: 'En Route', state: 'out_for_delivery', desc: 'Climatized express dispatch', icon: <Truck size={18} /> },
    { label: 'Delivered', state: 'delivered', desc: 'Custom happiness achieved', icon: <CheckCircle2 size={18} /> }
  ];

  // Helper to determine step completion index
  const getStatusIndex = (status: string) => {
    if (status === 'pending') return 0;
    if (status === 'preparing') return 0;
    if (status === 'packed') return 1;
    if (status === 'out_for_delivery') return 2;
    if (status === 'delivered') return 3;
    return -1; // Cancelled
  };

  const activeIndex = getStatusIndex(order.status);

  return (
    <div className="max-w-4xl mx-auto py-24 px-6 font-sans text-white">
      
      {/* Title */}
      <div className="text-center space-y-2 mb-12">
        <span className="text-xs text-brand-gold uppercase tracking-[0.3em] font-semibold">Live Courier tracking</span>
        <h1 className="text-3xl md:text-5xl font-serif">ORDER #{order.id}</h1>
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
          Placed on: {new Date(order.created_at).toLocaleString()}
        </p>
      </div>

      {/* Stepper progress indicator */}
      {order.status === 'cancelled' ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl text-center mb-8">
          <h3 className="font-serif text-lg font-bold">Order Cancelled</h3>
          <p className="text-xs text-zinc-400 mt-1">This order was cancelled and refunded. Contact concierge for details.</p>
        </div>
      ) : (
        <div className="bg-brand-panelBg border border-brand-maroon/20 rounded-3xl p-6 md:p-8 mb-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {statuses.map((s, idx) => {
              const isCompleted = idx < activeIndex;
              const isActive = idx === activeIndex;
              
              return (
                <div key={idx} className="flex flex-row md:flex-col items-center gap-4 md:text-center relative z-10">
                  {/* Stepper ball */}
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                    isCompleted 
                      ? 'bg-brand-gold border-brand-gold text-brand-maroonDark' 
                      : isActive 
                        ? 'bg-brand-maroonDark border-brand-gold text-brand-goldLight shadow-[0_0_12px_rgba(212,175,55,0.4)]' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-600'
                  }`}>
                    {s.icon}
                  </div>

                  <div className="text-left md:text-center space-y-0.5">
                    <h4 className={`text-xs font-serif font-bold uppercase tracking-wider ${isActive ? 'text-brand-goldLight' : isCompleted ? 'text-zinc-300' : 'text-zinc-600'}`}>
                      {s.label}
                    </h4>
                    <p className="text-[9px] text-zinc-500 leading-none">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stepper Connecting Progress Bar */}
          <div className="hidden md:block w-3/4 mx-auto h-0.5 bg-zinc-800 relative -top-24 z-0">
            <div 
              className="h-full bg-brand-gold transition-all duration-500 shadow-[0_0_8px_#D4AF37]" 
              style={{ width: `${(activeIndex / 3) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Meta delivery details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Destination Coordinates */}
        <div className="bg-brand-panelBg border border-brand-maroon/20 rounded-2xl p-5 space-y-3 text-left">
          <h4 className="text-xs text-brand-gold uppercase tracking-wider font-semibold border-b border-brand-maroon/10 pb-1 flex items-center gap-1.5">
            <MapPin size={14} /> Shipping Coordinates
          </h4>
          <p className="text-xs text-zinc-300 leading-relaxed font-medium">{order.address}</p>
        </div>

        {/* Schedule Slot */}
        <div className="bg-brand-panelBg border border-brand-maroon/20 rounded-2xl p-5 space-y-3 text-left">
          <h4 className="text-xs text-brand-gold uppercase tracking-wider font-semibold border-b border-brand-maroon/10 pb-1 flex items-center gap-1.5">
            <Calendar size={14} /> Scheduled Air-Freight
          </h4>
          <div className="space-y-1.5 text-xs text-zinc-300">
            <p className="flex items-center gap-1.5"><Calendar size={12} className="text-brand-gold" /> Date: {order.delivery_date}</p>
            <p className="flex items-center gap-1.5"><Clock size={12} className="text-brand-gold" /> Slot: {order.delivery_slot}</p>
          </div>
        </div>
      </div>

      {/* Receipt Item lists */}
      <div className="bg-brand-panelBg border border-brand-maroon/20 rounded-2xl p-6 text-left space-y-4">
        <h3 className="text-xs text-zinc-400 uppercase tracking-wider font-semibold border-b border-brand-maroon/10 pb-2">Order Items</h3>
        
        <div className="space-y-3">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center text-xs">
              <div>
                <p className="font-semibold text-brand-goldLight">{item.name}</p>
                <p className="text-[9px] text-zinc-500">{item.variant} • Qty: {item.quantity}</p>
              </div>
              <span className="font-bold text-white">₹{(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-brand-maroon/20 pt-3 flex justify-between items-center text-xs font-bold text-brand-gold">
          <span>Amount Settled (Paid):</span>
          <span className="text-base text-brand-goldLight">₹{order.total_amount.toLocaleString()}</span>
        </div>
      </div>

      <div className="text-center pt-8">
        <Link 
          to="/catalog"
          className="inline-block px-8 py-3 bg-brand-maroonDark border border-brand-gold/30 hover:border-brand-gold text-brand-gold hover:text-white font-semibold text-xs uppercase tracking-widest rounded-lg transition-colors"
        >
          Explore More Chocolates
        </Link>
      </div>

    </div>
  );
};

export default OrderTrack;
