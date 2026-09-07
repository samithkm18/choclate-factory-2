import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, ToggleLeft, ToggleRight } from 'lucide-react';

interface Location {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  description: string | null;
  status: 'active' | 'inactive';
  created_at: string;
}

interface AdminLocationsProps {
  token: string;
  role: 'owner' | 'mwc';
}

const API_PREFIX = (role: 'owner' | 'mwc') => `http://localhost:5000/api/${role}`;

const emptyForm = () => ({
  name: '',
  address: '',
  latitude: '',
  longitude: '',
  phone: '',
  description: '',
  status: 'active' as 'active' | 'inactive'
});

const AdminLocations: React.FC<AdminLocationsProps> = ({ token, role }) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [form, setForm] = useState(emptyForm());
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_PREFIX(role)}/locations`, { headers });
      if (res.ok) setLocations(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLocations(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        name: form.name,
        address: form.address,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        phone: form.phone || null,
        description: form.description || null,
        status: form.status
      };
      const url = editId ? `${API_PREFIX(role)}/locations/${editId}` : `${API_PREFIX(role)}/locations`;
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      if (res.ok) {
        setForm(emptyForm());
        setEditId(null);
        await fetchLocations();
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

  const handleEdit = (loc: Location) => {
    setEditId(loc.id);
    setForm({
      name: loc.name,
      address: loc.address,
      latitude: loc.latitude.toString(),
      longitude: loc.longitude.toString(),
      phone: loc.phone || '',
      description: loc.description || '',
      status: loc.status
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this location permanently?')) return;
    try {
      const res = await fetch(`${API_PREFIX(role)}/locations/${id}`, { method: 'DELETE', headers });
      if (res.ok) setLocations(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggle = async (loc: Location) => {
    const newStatus = loc.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`${API_PREFIX(role)}/locations/${loc.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ ...loc, status: newStatus })
      });
      if (res.ok) {
        setLocations(prev => prev.map(l => l.id === loc.id ? { ...l, status: newStatus } : l));
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
          <MapPin size={14} className="text-brand-gold" />
          {editId ? 'Edit Location' : 'Add New Location'}
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Location Name *</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className={inputCls} placeholder="e.g. Mani's Flagship Store" required />
          </div>
          <div>
            <label className={labelCls}>Full Address *</label>
            <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
              className={inputCls} placeholder="e.g. 42 Chocolate Lane, Kozhikode" required />
          </div>
          <div>
            <label className={labelCls}>Latitude *</label>
            <input type="number" step="any" value={form.latitude}
              onChange={e => setForm(p => ({ ...p, latitude: e.target.value }))}
              className={inputCls} placeholder="e.g. 11.2588" required />
          </div>
          <div>
            <label className={labelCls}>Longitude *</label>
            <input type="number" step="any" value={form.longitude}
              onChange={e => setForm(p => ({ ...p, longitude: e.target.value }))}
              className={inputCls} placeholder="e.g. 75.7804" required />
          </div>
          <div>
            <label className={labelCls}>Phone (optional)</label>
            <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              className={inputCls} placeholder="+91 98765 43210" />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as 'active' | 'inactive' }))}
              className={inputCls}>
              <option value="active">Active (shown on map)</option>
              <option value="inactive">Inactive (hidden)</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Description (optional)</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className={`${inputCls} h-16 resize-none`} placeholder="Opening hours, special notes, etc." />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving}
              className="px-6 py-2 bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark font-bold text-[10px] uppercase tracking-widest rounded-lg transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2">
              <Plus size={12} /> {saving ? 'Saving...' : editId ? 'Update Location' : 'Add Location'}
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

      {/* Locations Table */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
          {locations.length} Location{locations.length !== 1 ? 's' : ''} on Record
        </h3>
        {loading ? (
          <div className="text-zinc-600 text-xs py-8 text-center">Loading locations...</div>
        ) : locations.length === 0 ? (
          <div className="text-zinc-600 text-xs py-8 text-center border border-dashed border-zinc-800 rounded-xl">
            No locations added yet. Add your first store location above.
          </div>
        ) : (
          <div className="grid gap-4">
            {locations.map(loc => (
              <div key={loc.id} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-brand-gold shrink-0" />
                    <span className="font-bold text-white text-sm">{loc.name}</span>
                    <button onClick={() => handleToggle(loc)}
                      className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider cursor-pointer ml-2 ${loc.status === 'active' ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      {loc.status === 'active' ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      {loc.status}
                    </button>
                  </div>
                  <p className="text-zinc-400 text-xs">{loc.address}</p>
                  <div className="flex gap-3 text-[10px] text-zinc-500 font-mono">
                    <span>Lat: {loc.latitude}</span>
                    <span>Lng: {loc.longitude}</span>
                    {loc.phone && <span>📞 {loc.phone}</span>}
                  </div>
                  {loc.description && (
                    <p className="text-zinc-500 text-[10px] italic">{loc.description}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleEdit(loc)}
                    className="p-2 text-zinc-500 hover:text-brand-gold hover:bg-brand-gold/10 rounded-lg transition-colors cursor-pointer">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => handleDelete(loc.id)}
                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLocations;
