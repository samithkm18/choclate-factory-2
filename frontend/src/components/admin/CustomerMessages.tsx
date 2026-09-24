import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw, CheckCircle2, Clock, MessageSquare, Phone, User } from 'lucide-react';

interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  created_at: string;
}

interface Props {
  token: string;
  role?: string;
}

export const CustomerMessages: React.FC<Props> = ({ token }) => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/owner/messages', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Error loading customer messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [token]);

  const handleUpdateStatus = async (id: string, status: 'new' | 'read' | 'replied') => {
    try {
      const res = await fetch(`http://localhost:5000/api/owner/messages/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setMessages(prev => prev.map(m => m._id === id ? { ...m, status } : m));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 text-left font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] text-brand-gold uppercase tracking-[0.3em] font-extrabold block">Customer Portal Inbox</span>
          <h2 className="text-2xl font-serif text-white uppercase font-bold">Customer Messages & Inquiries</h2>
        </div>

        <button
          onClick={fetchMessages}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer w-fit"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Inbox
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400">
          <div className="w-8 h-8 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-widest font-bold">Loading Customer Messages...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="bg-brand-panelBg border border-brand-maroon/20 rounded-2xl p-12 text-center space-y-3">
          <Mail size={36} className="text-zinc-600 mx-auto" />
          <h3 className="text-lg font-serif text-zinc-300 uppercase">No Customer Messages</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Messages submitted by customers through Contact Us will automatically appear here in real-time.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map(msg => (
            <div
              key={msg._id}
              className={`bg-brand-panelBg border rounded-2xl p-5 md:p-6 space-y-4 transition-all shadow-xl ${
                msg.status === 'new' ? 'border-brand-gold/50 bg-brand-gold/5' : 'border-brand-maroon/20 hover:border-brand-gold/30'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-gold/15 border border-brand-gold/30 flex items-center justify-center text-brand-gold font-bold text-sm">
                    {msg.name ? msg.name[0].toUpperCase() : 'C'}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm leading-tight flex items-center gap-2">
                      {msg.name}
                      {msg.status === 'new' && (
                        <span className="px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-widest bg-emerald-500 text-zinc-950">
                          NEW
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-brand-gold font-medium">{msg.email} {msg.phone ? `• ${msg.phone}` : ''}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500 font-semibold">
                    {new Date(msg.created_at).toLocaleString()}
                  </span>
                  
                  <select
                    value={msg.status}
                    onChange={e => handleUpdateStatus(msg._id, e.target.value as any)}
                    className="bg-brand-darkBg border border-brand-gold/20 text-xs text-zinc-200 rounded-lg px-2.5 py-1 outline-none font-bold uppercase cursor-pointer"
                  >
                    <option value="new">New</option>
                    <option value="read">Read</option>
                    <option value="replied">Replied</option>
                  </select>
                </div>
              </div>

              {msg.subject && (
                <p className="text-xs font-bold text-brand-goldLight uppercase tracking-wider">
                  Subject: {msg.subject}
                </p>
              )}

              <p className="text-xs text-zinc-300 leading-relaxed bg-brand-darkBg/60 p-4 rounded-xl border border-white/5 whitespace-pre-wrap">
                "{msg.message}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerMessages;
