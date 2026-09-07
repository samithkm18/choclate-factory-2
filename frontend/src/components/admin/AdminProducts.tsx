import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Save, X, Image as ImageIcon, Video, FileVideo, RefreshCw } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  stock: number;
  category: string;
  description: string;
  images: string;
  video_url: string;
  video_thumbnail: string;
  is_new: number;
}

interface Props {
  token: string;
  role: 'owner' | 'mwc';
}

export const AdminProducts: React.FC<Props> = ({ token, role }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('Dark Chocolate');
  const [description, setDescription] = useState('');
  const [isNew, setIsNew] = useState(false);

  // File states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoThumbnailFile, setVideoThumbnailFile] = useState<File | null>(null);

  // Preview states
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
  const [thumbPreviewUrl, setThumbPreviewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const apiBase = `http://localhost:5000/api/${role}`;

  // File validations
  const validateImage = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      alert("Invalid image file format. Supported: JPG, JPEG, PNG, WEBP, SVG");
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image file size exceeds 5MB limit.");
      return false;
    }
    return true;
  };

  const validateVideo = (file: File): boolean => {
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      alert("Invalid video file format. Supported: MP4, WebM, MOV");
      return false;
    }
    if (file.size > 50 * 1024 * 1024) {
      alert("Video file size exceeds 50MB limit.");
      return false;
    }
    return true;
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setProducts(await res.json());
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [token, role]);

  const handleEditClick = (p: Product) => {
    setEditId(p.id);
    setName(p.name);
    setSlug(p.slug);
    setPrice(p.price.toString());
    setStock(p.stock.toString());
    setCategory(p.category);
    setDescription(p.description || '');
    setIsNew(p.is_new === 1);

    // Set preview URLs
    const imgArr = Array.isArray(p.images) ? p.images : (p.images && typeof p.images === 'string' && p.images.startsWith('[') ? JSON.parse(p.images) : (p.images ? [p.images] : []));
    const firstImg = imgArr[0] || '';
    setImagePreviewUrl(firstImg ? (firstImg.startsWith('/') ? `http://localhost:5000${firstImg}` : firstImg) : '');
    setVideoPreviewUrl(p.video_url ? (p.video_url.startsWith('/') ? `http://localhost:5000${p.video_url}` : p.video_url) : '');
    setThumbPreviewUrl(p.video_thumbnail ? (p.video_thumbnail.startsWith('/') ? `http://localhost:5000${p.video_thumbnail}` : p.video_thumbnail) : '');

    setImageFile(null);
    setVideoFile(null);
    setVideoThumbnailFile(null);
  };

  const handleClearForm = () => {
    setEditId(null);
    setName('');
    setSlug('');
    setPrice('');
    setStock('');
    setCategory('Dark Chocolate');
    setDescription('');
    setIsNew(false);
    setImageFile(null);
    setVideoFile(null);
    setVideoThumbnailFile(null);
    setImagePreviewUrl('');
    setVideoPreviewUrl('');
    setThumbPreviewUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug || !price || !stock) return;

    // Validate files
    if (imageFile && !validateImage(imageFile)) return;
    if (videoFile && !validateVideo(videoFile)) return;
    if (videoThumbnailFile && !validateImage(videoThumbnailFile)) return;

    setIsUploading(true);
    setUploadProgress(10);
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => (prev >= 90 ? 90 : prev + 15));
    }, 180);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('slug', slug);
    formData.append('price', price);
    formData.append('stock', stock);
    formData.append('category', category);
    formData.append('description', description);
    formData.append('is_new', isNew ? '1' : '0');

    if (imageFile) formData.append('image', imageFile);
    if (videoFile) formData.append('video', videoFile);
    if (videoThumbnailFile) formData.append('video_thumbnail', videoThumbnailFile);

    const url = editId ? `${apiBase}/products/${editId}` : `${apiBase}/products`;
    const method = editId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (res.ok) {
        setTimeout(() => {
          setIsUploading(false);
          handleClearForm();
          loadProducts();
        }, 400);
      } else {
        setIsUploading(false);
        const errData = await res.json();
        alert(errData.message || 'Error saving product details.');
      }
    } catch (err) {
      clearInterval(progressInterval);
      setIsUploading(false);
      console.error('Error saving product:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this chocolate?')) return;
    try {
      const res = await fetch(`${apiBase}/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        loadProducts();
      }
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  if (loading) {
    return <div className="text-zinc-500 text-xs py-10">Loading catalog management...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
      
      {/* Products list */}
      <div className="lg:col-span-7 space-y-6">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
          <h3 className="text-sm font-serif font-extrabold uppercase tracking-widest text-brand-gold">
            Chocolate Inventory List
          </h3>
          <span className="text-[10px] text-zinc-500 font-bold uppercase">{products.length} Items</span>
        </div>

        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
          {products.map((p) => {
            const imgArr = Array.isArray(p.images) ? p.images : (p.images && typeof p.images === 'string' && p.images.startsWith('[') ? JSON.parse(p.images) : (p.images ? [p.images] : []));
            const displayImg = imgArr[0] || '/assets/products/placeholder.jpg';
            const imgUrl = displayImg.startsWith('/') ? `http://localhost:5000${displayImg}` : displayImg;

            return (
              <div key={p.id} className="bg-black/25 border border-zinc-800/80 p-4 rounded-2xl flex justify-between items-center shadow-md">
                <div className="flex items-center gap-3">
                  <img 
                    src={imgUrl} 
                    alt={p.name} 
                    className="w-12 h-12 object-contain bg-zinc-900 border border-zinc-800 rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/products/placeholder.jpg';
                    }}
                  />
                  <div>
                    <h4 className="text-xs font-serif font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      {p.name}
                      {p.is_new === 1 && (
                        <span className="text-[7px] text-brand-gold bg-brand-gold/10 border border-brand-gold/25 px-1 py-0.5 rounded font-extrabold tracking-widest uppercase">
                          New
                        </span>
                      )}
                    </h4>
                    <p className="text-[9px] text-zinc-500 uppercase mt-0.5">{p.category} | SKU: {p.slug}</p>
                    <p className="text-[9px] text-zinc-400 font-serif mt-1">₹{p.price} | Stock: <span className={p.stock < 15 ? 'text-red-400 font-extrabold' : 'text-zinc-300'}>{p.stock} units</span></p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditClick(p)}
                    className="p-2 border border-zinc-800 hover:border-brand-gold hover:text-brand-gold bg-zinc-950/40 rounded-lg transition-colors cursor-pointer text-zinc-400"
                    title="Edit chocolate parameters"
                  >
                    <Edit size={12} />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-2 border border-zinc-800 hover:border-red-900 hover:text-red-400 bg-zinc-950/40 rounded-lg transition-colors cursor-pointer text-zinc-400"
                    title="Delete chocolate"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Product Form */}
      <div className="lg:col-span-5 space-y-6">
        <div className="border-b border-zinc-800 pb-3">
          <h3 className="text-sm font-serif font-extrabold uppercase tracking-widest text-brand-gold">
            {editId ? 'Modify Chocolate' : 'Add New Chocolate'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-black/10 border border-zinc-800/80 p-5 rounded-2xl">
          
          {isUploading && (
            <div className="bg-zinc-950 border border-brand-gold/25 p-3 rounded-xl space-y-1 text-center">
              <div className="flex justify-between text-[9px] uppercase tracking-widest font-bold">
                <span className="text-brand-gold flex items-center gap-1.5"><RefreshCw size={10} className="animate-spin" /> Uploading media assets</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                <div className="h-full bg-brand-gold transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[9px] text-zinc-400 uppercase tracking-widest font-bold mb-1">Chocolate Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!editId) setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
              }}
              placeholder="e.g. Saffron Marzipan Velvet"
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-brand-gold px-3.5 py-2 rounded-lg text-xs text-white outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[9px] text-zinc-400 uppercase tracking-widest font-bold mb-1">Unique Slug (SKU) *</label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. saffron-marzipan-velvet"
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-brand-gold px-3.5 py-2 rounded-lg text-xs text-white outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] text-zinc-400 uppercase tracking-widest font-bold mb-1">Price (INR) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 1250"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-brand-gold px-3 py-2 rounded-lg text-xs text-white outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-[9px] text-zinc-400 uppercase tracking-widest font-bold mb-1">Stock Qty *</label>
              <input
                type="number"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="e.g. 100"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-brand-gold px-3 py-2 rounded-lg text-xs text-white outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[9px] text-zinc-400 uppercase tracking-widest font-bold mb-1">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-brand-gold px-3 py-2 rounded-lg text-xs text-white outline-none transition-colors cursor-pointer"
            >
              <option value="Dark Chocolate">Dark Chocolate</option>
              <option value="Milk Chocolate">Milk Chocolate</option>
              <option value="White Chocolate">White Chocolate</option>
              <option value="Truffles & Pralines">Truffles & Pralines</option>
            </select>
          </div>

          <div>
            <label className="block text-[9px] text-zinc-400 uppercase tracking-widest font-bold mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short flavor profiling details..."
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-brand-gold px-3 py-2 rounded-lg text-xs text-white outline-none resize-none font-sans"
            />
          </div>

          <div className="flex items-center gap-2 py-1">
            <input
              type="checkbox"
              id="is_new_mwc"
              checked={isNew}
              onChange={(e) => setIsNew(e.target.checked)}
              className="w-4 h-4 rounded text-brand-gold"
            />
            <label htmlFor="is_new_mwc" className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold cursor-pointer select-none">
              Mark as New Arrival
            </label>
          </div>

          {/* Media inputs */}
          <div className="border border-zinc-800/80 rounded-xl p-3 bg-black/20 space-y-3">
            <span className="text-[8px] text-brand-gold uppercase tracking-widest font-extrabold block">Media Asset Uploads</span>
            
            {/* Image input */}
            <div>
              <label className="block text-[8px] text-zinc-500 uppercase tracking-wider font-bold mb-1">Label Artwork (Image)</label>
              <div 
                onClick={() => document.getElementById('mwc-image-file')?.click()}
                className="border border-dashed border-zinc-800 hover:border-brand-gold/40 rounded-lg p-3 text-center cursor-pointer transition-colors bg-zinc-950/20 text-[10px] text-zinc-400"
              >
                <input 
                  id="mwc-image-file"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && validateImage(file)) {
                      setImageFile(file);
                      setImagePreviewUrl(URL.createObjectURL(file));
                    }
                  }}
                  className="hidden"
                />
                {imagePreviewUrl ? (
                  <div className="flex items-center gap-2 text-left" onClick={(e) => e.stopPropagation()}>
                    <img src={imagePreviewUrl} alt="Label" className="w-8 h-8 object-contain rounded bg-zinc-900" />
                    <span className="truncate flex-1">{imageFile ? imageFile.name : 'Currently Saved Label'}</span>
                  </div>
                ) : (
                  <span className="flex items-center justify-center gap-1"><ImageIcon size={12} /> Choose Image</span>
                )}
              </div>
            </div>

            {/* Video input */}
            <div>
              <label className="block text-[8px] text-zinc-500 uppercase tracking-wider font-bold mb-1">Intro Video</label>
              <div 
                onClick={() => document.getElementById('mwc-video-file')?.click()}
                className="border border-dashed border-zinc-800 hover:border-brand-gold/40 rounded-lg p-3 text-center cursor-pointer transition-colors bg-zinc-950/20 text-[10px] text-zinc-400"
              >
                <input 
                  id="mwc-video-file"
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && validateVideo(file)) {
                      setVideoFile(file);
                      setVideoPreviewUrl(URL.createObjectURL(file));
                    }
                  }}
                  className="hidden"
                />
                {videoPreviewUrl ? (
                  <div className="flex items-center gap-2 text-left" onClick={(e) => e.stopPropagation()}>
                    <FileVideo size={16} className="text-brand-gold" />
                    <span className="truncate flex-1">{videoFile ? videoFile.name : 'Currently Saved Video'}</span>
                  </div>
                ) : (
                  <span className="flex items-center justify-center gap-1"><Video size={12} /> Choose Video</span>
                )}
              </div>
            </div>

            {/* Video thumbnail input */}
            <div>
              <label className="block text-[8px] text-zinc-500 uppercase tracking-wider font-bold mb-1">Video Poster (Thumbnail)</label>
              <div 
                onClick={() => document.getElementById('mwc-thumb-file')?.click()}
                className="border border-dashed border-zinc-800 hover:border-brand-gold/40 rounded-lg p-3 text-center cursor-pointer transition-colors bg-zinc-950/20 text-[10px] text-zinc-400"
              >
                <input 
                  id="mwc-thumb-file"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && validateImage(file)) {
                      setVideoThumbnailFile(file);
                      setThumbPreviewUrl(URL.createObjectURL(file));
                    }
                  }}
                  className="hidden"
                />
                {thumbPreviewUrl ? (
                  <div className="flex items-center gap-2 text-left" onClick={(e) => e.stopPropagation()}>
                    <img src={thumbPreviewUrl} alt="Thumbnail" className="w-8 h-8 object-contain rounded bg-zinc-900" />
                    <span className="truncate flex-1">{videoThumbnailFile ? videoThumbnailFile.name : 'Currently Saved Thumbnail'}</span>
                  </div>
                ) : (
                  <span className="flex items-center justify-center gap-1"><ImageIcon size={12} /> Choose Thumbnail</span>
                )}
              </div>
            </div>

          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isUploading}
              className="flex-grow bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark font-extrabold py-3.5 rounded-xl text-[10px] uppercase tracking-widest transition-colors shadow-md shadow-brand-gold/10 cursor-pointer inline-flex items-center justify-center gap-1 disabled:opacity-50"
            >
              <Save size={12} /> Save Chocolate
            </button>
            {editId && (
              <button
                type="button"
                onClick={handleClearForm}
                className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-xl text-[10px] uppercase tracking-widest transition-colors cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </form>
      </div>

    </div>
  );
};

export default AdminProducts;
