import React, { useState, useEffect } from 'react';
import { MessageSquare, X, Send, Phone, Mail, Clock, HelpCircle, Check } from 'lucide-react';

interface Settings {
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  business_name: string;
  tagline: string;
}

export const CustomerCare: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'faq' | 'contact'>('faq');
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  
  const [settings, setSettings] = useState<Settings>({
    contact_email: 'concierge@maniskotefactory.com',
    contact_phone: '+1 (800) COCOA-LUXE',
    contact_address: '700 Cocoa Boulevard, Suite 100, Chocolate District',
    business_name: "Kote Factory",
    tagline: 'Customize Your Happiness'
  });

  useEffect(() => {
    // Fetch settings from API
    fetch('http://localhost:5000/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data) setSettings(data);
      })
      .catch(err => console.error('Error fetching settings for customer care:', err));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    
    // Simulate support ticket submit
    console.log('Support submission:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', message: '' });
      setIsOpen(false);
    }, 2500);
  };

  const faqs = [
    { q: "Do you ship internationally?", a: "Yes, we ship to North America, the EU, the UK, Japan, Singapore, and Switzerland using refrigerated luxury express transport." },
    { q: "How long does a custom box take to prepare?", a: "Each custom box is curated by hand. Preparation takes 24-48 hours before courier dispatch." },
    { q: "Are there vegan/gluten-free options?", a: "Absolutely. Our Dark Cocoa Eclipse is 100% vegan, and all products list specific allergen details on their showcase detail page." },
    { q: "Can I schedule a delivery date?", a: "Yes. You can select your preferred delivery date and time slot during the checkout process." }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[9990] font-sans">
      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-brand-maroon hover:bg-brand-maroonLight text-brand-gold hover:text-white rounded-full flex items-center justify-center shadow-lg border border-brand-gold/30 hover:border-brand-gold transition-all duration-300 transform hover:scale-105 active:scale-95"
        aria-label="Customer Care"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* Glassmorphic Panel */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 sm:w-96 h-[480px] glass-panel-heavy rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-brand-gold/30 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-brand-maroon/80 p-4 border-b border-brand-gold/20 flex flex-col justify-center">
            <h3 className="text-brand-gold font-serif font-bold text-lg">Mani's Concierge</h3>
            <p className="text-xs text-zinc-300">Customize Your Happiness — Live Support</p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-brand-maroonDark/40 border-b border-brand-gold/10 text-xs">
            <button 
              onClick={() => setActiveTab('faq')}
              className={`flex-1 py-2 text-center transition-all ${activeTab === 'faq' ? 'text-brand-gold border-b-2 border-brand-gold font-medium' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              FAQs
            </button>
            <button 
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 text-center transition-all ${activeTab === 'chat' ? 'text-brand-gold border-b-2 border-brand-gold font-medium' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              Message Us
            </button>
            <button 
              onClick={() => setActiveTab('contact')}
              className={`flex-1 py-2 text-center transition-all ${activeTab === 'contact' ? 'text-brand-gold border-b-2 border-brand-gold font-medium' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              Direct
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-4 overflow-y-auto">
            {activeTab === 'faq' && (
              <div className="space-y-4">
                <h4 className="text-xs text-brand-gold uppercase tracking-wider flex items-center gap-1 font-semibold mb-2">
                  <HelpCircle size={14} /> Frequently Asked Questions
                </h4>
                {faqs.map((faq, idx) => (
                  <div key={idx} className="bg-white/5 p-3 rounded-lg border border-white/5">
                    <p className="text-sm font-semibold text-brand-goldLight mb-1">{faq.q}</p>
                    <p className="text-xs text-zinc-300 leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="h-full flex flex-col justify-center">
                {submitted ? (
                  <div className="text-center space-y-2 py-8 animate-in zoom-in-95">
                    <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                      <Check size={24} />
                    </div>
                    <h4 className="text-brand-gold font-medium">Message Received</h4>
                    <p className="text-xs text-zinc-400">Our concierge will contact you within 2 hours.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                      <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Your Name</label>
                      <input 
                        type="text" 
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-white/5 border border-brand-gold/20 focus:border-brand-gold rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors"
                        placeholder="Audrey Hepburn"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Email Address</label>
                      <input 
                        type="email" 
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-white/5 border border-brand-gold/20 focus:border-brand-gold rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors"
                        placeholder="audrey@hollywood.com"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1">How can we assist you?</label>
                      <textarea 
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        rows={3}
                        className="w-full bg-white/5 border border-brand-gold/20 focus:border-brand-gold rounded-lg px-3 py-2 text-xs text-white outline-none resize-none transition-colors"
                        placeholder="Inquire about ingredients, custom recipes, or active orders..."
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark font-semibold py-2 rounded-lg text-xs flex items-center justify-center gap-1 shadow-md transition-colors"
                    >
                      <Send size={12} /> Send Concierge Message
                    </button>
                  </form>
                )}
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="space-y-4">
                <h4 className="text-xs text-brand-gold uppercase tracking-wider font-semibold mb-2">Direct Concierge Channels</h4>
                
                <div className="flex items-start gap-3 bg-white/5 p-3 rounded-lg border border-white/5">
                  <Phone className="text-brand-gold mt-0.5" size={16} />
                  <div>
                    <p className="text-xs text-zinc-400 uppercase tracking-wider">Phone Booking</p>
                    <p className="text-sm font-semibold text-white mt-0.5">{settings.contact_phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white/5 p-3 rounded-lg border border-white/5">
                  <Mail className="text-brand-gold mt-0.5" size={16} />
                  <div>
                    <p className="text-xs text-zinc-400 uppercase tracking-wider">Email Inquiry</p>
                    <p className="text-sm font-semibold text-white mt-0.5 break-all">{settings.contact_email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white/5 p-3 rounded-lg border border-white/5">
                  <Clock className="text-brand-gold mt-0.5" size={16} />
                  <div>
                    <p className="text-xs text-zinc-400 uppercase tracking-wider">Concierge Hours</p>
                    <p className="text-sm font-semibold text-white mt-0.5">Monday – Sunday: 9:00 AM – 10:00 PM EST</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerCare;
