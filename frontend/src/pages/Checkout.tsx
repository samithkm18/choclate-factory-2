import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, ArrowLeft, MapPin, User, Check, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL, getAssetUrl } from '../config/api';

export const Checkout: React.FC = () => {
  const { user, userToken } = useAuth();
  const { cart, cartTotal, discountCode, clearCart } = useCart();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Settings States
  const [settings, setSettings] = useState<any>(null);

  // Form inputs
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [deliverySlot, setDeliverySlot] = useState('12 PM - 3 PM');

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'razorpay' | 'cod'>('qr');
  const [transactionRef, setTransactionRef] = useState('');

  // Checkout states
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [orderCreatedId, setOrderCreatedId] = useState<string | null>(null);

  // Load public settings
  useEffect(() => {
    fetch('http://localhost:5000/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(err => console.error('Error loading settings in checkout:', err));
  }, []);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      try {
        document.body.removeChild(script);
      } catch (e) {}
    };
  }, []);

  // Cart Protection
  useEffect(() => {
    if (cart.length === 0 && !processing && !orderCreatedId) {
      navigate('/cart');
    }
  }, [cart, navigate, processing, orderCreatedId]);

  const handleRazorpayPayment = async (orderData: any) => {
    const options = {
      key: orderData.key_id,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "Kote Factory",
      description: "Premium Artisan Confectioneries Reserve",
      image: `${API_BASE_URL}/uploads/images/logo-placeholder.png`,
      order_id: orderData.razorpay_order_id,
      handler: async (response: any) => {
        setProcessing(true);
        setStatusMessage(t('checkout.verification_pending'));
        
        try {
          const verifyRes = await fetch('http://localhost:5000/api/orders/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              order_id: orderData.orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
          });

          if (verifyRes.ok) {
            clearCart();
            setOrderCreatedId(orderData.orderId);
          } else {
            const err = await verifyRes.json();
            alert(`Signature verification failed: ${err.message}`);
          }
        } catch (e) {
          console.error(e);
          alert('Error during server payments validation.');
        } finally {
          setProcessing(false);
        }
      },
      prefill: { name, email, contact: phone },
      theme: { color: "#C9A84C" },
      modal: {
        ondismiss: () => {
          setProcessing(false);
          setStatusMessage('Payment cancelled by user. You can retry checkout.');
        }
      }
    };

    if (orderData.razorpay_order_id.startsWith('rzp_order_mock_')) {
      setStatusMessage('Simulating Sandbox Transaction...');
      setTimeout(async () => {
        const mockPaymentId = 'pay_mock_' + Math.random().toString(36).substring(2, 10);
        const mockSig = `mock_sig_${orderData.razorpay_order_id}_${mockPaymentId}`;

        try {
          const verifyRes = await fetch('http://localhost:5000/api/orders/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              order_id: orderData.orderId,
              razorpay_order_id: orderData.razorpay_order_id,
              razorpay_payment_id: mockPaymentId,
              razorpay_signature: mockSig
            })
          });

          if (verifyRes.ok) {
            clearCart();
            setOrderCreatedId(orderData.orderId);
          } else {
            alert('Mock signature check failed.');
          }
        } catch (e) {
          console.error(e);
        } finally {
          setProcessing(false);
        }
      }, 1500);
    } else {
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (processing) return;

    if (!name || !email || !phone || !address) {
      alert('Please fill out all required details.');
      return;
    }

    if (paymentMethod === 'qr' && !transactionRef) {
      alert('Please provide the transaction reference ID (UTR) to confirm payment.');
      return;
    }

    setProcessing(true);
    setStatusMessage(
      paymentMethod === 'qr'
        ? 'Registering manual QR order booking...'
        : paymentMethod === 'cod'
        ? 'Placing Cash on Delivery order...'
        : 'Initiating Razorpay gateway...'
    );

    const headers: any = { 'Content-Type': 'application/json' };
    if (userToken) {
      headers['Authorization'] = `Bearer ${userToken}`;
    }

    try {
      const res = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          items: cart,
          total_amount: cartTotal,
          discount_code: discountCode,
          delivery_date: deliveryDate || new Date().toISOString().split('T')[0],
          delivery_slot: deliverySlot || 'Standard',
          address: address,
          customer_name: name,
          customer_email: email,
          customer_phone: phone,
          guest_info: { name, email, phone },
          payment_method: paymentMethod,
          transaction_ref: paymentMethod === 'qr' ? transactionRef : null
        })
      });

      if (res.ok) {
        const orderData = await res.json();
        if (orderData && orderData.orderId) {
          try {
            const prevOrders = JSON.parse(localStorage.getItem('manis_guest_orders') || '[]');
            if (!prevOrders.includes(orderData.orderId)) {
              localStorage.setItem('manis_guest_orders', JSON.stringify([...prevOrders, orderData.orderId]));
            }
          } catch (e) {}
        }
        if (paymentMethod === 'qr' || paymentMethod === 'cod') {
          clearCart();
          setOrderCreatedId(orderData.orderId);
          setProcessing(false);
        } else {
          await handleRazorpayPayment(orderData);
        }
      } else {
        const err = await res.json();
        alert(`Checkout initiation failed: ${err.message}`);
        setProcessing(false);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Network or server error during checkout initiation.');
      setProcessing(false);
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateString = tomorrow.toISOString().split('T')[0];

  if (orderCreatedId) {
    return (
      <div className="max-w-xl mx-auto py-24 md:py-32 px-4 sm:px-6 text-center text-white relative z-20 space-y-6 overflow-x-hidden">
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
          <Check size={28} />
        </div>
        <h1 className="text-2xl md:text-4xl font-serif text-brand-gold uppercase tracking-wider font-bold">
          Thank you for your order!
        </h1>
        
        <p className="text-xs text-zinc-300 leading-relaxed">
          Your order <strong>#{orderCreatedId}</strong> has been placed successfully and is being prepared with utmost artisanal care.
        </p>

        <div className="bg-brand-panelBg border border-brand-maroon/20 rounded-2xl p-5 text-left text-xs text-zinc-300 space-y-2">
          <div className="flex justify-between border-b border-white/5 pb-2">
            <span className="text-zinc-400">Order ID:</span>
            <span className="font-mono text-brand-gold">{orderCreatedId}</span>
          </div>
          <div className="flex justify-between border-b border-white/5 pb-2">
            <span className="text-zinc-400">Payment Method:</span>
            <span className="font-bold uppercase text-white">{paymentMethod}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Total Amount:</span>
            <span className="font-bold text-brand-goldLight">₹{cartTotal}</span>
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-6">
          <button
            onClick={() => navigate('/shop')}
            className="px-8 py-3.5 bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark font-extrabold text-[11px] uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 md:py-32 px-4 sm:px-6 md:px-12 text-white relative z-20 overflow-x-hidden">
      
      {/* Back button */}
      <Link to="/cart" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-brand-gold uppercase tracking-widest font-extrabold mb-6 md:mb-8 transition-colors">
        <ArrowLeft size={12} /> Back to Bag
      </Link>

      <div className="border-b border-brand-gold/15 pb-4 mb-6 md:mb-8 text-left">
        <span className="text-[9px] md:text-[10px] text-brand-gold uppercase tracking-[0.3em] font-extrabold block">secure checkout flow</span>
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-serif uppercase tracking-widest text-white mt-1 font-bold">
          {t('checkout.guest_book')}
        </h1>
      </div>

      <form onSubmit={handleCheckoutSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 text-left">
        
        {/* Left Form: Details */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Customer details */}
          <div className="border border-zinc-800 bg-brand-panelBg/20 p-4 sm:p-6 rounded-3xl space-y-4">
            <h3 className="text-xs font-serif font-extrabold text-brand-gold uppercase tracking-wider flex items-center gap-2">
              <User size={14} /> {t('checkout.customer_details')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[9px] text-zinc-400 uppercase tracking-widest font-bold mb-1">{t('checkout.full_name')} *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Lord Alexander"
                  className="w-full bg-brand-darkBg border border-brand-gold/25 focus:border-brand-gold rounded-lg px-3.5 py-2.5 text-xs text-white outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-[9px] text-zinc-400 uppercase tracking-widest font-bold mb-1">{t('checkout.email')} *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="concierge@manis.com"
                  className="w-full bg-brand-darkBg border border-brand-gold/25 focus:border-brand-gold rounded-lg px-3.5 py-2.5 text-xs text-white outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-[9px] text-zinc-400 uppercase tracking-widest font-bold mb-1">{t('checkout.phone')} *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 99999 99999"
                  className="w-full bg-brand-darkBg border border-brand-gold/25 focus:border-brand-gold rounded-lg px-3.5 py-2.5 text-xs text-white outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="border border-zinc-800 bg-brand-panelBg/20 p-4 sm:p-6 rounded-3xl space-y-4">
            <h3 className="text-xs font-serif font-extrabold text-brand-gold uppercase tracking-wider flex items-center gap-2">
              <MapPin size={14} /> {t('checkout.delivery_location')}
            </h3>

            <div>
              <label className="block text-[9px] text-zinc-400 uppercase tracking-widest font-bold mb-1">{t('checkout.street_address')} *</label>
              <textarea
                required
                rows={4}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Flat No. 402, 4th Floor, Royal Palace Towers, Cocoa Street, City, PIN Code"
                className="w-full bg-brand-darkBg border border-brand-gold/25 focus:border-brand-gold rounded-lg px-3.5 py-2.5 text-xs text-white outline-none transition-colors resize-none"
              />
            </div>
          </div>
        </div>

        {/* Right Form: Order Summary & QR Payment */}
        <div className="lg:col-span-4 space-y-6">
          <div className="border border-zinc-800 bg-brand-panelBg/30 p-5 sm:p-6 rounded-3xl space-y-6 backdrop-blur-xl">
            <h3 className="text-xs font-serif font-extrabold text-brand-gold uppercase tracking-wider border-b border-brand-maroon/20 pb-3 mb-2">
              {t('checkout.order_summary')}
            </h3>

            <div className="space-y-4 max-h-[160px] overflow-y-auto pr-1 text-xs">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-1">
                  <div>
                    <span className="font-bold text-zinc-200 block truncate max-w-[150px]">{item.name}</span>
                    <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">Qty: {item.quantity}</span>
                  </div>
                  <span className="font-serif text-brand-gold">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-brand-maroon/15 pt-4 space-y-2">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="uppercase text-[9px] text-zinc-500 tracking-wider">Final Total</span>
                <span className="text-lg font-serif text-brand-gold">₹{cartTotal}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3 pt-3 border-t border-zinc-800/80">
              <label className="block text-[9px] text-zinc-500 uppercase tracking-wider font-extrabold">{t('checkout.payment_mode')}</label>
              <div className="grid grid-cols-3 gap-2 text-[9px] uppercase font-bold tracking-wider">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('qr')}
                  className={`py-2.5 rounded-lg border text-center transition-colors cursor-pointer ${
                    paymentMethod === 'qr'
                      ? 'bg-brand-gold text-brand-maroonDark border-brand-gold'
                      : 'bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {t('checkout.qr_upi')}
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('razorpay')}
                  className={`py-2.5 rounded-lg border text-center transition-colors cursor-pointer ${
                    paymentMethod === 'razorpay'
                      ? 'bg-brand-gold text-brand-maroonDark border-brand-gold'
                      : 'bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {t('checkout.razorpay')}
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`py-2.5 rounded-lg border text-center transition-colors cursor-pointer ${
                    paymentMethod === 'cod'
                      ? 'bg-brand-gold text-brand-maroonDark border-brand-gold'
                      : 'bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {t('checkout.cod')}
                </button>
              </div>
            </div>

            {paymentMethod === 'cod' && (
              <div className="bg-emerald-950/60 border border-emerald-800/40 p-4 rounded-2xl space-y-2 text-left">
                <span className="text-[9px] text-emerald-400 font-extrabold uppercase tracking-widest block">Cash on Delivery</span>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  Pay in cash when your order is delivered to your door. Our delivery partner will collect the exact amount.
                </p>
                <p className="text-[10px] text-brand-gold font-bold">Amount to keep ready: <span className="text-white">₹{cartTotal}</span></p>
              </div>
            )}

            {paymentMethod === 'qr' && settings && (
              <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-2xl space-y-4 font-sans text-left">
                <span className="text-[8px] text-zinc-500 font-extrabold uppercase tracking-widest block text-center font-mono">Scan QR code to pay</span>
                <div className="w-36 h-36 bg-white p-2 rounded-xl mx-auto flex items-center justify-center border border-zinc-800">
                  <img 
                    src={getAssetUrl(settings.payment_qr_code)} 
                    alt="Payment QR" 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/qr-placeholder.png';
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-[8px] text-brand-gold uppercase tracking-widest font-extrabold mb-1 font-mono">Transaction Ref / UTR Number *</label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="12-digit UTR Code"
                    className="w-full bg-brand-darkBg border border-brand-gold/25 focus:border-brand-gold rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors font-mono"
                  />
                </div>
              </div>
            )}

            {processing && (
              <div className="flex items-center gap-2 text-[10px] text-brand-gold font-extrabold uppercase tracking-widest justify-center">
                <RefreshCw size={12} className="animate-spin" /> {statusMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={processing}
              className="w-full bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark font-extrabold py-3.5 rounded-xl text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
            >
              <Lock size={12} />
              {paymentMethod === 'qr'
                ? t('checkout.place_order_qr')
                : paymentMethod === 'cod'
                ? t('checkout.place_order_cod')
                : t('checkout.place_order_rzp')}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[9px] text-zinc-500 uppercase tracking-wider font-bold">
              <ShieldCheck size={13} className="text-emerald-500" /> Secure SSL Ledger Encryption
            </div>

          </div>
        </div>

      </form>
    </div>
  );
};

export default Checkout;
