import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useTranslation } from 'react-i18next';
import ExplorableStudio from '../components/ExplorableStudio';
import ChocolateShop from '../components/ChocolateShop';
import CircularShowcase from '../components/CircularShowcase';
import AnnouncementGallery from '../components/AnnouncementGallery';
import CustomerReviews from '../components/CustomerReviews';
import StoreMap from '../components/StoreMap';

gsap.registerPlugin(ScrollTrigger);

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  images: string[];
}

export const Home: React.FC = () => {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [heroVideoLoaded, setHeroVideoLoaded] = useState(false);
  const { t } = useTranslation();
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Fetch products catalog
    fetch('http://localhost:5000/api/products')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setFeatured(data);
        }
      })
      .catch(err => console.error('Error fetching products:', err));
  }, []);

  // Autoplay once on load
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.log("Autoplay blocked, waiting for user interaction", err);
      });
    }
  }, [heroVideoLoaded]);

  // GSAP ScrollTrigger Timeline for the Hero -> Showcase background transition
  useLayoutEffect(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#hero-overlay',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });

    tl.to('#hero-content-wrapper', {
      opacity: 0,
      y: -100,
      scale: 0.95,
      ease: 'power2.inOut'
    }, 0);

    return () => {
      tl.scrollTrigger?.kill();
    };
  }, []);

  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (videoRef.current) {
      if (videoRef.current.currentTime >= videoRef.current.duration - 0.2) {
        videoRef.current.currentTime = 0;
      }
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => console.log("Video play failed:", err));
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }, 500);
  };

  const handleTouch = () => {
    if (touchTimeoutRef.current) return;
    touchTimeoutRef.current = setTimeout(() => {
      touchTimeoutRef.current = null;
    }, 300);

    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        if (videoRef.current.currentTime >= videoRef.current.duration - 0.2) {
          videoRef.current.currentTime = 0;
        }
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(err => console.log("Video play failed:", err));
      }
    }
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setTimeout(() => {
      setEmail('');
      setSubscribed(false);
    }, 3000);
  };

  return (
    <div className="w-full bg-brand-darkBg text-white relative min-h-screen overflow-x-hidden">
      
      {/* Youtube Cinematic Background Loop */}
      <div 
        className="fixed inset-0 w-screen h-screen z-0 overflow-hidden pointer-events-none select-none transition-all duration-700 ease-in-out"
        style={{ opacity: 'var(--bg-video-opacity)' }}
      >
        <iframe 
          src="https://www.youtube.com/embed/t5EeaNlx86M?autoplay=1&mute=1&controls=0&loop=1&playlist=t5EeaNlx86M&playsinline=1&enablejsapi=1&showinfo=0&rel=0&iv_load_policy=3&disablekb=1"
          className="w-full h-full pointer-events-none scale-[1.35]"
          style={{ 
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100vw',
            height: '56.25vw',
            minHeight: '100vh',
            minWidth: '177.77vh',
            filter: 'var(--bg-video-filter)',
            transition: 'filter 0.6s ease-in-out'
          }}
          frameBorder="0"
          allow="autoplay; encrypted-media"
          title="Cinematic Chocolate Background"
        />
        <div 
          className="absolute inset-0 z-10 transition-all duration-700 ease-in-out" 
          style={{ backgroundImage: 'var(--bg-video-overlay)' }}
        />
        <div 
          className="absolute inset-0 z-10 transition-all duration-700 ease-in-out" 
          style={{ backgroundImage: 'var(--bg-video-vignette)' }}
        />
      </div>

      {/* Foreground Content Wrapper */}
      <div className="relative z-10 w-full bg-transparent overflow-x-hidden">
        
        {/* CINEMATIC HERO & SHOWCASE ENVIRONMENT */}
        <div id="cinematic-container" className="relative w-full bg-transparent overflow-hidden">
        
        {/* 1. CINEMATIC FULLSCREEN HERO SCENE OVERLAY */}
        <section 
          id="hero-overlay" 
          className="min-h-screen w-full relative flex items-center justify-center px-4 md:px-12 py-24 md:py-40 select-none z-10 bg-transparent overflow-hidden"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouch}
        >
          {/* Edge-to-Edge Fullscreen Video container */}
          <div className="absolute inset-0 z-0 select-none pointer-events-none w-full h-full">
            {!heroVideoLoaded && (
              <div className="absolute inset-0 bg-[#0A0A0A] flex items-center justify-center z-20">
                <div className="w-8 h-8 border-2 border-brand-gold/25 border-t-brand-gold rounded-full animate-spin" />
              </div>
            )}
            <video
              ref={videoRef}
              src="https://res.cloudinary.com/dwji2t2uj/video/upload/q_auto,f_auto/Chocolate_box_exploding_animation_202608242247_kfafoa.mp4"
              className="w-full h-full object-cover transition-opacity duration-1000 bg-[#0A0A0A]"
              style={{ opacity: heroVideoLoaded ? 1 : 0 }}
              muted
              playsInline
              preload="auto"
              onCanPlay={() => setHeroVideoLoaded(true)}
              onEnded={() => setIsPlaying(false)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-[#0A0A0A]/70 z-10" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_20%,#0A0A0A_85%)] z-10" />
          </div>

          {/* Centered Editorial brand content */}
          <div 
            id="hero-content-wrapper" 
            className="relative z-20 text-center max-w-4xl px-2 sm:px-4 space-y-6 md:space-y-8 pointer-events-auto"
          >
            <div className="space-y-3 md:space-y-4">
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5 }}
                className="text-[10px] md:text-xs text-brand-gold uppercase font-extrabold block tracking-[0.25em] md:tracking-[0.42em] metallic-gold-shimmer"
              >
                {t('home.hero_tag')}
              </motion.span>
              
              <motion.h1 
                initial={{ opacity: 0, y: 35 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, delay: 0.15 }}
                className="text-3xl sm:text-5xl md:text-7xl font-serif leading-tight font-extrabold uppercase tracking-widest text-white"
              >
                <span className="metallic-gold-shimmer text-gold-metallic">KOTE FACTORY</span>
              </motion.h1>
            </div>

            {/* Horizontal Gold Details list */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 md:gap-x-6 gap-y-2 border-t border-b border-brand-gold/15 py-4 md:py-5 max-w-2xl mx-auto">
              {[
                t('home.bullets.artisanal'),
                t('home.bullets.since'),
                t('home.bullets.craft'),
                t('home.bullets.heritage'),
                t('home.bullets.innovation')
              ].map((bullet, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 + idx * 0.1 }}
                  className="flex items-center gap-1 text-zinc-200 font-serif text-[9px] md:text-xs uppercase tracking-wider"
                >
                  <span className="text-brand-gold">✦</span>
                  <span className="hover:text-brand-gold transition-colors duration-300">{bullet}</span>
                </motion.div>
              ))}
            </div>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: 1.1 }}
              className="text-zinc-300 text-xs md:text-sm uppercase tracking-[0.15em] md:tracking-[0.2em] font-semibold leading-relaxed max-w-xl mx-auto px-2"
            >
              {t('home.hero_desc')}
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 1.3 }}
              className="flex justify-center gap-4 pt-2"
            >
              <button 
                onClick={() => {
                  const element = document.getElementById('showcase-section');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-8 md:px-10 py-3.5 md:py-4.5 bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-lg hover:scale-105 transform duration-300"
              >
                {t('home.explore_btn')}
              </button>
            </motion.div>
          </div>
        </section>

        {/* Scroll Down Indicator */}
        <div 
          className="absolute bottom-8 md:bottom-12 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 text-zinc-500 text-[9px] tracking-[0.25em] uppercase font-bold cursor-pointer hover:text-brand-gold transition-colors z-20"
          onClick={() => {
            const element = document.getElementById('showcase-section');
            if (element) element.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <span>{t('home.scroll_enter')}</span>
          <div className="w-1.5 h-7 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
            <div className="w-full h-full bg-brand-gold animate-bounce" />
          </div>
        </div>

        {/* 2. 3D FULLSCREEN CHOCOLATE ADVERTISING SHOWCASE */}
        <section id="showcase-section" className="relative w-full bg-transparent">
          <CircularShowcase products={featured} />
        </section>

        {/* 3. PREMIUM ANNOUNCEMENT GALLERY */}
        <AnnouncementGallery />

        {/* 4. CUSTOMER REVIEWS */}
        <CustomerReviews />

      </div>

      {/* 5. INTERACTIVE BRAND EXPLORABLE STUDIO */}
      <ExplorableStudio />

      {/* 4. CHOCOLATE COLLECTION SHOP */}
      <section id="shop-section" className="py-16 md:py-24 px-4 md:px-12 bg-transparent border-t border-brand-maroon/15">
        <div className="max-w-7xl mx-auto">
          <ChocolateShop />
        </div>
      </section>

      {/* 5. NEWSLETTER SIGNUP BANNER */}
      <section className="py-16 md:py-20 px-4 md:px-12 bg-transparent border-t border-brand-maroon/20">
        <div className="max-w-4xl mx-auto glass-panel p-6 sm:p-8 md:p-12 rounded-3xl text-center space-y-6 border border-brand-gold/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.06)_0%,rgba(0,0,0,0)_50%)] pointer-events-none" />
          
          <h3 className="text-xl sm:text-2xl md:text-4xl font-serif text-brand-goldLight uppercase">{t('home.newsletter_title')}</h3>
          <p className="text-xs md:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
            {t('home.newsletter_desc')}
          </p>

          {subscribed ? (
            <motion.p 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-emerald-400 font-semibold text-xs tracking-wider"
            >
              {t('home.newsletter_success')}
            </motion.p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder={t('home.placeholder_email')}
                className="flex-1 bg-brand-darkBg/60 border border-brand-gold/25 focus:border-brand-gold px-4 py-3 rounded-lg text-xs text-white outline-none transition-colors"
              />
              <button 
                type="submit"
                className="bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark font-bold px-6 py-3 rounded-lg text-xs uppercase tracking-wider transition-colors shadow-md cursor-pointer"
              >
                {t('home.cta_request')}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* STORE LOCATIONS MAP */}
      <section className="py-16 md:py-20 px-4 md:px-12" id="locations">
        <div className="max-w-7xl mx-auto">
          <StoreMap />
        </div>
      </section>

      </div>
    </div>
  );
};

export default Home;
