import React, { useState, useEffect } from 'react';
import { Save, CheckCircle2 } from 'lucide-react';

interface UspItem {
  title: string;
  description: string;
}

interface Props {
  token: string;
  role: 'owner' | 'mwc';
}

export const AdminAbout: React.FC<Props> = ({ token, role }) => {
  const [story, setStory] = useState('');
  const [usps, setUsps] = useState<UspItem[]>([
    { title: '', description: '' },
    { title: '', description: '' },
    { title: '', description: '' }
  ]);
  const [qualityClaims, setQualityClaims] = useState('');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  const apiBase = `http://localhost:5000/api/${role}`;

  useEffect(() => {
    setLoading(true);
    fetch('http://localhost:5000/api/products/about/content')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setStory(data.story || '');
          setQualityClaims(data.quality_claims || '');
          if (Array.isArray(data.usps)) {
            const mapped = data.usps.map((u: any) => ({
              title: u.title || '',
              description: u.description || u.desc || ''
            }));
            setUsps(mapped);
          }
        }
      })
      .catch((err) => console.error('Error loading about details in admin:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleUspChange = (idx: number, field: keyof UspItem, val: string) => {
    setUsps((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiBase}/about`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          story,
          usps,
          quality_claims: qualityClaims,
          images: []
        })
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 4000);
      }
    } catch (err) {
      console.error('Error saving about us story:', err);
    }
  };

  if (loading) {
    return <div className="text-zinc-500 text-xs py-10">Loading About Us editor...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto text-left space-y-6">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
        <h3 className="text-sm font-serif font-extrabold uppercase tracking-widest text-brand-gold">
          About Us Brand Heritage Editor
        </h3>
      </div>

      <form onSubmit={handleSave} className="space-y-6 bg-black/10 border border-zinc-800/80 p-6 rounded-2xl">
        
        {/* Story */}
        <div className="space-y-1.5">
          <label className="block text-[9px] text-zinc-400 uppercase tracking-widest font-bold">Brand Heritage Story *</label>
          <textarea
            required
            rows={5}
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder="Introduce the brand's premium origins..."
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-brand-gold px-3.5 py-2.5 rounded-lg text-xs text-white outline-none transition-colors resize-none leading-relaxed font-sans"
          />
        </div>

        {/* Unique Selling Points */}
        <div className="space-y-3">
          <label className="block text-[9px] text-zinc-400 uppercase tracking-widest font-bold">Brand Core Pillars (USPs - Maximum 3)</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="border border-zinc-800/80 p-4 rounded-xl space-y-3 bg-zinc-950/20">
                <span className="text-[8px] text-brand-gold uppercase tracking-wider font-extrabold block">Pillar #{idx + 1}</span>
                
                <input
                  type="text"
                  required
                  placeholder="Pillar Title"
                  value={usps[idx]?.title || ''}
                  onChange={(e) => handleUspChange(idx, 'title', e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-brand-gold px-2.5 py-2 rounded-lg text-[10px] text-white outline-none transition-colors"
                />

                <textarea
                  rows={3}
                  required
                  placeholder="Details..."
                  value={usps[idx]?.description || ''}
                  onChange={(e) => handleUspChange(idx, 'description', e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-brand-gold px-2.5 py-2 rounded-lg text-[10px] text-white outline-none transition-colors resize-none leading-normal font-sans"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Quality claims */}
        <div className="space-y-1.5">
          <label className="block text-[9px] text-zinc-400 uppercase tracking-widest font-bold">Quality Claims & Certifications *</label>
          <input
            type="text"
            required
            value={qualityClaims}
            onChange={(e) => setQualityClaims(e.target.value)}
            placeholder="e.g. Fair Trade, 100% Organic Volcanic Soil, Edible Gold Leaf Dressed"
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-brand-gold px-3.5 py-2.5 rounded-lg text-xs text-white outline-none transition-colors"
          />
        </div>

        {saved && (
          <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 size={14} /> Brand details updated successfully!
          </div>
        )}

        <div className="text-right">
          <button
            type="submit"
            className="bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark font-extrabold px-8 py-3.5 rounded-xl text-[10px] uppercase tracking-widest transition-colors shadow-md shadow-brand-gold/10 cursor-pointer inline-flex items-center gap-1.5"
          >
            <Save size={12} /> Save Brand Story
          </button>
        </div>

      </form>
    </div>
  );
};

export default AdminAbout;
