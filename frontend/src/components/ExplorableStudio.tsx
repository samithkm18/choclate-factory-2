import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Cpu, GlassWater, Gift, MapPin, ArrowRight } from 'lucide-react';

interface PairingOption {
  chocolate: string;
  intensity: string;
  notes: string;
  beverage: string;
  beverageDescription: string;
}

export const ExplorableStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'origin' | 'craft' | 'pairings' | 'gifting'>('origin');
  const [theme, setTheme] = useState('dark');

  // Detect current theme transitions to style explorable studio correctly
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

  // Pairing database
  const pairings: PairingOption[] = [
    {
      chocolate: "Lavender Silk Noir",
      intensity: "60% Cocoa",
      notes: "Floral, honeyed undertones with lavender-infused cream",
      beverage: "Oak-Matured Cabernet Sauvignon",
      beverageDescription: "The bold tannins of the Cabernet cut through the smooth silkiness, emphasizing the herbal floral notes."
    },
    {
      chocolate: "Volcanic Dark Reserve",
      intensity: "85% Cocoa",
      notes: "Smoky, earthy peat, roasted single-origin Venezuelan seeds",
      beverage: "Single-Shot Highland Espresso",
      beverageDescription: "A dark roasted espresso complements the volcanic ash tones, creating a intense, rich velvet synergy."
    },
    {
      chocolate: "Himalayan Gold Salt",
      intensity: "72% Cocoa",
      notes: "Salty-sweet contrasts with caramelized cream and gold leaf",
      beverage: "Dry Oloroso Sherry",
      beverageDescription: "Nutty and oxidized notes of the Oloroso highlight the hand-harvested pink salt minerals."
    },
    {
      chocolate: "Raspberry Saffron Velvet",
      intensity: "65% Cocoa",
      notes: "Tangy red berries, exotic saffron threads, rich luxury cream",
      beverage: "Brut Champagne Rosé",
      beverageDescription: "Sparkling high acidity lifts the saffron aroma and cuts through the red berry tartness."
    }
  ];

  const [selectedPairing, setSelectedPairing] = useState<number>(0);

  const tabs = [
    { id: 'origin', label: 'Origin Sourcing', icon: Compass },
    { id: 'craft', label: '12-Micron Craft', icon: Cpu },
    { id: 'pairings', label: 'Sommelier Pairings', icon: GlassWater },
    { id: 'gifting', label: 'Gifting Reserves', icon: Gift }
  ];

  return (
    <section className="py-24 px-6 md:px-12 bg-transparent border-t border-brand-maroon/20 relative z-20">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Editorial Section Header */}
        <div className="text-center space-y-4">
          <span className="text-[10px] text-brand-gold uppercase tracking-[0.35em] font-extrabold block">
            ✦ Gourmet Explorations ✦
          </span>
          <h2 className="text-3xl md:text-5xl font-serif font-extrabold uppercase tracking-widest text-[var(--text-color)]">
            THE TASTINGS STUDIO
          </h2>
          <div className="w-16 h-[2px] bg-brand-gold mx-auto" />
        </div>

        {/* Tab Controls Bar */}
        <div className="flex flex-wrap justify-center gap-2 border-b border-brand-gold/10 pb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3.5 rounded-xl text-[10px] md:text-xs uppercase tracking-widest font-extrabold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-brand-gold text-brand-maroonDark shadow-lg shadow-brand-gold/10 scale-105'
                    : 'bg-brand-panelBg/40 border border-brand-gold/10 text-[var(--text-muted)] hover:text-[var(--text-color)]'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Canvas Container */}
        <div 
          className="border border-brand-gold/15 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl transition-all duration-500"
          style={{
            backgroundColor: theme === 'light' ? 'rgba(240, 234, 224, 0.65)' : 'rgba(18, 18, 18, 0.65)'
          }}
        >
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-gold/20 via-brand-gold to-brand-gold/20" />
          
          <AnimatePresence mode="wait">
            
            {/* 1. ORIGIN STORY LAYOUT */}
            {activeTab === 'origin' && (
              <motion.div
                key="origin"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
              >
                <div className="space-y-5 text-left">
                  <div className="flex items-center gap-2 text-brand-gold font-bold text-xs uppercase tracking-widest">
                    <MapPin size={15} /> Venezuelan Sourcing
                  </div>
                  <h3 className="text-xl md:text-3xl font-serif text-[var(--text-color)] font-bold uppercase tracking-wide">
                    Volcanic Delta Sourcing
                  </h3>
                  <p className="text-[var(--text-muted)] text-xs md:text-sm leading-relaxed font-medium">
                    Our cocoa seeds are sourced exclusively from organic micro-farms located in the Venezuelan Orinoco delta. The volcanic ash soils and humid oceanic breeze enrich the soil, infusing the raw cocoa with naturally high fruit acids, mineral trace elements, and deep earthy notes.
                  </p>
                  <div className="flex gap-6 text-[10px] uppercase tracking-wider font-extrabold text-brand-gold">
                    <div>
                      <span className="block text-zinc-500 text-[8px] tracking-widest mb-1">LATITUDE</span>
                      ✦ 8°50' N
                    </div>
                    <div>
                      <span className="block text-zinc-500 text-[8px] tracking-widest mb-1">ELEVATION</span>
                      ✦ 1,200 METERS
                    </div>
                    <div>
                      <span className="block text-zinc-500 text-[8px] tracking-widest mb-1">VARIETY</span>
                      ✦ CRIOLLO RESERVE
                    </div>
                  </div>
                </div>
                <div className="relative rounded-2xl overflow-hidden border border-brand-gold/20 aspect-video flex items-center justify-center bg-zinc-950">
                  <div className="absolute inset-0 bg-gradient-to-tr from-brand-gold/5 to-transparent z-10 pointer-events-none" />
                  <div className="text-center p-8 space-y-4">
                    <span className="text-[10px] text-brand-gold uppercase tracking-[0.25em] font-extrabold block">GEOGRAPHICAL MAP</span>
                    <p className="text-zinc-500 text-xs font-serif uppercase tracking-widest">MAP COORDINATES ACTIVE</p>
                    <div className="w-12 h-12 rounded-full border border-brand-gold/30 flex items-center justify-center text-brand-gold animate-ping mx-auto">
                      ✦
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. PROCESS / STEP STEPPER LAYOUT */}
            {activeTab === 'craft' && (
              <motion.div
                key="craft"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
              >
                <div className="text-left space-y-3">
                  <h3 className="text-xl md:text-3xl font-serif text-[var(--text-color)] font-bold uppercase tracking-wide">
                    The 12-Micron Conching Process
                  </h3>
                  <p className="text-[var(--text-muted)] text-xs md:text-sm leading-relaxed max-w-2xl font-medium">
                    To achieve our apple-level luxury velvet texture, we conch our chocolate paste for 72 continuous hours inside heavy stone granite rollers, refining particles down to a microscopic 12 microns in size.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                  {[
                    { step: "01", title: "Micro-Refinement", desc: "Stone granite rollers crush cocoa and sugar crystal molecules repeatedly to clear rough edges." },
                    { step: "02", title: "Tempering Stability", desc: "Precise temperature sweeps align the fats into stable type-V crystals for a shiny luxury finish." },
                    { step: "03", title: "Gold Enrobing", desc: "Completed chocolates are hand-dressed with premium edible 24k gold foil leaf accents." }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-brand-panelBg/30 border border-brand-gold/10 p-5 rounded-2xl space-y-3 hover:border-brand-gold/30 transition-all duration-300">
                      <span className="text-2xl font-serif text-brand-gold font-bold block">{item.step}</span>
                      <h4 className="text-xs uppercase tracking-widest font-extrabold text-[var(--text-color)]">{item.title}</h4>
                      <p className="text-[var(--text-muted)] text-[11px] leading-relaxed font-semibold">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 3. SOMMELIER TASTING PAIRINGS GUIDE */}
            {activeTab === 'pairings' && (
              <motion.div
                key="pairings"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
              >
                <div className="space-y-6 text-left">
                  <div className="space-y-2">
                    <span className="text-[9px] text-brand-gold uppercase tracking-[0.25em] font-extrabold block">INTERACTIVE GUIDE</span>
                    <h3 className="text-xl md:text-3xl font-serif text-[var(--text-color)] font-bold uppercase tracking-wide">
                      Sommelier Tastings
                    </h3>
                  </div>

                  {/* Flavor pairing selector dropdown list */}
                  <div className="space-y-2">
                    <label className="block text-[8px] text-zinc-500 uppercase tracking-widest font-bold">Select Flavor Profile</label>
                    <div className="flex flex-col gap-2">
                      {pairings.map((p, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedPairing(idx)}
                          className={`w-full text-left px-4 py-3 rounded-xl border text-xs uppercase tracking-wider font-extrabold transition-all flex items-center justify-between cursor-pointer ${
                            selectedPairing === idx
                              ? 'border-brand-gold bg-brand-gold text-brand-maroonDark'
                              : 'border-brand-gold/15 bg-brand-panelBg/20 text-[var(--text-muted)] hover:border-brand-gold/30 hover:text-[var(--text-color)]'
                          }`}
                        >
                          <span>{p.chocolate}</span>
                          <span className="text-[9px] opacity-75 font-serif">{p.intensity}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Wine glass recommendation panel details */}
                <div className="bg-brand-panelBg/40 border border-brand-gold/15 p-6 rounded-2xl space-y-4 text-left relative overflow-hidden transition-all duration-300">
                  <div className="absolute -top-12 -right-12 w-28 h-28 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.1)_0%,rgba(0,0,0,0)_60%)] rounded-full pointer-events-none" />
                  
                  <div className="space-y-1">
                    <span className="text-[8px] text-brand-gold uppercase tracking-[0.2em] font-bold block">RECOMMENDED PAIRING</span>
                    <h4 className="text-sm md:text-base font-serif font-extrabold text-[var(--text-color)] uppercase tracking-wider">
                      {pairings[selectedPairing].beverage}
                    </h4>
                  </div>

                  <p className="text-[var(--text-muted)] text-[11px] md:text-xs leading-relaxed font-semibold">
                    {pairings[selectedPairing].beverageDescription}
                  </p>

                  <div className="border-t border-brand-maroon/15 pt-3.5 space-y-1">
                    <span className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">Chocolate Notes</span>
                    <span className="text-zinc-400 text-xs italic font-serif leading-relaxed block">
                      "{pairings[selectedPairing].notes}"
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 4. PRIVATE OCCASIONS & GIFTING */}
            {activeTab === 'gifting' && (
              <motion.div
                key="gifting"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
              >
                <div className="space-y-5 text-left">
                  <span className="text-[9px] text-brand-gold uppercase tracking-[0.25em] font-extrabold block">luxury collections</span>
                  <h3 className="text-xl md:text-3xl font-serif text-[var(--text-color)] font-bold uppercase tracking-wide">
                    Private Corporate Gifting
                  </h3>
                  <p className="text-[var(--text-muted)] text-xs md:text-sm leading-relaxed font-medium">
                    Order customized luxury chocolate batches customized specifically for high-end celebrations, corporate corporate gifts, or premium member invites. Includes handmade mahogany chests, bespoke gold star labels, and custom flavors crafted by our lead confectioner.
                  </p>
                  <div>
                    <button className="px-6 py-3 bg-brand-panelBg hover:bg-white/5 border border-brand-gold/30 hover:border-brand-gold text-brand-gold hover:text-white font-extrabold text-[9px] uppercase tracking-widest rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-md">
                      Reserve Custom Occasions <ArrowRight size={10} />
                    </button>
                  </div>
                </div>
                <div className="relative rounded-2xl overflow-hidden border border-brand-gold/15 aspect-square max-h-[250px] mx-auto flex items-center justify-center bg-brand-panelBg/30 p-6">
                  <div className="text-center space-y-2">
                    <Gift size={32} className="text-brand-gold mx-auto animate-bounce" />
                    <h4 className="text-[10px] text-white uppercase tracking-widest font-extrabold">Bespoke Velvet Chests</h4>
                    <p className="text-zinc-500 text-[9px] leading-relaxed">Handmade packaging designed with premium fabric lining, hot-stamped gold foil seals, and magnetic safety lids.</p>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>
    </section>
  );
};

export default ExplorableStudio;
