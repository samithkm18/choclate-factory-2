import React, { useState, useEffect } from 'react';
import { Star, Check, X, MessageSquare, Trash2, Flag } from 'lucide-react';

interface Review {
  id: number;
  customer_name: string;
  rating: number;
  text: string;
  image_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  flagged: number;
  reply?: string;
  created_at: string;
}

interface Props {
  token: string;
  role: 'owner' | 'mwc';
}

export const AdminReviews: React.FC<Props> = ({ token, role }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<{ [id: number]: string }>({});

  const apiBase = `http://localhost:5000/api/${role}`;

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/reviews`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setReviews(await res.json());
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [token, role]);

  const handleStatusUpdate = async (id: number, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`${apiBase}/reviews/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        loadReviews();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleReplySubmit = async (id: number) => {
    const reply = replyText[id] || '';
    if (!reply) return;

    try {
      const res = await fetch(`${apiBase}/reviews/${id}/reply`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reply })
      });
      if (res.ok) {
        setReplyText(prev => ({ ...prev, [id]: '' }));
        loadReviews();
      }
    } catch (err) {
      console.error('Error replying to review:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      const res = await fetch(`${apiBase}/reviews/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        loadReviews();
      }
    } catch (err) {
      console.error('Error deleting review:', err);
    }
  };

  if (loading) {
    return <div className="text-zinc-500 text-xs py-10">Loading moderation queue...</div>;
  }

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <h3 className="text-sm font-serif font-extrabold uppercase tracking-widest text-brand-gold">
          Feedback Moderation Queue
        </h3>
        <span className="text-[10px] text-zinc-500 font-bold uppercase">
          {reviews.length} Total Feedbacks
        </span>
      </div>

      {reviews.length === 0 ? (
        <p className="text-zinc-500 text-xs py-4 text-center uppercase tracking-widest">No customer reviews to moderate.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div 
              key={review.id} 
              className={`p-5 rounded-2xl border bg-black/20 space-y-4 transition-all duration-300 relative ${
                review.flagged ? 'border-red-900/40 ring-1 ring-red-900/25 bg-red-950/5' : 'border-zinc-800/80'
              }`}
            >
              {review.flagged === 1 && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 text-[9px] text-red-400 bg-red-950/60 border border-red-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  <Flag size={10} /> Flagged/Reported
                </div>
              )}

              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">{review.customer_name}</h4>
                  <span className="text-[9px] text-zinc-500 block font-semibold">{new Date(review.created_at).toLocaleString()}</span>
                </div>
                <div className="flex gap-1.5 items-center">
                  <div className="flex text-brand-gold gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={11} fill={s <= review.rating ? "currentColor" : "none"} />
                    ))}
                  </div>
                  <span className={`text-[8px] uppercase tracking-widest font-extrabold px-2 py-0.5 rounded-full ${
                    review.status === 'approved' 
                      ? 'bg-emerald-950/55 text-emerald-400 border border-emerald-500/25'
                      : review.status === 'rejected'
                      ? 'bg-red-950/55 text-red-400 border border-red-500/25'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}>
                    {review.status}
                  </span>
                </div>
              </div>

              <p className="text-xs text-zinc-300 italic leading-relaxed">
                "{review.text}"
              </p>

              {review.image_url && (
                <div className="w-20 h-20 rounded-lg overflow-hidden border border-zinc-800 mt-2">
                  <img 
                    src={review.image_url.startsWith('/') ? `http://localhost:5000${review.image_url}` : review.image_url} 
                    alt="Customer attachment" 
                    className="w-full h-full object-cover" 
                  />
                </div>
              )}

              {/* Reply block */}
              {review.reply && (
                <div className="bg-brand-gold/5 border border-brand-gold/10 p-3 rounded-xl text-left">
                  <span className="text-[8px] text-brand-gold font-extrabold uppercase tracking-widest block mb-1">Active Response</span>
                  <p className="text-zinc-400 text-xs italic leading-relaxed">"{review.reply}"</p>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t border-zinc-900 gap-4 flex-wrap">
                {/* Moderation triggers */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatusUpdate(review.id, 'approved')}
                    className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 text-[10px] font-extrabold uppercase tracking-widest rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-emerald-500/20"
                  >
                    <Check size={11} /> Approve
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(review.id, 'rejected')}
                    className="px-3 py-1.5 bg-red-950 hover:bg-red-900 text-red-400 text-[10px] font-extrabold uppercase tracking-widest rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-red-500/20"
                  >
                    <X size={11} /> Reject
                  </button>
                </div>

                {/* Reply composer */}
                <div className="flex gap-2 flex-grow max-w-md">
                  <input
                    type="text"
                    placeholder="Compose response..."
                    value={replyText[review.id] || ''}
                    onChange={(e) => setReplyText(prev => ({ ...prev, [review.id]: e.target.value }))}
                    className="flex-grow bg-zinc-900/60 border border-zinc-800 text-xs text-white px-3 py-1.5 rounded-lg outline-none focus:border-brand-gold transition-colors"
                  />
                  <button
                    onClick={() => handleReplySubmit(review.id)}
                    className="px-4 py-1.5 bg-brand-gold text-brand-maroonDark text-[10px] font-extrabold uppercase tracking-widest rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <MessageSquare size={11} /> Reply
                  </button>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => handleDelete(review.id)}
                  className="p-2 text-zinc-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                  title="Delete review"
                >
                  <Trash2 size={13} />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default AdminReviews;
