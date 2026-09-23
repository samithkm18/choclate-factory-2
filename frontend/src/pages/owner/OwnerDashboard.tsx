import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, ShoppingCart, Settings, Layers, Play, Volume2, 
  Upload, Bell, LogOut, Trash2, Star, MapPin, Briefcase, Send, Eye, MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AdminReviews from '../../components/admin/AdminReviews';
import SalesAnalytics from '../../components/admin/SalesAnalytics';
import NotificationsCenter from '../../components/admin/NotificationsCenter';
import AdminLocations from '../../components/admin/AdminLocations';
import AdminJobs from '../../components/admin/AdminJobs';
import AdminOverallReview from '../../components/admin/AdminOverallReview';
import CustomerMessages from '../../components/admin/CustomerMessages';
import { getAssetUrl } from '../../config/api';

interface Order {
  id: number | string;
  customer_name?: string;
  customer_email?: string;
  guest_info?: { name?: string; email?: string; phone?: string } | null;
  items: { name: string; quantity: number; price: number; variant?: string }[];
  total_amount: number;
  delivery_charge?: number;
  expected_delivery_date?: string;
  cancellation_deadline?: string;
  payment_method?: string;
  status: string;
  delivery_date?: string;
  delivery_slot?: string;
  address: string;
  payment_status: string;
  created_at: string;
  coordinates?: { lat: number; lng: number } | any;
  transaction_ref?: string;
  rejection_reason?: string;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  video_url: string;
  images: string;
  is_bestseller?: boolean;
  delivery_charge?: number;
  expected_delivery_date?: string;
  cancellation_deadline?: string;
  cod_available?: boolean;
}

interface Analytics {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  stockAlertsCount: number;
  salesTrend: { date: string; amount: number; count: number }[];
  popularProducts: { name: string; category: string; price: number; stock: number }[];
}

export const OwnerDashboard: React.FC = () => {
  const { owner, ownerToken, ownerLogout } = useAuth();
  const navigate = useNavigate();

  // Navigation state
  const [activeTab, setActiveTab] = useState<'analytics' | 'orders' | 'overall_review' | 'inventory' | 'posters' | 'reviews' | 'about' | 'notifications' | 'settings' | 'coupons' | 'locations' | 'jobs' | 'messages'>('analytics');
  
  // Data states
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states (Product)
  const [pName, setPName] = useState('');
  const [pSlug, setPSlug] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pStock, setPStock] = useState('');
  const [pCat, setPCat] = useState('Dark Chocolate');
  const [pTags, setPTags] = useState('');
  const [pIngredients, setPIngredients] = useState('');
  const [pImageFile, setPImageFile] = useState<File | null>(null);
  const [pImageUrl, setPImageUrl] = useState('');
  const [pVideoFile, setPVideoFile] = useState<File | null>(null);
  const [pVideoThumbnailFile, setPVideoThumbnailFile] = useState<File | null>(null);

  // Previews & Progress States
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
  const [thumbPreviewUrl, setThumbPreviewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // File validations
  const validateImage = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      alert("Invalid image file format. Supported: JPG, JPEG, PNG, WEBP, SVG");
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image file size exceeds 5MB limit.");
      return false;
    }
    return true;
  };

  const validateVideo = (file: File): boolean => {
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      alert("Invalid video file format. Supported: MP4, WebM, MOV");
      return false;
    }
    if (file.size > 50 * 1024 * 1024) {
      alert("Video file size exceeds 50MB limit.");
      return false;
    }
    return true;
  };
  
  // Edit mode & Extended fields
  const [pId, setPId] = useState<number | null>(null);
  const [pCocoa, setPCocoa] = useState('');
  const [pWeight, setPWeight] = useState('');
  const [pOrigin, setPOrigin] = useState('');
  const [pAllergens, setPAllergens] = useState('');
  const [pVideoUrl, setPVideoUrl] = useState('');
  const [pVideoThumbnailUrl, setPVideoThumbnailUrl] = useState('');
  const [pIsNew, setPIsNew] = useState(false);
  const [pIsBestseller, setPIsBestseller] = useState(false);
  const [pDeliveryCharge, setPDeliveryCharge] = useState('0');
  const [pExpectedDeliveryDate, setPExpectedDeliveryDate] = useState('3-5 Business Days');
  const [pCancellationDeadline, setPCancellationDeadline] = useState('Within 24 hours of order placement');

  // Specifications
  const [pSpecPackaging, setPSpecPackaging] = useState('');
  const [pSpecShelfLife, setPSpecShelfLife] = useState('');
  const [pSpecStorage, setPSpecStorage] = useState('');

  // Nutrition
  const [pNutCalories, setPNutCalories] = useState('');
  const [pNutFat, setPNutFat] = useState('');
  const [pNutSugar, setPNutSugar] = useState('');
  const [pNutProtein, setPNutProtein] = useState('');

  // Form states (Settings)
  const [sPhone, setSPhone] = useState('');
  const [sEmail, setSEmail] = useState('');
  const [sAddress, setSAddress] = useState('');
  const [sSound, setSSound] = useState('cocoa-bell');
  const [sRingtoneFile, setSRingtoneFile] = useState<File | null>(null);
  const [sVolume, setSVolume] = useState(0.8);
  const [sLogoFile, setSLogoFile] = useState<File | null>(null);
  const [sLogoUrl, setSLogoUrl] = useState('');
  const [sInstagram, setSInstagram] = useState('');
  const [sInstructions, setSInstructions] = useState('');
  const [sQrUrl, setSQrUrl] = useState('');
  const [sQrFile, setSQrFile] = useState<File | null>(null);

  // Real-time alert states
  const [orderAlert, setOrderAlert] = useState<Order | null>(null);
  const audioIntervalRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Redirect if unauthorized
  useEffect(() => {
    if (!ownerToken) {
      navigate('/owner/login');
    }
  }, [ownerToken, navigate]);

  // Fetch initial dashboard resources
  useEffect(() => {
    if (!ownerToken) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const headers = { 'Authorization': `Bearer ${ownerToken}` };

        // 1. Fetch analytics
        const resAnalytics = await fetch('http://localhost:5000/api/owner/analytics', { headers });
        if (resAnalytics.ok) setAnalytics(await resAnalytics.json());

        // 2. Fetch orders
        const resOrders = await fetch('http://localhost:5000/api/owner/orders', { headers });
        if (resOrders.ok) setOrders(await resOrders.json());

        // 3. Fetch products
        const resProducts = await fetch('http://localhost:5000/api/products');
        if (resProducts.ok) setProducts(await resProducts.json());

        // 4. Fetch settings
        const resSettings = await fetch('http://localhost:5000/api/owner/settings', { headers });
        if (resSettings.ok) {
          const s = await resSettings.json();
          setSPhone(s.contact_phone || '');
          setSEmail(s.contact_email || '');
          setSAddress(s.contact_address || '');
          setSSound(s.alert_sound || 'cocoa-bell');
          setSLogoUrl(s.brand_logo_url || '');
          setSInstagram(s.instagram_username || '');
          setSInstructions(s.payment_instructions || '');
          setSQrUrl(s.payment_qr_code || '');
          if (analytics) {
            console.debug('Dashboard metrics refresh trigger:', analytics.totalRevenue);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [ownerToken]);

  // Request browser Notification permissions
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Web Audio Synthesis function (Built-in presets)
  const playSynthAlert = (type: string) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      gainNode.gain.setValueAtTime(sVolume * 0.5, audioCtx.currentTime);

      if (type === 'cocoa-bell') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch bell
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 1.2);
      } else if (type === 'royal-gong') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, audioCtx.currentTime); // Low gong
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 2.5);
      } else {
        // gold-symphony (two tones)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.8);
        
        setTimeout(() => {
          try {
            const osc2 = audioCtx.createOscillator();
            const gain2 = audioCtx.createGain();
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);
            gain2.gain.setValueAtTime(sVolume * 0.5, audioCtx.currentTime);
            osc2.frequency.setValueAtTime(660, audioCtx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.0);
            osc2.start();
            osc2.stop(audioCtx.currentTime + 1.0);
          } catch (e) {}
        }, 300);
      }
    } catch (e) {
      console.error('AudioContext synthesis failed:', e);
    }
  };

  // Looping trigger for alerts
  const startRingtoneLoop = (type: string) => {
    // Stop any existing loop first
    stopRingtoneLoop();

    // Trigger immediately
    playSynthAlert(type);
    
    // Set interval for repetition
    audioIntervalRef.current = window.setInterval(() => {
      playSynthAlert(type);
    }, 2500);
  };

  const stopRingtoneLoop = () => {
    if (audioIntervalRef.current !== null) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }
  };

  // WebSockets Real-time order listener (persistent connection)
  useEffect(() => {
    if (!ownerToken) return;

    const connectWS = () => {
      console.log('Connecting to Owner Alert WebSockets...');
      const ws = new WebSocket(`ws://localhost:5000/ws?token=${ownerToken}`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Owner WebSocket received payload:', data);

          if (data.type === 'NEW_ORDER') {
            setOrderAlert(data.order);
            
            // Loop alert sound
            startRingtoneLoop(sSound);

            // Browser Notification fallback
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification("Mani's Kote Factory: New Order!", {
                body: `Order #${data.order.id} placed by ${data.order.customer_name}. Total: $${data.order.total_amount.toFixed(2)}`,
                icon: '/favicon.ico'
              });
            }
          }
        } catch (e) {
          console.error(e);
        }
      };

      ws.onclose = () => {
        console.log('Owner WS closed. Reconnecting in 5 seconds...');
        setTimeout(connectWS, 5000);
      };

      ws.onerror = (err) => {
        console.error('WS error:', err);
      };
    };

    connectWS();

    return () => {
      stopRingtoneLoop();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [ownerToken, sSound]);

  // Acknowledge new orders
  const acknowledgeAlert = () => {
    stopRingtoneLoop();
    setOrderAlert(null);
    
    // Refresh orders list and analytics
    const headers = { 'Authorization': `Bearer ${ownerToken}` };
    fetch('http://localhost:5000/api/owner/orders', { headers })
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setOrders(data); });

    fetch('http://localhost:5000/api/owner/analytics', { headers })
      .then(res => res.json())
      .then(data => setAnalytics(data));
  };

  // Order status changes
  const handleUpdateStatus = async (orderId: string | number, status: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/owner/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ownerToken}`
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        setOrders(prev => prev.map(o => String(o.id) === String(orderId) ? { ...o, status: status as any } : o));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmPayment = async (orderId: string | number) => {
    if (!confirm(`Confirm payment has been received for order #${orderId}?`)) return;
    try {
      const res = await fetch(`http://localhost:5000/api/owner/orders/${orderId}/confirm-payment`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${ownerToken}`
        }
      });
      if (res.ok) {
        const headers = { 'Authorization': `Bearer ${ownerToken}` };
        fetch('http://localhost:5000/api/owner/orders', { headers })
          .then(r => r.json())
          .then(data => { if (Array.isArray(data)) setOrders(data); });
        alert('Order payment manually approved. Cooking ledger status updated to Preparing.');
      } else {
        const err = await res.json();
        alert(`Error: ${err.message}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectPayment = async (orderId: string | number) => {
    const reason = prompt('Decline payment for order #' + orderId + '. Please state the rejection reason:', 'Transaction UTR could not be verified on our accounts.');
    if (reason === null) return;
    try {
      const res = await fetch(`http://localhost:5000/api/owner/orders/${orderId}/reject-payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ownerToken}`
        },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        const headers = { 'Authorization': `Bearer ${ownerToken}` };
        fetch('http://localhost:5000/api/owner/orders', { headers })
          .then(r => r.json())
          .then(data => { if (Array.isArray(data)) setOrders(data); });
        alert('Payment declined. Order canceled and reason saved.');
      } else {
        const err = await res.json();
        alert(`Error: ${err.message}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Load product details into form for editing
  const handleEditProductClick = (product: any) => {
    setPId(product.id);
    setPName(product.name);
    setPSlug(product.slug);
    setPDesc(product.description || '');
    setPPrice(product.price.toString());
    setPStock(product.stock.toString());
    setPCat(product.category);
    setPTags(product.dietary_tags ? product.dietary_tags.join(', ') : '');
    setPIngredients(product.fallback_ingredients ? product.fallback_ingredients.join(', ') : '');
    setPVideoUrl(product.video_url || '');
    setPVideoThumbnailUrl(product.video_thumbnail || '');
    setPCocoa(product.cocoa_percentage ? product.cocoa_percentage.toString() : '');
    setPWeight(product.weight || '');
    setPOrigin(product.origin || '');
    setPAllergens(product.allergens ? product.allergens.join(', ') : '');
    setPIsNew(product.is_new === 1);

    // Set preview URLs from database
    const imgArr = Array.isArray(product.images) ? product.images : (product.images && typeof product.images === 'string' && product.images.startsWith('[') ? JSON.parse(product.images) : (product.images ? [product.images] : []));
    const imgPath = imgArr[0] || '';
    setPImageUrl(imgPath.startsWith('http') ? imgPath : '');
    setImagePreviewUrl(getAssetUrl(imgPath));
    setVideoPreviewUrl(getAssetUrl(product.video_url));
    setThumbPreviewUrl(getAssetUrl(product.video_thumbnail));

    // Specifications
    const specs = product.specifications || {};
    setPSpecPackaging(specs.packaging || '');
    setPSpecShelfLife(specs.shelf_life || '');
    setPSpecStorage(specs.storage || '');

    // Nutrition
    const nut = product.nutrition || {};
    setPNutCalories(nut.calories || '');
    setPNutFat(nut.fat || '');
    setPNutSugar(nut.sugar || '');
    setPNutProtein(nut.protein || '');
    
    // Scroll to the form
    const formElement = document.getElementById('chocolate-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Reset form fields
  const handleCancelEdit = () => {
    setPId(null);
    setPName('');
    setPSlug('');
    setPDesc('');
    setPPrice('');
    setPStock('');
    setPTags('');
    setPIngredients('');
    setPVideoUrl('');
    setPVideoThumbnailUrl('');
    setPImageUrl('');
    setPCocoa('');
    setPWeight('');
    setPOrigin('');
    setPAllergens('');
    setPSpecPackaging('');
    setPSpecShelfLife('');
    setPSpecStorage('');
    setPNutCalories('');
    setPNutFat('');
    setPNutSugar('');
    setPNutProtein('');
    setPImageFile(null);
    setPVideoFile(null);
    setPVideoThumbnailFile(null);
    setImagePreviewUrl('');
    setVideoPreviewUrl('');
    setThumbPreviewUrl('');
    setPIsNew(false);
  };

  // Inventory: Add or Update product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName || !pSlug || !pPrice || !pStock) return;

    // Validate selected files before submitting
    if (pImageFile && !validateImage(pImageFile)) return;
    if (pVideoFile && !validateVideo(pVideoFile)) return;
    if (pVideoThumbnailFile && !validateImage(pVideoThumbnailFile)) return;

    const specsObj = {
      packaging: pSpecPackaging,
      shelf_life: pSpecShelfLife,
      storage: pSpecStorage
    };

    const nutObj = {
      calories: pNutCalories,
      fat: pNutFat,
      sugar: pNutSugar,
      protein: pNutProtein
    };

    const formData = new FormData();
    formData.append('name', pName);
    formData.append('slug', pSlug);
    formData.append('description', pDesc);
    formData.append('price', pPrice);
    formData.append('stock', pStock);
    formData.append('category', pCat);
    formData.append('dietary_tags', pTags);
    formData.append('fallback_ingredients', pIngredients);
    formData.append('video_url', pVideoUrl);
    formData.append('video_thumbnail_url', pVideoThumbnailUrl);
    formData.append('cocoa_percentage', pCocoa);
    formData.append('weight', pWeight);
    formData.append('origin', pOrigin);
    formData.append('allergens', pAllergens);
    formData.append('specifications', JSON.stringify(specsObj));
    formData.append('nutrition', JSON.stringify(nutObj));
    formData.append('is_new', pIsNew ? '1' : '0');
    formData.append('is_bestseller', pIsBestseller ? '1' : '0');
    formData.append('delivery_charge', pDeliveryCharge);
    formData.append('expected_delivery_date', pExpectedDeliveryDate);
    formData.append('cancellation_deadline', pCancellationDeadline);

    if (pImageFile) formData.append('image', pImageFile);
    if (pImageUrl.trim()) formData.append('image_url', pImageUrl.trim());
    if (pVideoFile) formData.append('video', pVideoFile);
    if (pVideoThumbnailFile) formData.append('video_thumbnail', pVideoThumbnailFile);

    // Start simulated upload progress bar
    setIsUploading(true);
    setUploadProgress(10);
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 15;
      });
    }, 180);

    try {
      const url = pId 
        ? `http://localhost:5000/api/owner/products/${pId}`
        : 'http://localhost:5000/api/owner/products';
      const method = pId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Authorization': `Bearer ${ownerToken}` },
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (res.ok) {
        setTimeout(async () => {
          setIsUploading(false);
          alert(pId ? 'Luxury Chocolate updated successfully.' : 'Luxury Chocolate created successfully.');
          handleCancelEdit();
          // Refresh
          const resProducts = await fetch('http://localhost:5000/api/products');
          if (resProducts.ok) setProducts(await resProducts.json());
        }, 400);
      } else {
        setIsUploading(false);
        const err = await res.json();
        alert(err.message);
      }
    } catch (err) {
      clearInterval(progressInterval);
      setIsUploading(false);
      console.error(err);
    }
  };

  // Inventory: Delete product
  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this chocolate product?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/owner/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${ownerToken}` }
      });
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Settings: Save Contacts
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/owner/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ownerToken}`
        },
        body: JSON.stringify({
          contact_phone: sPhone,
          contact_email: sEmail,
          contact_address: sAddress,
          alert_sound: sSound,
          instagram_username: sInstagram,
          payment_instructions: sInstructions
        })
      });

      if (res.ok) {
        alert('Concierge settings updated successfully.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Settings: Upload Payment QR Code
  const handleUploadQr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sQrFile) return;

    const formData = new FormData();
    formData.append('logo', sQrFile);

    try {
      const res = await fetch('http://localhost:5000/api/owner/settings/qr', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${ownerToken}` },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        alert('Payment QR code image uploaded and updated successfully!');
        setSQrUrl(data.url);
        setSQrFile(null);
      } else {
        const err = await res.json();
        alert(err.message || 'Error uploading payment QR code.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Settings: Upload Custom Ringtone
  const handleUploadRingtone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sRingtoneFile) return;

    const formData = new FormData();
    formData.append('ringtone', sRingtoneFile);

    try {
      const res = await fetch('http://localhost:5000/api/owner/settings/ringtone', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${ownerToken}` },
        body: formData
      });

      if (res.ok) {
        await res.json();
        alert('Custom MP3 ringtone uploaded successfully!');
        setSSound('custom');
        setSRingtoneFile(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Settings: Upload Custom Brand Logo
  const handleUploadLogo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sLogoFile) return;

    const formData = new FormData();
    formData.append('logo', sLogoFile);

    try {
      const res = await fetch('http://localhost:5000/api/owner/settings/logo', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${ownerToken}` },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        alert('Brand logo uploaded and updated.');
        setSLogoUrl(data.url);
        setSLogoFile(null);
      } else {
        const err = await res.json();
        alert(err.message || 'Error uploading logo.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-brand-darkBg text-white">
        <div className="w-8 h-8 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Unlocking Executive Suite...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-darkBg text-zinc-300 font-sans flex flex-col md:flex-row text-left">
      
      {/* 1. REAL-TIME FLOATING NEW ORDER ALARM OVERLAY */}
      {orderAlert && (
        <div className="fixed inset-0 z-[9999] bg-brand-darkBg/95 flex items-center justify-center p-6 border-4 border-brand-gold">
          <div className="max-w-md w-full bg-brand-panelBg border border-brand-gold/30 rounded-3xl p-8 space-y-6 text-center shadow-2xl animate-bounce">
            <div className="w-16 h-16 bg-brand-gold/15 border-2 border-brand-gold rounded-full flex items-center justify-center mx-auto text-brand-gold animate-ping">
              <Bell size={32} />
            </div>
            
            <h2 className="text-2xl font-serif text-brand-goldLight uppercase font-extrabold tracking-wider">
              Incoming Order Received!
            </h2>
            <p className="text-sm text-zinc-400">
              Order #{orderAlert.id} placed by {orderAlert.customer_name}.<br />
              Settled Amount: <span className="text-brand-gold font-bold">${orderAlert.total_amount.toFixed(2)}</span>
            </p>

            <button
              onClick={acknowledgeAlert}
              className="w-full py-4 bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg"
            >
              ✓ Acknowledge & Mute Alarm
            </button>
          </div>
        </div>
      )}

      {/* 2. SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-brand-panelBg border-r border-brand-maroon/20 p-6 flex flex-col justify-between gap-6">
        <div className="space-y-8">
          <div className="flex flex-col border-b border-brand-maroon/20 pb-4">
            <span className="font-serif text-lg font-bold text-brand-gold tracking-widest uppercase">
              OWNER PORTAL
            </span>
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5">
              Mani's Kote Factory
            </span>
          </div>

          <nav className="flex flex-col gap-2.5 text-xs uppercase tracking-wider font-semibold">
            <button 
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-colors ${activeTab === 'analytics' ? 'bg-brand-gold text-brand-maroonDark' : 'hover:bg-white/5 text-zinc-400 hover:text-white'}`}
            >
              <BarChart3 size={15} /> Live Analytics
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-colors ${activeTab === 'orders' ? 'bg-brand-gold text-brand-maroonDark' : 'hover:bg-white/5 text-zinc-400 hover:text-white'}`}
            >
              <ShoppingCart size={15} /> Manage Orders
            </button>
            <button 
              onClick={() => setActiveTab('overall_review')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-colors cursor-pointer ${activeTab === 'overall_review' ? 'bg-brand-gold text-brand-maroonDark font-bold' : 'hover:bg-white/5 text-zinc-400 hover:text-white'}`}
            >
              <Eye size={15} /> Overall Review
            </button>
            <button 
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-colors ${activeTab === 'inventory' ? 'bg-brand-gold text-brand-maroonDark' : 'hover:bg-white/5 text-zinc-400 hover:text-white'}`}
            >
              <Layers size={15} /> Chocolate CRUD
            </button>
            <button 
              onClick={() => setActiveTab('reviews')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-colors ${activeTab === 'reviews' ? 'bg-brand-gold text-brand-maroonDark' : 'hover:bg-white/5 text-zinc-400 hover:text-white'}`}
            >
              <Star size={15} /> Review Queue
            </button>
            <button 
              onClick={() => setActiveTab('jobs')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-colors cursor-pointer ${activeTab === 'jobs' ? 'bg-brand-gold text-brand-maroonDark font-bold' : 'hover:bg-white/5 text-zinc-400 hover:text-white'}`}
            >
              <Briefcase size={15} /> Job Offerings
            </button>
            <button 
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-colors cursor-pointer ${activeTab === 'notifications' ? 'bg-brand-gold text-brand-maroonDark font-bold' : 'hover:bg-white/5 text-zinc-400 hover:text-white'}`}
            >
              <Bell size={15} /> Notifications
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-colors cursor-pointer ${activeTab === 'settings' ? 'bg-brand-gold text-brand-maroonDark font-bold' : 'hover:bg-white/5 text-zinc-400 hover:text-white'}`}
            >
              <Settings size={15} /> Sound Settings
            </button>
            <button 
              onClick={() => setActiveTab('locations')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-colors cursor-pointer ${activeTab === 'locations' ? 'bg-brand-gold text-brand-maroonDark font-bold' : 'hover:bg-white/5 text-zinc-400 hover:text-white'}`}
            >
              <MapPin size={15} /> Map Locations
            </button>
          </nav>
        </div>

        <div className="border-t border-brand-maroon/10 pt-4 flex items-center justify-between">
          <div className="text-left">
            <p className="text-[10px] text-zinc-400 leading-tight font-semibold">{owner?.name}</p>
            <p className="text-[8px] text-zinc-600 uppercase tracking-wider">Owner admin</p>
          </div>
          <button 
            onClick={() => { ownerLogout(); navigate('/owner/login'); }}
            className="p-2 text-zinc-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* 3. MAIN TABBED CONTENTS PANEL */}
      <main className="flex-1 p-6 md:p-10 space-y-6 overflow-y-auto max-h-screen">
        
        {/* TAB 1: Live Analytics Dashboard */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-2xl font-serif text-white">LIVE CONSOLE ANALYTICS</h2>
            <SalesAnalytics token={ownerToken || ''} role="owner" />
          </div>
        )}

        {/* TAB 2: Orders Manager */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-2xl font-serif text-white">MANAGE CUSTOMER ORDERS</h2>
            
            <div className="bg-brand-panelBg border border-brand-maroon/20 rounded-2xl p-6">
              {orders.length === 0 ? (
                <p className="text-xs text-zinc-500 py-10 text-center">No orders placed yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-brand-maroon/15 text-zinc-500 uppercase tracking-widest text-[9px] font-bold">
                        <th className="py-3">Order ID</th>
                        <th className="py-3">Customer</th>
                        <th className="py-3">Address & Coordinates</th>
                        <th className="py-3 text-right">Total</th>
                        <th className="py-3 text-center">Payment Verification</th>
                        <th className="py-3 text-center">Status</th>
                        <th className="py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(o => {
                        const itemsStr = o.items ? o.items.map((i: any) => `${i.name} (${i.quantity}x)`).join(', ') : 'Chocolates';
                        const phoneMatch = o.address ? o.address.match(/(?:Phone|phone):\s*([+\d\s-]+)/) : null;
                        const phoneDisplay = o.customer_phone || o.guest_info?.phone || (phoneMatch ? phoneMatch[1].trim() : '') || 'N/A';
                        const phoneClean = phoneDisplay !== 'N/A' ? phoneDisplay.replace(/[^\d+]/g, '') : '';

                        const handleSendWhatsApp = () => {
                          const msg = `Hello ${o.customer_name || 'Valued Customer'},\n\nYour order #${o.id} at Mani's Kote Chocolate Factory is confirmed!\n\n📦 *Order Summary:*\n- Items: ${itemsStr}\n- Total Amount: ₹${o.total_amount}\n- Delivery Charge: ${o.delivery_charge ? '₹' + o.delivery_charge : 'FREE'}\n- Payment Method: ${(o.payment_method || 'COD').toUpperCase()}\n- Expected Delivery: ${o.expected_delivery_date || '3-5 Business Days'}\n\nThank you for choosing Mani's Kote!`;
                          window.open(`https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}`, '_blank');
                        };

                        return (
                          <tr key={o.id} className="border-b border-brand-maroon/5 hover:bg-white/5 transition-colors">
                            <td className="py-4 font-bold text-brand-gold">#{o.id}</td>
                            <td className="py-4 text-left">
                              <p className="font-semibold text-white leading-tight">{o.customer_name || 'Valued Customer'}</p>
                              <p className="text-[9px] text-zinc-400 break-all">{o.customer_email || ''}</p>
                              <p className="text-[10px] text-brand-gold font-mono font-semibold">{phoneDisplay}</p>
                            </td>
                            <td className="py-4 max-w-xs text-zinc-400 leading-relaxed text-left" title={o.address}>
                              <p className="truncate">{o.address}</p>
                              {o.coordinates && o.coordinates.lat && o.coordinates.lng && (
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${o.coordinates.lat},${o.coordinates.lng}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[8px] text-brand-gold hover:underline font-mono uppercase tracking-widest block mt-1"
                                >
                                  View Location Pin Map 🗺️
                                </a>
                              )}
                            </td>
                            <td className="py-4 text-right font-bold text-white">₹{o.total_amount.toLocaleString()}</td>
                            <td className="py-4 text-center">
                              {o.payment_status === 'pending_confirmation' ? (
                                <div className="flex flex-col items-center gap-1.5">
                                  <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider font-mono">
                                    UTR: {o.transaction_ref}
                                  </span>
                                  <div className="flex gap-1 text-[8px] uppercase tracking-wider font-bold">
                                    <button
                                      onClick={() => handleConfirmPayment(o.id)}
                                      className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 rounded transition-colors cursor-pointer"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleRejectPayment(o.id)}
                                      className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded transition-colors cursor-pointer"
                                    >
                                      Decline
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                  o.payment_status === 'paid' 
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                    : o.payment_status === 'rejected'
                                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                    : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                                }`}>
                                  {o.payment_status === 'paid' ? 'Paid (Verified)' : o.payment_status === 'rejected' ? 'Rejected' : o.payment_status}
                                </span>
                              )}
                              {o.rejection_reason && (
                                <p className="text-[8px] text-red-400 mt-1 italic leading-tight">Reason: {o.rejection_reason}</p>
                              )}
                            </td>
                            <td className="py-4 text-center">
                              <select
                                value={o.status}
                                onChange={e => handleUpdateStatus(o.id, e.target.value)}
                                className="bg-brand-darkBg text-zinc-300 text-[11px] font-semibold border border-brand-gold/30 rounded px-2.5 py-1.5 focus:border-brand-gold outline-none cursor-pointer"
                              >
                                <option value="Packing">Packing</option>
                                <option value="Out for Delivery">Out for Delivery</option>
                                <option value="Delivered">Delivered</option>
                                <option value="pending">Pending</option>
                                <option value="preparing">Preparing</option>
                                <option value="Cancelled">Cancelled</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>
                            <td className="py-4 text-center">
                              <button
                                onClick={handleSendWhatsApp}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-extrabold uppercase tracking-wider rounded-lg transition-all shadow cursor-pointer flex items-center justify-center gap-1 mx-auto"
                                title="Send WhatsApp Confirmation to Customer"
                              >
                                <Send size={10} /> Send WhatsApp
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2B: Overall Review Section */}
        {activeTab === 'overall_review' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <AdminOverallReview token={ownerToken || ''} />
          </div>
        )}

        {/* TAB 3: Inventory CRUD */}
        {activeTab === 'inventory' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-300">
            
            {/* Left Column: List of current products */}
            <div className="lg:col-span-6 bg-brand-panelBg border border-brand-maroon/20 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm text-brand-gold uppercase tracking-wider font-semibold border-b border-brand-maroon/10 pb-2">
                Inventory Chocolates
              </h3>

              <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2">
                {products.map(p => (
                  <div key={p.id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="text-left space-y-1">
                      <h4 className="text-xs font-bold text-brand-goldLight">{p.name}</h4>
                      <p className="text-[9px] text-zinc-500">Slug: {p.slug} • Stock: {p.stock}</p>
                      <p className="text-[9px] text-zinc-400">
                        Category: {p.category}
                        {(p as any).cocoa_percentage && ` • Cocoa: ${(p as any).cocoa_percentage}%`}
                        {(p as any).weight && ` • Weight: ${(p as any).weight}`}
                        {(p as any).origin && ` • Origin: ${(p as any).origin}`}
                      </p>
                      <p className="text-[10px] font-bold text-white mt-1">${p.price.toFixed(2)}</p>
                      {p.video_url && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[7px] bg-brand-gold/20 text-brand-goldLight border border-brand-gold/30 px-1.5 py-0.5 rounded uppercase font-extrabold inline-block">
                            Showcase Video Attached
                          </span>
                          <button 
                            onClick={() => {
                              const url = getAssetUrl(p.video_url);
                              window.open(url, '_blank');
                            }}
                            className="text-[8px] text-brand-gold hover:underline font-bold uppercase tracking-wider cursor-pointer"
                          >
                            Preview
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1">
                      <button 
                        onClick={() => handleEditProductClick(p)}
                        className="px-2.5 py-1 bg-brand-gold/10 hover:bg-brand-gold text-brand-gold hover:text-brand-maroonDark border border-brand-gold/20 rounded text-[9px] font-extrabold uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(p.id)}
                        className="px-2.5 py-1 bg-red-950/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 hover:border-red-500 rounded text-[9px] font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-0.5 cursor-pointer"
                        title="Delete Product"
                      >
                        <Trash2 size={10} /> Del
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Add/Edit chocolate item form */}
            <div className="lg:col-span-6 bg-brand-panelBg border border-brand-maroon/20 rounded-2xl p-6">
              <h3 className="text-sm text-brand-gold uppercase tracking-wider font-semibold border-b border-brand-maroon/10 pb-2 mb-4">
                {pId ? `Edit Chocolate: ${pName}` : 'Add Premium Chocolate'}
              </h3>

              <form id="chocolate-form" onSubmit={handleAddProduct} className="space-y-4 text-left">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Chocolate Name</label>
                    <input 
                      type="text" 
                      value={pName}
                      onChange={e => { setPName(e.target.value); if (!pId) setPSlug(e.target.value.toLowerCase().replace(/\s+/g, '-')); }}
                      required
                      placeholder="e.g. Lavender Silk Noir"
                      className="w-full bg-brand-darkBg border border-brand-gold/20 focus:border-brand-gold rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Slug URL Name</label>
                    <input 
                      type="text" 
                      value={pSlug}
                      onChange={e => setPSlug(e.target.value)}
                      required
                      placeholder="e.g. lavender-silk-noir"
                      className="w-full bg-brand-darkBg border border-brand-gold/20 focus:border-brand-gold rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Description</label>
                  <textarea 
                    value={pDesc}
                    onChange={e => setPDesc(e.target.value)}
                    rows={2}
                    placeholder="Describe flavor notes, cocoa source..."
                    className="w-full bg-brand-darkBg border border-brand-gold/20 focus:border-brand-gold rounded-lg px-3 py-2 text-xs text-white outline-none resize-none transition-colors"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Category</label>
                    <select 
                      value={pCat}
                      onChange={e => setPCat(e.target.value)}
                      className="w-full bg-brand-darkBg border border-brand-gold/20 focus:border-brand-gold rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors"
                    >
                      <option value="Dark Chocolate">Dark Chocolate</option>
                      <option value="Milk Chocolate">Milk Chocolate</option>
                      <option value="White Chocolate">White Chocolate</option>
                      <option value="Botanical Chocolate">Botanical Chocolate</option>
                      <option value="Custom Creation">Custom Creation</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Cocoa Percentage (%)</label>
                    <input 
                      type="number" 
                      value={pCocoa}
                      onChange={e => setPCocoa(e.target.value)}
                      placeholder="e.g. 72"
                      className="w-full bg-brand-darkBg border border-brand-gold/20 focus:border-brand-gold rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Weight</label>
                    <input 
                      type="text" 
                      value={pWeight}
                      onChange={e => setPWeight(e.target.value)}
                      placeholder="e.g. 100g (3.5 oz)"
                      className="w-full bg-brand-darkBg border border-brand-gold/20 focus:border-brand-gold rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Origin</label>
                    <input 
                      type="text" 
                      value={pOrigin}
                      onChange={e => setPOrigin(e.target.value)}
                      placeholder="e.g. Venezuelan Criollo"
                      className="w-full bg-brand-darkBg border border-brand-gold/20 focus:border-brand-gold rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Dietary Tags (comma separated)</label>
                    <input 
                      type="text" 
                      value={pTags}
                      onChange={e => setPTags(e.target.value)}
                      placeholder="vegan, gluten-free, organic"
                      className="w-full bg-brand-darkBg border border-brand-gold/20 focus:border-brand-gold rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Allergens (comma separated)</label>
                    <input 
                      type="text" 
                      value={pAllergens}
                      onChange={e => setPAllergens(e.target.value)}
                      placeholder="milk, tree nuts, soy"
                      className="w-full bg-brand-darkBg border border-brand-gold/20 focus:border-brand-gold rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Ingredients (comma separated)</label>
                  <input 
                    type="text" 
                    value={pIngredients}
                    onChange={e => setPIngredients(e.target.value)}
                    placeholder="Cocoa Mass, Cocoa Butter, Sugar"
                    className="w-full bg-brand-darkBg border border-brand-gold/20 focus:border-brand-gold rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors"
                  />
                </div>

                {/* SPECIFICATIONS SUB-FORM */}
                <div className="border border-brand-maroon/20 rounded-xl p-3 bg-brand-darkBg/30 space-y-2">
                  <h4 className="text-[10px] text-brand-gold uppercase tracking-wider font-bold">Product Specifications</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[8px] text-zinc-500 uppercase mb-0.5">Packaging</label>
                      <input 
                        type="text" 
                        value={pSpecPackaging} 
                        onChange={e => setPSpecPackaging(e.target.value)} 
                        placeholder="Velvet Case"
                        className="w-full bg-brand-darkBg border border-brand-gold/15 focus:border-brand-gold rounded px-2 py-1 text-[10px] text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] text-zinc-500 uppercase mb-0.5">Shelf Life</label>
                      <input 
                        type="text" 
                        value={pSpecShelfLife} 
                        onChange={e => setPSpecShelfLife(e.target.value)} 
                        placeholder="6 Months"
                        className="w-full bg-brand-darkBg border border-brand-gold/15 focus:border-brand-gold rounded px-2 py-1 text-[10px] text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] text-zinc-500 uppercase mb-0.5">Storage</label>
                      <input 
                        type="text" 
                        value={pSpecStorage} 
                        onChange={e => setPSpecStorage(e.target.value)} 
                        placeholder="Cool, dry"
                        className="w-full bg-brand-darkBg border border-brand-gold/15 focus:border-brand-gold rounded px-2 py-1 text-[10px] text-white outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* NUTRITION SUB-FORM */}
                <div className="border border-brand-maroon/20 rounded-xl p-3 bg-brand-darkBg/30 space-y-2">
                  <h4 className="text-[10px] text-brand-gold uppercase tracking-wider font-bold">Nutritional Info (per 100g)</h4>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[8px] text-zinc-500 uppercase mb-0.5">Calories</label>
                      <input 
                        type="text" 
                        value={pNutCalories} 
                        onChange={e => setPNutCalories(e.target.value)} 
                        placeholder="540 kcal"
                        className="w-full bg-brand-darkBg border border-brand-gold/15 focus:border-brand-gold rounded px-2 py-1 text-[10px] text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] text-zinc-500 uppercase mb-0.5">Fat</label>
                      <input 
                        type="text" 
                        value={pNutFat} 
                        onChange={e => setPNutFat(e.target.value)} 
                        placeholder="36g"
                        className="w-full bg-brand-darkBg border border-brand-gold/15 focus:border-brand-gold rounded px-2 py-1 text-[10px] text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] text-zinc-500 uppercase mb-0.5">Sugars</label>
                      <input 
                        type="text" 
                        value={pNutSugar} 
                        onChange={e => setPNutSugar(e.target.value)} 
                        placeholder="28g"
                        className="w-full bg-brand-darkBg border border-brand-gold/15 focus:border-brand-gold rounded px-2 py-1 text-[10px] text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] text-zinc-500 uppercase mb-0.5">Protein</label>
                      <input 
                        type="text" 
                        value={pNutProtein} 
                        onChange={e => setPNutProtein(e.target.value)} 
                        placeholder="7g"
                        className="w-full bg-brand-darkBg border border-brand-gold/15 focus:border-brand-gold rounded px-2 py-1 text-[10px] text-white outline-none"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Price (₹)</label>
                    <input 
                      type="number" 
                      step="1"
                      value={pPrice}
                      onChange={e => setPPrice(e.target.value)}
                      required
                      placeholder="500"
                      className="w-full bg-brand-darkBg border border-brand-gold/20 focus:border-brand-gold rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Stock Quantity</label>
                    <input 
                      type="number" 
                      value={pStock}
                      onChange={e => setPStock(e.target.value)}
                      required
                      placeholder="50"
                      className="w-full bg-brand-darkBg border border-brand-gold/20 focus:border-brand-gold rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] text-zinc-400 uppercase tracking-wider mb-1">Delivery Charge (₹)</label>
                    <input 
                      type="number" 
                      value={pDeliveryCharge}
                      onChange={e => setPDeliveryCharge(e.target.value)}
                      placeholder="0 for FREE"
                      className="w-full bg-brand-darkBg border border-brand-gold/20 focus:border-brand-gold rounded-lg px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-zinc-400 uppercase tracking-wider mb-1">Expected Delivery Date</label>
                    <input 
                      type="text" 
                      value={pExpectedDeliveryDate}
                      onChange={e => setPExpectedDeliveryDate(e.target.value)}
                      placeholder="3-5 Business Days"
                      className="w-full bg-brand-darkBg border border-brand-gold/20 focus:border-brand-gold rounded-lg px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-zinc-400 uppercase tracking-wider mb-1">Cancellation Deadline</label>
                    <input 
                      type="text" 
                      value={pCancellationDeadline}
                      onChange={e => setPCancellationDeadline(e.target.value)}
                      placeholder="Within 24 hours of order"
                      className="w-full bg-brand-darkBg border border-brand-gold/20 focus:border-brand-gold rounded-lg px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                {/* Bestseller & New Arrival Checkboxes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2.5 bg-brand-darkBg/40 border border-brand-gold/15 rounded-xl p-3">
                    <input 
                      id="bestseller-checkbox"
                      type="checkbox" 
                      checked={pIsBestseller}
                      onChange={e => setPIsBestseller(e.target.checked)}
                      className="w-4 h-4 accent-brand-gold cursor-pointer rounded"
                    />
                    <label htmlFor="bestseller-checkbox" className="text-[10px] text-brand-gold uppercase tracking-wider cursor-pointer font-extrabold select-none">
                      ★ Mark as BESTSELLER Badge
                    </label>
                  </div>

                  <div className="flex items-center gap-2.5 bg-brand-darkBg/40 border border-brand-gold/15 rounded-xl p-3">
                    <input 
                      id="new-arrival-checkbox"
                      type="checkbox" 
                      checked={pIsNew}
                      onChange={e => setPIsNew(e.target.checked)}
                      className="w-4 h-4 accent-brand-gold cursor-pointer rounded"
                    />
                    <label htmlFor="new-arrival-checkbox" className="text-[10px] text-zinc-300 uppercase tracking-wider cursor-pointer font-bold select-none">
                      ✦ Mark as New Arrival
                    </label>
                  </div>
                </div>
                
                {/* MEDIA UPLOADS / URL INPUTS */}
                <div className="border border-brand-maroon/20 rounded-xl p-4 bg-brand-darkBg/30 space-y-4">
                  <h4 className="text-[10px] text-brand-gold uppercase tracking-wider font-bold border-b border-brand-maroon/10 pb-2">
                    Product Media Asset Management
                  </h4>
                  
                  {/* Upload Progress Bar Indicator */}
                  {isUploading && (
                    <div className="bg-zinc-950/80 border border-brand-gold/25 rounded-xl p-3 space-y-2">
                      <div className="flex justify-between text-[9px] uppercase tracking-widest font-bold">
                        <span className="text-brand-gold">Uploading Luxury Assets...</span>
                        <span className="text-white">{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-gold transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  )}

                  {/* 1. Product Image / Label File Drag & Drop Zone */}
                  <div className="space-y-1.5">
                    <label className="block text-[8px] text-zinc-500 uppercase tracking-widest font-bold">
                      Chocolate Label Artwork / Image (Required)
                    </label>
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file && validateImage(file)) {
                          setPImageFile(file);
                          setImagePreviewUrl(URL.createObjectURL(file));
                        }
                      }}
                      onClick={() => document.getElementById('image-picker')?.click()}
                      className="border-2 border-dashed border-brand-gold/15 hover:border-brand-gold/45 rounded-xl p-5 text-center cursor-pointer transition-colors bg-white/5 relative group min-h-[100px] flex flex-col items-center justify-center gap-2"
                    >
                      <input 
                        id="image-picker"
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && validateImage(file)) {
                            setPImageFile(file);
                            setImagePreviewUrl(URL.createObjectURL(file));
                          }
                        }}
                        className="hidden"
                      />
                      
                      {imagePreviewUrl ? (
                        <div className="flex items-center gap-4 text-left z-10 w-full" onClick={(e) => e.stopPropagation()}>
                          <img src={imagePreviewUrl} alt="Label Preview" className="w-16 h-16 object-contain rounded border border-brand-gold/20 bg-black/40" />
                          <div className="flex-1 truncate">
                            <p className="text-[10px] text-white font-bold truncate">{pImageFile ? pImageFile.name : 'Active Database Label'}</p>
                            <p className="text-[8px] text-zinc-500 uppercase">{pImageFile ? `${(pImageFile.size / 1024 / 1024).toFixed(2)} MB` : 'Currently active'}</p>
                            <button
                              type="button"
                              onClick={() => {
                                setPImageFile(null);
                                setImagePreviewUrl('');
                              }}
                              className="text-[8px] text-red-400 hover:text-red-300 font-extrabold uppercase tracking-widest mt-1 cursor-pointer block"
                            >
                              Remove Label
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-[10px] text-zinc-300 font-semibold group-hover:text-white transition-colors">
                            Drag & drop label artwork here, or <span className="text-brand-gold font-bold">browse</span>
                          </p>
                          <p className="text-[8px] text-zinc-500 uppercase tracking-wider">
                            Supported: JPG, PNG, WEBP, SVG (Max 5MB)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 1b. Product Image URL (alternative to file upload) */}
                  <div className="space-y-1.5">
                    <label className="block text-[8px] text-zinc-500 uppercase tracking-widest font-bold">
                      Or Set Image via Direct URL
                    </label>
                    <input
                      type="url"
                      value={pImageUrl}
                      onChange={e => {
                        setPImageUrl(e.target.value);
                        if (e.target.value.trim()) {
                          setImagePreviewUrl(e.target.value.trim());
                        }
                      }}
                      placeholder="https://example.com/chocolate-image.jpg"
                      className="w-full bg-brand-darkBg border border-brand-gold/15 focus:border-brand-gold/50 rounded-lg px-3 py-2 text-[10px] text-white outline-none transition-colors font-mono"
                    />
                    {pImageUrl.trim() && (
                      <p className="text-[8px] text-emerald-400 uppercase tracking-wider">✓ Image URL set — will override file upload</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[8px] text-zinc-500 uppercase tracking-widest font-bold">
                      Chocolate Intro Video
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* URL input fallback */}
                      <div className="flex flex-col justify-center">
                        <label className="block text-[8px] text-zinc-600 uppercase mb-1 font-semibold">Video Direct URL</label>
                        <input 
                          type="text" 
                          value={pVideoUrl}
                          onChange={e => {
                            setPVideoUrl(e.target.value);
                            if (e.target.value) setVideoPreviewUrl(e.target.value);
                          }}
                          placeholder="https://player.cloudinary.com/..."
                          className="w-full bg-brand-darkBg border border-brand-gold/15 focus:border-brand-gold rounded-lg px-2.5 py-2 text-xs text-white outline-none"
                        />
                      </div>
                      
                      {/* Video drop zone */}
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files?.[0];
                          if (file && validateVideo(file)) {
                            setPVideoFile(file);
                            setVideoPreviewUrl(URL.createObjectURL(file));
                          }
                        }}
                        onClick={() => document.getElementById('video-picker')?.click()}
                        className="border-2 border-dashed border-brand-gold/15 hover:border-brand-gold/45 rounded-xl p-4 text-center cursor-pointer transition-colors bg-white/5 relative group min-h-[90px] flex flex-col items-center justify-center gap-1.5"
                      >
                        <input 
                          id="video-picker"
                          type="file" 
                          accept="video/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && validateVideo(file)) {
                              setPVideoFile(file);
                              setVideoPreviewUrl(URL.createObjectURL(file));
                            }
                          }}
                          className="hidden"
                        />
                        
                        {videoPreviewUrl ? (
                          <div className="flex items-center gap-3 text-left z-10 w-full" onClick={(e) => e.stopPropagation()}>
                            <div className="w-14 h-10 bg-black rounded border border-brand-gold/20 flex items-center justify-center text-[10px]">
                              🎬
                            </div>
                            <div className="flex-1 truncate">
                              <p className="text-[9px] text-white font-bold truncate">{pVideoFile ? pVideoFile.name : 'Active Database Video'}</p>
                              <p className="text-[8px] text-zinc-500 uppercase">{pVideoFile ? `${(pVideoFile.size / 1024 / 1024).toFixed(1)} MB` : 'Currently active'}</p>
                              <button
                                type="button"
                                onClick={() => {
                                  setPVideoFile(null);
                                  setVideoPreviewUrl('');
                                  setPVideoUrl('');
                                }}
                                className="text-[8px] text-red-400 hover:text-red-300 font-extrabold uppercase tracking-widest mt-0.5 cursor-pointer block"
                              >
                                Remove Video
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <p className="text-[9px] text-zinc-300 font-semibold group-hover:text-white transition-colors">
                              Drag & drop video, or <span className="text-brand-gold font-bold">browse</span>
                            </p>
                            <p className="text-[8px] text-zinc-500 uppercase tracking-wider">
                              MP4, WebM, MOV (Max 50MB)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 3. Video Thumbnail File Drag & Drop Zone */}
                  <div className="space-y-1.5">
                    <label className="block text-[8px] text-zinc-500 uppercase tracking-widest font-bold">
                      Video Thumbnail Artwork
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* URL input fallback */}
                      <div className="flex flex-col justify-center">
                        <label className="block text-[8px] text-zinc-600 uppercase mb-1 font-semibold">Thumbnail URL</label>
                        <input 
                          type="text" 
                          value={pVideoThumbnailUrl}
                          onChange={e => {
                            setPVideoThumbnailUrl(e.target.value);
                            if (e.target.value) setThumbPreviewUrl(e.target.value);
                          }}
                          placeholder="https://images.cloudinary.com/..."
                          className="w-full bg-brand-darkBg border border-brand-gold/15 focus:border-brand-gold rounded-lg px-2.5 py-2 text-xs text-white outline-none"
                        />
                      </div>
                      
                      {/* Thumbnail drop zone */}
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files?.[0];
                          if (file && validateImage(file)) {
                            setPVideoThumbnailFile(file);
                            setThumbPreviewUrl(URL.createObjectURL(file));
                          }
                        }}
                        onClick={() => document.getElementById('thumb-picker')?.click()}
                        className="border-2 border-dashed border-brand-gold/15 hover:border-brand-gold/45 rounded-xl p-4 text-center cursor-pointer transition-colors bg-white/5 relative group min-h-[90px] flex flex-col items-center justify-center gap-1.5"
                      >
                        <input 
                          id="thumb-picker"
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && validateImage(file)) {
                              setPVideoThumbnailFile(file);
                              setThumbPreviewUrl(URL.createObjectURL(file));
                            }
                          }}
                          className="hidden"
                        />
                        
                        {thumbPreviewUrl ? (
                          <div className="flex items-center gap-3 text-left z-10 w-full" onClick={(e) => e.stopPropagation()}>
                            <img src={thumbPreviewUrl} alt="Thumbnail Preview" className="w-14 h-10 object-cover rounded border border-brand-gold/20 bg-black/40" />
                            <div className="flex-1 truncate">
                              <p className="text-[9px] text-white font-bold truncate">{pVideoThumbnailFile ? pVideoThumbnailFile.name : 'Active Database Thumb'}</p>
                              <p className="text-[8px] text-zinc-500 uppercase">{pVideoThumbnailFile ? `${(pVideoThumbnailFile.size / 1024 / 1024).toFixed(2)} MB` : 'Currently active'}</p>
                              <button
                                type="button"
                                onClick={() => {
                                  setPVideoThumbnailFile(null);
                                  setThumbPreviewUrl('');
                                  setPVideoThumbnailUrl('');
                                }}
                                className="text-[8px] text-red-400 hover:text-red-300 font-extrabold uppercase tracking-widest mt-0.5 cursor-pointer block"
                              >
                                Remove Thumb
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <p className="text-[9px] text-zinc-300 font-semibold group-hover:text-white transition-colors">
                              Drag & drop thumb, or <span className="text-brand-gold font-bold">browse</span>
                            </p>
                            <p className="text-[8px] text-zinc-500 uppercase tracking-wider">
                              JPG, PNG, WEBP, SVG (Max 5MB)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark font-extrabold text-xs uppercase tracking-widest rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Upload size={13} strokeWidth={2.5} /> {pId ? 'Update Chocolate Catalog' : 'Add to Stock Catalog'}
                  </button>
                  {pId && (
                    <button 
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-6 py-3 bg-brand-panelBg hover:bg-white/5 border border-brand-maroon/20 hover:border-brand-gold/30 text-zinc-400 hover:text-white font-bold text-xs uppercase tracking-widest rounded-lg transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
            
          </div>
        )}

        {/* TAB 4: Job Offerings Management */}
        {activeTab === 'jobs' && (
          <div className="animate-in fade-in duration-300">
            <AdminJobs token={ownerToken || ''} />
          </div>
        )}

        {/* TAB 4: Sound Settings */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-300">
            
            {/* Left Card: Ringtone test configurations (Section 5) */}
            <div className="bg-brand-panelBg border border-brand-maroon/20 rounded-2xl p-6 space-y-6">
              <h3 className="text-sm text-brand-gold uppercase tracking-wider font-semibold border-b border-brand-maroon/10 pb-2">
                WebSocket Sound Alerts (Test Console)
              </h3>

              <div className="space-y-4 text-left">
                {/* Volume slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-zinc-400 flex items-center gap-1.5"><Volume2 size={14} /> Alert Volume</span>
                    <span className="text-brand-gold">{Math.round(sVolume * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min={0} 
                    max={1} 
                    step={0.05} 
                    value={sVolume}
                    onChange={e => setSVolume(parseFloat(e.target.value))}
                    className="w-full accent-brand-gold h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Built-in Tone select */}
                <div>
                  <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Ringtone Preset</label>
                  <select
                    value={sSound}
                    onChange={e => setSSound(e.target.value)}
                    className="w-full bg-brand-darkBg text-zinc-300 text-xs font-semibold border border-brand-gold/30 rounded-lg px-3 py-2.5 focus:border-brand-gold outline-none"
                  >
                    <option value="cocoa-bell">Gold Cocoa Bell (High Chime)</option>
                    <option value="royal-gong">Imperial Royal Gong (Low Chime)</option>
                    <option value="gold-symphony">Gold Symphony (Double Harmony)</option>
                    <option value="custom">Uploaded Custom Alert (MP3 File)</option>
                  </select>
                </div>

                {/* Test triggers */}
                <div className="flex gap-2 pt-2 text-[10px] uppercase font-bold tracking-wider">
                  <button 
                    onClick={() => playSynthAlert(sSound)}
                    className="flex-1 py-2.5 bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark rounded-lg text-center transition-colors flex items-center justify-center gap-1 shadow"
                  >
                    <Play size={12} strokeWidth={3} /> Test sound alert once
                  </button>
                  <button 
                    onClick={() => startRingtoneLoop(sSound)}
                    className="flex-1 py-2.5 bg-brand-maroonDark border border-brand-gold/20 text-brand-gold hover:text-white rounded-lg text-center transition-colors flex items-center justify-center gap-1"
                  >
                    <Bell size={12} /> Test looping sound
                  </button>
                </div>

                {audioIntervalRef.current !== null && (
                  <button 
                    onClick={stopRingtoneLoop}
                    className="w-full py-2 bg-red-600/90 border border-red-500 text-white rounded-lg text-center text-[10px] uppercase font-bold tracking-wider hover:bg-red-700 transition-colors"
                  >
                    ✕ Stop loop sound
                  </button>
                )}
              </div>
            </div>

            {/* Right Card: Sound Uploader and Address Settings */}
            <div className="space-y-6">
              
              {/* Logo Uploader */}
              <div className="bg-brand-panelBg border border-brand-maroon/20 rounded-2xl p-6">
                <h3 className="text-sm text-brand-gold uppercase tracking-wider font-semibold border-b border-brand-maroon/10 pb-2 mb-4">
                  Upload Custom Brand Logo
                </h3>
                <form onSubmit={handleUploadLogo} className="space-y-4 text-left">
                  {sLogoUrl && (
                    <div className="flex items-center gap-4 mb-2 p-2 bg-brand-darkBg/60 border border-brand-gold/15 rounded-xl">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Active Logo:</span>
                      <img src={getAssetUrl(sLogoUrl)} alt="Brand Logo" className="w-12 h-12 object-contain" />
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Select Image File (.png / .jpg / .svg)</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={e => setSLogoFile(e.target.files ? e.target.files[0] : null)}
                      className="w-full text-xs text-zinc-500 file:bg-white/5 file:border-brand-gold/20 file:text-zinc-300 file:text-xs file:py-1.5 file:px-3 file:rounded-lg"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={!sLogoFile}
                    className={`w-full py-2.5 rounded-lg text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-1 transition-colors ${
                      sLogoFile ? 'bg-brand-gold text-brand-maroonDark hover:bg-brand-goldDark' : 'bg-white/5 text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    <Upload size={12} /> Upload & Set Logo
                  </button>
                </form>
              </div>

              {/* Ringtone Uploader */}
              <div className="bg-brand-panelBg border border-brand-maroon/20 rounded-2xl p-6">
                <h3 className="text-sm text-brand-gold uppercase tracking-wider font-semibold border-b border-brand-maroon/10 pb-2 mb-4">
                  Upload Custom Sound Alert
                </h3>
                <form onSubmit={handleUploadRingtone} className="space-y-4 text-left">
                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Select Sound File (.mp3 / .wav)</label>
                    <input 
                      type="file" 
                      accept="audio/*"
                      onChange={e => setSRingtoneFile(e.target.files ? e.target.files[0] : null)}
                      className="w-full text-xs text-zinc-500 file:bg-white/5 file:border-brand-gold/20 file:text-zinc-300 file:text-xs file:py-1.5 file:px-3 file:rounded-lg"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={!sRingtoneFile}
                    className={`w-full py-2.5 rounded-lg text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-1 transition-colors ${
                      sRingtoneFile ? 'bg-brand-gold text-brand-maroonDark hover:bg-brand-goldDark' : 'bg-white/5 text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    <Upload size={12} /> Upload & Set Ringtone
                  </button>
                </form>
              </div>

              {/* Coordinates Settings */}
              <div className="bg-brand-panelBg border border-brand-maroon/20 rounded-2xl p-6">
                <h3 className="text-sm text-brand-gold uppercase tracking-wider font-semibold border-b border-brand-maroon/10 pb-2 mb-4">
                  Concierge & Brand Settings
                </h3>
                <form onSubmit={handleSaveSettings} className="space-y-4 text-left">
                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Concierge Phone</label>
                    <input 
                      type="text" 
                      value={sPhone}
                      onChange={e => setSPhone(e.target.value)}
                      className="w-full bg-brand-darkBg border border-brand-gold/20 focus:border-brand-gold rounded-lg px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Concierge Email</label>
                    <input 
                      type="email" 
                      value={sEmail}
                      onChange={e => setSEmail(e.target.value)}
                      className="w-full bg-brand-darkBg border border-brand-gold/20 focus:border-brand-gold rounded-lg px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Business Address</label>
                    <input 
                      type="text" 
                      value={sAddress}
                      onChange={e => setSAddress(e.target.value)}
                      className="w-full bg-brand-darkBg border border-brand-gold/20 focus:border-brand-gold rounded-lg px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Instagram Username / Handle</label>
                    <input 
                      type="text" 
                      value={sInstagram}
                      onChange={e => setSInstagram(e.target.value)}
                      placeholder="e.g. maniskotefactory"
                      className="w-full bg-brand-darkBg border border-brand-gold/20 focus:border-brand-gold rounded-lg px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1">QR Payment Instructions</label>
                    <textarea 
                      value={sInstructions}
                      onChange={e => setSInstructions(e.target.value)}
                      rows={3}
                      placeholder="Scan and complete UPI transfer..."
                      className="w-full bg-brand-darkBg border border-brand-gold/20 focus:border-brand-gold rounded-lg px-3 py-2 text-xs text-white outline-none resize-none"
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="w-full py-2.5 bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark font-bold text-xs uppercase tracking-widest rounded-lg flex items-center justify-center gap-1"
                  >
                    Save Brand & Concierge Settings
                  </button>
                </form>
              </div>

              {/* Payment QR Code Uploader */}
              <div className="bg-brand-panelBg border border-brand-maroon/20 rounded-2xl p-6">
                <h3 className="text-sm text-brand-gold uppercase tracking-wider font-semibold border-b border-brand-maroon/10 pb-2 mb-4">
                  Upload Payment UPI QR Code
                </h3>
                <form onSubmit={handleUploadQr} className="space-y-4 text-left">
                  {sQrUrl && (
                    <div className="flex items-center gap-4 mb-2 p-2 bg-brand-darkBg/60 border border-brand-gold/15 rounded-xl">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Active QR Code:</span>
                      <img 
                        src={getAssetUrl(sQrUrl)} 
                        alt="UPI QR Code" 
                        className="w-20 h-20 object-contain bg-white p-1 rounded border border-zinc-800" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/assets/qr-placeholder.png';
                        }}
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Select QR Code Image (.png / .jpg / .svg)</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={e => setSQrFile(e.target.files ? e.target.files[0] : null)}
                      className="w-full text-xs text-zinc-500 file:bg-white/5 file:border-brand-gold/20 file:text-zinc-300 file:text-xs file:py-1.5 file:px-3 file:rounded-lg"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={!sQrFile}
                    className={`w-full py-2.5 rounded-lg text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-1 transition-colors ${
                      sQrFile ? 'bg-brand-gold text-brand-maroonDark hover:bg-brand-goldDark' : 'bg-white/5 text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    <Upload size={12} /> Upload & Set UPI QR Code
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}

        {/* TAB 5: Reviews Moderation */}
        {activeTab === 'reviews' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-2xl font-serif text-white">MODERATION QUEUE</h2>
            <AdminReviews token={ownerToken || ''} role="owner" />
          </div>
        )}

        {/* TAB 8: Notifications Center */}
        {activeTab === 'notifications' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-2xl font-serif text-white">ALERTS LOG</h2>
            <NotificationsCenter token={ownerToken || ''} role="owner" />
          </div>
        )}

        {/* TAB: Map Locations */}
        {activeTab === 'locations' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-2xl font-serif text-white">STORE LOCATIONS</h2>
            <AdminLocations token={ownerToken || ''} role="owner" />
          </div>
        )}

        {/* TAB: Job Offerings */}
        {activeTab === 'jobs' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-2xl font-serif text-white">JOB OFFERINGS</h2>
            <AdminJobs token={ownerToken || ''} />
          </div>
        )}

        {/* TAB: Customer Messages */}
        {activeTab === 'messages' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-2xl font-serif text-white">CUSTOMER MESSAGES</h2>
            <CustomerMessages token={ownerToken || ''} role="owner" />
          </div>
        )}

      </main>

    </div>
  );
};

export default OwnerDashboard;
