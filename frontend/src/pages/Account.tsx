import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, ShoppingBag, Eye, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Order {
  id: number;
  total_amount: number;
  status: string;
  created_at: string;
  payment_status: string;
}

export const Account: React.FC = () => {
  const { user, userToken, userLogout } = useAuth();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Auth protection check
  useEffect(() => {
    if (!userToken) {
      navigate('/login');
    }
  }, [userToken, navigate]);

  // Load order history
  useEffect(() => {
    if (!userToken) return;

    fetch('http://localhost:5000/api/orders/my-orders', {
      headers: { 'Authorization': `Bearer ${userToken}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Could not fetch orders');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) setOrders(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [userToken]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-brand-darkBg text-white">
        <div className="w-8 h-8 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Unlocking chamber vaults...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-24 px-6 md:px-12 font-sans text-white text-left">
      
      {/* Header */}
      <div className="border-b border-brand-maroon/20 pb-6 mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs text-brand-gold uppercase tracking-[0.3em] font-semibold">User Dashboard</span>
          <h1 className="text-3xl md:text-5xl font-serif mt-1">THE GUEST LOUNGE</h1>
        </div>
        <button 
          onClick={() => { userLogout(); navigate('/'); }}
          className="px-6 py-2 border border-red-500/30 hover:bg-red-500/10 text-red-400 rounded-lg text-xs font-semibold uppercase tracking-widest transition-colors"
        >
          Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Personal details */}
        <div className="lg:col-span-4 bg-brand-panelBg border border-brand-maroon/20 rounded-2xl p-6 space-y-4 h-fit">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-gold/10 border border-brand-gold/30 rounded-full flex items-center justify-center text-brand-gold text-xl">
              <User size={20} />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-white leading-tight">{user?.name}</h3>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Premium Guest</p>
            </div>
          </div>

          <div className="border-t border-brand-maroon/10 pt-4 text-xs space-y-2.5 text-zinc-400">
            <div>
              <span className="text-zinc-500 block uppercase tracking-wider text-[9px]">Email Address</span>
              <span className="text-white font-medium break-all">{user?.email}</span>
            </div>
            <div>
              <span className="text-zinc-500 block uppercase tracking-wider text-[9px]">Auth Permission</span>
              <span className="text-brand-gold font-medium">Standard Storefront User</span>
            </div>
          </div>
        </div>

        {/* Right Column: Order History list */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-brand-panelBg border border-brand-maroon/20 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm text-brand-gold uppercase tracking-wider font-semibold border-b border-brand-maroon/10 pb-2 flex items-center gap-1.5">
              <ShoppingBag size={15} /> Order Archive
            </h3>

            {orders.length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <p className="text-xs text-zinc-500">No orders have been recorded under this account.</p>
                <Link to="/catalog" className="inline-block text-brand-gold hover:underline text-xs uppercase tracking-widest font-bold">
                  Shop Catalog
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-brand-maroon/10 text-zinc-500 uppercase tracking-wider text-[9px]">
                      <th className="py-2.5">ID</th>
                      <th className="py-2.5">Date</th>
                      <th className="py-2.5 text-right">Total</th>
                      <th className="py-2.5 text-center">Status</th>
                      <th className="py-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b border-brand-maroon/5 hover:bg-white/5 transition-colors">
                        <td className="py-3 font-semibold text-brand-goldLight">#{o.id}</td>
                        <td className="py-3 text-zinc-400 flex items-center gap-1">
                          <Calendar size={12} /> {new Date(o.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-right font-bold text-white">${o.total_amount.toFixed(2)}</td>
                        <td className="py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                            o.status === 'delivered' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : o.status === 'cancelled' 
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                                : 'bg-brand-gold/10 text-brand-goldLight border border-brand-gold/20'
                          }`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <Link 
                            to={`/track/${o.id}`}
                            className="inline-flex items-center gap-1 text-[10px] text-brand-gold font-semibold uppercase hover:underline"
                          >
                            <Eye size={10} /> Track
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Account;
