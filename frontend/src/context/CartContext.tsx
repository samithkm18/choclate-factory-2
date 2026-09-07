import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string; // Composite unique key (e.g. productSlug-variant or customBoxId)
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variant: string;
  customBoxItems?: string[]; // List of custom chocolate truffle names inside the box
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  discountCode: string | null;
  discountAmount: number;
  discountPercent: number; // Keep for backward compat (0 since we use flat now)
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  cartTotal: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('manis_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [discountCode, setDiscountCode] = useState<string | null>(() => {
    return localStorage.getItem('manis_coupon');
  });

  const [discountAmount, setDiscountAmount] = useState<number>(() => {
    const savedAmt = localStorage.getItem('manis_coupon_amount');
    return savedAmt ? parseFloat(savedAmt) : 0;
  });

  useEffect(() => {
    localStorage.setItem('manis_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (newItem: Omit<CartItem, 'quantity'>) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === newItem.id);
      if (exists) {
        return prev.map(item => 
          item.id === newItem.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...newItem, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(id);
      return;
    }
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: qty } : item));
  };

  const clearCart = () => {
    setCart([]);
    removeCoupon();
  };

  // Async server-side promo code validation
  const applyCoupon = async (code: string): Promise<{ success: boolean; message: string }> => {
    try {
      const currentSubtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
      const res = await fetch('http://localhost:5000/api/orders/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), subtotal: currentSubtotal })
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setDiscountCode(data.code);
        setDiscountAmount(data.discount_amount);
        localStorage.setItem('manis_coupon', data.code);
        localStorage.setItem('manis_coupon_amount', data.discount_amount.toString());
        return { success: true, message: `Code applied! ₹${data.discount_amount} off your order.` };
      } else {
        return { success: false, message: data.message || 'Invalid promo code.' };
      }
    } catch {
      return { success: false, message: 'Could not validate promo code. Please try again.' };
    }
  };

  const removeCoupon = () => {
    setDiscountCode(null);
    setDiscountAmount(0);
    localStorage.removeItem('manis_coupon');
    localStorage.removeItem('manis_coupon_amount');
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const cartTotal = Math.max(0, subtotal - discountAmount);

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      discountCode,
      discountAmount,
      discountPercent: 0, // Legacy - replaced by flat discount
      applyCoupon,
      removeCoupon,
      subtotal,
      cartTotal
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
