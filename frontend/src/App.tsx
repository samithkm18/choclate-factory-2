import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Import public components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CustomCursor from './components/CustomCursor';
import CustomerCare from './components/CustomerCare';
import LogoIntro from './components/LogoIntro';
import BoxBuilder from './components/BoxBuilder';

// Import public pages
import Home from './pages/Home';
import About from './pages/About';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Account from './pages/Account';
import OrderTrack from './pages/OrderTrack';
import UserLogin from './pages/UserLogin';
import UserRegister from './pages/UserRegister';
import LoginSuccess from './pages/LoginSuccess';

// Import Admin/Owner pages
import OwnerLogin from './pages/owner/OwnerLogin';
import OwnerDashboard from './pages/owner/OwnerDashboard';

// Import Mwc Developer pages
import MwcLogin from './pages/mwc/MwcLogin';
import MwcDashboard from './pages/mwc/MwcDashboard';

// Layout wrapper for User portal routes
const UserLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [banner, setBanner] = useState('');
  const location = useLocation();

  // Reset scroll on navigation
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Initialize Lenis smooth scroll linked to GSAP ScrollTrigger
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(lenis.raf);
    };
  }, []);

  useEffect(() => {
    fetch('http://localhost:5000/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && data.announcement_banner) {
          setBanner(data.announcement_banner);
        }
      })
      .catch(err => console.error('Error loading announcement banner:', err));
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-brand-darkBg text-white selection:bg-brand-gold selection:text-brand-maroonDark relative">
      {/* Dynamic Announcement Banner at the very top */}
      {banner && (
        <div className="w-full bg-brand-maroon text-brand-goldLight text-[10px] uppercase font-bold tracking-[0.2em] py-2 px-4 text-center border-b border-brand-gold/15 z-[9905] relative mt-0">
          {banner}
        </div>
      )}
      
      <Navbar />
      
      {/* Main client workspace content */}
      <div className={`flex-grow ${location.pathname === '/' ? 'pt-0' : 'pt-20'}`}>
        {children}
      </div>

      <Footer />
      <CustomerCare />
      <CustomCursor />
    </div>
  );
};

// Root Router wrapper to handle first-visit LogoIntro overlay
const RootSelector: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true);
  const location = useLocation();

  // Only display the logo fill pour animation on the public landing page on initial load
  const isHomepage = location.pathname === '/';

  useEffect(() => {
    const watched = sessionStorage.getItem('manis_intro_watched');
    if (watched === 'true' || !isHomepage) {
      setShowIntro(false);
    }
  }, [isHomepage]);

  return (
    <>
      {showIntro && isHomepage && (
        <LogoIntro onComplete={() => setShowIntro(false)} />
      )}
    <Routes>
      {/* 1. Public storefront User Portal */}
      <Route path="/" element={<UserLayout><Home /></UserLayout>} />
      <Route path="/about" element={<UserLayout><About /></UserLayout>} />
      <Route path="/catalog" element={<UserLayout><Catalog /></UserLayout>} />
      <Route path="/builder" element={<UserLayout><BoxBuilder /></UserLayout>} />
      <Route path="/product/:slug" element={<UserLayout><ProductDetail /></UserLayout>} />
      <Route path="/cart" element={<UserLayout><Cart /></UserLayout>} />
      <Route path="/checkout" element={<UserLayout><Checkout /></UserLayout>} />
      <Route path="/account" element={<UserLayout><Account /></UserLayout>} />
      <Route path="/track/:id" element={<UserLayout><OrderTrack /></UserLayout>} />
      <Route path="/login" element={<UserLayout><UserLogin /></UserLayout>} />
      <Route path="/register" element={<UserLayout><UserRegister /></UserLayout>} />
      <Route path="/login-success" element={<UserLayout><LoginSuccess /></UserLayout>} />

      {/* 2. Isolated Owner Portal */}
      <Route path="/owner" element={<OwnerLogin />} />
      <Route path="/owner/login" element={<OwnerLogin />} />
      <Route path="/owner/dashboard" element={<OwnerDashboard />} />

      {/* 3. Isolated MWC Maintenance Portal */}
      <Route path="/mwc" element={<MwcLogin />} />
      <Route path="/mwc/login" element={<MwcLogin />} />
      <Route path="/mwc/dashboard" element={<MwcDashboard />} />
    </Routes>
  </>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <RootSelector />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
