import React, { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ThreeDChocolate from './ThreeDChocolate';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Sparkles, Scale, Heart } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface Beat {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
}

const BEATS: Beat[] = [
  {
    title: "Arrival of Luxury",
    subtitle: "Mani's Private Reserve",
    description: "Our signature blend arrives in its handcrafted velvet-finished box, waiting to be unlocked. Locked inside is a sensory masterpiece of conched cocoa.",
    icon: <Layers size={16} className="text-brand-gold" />
  },
  {
    title: "Rotation & Discovery",
    subtitle: "Preciosity In Motion",
    description: "Every bar is tempered to locking temperature, producing a high-gloss finish, pristine facets, and that legendary crisp snapping sound.",
    icon: <Sparkles size={16} className="text-brand-gold" />
  },
  {
    title: "Cinematic Explosion",
    subtitle: "The Anatomy of Taste",
    description: "As the seal breaks, the physical package disassembles in space. The lid, the reflective gold foil wrapper, and the chocolate core separate along their vertical axes.",
    icon: <Layers size={16} className="text-brand-gold" />
  },
  {
    title: "Ingredient Origin",
    subtitle: "Volcanic Venezuela",
    description: "High-grade Venezuelan Criollo seeds, wild vanilla beans, and organic cane crystals float to the surface, showing their raw, unrefined power.",
    icon: <Sparkles size={16} className="text-brand-gold" />
  },
  {
    title: "Engineering Showcase",
    subtitle: "Precision Abstraction",
    description: "A precision-engineered floating diagram reveals exact measurements, chocolate thickness tolerances, snap ratings, and foil wrapper densities.",
    icon: <Scale size={16} className="text-brand-gold" />
  },
  {
    title: "Symmetric Reassembly",
    subtitle: "Unified Composition",
    description: "All layers return to their protective shell, combining the ingredients, wrapper, and velvet case back into a single flawless master unit.",
    icon: <Layers size={16} className="text-brand-gold" />
  },
  {
    title: "Ready for Connoisseurs",
    subtitle: "The Masterpiece Sealed",
    description: "Freshly sealed and ready. Our reserve is finished with a hand-brushed edible gold emblem, ready for your customized tasting box.",
    icon: <Heart size={16} className="text-brand-gold" />
  }
];

export const ScrollStory: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const trigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top top',
      end: '+=400vh',
      pin: true,
      scrub: true,
      onUpdate: (self) => {
        setScrollProgress(self.progress);
      }
    });

    return () => {
      trigger.kill();
    };
  }, []);

  // Determine active beat index based on scroll progress mapping
  let activeBeat = 0;
  if (scrollProgress < 0.15) {
    activeBeat = 0;
  } else if (scrollProgress >= 0.15 && scrollProgress < 0.3) {
    activeBeat = 1;
  } else if (scrollProgress >= 0.3 && scrollProgress < 0.45) {
    activeBeat = 2;
  } else if (scrollProgress >= 0.45 && scrollProgress < 0.6) {
    activeBeat = 3;
  } else if (scrollProgress >= 0.6 && scrollProgress < 0.75) {
    activeBeat = 4;
  } else if (scrollProgress >= 0.75 && scrollProgress < 0.88) {
    activeBeat = 5;
  } else {
    activeBeat = 6;
  }

  const beat = BEATS[activeBeat];

  // Show engineering annotation label lines in the Explosion/Technical view phase
  const showAnnotations = scrollProgress >= 0.32 && scrollProgress <= 0.72;

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-screen bg-brand-darkBg text-white select-none overflow-hidden flex flex-col md:flex-row items-center px-6 md:px-16"
    >
      {/* Background Atmosphere Spotlight */}
      <div className="absolute top-1/2 left-[60%] -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.04)_0%,rgba(0,0,0,0)_60%)] blur-3xl rounded-full z-0 pointer-events-none" />

      {/* LEFT SIDE: Narrative text story (pinned & changing based on scroll) */}
      <div className="w-full md:w-[35%] z-10 flex flex-col justify-center h-full text-left max-w-md relative select-none">
        <div className="glass-panel border border-brand-gold/10 p-6 md:p-8 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-xl bg-brand-panelBg/75 min-h-[320px] flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-2 h-full bg-brand-gold" />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeBeat}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center">
                  {beat.icon}
                </div>
                <span className="text-[10px] text-brand-gold uppercase tracking-[0.25em] font-extrabold block">
                  {beat.subtitle}
                </span>
              </div>

              <h3 className="text-xl md:text-2xl font-serif text-white tracking-wider uppercase font-bold">
                {beat.title}
              </h3>
              
              <p className="text-zinc-400 text-xs leading-relaxed font-medium">
                {beat.description}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between items-center text-[9px] uppercase tracking-widest text-zinc-500 font-bold pt-4 border-t border-brand-maroon/15">
            <span>Scroll progress</span>
            <span className="text-brand-goldLight">{Math.round(scrollProgress * 100)}%</span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Viewport Canvas for the Exploding ThreeD Chocolate model */}
      <div className="w-full md:w-[65%] h-full relative z-10 flex items-center justify-center">
        <ThreeDChocolate type="dark" progress={scrollProgress} />

        {/* Technical Annotations HUD Layer Overlay */}
        <AnimatePresence>
          {showAnnotations && (
            <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
              
              {/* Annotation 1: Box Lid */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="absolute top-[18%] left-[55%] flex items-center gap-4"
              >
                <div className="w-24 h-[1px] bg-brand-gold/40 border-t border-dashed border-brand-gold/45" />
                <div className="glass-panel border border-brand-gold/25 p-2 rounded-lg bg-brand-panelBg/80 text-left">
                  <p className="text-[8px] text-brand-gold uppercase tracking-wider font-extrabold">Asset 01</p>
                  <p className="text-[9px] text-white font-bold uppercase tracking-wider">Velvet Case Box Lid</p>
                </div>
              </motion.div>

              {/* Annotation 2: Gold Foil wrapper */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="absolute bottom-[25%] left-[28%] flex items-center gap-4 flex-row-reverse"
              >
                <div className="w-24 h-[1px] bg-brand-gold/40 border-t border-dashed border-brand-gold/45" />
                <div className="glass-panel border border-brand-gold/25 p-2 rounded-lg bg-brand-panelBg/80 text-right">
                  <p className="text-[8px] text-brand-gold uppercase tracking-wider font-extrabold">Asset 02</p>
                  <p className="text-[9px] text-white font-bold uppercase tracking-wider">24k Gold Foil Sealing</p>
                </div>
              </motion.div>

              {/* Annotation 3: Chocolate Grid Core */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="absolute top-[48%] right-[10%] flex items-center gap-4"
              >
                <div className="w-20 h-[1px] bg-brand-gold/40 border-t border-dashed border-brand-gold/45" />
                <div className="glass-panel border border-brand-gold/25 p-2 rounded-lg bg-brand-panelBg/80 text-left">
                  <p className="text-[8px] text-brand-gold uppercase tracking-wider font-extrabold">Core 03</p>
                  <p className="text-[9px] text-white font-bold uppercase tracking-wider">72% Criollo Cocoa Grid</p>
                </div>
              </motion.div>
              
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ScrollStory;
