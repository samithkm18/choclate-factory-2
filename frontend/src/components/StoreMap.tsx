import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Phone, Navigation } from 'lucide-react';

interface Location {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  description: string | null;
  status: 'active' | 'inactive';
}

const StoreMap: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/products/locations')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setLocations(data);
          if (data.length > 0) setSelectedLocation(data[0]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching locations:', err);
        setLoading(false);
      });
  }, []);

  // Initialize Leaflet map after locations load
  useEffect(() => {
    if (loading || locations.length === 0 || !mapRef.current) return;

    // Dynamically import leaflet to avoid SSR issues
    const initMap = async () => {
      try {
        const L = (await import('leaflet')).default;
        
        // Add Leaflet CSS dynamically
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        // Fix default marker icon path issue in webpack/vite
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        // Destroy existing map if re-initializing
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        const centerLat = locations.reduce((s, l) => s + l.latitude, 0) / locations.length;
        const centerLng = locations.reduce((s, l) => s + l.longitude, 0) / locations.length;

        const map = L.map(mapRef.current!, {
          center: [centerLat, centerLng],
          zoom: locations.length === 1 ? 15 : 11,
          zoomControl: true,
        });

        // Dark-themed tile layer (Carto Dark Matter)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 19
        }).addTo(map);

        // Custom gold marker icon
        const goldIcon = L.divIcon({
          className: '',
          html: `<div style="
            width: 32px; height: 32px;
            background: linear-gradient(135deg, #D4AF37, #B8860B);
            border: 2px solid #F5D167;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 15px rgba(212, 175, 55, 0.5);
          "><div style="
            width: 10px; height: 10px;
            background: #1A0D0E;
            border-radius: 50%;
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%,-50%);
          "></div></div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -36]
        });

        markersRef.current = [];
        locations.forEach(loc => {
          const marker = L.marker([loc.latitude, loc.longitude], { icon: goldIcon })
            .addTo(map)
            .bindPopup(`
              <div style="
                font-family: 'Cinzel', 'Times New Roman', serif;
                min-width: 200px;
                background: #121212;
                color: #E2E8F0;
                border: 1px solid #D4AF37;
                border-radius: 12px;
                padding: 12px;
              ">
                <h3 style="color: #D4AF37; font-size: 13px; font-weight: bold; margin: 0 0 8px; letter-spacing: 0.05em;">${loc.name}</h3>
                <p style="color: #9CA3AF; font-size: 11px; margin: 0 0 6px; line-height: 1.4;">${loc.address}</p>
                ${loc.phone ? `<p style="color: #9CA3AF; font-size: 11px; margin: 0;">📞 ${loc.phone}</p>` : ''}
                ${loc.description ? `<p style="color: #6B7280; font-size: 10px; margin: 6px 0 0; font-style: italic;">${loc.description}</p>` : ''}
              </div>
            `, {
              className: 'manis-popup',
              maxWidth: 280
            });

          marker.on('click', () => setSelectedLocation(loc));
          markersRef.current.push({ marker, loc });
        });

        mapInstanceRef.current = map;
        setMapReady(true);
      } catch (err) {
        console.error('Map initialization error:', err);
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [locations, loading]);

  // Pan map to selected location
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedLocation) return;
    mapInstanceRef.current.setView([selectedLocation.latitude, selectedLocation.longitude], 15, {
      animate: true,
      duration: 1
    });
    // Open popup for selected location
    const entry = markersRef.current.find(m => m.loc.id === selectedLocation.id);
    if (entry) entry.marker.openPopup();
  }, [selectedLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-brand-gold/30 border-t-brand-gold rounded-full animate-spin mx-auto" />
          <p className="text-zinc-500 text-[10px] uppercase tracking-widest">Loading Locations...</p>
        </div>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <MapPin size={48} className="text-zinc-700 mx-auto" />
        <p className="text-zinc-500 text-sm">No store locations available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2 text-brand-gold text-[10px] uppercase tracking-[0.3em] font-extrabold">
          <MapPin size={12} />
          <span>Find Us</span>
        </div>
        <h2 className="text-2xl md:text-4xl font-serif text-white uppercase tracking-widest font-bold">
          OUR <span className="metallic-gold-shimmer text-gold-metallic">LOCATIONS</span>
        </h2>
        <div className="w-12 h-[1px] bg-brand-gold/45 mx-auto" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Location List */}
        <div className="space-y-3 lg:max-h-[480px] lg:overflow-y-auto lg:pr-2">
          {locations.map(loc => (
            <button
              key={loc.id}
              onClick={() => setSelectedLocation(loc)}
              className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                selectedLocation?.id === loc.id
                  ? 'bg-brand-gold/10 border-brand-gold/50 shadow-lg shadow-brand-gold/10'
                  : 'bg-brand-panelBg border-brand-maroon/15 hover:border-brand-gold/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  selectedLocation?.id === loc.id ? 'bg-brand-gold text-brand-maroonDark' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  <MapPin size={14} />
                </div>
                <div className="space-y-1 min-w-0">
                  <h3 className={`font-serif font-bold text-sm uppercase tracking-wide truncate ${
                    selectedLocation?.id === loc.id ? 'text-brand-gold' : 'text-white'
                  }`}>
                    {loc.name}
                  </h3>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">{loc.address}</p>
                  {loc.phone && (
                    <p className="text-zinc-500 text-[10px] flex items-center gap-1">
                      <Phone size={10} /> {loc.phone}
                    </p>
                  )}
                  {loc.description && (
                    <p className="text-zinc-600 text-[10px] italic">{loc.description}</p>
                  )}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[9px] text-brand-gold hover:underline uppercase tracking-wider font-bold mt-1"
                  >
                    <Navigation size={10} /> Get Directions
                  </a>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Map Container */}
        <div className="lg:col-span-2 relative rounded-3xl overflow-hidden border border-brand-maroon/20 shadow-2xl" style={{ height: '480px' }}>
          <div ref={mapRef} className="w-full h-full" />
          {!mapReady && (
            <div className="absolute inset-0 bg-zinc-950/80 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-8 h-8 border-2 border-brand-gold/30 border-t-brand-gold rounded-full animate-spin mx-auto" />
                <p className="text-zinc-400 text-[10px] uppercase tracking-widest">Initializing Map...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreMap;
