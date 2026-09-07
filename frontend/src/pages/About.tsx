import React, { useState, useEffect } from 'react';
import { ShieldCheck, Compass, Heart, Sparkles } from 'lucide-react';

interface AboutContent {
  story: string;
  usps: { title: string; description?: string; desc?: string }[];
  quality_claims: string;
  images?: string[];
}

export const About: React.FC = () => {
  const [content, setContent] = useState<AboutContent | null>(null);
  const [theme, setTheme] = useState('dark');

  // Monitor theme changes
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

  // Fetch editable About Us content
  useEffect(() => {
    fetch('http://localhost:5000/api/products/about/content')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setContent(data);
        }
      })
      .catch((err) => console.error('Error fetching about us details:', err));
  }, []);

  if (!content) {
    return (
      <div className="min-h-screen bg-brand-darkBg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-gold/25 border-t-brand-gold rounded-full animate-spin" />
      </div>
    );
  }

  const iconsMap = [Compass, Heart, ShieldCheck];

  return (
    <div className="w-full min-h-screen bg-brand-darkBg text-white relative flex flex-col justify-between overflow-hidden">
      
      {/* Background ambient gold aura glow */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[70vw] h-[70vw] bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.04)_0%,rgba(0,0,0,0)_65%)] blur-3xl rounded-full z-0 pointer-events-none" />

      {/* Main page wrapper */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 py-32 md:py-40 space-y-16 text-left">
        
        {/* Editorial header */}
        <div className="space-y-4 text-center">
          <span className="text-[10px] text-brand-gold uppercase tracking-[0.35em] font-extrabold block">✦ Our Heritage ✦</span>
          <h1 className="text-4xl md:text-6xl font-serif font-extrabold uppercase tracking-widest text-[var(--text-color)]">
            ABOUT MANIS KOTE
          </h1>
          <div className="w-16 h-[2.5px] bg-brand-gold mx-auto" />
        </div>

        {/* Dynamic Story glass card */}
        <div 
          className="border border-brand-gold/15 rounded-3xl p-6 md:p-12 shadow-2xl relative overflow-hidden backdrop-blur-xl transition-all duration-500"
          style={{
            backgroundColor: theme === 'light' ? 'rgba(240, 234, 224, 0.65)' : 'rgba(18, 18, 18, 0.65)'
          }}
        >
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-gold/15 via-brand-gold to-brand-gold/15" />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Story text */}
            <div className="lg:col-span-8 space-y-6">
              <h2 className="text-xl md:text-3xl font-serif text-[var(--text-color)] font-bold uppercase tracking-wide flex items-center gap-2">
                <Sparkles size={18} className="text-brand-gold" /> The Savor Legacy
              </h2>
              <p className="text-[var(--text-color)] text-xs md:text-sm leading-relaxed font-semibold">
                {content.story}
              </p>
            </div>
            {/* Decorative Gold insignia */}
            <div className="lg:col-span-4 flex items-center justify-center p-4">
              <div className="w-24 h-24 md:w-32 md:h-32 border-2 border-brand-gold/25 rounded-full flex items-center justify-center text-brand-gold animate-spin-slow bg-brand-maroonDark/20 shadow-lg">
                <span className="text-3xl">✦</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic USPs list */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {content.usps.map((usp, idx) => {
            const Icon = iconsMap[idx % iconsMap.length];
            return (
              <div 
                key={idx} 
                className="border border-brand-gold/10 hover:border-brand-gold/30 p-6 rounded-2xl space-y-3 shadow-xl backdrop-blur-md transition-all duration-300"
                style={{
                  backgroundColor: theme === 'light' ? 'rgba(240, 234, 224, 0.45)' : 'rgba(18, 18, 18, 0.45)'
                }}
              >
                <div className="w-10 h-10 rounded-xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center text-brand-gold">
                  <Icon size={18} />
                </div>
                <h3 className="text-xs uppercase tracking-widest font-extrabold text-[var(--text-color)]">
                  {usp.title}
                </h3>
                <p className="text-[var(--text-muted)] text-[11px] leading-relaxed font-semibold">
                  {usp.description || usp.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Quality claims banner */}
        <div className="bg-brand-maroon/10 border border-brand-gold/20 p-5 rounded-2xl text-center space-y-1">
          <span className="text-[8px] text-brand-gold uppercase tracking-widest block font-bold">certified quality guarantees</span>
          <p className="text-zinc-200 text-xs md:text-sm font-serif font-bold uppercase tracking-wider italic">
            "{content.quality_claims}"
          </p>
        </div>

      </div>
    </div>
  );
};

export default About;
