import React, { useEffect, useRef, useState } from 'react';

interface LogoIntroProps {
  onComplete: () => void;
}

export const LogoIntro: React.FC<LogoIntroProps> = ({ onComplete }) => {
  const [showSkip, setShowSkip] = useState(false);
  const [isWiping, setIsWiping] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [logoUrl, setLogoUrl] = useState('/logo.png');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    // Check if user has already watched it in this session
    const watched = sessionStorage.getItem('manis_intro_watched');
    if (watched === 'true') {
      onComplete();
      return;
    }

    // Load global settings to get custom brand logo
    fetch('http://localhost:5000/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && data.brand_logo_url) {
          setLogoUrl(data.brand_logo_url);
        }
      })
      .catch(err => console.error('Error loading logo settings:', err));

    // Delay skip button appearance for cinematic impact (1.5 seconds)
    const skipTimer = setTimeout(() => setShowSkip(true), 1500);

    return () => {
      clearTimeout(skipTimer);
    };
  }, [onComplete]);

  // Handle video load and trigger playback
  const handleCanPlay = () => {
    setVideoLoaded(true);
    if (videoRef.current) {
      videoRef.current.play().catch(err => {
        console.log('Autoplay blocked or video ended early:', err);
        // Fallback to auto-complete after 6.55s if autoplay fails completely
        setTimeout(() => triggerWipe(), 6550);
      });
    }
  };

  const triggerWipe = () => {
    setIsWiping(true);
    sessionStorage.setItem('manis_intro_watched', 'true');
    setTimeout(() => {
      onComplete();
    }, 900); // Match circular scale wipe delay
  };

  return (
    <div 
      className={`fixed inset-0 z-[99999] bg-[#0D0506] flex items-center justify-center transition-all duration-[900ms] overflow-hidden w-full h-full min-h-[100dvh] ${
        isWiping ? 'scale-150 opacity-0 pointer-events-none' : ''
      }`}
      style={{
        clipPath: isWiping ? 'circle(0% at 50% 50%)' : 'circle(150% at 50% 50%)',
        transitionProperty: 'clip-path, opacity, transform',
        transitionTimingFunction: 'cubic-bezier(0.85, 0, 0.15, 1)'
      }}
    >
      {/* Luxury Loading Screen with Logo Asset */}
      {!videoLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6 bg-[#0D0506] z-50">
          <div className="w-16 h-16 border-2 border-brand-gold/40 rounded-full flex items-center justify-center bg-brand-maroonDark overflow-hidden shadow-[0_0_20px_rgba(212,175,55,0.3)] animate-pulse">
            <img 
              src={logoUrl.startsWith('http') || logoUrl.startsWith('/logo.png') ? logoUrl : `http://localhost:5000${logoUrl}`} 
              alt="Mani's Logo" 
              className="w-full h-full object-cover rounded-full" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo.png';
              }}
            />
          </div>
          <div className="w-10 h-10 border-2 border-brand-gold/25 border-t-brand-gold rounded-full animate-spin" />
          <h2 className="text-brand-gold font-serif text-[10px] tracking-[0.3em] uppercase animate-pulse">
            Loading Experience
          </h2>
        </div>
      )}

      {/* Raw Cloudinary Video 1 Stream (No heavy iframe) */}
      <video
        ref={videoRef}
        src="https://res.cloudinary.com/dwji2t2uj/video/upload/q_auto,f_auto/Chocolate_brand_logo_reveal_1080p_202608250010_tjizhm.mp4"
        className="w-full h-full max-w-full max-h-full object-contain absolute inset-0 m-auto z-10 transition-opacity duration-700 pointer-events-none"
        style={{ 
          opacity: videoLoaded ? 1 : 0,
          backgroundColor: '#0D0506'
        }}
        muted
        playsInline
        preload="auto"
        onCanPlay={handleCanPlay}
        onEnded={triggerWipe}
      />

      {/* Skip Button */}
      {showSkip && (
        <button
          onClick={triggerWipe}
          className="absolute bottom-8 sm:bottom-10 z-20 px-8 py-3 bg-brand-maroon/60 hover:bg-brand-maroon border border-brand-gold/40 hover:border-brand-gold rounded-full text-brand-gold text-[10px] uppercase tracking-widest transition-all duration-300 transform hover:scale-105 active:scale-95 font-semibold backdrop-blur-md cursor-pointer"
        >
          Skip Invitation
        </button>
      )}
    </div>
  );
};

export default LogoIntro;
