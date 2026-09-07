import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Calendar, Lock, ArrowLeft, MapPin, User, Check, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL, getAssetUrl } from '../config/api';

export const Checkout: React.FC = () => {
  const { user, userToken } = useAuth();
  const { cart, cartTotal, discountCode, clearCart } = useCart();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Settings & Maps States
  const [settings, setSettings] = useState<any>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement | null>(null);

  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  // Form inputs
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliverySlot, setDeliverySlot] = useState('12 PM - 3 PM');

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'razorpay'>('qr');
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

  // Load Google Maps script dynamically using the fetched API key
  useEffect(() => {
    if (!settings?.google_maps_api_key) return;

    if ((window as any).google?.maps) {
      setMapsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${settings.google_maps_api_key}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setMapsLoaded(true);
    };
    document.body.appendChild(script);
  }, [settings?.google_maps_api_key]);

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

  // Initialize Map and Places Autocomplete
  useEffect(() => {
    if (!mapsLoaded || !mapRef.current) return;

    const defaultLoc = { lat: 12.9716, lng: 77.5946 }; // Bengaluru Default
    const map = new (window as any).google.maps.Map(mapRef.current, {
      center: defaultLoc,
      zoom: 14,
      styles: [
        { elementType: "geometry", stylers: [{ color: "#1e1e24" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#1e1e24" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
        {
          featureType: "administrative",
          elementType: "geometry.stroke",
          stylers: [{ color: "#32323a" }]
        },
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [{ color: "#2c2c35" }]
        },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#0f0f12" }]
        }
      ]
    });

    const marker = new (window as any).google.maps.Marker({
      position: defaultLoc,
      map: map,
      draggable: true,
      title: "Drag the pin to your exact delivery location"
    });

    setCoordinates(defaultLoc);

    // Get current geolocation if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLoc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          map.setCenter(userLoc);
          marker.setPosition(userLoc);
          setCoordinates(userLoc);

          // Reverse geocode
          const geocoder = new (window as any).google.maps.Geocoder();
          geocoder.geocode({ location: userLoc }, (results: any, status: any) => {
            if (status === 'OK' && results && results[0]) {
              setAddress(results[0].formatted_address);
            }
          });
        },
        () => console.log('Geolocation permission denied or failed.')
      );
    }

    // Set Autocomplete search
    const inputElement = document.getElementById('places-search-input') as HTMLInputElement;
    if (inputElement) {
      const autocomplete = new (window as any).google.maps.places.Autocomplete(inputElement);
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry && place.geometry.location) {
          const loc = place.geometry.location;
          map.setCenter(loc);
          marker.setPosition(loc);
          setCoordinates({ lat: loc.lat(), lng: loc.lng() });
          setAddress(place.formatted_address || '');
        }
      });
    }

    // Drag Listener
    marker.addListener('dragend', () => {
      const pos = marker.getPosition();
      if (pos) {
        const lat = pos.lat();
        const lng = pos.lng();
        setCoordinates({ lat, lng });

        // Reverse geocode
        const geocoder = new (window as any).google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
          if (status === 'OK' && results && results[0]) {
            setAddress(results[0].formatted_address);
          }
        });
      }
    });

  }, [mapsLoaded]);

  // Cart Protection
  useEffect(() => {
    if (cart.length === 0 && !processing && !orderCreatedId) {
      navigate('/cart');
    }
  }, [cart, navigate, processing, orderCreatedId]);

  const handleSelectSavedAddress = () => {
    setAddress('700 Cocoa Court, Golden Estates, Bengaluru, Karnataka, 560001');
    setPhone('+91 98765 43210');
    const bglrCoords = { lat: 12.9716, lng: 77.5946 };
    setCoordinates(bglrCoords);
  };

  const handleRazorpayPayment = async (orderData: any) => {
    const options = {
      key: orderData.key_id,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "Mani's Chocolate Factory",
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
      prefill: {
        name,
        email,
        contact: phone
      },
      theme: {
        color: "#C9A84C"
      },
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
    if (!name || !email || !phone || !address || !deliveryDate || !deliverySlot) {
      alert('Please fill out all required details.');
      return;
    }

    if (paymentMethod === 'qr' && !transactionRef) {
      alert('Please provide the transaction reference ID (UTR) to confirm payment.');
      return;
    }

    setProcessing(true);
    setStatusMessage(paymentMethod === 'qr' ? 'Registering manual QR order booking...' : 'Initiating Razorpay gateway...');

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
          delivery_date: deliveryDate,
          delivery_slot: deliverySlot,
          address: address,
          guest_info: !userToken ? { name, email, phone } : null,
          coordinates,
          payment_method: paymentMethod,
          transaction_ref: paymentMethod === 'qr' ? transactionRef : null
        })
      });

      if (res.ok) {
        const orderData = await res.json();
        if (paymentMethod === 'qr') {
          // Manual payment submitted successfully
          clearCart();
          setOrderCreatedId(orderData.orderId);
          setProcessing(false);
        } else {
          // Automated payment checkout flow
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

  // Success view (post checkout actions)
  if (orderCreatedId) {
    return (
      <div className="max-w-xl mx-auto py-32 px-6 text-center text-white relative z-20 space-y-6">
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
          <Check size={28} />
        </div>
        <h1 className="text-3xl font-serif text-brand-gold uppercase tracking-wider">
          {paymentMethod === 'qr' ? 'Order Submitted successfully!' : 'Order Placed Successfully!'}
        </h1>
        
        {paymentMethod === 'qr' ? (
          <div className="space-y-4">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Thank you for choosing Mani's Chocolate Factory. Your order <strong>#{orderCreatedId}</strong> has been registered in our kitchen ledger as <strong>Awaiting Manual Payment Confirmation</strong>.
            </p>
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl text-left space-y-3 max-w-md mx-auto">
              <span className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider block">Manual Verification Guidelines</span>
              <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">
                Our kitchen operators are reviewing the payment reference code: <strong className="text-brand-gold">{transactionRef}</strong>.
              </p>
              <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">
                Once the transfer is verified on our bank account, your booking will update to <strong>Preparing</strong>. Check your status notifications soon!
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-zinc-400 leading-relaxed">
            Thank you for choosing Mani's Chocolate Factory. Your order <strong>#{orderCreatedId}</strong> has been registered in our kitchen ledger as paid.
          </p>
        )}

        <div className="border-t border-zinc-800 pt-6">
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition-colors cursor-pointer shadow-md"
          >
            Return to Storefront
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-32 px-6 md:px-12 text-white relative z-20">
      
      {/* Back button */}
      <Link to="/cart" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-brand-gold uppercase tracking-widest font-extrabold mb-8 transition-colors">
        <ArrowLeft size={12} /> Back to Bag
      </Link>

      <div className="border-b border-brand-gold/15 pb-4 mb-8 text-left">
        <span className="text-[9px] text-brand-gold uppercase tracking-[0.3em] font-extrabold block">secure checkout flow</span>
        <h1 className="text-3xl md:text-5xl font-serif uppercase tracking-widest text-[var(--text-color)] mt-1">THE GUEST BOOK</h1>
      </div>

      <form onSubmit={handleCheckoutSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
        
        {/* Left Form: Details */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Customer details */}
          <div className="border border-zinc-800 bg-brand-panelBg/20 p-6 rounded-3xl space-y-4">
            <h3 className="text-xs font-serif font-extrabold text-brand-gold uppercase tracking-wider flex items-center gap-2">
              <User size={14} /> 1. Customer Details
            </h3>

            {userToken && (
              <div className="flex justify-between items-center bg-brand-gold/5 border border-brand-gold/15 p-3 rounded-xl">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Logged in as {user?.email}</span>
                <button
                  type="button"
                  onClick={handleSelectSavedAddress}
                  className="px-3 py-1 bg-brand-gold text-brand-maroonDark text-[9px] font-extrabold uppercase tracking-wider rounded transition-colors cursor-pointer"
                >
                  Load Saved Details
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[9px] text-zinc-400 uppercase tracking-widest font-bold mb-1">Full Name *</label>
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
                <label className="block text-[9px] text-zinc-400 uppercase tracking-widest font-bold mb-1">Contact Email *</label>
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
                <label className="block text-[9px] text-zinc-400 uppercase tracking-widest font-bold mb-1">Contact Phone *</label>
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

          {/* Delivery coordinates / Map Picker */}
          <div className="border border-zinc-800 bg-brand-panelBg/20 p-6 rounded-3xl space-y-4">
            <h3 className="text-xs font-serif font-extrabold text-brand-gold uppercase tracking-wider flex items-center gap-2">
              <MapPin size={14} /> 2. Delivery Location (Map Pin-Drop)
            </h3>

            {/* Places Search box */}
            <div>
              <label className="block text-[9px] text-zinc-400 uppercase tracking-widest font-bold mb-1">Search Landmark or Locality</label>
              <input
                type="text"
                id="places-search-input"
                placeholder={mapsLoaded ? "Type neighborhood, building, road..." : "Loading Map Platform..."}
                className="w-full bg-brand-darkBg border border-brand-gold/25 focus:border-brand-gold rounded-lg px-3.5 py-2.5 text-xs text-white outline-none transition-colors mb-3"
              />
            </div>

            {/* Map Canvas */}
            <div 
              ref={mapRef} 
              id="checkout-map" 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-600 text-xs"
              style={{ height: '300px' }}
            >
              {!mapsLoaded && <p>Initializing Google Maps Canvas...</p>}
            </div>

            {/* Address verification details */}
            <div>
              <label className="block text-[9px] text-zinc-400 uppercase tracking-widest font-bold mb-1">Confirm Street address & Flat/Floor Details *</label>
              <textarea
                required
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Flat No. 402, 4th Floor, Royal Palace Towers, Cocoa Street"
                className="w-full bg-brand-darkBg border border-brand-gold/25 focus:border-brand-gold rounded-lg px-3.5 py-2.5 text-xs text-white outline-none transition-colors resize-none"
              />
              {coordinates && (
                <span className="text-[8px] text-zinc-600 uppercase tracking-wider block mt-1 font-mono">Captured Geolocation: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}</span>
              )}
            </div>
          </div>

          {/* Delivery Slot Scheduling */}
          <div className="border border-zinc-800 bg-brand-panelBg/20 p-6 rounded-3xl space-y-4">
            <h3 className="text-xs font-serif font-extrabold text-brand-gold uppercase tracking-wider flex items-center gap-2">
              <Calendar size={14} /> 3. Schedule Slot
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] text-zinc-400 uppercase tracking-widest font-bold mb-1">Delivery Date *</label>
                <input
                  type="date"
                  required
                  min={minDateString}
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full bg-brand-darkBg border border-brand-gold/25 focus:border-brand-gold rounded-lg px-3.5 py-2.5 text-xs text-white outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-[9px] text-zinc-400 uppercase tracking-widest font-bold mb-1">Preferred Slot *</label>
                <select
                  value={deliverySlot}
                  onChange={(e) => setDeliverySlot(e.target.value)}
                  className="w-full bg-brand-darkBg border border-brand-gold/25 focus:border-brand-gold rounded-lg px-3.5 py-2.5 text-xs text-white outline-none transition-colors cursor-pointer"
                >
                  <option value="9 AM - 12 PM">Morning (9 AM - 12 PM)</option>
                  <option value="12 PM - 3 PM">Noon (12 PM - 3 PM)</option>
                  <option value="3 PM - 6 PM">Afternoon (3 PM - 6 PM)</option>
                  <option value="6 PM - 9 PM">Evening (6 PM - 9 PM)</option>
                </select>
              </div>
            </div>
          </div>

        </div>

        {/* Right Form: Order Summary & QR Payment */}
        <div className="lg:col-span-4 space-y-6">
          <div className="border border-zinc-800 bg-brand-panelBg/30 p-6 rounded-3xl space-y-6 backdrop-blur-xl">
            <h3 className="text-xs font-serif font-extrabold text-brand-gold uppercase tracking-wider border-b border-brand-maroon/20 pb-3 mb-2">
              Order Summary
            </h3>

            <div className="space-y-4 max-h-[160px] overflow-y-auto pr-1 text-xs">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-1">
                  <div>
                    <span className="font-bold text-zinc-200 block">{item.name}</span>
                    <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">Qty: {item.quantity}</span>
                  </div>
                  <span className="font-serif text-brand-gold">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-brand-maroon/15 pt-4 space-y-2">
              {discountCode && (
                <div className="flex justify-between text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
                  <span>Discount Applied</span>
                  <span>-10%</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="uppercase text-[9px] text-zinc-500 tracking-wider">Final Total</span>
                <span className="text-lg font-serif text-brand-gold">₹{cartTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3 pt-3 border-t border-zinc-800/80">
              <label className="block text-[9px] text-zinc-500 uppercase tracking-wider font-extrabold">Choose Payment Mode</label>
              <div className="grid grid-cols-2 gap-2 text-[10px] uppercase font-bold tracking-wider">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('qr')}
                  className={`py-2.5 rounded-lg border text-center transition-colors cursor-pointer ${
                    paymentMethod === 'qr' 
                      ? 'bg-brand-gold text-brand-maroonDark border-brand-gold' 
                      : 'bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  QR Code UPI
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
                  Razorpay SDK
                </button>
              </div>
            </div>

            {/* QR Payment View */}
            {paymentMethod === 'qr' && settings && (
              <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-2xl space-y-4 font-sans text-left">
                <span className="text-[8px] text-zinc-500 font-extrabold uppercase tracking-widest block text-center font-mono">Scan QR code to pay</span>
                <div className="w-40 h-40 bg-white p-2 rounded-xl mx-auto flex items-center justify-center border border-zinc-800">
                  <img 
                    src={getAssetUrl(settings.payment_qr_code)} 
                    alt="Payment QR" 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/qr-placeholder.png';
                    }}
                  />
                </div>
                
                <p className="text-[10px] text-zinc-400 leading-normal font-sans">
                  {settings.payment_instructions}
                </p>

                <div>
                  <label className="block text-[8px] text-brand-gold uppercase tracking-widest font-extrabold mb-1 font-mono">Transaction Ref / UTR Number *</label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="12-digit UTR Code (e.g. 625178239014)"
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
              className="w-full bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark font-extrabold py-4 rounded-xl text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-brand-gold/10 cursor-pointer disabled:opacity-50"
            >
              <Lock size={12} /> {paymentMethod === 'qr' ? 'Confirm Payment & Place Order' : 'Place Order & Pay'}
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
