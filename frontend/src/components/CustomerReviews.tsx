import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare, Flag, ShieldCheck, Check } from 'lucide-react';

interface Review {
  id: number;
  order_id?: number | null;
  customer_name: string;
  rating: number;
  text: string;
  image_url?: string;
  status: string;
  flagged: number;
  reply?: string;
  created_at: string;
}

export const CustomerReviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [orderId, setOrderId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [theme, setTheme] = useState('dark');

  // Submit states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [flaggedIds, setFlaggedIds] = useState<number[]>([]);

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

  // Fetch approved customer reviews
  const loadReviews = () => {
    fetch('http://localhost:5000/api/products/reviews/approved')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setReviews(data);
        }
      })
      .catch((err) => console.error('Error fetching reviews:', err));
  };

  useEffect(() => {
    loadReviews();
  }, []);

  // Handle Review submission
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !text || !rating) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('http://localhost:5000/api/products/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name,
          rating,
          text,
          order_id: orderId ? parseInt(orderId) : null,
          image_url: imageUrl || null
        })
      });

      if (res.ok) {
        setSubmitted(true);
        setName('');
        setText('');
        setOrderId('');
        setImageUrl('');
        setRating(5);
        setTimeout(() => setSubmitted(false), 5000);
      }
    } catch (err) {
      console.error('Error submitting review:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Flag/Report review
  const handleFlagReview = async (id: number) => {
    if (flaggedIds.includes(id)) return;
    try {
      const res = await fetch(`http://localhost:5000/api/products/reviews/${id}/flag`, {
        method: 'POST'
      });
      if (res.ok) {
        setFlaggedIds((prev) => [...prev, id]);
      }
    } catch (err) {
      console.error('Error flagging review:', err);
    }
  };

  // Card mouse movement for 3D parallax tilt
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = (x / rect.width) - 0.5;
    const py = (y / rect.height) - 0.5;
    card.style.setProperty('--rx', `${py * -12}deg`);
    card.style.setProperty('--ry', `${px * 12}deg`);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
  };

  // Calculate statistics
  const totalReviewsCount = reviews.length;
  const averageRating = totalReviewsCount > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviewsCount).toFixed(1)
    : '5.0';

  // Duplicate list for infinite smooth marquee carousel
  const marqueeList = [...reviews, ...reviews, ...reviews];

  return (
    <section className="py-24 px-6 md:px-12 bg-transparent border-t border-brand-maroon/20 relative z-20 overflow-hidden">
      
      {/* Stylesheet injector for infinite marquee scroll loop */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes reviewsMarquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .animate-reviews-marquee {
          display: flex;
          width: max-content;
          animation: reviewsMarquee 40s linear infinite;
        }
        .animate-reviews-marquee:hover {
          animation-play-state: paused;
        }
      `}} />

      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* Header and Aggregate Score Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center text-left">
          <div className="space-y-4">
            <span className="text-[10px] text-brand-gold uppercase tracking-[0.35em] font-extrabold block">✦ Confectionery Feedbacks ✦</span>
            <h2 className="text-3xl md:text-5xl font-serif font-extrabold uppercase tracking-widest text-[var(--text-color)]">
              CUSTOMER REVIEWS
            </h2>
            <div className="w-16 h-[2px] bg-brand-gold" />
          </div>

          {/* Aggregate Rating Score counts */}
          <div className="flex items-center gap-6 bg-brand-panelBg/30 border border-brand-gold/10 p-6 rounded-3xl backdrop-blur-md justify-center md:justify-start w-fit">
            <div className="text-center">
              <span className="text-4xl md:text-5xl font-serif font-extrabold text-brand-gold block">{averageRating}</span>
              <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-bold mt-1">OUT OF 5 STARS</span>
            </div>
            <div className="h-10 w-[1px] bg-brand-gold/20" />
            <div className="space-y-1">
              <div className="flex text-brand-gold gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={15} fill={s <= Math.round(parseFloat(averageRating)) ? "currentColor" : "none"} />
                ))}
              </div>
              <span className="text-[10px] text-zinc-400 font-semibold tracking-wide block">
                Verified reviews from {totalReviewsCount} luxury buyers.
              </span>
            </div>
          </div>
        </div>

        {/* 1. INFINITE SCROLLING MARQUEE */}
        {reviews.length > 0 ? (
          <div className="w-full overflow-hidden py-4 relative pointer-events-auto">
            {/* Vignette mask overlays */}
            <div className="absolute top-0 bottom-0 left-0 w-16 bg-gradient-to-r from-[var(--color-brand-darkBg)] to-transparent z-10 pointer-events-none" />
            <div className="absolute top-0 bottom-0 right-0 w-16 bg-gradient-to-l from-[var(--color-brand-darkBg)] to-transparent z-10 pointer-events-none" />

            <div className="animate-reviews-marquee gap-6">
              {marqueeList.map((review, idx) => (
                <div
                  key={`${review.id}-${idx}`}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  className="w-[280px] md:w-[320px] bg-brand-panelBg/60 border border-brand-gold/10 hover:border-brand-gold/30 rounded-2xl p-5 space-y-4 shadow-xl transition-all duration-300 transform-3d relative flex flex-col justify-between"
                  style={{
                    perspective: '800px',
                    transform: 'rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))'
                  }}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">{review.customer_name}</span>
                      <div className="flex text-brand-gold gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={11} fill={s <= review.rating ? "currentColor" : "none"} />
                        ))}
                      </div>
                    </div>

                    {review.order_id && (
                      <span className="text-[8px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-1.5 py-0.5 rounded font-extrabold tracking-widest inline-flex items-center gap-1 uppercase">
                        <ShieldCheck size={9} /> Verified Buyer
                      </span>
                    )}

                    <p className="text-zinc-400 text-xs leading-relaxed italic line-clamp-4">
                      "{review.text}"
                    </p>

                    {review.image_url && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-brand-gold/15 mt-2">
                        <img 
                          src={review.image_url.startsWith('/') ? `http://localhost:5000${review.image_url}` : review.image_url} 
                          alt="Review attachment" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    )}
                  </div>

                  {/* Reply and Flag blocks */}
                  <div className="border-t border-brand-maroon/15 pt-3.5 flex flex-col gap-2">
                    {review.reply && (
                      <div className="bg-brand-gold/5 border border-brand-gold/10 p-2.5 rounded-lg text-left">
                        <span className="text-[8px] text-brand-gold font-extrabold uppercase tracking-widest block mb-0.5">Mani's Reply</span>
                        <p className="text-zinc-400 text-[10px] italic leading-relaxed">"{review.reply}"</p>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        onClick={() => handleFlagReview(review.id)}
                        className={`text-[8px] uppercase tracking-widest font-extrabold flex items-center gap-1 transition-colors cursor-pointer ${
                          flaggedIds.includes(review.id)
                            ? 'text-red-400'
                            : 'text-zinc-500 hover:text-red-400'
                        }`}
                      >
                        <Flag size={9} /> {flaggedIds.includes(review.id) ? 'Reported' : 'Report review'}
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-zinc-500 text-xs font-serif uppercase tracking-widest">
            Awaiting approved confectionery reviews.
          </div>
        )}

        {/* 2. SUBMIT REVIEW FORM */}
        <div 
          className="max-w-xl mx-auto border border-brand-gold/15 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl backdrop-blur-xl relative text-left"
          style={{
            backgroundColor: theme === 'light' ? 'rgba(240, 234, 224, 0.7)' : 'rgba(18, 18, 18, 0.7)'
          }}
        >
          <div className="absolute top-0 left-0 w-full h-[2px] bg-brand-gold" />
          
          <div className="flex items-center gap-2 border-b border-brand-maroon/15 pb-3">
            <MessageSquare size={16} className="text-brand-gold" />
            <h3 className="text-sm font-serif font-extrabold text-[var(--text-color)] uppercase tracking-wider">Submit Savor Feedback</h3>
          </div>

          <form onSubmit={handleSubmitReview} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] text-zinc-400 uppercase tracking-widest font-bold mb-1">Your Name *</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required
                  placeholder="e.g. Lord Alexander"
                  className="w-full bg-brand-darkBg/60 border border-brand-gold/25 focus:border-brand-gold px-3.5 py-2.5 rounded-lg text-xs text-white outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-[9px] text-zinc-400 uppercase tracking-widest font-bold mb-1">Order ID (Optional Verification)</label>
                <input 
                  type="number" 
                  value={orderId} 
                  onChange={(e) => setOrderId(e.target.value)} 
                  placeholder="e.g. 1024"
                  className="w-full bg-brand-darkBg/60 border border-brand-gold/25 focus:border-brand-gold px-3.5 py-2.5 rounded-lg text-xs text-white outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              {/* Star selector */}
              <div>
                <span className="block text-[9px] text-zinc-400 uppercase tracking-widest font-bold mb-2">Confectionery Grade *</span>
                <div className="flex gap-1.5 text-brand-gold">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star size={20} fill={s <= rating ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
              </div>
              {/* Optional Photo URL */}
              <div>
                <label className="block text-[9px] text-zinc-400 uppercase tracking-widest font-bold mb-1">Product Photo URL (Optional)</label>
                <input 
                  type="text" 
                  value={imageUrl} 
                  onChange={(e) => setImageUrl(e.target.value)} 
                  placeholder="e.g. https://imgur.com/..."
                  className="w-full bg-brand-darkBg/60 border border-brand-gold/25 focus:border-brand-gold px-3.5 py-2.5 rounded-lg text-xs text-white outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] text-zinc-400 uppercase tracking-widest font-bold mb-1">Tasting Review *</label>
              <textarea 
                value={text} 
                onChange={(e) => setText(e.target.value)} 
                required
                rows={3}
                placeholder="Share your culinary impressions of our chocolate melt..."
                className="w-full bg-brand-darkBg/60 border border-brand-gold/25 focus:border-brand-gold px-3.5 py-2.5 rounded-lg text-xs text-white outline-none transition-colors resize-none"
              />
            </div>

            {submitted && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider"
              >
                <Check size={14} /> Review submitted. It will show on the marquee upon moderation approval.
              </motion.div>
            )}

            <div className="text-right">
              <button 
                type="submit"
                disabled={isSubmitting}
                className="bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark font-extrabold px-8 py-3.5 rounded-xl text-[10px] uppercase tracking-widest transition-colors shadow-md shadow-brand-gold/10 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Uploading Feedbacks...' : 'Submit Feedbacks'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </section>
  );
};

export default CustomerReviews;
