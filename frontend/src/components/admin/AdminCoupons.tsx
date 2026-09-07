import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag, ToggleLeft, ToggleRight } from 'lucide-react';

interface Coupon {
  id: number;
  code: string;
  discount_amount: number;
  min_order_amount: number;
  expiry_date: string | null;
  status: 'active' | 'inactive';
  created_at: string;
}

interface AdminCouponsProps {
  token: string;
  role: 'owner' | 'mwc';
}

const API_PREFIX = (role: 'owner' | 'mwc') => `http://localhost:5000/api/${role}`;

const emptyForm = () => ({
  code: '',
  discount_amount: '',
  min_order_amount: '',
  expiry_date: '',
  status: 'active' as 'active' | 'inactive'
});

const AdminCoupons: React.FC<AdminCouponsProps> = ({ token, role }) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState(emptyForm());
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_PREFIX(role)}/coupons`, { headers });
      if (res.ok) setCoupons(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        code: form.code.toUpperCase().trim(),
        discount_amount: parseFloat(form.discount_amount),
        min_order_amount: parseFloat(form.min_order_amount || '0'),
        expiry_date: form.expiry_date || null,
        status: form.status
      };
      const url = editId ? `${API_PREFIX(role)}/coupons/${editId}` : `${API_PREFIX(role)}/coupons`;
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      if (res.ok) {
        setForm(emptyForm());
        setEditId(null);
        await fetchCoupons();
      } else {
        const err = await res.json();
        alert(err.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditId(coupon.id);
    setForm({
      code: coupon.code,
      discount_amount: coupon.discount_amount.toString(),
      min_order_amount: coupon.min_order_amount.toString(),
      expiry_date: coupon.expiry_date || '',
      status: coupon.status
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this promo code permanently?')) return;
    try {
      const res = await fetch(`${API_PREFIX(role)}/coupons/${id}`, { method: 'DELETE', headers });
      if (res.ok) setCoupons(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggle = async (coupon: Coupon) => {
    const newStatus = coupon.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`${API_PREFIX(role)}/coupons/${coupon.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ ...coupon, status: newStatus })
      });
      if (res.ok) {
        setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, status: newStatus } : c));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const inputCls = 'w-full bg-zinc-900 border border-zinc-700 focus:border-brand-gold rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors placeholder:text-zinc-600';
  const labelCls = 'block text-[10px] text-zinc-500 uppercase tracking-widest mb-1 font-bold';

  return (
    <div className="space-y-8">
      {/* Form */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-5">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <Tag size={14} className="text-brand-gold" />
          {editId ? 'Edit Promo Code' : 'Create New Promo Code'}
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Code *</label>
            <input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))}
              className={inputCls} placeholder="e.g. MANIS100" required />
          </div>
          <div>
            <label className={labelCls}>Flat Discount Amount (₹) *</label>
            <input type="number" min="1" value={form.discount_amount}
              onChange={e => setForm(p => ({ ...p, discount_amount: e.target.value }))}
              className={inputCls} placeholder="e.g. 100" required />
          </div>
          <div>
            <label className={labelCls}>Minimum Order Amount (₹)</label>
            <input type="number" min="0" value={form.min_order_amount}
              onChange={e => setForm(p => ({ ...p, min_order_amount: e.target.value }))}
              className={inputCls} placeholder="0 = No minimum" />
          </div>
          <div>
            <label className={labelCls}>Expiry Date (optional)</label>
            <input type="date" value={form.expiry_date}
              onChange={e => setForm(p => ({ ...p, expiry_date: e.target.value }))}
              className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as 'active' | 'inactive' }))}
              className={inputCls}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex items-end gap-3">
            <button type="submit" disabled={saving}
              className="px-6 py-2 bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark font-bold text-[10px] uppercase tracking-widest rounded-lg transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2">
              <Plus size={12} /> {saving ? 'Saving...' : editId ? 'Update Code' : 'Create Code'}
            </button>
            {editId && (
              <button type="button" onClick={() => { setForm(emptyForm()); setEditId(null); }}
                className="px-6 py-2 border border-zinc-700 text-zinc-400 hover:text-white text-[10px] uppercase tracking-widest rounded-lg transition-all cursor-pointer">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Coupons Table */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
          {coupons.length} Promo Code{coupons.length !== 1 ? 's' : ''} on Record
        </h3>
        {loading ? (
          <div className="text-zinc-600 text-xs py-8 text-center">Loading codes...</div>
        ) : coupons.length === 0 ? (
          <div className="text-zinc-600 text-xs py-8 text-center border border-dashed border-zinc-800 rounded-xl">
            No promo codes created yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-zinc-800">
            <table className="w-full text-xs">
              <thead className="bg-zinc-900 border-b border-zinc-800">
                <tr>
                  {['Code', 'Discount', 'Min. Order', 'Expiry', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {coupons.map(coupon => (
                  <tr key={coupon.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-brand-gold tracking-wider">{coupon.code}</td>
                    <td className="px-4 py-3 text-white font-semibold">₹{coupon.discount_amount} Off</td>
                    <td className="px-4 py-3 text-zinc-400">
                      {coupon.min_order_amount > 0 ? `₹${coupon.min_order_amount}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{coupon.expiry_date || '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggle(coupon)}
                        className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${coupon.status === 'active' ? 'text-emerald-400' : 'text-zinc-500'}`}>
                        {coupon.status === 'active' ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        {coupon.status}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(coupon)}
                          className="p-1.5 text-zinc-500 hover:text-brand-gold hover:bg-brand-gold/10 rounded transition-colors cursor-pointer">
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => handleDelete(coupon.id)}
                          className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCoupons;
