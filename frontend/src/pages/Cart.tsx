import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, Ticket, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useTranslation } from 'react-i18next';

export const Cart: React.FC = () => {
  const { 
    cart, 
    updateQuantity, 
    removeFromCart, 
    discountCode, 
    discountAmount,
    applyCoupon, 
    removeCoupon, 
    subtotal, 
    cartTotal 
  } = useCart();

  const navigate = useNavigate();
  const { t } = useTranslation();

  const [couponInput, setCouponInput] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput) return;
    setApplyingCoupon(true);
    const result = await applyCoupon(couponInput);
    setCouponMsg({ text: result.message, ok: result.success });
    if (result.success) setCouponInput('');
    setApplyingCoupon(false);
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-24 md:py-32 px-4 sm:px-6 text-center font-sans text-white space-y-6 overflow-x-hidden">
        <div className="w-16 h-16 bg-white/5 border border-brand-gold/20 rounded-full flex items-center justify-center mx-auto text-zinc-500">
          <ShoppingBag size={24} />
        </div>
        <h2 className="text-2xl font-serif text-brand-goldLight uppercase">{t('cart.empty')}</h2>
        <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
          Embark on your journey to Customize Your Happiness. Browse our shop to select premium chocolates.
        </p>
        <Link 
          to="/shop"
          className="inline-block px-8 py-3 bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark font-bold text-xs uppercase tracking-widest rounded-xl shadow-md transition-all hover:scale-105"
        >
          {t('cart.continue_shopping')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 md:py-24 px-4 sm:px-6 md:px-12 font-sans text-white overflow-x-hidden text-left">
      <div className="border-b border-brand-maroon/20 pb-4 md:pb-6 mb-8 md:mb-10 text-left">
        <span className="text-[10px] md:text-xs text-brand-gold uppercase tracking-[0.3em] font-semibold">Shopping Bag</span>
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-serif mt-1 uppercase tracking-widest font-bold">
          {t('cart.title')}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
        
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {cart.map((item) => (
            <div 
              key={item.id} 
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-brand-panelBg border border-brand-maroon/20 rounded-2xl gap-4 hover:border-brand-gold/20 transition-all duration-300 shadow-md"
            >
              {/* Product Info */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-brand-darkBg/60 rounded-xl border border-brand-maroon/10 flex items-center justify-center text-2xl md:text-3xl shrink-0">
                  {item.customBoxItems ? '📦' : '🍫'}
                </div>
                <div className="text-left space-y-0.5 min-w-0">
                  <h3 className="text-sm font-semibold text-brand-goldLight truncate">{item.name}</h3>
                  <p className="text-[10px] text-zinc-400">{item.variant}</p>
                </div>
              </div>

              {/* Adjust Quantity and Pricing */}
              <div className="flex items-center justify-between sm:justify-end gap-4 md:gap-6 border-t sm:border-t-0 border-brand-maroon/10 pt-3 sm:pt-0">
                <div className="flex items-center border border-brand-gold/20 rounded-lg overflow-hidden h-8 bg-white/5">
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="px-2.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-3 text-xs font-semibold">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="px-2.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <div className="text-right whitespace-nowrap">
                  <span className="text-xs font-bold text-white block">${(item.price * item.quantity).toFixed(2)}</span>
                  <span className="text-[9px] text-zinc-500 block">${item.price.toFixed(2)} each</span>
                </div>

                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="p-2 text-zinc-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                  title={t('cart.remove')}
                >
                  <Trash2 size={15} />
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* Right Column: Pricing Summary & Checkout Call */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Coupon Code Panel */}
          <div className="bg-brand-panelBg border border-brand-maroon/20 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs text-brand-gold uppercase tracking-wider font-semibold">Promotion Code</h4>
            
            {discountCode ? (
              <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3.5 py-2 rounded-xl text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <Ticket size={14} /> {discountCode} — ${discountAmount} OFF
                </span>
                <button onClick={removeCoupon} className="p-1 hover:bg-emerald-500/20 rounded-full transition-colors cursor-pointer">
                  <X size={12} />
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input 
                  type="text" 
                  value={couponInput}
                  onChange={e => { setCouponInput(e.target.value); setCouponMsg(null); }}
                  placeholder="Enter promo code"
                  className="flex-1 bg-brand-darkBg border border-brand-gold/25 focus:border-brand-gold rounded-lg px-3 py-2 text-xs text-white outline-none uppercase transition-colors"
                />
                <button 
                  type="submit"
                  disabled={applyingCoupon}
                  className="bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark px-4 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {applyingCoupon ? '...' : 'Apply'}
                </button>
              </form>
            )}

            {couponMsg && (
              <p className={`text-[10px] font-medium ${couponMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                {couponMsg.ok ? '✓' : '✕'} {couponMsg.text}
              </p>
            )}
          </div>

          {/* Checkout pricing details card */}
          <div className="bg-brand-panelBg border border-brand-gold/20 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs text-zinc-400 uppercase tracking-wider font-semibold border-b border-brand-maroon/10 pb-2">{t('cart.total')}</h3>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">{t('cart.subtotal')}:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount:</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between border-t border-brand-maroon/20 pt-3 text-sm font-bold text-white">
                <span>Total:</span>
                <span className="text-brand-goldLight">${cartTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-3.5 bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark font-extrabold text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all duration-300 transform hover:scale-[1.02] cursor-pointer"
            >
              {t('cart.checkout')} <ArrowRight size={14} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Cart;
