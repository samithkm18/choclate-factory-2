import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, ArrowLeft, Eye, Sparkles, Scale, Info, Award, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import ThreeDChocolate from '../components/ThreeDChocolate';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { API_BASE_URL, getAssetUrl } from '../config/api';

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
}

export const ProductDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, userToken } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [variant, setVariant] = useState('Standard Bar (100g)');
  const [priceMultiplier, setPriceMultiplier] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch product detail
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
        console.error(err);
        setLoading(false);
      });
  }, [slug]);

  // Fetch wishlist status
  useEffect(() => {
    if (!product || !user || !userToken) return;

    fetch('http://localhost:5000/api/products/wishlist/me', {
      headers: { 'Authorization': `Bearer ${userToken}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setIsWishlisted(data.some(item => item.id === product.id));
        }
      })
      .catch(err => console.error('Error loading wishlist state:', err));
  }, [product, user, userToken]);

  const toggleWishlist = async () => {
    if (!product || !user || !userToken) {
      alert('Please log in to manage your wishlist.');
      return;
    }

    const method = isWishlisted ? 'DELETE' : 'POST';
    const url = `http://localhost:5000/api/products/${product.id}/wishlist`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      if (res.ok) {
        setIsWishlisted(!isWishlisted);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVariantChange = (selectedVariant: string, multiplier: number) => {
    setVariant(selectedVariant);
    setPriceMultiplier(multiplier);
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    addToCart({
      id: `${product.slug}-${variant.replace(/\s+/g, '-').toLowerCase()}`,
      productId: product.id,
      name: product.name,
      price: product.price * priceMultiplier,
      image: product.images && product.images[0] ? product.images[0] : '/assets/products/placeholder.jpg',
      variant: variant
    });

    navigate('/cart');
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Convert embedded Cloudinary player urls to direct raw performance-optimized MP4 streams
  const getRawVideoUrl = (url: string) => {
    if (!url) {
      return "https://res.cloudinary.com/dwji2t2uj/video/upload/q_auto,f_auto/Chocolate_box_exploding_animation_202608242247_kfafoa.mp4";
    }
    if (url.includes('player.cloudinary.com/embed')) {
      try {
        const parsedUrl = new URL(url);
        const publicId = parsedUrl.searchParams.get('public_id');
        const cloudName = parsedUrl.searchParams.get('cloud_name') || 'dwji2t2uj';
        if (publicId) {
          return `https://res.cloudinary.com/${cloudName}/video/upload/q_auto,f_auto/${publicId}.mp4`;
        }
      } catch (e) {
        console.error('Error parsing video url:', e);
      }
    }
    if (url.startsWith('/')) {
      return `${API_BASE_URL}${url}`;
    }
    return url;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-brand-darkBg text-white">
        <div className="w-8 h-8 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Unveiling Chocolate Secret...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-brand-darkBg text-white">
        <p className="text-sm text-zinc-400">Reserve chocolate details are unavailable.</p>
        <Link to="/catalog" className="text-brand-gold text-xs uppercase tracking-widest font-bold hover:underline">
          Return to Catalog
        </Link>
      </div>
    );
  }

  const currentPrice = product.price * priceMultiplier;
  const modelType = product.slug.includes('raspberry') ? 'raspberry' : product.slug.includes('symphony') ? 'milk' : 'dark';

  const productVideoUrl = getRawVideoUrl(product.video_url);
  const specs = product.specifications || {};
  const nutrition = product.nutrition || {};

  return (
    <div className="bg-brand-darkBg text-white min-h-screen relative select-none">
      
      {/* Dynamic Background Atmosphere Video */}
      <video
        src="https://res.cloudinary.com/dwji2t2uj/video/upload/q_auto,f_auto/Chocolate_box_exploding_animation_202608242247_kfafoa.mp4"
        className="fixed inset-0 w-full h-full object-cover pointer-events-none z-0 opacity-[0.08]"
        autoPlay
        muted
        loop
        playsInline
      />

      {/* 1. CINEMATIC PRODUCT-SPECIFIC HERO VIDEO (ALWAYS AT THE VERY TOP) */}
      <section className="h-screen w-full relative flex items-center justify-center overflow-hidden">
        
        {/* Fullscreen Video Background */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <video
            src={productVideoUrl}
            autoPlay
            muted
            loop
            playsInline
            poster={getAssetUrl(product.video_thumbnail)}
            className="absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto -translate-x-1/2 -translate-y-1/2 object-cover"
          />
          {/* Subtle gradients to cover video edges */}
          <div className="absolute inset-0 bg-gradient-to-t from-brand-darkBg via-transparent to-brand-darkBg/80 z-1" />
          <div className="absolute inset-0 bg-brand-darkBg/30 z-1" />
        </div>

        {/* Back navigation */}
        <Link 
          to="/catalog" 
          className="absolute top-28 left-6 md:left-12 z-20 inline-flex items-center gap-1.5 text-[10px] text-zinc-300 hover:text-brand-gold uppercase tracking-[0.2em] font-bold transition-all bg-brand-panelBg/60 backdrop-blur-md border border-brand-panelBorder py-2 px-4 rounded-full"
        >
          <ArrowLeft size={12} /> Back to Catalog
        </Link>

        {/* Cinematic Title overlay */}
        <div className="max-w-4xl mx-auto text-center px-6 z-10 space-y-5 pt-12">
          <motion.span 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-brand-gold uppercase tracking-[0.4em] font-semibold block"
          >
            {product.category}
          </motion.span>
          
          <motion.h1 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-7xl font-serif leading-tight font-extrabold text-white uppercase tracking-tight"
          >
            {product.name}
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-zinc-300 text-xs md:text-sm max-w-lg mx-auto font-medium tracking-wide"
          >
            {product.cocoa_percentage || (product.flavor_profile && product.flavor_profile.cocoa) || 72}% Cocoa Density. Crafted for true connoisseurs.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex justify-center gap-4 pt-4"
          >
            <button
              onClick={() => scrollToSection('purchase-section')}
              className="px-8 py-3.5 bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark font-extrabold text-xs uppercase tracking-widest rounded-lg transition-all shadow-lg cursor-pointer transform hover:scale-105 active:scale-95"
            >
              Order Luxury Bar
            </button>
            <button
              onClick={() => scrollToSection('story-section')}
              className="px-8 py-3.5 bg-transparent hover:bg-white/5 border border-white/40 hover:border-brand-gold text-white hover:text-brand-gold text-xs uppercase tracking-widest rounded-lg font-bold transition-all cursor-pointer"
            >
              Explore Senses
            </button>
          </motion.div>
        </div>

        {/* Scroll helper */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-1.5 text-zinc-500 text-[9px] tracking-[0.25em] uppercase font-bold z-10 cursor-pointer" onClick={() => scrollToSection('story-section')}>
          <span>Scroll Senses</span>
          <div className="w-1 h-6 bg-zinc-800 rounded-full overflow-hidden">
            <div className="w-full h-full bg-brand-gold animate-bounce" />
          </div>
        </div>
      </section>

      {/* 2. PRODUCT STORY SECTION WITH 3D CANVAS */}
      <section id="story-section" className="py-24 px-6 md:px-12 bg-transparent relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left: 3D interactive model */}
          <div className="lg:col-span-6 glass-panel border border-brand-gold/15 rounded-3xl overflow-hidden shadow-2xl relative p-4">
            <div className="h-[350px] md:h-[450px] relative">
              <ThreeDChocolate type={modelType as any} interactive={true} />
              <div className="absolute bottom-4 left-4 text-[9px] uppercase tracking-wider text-zinc-400 flex items-center gap-1 bg-brand-darkBg/60 px-2.5 py-1.5 rounded-full border border-white/5">
                <Eye size={10} /> Drag to inspect texture
              </div>
            </div>
          </div>

          {/* Right: Editorial Narrative */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="space-y-2">
              <span className="text-xs text-brand-gold uppercase tracking-[0.3em] font-semibold flex items-center gap-1">
                <Award size={12} /> Culinary Masterpiece
              </span>
              <h2 className="text-3xl md:text-5xl font-serif text-white uppercase leading-tight">
                The Heritage Story
              </h2>
            </div>
            
            <p className="text-zinc-300 text-sm md:text-base leading-relaxed">
              {product.description}
            </p>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Our single-origin seeds undergo a detailed 72-hour conching phase, developing an incredibly silky texture that melts at body temperature, unveiling flavor notes in a slow, symphonic release.
            </p>

            {product.dietary_tags && product.dietary_tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-4">
                {product.dietary_tags.map((tag, idx) => (
                  <span key={idx} className="bg-brand-maroonDark/40 border border-brand-gold/20 text-[9px] font-bold text-brand-goldLight uppercase tracking-wider px-3 py-1 rounded-full">
                    {tag.replace('-', ' ')}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. INGREDIENTS & CULINARY ALCHEMY */}
      <section className="py-24 px-6 md:px-12 bg-transparent border-t border-brand-maroon/10 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <div className="space-y-2">
            <span className="text-xs text-brand-gold uppercase tracking-[0.3em] font-semibold">Fine Elements</span>
            <h2 className="text-3xl md:text-4xl font-serif uppercase">INGREDIENT SELECTION</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
            {product.fallback_ingredients && product.fallback_ingredients.length > 0 ? (
              product.fallback_ingredients.map((ing, idx) => (
                <div
                  key={idx}
                  className="glass-panel border border-brand-gold/15 hover:border-brand-gold/45 rounded-2xl p-6 text-center space-y-3 transition-colors duration-300 group"
                >
                  <div className="w-12 h-12 bg-brand-maroonDark/60 border border-brand-gold/30 rounded-full flex items-center justify-center mx-auto text-xl group-hover:bg-brand-gold group-hover:text-brand-maroonDark transition-all duration-300">
                    {idx === 0 ? '🍫' : idx === 1 ? '🧈' : '🍯'}
                  </div>
                  <h4 className="text-sm font-serif font-semibold text-brand-goldLight">{ing}</h4>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                    Traced from clean organic cooperatives, guaranteed 100% pure under fair-trade criteria.
                  </p>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-6 text-xs text-zinc-500">
                Ingredients are loading...
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE FLAVOR PROFILE */}
      {product.flavor_profile && (
        <section className="py-24 px-6 md:px-12 bg-transparent border-t border-brand-maroon/10 relative z-10">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-2">
              <span className="text-xs text-brand-gold uppercase tracking-[0.3em] font-semibold">Tasting Profile</span>
              <h2 className="text-3xl md:text-4xl font-serif uppercase">THE FLAVOR SPECTRUM</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center glass-panel border border-brand-gold/15 rounded-3xl p-8 md:p-12">
              {/* Left sliders */}
              <div className="space-y-6 text-left">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-zinc-400">Cocoa Density</span>
                    <span className="text-brand-gold">{(product.cocoa_percentage || product.flavor_profile.cocoa)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-brand-gold to-brand-goldDark rounded-full transition-all duration-1000"
                      style={{ width: `${product.cocoa_percentage || product.flavor_profile.cocoa}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-zinc-400">Sweetness Balance</span>
                    <span className="text-brand-gold">{product.flavor_profile.sweetness} / 5</span>
                  </div>
                  <div className="flex gap-1.5 mt-1">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <div 
                        key={idx} 
                        className={`h-2 flex-1 rounded-full ${idx < product.flavor_profile.sweetness ? 'bg-brand-gold' : 'bg-zinc-800'}`} 
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Notes list */}
              <div className="text-left space-y-4">
                <h4 className="text-xs text-zinc-400 uppercase tracking-widest font-bold">Tasting Notes Summary:</h4>
                <div className="flex flex-wrap gap-2">
                  {product.flavor_profile.notes && product.flavor_profile.notes.map((note, idx) => (
                    <span 
                      key={idx} 
                      className="px-4 py-2 bg-brand-darkBg/60 border border-brand-gold/15 text-[10px] text-brand-gold font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5 hover:border-brand-gold transition-colors duration-300"
                    >
                      <Sparkles size={10} className="text-brand-gold" /> {note}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5. SPECIFICATIONS GRID */}
      <section className="py-24 px-6 md:px-12 bg-transparent border-t border-brand-maroon/10 relative z-10">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs text-brand-gold uppercase tracking-[0.3em] font-semibold">Technical Coordinates</span>
            <h2 className="text-3xl md:text-4xl font-serif uppercase">SPECIFICATIONS</h2>
          </div>

          <div className="glass-panel border border-brand-gold/15 rounded-3xl p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-xs">
              <div className="flex justify-between py-2.5 border-b border-brand-panelBorder">
                <span className="text-zinc-400 font-semibold flex items-center gap-1"><Scale size={12} /> Net Weight</span>
                <span className="font-bold text-white">{product.weight || '100g (3.52 oz)'}</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-brand-panelBorder">
                <span className="text-zinc-400 font-semibold flex items-center gap-1"><Award size={12} /> Cocoa Origin</span>
                <span className="font-bold text-white">{product.origin || 'Venezuelan single-farm'}</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-brand-panelBorder">
                <span className="text-zinc-400 font-semibold flex items-center gap-1"><Layers size={12} /> Presentation Case</span>
                <span className="font-bold text-white">{specs.packaging || 'Velvet Gold Embossed Case'}</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-brand-panelBorder">
                <span className="text-zinc-400 font-semibold flex items-center gap-1"><Info size={12} /> Shelf Life</span>
                <span className="font-bold text-white">{specs.shelf_life || '6 Months (stored correctly)'}</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-brand-panelBorder">
                <span className="text-zinc-400 font-semibold flex items-center gap-1"><Info size={12} /> Storage Conditions</span>
                <span className="font-bold text-white">{specs.storage || '16-18°C in a dry environment'}</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-brand-panelBorder">
                <span className="text-zinc-400 font-semibold flex items-center gap-1 text-red-400">⚠️ Declared Allergens</span>
                <span className="font-bold text-red-300">
                  {product.allergens && product.allergens.length > 0 ? product.allergens.join(', ') : 'None'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. NUTRITIONAL MATRIX */}
      <section className="py-24 px-6 md:px-12 bg-transparent border-t border-brand-maroon/10 relative z-10">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs text-brand-gold uppercase tracking-[0.3em] font-semibold">Nutritional Facts</span>
            <h2 className="text-3xl md:text-4xl font-serif uppercase">NUTRITION FACTS</h2>
          </div>

          <div className="glass-panel border border-brand-gold/15 rounded-3xl p-6 md:p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="p-4 bg-brand-darkBg/40 border border-brand-gold/15 rounded-2xl">
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest block font-bold">Energy</span>
                <span className="text-base md:text-lg font-bold text-white mt-1 block">{nutrition.calories || '540 kcal'}</span>
              </div>
              <div className="p-4 bg-brand-darkBg/40 border border-brand-gold/15 rounded-2xl">
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest block font-bold">Total Fat</span>
                <span className="text-base md:text-lg font-bold text-white mt-1 block">{nutrition.fat || '36g'}</span>
              </div>
              <div className="p-4 bg-brand-darkBg/40 border border-brand-gold/15 rounded-2xl">
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest block font-bold">Carbs / Sugars</span>
                <span className="text-base md:text-lg font-bold text-white mt-1 block">{nutrition.sugar || '28g'}</span>
              </div>
              <div className="p-4 bg-brand-darkBg/40 border border-brand-gold/15 rounded-2xl">
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest block font-bold">Protein</span>
                <span className="text-base md:text-lg font-bold text-white mt-1 block">{nutrition.protein || '7g'}</span>
              </div>
            </div>
            <p className="text-[9px] text-zinc-500 text-center mt-4">Values are based on standard 100g serving estimation.</p>
          </div>
        </div>
      </section>

      {/* 7. DYNAMIC IMAGE GALLERY */}
      {product.images && product.images.length > 0 && (
        <section className="py-24 px-6 md:px-12 bg-transparent border-t border-brand-maroon/10 relative z-10">
          <div className="max-w-4xl mx-auto space-y-10">
            <div className="text-center space-y-2">
              <span className="text-xs text-brand-gold uppercase tracking-[0.3em] font-semibold">Visual Gallery</span>
              <h2 className="text-3xl md:text-4xl font-serif uppercase">PRODUCT IMAGES</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {product.images.map((img, idx) => (
                <div 
                  key={idx} 
                  className="glass-panel p-2 rounded-2xl overflow-hidden border border-brand-gold/15 shadow-lg group cursor-zoom-in"
                >
                  <img 
                    src={getAssetUrl(img)} 
                    alt={`${product.name} Gallery ${idx + 1}`} 
                    className="w-full h-64 object-cover rounded-xl group-hover:scale-105 transition-transform duration-500" 
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. PURCHASE PANEL & SELECTION CARD */}
      <section id="purchase-section" className="py-24 px-6 md:px-12 bg-transparent border-t border-brand-maroon/20 relative z-10">
        <div className="max-w-3xl mx-auto glass-panel-heavy border border-brand-gold/20 rounded-3xl p-8 md:p-12 space-y-6 shadow-2xl relative overflow-hidden text-left">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.06)_0%,rgba(0,0,0,0)_50%)] pointer-events-none" />

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-brand-panelBorder">
            <div>
              <span className="text-xs text-brand-gold uppercase tracking-wider block font-semibold">{product.category}</span>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mt-1 uppercase">{product.name}</h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-400 block uppercase tracking-widest font-bold">Estimated Cost</span>
              <span className="text-2xl md:text-3xl font-bold text-brand-goldLight">${currentPrice.toFixed(2)}</span>
            </div>
          </div>

          {/* Presentation Cases */}
          {product.slug !== 'custom-happiness-box' && (
            <div className="space-y-3">
              <h4 className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Select Presentation Option:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Standard Bar (100g)', mult: 1 },
                  { label: 'Signature Gift Box (200g)', mult: 1.8 },
                  { label: 'Royal Wooden Case (400g)', mult: 3.2 }
                ].map((v, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleVariantChange(v.label, v.mult)}
                    className={`p-3 border rounded-xl text-xs font-semibold text-center transition-all cursor-pointer ${
                      variant === v.label 
                        ? 'bg-brand-gold text-brand-maroonDark border-brand-gold font-bold scale-[1.02] shadow-md' 
                        : 'bg-white/5 text-zinc-400 border-white/5 hover:border-brand-gold/30'
                    }`}
                  >
                    <span className="block">{v.label}</span>
                    <span className={`block text-[10px] mt-1 ${variant === v.label ? 'text-brand-maroonDark/80' : 'text-brand-gold'}`}>
                      ${(product.price * v.mult).toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Controls + Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
            
            {/* Quantity Selector */}
            <div className="flex items-center justify-between border border-brand-gold/20 rounded-xl overflow-hidden h-12 bg-white/5 px-2 w-full sm:w-36">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 text-zinc-400 hover:text-white transition-colors text-lg cursor-pointer"
              >
                -
              </button>
              <span className="px-2 text-xs font-bold">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 text-zinc-400 hover:text-white transition-colors text-lg cursor-pointer"
              >
                +
              </button>
            </div>

            {/* Main CTA */}
            {product.slug === 'custom-happiness-box' ? (
              <Link
                to="/builder"
                className="flex-1 h-12 bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark font-extrabold text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-lg transition-colors"
              >
                Customize Box Designer
              </Link>
            ) : (
              <button
                onClick={handleAddToCart}
                className="flex-1 h-12 bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark font-extrabold text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer transform active:scale-[0.98]"
              >
                <ShoppingCart size={14} /> Add Luxury Bundle to Cart
              </button>
            )}

            {/* Wishlist Button */}
            <button 
              onClick={toggleWishlist}
              className="w-12 h-12 bg-white/5 border border-white/5 hover:border-brand-gold/30 rounded-xl flex items-center justify-center text-zinc-400 hover:text-red-500 transition-all cursor-pointer"
              title="Add to wishlist"
            >
              <Heart size={18} fill={isWishlisted ? '#EF4444' : 'none'} className={isWishlisted ? 'text-red-500' : ''} />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};

export default ProductDetail;
