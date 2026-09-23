import React, { useState, useEffect } from 'react';
import { ShoppingBag, Star, Briefcase, DollarSign, Package, UserCheck, RefreshCw, Filter, Calendar, MapPin, Phone, Mail } from 'lucide-react';

interface OverallReviewData {
  summary: {
    totalOrders: number;
    totalRevenue: number;
    totalReviews: number;
    avgRating: number;
    totalApplications: number;
    activeProductsCount: number;
  };
  orders: any[];
  reviews: any[];
  jobApplications: any[];
}

interface Props {
  token: string;
}

export const AdminOverallReview: React.FC<Props> = ({ token }) => {
  const [data, setData] = useState<OverallReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<'orders' | 'reviews' | 'jobs'>('orders');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOverallReview = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/owner/overall-review', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching overall review data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverallReview();
  }, [token]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400">
        <div className="w-8 h-8 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
        <p className="text-xs uppercase tracking-widest font-bold">Consolidating Customer Activity & Metrics...</p>
      </div>
    );
  }

  const summary = data?.summary || {
    totalOrders: 0,
    totalRevenue: 0,
    totalReviews: 0,
    avgRating: 5.0,
    totalApplications: 0,
    activeProductsCount: 0
  };

  // Filter orders
  const filteredOrders = (data?.orders || []).filter(o => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const cust = (o.customer_name || '').toLowerCase();
    const email = (o.customer_email || '').toLowerCase();
    const phone = (o.customer_phone || '').toLowerCase();
    const id = (o.id || o._id || '').toString().toLowerCase();
    return cust.includes(q) || email.includes(q) || phone.includes(q) || id.includes(q);
  });

  // Filter reviews
  const filteredReviews = (data?.reviews || []).filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const cust = (r.customer_name || '').toLowerCase();
    const text = (r.text || '').toLowerCase();
    return cust.includes(q) || text.includes(q);
  });

  // Filter applications
  const filteredJobs = (data?.jobApplications || []).filter(j => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = (j.applicant_name || '').toLowerCase();
    const email = (j.applicant_email || '').toLowerCase();
    const title = (j.job_title || '').toLowerCase();
    return name.includes(q) || email.includes(q) || title.includes(q);
  });

  return (
    <div className="space-y-6 text-left font-sans">
      
      {/* Top Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] text-brand-gold uppercase tracking-[0.3em] font-extrabold block">Executive Dashboard</span>
          <h2 className="text-2xl font-serif text-white uppercase font-bold">Overall Customer Activity Review</h2>
        </div>
        
        <button
          onClick={fetchOverallReview}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer w-fit"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Real Data
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-brand-panelBg border border-brand-maroon/20 rounded-2xl p-5 space-y-2 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-brand-gold">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-400">Total Customer Orders</span>
            <ShoppingBag size={20} />
          </div>
          <div className="text-2xl font-extrabold text-white">{summary.totalOrders}</div>
          <p className="text-[10px] text-zinc-500 font-semibold">Total Revenue: <strong className="text-brand-goldLight">₹{summary.totalRevenue.toLocaleString()}</strong></p>
        </div>

        <div className="bg-brand-panelBg border border-brand-maroon/20 rounded-2xl p-5 space-y-2 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-brand-gold">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-400">Customer Feedback</span>
            <Star size={20} />
          </div>
          <div className="text-2xl font-extrabold text-white">{summary.totalReviews} Reviews</div>
          <p className="text-[10px] text-zinc-500 font-semibold">Avg Rating: <strong className="text-amber-400">★ {summary.avgRating} / 5.0</strong></p>
        </div>

        <div className="bg-brand-panelBg border border-brand-maroon/20 rounded-2xl p-5 space-y-2 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-brand-gold">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-400">Career Applications</span>
            <Briefcase size={20} />
          </div>
          <div className="text-2xl font-extrabold text-white">{summary.totalApplications}</div>
          <p className="text-[10px] text-zinc-500 font-semibold">Submitted via Job Portal</p>
        </div>

        <div className="bg-brand-panelBg border border-brand-maroon/20 rounded-2xl p-5 space-y-2 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-brand-gold">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-400">Catalogue Products</span>
            <Package size={20} />
          </div>
          <div className="text-2xl font-extrabold text-white">{summary.activeProductsCount}</div>
          <p className="text-[10px] text-zinc-500 font-semibold">Active in Customer Shop</p>
        </div>

      </div>

      {/* Sub-navigation & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-brand-panelBg p-3 rounded-2xl border border-white/5">
        
        <div className="flex gap-2">
          <button
            onClick={() => setSubTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              subTab === 'orders' ? 'bg-brand-gold text-brand-maroonDark shadow-md' : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Customer Orders ({filteredOrders.length})
          </button>
          
          <button
            onClick={() => setSubTab('reviews')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              subTab === 'reviews' ? 'bg-brand-gold text-brand-maroonDark shadow-md' : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Product Reviews ({filteredReviews.length})
          </button>

          <button
            onClick={() => setSubTab('jobs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              subTab === 'jobs' ? 'bg-brand-gold text-brand-maroonDark shadow-md' : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Job Applications ({filteredJobs.length})
          </button>
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Filter by customer name, email, phone, ID..."
          className="bg-brand-darkBg border border-brand-gold/20 focus:border-brand-gold rounded-xl px-3 py-1.5 text-xs text-white outline-none w-full sm:w-64"
        />

      </div>

      {/* TAB 1: Customer Orders Review */}
      {subTab === 'orders' && (
        <div className="bg-brand-panelBg border border-brand-maroon/20 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-serif text-white font-bold uppercase tracking-wider">All Customer Orders ({filteredOrders.length})</h3>
          
          {filteredOrders.length === 0 ? (
            <p className="text-xs text-zinc-500 py-8 text-center">No matching customer orders found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-brand-maroon/15 text-zinc-500 uppercase tracking-widest text-[9px] font-bold">
                    <th className="py-3">Order ID</th>
                    <th className="py-3">Customer Info</th>
                    <th className="py-3">Items Ordered</th>
                    <th className="py-3">Delivery Address</th>
                    <th className="py-3 text-right">Amount</th>
                    <th className="py-3 text-center">Payment</th>
                    <th className="py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(o => (
                    <tr key={o.id || o._id} className="border-b border-brand-maroon/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 font-mono font-bold text-brand-gold">#{o.id || o._id}</td>
                      <td className="py-4">
                        <p className="font-bold text-white leading-tight">{o.customer_name || 'Valued Customer'}</p>
                        <p className="text-[9px] text-zinc-400">{o.customer_email || 'No email'}</p>
                        <p className="text-[9px] text-zinc-400">{o.customer_phone || ''}</p>
                      </td>
                      <td className="py-4 max-w-xs">
                        {o.items && o.items.map((i: any, idx: number) => (
                          <div key={idx} className="text-[10px] text-zinc-300">
                            • <strong>{i.name}</strong> ({i.quantity}× ₹{i.price})
                          </div>
                        ))}
                      </td>
                      <td className="py-4 max-w-xs text-zinc-300 text-[10px]" title={o.address}>
                        <p className="line-clamp-2">{o.address}</p>
                      </td>
                      <td className="py-4 text-right font-extrabold text-brand-goldLight">₹{o.total_amount}</td>
                      <td className="py-4 text-center">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-zinc-800 text-zinc-300 border border-white/10">
                          {o.payment_method || 'COD'}
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-brand-gold/15 text-brand-gold border border-brand-gold/30">
                          {o.status || 'Packing'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Customer Reviews */}
      {subTab === 'reviews' && (
        <div className="bg-brand-panelBg border border-brand-maroon/20 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-serif text-white font-bold uppercase tracking-wider">Customer & Product Reviews ({filteredReviews.length})</h3>
          
          {filteredReviews.length === 0 ? (
            <p className="text-xs text-zinc-500 py-8 text-center">No product reviews submitted yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredReviews.map(r => (
                <div key={r._id || r.id} className="bg-brand-darkBg border border-white/10 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{r.customer_name || 'Anonymous Customer'}</span>
                    <span className="text-amber-400 text-xs font-bold">{'★'.repeat(r.rating || 5)} ({r.rating}/5)</span>
                  </div>
                  <p className="text-xs text-zinc-300 italic">"{r.text}"</p>
                  <div className="flex items-center justify-between text-[9px] text-zinc-500 pt-2 border-t border-white/5">
                    <span>Date: {new Date(r.created_at).toLocaleDateString()}</span>
                    <span className="uppercase font-bold text-emerald-400">Status: {r.status || 'Approved'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Job Applications */}
      {subTab === 'jobs' && (
        <div className="bg-brand-panelBg border border-brand-maroon/20 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-serif text-white font-bold uppercase tracking-wider">Job Applications ({filteredJobs.length})</h3>
          
          {filteredJobs.length === 0 ? (
            <p className="text-xs text-zinc-500 py-8 text-center">No job applications submitted yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-brand-maroon/15 text-zinc-500 uppercase tracking-widest text-[9px] font-bold">
                    <th className="py-3">Applicant Name</th>
                    <th className="py-3">Target Role</th>
                    <th className="py-3">Contact Email</th>
                    <th className="py-3">Phone</th>
                    <th className="py-3">Experience</th>
                    <th className="py-3">Submission Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map(j => (
                    <tr key={j._id || j.id} className="border-b border-brand-maroon/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 font-bold text-white">{j.applicant_name}</td>
                      <td className="py-3 text-brand-gold font-semibold">{j.job_title}</td>
                      <td className="py-3 text-zinc-300">{j.applicant_email}</td>
                      <td className="py-3 text-zinc-400 font-mono">{j.applicant_phone}</td>
                      <td className="py-3 text-zinc-300">{j.experience || 'N/A'}</td>
                      <td className="py-3 text-zinc-500">{new Date(j.submitted_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default AdminOverallReview;
