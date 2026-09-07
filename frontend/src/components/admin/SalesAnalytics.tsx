import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, DollarSign, ShoppingCart } from 'lucide-react';

interface UspAnalytics {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  stockAlertsCount: number;
  repeatCustomerRate: number;
  lowStockProducts: { id: number; name: string; stock: number; price: number; category: string }[];
  salesTrend: { date: string; amount: number; count: number }[];
  popularProducts: { name: string; category: string; price: number; stock: number }[];
}

interface Props {
  token: string;
  role: 'owner' | 'mwc';
}

export const SalesAnalytics: React.FC<Props> = ({ token, role }) => {
  const [data, setData] = useState<UspAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const apiBase = `http://localhost:5000/api/${role}`;

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${apiBase}/analytics`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error('Error fetching analytics details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [token, role]);

  if (loading) {
    return <div className="text-zinc-500 text-xs py-10">Compiling analytics report...</div>;
  }

  if (!data) {
    return <div className="text-zinc-500 text-xs py-10">Failed to load analytics dashboard.</div>;
  }

  return (
    <div className="space-y-8 text-left">
      
      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        
        {/* Revenue Card */}
        <div className="bg-black/20 border border-zinc-800/80 p-5 rounded-2xl space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-widest">Total Revenue</span>
            <DollarSign size={14} className="text-brand-gold" />
          </div>
          <p className="text-2xl font-serif font-extrabold text-white">₹{data.totalRevenue.toLocaleString()}</p>
        </div>

        {/* Orders Card */}
        <div className="bg-black/20 border border-zinc-800/80 p-5 rounded-2xl space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-widest">Gross Orders</span>
            <ShoppingCart size={14} className="text-brand-gold" />
          </div>
          <p className="text-2xl font-serif font-extrabold text-white">{data.totalOrders}</p>
        </div>

        {/* Repeat Customer Rate */}
        <div className="bg-black/20 border border-zinc-800/80 p-5 rounded-2xl space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-widest">Repeat Rate</span>
            <TrendingUp size={14} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-serif font-extrabold text-white">{data.repeatCustomerRate}%</p>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-black/20 border border-zinc-800/80 p-5 rounded-2xl space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-widest">Low Stock Items</span>
            <AlertTriangle size={14} className={data.stockAlertsCount > 0 ? "text-yellow-500" : "text-zinc-500"} />
          </div>
          <p className="text-2xl font-serif font-extrabold text-white">{data.stockAlertsCount}</p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Popular Products List */}
        <div className="lg:col-span-6 bg-black/15 border border-zinc-800 p-5 rounded-2xl space-y-4">
          <h4 className="text-xs font-serif font-extrabold uppercase tracking-widest text-brand-gold">
            Popular Product Catalog Highlight
          </h4>
          <div className="space-y-3">
            {data.popularProducts.map((p, idx) => (
              <div key={idx} className="flex justify-between items-center border-b border-zinc-900 pb-2 last:border-0 last:pb-0">
                <div>
                  <span className="text-xs font-bold text-white block">{p.name}</span>
                  <span className="text-[9px] text-zinc-500 uppercase font-semibold">{p.category}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-serif text-brand-gold block">₹{p.price}</span>
                  <span className="text-[9px] text-zinc-400 block font-semibold">{p.stock} units left</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Warnings List */}
        <div className="lg:col-span-6 bg-black/15 border border-zinc-800 p-5 rounded-2xl space-y-4">
          <h4 className="text-xs font-serif font-extrabold uppercase tracking-widest text-brand-gold flex items-center gap-1.5">
            <AlertTriangle size={12} className="text-yellow-500" /> Stock Level Alerts (&lt; 15 units)
          </h4>
          {data.lowStockProducts.length === 0 ? (
            <p className="text-[10px] text-zinc-500 py-6 text-center uppercase tracking-widest">All products are healthy stocked.</p>
          ) : (
            <div className="space-y-3 max-h-[220px] overflow-y-auto">
              {data.lowStockProducts.map((p) => (
                <div key={p.id} className="flex justify-between items-center bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-900">
                  <div>
                    <span className="text-xs font-bold text-zinc-300 block">{p.name}</span>
                    <span className="text-[9px] text-zinc-500 uppercase">{p.category}</span>
                  </div>
                  <span className="text-xs font-extrabold text-yellow-500 bg-yellow-950/30 px-2.5 py-1 rounded-lg border border-yellow-500/25">
                    {p.stock} units
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default SalesAnalytics;
