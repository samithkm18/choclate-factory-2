import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, ArrowLeft, Eye, Zap, Star, Package, Leaf, FlaskConical, Send } from 'lucide-react';
import ThreeDChocolate from '../components/ThreeDChocolate';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTranslation } from 'react-i18next';
import { getTranslatedProductName, getTranslatedProductDesc } from '../utils/translator';

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  dietary_tags: string[];
  flavor_profile: { cocoa: number; sweetness: number; notes: string[] };
  video_url: string;
  video_thumbnail: string;
  fallback_ingredients: string[];
  images: string[];
  cocoa_percentage: number;
  weight: string;
  origin: string;
  allergens: string[];
  specifications: { packaging?: string; shelf_life?: string; storage?: string };
  nutrition: { calories?: string; fat?: string; sugar?: string; protein?: string };
  is_bestseller?: boolean;
  delivery_charge?: number;
  expected_delivery_date?: string;
  cancellation_deadline?: string;
  cod_available?: boolean;
}

const fallbackDetails: Record<string, Product> = {
  'venezuelan-criollo-dark-bar': {
    id: 1,
    name: 'Venezuelan Criollo Dark Bar',
    slug: 'venezuelan-criollo-dark-bar',
    description: '75% single-origin cocoa harvested from Sur del Lago estate, tempered with 24k edible gold flakes.',
    price: 34,
    stock: 25,
    category: 'Dark Chocolate',
    dietary_tags: ['vegan', 'organic'],
    flavor_profile: { cocoa: 75, sweetness: 20, notes: ['Woody', 'Vanilla', 'Floral'] },
    video_url: '',
    video_thumbnail: '',
    fallback_ingredients: ['Criollo Cocoa Mass', 'Organic Cocoa Butter', 'Raw Cane Sugar', '24k Gold Leaf'],
    images: ['/assets/products/venezuelan-criollo-dark-bar-1.jpg'],
    cocoa_percentage: 75,
    weight: '100g',
    origin: 'Venezuela',
    allergens: ['May contain trace tree nuts'],
    specifications: { packaging: 'Embossed Gold Foil & Velvet Box', shelf_life: '12 Months', storage: 'Store at 16°C – 18°C' },
    nutrition: { calories: '540 kcal', fat: '38g', sugar: '18g', protein: '8g' }
  },
  'royal-golden-pistachio-truffles': {
    id: 2,
    name: 'Royal Golden Pistachio Truffles',
    slug: 'royal-golden-pistachio-truffles',
    description: 'Iranian pistachio paste infused inside Swiss white chocolate ganache.',
    price: 48,
    stock: 15,
    category: 'Milk Chocolate',
    dietary_tags: ['contains-nuts'],
    flavor_profile: { cocoa: 45, sweetness: 60, notes: ['Nutty', 'Creamy', 'Cardamom'] },
    video_url: '',
    video_thumbnail: '',
    fallback_ingredients: ['Swiss Whole Milk Powder', 'Pistachio Cream', 'Cocoa Butter', 'Gold Dust'],
    images: ['/assets/products/royal-golden-pistachio-truffles-1.jpg'],
    cocoa_percentage: 45,
    weight: '150g',
    origin: 'Iran & Switzerland',
    allergens: ['Tree nuts (Pistachio)', 'Milk'],
    specifications: { packaging: 'Hexagonal Rigid Gift Box', shelf_life: '6 Months', storage: 'Refrigerate at 12°C' },
    nutrition: { calories: '580 kcal', fat: '42g', sugar: '32g', protein: '10g' }
  }
};

interface Review {
  _id: string;
  reviewer_name: string;
  rating: number;
  review_text: string;
  created_at: string;
}

export const ProductDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, userToken } = useAuth();
  const { addToCart, clearCart } = useCart();
  const { t, i18n } = useTranslation();

  const [product, setProduct] = useState<Product | null>(null);
  const [variant] = useState('Standard Bar (100g)');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewName, setReviewName] = useState(user?.name || '');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Wishlist state
  const [isWishlisted, setIsWishlisted] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('manis_wishlist');
      const wishlist: number[] = saved ? JSON.parse(saved) : [];
      return product ? wishlist.includes(product.id) : false;
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    fetch(`http://localhost:5000/api/products/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error('Product not found');
        return res.json();
      })
      .then(data => {
        setProduct(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Using fallback product detail:', err);
        if (slug && fallbackDetails[slug]) {
          setProduct(fallbackDetails[slug]);
        } else {
          setProduct(fallbackDetails['venezuelan-criollo-dark-bar']);
        }
        setLoading(false);
      });
  }, [slug]);

  // Fetch reviews when product loads
  useEffect(() => {
    if (!product) return;
    fetch(`http://localhost:5000/api/products/${product.id}/reviews`)
      .then(res => res.json())
      .then(data => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]));
  }, [product]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim() || !reviewName.trim()) return;
    setReviewSubmitting(true);
    try {
      const headers: any = { 'Content-Type': 'application/json' };
      if (userToken) headers['Authorization'] = `Bearer ${userToken}`;
      const res = await fetch(`http://localhost:5000/api/products/${product?.id}/reviews`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          reviewer_name: reviewName,
          rating: reviewRating,
          review_text: reviewText
        })
      });
      if (res.ok) {
        setReviewSuccess(true);
        setReviewText('');
        // Re-fetch reviews
        const updated = await fetch(`http://localhost:5000/api/products/${product?.id}/reviews`);
        const data = await updated.json();
        setReviews(Array.isArray(data) ? data : []);
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to submit review.');
      }
    } catch {
      alert('Network error submitting review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  useEffect(() => {
    if (!product) return;
    try {
      const saved = localStorage.getItem('manis_wishlist');
      const list: number[] = saved ? JSON.parse(saved) : [];
      setIsWishlisted(list.includes(product.id));
    } catch (e) {}
  }, [product]);

  const toggleWishlist = async () => {
    if (!product) return;
    const newWishlistState = !isWishlisted;
    setIsWishlisted(newWishlistState);

    try {
      const saved = localStorage.getItem('manis_wishlist');
      let list: number[] = saved ? JSON.parse(saved) : [];
      if (newWishlistState) {
        if (!list.includes(product.id)) list.push(product.id);
      } else {
        list = list.filter(id => id !== product.id);
      }
      localStorage.setItem('manis_wishlist', JSON.stringify(list));
    } catch (e) {}

    if (user && userToken) {
      const method = isWishlisted ? 'DELETE' : 'POST';
      const url = `http://localhost:5000/api/products/${product.id}/wishlist`;
      try {
        await fetch(url, {
          method,
          headers: { 'Authorization': `Bearer ${userToken}` }
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: `${product.slug}-${variant}`,
        productId: product.id,
        name: getTranslatedProductName(product.name, i18n.language),
        price: product.price,
        image: product.images?.[0] || `/assets/products/${product.slug}-1.jpg`,
        variant
      });
    }
  };

  const handleDirectOrder = () => {
    if (!product) return;
    clearCart();
    addToCart({
      id: `${product.slug}-${variant}-direct`,
      productId: product.id,
      name: getTranslatedProductName(product.name, i18n.language),
      price: product.price,
      image: product.images?.[0] || `/assets/products/${product.slug}-1.jpg`,
      variant
    });
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-8 h-8 border-2 border-brand-gold/30 border-t-brand-gold rounded-full animate-spin" />
        <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Unlocking Product Reserve...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto py-32 px-6 text-center space-y-4">
        <h2 className="text-2xl font-serif text-brand-gold uppercase">Product Not Found</h2>
        <Link to="/shop" className="text-xs text-brand-gold font-bold uppercase hover:underline block">
          Return to Shop
        </Link>
      </div>
    );
  }

  const modelType = product.slug.includes('raspberry') ? 'raspberry' : product.slug.includes('symphony') ? 'milk' : 'dark';
  const translatedName = getTranslatedProductName(product.name, i18n.language);
  const translatedDesc = getTranslatedProductDesc(product.description, product.name, i18n.language);

  return (
    <div className="max-w-7xl mx-auto py-12 md:py-24 px-4 sm:px-6 md:px-12 font-sans overflow-x-hidden text-left">
      
      {/* Back button */}
      <Link 
        to="/shop" 
        className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-brand-gold uppercase tracking-widest font-bold mb-8 transition-colors"
      >
        <ArrowLeft size={14} /> {t('product.back_to_catalog')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">
        
        {/* Left Column: 3D Canvas Preview */}
        <div className="lg:col-span-6 bg-brand-panelBg border border-brand-maroon/20 rounded-3xl p-6 relative overflow-hidden flex flex-col items-center justify-center min-h-[350px] md:min-h-[480px]">
          
          {/* Wishlist Button */}
          <button 
            onClick={toggleWishlist}
            className={`absolute top-4 right-4 z-20 p-3 rounded-full border transition-all cursor-pointer shadow-lg ${
              isWishlisted 
                ? 'bg-red-500/20 border-red-500/60 text-red-500' 
                : 'bg-brand-darkBg/80 border-white/10 text-zinc-400 hover:text-red-400'
            }`}
            title={isWishlisted ? t('shop.wishlisted') : t('shop.wishlist')}
          >
            <Heart size={18} fill={isWishlisted ? '#EF4444' : 'none'} className={isWishlisted ? 'text-red-500' : ''} />
          </button>

          <div className="w-full h-80 md:h-96 relative flex items-center justify-center">
            <ThreeDChocolate type={modelType as any} interactive={true} />
          </div>

          <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-4">
            <Eye size={12} className="text-brand-gold" /> Drag 3D bar to inspect artisanal tempering
          </div>
        </div>

        {/* Right Column: Information & Actions */}
        <div className="lg:col-span-6 space-y-6 md:space-y-8">
          
          <div className="space-y-3 border-b border-brand-maroon/20 pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-brand-gold uppercase tracking-[0.3em] font-extrabold block">
                {product.category}
              </span>
              {product.is_bestseller && (
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest bg-brand-gold text-brand-maroonDark border border-brand-gold shadow-md">
                  BESTSELLER
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-5xl font-serif text-white uppercase tracking-wider font-bold leading-tight">
              {translatedName}
            </h1>
            <div className="flex items-center gap-4 pt-2">
              <span className="text-3xl font-extrabold text-brand-goldLight">₹{product.price}</span>
              {(() => {
                const stockQty = product.stock !== undefined ? product.stock : 10;
                const isLowStock = stockQty > 0 && stockQty <= 5;
                const isOutOfStock = stockQty <= 0;
                const stockLabel = isOutOfStock ? 'OUT OF STOCK' : isLowStock ? 'LOW STOCK' : 'HIGH STOCK';
                const stockStyle = isOutOfStock
                  ? 'bg-red-500/20 text-red-400 border-red-500/40'
                  : isLowStock
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
                return (
                  <span className={`text-[10px] border px-3 py-1 rounded-full uppercase tracking-wider font-extrabold ${stockStyle}`}>
                    {stockLabel} ({stockQty} units)
                  </span>
                );
              })()}
            </div>
          </div>

          <p className="text-xs md:text-sm text-zinc-300 leading-relaxed">
            {translatedDesc}
          </p>

          {/* Delivery & Cancellation Information */}
          <div className="bg-brand-panelBg border border-brand-maroon/20 rounded-2xl p-4 space-y-2 text-xs text-zinc-300">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-zinc-400 uppercase tracking-wider text-[10px]">Delivery Charge:</span>
              <span className="font-extrabold text-brand-goldLight">
                {product.delivery_charge && product.delivery_charge > 0 ? `₹${product.delivery_charge}` : 'FREE'}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-zinc-400 uppercase tracking-wider text-[10px]">Expected Delivery Date:</span>
              <span className="font-semibold text-white">{product.expected_delivery_date || '3-5 Business Days'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 uppercase tracking-wider text-[10px]">Cancellation Deadline:</span>
              <span className="font-semibold text-white">{product.cancellation_deadline || 'Within 24 hours of order placement'}</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <label className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Qty</label>
              <div className="flex items-center border border-brand-gold/30 rounded-lg bg-brand-panelBg overflow-hidden">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3.5 py-2 text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer font-bold"
                >
                  -
                </button>
                <span className="px-4 py-2 text-xs text-brand-gold font-bold">{quantity}</span>
                <button 
                  onClick={() => setQuantity(Math.min(product.stock !== undefined ? product.stock : 99, quantity + 1))}
                  className="px-3.5 py-2 text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button 
                onClick={handleAddToCart}
                className="py-3.5 px-6 bg-brand-darkBg border border-brand-gold/40 hover:border-brand-gold text-brand-gold hover:bg-brand-gold/10 font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <ShoppingCart size={15} /> {t('product.add_to_cart')}
              </button>
              <button 
                onClick={handleDirectOrder}
                className="py-3.5 px-6 bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap size={15} /> {t('product.direct_order')}
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* ─── Product Specifications & Nutrition ─── */}
      <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Specifications */}
        <div className="bg-brand-panelBg border border-brand-maroon/20 rounded-3xl p-6 space-y-4">
          <h2 className="text-xs font-extrabold text-brand-gold uppercase tracking-[0.25em] flex items-center gap-2">
            <Package size={13} /> Product Specifications
          </h2>
          <div className="space-y-2 text-xs text-zinc-300">
            {product.name && (
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Name</span>
                <span className="font-semibold text-white">{product.name}</span>
              </div>
            )}
            {product.weight && (
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Weight</span>
                <span className="font-semibold text-white">{product.weight}</span>
              </div>
            )}
            {product.category && (
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Category / Type</span>
                <span className="font-semibold text-white">{product.category}</span>
              </div>
            )}
            {product.cocoa_percentage > 0 && (
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Cocoa %</span>
                <span className="font-semibold text-white">{product.cocoa_percentage}%</span>
              </div>
            )}
            {product.origin && (
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Origin</span>
                <span className="font-semibold text-white">{product.origin}</span>
              </div>
            )}
            {product.specifications?.shelf_life && (
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Shelf Life</span>
                <span className="font-semibold text-white">{product.specifications.shelf_life}</span>
              </div>
            )}
            {product.specifications?.packaging && (
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Packaging</span>
                <span className="font-semibold text-white">{product.specifications.packaging}</span>
              </div>
            )}
            {product.specifications?.storage && (
              <div className="flex justify-between pb-2">
                <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Storage</span>
                <span className="font-semibold text-white">{product.specifications.storage}</span>
              </div>
            )}
            {product.fallback_ingredients && product.fallback_ingredients.length > 0 && (
              <div className="pt-2">
                <span className="text-zinc-500 uppercase tracking-wider text-[10px] block mb-1.5">Ingredients</span>
                <p className="text-zinc-300 text-[11px] leading-relaxed">{product.fallback_ingredients.join(', ')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Nutritional Information */}
        <div className="bg-brand-panelBg border border-brand-maroon/20 rounded-3xl p-6 space-y-4">
          <h2 className="text-xs font-extrabold text-brand-gold uppercase tracking-[0.25em] flex items-center gap-2">
            <FlaskConical size={13} /> Nutritional Information
          </h2>
          {product.nutrition && Object.keys(product.nutrition).some(k => !!(product.nutrition as any)[k]) ? (
            <div className="space-y-2 text-xs text-zinc-300">
              {product.nutrition.calories && (
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Calories</span>
                  <span className="font-semibold text-white">{product.nutrition.calories}</span>
                </div>
              )}
              {product.nutrition.fat && (
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Total Fat</span>
                  <span className="font-semibold text-white">{product.nutrition.fat}</span>
                </div>
              )}
              {product.nutrition.sugar && (
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Sugar</span>
                  <span className="font-semibold text-white">{product.nutrition.sugar}</span>
                </div>
              )}
              {product.nutrition.protein && (
                <div className="flex justify-between pb-2">
                  <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Protein</span>
                  <span className="font-semibold text-white">{product.nutrition.protein}</span>
                </div>
              )}
              {(product.nutrition as any).serving_size && (
                <div className="flex justify-between pt-2 border-t border-white/5">
                  <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Serving Size</span>
                  <span className="font-semibold text-white">{(product.nutrition as any).serving_size}</span>
                </div>
              )}
              <p className="text-[10px] text-zinc-600 pt-2">Per serving (approx. 30g). Values may vary.</p>
            </div>
          ) : (
            <p className="text-xs text-zinc-600 italic">Nutritional details not available for this product.</p>
          )}

          {/* Dietary Tags */}
          {product.dietary_tags && product.dietary_tags.length > 0 && (
            <div className="pt-3 border-t border-white/5">
              <span className="text-zinc-500 uppercase tracking-wider text-[10px] flex items-center gap-1.5 mb-2">
                <Leaf size={10} /> Dietary
              </span>
              <div className="flex flex-wrap gap-1.5">
                {product.dietary_tags.map((tag, i) => (
                  <span key={i} className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Customer Reviews ─── */}
      <div className="mt-10 md:mt-14 space-y-6">
        <h2 className="text-xs font-extrabold text-brand-gold uppercase tracking-[0.25em] flex items-center gap-2">
          <Star size={13} /> Customer Reviews
        </h2>

        {reviews.length === 0 ? (
          <p className="text-xs text-zinc-600 italic">No reviews yet. Be the first to share your experience!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviews.map((r) => (
              <div key={r._id} className="bg-brand-panelBg border border-brand-maroon/20 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">{r.reviewer_name}</span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={10} className={i < r.rating ? 'text-brand-gold fill-brand-gold' : 'text-zinc-700'} />
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">{r.review_text}</p>
                <span className="text-[9px] text-zinc-600">{new Date(r.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
            ))}
          </div>
        )}

        {/* Write a Review */}
        <div className="bg-brand-panelBg border border-brand-maroon/20 rounded-3xl p-6 space-y-4 max-w-xl">
          <h3 className="text-xs font-extrabold text-brand-gold uppercase tracking-[0.2em]">Write a Review</h3>
          {reviewSuccess ? (
            <div className="text-emerald-400 text-xs font-bold py-4 text-center">✓ Your review has been submitted. Thank you!</div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-3">
              <div>
                <label className="block text-[9px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Your Name *</label>
                <input
                  type="text"
                  value={reviewName}
                  onChange={e => setReviewName(e.target.value)}
                  required
                  placeholder="Your name"
                  className="w-full bg-brand-darkBg border border-brand-gold/20 focus:border-brand-gold rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-[9px] text-zinc-500 uppercase tracking-widest font-bold mb-1.5">Rating *</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="cursor-pointer"
                    >
                      <Star size={18} className={star <= reviewRating ? 'text-brand-gold fill-brand-gold' : 'text-zinc-700'} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[9px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Review *</label>
                <textarea
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  required
                  rows={4}
                  placeholder="Share your experience with this product..."
                  className="w-full bg-brand-darkBg border border-brand-gold/20 focus:border-brand-gold rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={reviewSubmitting}
                className="w-full bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark font-extrabold py-3 rounded-xl text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Send size={12} /> {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}
        </div>
      </div>

    </div>
  );
};

export default ProductDetail;
