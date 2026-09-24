import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  Mail, 
  Phone, 
  MapPin, 
  ExternalLink, 
  Award, 
  Lightbulb, 
  Flag, 
  Sprout, 
  Users, 
  Handshake, 
  TrendingUp, 
  Briefcase, 
  Target, 
  Eye,
  Quote
} from 'lucide-react';

interface AboutContent {
  story: string;
  usps: { title: string; description?: string; desc?: string }[];
  quality_claims: string;
  images?: string[];
}

interface ValueItem {
  number: string;
  title: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.FC<{ size?: number; className?: string; [key: string]: any }>;
}

const VALUES: ValueItem[] = [
  {
    number: '01',
    title: 'Quality First',
    description: 'We strive to maintain high standards across our products, processes, packaging, sourcing, and customer experience. Quality is not simply a feature of our products—it is a fundamental principle of our business.',
    icon: Award
  },
  {
    number: '02',
    title: 'Innovation & Product Development',
    description: 'We continuously explore new ideas, ingredients, technologies, designs, and business opportunities to develop products that meet changing consumer expectations while creating distinctive and meaningful brands.',
    icon: Lightbulb
  },
  {
    number: '03',
    title: 'Building Indian Brands',
    description: 'We aim to create brands that reflect the quality, creativity, culture, and entrepreneurial spirit of Bharat. Our goal is to develop products that can compete confidently in both Indian and international markets.',
    icon: Flag
  },
  {
    number: '04',
    title: 'Supporting Farmers & Agriculture',
    description: 'We aspire to create stronger connections between agriculture and the consumer market. In particular, we seek to encourage the growth of cacao cultivation in India, create awareness about cacao farming, and contribute to opportunities for farmers and the agricultural community.',
    icon: Sprout
  },
  {
    number: '05',
    title: 'Customer Trust',
    description: 'Every customer interaction is an opportunity to build trust. We focus on delivering consistent quality, transparent communication, responsible business practices, and products that provide genuine value.',
    icon: Users
  },
  {
    number: '06',
    title: 'Strong Business Partnerships',
    description: 'We believe sustainable growth comes through strong relationships. We aim to build long-term partnerships with distributors, retailers, suppliers, institutions, entrepreneurs, farmers, and other business stakeholders.',
    icon: Handshake
  },
  {
    number: '07',
    title: 'Sustainable Growth',
    description: 'Our objective is not simply to grow quickly, but to build a business capable of creating value for the long term. We aim to adopt responsible sourcing, efficient operations, sustainable practices, and scalable business models wherever possible.',
    icon: TrendingUp
  },
  {
    number: '08',
    title: 'Creating Opportunities',
    description: 'As Mani Sales International grows, we aim to create opportunities for employment, entrepreneurship, distribution, manufacturing, agriculture, and local businesses, contributing to economic development at the grassroots level.',
    icon: Briefcase
  }
];

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
      .catch((err) => {
        console.error('Error fetching about us details:', err);
        // Fallback default
        setContent({
          story: "Founded under Mani Sales International, Kote Factory was born out of a profound passion for culinary excellence and artisanal confectionery. We meticulously source single-origin Criollo cocoa beans, gently roasting and stone-conching them to velvet perfection.",
          usps: [
            { title: "Single Origin Criollo", description: "Harvested directly from sustainable farms with high natural aromatic oils." },
            { title: "Stone-Conched Velvet", description: "Conched for 72 continuous hours down to a silky 12-micron finish." },
            { title: "Zero Artificial Additives", description: "100% pure cocoa butter, raw crystals, and natural flavor botanicals." }
          ],
          quality_claims: "100% Handcrafted Artisanal Excellence — Made in Bharat for the World"
        });
      });
  }, []);

  if (!content) {
    return (
      <div className="min-h-screen bg-brand-darkBg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-gold/25 border-t-brand-gold rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-brand-darkBg text-white relative flex flex-col justify-between overflow-hidden">
      
      {/* Background ambient gold aura glow */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[70vw] h-[70vw] bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.04)_0%,rgba(0,0,0,0)_65%)] blur-3xl rounded-full z-0 pointer-events-none" />

      {/* Main page wrapper */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-12 py-28 md:py-36 space-y-16 md:space-y-20 text-left">
        
        {/* ─── 1. Editorial Header: Indian Roots, Global Ambition ─── */}
        <div className="space-y-4 text-center max-w-3xl mx-auto">
          <span className="text-[10px] md:text-xs text-brand-gold uppercase tracking-[0.35em] font-extrabold block">
            ✦ Mani Sales International ✦
          </span>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-extrabold uppercase tracking-widest text-[var(--text-color)] leading-tight">
            Indian Roots, Global Ambition
          </h1>
          <div className="w-20 h-[2.5px] bg-brand-gold mx-auto my-3" />
          <p className="text-zinc-300 text-xs sm:text-sm md:text-base font-medium leading-relaxed">
            We take inspiration from Bharat while building products and brands with the potential to reach the world.
          </p>
        </div>

        {/* ─── 2. Story Card with Passport-size Owner Photo on the Right ─── */}
        <div 
          className="border border-brand-gold/20 rounded-3xl p-6 sm:p-8 md:p-12 shadow-2xl relative overflow-hidden backdrop-blur-xl transition-all duration-500"
          style={{
            backgroundColor: theme === 'light' ? 'rgba(240, 234, 224, 0.7)' : 'rgba(18, 18, 18, 0.7)'
          }}
        >
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-gold/15 via-brand-gold to-brand-gold/15" />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center">
            
            {/* Left Story Text */}
            <div className="lg:col-span-8 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-gold/10 border border-brand-gold/30 text-brand-gold text-[10px] uppercase font-bold tracking-widest">
                <Sparkles size={13} /> The Savor Legacy & Heritage
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-[var(--text-color)] font-bold uppercase tracking-wide">
                Crafting Excellence At Mani Sales International
              </h2>
              <p className="text-[var(--text-color)] text-xs sm:text-sm leading-relaxed font-semibold">
                {content.story}
              </p>
              <div className="p-4 rounded-2xl bg-brand-maroon/20 border border-brand-gold/15 text-xs text-zinc-300 leading-relaxed font-medium">
                Under <strong>Mani Sales International</strong>, we are committed to building authentic homegrown brands, creating value for local agricultural ecosystems, and crafting confectionery that rivals the world’s most renowned chocolate houses.
              </div>
            </div>

            {/* Right: Passport-size Photo of Owner Sujanth S Mani */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center text-center">
              <div className="relative group">
                {/* Outer Glow & Metallic Border */}
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-brand-gold/60 to-brand-goldLight/80 blur-sm opacity-70 group-hover:opacity-100 transition duration-500" />
                
                {/* Passport size photo frame */}
                <div className="relative w-40 sm:w-44 md:w-48 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-brand-gold bg-brand-maroonDark shadow-2xl">
                  <img 
                    src="/owner-sujanth.jpg" 
                    alt="Sujanth S Mani - Owner" 
                    className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/logo.png';
                    }}
                  />
                </div>
              </div>

              {/* Owner Name & Designation */}
              <div className="mt-4 space-y-1">
                <h3 className="text-base sm:text-lg font-serif font-bold text-brand-gold uppercase tracking-wider">
                  Sujanth S Mani
                </h3>
                <span className="inline-block text-[10px] uppercase font-extrabold tracking-[0.25em] text-white px-3 py-0.5 rounded-full bg-brand-gold/20 border border-brand-gold/30">
                  Owner
                </span>
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold pt-0.5">
                  Mani Sales International
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* ─── 3. Our Core Purpose Highlight ─── */}
        <div className="relative rounded-3xl p-6 sm:p-8 md:p-10 border border-brand-gold/30 bg-gradient-to-br from-brand-maroonDark/80 via-brand-panelBg to-brand-darkBg shadow-2xl text-center overflow-hidden">
          <div className="absolute top-4 left-6 text-brand-gold/15 pointer-events-none">
            <Quote size={60} />
          </div>
          <div className="relative z-10 max-w-3xl mx-auto space-y-4">
            <span className="text-[10px] text-brand-gold uppercase tracking-[0.3em] font-extrabold block">
              ✦ Our Core Purpose ✦
            </span>
            <blockquote className="text-base sm:text-xl md:text-2xl font-serif text-brand-goldLight italic font-bold leading-snug">
              “To build trusted brands, create meaningful products, empower people, and take the excellence of Bharat to the world.”
            </blockquote>
          </div>
        </div>

        {/* ─── 4. Our Values & Business Focus (8 Cards) ─── */}
        <div className="space-y-8">
          <div className="text-center space-y-3">
            <span className="text-[10px] text-brand-gold uppercase tracking-[0.3em] font-extrabold block">
              ✦ Guiding Principles ✦
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-serif font-bold uppercase tracking-widest text-[var(--text-color)]">
              Our Values & Business Focus
            </h2>
            <div className="w-16 h-[2px] bg-brand-gold mx-auto" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {VALUES.map((val) => {
              const Icon = val.icon;
              return (
                <div
                  key={val.number}
                  className="p-6 rounded-3xl border border-brand-gold/15 hover:border-brand-gold/50 shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group relative overflow-hidden"
                  style={{
                    backgroundColor: theme === 'light' ? 'rgba(240, 234, 224, 0.55)' : 'rgba(18, 18, 18, 0.55)'
                  }}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-center text-brand-gold group-hover:bg-brand-gold group-hover:text-brand-maroonDark transition-colors duration-300">
                        <Icon size={18} />
                      </div>
                      <span className="font-mono text-xs font-extrabold text-brand-gold/40 group-hover:text-brand-gold transition-colors">
                        {val.number}
                      </span>
                    </div>

                    <h3 className="text-sm font-serif font-bold uppercase tracking-wider text-[var(--text-color)] group-hover:text-brand-gold transition-colors">
                      {val.title}
                    </h3>

                    <p className="text-[var(--text-muted)] text-xs leading-relaxed font-medium">
                      {val.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── 5. Mission & Vision ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          
          {/* Mission Card */}
          <div 
            className="p-6 sm:p-8 rounded-3xl border border-brand-gold/25 shadow-2xl relative overflow-hidden space-y-4"
            style={{
              backgroundColor: theme === 'light' ? 'rgba(240, 234, 224, 0.65)' : 'rgba(18, 18, 18, 0.65)'
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-brand-gold/15 border border-brand-gold/30 flex items-center justify-center text-brand-gold">
                <Target size={22} />
              </div>
              <div>
                <span className="text-[9px] text-brand-gold uppercase tracking-[0.25em] font-bold block">Our Purpose</span>
                <h3 className="text-xl sm:text-2xl font-serif text-[var(--text-color)] font-bold uppercase tracking-wider">
                  Mission
                </h3>
              </div>
            </div>
            <p className="text-[var(--text-color)] text-xs sm:text-sm leading-relaxed font-medium">
              “To create high-quality, innovative, and value-driven products that bring joy and trust to every customer, while building strong, lasting business relationships across India and beyond. We aim to promote Indian entrepreneurship, support local communities, and contribute to the growth of cacao and sustainable farming across Bharat.”
            </p>
          </div>

          {/* Vision Card */}
          <div 
            className="p-6 sm:p-8 rounded-3xl border border-brand-gold/25 shadow-2xl relative overflow-hidden space-y-4"
            style={{
              backgroundColor: theme === 'light' ? 'rgba(240, 234, 224, 0.65)' : 'rgba(18, 18, 18, 0.65)'
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-brand-gold/15 border border-brand-gold/30 flex items-center justify-center text-brand-gold">
                <Eye size={22} />
              </div>
              <div>
                <span className="text-[9px] text-brand-gold uppercase tracking-[0.25em] font-bold block">Our Horizon</span>
                <h3 className="text-xl sm:text-2xl font-serif text-[var(--text-color)] font-bold uppercase tracking-wider">
                  Vision
                </h3>
              </div>
            </div>
            <p className="text-[var(--text-color)] text-xs sm:text-sm leading-relaxed font-medium">
              “To build Mani Sales International into a trusted and leading multi brand company from Bharat, known for quality, innovation, integrity, and excellence across food, lifestyle, and emerging business sectors.”
            </p>
          </div>

        </div>

        {/* ─── 6. Quality Claims Banner ─── */}
        <div className="bg-brand-maroon/20 border border-brand-gold/25 p-5 rounded-2xl text-center space-y-1">
          <span className="text-[8px] text-brand-gold uppercase tracking-widest block font-bold">certified quality guarantees</span>
          <p className="text-zinc-200 text-xs sm:text-sm font-serif font-bold uppercase tracking-wider italic">
            "{content.quality_claims || '100% Handcrafted Artisanal Excellence — Made in Bharat for the World'}"
          </p>
        </div>

        {/* ─── 7. Contact & Factory Location Details ─── */}
        <div 
          className="border border-brand-gold/20 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl transition-all duration-500"
          style={{
            backgroundColor: theme === 'light' ? 'rgba(240, 234, 224, 0.7)' : 'rgba(18, 18, 18, 0.7)'
          }}
        >
          <div className="space-y-4">
            <span className="text-[10px] text-brand-gold uppercase tracking-[0.3em] font-extrabold block">
              ✦ Get In Touch & Visit Us ✦
            </span>
            <h3 className="text-xl sm:text-2xl font-serif text-[var(--text-color)] font-bold uppercase tracking-wide">
              Contact & Factory Location
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
              
              {/* Email */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center text-brand-gold shrink-0">
                  <Mail size={18} />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] text-zinc-400 uppercase tracking-widest font-extrabold block">Owner Email</span>
                  <a 
                    href="mailto:manisales.international@gmail.com" 
                    className="text-xs font-semibold text-brand-gold hover:underline break-all"
                  >
                    manisales.international@gmail.com
                  </a>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center text-brand-gold shrink-0">
                  <Phone size={18} />
                </div>
                <div>
                  <span className="text-[9px] text-zinc-400 uppercase tracking-widest font-extrabold block">Owner Phone</span>
                  <a 
                    href="tel:8660801536" 
                    className="text-xs font-semibold text-white hover:text-brand-gold transition-colors font-mono"
                  >
                    8660801536
                  </a>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center text-brand-gold shrink-0">
                  <MapPin size={18} />
                </div>
                <div>
                  <span className="text-[9px] text-zinc-400 uppercase tracking-widest font-extrabold block">Factory Location</span>
                  <a 
                    href="https://maps.app.goo.gl/J25KDX7R3QEmaeHj7?g_st=iwb" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-gold hover:underline mt-0.5"
                  >
                    View on Google Maps <ExternalLink size={12} />
                  </a>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default About;
