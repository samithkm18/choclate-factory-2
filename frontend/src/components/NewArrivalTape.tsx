import React from 'react';

export const NewArrivalTape: React.FC = () => {
  return (
    <div className="absolute top-3 -left-6 z-30 select-none pointer-events-none origin-center transform -rotate-12 scale-[0.9]">
      <div 
        className="bg-gradient-to-r from-[#8B0000] via-[#A80000] to-[#CC0000] text-[#FFF] text-[8px] font-bold tracking-[0.25em] px-8 py-1 rounded-sm border-t border-b border-brand-gold/20 shadow-[0_5px_15px_rgba(0,0,0,0.5),_0_0_10px_rgba(139,0,0,0.4)] flex items-center justify-center gap-1.5 relative overflow-hidden"
        style={{
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15), inset 0 -1px 1px rgba(0,0,0,0.25), 0 4px 10px rgba(0,0,0,0.5)',
          backgroundSize: '4px 4px',
          backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.02) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.02) 75%, transparent 75%, transparent)'
        }}
      >
        <span className="text-brand-gold font-serif">✦</span>
        <span className="font-serif tracking-[0.25em] text-[#FFF8F0]">NEW ARRIVAL</span>
        <span className="text-brand-gold font-serif">✦</span>
      </div>
    </div>
  );
};

export default NewArrivalTape;
