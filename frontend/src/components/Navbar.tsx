import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, Compass, Layers, LogOut, Sun, Moon } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

export const Navbar: React.FC = () => {
  const { cart } = useCart();
  const { user, userLogout } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // Settings state
  const [logoUrl, setLogoUrl] = useState('');
  const [businessName, setBusinessName] = useState("Mani's Kote");
  const [instagramUsername, setInstagramUsername] = useState('maniskotefactory');

  // Theme & Language states
  const [theme, setTheme] = useState(() => localStorage.getItem('manis_theme') || 'dark');
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

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

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('manis_lang', lng);
    setLangDropdownOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-[9900] glass-nav h-24 md:h-28 flex items-center px-8 md:px-16 justify-between border-b border-brand-gold/15 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.7)]">
      {/* Brand Logo & Name */}
      <Link to="/" className="flex items-center gap-4 group">
        {logoUrl ? (
          <div className="w-12 h-12 border-2 border-brand-gold/35 group-hover:border-brand-gold rounded-xl flex items-center justify-center bg-brand-maroonDark/60 transition-all duration-500 overflow-hidden p-1.5 shadow-[0_0_15px_rgba(212,175,55,0.15)]">
            <img 
              src={`http://localhost:5000${logoUrl}`} 
              alt="Mani's Logo" 
              className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" 
            />
          </div>
        ) : (
          <div className="w-12 h-12 border-2 border-brand-gold/35 group-hover:border-brand-gold rounded-xl flex items-center justify-center bg-brand-maroonDark/50 transition-all duration-500 shadow-[0_0_15px_rgba(212,175,55,0.15)]">
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-brand-gold group-hover:scale-110 transition-transform duration-500">
              <path d="M12 2C8 6 6 9 6 13c0 3.3 2.7 6 6 6s6-2.7 6-6c0-4-2-7-6-11zm0 2.2c2.4 2.8 3.8 5.1 3.8 8.8 0 2.1-1.7 3.8-3.8 3.8S8.2 15.1 8.2 13c0-3.7 1.4-6 3.8-8.8zM12 9c-.6 0-1 .4-1 1s.4 1 1 1 1-.4 1-1-.4-1-1-1zm0 4c-.6 0-1 .4-1 1v2c0 .6.4 1 1 1s1-.4 1-1v-2c0-.6-.4-1-1-1z" />
            </svg>
          </div>
        )}
        <div className="flex flex-col text-left">
          <span className="font-serif text-lg tracking-[0.25em] text-brand-gold group-hover:text-brand-goldLight transition-colors uppercase font-bold text-gold-metallic">
            {businessName}
          </span>
          <span className="text-[9px] uppercase tracking-[0.35em] text-zinc-400 font-semibold">
            Chocolate Factory
          </span>
        </div>
      </Link>

      {/* Center navigation links */}
      <div className="hidden md:flex items-center gap-6 text-[11px] uppercase tracking-[0.2em] font-bold">
        <Link to="/catalog" className="text-zinc-300 hover:text-brand-goldLight flex items-center gap-2 py-2.5 px-3 relative group transition-colors duration-300">
          <Compass size={14} /> {t('nav.catalog')}
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1.5px] bg-brand-gold transition-all duration-300 group-hover:w-3/4" />
        </Link>
        <Link to="/builder" className="text-zinc-300 hover:text-brand-goldLight flex items-center gap-2 py-2.5 px-3 relative group transition-colors duration-300">
          <Layers size={14} /> {t('nav.builder')}
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1.5px] bg-brand-gold transition-all duration-300 group-hover:w-3/4" />
        </Link>
        <Link to="/about" className="text-brand-gold hover:text-brand-goldLight flex items-center gap-2 py-2 px-4 border border-brand-gold/30 hover:border-brand-gold rounded-full relative group transition-all duration-300 hover:scale-105 shadow-md shadow-brand-gold/5">
          <span>{t('nav.about')}</span>
        </Link>
      </div>

      {/* Right side interaction buttons */}
      <div className="flex items-center gap-4">
        
        {/* Globe Language Switcher Toggle */}
        <div className="relative">
          <button
            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
            className="p-3 rounded-full hover:bg-white/5 border border-transparent hover:border-brand-gold/20 text-zinc-300 hover:text-brand-gold transition-all duration-300 cursor-pointer flex items-center justify-center"
            aria-label="Change Language"
            title="Select Language"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="2">
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
                className="absolute right-0 mt-3 w-36 rounded-2xl border border-brand-gold/15 bg-brand-panelBg p-1.5 shadow-2xl z-[9995] text-left"
              >
                {[
                  { code: 'en', label: 'English' },
                  { code: 'hi', label: 'हिन्दी' },
                  { code: 'kn', label: 'ಕನ್ನಡ' },
                  { code: 'ta', label: 'தமிழ்' },
                  { code: 'te', label: 'తెలుగు' }
                ].map((l) => (
                  <button
                    key={l.code}
                    onClick={() => changeLanguage(l.code)}
                    className={`w-full text-left px-3 py-2 text-[10px] font-bold rounded-lg transition-colors cursor-pointer block ${
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

        {/* Instagram Social Redirect Button */}
        <a
          href={`https://instagram.com/${instagramUsername}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 rounded-full hover:bg-white/5 text-zinc-300 hover:text-brand-gold border border-transparent hover:border-brand-gold/20 transition-all duration-300 flex items-center justify-center"
          aria-label="Follow us on Instagram"
          title="Follow us on Instagram"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01" />
          </svg>
        </a>

        {/* Sun / Moon Theme Switcher Toggle */}
        <button
          onClick={toggleTheme}
          className="p-3 rounded-full hover:bg-white/5 border border-transparent hover:border-brand-gold/20 text-zinc-300 hover:text-brand-gold transition-all duration-300 cursor-pointer flex items-center justify-center"
          aria-label="Toggle Theme"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
        </button>

        {/* Cart Bag */}
        <Link to="/cart" className="relative p-3 rounded-full hover:bg-white/5 text-zinc-300 hover:text-brand-gold border border-transparent hover:border-brand-gold/20 transition-all duration-300 flex items-center justify-center" aria-label="Shopping Cart">
          <ShoppingBag size={19} />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-brand-maroon border border-brand-gold/60 text-brand-gold text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(212,175,55,0.4)]">
              {totalItems}
            </span>
          )}
        </Link>

        {/* User Account / Login */}
        {user ? (
          <div className="flex items-center gap-2.5">
            <Link 
              to="/account" 
              className="flex items-center gap-1.5 border border-brand-gold/30 hover:border-brand-gold/70 bg-brand-maroonDark/30 px-4 py-2 rounded-full text-[9px] font-bold uppercase tracking-wider text-brand-gold hover:text-white transition-all duration-300 shadow-[0_2px_10px_rgba(0,0,0,0.3)]"
            >
              <User size={12} /> {t('nav.profile')}
            </Link>
            <button 
              onClick={() => { userLogout(); navigate('/'); }}
              className="p-2 text-zinc-400 hover:text-red-400 hover:bg-white/5 rounded-full transition-colors cursor-pointer flex items-center justify-center"
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <Link 
            to="/login" 
            className="flex items-center gap-1.5 border border-brand-gold/40 hover:border-brand-gold bg-brand-maroonDark/50 px-5 py-2.5 rounded-full text-[9px] font-bold uppercase tracking-widest text-brand-gold hover:text-white transition-all duration-300 shadow-[0_2px_10px_rgba(0,0,0,0.3)]"
          >
            <User size={12} /> {t('nav.login')}
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
