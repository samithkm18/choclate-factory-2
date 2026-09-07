import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, Heart, ShoppingCart, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import ThreeDChocolate from '../components/ThreeDChocolate';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

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

export const Catalog: React.FC = () => {
  const { user, userToken } = useAuth();
  const { addToCart } = useCart();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(50);
  const [selectedTag, setSelectedTag] = useState('');
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch products based on filters
  useEffect(() => {
    setLoading(true);
    let url = `http://localhost:5000/api/products?minPrice=${minPrice}&maxPrice=${maxPrice}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;
    if (selectedTag) url += `&tags=${encodeURIComponent(selectedTag)}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading products:', err);
        setLoading(false);
      });
  }, [search, category, minPrice, maxPrice, selectedTag]);

  // Fetch wishlist if user is authenticated
  useEffect(() => {
    if (!user || !userToken) return;

    fetch('http://localhost:5000/api/products/wishlist/me', {
      headers: { 'Authorization': `Bearer ${userToken}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setWishlistIds(data.map(item => item.id));
        }
      })
      .catch(err => console.error('Error fetching wishlist ids:', err));
  }, [user, userToken]);

  const toggleWishlist = async (productId: number) => {
    if (!user || !userToken) {
      alert('Please log in to manage your wishlist.');
      return;
    }

    const isWishlisted = wishlistIds.includes(productId);
    const method = isWishlisted ? 'DELETE' : 'POST';
    const url = `http://localhost:5000/api/products/${productId}/wishlist`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      if (res.ok) {
        setWishlistIds(prev => 
          isWishlisted ? prev.filter(id => id !== productId) : [...prev, productId]
        );
      }
    } catch (error) {
      console.error('Wishlist toggle error:', error);
    }
  };

  const handleQuickAdd = (p: Product) => {
    addToCart({
      id: `${p.slug}-standard`,
      productId: p.id,
      name: p.name,
      price: p.price,
      image: `/assets/products/${p.slug}-1.jpg`, // Dynamic asset representation
      variant: 'Standard Bar (100g)'
    });
  };

  const categories = ['Dark Chocolate', 'Milk Chocolate', 'White Chocolate', 'Botanical Chocolate'];
  const dietaryTags = ['vegan', 'gluten-free', 'organic', 'contains-nuts'];

  return (
    <div className="max-w-7xl mx-auto py-24 px-6 md:px-12 font-sans">
      
      {/* Header and Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-brand-maroon/20 pb-8 mb-10">
        <div>
          <span className="text-xs text-brand-gold uppercase tracking-[0.3em] font-semibold">
            Reserve Cellar
          </span>
          <h1 className="text-3xl md:text-5xl font-serif mt-2">CHOCOLATE ATELIER</h1>
        </div>
        
        {/* Dynamic Live Search Bar */}
        <div className="relative w-full md:w-80">
          <input 
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search flavor notes or chocolates..."
            className="w-full bg-brand-panelBg/60 border border-brand-gold/25 focus:border-brand-gold rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none transition-colors"
          />
          <Search className="absolute left-3.5 top-3 text-zinc-500" size={15} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar Filters */}
        <aside className="lg:col-span-3 space-y-6 bg-brand-panelBg border border-brand-maroon/20 rounded-2xl p-6 h-fit">
          <div className="flex items-center justify-between border-b border-brand-maroon/20 pb-3">
            <h3 className="text-xs text-brand-gold uppercase tracking-widest font-bold flex items-center gap-1.5">
              <SlidersHorizontal size={14} /> Refine Selection
            </h3>
            <button 
              onClick={() => { setCategory(''); setMinPrice(0); setMaxPrice(50); setSelectedTag(''); setSearch(''); }}
              className="text-[10px] text-zinc-500 hover:text-brand-gold transition-colors flex items-center gap-1 font-bold uppercase"
            >
              <RefreshCcw size={10} /> Reset
            </button>
          </div>

          {/* Categories Filter */}
          <div className="space-y-2">
            <h4 className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">Categories</h4>
            <div className="space-y-1">
              <button 
                onClick={() => setCategory('')}
                className={`w-full text-left py-1 text-xs transition-colors ${category === '' ? 'text-brand-gold font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                All Collections
              </button>
              {categories.map((c, idx) => (
                <button
                  key={idx}
                  onClick={() => setCategory(c)}
                  className={`w-full text-left py-1 text-xs transition-colors ${category === c ? 'text-brand-gold font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-3">
            <div className="flex justify-between text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
              <span>Price Range</span>
              <span className="text-brand-goldLight">${minPrice} – ${maxPrice}</span>
            </div>
            <input 
              type="range"
              min={0}
              max={50}
              step={2}
              value={maxPrice}
              onChange={e => setMaxPrice(parseInt(e.target.value))}
              className="w-full accent-brand-gold h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Dietary Tags */}
          <div className="space-y-2">
            <h4 className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">Dietary Tags</h4>
            <div className="flex flex-wrap gap-1.5">
              {dietaryTags.map((tag, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                  className={`px-3 py-1 rounded-full text-[10px] font-semibold transition-colors border ${
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
              <p className="text-sm text-zinc-500 uppercase tracking-wider">No chocolates match your selections.</p>
              <button 
                onClick={() => { setCategory(''); setMinPrice(0); setMaxPrice(50); setSelectedTag(''); setSearch(''); }}
                className="text-xs text-brand-gold font-bold uppercase mt-4 hover:underline"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map(p => {
                const isWishlisted = wishlistIds.includes(p.id);
                // Map color name for model
                const modelType = p.slug.includes('raspberry') ? 'raspberry' : p.slug.includes('symphony') ? 'milk' : 'dark';
                
                return (
                  <motion.div
                    key={p.id}
                    layout
                    whileHover={{ y: -6 }}
                    className="bg-brand-panelBg border border-brand-maroon/20 hover:border-brand-gold/30 rounded-2xl overflow-hidden flex flex-col justify-between group transition-all duration-300 relative"
                  >
                    {/* Wishlist Button */}
                    <button 
                      onClick={() => toggleWishlist(p.id)}
                      className="absolute top-4 right-4 z-20 p-2 bg-brand-darkBg/60 border border-white/5 hover:border-brand-gold/30 rounded-full text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      <Heart size={16} fill={isWishlisted ? '#EF4444' : 'none'} className={isWishlisted ? 'text-red-500' : ''} />
                    </button>

                    {/* 3D Visual Preview (interactive: false) */}
                    <Link to={`/product/${p.slug}`} className="h-56 bg-brand-darkBg/60 relative overflow-hidden flex items-center justify-center p-4">
                      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.04)_0%,rgba(0,0,0,0)_60%)]" />
                      <ThreeDChocolate type={modelType as any} interactive={false} />
                    </Link>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-1 text-left">
                        <span className="text-[9px] text-brand-gold uppercase tracking-widest font-bold">
                          {p.category}
                        </span>
                        <Link to={`/product/${p.slug}`}>
                          <h3 className="text-base font-serif font-bold text-white group-hover:text-brand-gold transition-colors leading-tight">
                            {p.name}
                          </h3>
                        </Link>
                        <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                          {p.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-brand-maroon/10">
                        <span className="text-base font-bold text-brand-goldLight">${p.price.toFixed(2)}</span>
                        
                        <div className="flex items-center gap-2">
                          {p.slug === 'custom-happiness-box' ? (
                            <Link 
                              to="/builder"
                              className="px-4 py-2 bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark font-semibold text-[10px] uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1 shadow"
                            >
                              Design Box
                            </Link>
                          ) : (
                            <button 
                              onClick={() => handleQuickAdd(p)}
                              className="p-2 border border-brand-gold/30 hover:border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-maroonDark rounded-lg transition-colors"
                              title="Quick add to cart"
                            >
                              <ShoppingCart size={14} />
                            </button>
                          )}
                          <Link 
                            to={`/product/${p.slug}`}
                            className="px-3 py-2 bg-white/5 hover:bg-brand-maroon/40 border border-white/5 rounded-lg text-[10px] text-brand-gold font-bold uppercase tracking-wider"
                          >
                            Details
                          </Link>
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
