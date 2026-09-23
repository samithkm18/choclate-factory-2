import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Flame, Sparkles, Heart, Zap } from 'lucide-react';
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
  images: string | string[];
  is_spotlight?: number;
  cocoa_percentage?: number;
  weight?: string;
  origin?: string;
  is_new?: number;
  flavor_profile?: string | { notes?: string[] };
}

const fallbackShopProducts: Product[] = [
  {
    id: 1,
    name: 'Venezuelan Criollo Dark Bar',
    slug: 'venezuelan-criollo-dark-bar',
    description: '75% single-origin cocoa with 24k Venezuelan gold flakes.',
    price: 34,
    stock: 25,
    category: 'Dark Chocolate',
    images: '/assets/products/venezuelan-criollo-dark-bar-1.jpg',
    cocoa_percentage: 75,
    weight: '100g',
    origin: 'Venezuela'
  },
  {
    id: 2,
    name: 'Royal Golden Pistachio Truffles',
    slug: 'royal-golden-pistachio-truffles',
    description: 'Iranian pistachio paste, white chocolate ganache, micro-sprinkled with crushed gold leaf.',
    price: 48,
    stock: 15,
    category: 'Milk Chocolate',
    images: '/assets/products/royal-golden-pistachio-truffles-1.jpg',
    cocoa_percentage: 45,
    weight: '150g',
    origin: 'Iran & Switzerland'
  },
  {
    id: 3,
    name: 'Symphony Milk Chocolate Bar',
    slug: 'symphony-milk-bar',
    description: 'Silky smooth alpine milk blend with single-farm cocoa butter.',
    price: 28,
    stock: 30,
    category: 'Milk Chocolate',
    images: '/assets/products/symphony-milk-bar-1.jpg',
    cocoa_percentage: 40,
    weight: '100g',
    origin: 'Switzerland'
  }
];

export const ChocolateShop: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(fallbackShopProducts);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(true);
  const { addToCart, clearCart } = useCart();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // Wishlist state (stored in localStorage)
  const [wishlistIds, setWishlistIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('manis_wishlist');
      return saved ? JSON.parse(saved) : [1];
    } catch (e) {
      return [1];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('manis_wishlist', JSON.stringify(wishlistIds));
    } catch (e) {}
  }, [wishlistIds]);

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

  const toggleWishlist = (productId: number) => {
    setWishlistIds(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

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

  const handleAddToCart = (product: Product) => {
    const imgUrl = getProductImage(product);
    addToCart({
      id: `${product.slug}-default`,
      productId: product.id,
      name: getTranslatedProductName(product.name, i18n.language),
      price: product.price,
      image: imgUrl.startsWith('http') ? imgUrl : `http://localhost:5000${imgUrl}`,
      variant: 'Standard Box'
    });
  };

  const handleDirectOrder = (product: Product) => {
    clearCart();
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
    <div className="space-y-8 md:space-y-12 text-left overflow-x-hidden">
      {/* Editorial Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 text-brand-gold text-[10px] uppercase tracking-[0.3em] font-extrabold">
          <Sparkles size={12} className="animate-pulse" />
          <span>{t('shop.atelier_title')}</span>
          <Sparkles size={12} className="animate-pulse" />
        </div>
        <h2 className="text-2xl md:text-5xl font-serif text-white uppercase tracking-widest leading-none font-bold">
          ORDER <span className="metallic-gold-shimmer text-gold-metallic">CHOCOLATES</span>
        </h2>
        <div className="w-16 h-[1px] bg-brand-gold/45 mx-auto" />
        <p className="text-zinc-400 text-xs md:text-sm uppercase tracking-[0.15em] max-w-lg mx-auto leading-relaxed">
          {t('shop.sub_heading')}
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap justify-center gap-2 md:gap-3 border-b border-brand-maroon/10 pb-6">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 md:px-6 py-2 md:py-2.5 rounded-full text-[10px] uppercase font-bold tracking-widest transition-all duration-300 cursor-pointer ${
              selectedCategory === cat
                ? 'bg-brand-gold text-brand-maroonDark shadow-lg shadow-brand-gold/15'
                : 'bg-brand-darkBg/60 border border-brand-gold/15 text-zinc-400 hover:text-white hover:border-brand-gold/50'
            }`}
          >
            {cat === 'All' ? t('shop.categories.all') : getTranslatedCategory(cat, i18n.language)}
          </button>
        ))}
      </div>

      {/* Grid of luxury product cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {filteredProducts.map(product => {
          const isOutOfStock = product.stock <= 0;
          const imgUrl = getProductImage(product);
          const showNew = product.is_new === 1;
          const isWishlisted = wishlistIds.includes(product.id);
          const translatedName = getTranslatedProductName(product.name, i18n.language);
          const translatedDesc = getTranslatedProductDesc(product.description, product.name, i18n.language);

          return (
            <div 
              key={product.id}
              className="group bg-brand-panelBg border border-brand-maroon/10 hover:border-brand-gold/30 rounded-3xl p-5 md:p-6 flex flex-col justify-between space-y-5 transition-all duration-500 hover:-translate-y-1.5 shadow-xl relative overflow-hidden"
            >
              {/* Badges container */}
              <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                {showNew && (
                  <span className="bg-brand-maroon text-brand-goldLight text-[8px] uppercase tracking-widest font-extrabold px-3 py-1 rounded-md border border-brand-gold/20 shadow-md flex items-center gap-1">
                    <Flame size={10} /> {t('shop.new_arrival')}
                  </span>
                )}
                {isOutOfStock && (
                  <span className="bg-zinc-950/80 border border-zinc-800 text-zinc-400 text-[8px] uppercase tracking-widest font-extrabold px-3 py-1 rounded-md">
                    {t('shop.out_of_stock')}
                  </span>
                )}
              </div>

              {/* Wishlist Button (Always Visible) */}
              <button 
                onClick={() => toggleWishlist(product.id)}
                className={`absolute top-4 right-4 z-20 p-2.5 rounded-full border transition-all cursor-pointer shadow-md ${
                  isWishlisted 
                    ? 'bg-red-500/20 border-red-500/60 text-red-500' 
                    : 'bg-brand-darkBg/80 border-white/10 text-zinc-400 hover:text-red-400 hover:border-red-400/40'
                }`}
                aria-label="Wishlist toggle"
              >
                <Heart size={16} fill={isWishlisted ? '#EF4444' : 'none'} className={isWishlisted ? 'text-red-500' : ''} />
              </button>

              {/* Product Visual */}
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-zinc-950/40 border border-brand-maroon/5 flex items-center justify-center">
                {imgUrl ? (
                  <img
                    src={imgUrl.startsWith('http') ? imgUrl : imgUrl.startsWith('/') ? imgUrl : `http://localhost:5000${imgUrl}`}
                    alt={translatedName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="text-zinc-600 font-serif text-[10px] uppercase tracking-widest">🍫 Mani's Reserve</div>
                )}
              </div>

              {/* Product Metadata */}
              <div className="space-y-3 text-left">
                <div className="flex items-start justify-between">
                  <h3 className="font-serif text-base md:text-xl text-white uppercase tracking-wider group-hover:text-brand-gold transition-colors duration-300 font-bold">
                    {translatedName}
                  </h3>
                  <span className="text-brand-gold font-bold text-sm md:text-base whitespace-nowrap ml-2">
                    ${product.price.toFixed(2)}
                  </span>
                </div>

                <p className="text-zinc-400 text-[11px] leading-relaxed line-clamp-2">
                  {translatedDesc}
                </p>
              </div>

              {/* Action Buttons Row: Add to Cart & Direct Order */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  disabled={isOutOfStock}
                  onClick={() => handleAddToCart(product)}
                  className="py-2.5 border border-brand-gold/30 hover:border-brand-gold text-brand-gold hover:bg-brand-gold/10 font-bold text-[9px] uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ShoppingCart size={11} /> {t('shop.add_to_cart')}
                </button>
                <button
                  disabled={isOutOfStock}
                  onClick={() => handleDirectOrder(product)}
                  className="py-2.5 bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark font-extrabold text-[9px] uppercase tracking-wider rounded-xl transition-all duration-300 shadow-md cursor-pointer disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-1"
                >
                  <Zap size={11} /> {t('shop.direct_order')}
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
