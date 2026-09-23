import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, ExternalLink, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Settings {
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  business_name: string;
  tagline: string;
  delivery_zones: string[];
  instagram_username?: string;
}

export const Footer: React.FC = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<Settings>({
    contact_email: 'concierge@maniskotefactory.com',
    contact_phone: '+1 (800) COCOA-LUXE',
    contact_address: '700 Cocoa Boulevard, Suite 100, Chocolate District',
    business_name: "Kote Factory",
    tagline: 'Customize Your Happiness',
    delivery_zones: ['North America', 'European Union', 'United Kingdom', 'Switzerland'],
    instagram_username: 'maniskotefactory'
  });

  useEffect(() => {
    fetch('http://localhost:5000/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data) setSettings(data);
      })
      .catch(err => console.error('Error fetching settings for footer:', err));
  }, []);

  return (
    <footer className="bg-brand-darkBg border-t border-brand-maroon/20 pt-12 md:pt-16 pb-8 px-4 sm:px-6 md:px-12 font-sans text-zinc-400 text-left overflow-x-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-10 mb-10 md:mb-12">
        {/* Brand Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg md:text-xl font-serif text-brand-gold uppercase tracking-widest font-bold">
              {settings.business_name}
            </h2>
          </div>
          <p className="text-xs italic text-brand-goldLight">"{t('footer.tagline')}"</p>
          <p className="text-xs text-zinc-500 leading-relaxed">
            {t('footer.about_desc')}
          </p>
          <div className="pt-2">
            <a 
              href={`https://instagram.com/${settings.instagram_username || 'maniskotefactory'}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center gap-1.5 text-xs text-brand-gold hover:text-brand-goldLight transition-colors font-bold uppercase tracking-wider"
            >
              <span>{t('footer.follow_ig')}</span>
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01" />
              </svg>
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-white text-xs font-serif uppercase tracking-widest font-semibold mb-4 border-b border-brand-gold/10 pb-2">
            {t('footer.experience')}
          </h3>
          <ul className="space-y-2 text-xs">
            <li>
              <Link to="/shop" className="hover:text-brand-gold transition-colors font-semibold text-brand-goldLight">{t('footer.shop')}</Link>
            </li>
            <li>
              <Link to="/catalog" className="hover:text-brand-gold transition-colors">{t('nav.catalog')}</Link>
            </li>
            <li>
              <Link to="/builder" className="hover:text-brand-gold transition-colors">{t('footer.builder')}</Link>
            </li>
            <li className="pt-2">
              <Link to="/owner/login" className="hover:text-brand-gold/80 hover:underline flex items-center gap-1 transition-colors text-[11px]">
                {t('footer.owner')} <ExternalLink size={10} />
              </Link>
            </li>
            <li>
              <Link to="/mwc/login" className="hover:text-brand-gold/80 hover:underline flex items-center gap-1 transition-colors text-[11px]">
                {t('footer.mwc')} <ExternalLink size={10} />
              </Link>
            </li>
          </ul>
        </div>

        {/* Delivery Zones */}
        <div>
          <h3 className="text-white text-xs font-serif uppercase tracking-widest font-semibold mb-4 border-b border-brand-gold/10 pb-2">
            {t('footer.coverage')}
          </h3>
          <p className="text-[11px] text-zinc-500 mb-3 leading-relaxed">
            We deliver via climatized air freight directly to:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {settings.delivery_zones.map((zone, idx) => (
              <span key={idx} className="bg-brand-maroonDark/40 border border-brand-gold/20 text-[10px] text-brand-goldLight px-2 py-0.5 rounded-full">
                {zone}
              </span>
            ))}
          </div>
        </div>

        {/* Contact Coordinates */}
        <div className="space-y-3 text-xs">
          <h3 className="text-white text-xs font-serif uppercase tracking-widest font-semibold mb-4 border-b border-brand-gold/10 pb-2">
            {t('footer.concierge')}
          </h3>
          <div className="flex items-start gap-2.5">
            <Phone size={14} className="text-brand-gold mt-0.5 flex-shrink-0" />
            <span>{settings.contact_phone}</span>
          </div>
          <div className="flex items-start gap-2.5">
            <Mail size={14} className="text-brand-gold mt-0.5 flex-shrink-0" />
            <span className="break-all">{settings.contact_email}</span>
          </div>
          <div className="flex items-start gap-2.5">
            <MapPin size={14} className="text-brand-gold mt-0.5 flex-shrink-0" />
            <span className="leading-relaxed">{settings.contact_address}</span>
          </div>
        </div>
      </div>

      {/* Copyrights and Badges */}
      <div className="max-w-7xl mx-auto pt-6 md:pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-zinc-600">
        <p>© 2026 {settings.business_name}. {t('footer.rights')}</p>
        <div className="flex items-center gap-1.5 text-zinc-500">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>SSL Secured Sandbox Transactions</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
