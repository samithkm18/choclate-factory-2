import React, { useState, useEffect } from 'react';
import { Trash2, Calendar, Link as LinkIcon } from 'lucide-react';

interface Poster {
  id: number;
  title: string;
  image_url: string;
  link_url?: string;
  start_date?: string;
  end_date?: string;
}

interface Props {
  token: string;
  role: 'owner' | 'mwc';
}

export const AdminPosters: React.FC<Props> = ({ token, role }) => {
  const [posters, setPosters] = useState<Poster[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const apiBase = `http://localhost:5000/api/${role}`;

  const loadPosters = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/posters`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setPosters(await res.json());
      }
    } catch (err) {
      console.error('Error loading posters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosters();
  }, [token, role]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreatePoster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !imageFile) {
      alert('Title and Image file are required.');
      return;
    }
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('image', imageFile);
    formData.append('link_url', linkUrl);
    formData.append('start_date', startDate);
    formData.append('end_date', endDate);

    try {
      const res = await fetch(`${apiBase}/posters`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        setTitle('');
        setLinkUrl('');
        setStartDate('');
        setEndDate('');
        setImageFile(null);
        setImagePreview('');
        loadPosters();
      } else {
        const data = await res.json();
        alert(data.message || 'Error uploading poster.');
      }
    } catch (err) {
      console.error('Error submitting poster:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this poster?')) return;
    try {
      const res = await fetch(`${apiBase}/posters/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        loadPosters();
      }
    } catch (err) {
      console.error('Error deleting poster:', err);
    }
  };

  if (loading) {
    return <div className="text-zinc-500 text-xs py-10">Loading posters manager...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
      
      {/* List section */}
      <div className="lg:col-span-8 space-y-6">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
          <h3 className="text-sm font-serif font-extrabold uppercase tracking-widest text-brand-gold">
            Published Announcement Posters
          </h3>
          <span className="text-[10px] text-zinc-500 font-bold uppercase">{posters.length} Active</span>
        </div>

        {posters.length === 0 ? (
          <div className="p-10 border border-zinc-800/80 rounded-2xl bg-black/25 text-center text-zinc-500 text-xs uppercase tracking-widest">
            No announcement posters active or scheduled.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posters.map((poster) => {
              const img = poster.image_url.startsWith('/') 
                ? `http://localhost:5000${poster.image_url}` 
                : poster.image_url;

              return (
                <div key={poster.id} className="border border-zinc-800 rounded-2xl bg-black/20 overflow-hidden flex flex-col justify-between shadow-xl">
                  <div className="aspect-[16/10] overflow-hidden bg-zinc-950 relative">
                    <img src={img} alt={poster.title} className="w-full h-full object-cover" />
                    
                    <button
                      onClick={() => handleDelete(poster.id)}
                      className="absolute top-3 right-3 p-2 bg-black/70 border border-zinc-800 hover:border-red-950 hover:bg-red-950 rounded-lg text-zinc-400 hover:text-red-400 transition-all cursor-pointer"
                      title="Delete poster"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  <div className="p-4 space-y-3">
                    <h4 className="text-xs font-serif font-bold text-white uppercase tracking-wider line-clamp-1">
                      {poster.title}
                    </h4>

                    <div className="space-y-1 text-[9px] text-zinc-400 font-semibold uppercase tracking-wider">
                      <div className="flex items-center gap-1.5"><Calendar size={11} className="text-brand-gold" /> {poster.start_date || 'N/A'} — {poster.end_date || 'N/A'}</div>
                      {poster.link_url && (
                        <div className="flex items-center gap-1.5"><LinkIcon size={11} className="text-brand-gold" /> <span className="line-clamp-1 lowercase text-zinc-500">{poster.link_url}</span></div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Editor Section */}
      <div className="lg:col-span-4 space-y-6">
        <div className="border-b border-zinc-800 pb-3">
          <h3 className="text-sm font-serif font-extrabold uppercase tracking-widest text-brand-gold">
            Upload Announcement
          </h3>
        </div>

        <form onSubmit={handleCreatePoster} className="space-y-4 bg-black/10 border border-zinc-800/80 p-5 rounded-2xl">
          <div>
            <label className="block text-[9px] text-zinc-400 uppercase tracking-widest font-bold mb-1">Poster Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Diwali Reserve Box Sale"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-brand-gold px-3.5 py-2 rounded-lg text-xs text-white outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[9px] text-zinc-400 uppercase tracking-widest font-bold mb-1">Click Link URL (Optional)</label>
            <input
              type="text"
              placeholder="e.g. /product/diwali-luxury-gold"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-brand-gold px-3.5 py-2 rounded-lg text-xs text-white outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] text-zinc-400 uppercase tracking-widest font-bold mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-brand-gold px-2.5 py-2 rounded-lg text-[10px] text-white outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-[9px] text-zinc-400 uppercase tracking-widest font-bold mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-brand-gold px-2.5 py-2 rounded-lg text-[10px] text-white outline-none transition-colors"
              />
            </div>
          </div>

          {/* File upload */}
          <div>
            <label className="block text-[9px] text-zinc-400 uppercase tracking-widest font-bold mb-1.5">Flyer Image (16:10 ratio) *</label>
            <input
              type="file"
              accept="image/*"
              required
              onChange={handleImageChange}
              className="w-full text-zinc-500 text-[10px]"
            />
          </div>

          {imagePreview && (
            <div className="aspect-[16/10] rounded-xl border border-zinc-800 overflow-hidden bg-zinc-950 mt-3">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark font-extrabold py-3.5 rounded-xl text-[10px] uppercase tracking-widest transition-colors shadow-md shadow-brand-gold/10 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Uploading Poster...' : 'Schedule Poster'}
          </button>
        </form>
      </div>

    </div>
  );
};

export default AdminPosters;
