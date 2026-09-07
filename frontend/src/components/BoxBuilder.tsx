import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid3X3, Check, Trash2, ShoppingCart } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../context/CartContext';

interface TruffleOption {
  name: string;
  emoji: string;
  desc: string;
  extraPrice: number;
  color: string;
}

const TRUFFLE_PIECES: TruffleOption[] = [
  { name: 'Dark Lava', emoji: '🌋', desc: '80% Cocoa, Liquid Volcano center', extraPrice: 0, color: 'bg-zinc-800' },
  { name: 'Honeycomb Gold', emoji: '🍯', desc: 'Honeycomb dust, Salted caramel fill', extraPrice: 1.50, color: 'bg-yellow-700' },
  { name: 'Raspberry Royale', emoji: '🍓', desc: 'Ruby chocolate, Freeze-dried berry', extraPrice: 1.00, color: 'bg-red-800' },
  { name: 'Bourbon Oakwood', emoji: '🥃', desc: 'Kentucky bourbon praline paste', extraPrice: 2.00, color: 'bg-amber-900' },
  { name: 'Vanilla Orchid', emoji: '🌸', desc: 'Tahitian vanilla bean buttercream', extraPrice: 0, color: 'bg-amber-100 text-zinc-900' },
  { name: 'Sea Salt Toffee', emoji: '🧂', desc: 'Maldon sea salt, Smoked butter crunch', extraPrice: 0.50, color: 'bg-yellow-900' }
];

export const BoxBuilder: React.FC = () => {
  const { addToCart } = useCart();
  const [boxSize, setBoxSize] = useState<9 | 16 | 24>(9);
  const [slots, setSlots] = useState<(TruffleOption | null)[]>(Array(9).fill(null));
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(0);
  const [addedMessage, setAddedMessage] = useState(false);

  // Box size options configurations
  const boxConfigs = {
    9: { basePrice: 49.00, cols: 'grid-cols-3', label: '9-slot Velvet Case' },
    16: { basePrice: 69.00, cols: 'grid-cols-4', label: '16-slot Velvet Case' },
    24: { basePrice: 89.00, cols: 'grid-cols-6', label: '24-slot Velvet Case' }
  };

  const currentConfig = boxConfigs[boxSize];

  // Calculate dynamic price
  const basePrice = currentConfig.basePrice;
  const extrasPrice = slots.reduce((acc, slot) => acc + (slot ? slot.extraPrice : 0), 0);
  const totalPrice = basePrice + extrasPrice;

  // Handle Box Size changes
  const handleBoxSizeChange = (size: 9 | 16 | 24) => {
    setBoxSize(size);
    setSlots(Array(size).fill(null));
    setSelectedSlotIndex(0);
  };

  // Add truffle to currently selected slot
  const selectTruffle = (truffle: TruffleOption) => {
    if (selectedSlotIndex === null) return;
    
    const newSlots = [...slots];
    newSlots[selectedSlotIndex] = truffle;
    setSlots(newSlots);

    // Auto-advance to next empty slot
    const nextEmptyIdx = newSlots.findIndex((s, idx) => s === null && idx > selectedSlotIndex);
    if (nextEmptyIdx !== -1) {
      setSelectedSlotIndex(nextEmptyIdx);
    } else {
      // Find any first empty slot
      const firstEmptyIdx = newSlots.findIndex(s => s === null);
      if (firstEmptyIdx !== -1) {
        setSelectedSlotIndex(firstEmptyIdx);
      } else {
        setSelectedSlotIndex(null); // Box is fully filled
      }
    }
  };

  // Clear slot content
  const clearSlot = (index: number) => {
    const newSlots = [...slots];
    newSlots[index] = null;
    setSlots(newSlots);
    setSelectedSlotIndex(index);
  };

  // Quick fill entire box
  const fillAllSlots = (truffle: TruffleOption) => {
    setSlots(Array(boxSize).fill(truffle));
    setSelectedSlotIndex(null);
  };

  // Add customized box bundle to Cart
  const handleAddToCart = () => {
    // Check if box has at least one truffle
    const filledCount = slots.filter(s => s !== null).length;
    if (filledCount === 0) return;

    const truffleNames = slots.map(s => s ? s.name : 'Empty Slot');
    const customId = `custom-box-${boxSize}-${Date.now()}`;

    addToCart({
      id: customId,
      productId: 6, // Refers to the Seed product ID for 'Customize Your Happiness Box'
      name: `Custom Happiness Box (${boxSize} slots)`,
      price: totalPrice,
      image: '/assets/products/custom-box.jpg',
      variant: currentConfig.label,
      customBoxItems: truffleNames
    });

    // Play victory confetti!
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#D4AF37', '#4A0E17', '#AA771C', '#FFFDD0']
    });

    setAddedMessage(true);
    setTimeout(() => setAddedMessage(false), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 font-sans">
      <div className="text-center space-y-4 mb-10">
        <span className="text-xs text-brand-gold uppercase tracking-[0.3em] font-semibold">
          Customize Your Happiness
        </span>
        <h2 className="text-3xl md:text-5xl font-serif">THE BOX DESIGNER</h2>
        <p className="text-zinc-400 text-xs md:text-sm max-w-lg mx-auto leading-relaxed">
          Craft your personal box of joy. Choose a luxurious case size, select your favorite handcrafted chocolate pieces, and assemble your dream collection.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Box selections and visual Grid */}
        <div className="lg:col-span-7 bg-brand-panelBg border border-brand-maroon/20 rounded-2xl p-6 space-y-6">
          
          {/* Box Size Toggle Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-brand-maroon/20 pb-4">
            <span className="text-xs text-brand-goldLight font-semibold flex items-center gap-1.5">
              <Grid3X3 size={15} /> Case Sizes:
            </span>
            <div className="flex gap-2">
              {([9, 16, 24] as const).map(size => (
                <button
                  key={size}
                  onClick={() => handleBoxSizeChange(size)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all duration-300 ${
                    boxSize === size 
                      ? 'bg-brand-gold text-brand-maroonDark border border-brand-gold' 
                      : 'bg-white/5 text-zinc-400 hover:text-white border border-white/5 hover:border-brand-gold/30'
                  }`}
                >
                  {size} Slots
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Grid Container */}
          <div className="flex flex-col items-center justify-center p-6 bg-brand-darkBg/60 rounded-xl border border-brand-maroon/10">
            <h3 className="text-xs text-brand-gold uppercase tracking-widest font-semibold mb-4">
              {currentConfig.label}
            </h3>
            
            <div className={`grid ${currentConfig.cols} gap-4 max-w-full md:w-[450px]`}>
              {slots.map((slot, index) => {
                const isSelected = selectedSlotIndex === index;
                return (
                  <motion.div
                    key={index}
                    onClick={() => setSelectedSlotIndex(index)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`aspect-square relative rounded-xl flex items-center justify-center cursor-pointer transition-all duration-300 border-2 ${
                      slot 
                        ? `${slot.color} border-brand-gold/30 hover:border-brand-gold` 
                        : 'bg-brand-panelBg border-dashed border-zinc-700 hover:border-brand-gold/50'
                    } ${isSelected ? 'ring-2 ring-brand-gold border-brand-gold scale-[1.05]' : ''}`}
                  >
                    {slot ? (
                      <div className="text-center">
                        <span className="text-2xl md:text-3xl block leading-none">{slot.emoji}</span>
                        <span className="text-[7px] md:text-[8px] uppercase tracking-wider text-white/80 block mt-1 leading-none font-semibold">
                          {slot.name}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); clearSlot(index); }}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600/90 border border-red-400 text-white rounded-full flex items-center justify-center opacity-0 hover:opacity-100 md:group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-zinc-600 text-[10px] uppercase font-bold tracking-wider">
                        Slot {index + 1}
                      </span>
                    )}

                    {slot && (
                      <div className="absolute -top-1 -right-1 bg-brand-gold text-brand-maroonDark w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold">
                        <Check size={8} strokeWidth={4} />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Empty count */}
            <p className="text-[10px] text-zinc-500 mt-4 uppercase tracking-widest font-semibold">
              Filled: {slots.filter(s => s !== null).length} / {boxSize} slots
            </p>
          </div>
        </div>

        {/* Right column: Truffle Selectors and Pricing Summary */}
        <div className="lg:col-span-5 space-y-6">
          {/* Chocolate Truffle Pieces Selection list */}
          <div className="bg-brand-panelBg border border-brand-maroon/20 rounded-2xl p-6">
            <h3 className="text-sm text-brand-gold uppercase tracking-wider font-semibold border-b border-brand-maroon/20 pb-3 mb-4">
              Select Luxury Truffles
            </h3>
            
            <div className="space-y-3">
              {TRUFFLE_PIECES.map((t, idx) => (
                <div 
                  key={idx}
                  onClick={() => selectTruffle(t)}
                  className="flex items-center justify-between p-3 bg-white/5 hover:bg-brand-maroon/20 border border-white/5 hover:border-brand-gold/30 rounded-xl cursor-pointer transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-1 bg-white/5 rounded-lg">{t.emoji}</span>
                    <div>
                      <h4 className="text-xs text-brand-goldLight font-bold group-hover:text-white transition-colors">
                        {t.name}
                      </h4>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{t.desc}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-brand-gold font-semibold block">
                      {t.extraPrice > 0 ? `+$${t.extraPrice.toFixed(2)}` : 'Included'}
                    </span>
                    <span className="text-[8px] text-zinc-500 uppercase tracking-widest block group-hover:text-brand-gold font-bold">
                      Add to slot
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] uppercase font-bold tracking-wider">
              <button 
                onClick={() => setSlots(Array(boxSize).fill(null))}
                className="py-2 border border-brand-maroon/40 hover:border-red-500/50 hover:text-red-400 bg-white/5 rounded-lg text-center transition-colors"
              >
                Clear All Slots
              </button>
              <button 
                onClick={() => fillAllSlots(TRUFFLE_PIECES[0])}
                className="py-2 border border-brand-gold/20 hover:border-brand-gold hover:text-brand-goldLight bg-brand-maroonDark/40 rounded-lg text-center transition-colors"
              >
                Fill with Dark Lava
              </button>
            </div>
          </div>

          {/* Pricing and Action Card */}
          <div className="bg-brand-panelBg border border-brand-gold/20 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Price Breakdown</h3>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">{currentConfig.label} Base:</span>
                <span>${basePrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Premium Add-ons:</span>
                <span className="text-brand-gold">+${extrasPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-brand-maroon/20 pt-2 text-sm font-bold text-white">
                <span>Estimated Total:</span>
                <span className="text-brand-goldLight">${totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={slots.filter(s => s !== null).length === 0}
              className={`w-full py-3 rounded-lg text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 shadow-lg transition-all duration-300 transform active:scale-95 ${
                slots.filter(s => s !== null).length > 0
                  ? 'bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark'
                  : 'bg-white/5 text-zinc-600 border border-white/5 cursor-not-allowed'
              }`}
            >
              <ShoppingCart size={14} /> Add Customize Box to Cart
            </button>

            <AnimatePresence>
              {addedMessage && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-center text-[10px] text-emerald-400 font-semibold"
                >
                  ✓ Custom Box added successfully! Sparking joy.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoxBuilder;
