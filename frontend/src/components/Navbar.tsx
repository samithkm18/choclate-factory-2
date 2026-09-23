import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Compass, Layers, Sun, Moon, Menu, X, ShoppingCart, Info, ShieldCheck, Terminal, Briefcase } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

export const Navbar: React.FC = () => {
  const { cart } = useCart();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  // Settings state
  const [logoUrl, setLogoUrl] = useState('');
  const [businessName, setBusinessName] = useState("Kote Factory");
  const [instagramUsername, setInstagramUsername] = useState('maniskotefactory');

  // Theme & Language & Mobile Menu states
  const [theme, setTheme] = useState(() => localStorage.getItem('manis_theme') || 'dark');
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Fetch settings for custom logo
  useEffect(() => {
    fetch('http://localhost:5000/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data) {
          if (data.brand_logo_url) setLogoUrl(data.brand_logo_url);
          if (data.business_name) setBusinessName(data.business_name);
          if (data.instagram_username) setInstagramUsername(data.instagram_username);
        }
      })
      .catch(err => console.error('Error fetching navbar settings:', err));
  }, []);

  // Update theme class on HTML element
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('manis_theme', theme);
  }, [theme]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('manis_lang', lng);
    setLangDropdownOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-[9900] glass-nav h-20 md:h-28 flex items-center px-4 md:px-12 justify-between border-b border-brand-gold/15 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.7)]">
      
      {/* Left: Brand Logo & Name */}
      <Link to="/" className="flex items-center gap-2.5 md:gap-4 group shrink-0">
        {logoUrl ? (
          <div className="w-9 h-9 md:w-12 md:h-12 border-2 border-brand-gold/35 group-hover:border-brand-gold rounded-xl flex items-center justify-center bg-brand-maroonDark/60 transition-all duration-500 overflow-hidden p-1 shadow-[0_0_15px_rgba(212,175,55,0.15)]">
            <img 
              src={`http://localhost:5000${logoUrl}`} 
              alt="Mani's Logo" 
              className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" 
            />
          </div>
        ) : (
          <div className="w-9 h-9 md:w-12 md:h-12 border-2 border-brand-gold/35 group-hover:border-brand-gold rounded-xl flex items-center justify-center bg-brand-maroonDark/50 transition-all duration-500 shadow-[0_0_15px_rgba(212,175,55,0.15)]">
            <svg viewBox="0 0 24 24" className="w-5 h-5 md:w-7 md:h-7 fill-brand-gold group-hover:scale-110 transition-transform duration-500">
              <path d="M12 2C8 6 6 9 6 13c0 3.3 2.7 6 6 6s6-2.7 6-6c0-4-2-7-6-11zm0 2.2c2.4 2.8 3.8 5.1 3.8 8.8 0 2.1-1.7 3.8-3.8 3.8S8.2 15.1 8.2 13c0-3.7 1.4-6 3.8-8.8zM12 9c-.6 0-1 .4-1 1s.4 1 1 1 1-.4 1-1-.4-1-1-1zm0 4c-.6 0-1 .4-1 1v2c0 .6.4 1 1 1s1-.4 1-1v-2c0-.6-.4-1-1-1z" />
            </svg>
          </div>
        )}
        <div className="flex flex-col text-left max-w-[140px] xs:max-w-[180px] sm:max-w-none truncate">
          <span className="font-serif text-xs sm:text-sm md:text-lg tracking-[0.12em] sm:tracking-[0.18em] md:tracking-[0.25em] text-brand-gold group-hover:text-brand-goldLight transition-colors uppercase font-bold text-gold-metallic leading-tight truncate">
            {businessName}
          </span>
          <span className="text-[7px] sm:text-[8px] md:text-[9px] uppercase tracking-[0.18em] sm:tracking-[0.25em] md:tracking-[0.35em] text-zinc-400 font-semibold truncate">
            Chocolate Factory
          </span>
        </div>
      </Link>

      {/* Center: Desktop Navigation Links */}
      <div className="hidden lg:flex items-center gap-5 xl:gap-6 text-[11px] uppercase tracking-[0.2em] font-bold">
        <Link to="/shop" className="text-brand-goldLight hover:text-brand-gold flex items-center gap-1.5 py-2 px-2.5 relative group transition-colors duration-300">
          <ShoppingCart size={14} /> {t('nav.shop')}
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1.5px] bg-brand-gold transition-all duration-300 group-hover:w-3/4" />
        </Link>

        <Link to="/my-orders" className="text-zinc-300 hover:text-brand-goldLight flex items-center gap-1.5 py-2.5 px-2.5 relative group transition-colors duration-300">
          <ShoppingBag size={14} /> My Orders
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1.5px] bg-brand-gold transition-all duration-300 group-hover:w-3/4" />
        </Link>

        <Link to="/jobs" className="text-zinc-300 hover:text-brand-goldLight flex items-center gap-1.5 py-2.5 px-2.5 relative group transition-colors duration-300">
          <Briefcase size={14} /> Job Openings
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1.5px] bg-brand-gold transition-all duration-300 group-hover:w-3/4" />
        </Link>

        <Link to="/about" className="text-brand-gold hover:text-brand-goldLight flex items-center gap-1.5 py-2 px-3.5 border border-brand-gold/30 hover:border-brand-gold rounded-full relative group transition-all duration-300 hover:scale-105 shadow-md shadow-brand-gold/5">
          <Info size={13} />
          <span>{t('nav.about')}</span>
        </Link>

        {/* Owner Option */}
        <Link 
          to="/owner" 
          className="text-zinc-300 hover:text-brand-gold flex items-center gap-1.5 py-2 px-3 border border-transparent hover:border-brand-gold/20 rounded-full transition-all duration-300"
          title="Owner Login / Dashboard"
        >
          <ShieldCheck size={13} className="text-brand-gold" />
          <span>{t('nav.owner')}</span>
        </Link>
      </div>

      {/* Right: Actions Row */}
      <div className="flex items-center gap-1.5 md:gap-3">
        
        {/* Globe Language Switcher */}
        <div className="relative">
          <button
            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
            className="p-2 md:p-2.5 rounded-full hover:bg-white/5 border border-transparent hover:border-brand-gold/20 text-zinc-300 hover:text-brand-gold transition-all duration-300 cursor-pointer flex items-center justify-center"
            aria-label="Change Language"
            title="Select Language"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 md:w-5 md:h-5 fill-none stroke-current" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </button>
          
          <AnimatePresence>
            {langDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-36 rounded-2xl border border-brand-gold/20 bg-brand-panelBg p-1.5 shadow-2xl z-[9995] text-left"
              >
                {[
                  { code: 'en', label: 'English' },
                  { code: 'kn', label: 'ಕನ್ನಡ' },
                  { code: 'hi', label: 'हिन्दी' },
                  { code: 'ta', label: 'தமிழ்' },
                  { code: 'te', label: 'తెలుగు' }
                ].map((l) => (
                  <button
                    key={l.code}
                    onClick={() => changeLanguage(l.code)}
                    className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer block ${
                      i18n.language === l.code
                        ? 'bg-brand-gold text-brand-maroonDark'
                        : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Instagram Redirect Button */}
        <a
          href={`https://instagram.com/${instagramUsername}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex p-2 md:p-2.5 rounded-full hover:bg-white/5 text-zinc-300 hover:text-brand-gold border border-transparent hover:border-brand-gold/20 transition-all duration-300 items-center justify-center"
          aria-label="Instagram"
          title="Instagram"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 md:w-5 md:h-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01" />
          </svg>
        </a>

        {/* Theme Switcher Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 md:p-2.5 rounded-full hover:bg-white/5 border border-transparent hover:border-brand-gold/20 text-zinc-300 hover:text-brand-gold transition-all duration-300 cursor-pointer flex items-center justify-center"
          aria-label="Toggle Theme"
          title={`Switch Theme`}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Cart Bag */}
        <Link 
          to="/cart" 
          className="relative p-2 md:p-2.5 rounded-full hover:bg-white/5 text-zinc-300 hover:text-brand-gold border border-transparent hover:border-brand-gold/20 transition-all duration-300 flex items-center justify-center" 
          aria-label="Shopping Cart"
        >
          <ShoppingBag size={18} />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-brand-maroon border border-brand-gold/60 text-brand-gold text-[9px] font-bold w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(212,175,55,0.4)]">
              {totalItems}
            </span>
          )}
        </Link>

        {/* Hamburger Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-zinc-300 hover:text-brand-gold focus:outline-none transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="absolute top-full left-0 w-full bg-brand-panelBg border-b border-brand-gold/20 shadow-2xl overflow-y-auto max-h-[calc(100vh-80px)] lg:hidden z-[9990]"
          >
            <div className="flex flex-col p-5 space-y-2.5 text-xs uppercase font-extrabold tracking-widest text-left">
              <Link 
                to="/" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-white/5 text-zinc-200 hover:text-brand-gold transition-all"
              >
                <Compass size={16} />
                <span>Home</span>
              </Link>

              <Link 
                to="/shop" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 py-3 px-4 rounded-xl bg-brand-gold/10 border border-brand-gold/30 text-brand-gold hover:bg-brand-gold hover:text-brand-maroonDark transition-all"
              >
                <ShoppingCart size={16} />
                <span>{t('nav.shop')}</span>
              </Link>

              <Link 
                to="/my-orders" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-white/5 text-zinc-200 hover:text-brand-gold transition-all"
              >
                <ShoppingBag size={16} />
                <span>My Orders</span>
              </Link>

              <Link 
                to="/jobs" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-white/5 text-zinc-200 hover:text-brand-gold transition-all"
              >
                <Briefcase size={16} />
                <span>Job Openings</span>
              </Link>

              <Link 
                to="/about" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-white/5 text-zinc-200 hover:text-brand-gold transition-all"
              >
                <Info size={16} />
                <span>{t('nav.about')}</span>
              </Link>

              {/* Mobile Owner Link */}
              <Link 
                to="/owner" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-white/5 text-zinc-200 hover:text-brand-gold transition-all border border-brand-gold/15"
              >
                <ShieldCheck size={16} className="text-brand-gold" />
                <span>{t('nav.owner')}</span>
              </Link>

              <Link 
                to="/cart" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/5 text-zinc-200"
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag size={16} />
                  <span>{t('nav.cart')}</span>
                </div>
                <span className="bg-brand-gold text-brand-maroonDark text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {totalItems}
                </span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </nav>
  );
};

export default Navbar;
