import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, ExternalLink, X } from 'lucide-react';

interface Poster {
  id: number;
  title: string;
  image_url: string;
  link_url?: string;
  start_date?: string;
  end_date?: string;
}

export const AnnouncementGallery: React.FC = () => {
  const [posters, setPosters] = useState<Poster[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activePoster, setActivePoster] = useState<Poster | null>(null);
  const [theme, setTheme] = useState('dark');
  const trackRef = useRef<HTMLDivElement>(null);

  // Monitor theme switches
  useEffect(() => {
    const updateTheme = () => {
      const isLight = document.documentElement.classList.contains('light');
      setTheme(isLight ? 'light' : 'dark');
    };
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Fetch active scheduled posters
  useEffect(() => {
    fetch('http://localhost:5000/api/products/posters/active')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPosters(data);
        }
      })
      .catch((err) => console.error('Error fetching gallery posters:', err));
  }, []);

  const nextSlide = () => {
    if (posters.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % posters.length);
  };

  const prevSlide = () => {
    if (posters.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + posters.length) % posters.length);
  };

  // Card mouse movement for 3D parallax tilt physics
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Normalize coordinates (-0.5 to 0.5)
    const px = (x / rect.width) - 0.5;
    const py = (y / rect.height) - 0.5;
    
    // Map to tilt angles
    card.style.setProperty('--rx', `${py * -16}deg`);
    card.style.setProperty('--ry', `${px * 16}deg`);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
  };

  if (posters.length === 0) {
    // Elegant luxury default placeholder when queue is empty
    return (
      <section className="py-20 px-6 md:px-12 bg-transparent border-t border-brand-maroon/20 relative z-20">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="space-y-3">
            <span className="text-[9px] text-brand-gold uppercase tracking-[0.3em] font-extrabold block">✧ Limited editions ✧</span>
            <h2 className="text-2xl md:text-4xl font-serif text-[var(--text-color)] font-bold uppercase tracking-widest">
              FESTIVAL RESERVES
            </h2>
          </div>
          <div 
            className="max-w-2xl mx-auto border border-brand-gold/15 rounded-3xl p-8 md:p-12 space-y-4 backdrop-blur-xl relative overflow-hidden"
            style={{ backgroundColor: theme === 'light' ? 'rgba(240, 234, 224, 0.65)' : 'rgba(18, 18, 18, 0.65)' }}
          >
            <div className="absolute top-0 left-0 w-full h-[2px] bg-brand-gold" />
            <h3 className="text-sm font-serif font-extrabold text-[var(--text-color)] uppercase tracking-wider">Autumn Saffron Festival</h3>
            <p className="text-[var(--text-muted)] text-xs md:text-sm leading-relaxed font-semibold">
              Preparing for the next luxury release cycle. Saffron Raspberry Velvet boxes and corporate reserve chest slots open soon. Stay tuned.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 px-6 md:px-12 bg-transparent border-t border-brand-maroon/20 relative z-20 overflow-hidden">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Gallery Title Headers */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-brand-gold/10 pb-6 text-left">
          <div className="space-y-3">
            <span className="text-[9px] text-brand-gold uppercase tracking-[0.3em] font-extrabold block">
              ✦ Exclusive Spotlights ✦
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-extrabold uppercase tracking-widest text-[var(--text-color)]">
              ANNOUNCEMENTS & GALAS
            </h2>
          </div>
          
          {/* Navigation Steppers */}
          {posters.length > 1 && (
            <div className="flex gap-3">
              <button 
                onClick={prevSlide}
                className="p-3 border border-brand-gold/15 hover:border-brand-gold bg-brand-panelBg/40 hover:bg-brand-gold hover:text-brand-maroonDark rounded-xl transition-all cursor-pointer text-zinc-300"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={nextSlide}
                className="p-3 border border-brand-gold/15 hover:border-brand-gold bg-brand-panelBg/40 hover:bg-brand-gold hover:text-brand-maroonDark rounded-xl transition-all cursor-pointer text-zinc-300"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Gallery Carousel Track */}
        <div 
          ref={trackRef}
          className="relative flex items-center justify-center min-h-[300px] md:min-h-[420px] w-full"
        >
          <div className="flex gap-8 items-center justify-center flex-wrap md:flex-nowrap w-full">
            {posters.map((poster, idx) => {
              const isActive = idx === currentIndex;
              
              // Spacing offsets calculations: boxes de-focus when inactive
              const scale = isActive ? 1.0 : 0.85;
              const opacity = isActive ? 1.0 : 0.45;
              const blurVal = isActive ? '0px' : '4px';
              
              const imageUrl = poster.image_url.startsWith('/') 
                ? `http://localhost:5000${poster.image_url}` 
                : poster.image_url;

              return (
                <motion.div
                  key={poster.id}
                  onClick={() => {
                    if (isActive) setActivePoster(poster);
                    else setCurrentIndex(idx);
                  }}
                  animate={{ scale, opacity, filter: `blur(${blurVal})` }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  className={`w-full md:w-[480px] aspect-[16/10] rounded-3xl border overflow-hidden shadow-2xl relative cursor-pointer group transition-all duration-300 transform-3d ${
                    isActive 
                      ? 'border-brand-gold ring-1 ring-brand-gold/25 shadow-brand-gold/5' 
                      : 'border-brand-gold/10'
                  }`}
                  style={{
                    perspective: '1000px',
                    transform: 'rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))',
                    backgroundColor: theme === 'light' ? 'rgba(240, 234, 224, 0.7)' : 'rgba(18, 18, 18, 0.7)'
                  }}
                >
                  <img 
                    src={imageUrl} 
                    alt={poster.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    draggable={false}
                  />

                  {/* Dark gradient vignette over poster details */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-black/20 to-transparent opacity-85 z-10" />
                  
                  {/* Floating titles overlay */}
                  <div className="absolute bottom-5 left-5 right-5 z-20 text-left space-y-1.5 pointer-events-none">
                    <span className="text-[8px] text-brand-gold uppercase tracking-[0.2em] font-extrabold flex items-center gap-1.5">
                      <Calendar size={10} /> {poster.start_date || 'LIMITED'} — {poster.end_date || 'ACTIVE'}
                    </span>
                    <h3 className="text-sm md:text-lg font-serif font-extrabold text-white uppercase tracking-widest line-clamp-1">
                      {poster.title}
                    </h3>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Lightbox Expanded Overlay Mode */}
      <AnimatePresence>
        {activePoster && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-[#0A0A0A]/95 backdrop-blur-xl flex items-center justify-center p-6"
            onClick={() => setActivePoster(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="max-w-3xl w-full border border-brand-gold/25 rounded-3xl overflow-hidden bg-brand-panelBg shadow-2xl relative text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setActivePoster(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 border border-brand-gold/15 rounded-full hover:border-brand-gold text-brand-gold hover:text-white transition-all z-20 cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="aspect-[16/10] w-full overflow-hidden border-b border-brand-gold/10">
                <img 
                  src={activePoster.image_url.startsWith('/') ? `http://localhost:5000${activePoster.image_url}` : activePoster.image_url} 
                  alt={activePoster.title} 
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-6 md:p-8 space-y-4">
                <h3 className="text-xl md:text-2xl font-serif font-extrabold text-[var(--text-color)] uppercase tracking-wider">
                  {activePoster.title}
                </h3>
                <div className="flex flex-wrap gap-4 text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5"><Calendar size={12} /> Starts: {activePoster.start_date || 'N/A'}</span>
                  <span>|</span>
                  <span>Ends: {activePoster.end_date || 'N/A'}</span>
                </div>

                {activePoster.link_url && (
                  <div className="pt-2">
                    <a 
                      href={activePoster.link_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-6 py-3.5 bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition-all inline-flex items-center gap-1.5 shadow-md shadow-brand-gold/10"
                    >
                      Access Limited Batch <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default AnnouncementGallery;
