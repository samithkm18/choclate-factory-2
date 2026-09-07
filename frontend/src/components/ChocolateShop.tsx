import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Flame, Sparkles } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images: string | string[]; // Can be stringified JSON array
  is_spotlight: number;
  cocoa_percentage?: number;
  weight?: string;
  origin?: string;
  is_new?: number;
  flavor_profile?: string | { notes?: string[] };
}

export const ChocolateShop: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(true);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5000/api/products')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProducts(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching shop products:', err);
        setLoading(false);
      });
  }, []);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const getProductImage = (product: Product): string => {
    try {
      if (Array.isArray(product.images)) {
        return product.images[0] || '';
      }
      if (typeof product.images === 'string' && product.images.startsWith('[')) {
        const parsed = JSON.parse(product.images);
        return parsed[0] || '';
      }
      return typeof product.images === 'string' ? product.images : '';
    } catch (e) {
      return '';
    }
  };

  const getFlavorNotes = (product: Product): string[] => {
    try {
      if (typeof product.flavor_profile === 'string') {
        const parsed = JSON.parse(product.flavor_profile);
        return parsed?.notes || [];
      }
      return product.flavor_profile?.notes || [];
    } catch (e) {
      return [];
    }
  };

  const handleAddToCart = (product: Product) => {
    const imgUrl = getProductImage(product);
    addToCart({
      id: `${product.slug}-default`,
      productId: product.id,
      name: product.name,
      price: product.price,
      image: imgUrl.startsWith('http') ? imgUrl : `http://localhost:5000${imgUrl}`,
      variant: 'Standard Box'
    });
  };

  const handleBuyNow = (product: Product) => {
    handleAddToCart(product);
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-8 h-8 border-2 border-brand-gold/30 border-t-brand-gold rounded-full animate-spin" />
        <p className="text-zinc-500 uppercase tracking-widest text-[9px] font-bold">Unlocking Reserve Inventory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Editorial Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 text-brand-gold text-[10px] uppercase tracking-[0.3em] font-extrabold">
          <Sparkles size={12} className="animate-pulse" />
          <span>The Atelier Collections</span>
          <Sparkles size={12} className="animate-pulse" />
        </div>
        <h2 className="text-3xl md:text-5xl font-serif text-white uppercase tracking-widest leading-none font-bold">
          ORDER <span className="metallic-gold-shimmer text-gold-metallic">CHOCOLATES</span>
        </h2>
        <div className="w-16 h-[1px] bg-brand-gold/45 mx-auto" />
        <p className="text-zinc-400 text-xs md:text-sm uppercase tracking-[0.15em] max-w-lg mx-auto leading-relaxed">
          Order directly from our master conchers. Freshly prepared, micro-batched, and hand-delivered in secure thermo-regulated boxes.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap justify-center gap-2 md:gap-3 border-b border-brand-maroon/10 pb-6">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-6 py-2.5 rounded-full text-[10px] uppercase font-bold tracking-widest transition-all duration-300 cursor-pointer ${
              selectedCategory === cat
                ? 'bg-brand-gold text-brand-maroonDark shadow-lg shadow-brand-gold/15'
                : 'bg-brand-darkBg/60 border border-brand-gold/15 text-zinc-400 hover:text-white hover:border-brand-gold/50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid of luxury product cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProducts.map(product => {
          const isOutOfStock = product.stock <= 0;
          const imgUrl = getProductImage(product);
          const notes = getFlavorNotes(product);
          const showNew = product.is_new === 1;

          return (
            <div 
              key={product.id}
              className="group bg-brand-panelBg border border-brand-maroon/10 hover:border-brand-gold/30 rounded-3xl p-6 flex flex-col justify-between space-y-6 transition-all duration-500 hover:-translate-y-1.5 shadow-xl relative overflow-hidden"
            >
              {/* Star-burst gradient overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.02)_0%,rgba(0,0,0,0)_50%)] pointer-events-none" />

              {/* Badges container */}
              <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                {showNew && (
                  <span className="bg-brand-maroon text-brand-goldLight text-[8px] uppercase tracking-widest font-extrabold px-3 py-1 rounded-md border border-brand-gold/20 shadow-md flex items-center gap-1">
                    <Flame size={10} /> New Arrival
                  </span>
                )}
                {isOutOfStock && (
                  <span className="bg-zinc-950/80 border border-zinc-800 text-zinc-400 text-[8px] uppercase tracking-widest font-extrabold px-3 py-1 rounded-md">
                    Sold Out
                  </span>
                )}
              </div>

              {/* Product Visual */}
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-zinc-950/40 border border-brand-maroon/5 flex items-center justify-center">
                {imgUrl ? (
                  <img
                    src={imgUrl.startsWith('http') ? imgUrl : `http://localhost:5000${imgUrl}`}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="text-zinc-600 font-serif text-[10px] uppercase tracking-widest">No Artwork Asset</div>
                )}
              </div>

              {/* Product Metadata */}
              <div className="space-y-3 text-left">
                <div className="flex items-start justify-between">
                  <h3 className="font-serif text-lg md:text-xl text-white uppercase tracking-wider group-hover:text-brand-gold transition-colors duration-300">
                    {product.name}
                  </h3>
                  <span className="text-brand-gold font-bold text-sm md:text-base whitespace-nowrap ml-2">
                    ₹{product.price.toLocaleString()}
                  </span>
                </div>

                <p className="text-zinc-400 text-[11px] leading-relaxed line-clamp-2">
                  {product.description}
                </p>

                {/* Attributes Row */}
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1 text-[10px] text-zinc-300 font-medium">
                  {product.cocoa_percentage && (
                    <div className="flex items-center gap-1">
                      <span className="text-brand-gold">✦</span>
                      <span>{product.cocoa_percentage}% Cocoa</span>
                    </div>
                  )}
                  {product.weight && (
                    <div className="flex items-center gap-1">
                      <span className="text-brand-gold">✦</span>
                      <span>{product.weight}</span>
                    </div>
                  )}
                  {product.origin && (
                    <div className="flex items-center gap-1">
                      <span className="text-brand-gold">✦</span>
                      <span>{product.origin}</span>
                    </div>
                  )}
                </div>

                {/* Flavor Notes Tags */}
                {notes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {notes.map((note, i) => (
                      <span 
                        key={i} 
                        className="bg-brand-darkBg/60 border border-brand-gold/10 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider text-brand-goldLight"
                      >
                        {note}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  disabled={isOutOfStock}
                  onClick={() => handleAddToCart(product)}
                  className="flex-1 py-3 border border-brand-gold/30 hover:border-brand-gold text-brand-gold hover:bg-brand-gold/5 font-extrabold text-[9px] uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ShoppingCart size={11} /> Add to Cart
                </button>
                <button
                  disabled={isOutOfStock}
                  onClick={() => handleBuyNow(product)}
                  className="flex-1 py-3 bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark font-extrabold text-[9px] uppercase tracking-widest rounded-xl transition-all duration-300 shadow-md cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                >
                  Order Now
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChocolateShop;
