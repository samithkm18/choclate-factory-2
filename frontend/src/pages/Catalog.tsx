import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, Heart, ShoppingCart, RefreshCcw, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import ThreeDChocolate from '../components/ThreeDChocolate';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTranslation } from 'react-i18next';
import { getTranslatedProductName, getTranslatedProductDesc, getTranslatedCategory } from '../utils/translator';

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
}

// Fallback initial products if backend API is initializing
const fallbackProducts: Product[] = [
  {
    id: 1,
    name: 'Venezuelan Criollo Dark Bar',
    slug: 'venezuelan-criollo-dark-bar',
    description: '75% single-origin cocoa with 24k Venezuelan gold flakes and floral roasted notes.',
    price: 34,
    stock: 25,
    category: 'Dark Chocolate',
    dietary_tags: ['vegan', 'organic'],
    flavor_profile: { cocoa: 75, sweetness: 20, notes: ['Woody', 'Vanilla', 'Floral'] }
  },
  {
    id: 2,
    name: 'Royal Golden Pistachio Truffles',
    slug: 'royal-golden-pistachio-truffles',
    description: 'Iranian pistachio paste, white chocolate ganache, micro-sprinkled with crushed gold leaf.',
    price: 48,
    stock: 15,
    category: 'Milk Chocolate',
    dietary_tags: ['contains-nuts'],
    flavor_profile: { cocoa: 45, sweetness: 60, notes: ['Nutty', 'Creamy', 'Cardamom'] }
  },
  {
    id: 3,
    name: 'Symphony Milk Chocolate Bar',
    slug: 'symphony-milk-bar',
    description: 'Silky smooth alpine milk blend with single-farm cocoa butter.',
    price: 28,
    stock: 30,
    category: 'Milk Chocolate',
    dietary_tags: ['gluten-free'],
    flavor_profile: { cocoa: 40, sweetness: 65, notes: ['Caramel', 'Honey'] }
  },
  {
    id: 4,
    name: 'Raspberry Floral Infusion Bar',
    slug: 'raspberry-floral-infusion',
    description: 'Freeze-dried tart raspberries folded into 38% organic white cocoa.',
    price: 32,
    stock: 20,
    category: 'White Chocolate',
    dietary_tags: ['vegan', 'organic'],
    flavor_profile: { cocoa: 38, sweetness: 70, notes: ['Berry', 'Rose'] }
  }
];

export const Catalog: React.FC = () => {
  const { user, userToken } = useAuth();
  const { addToCart, clearCart } = useCart();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(100);
  const [selectedTag, setSelectedTag] = useState('');

  // Wishlist state (stored in localStorage for all customers & synced with API if logged in)
  const [wishlistIds, setWishlistIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('manis_wishlist');
      return saved ? JSON.parse(saved) : [1];
    } catch (e) {
      return [1];
    }
  });

  const [loading, setLoading] = useState(true);

  // Sync wishlist to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('manis_wishlist', JSON.stringify(wishlistIds));
    } catch (e) {}
  }, [wishlistIds]);

  // Fetch products based on filters
  useEffect(() => {
    setLoading(true);
    const calculatedMin = minPrice * 10;
    const calculatedMax = maxPrice === 100 ? 100000 : maxPrice * 50;
    let url = `http://localhost:5000/api/products?minPrice=${calculatedMin}&maxPrice=${calculatedMax}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;
    if (selectedTag) url += `&tags=${encodeURIComponent(selectedTag)}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProducts(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading products from backend, using fallback:', err);
        setLoading(false);
      });
  }, [search, category, minPrice, maxPrice, selectedTag]);

  // Sync authenticated backend wishlist if logged in
  useEffect(() => {
    if (!user || !userToken) return;

    fetch('http://localhost:5000/api/products/wishlist/me', {
      headers: { 'Authorization': `Bearer ${userToken}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const apiIds = data.map(item => item.id);
          setWishlistIds(prev => Array.from(new Set([...prev, ...apiIds])));
        }
      })
      .catch(err => console.error('Error fetching backend wishlist ids:', err));
  }, [user, userToken]);

  const toggleWishlist = async (productId: number) => {
    const isWishlisted = wishlistIds.includes(productId);
    
    // Update local state immediately
    setWishlistIds(prev =>
      isWishlisted ? prev.filter(id => id !== productId) : [...prev, productId]
    );

    // Sync with backend API if user token is available
    if (user && userToken) {
      const method = isWishlisted ? 'DELETE' : 'POST';
      const url = `http://localhost:5000/api/products/${productId}/wishlist`;
      try {
        await fetch(url, {
          method,
          headers: { 'Authorization': `Bearer ${userToken}` }
        });
      } catch (error) {
        console.error('Wishlist sync error:', error);
      }
    }
  };

  const handleAddToCart = (p: Product) => {
    addToCart({
      id: `${p.slug}-standard`,
      productId: p.id,
      name: getTranslatedProductName(p.name, i18n.language),
      price: p.price,
      image: `/assets/products/${p.slug}-1.jpg`,
      variant: 'Standard Box (100g)'
    });
  };

  const handleDirectOrder = (p: Product) => {
    clearCart();
    addToCart({
      id: `${p.slug}-direct`,
      productId: p.id,
      name: getTranslatedProductName(p.name, i18n.language),
      price: p.price,
      image: `/assets/products/${p.slug}-1.jpg`,
      variant: 'Standard Box (100g)'
    });
    navigate('/checkout');
  };

  const categories = ['Dark Chocolate', 'Milk Chocolate', 'White Chocolate', 'Botanical Chocolate'];
  const dietaryTags = ['vegan', 'gluten-free', 'organic', 'contains-nuts'];

  return (
    <div className="max-w-7xl mx-auto py-12 md:py-24 px-4 sm:px-6 md:px-12 font-sans overflow-x-hidden">
      
      {/* Header and Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-brand-maroon/20 pb-6 md:pb-8 mb-8 md:mb-10 text-left">
        <div>
          <span className="text-[10px] md:text-xs text-brand-gold uppercase tracking-[0.3em] font-semibold">
            {t('shop.atelier_title')}
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-serif mt-2 uppercase tracking-widest text-white font-bold">
            {t('shop.main_heading')}
          </h1>
        </div>
        
        {/* Dynamic Live Search Bar */}
        <div className="relative w-full md:w-80">
          <input 
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('shop.search_placeholder')}
            className="w-full bg-brand-panelBg/80 border border-brand-gold/25 focus:border-brand-gold rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none transition-colors"
          />
          <Search className="absolute left-3.5 top-3 text-zinc-500" size={15} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar Filters */}
        <aside className="lg:col-span-3 space-y-6 bg-brand-panelBg border border-brand-maroon/20 rounded-2xl p-5 md:p-6 h-fit text-left">
          <div className="flex items-center justify-between border-b border-brand-maroon/20 pb-3">
            <h3 className="text-xs text-brand-gold uppercase tracking-widest font-bold flex items-center gap-1.5">
              <SlidersHorizontal size={14} /> {t('shop.refine')}
            </h3>
            <button 
              onClick={() => { setCategory(''); setMinPrice(0); setMaxPrice(100); setSelectedTag(''); setSearch(''); }}
              className="text-[10px] text-zinc-500 hover:text-brand-gold transition-colors flex items-center gap-1 font-bold uppercase cursor-pointer"
            >
              <RefreshCcw size={10} /> {t('shop.reset')}
            </button>
          </div>

          {/* Categories Filter */}
          <div className="space-y-2">
            <h4 className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">Categories</h4>
            <div className="space-y-1">
              <button 
                onClick={() => setCategory('')}
                className={`w-full text-left py-1 text-xs transition-colors cursor-pointer ${category === '' ? 'text-brand-gold font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                {t('shop.categories.all')}
              </button>
              {categories.map((c, idx) => (
                <button
                  key={idx}
                  onClick={() => setCategory(c)}
                  className={`w-full text-left py-1 text-xs transition-colors cursor-pointer ${category === c ? 'text-brand-gold font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                  {getTranslatedCategory(c, i18n.language)}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-3">
            <div className="flex justify-between text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
              <span>{t('shop.price_range')}</span>
              <span className="text-brand-goldLight">₹{minPrice * 10} – ₹{maxPrice * 50}</span>
            </div>
            <input 
              type="range"
              min={0}
              max={100}
              step={5}
              value={maxPrice}
              onChange={e => setMaxPrice(parseInt(e.target.value))}
              className="w-full accent-brand-gold h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Dietary Tags */}
          <div className="space-y-2">
            <h4 className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">{t('shop.dietary_tags')}</h4>
            <div className="flex flex-wrap gap-1.5">
              {dietaryTags.map((tag, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                  className={`px-3 py-1 rounded-full text-[10px] font-semibold transition-colors border cursor-pointer ${
                    selectedTag === tag 
                      ? 'bg-brand-gold text-brand-maroonDark border-brand-gold' 
                      : 'bg-white/5 text-zinc-400 border-white/5 hover:border-brand-gold/30'
                  }`}
                >
                  {tag.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Catalog Grid */}
        <main className="lg:col-span-9">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Unlocking cellar reserve...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-brand-panelBg border border-brand-maroon/20 rounded-2xl">
              <p className="text-sm text-zinc-500 uppercase tracking-wider">{t('shop.no_products')}</p>
              <button 
                onClick={() => { setCategory(''); setMinPrice(0); setMaxPrice(100); setSelectedTag(''); setSearch(''); }}
                className="text-xs text-brand-gold font-bold uppercase mt-4 hover:underline cursor-pointer"
              >
                {t('shop.clear_filters')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map(p => {
                const isWishlisted = wishlistIds.includes(p.id);
                const modelType = p.slug.includes('raspberry') ? 'raspberry' : p.slug.includes('symphony') ? 'milk' : 'dark';
                const translatedName = getTranslatedProductName(p.name, i18n.language);
                const translatedDesc = getTranslatedProductDesc(p.description, p.name, i18n.language);
                const translatedCat = getTranslatedCategory(p.category, i18n.language);

                // Stock status computation
                const stockQty = p.stock !== undefined ? p.stock : 10;
                const isLowStock = stockQty > 0 && stockQty <= 5;
                const isOutOfStock = stockQty <= 0;
                const stockLabel = isOutOfStock ? 'OUT OF STOCK' : isLowStock ? 'LOW STOCK' : 'HIGH STOCK';
                const stockBadgeStyle = isOutOfStock
                  ? 'bg-red-500/20 text-red-400 border-red-500/40'
                  : isLowStock
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

                return (
                  <motion.div
                    key={p.id}
                    layout
                    whileHover={{ y: -4 }}
                    className="bg-brand-panelBg border border-brand-maroon/20 hover:border-brand-gold/30 rounded-2xl overflow-hidden flex flex-col justify-between group transition-all duration-300 relative shadow-xl text-left"
                  >
                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 items-start">
                      {p.is_bestseller && (
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest bg-brand-gold text-brand-maroonDark border border-brand-gold shadow-md">
                          BESTSELLER
                        </span>
                      )}
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border shadow-md ${stockBadgeStyle}`}>
                        {stockLabel}
                      </span>
                    </div>

                    {/* Wishlist Button */}
                    <button 
                      onClick={() => toggleWishlist(p.id)}
                      className={`absolute top-3 right-3 z-20 p-2.5 rounded-full border transition-all cursor-pointer shadow-md ${
                        isWishlisted 
                          ? 'bg-red-500/20 border-red-500/60 text-red-500' 
                          : 'bg-brand-darkBg/80 border-white/10 text-zinc-400 hover:text-red-400 hover:border-red-400/40'
                      }`}
                      title={isWishlisted ? t('shop.wishlisted') : t('shop.wishlist')}
                      aria-label="Wishlist toggle"
                    >
                      <Heart size={16} fill={isWishlisted ? '#EF4444' : 'none'} className={isWishlisted ? 'text-red-500' : ''} />
                    </button>

                    {/* 3D Visual Preview */}
                    <Link to={`/product/${p.slug}`} className="h-48 md:h-56 bg-brand-darkBg/60 relative overflow-hidden flex items-center justify-center p-4">
                      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.04)_0%,rgba(0,0,0,0)_60%)]" />
                      <ThreeDChocolate type={modelType as any} interactive={false} />
                    </Link>

                    {/* Content Details */}
                    <div className="p-4 md:p-5 flex-1 flex flex-col justify-between space-y-3 text-left">
                      <div className="space-y-1.5">
                        <span className="text-[9px] text-brand-gold uppercase tracking-widest font-bold block">
                          {translatedCat}
                        </span>
                        <Link to={`/product/${p.slug}`}>
                          <h3 className="text-base font-serif font-bold text-white group-hover:text-brand-gold transition-colors leading-tight">
                            {translatedName}
                          </h3>
                        </Link>
                        <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                          {translatedDesc}
                        </p>
                      </div>

                      {/* Delivery Info */}
                      <div className="bg-white/5 rounded-xl p-2.5 space-y-1 text-[10px] text-zinc-300">
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-400">Delivery:</span>
                          <span className="font-bold text-brand-goldLight">
                            {p.delivery_charge && p.delivery_charge > 0 ? `₹${p.delivery_charge}` : 'FREE'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[9px] text-zinc-400">
                          <span>Est. Delivery:</span>
                          <span>{p.expected_delivery_date || '3-5 Business Days'}</span>
                        </div>
                        <div className="flex justify-between items-center text-[9px] text-zinc-400">
                          <span>Cancel Deadline:</span>
                          <span>{p.cancellation_deadline || '24 hrs'}</span>
                        </div>
                      </div>

                      {/* Price & Action Buttons */}
                      <div className="pt-2 border-t border-brand-maroon/10 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-extrabold text-brand-goldLight">₹{p.price}</span>
                          <Link 
                            to={`/product/${p.slug}`}
                            className="text-[9px] text-zinc-400 hover:text-brand-gold uppercase tracking-wider font-bold transition-colors"
                          >
                            {t('shop.details')} →
                          </Link>
                        </div>
                        
                        {/* Action Buttons: Add to Cart & Direct Order */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button 
                            onClick={() => handleAddToCart(p)}
                            disabled={isOutOfStock}
                            className={`py-2.5 px-2 font-bold text-[9px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 ${
                              isOutOfStock
                                ? 'bg-zinc-800 text-zinc-600 border border-zinc-700 cursor-not-allowed'
                                : 'bg-brand-darkBg border border-brand-gold/30 hover:border-brand-gold text-brand-gold hover:bg-brand-gold/10 cursor-pointer'
                            }`}
                          >
                            <ShoppingCart size={11} />
                            <span>{t('shop.add_to_cart')}</span>
                          </button>
                          
                          <button 
                            onClick={() => handleDirectOrder(p)}
                            disabled={isOutOfStock}
                            className={`py-2.5 px-2 font-extrabold text-[9px] uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1 ${
                              isOutOfStock
                                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                                : 'bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark cursor-pointer'
                            }`}
                          >
                            <Zap size={11} />
                            <span>{t('shop.direct_order')}</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </main>

      </div>
    </div>
  );
};

export default Catalog;
