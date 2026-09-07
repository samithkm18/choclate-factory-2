import React, { useState, useEffect } from 'react';
import { Save, Languages, Check } from 'lucide-react';

interface Props {
  token: string;
}

export const AdminTranslations: React.FC<Props> = ({ token }) => {
  const [selectedLang, setSelectedLang] = useState('hi');
  const [jsonText, setJsonText] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const loadTranslations = async (lang: string) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/mwc/translations/${lang}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setJsonText(JSON.stringify(data, null, 2));
      }
    } catch (err) {
      console.error('Error fetching translations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTranslations(selectedLang);
  }, [selectedLang, token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(jsonText);
      const res = await fetch(`http://localhost:5000/api/mwc/translations/${selectedLang}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(parsed)
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 4000);
      }
    } catch (err) {
      alert('Invalid JSON structure. Please correct syntax formatting errors.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto text-left space-y-6">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
        <h3 className="text-sm font-serif font-extrabold uppercase tracking-widest text-brand-gold flex items-center gap-2">
          <Languages size={16} /> i18n Translation Dictionary Editor
        </h3>
        
        {/* Language selector */}
        <select
          value={selectedLang}
          onChange={(e) => setSelectedLang(e.target.value)}
          className="bg-zinc-900 border border-brand-gold/25 focus:border-brand-gold px-3 py-1.5 rounded-lg text-xs text-white outline-none cursor-pointer"
        >
          <option value="en">English (en)</option>
          <option value="hi">Hindi (hi)</option>
          <option value="kn">Kannada (kn)</option>
          <option value="ta">Tamil (ta)</option>
          <option value="te">Telugu (te)</option>
        </select>
      </div>

      <form onSubmit={handleSave} className="space-y-4 bg-black/10 border border-zinc-800/80 p-5 rounded-2xl">
        <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-extrabold block">
          Locale Config File Resource: /src/locales/{selectedLang}.json
        </span>

        {loading ? (
          <div className="text-zinc-500 text-xs py-20 text-center">Loading locale files...</div>
        ) : (
          <textarea
            rows={18}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-brand-gold px-4 py-3 rounded-xl text-xs text-emerald-400 font-mono outline-none transition-colors leading-relaxed"
          />
        )}

        {saved && (
          <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Check size={14} /> Translations file updated successfully!
          </div>
        )}

        <div className="text-right">
          <button
            type="submit"
            disabled={loading}
            className="bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark font-extrabold px-8 py-3.5 rounded-xl text-[10px] uppercase tracking-widest transition-colors shadow-md shadow-brand-gold/10 cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save size={12} /> Overwrite Translations
          </button>
        </div>

      </form>
    </div>
  );
};

export default AdminTranslations;
