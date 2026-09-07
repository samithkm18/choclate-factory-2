import React, { useEffect, useState } from 'react';

export const CustomCursor: React.FC = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [trail, setTrail] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    // Check if it's desktop
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 1024 || 'ontouchstart' in window);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);

    if (isMobile) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isClickable = 
        target.tagName === 'BUTTON' || 
        target.tagName === 'A' || 
        target.closest('a') || 
        target.closest('button') || 
        target.classList.contains('cursor-pointer') ||
        target.closest('.cursor-pointer');
      
      setIsHovered(!!isClickable);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [isMobile]);

  // Smooth trail effect
  useEffect(() => {
    if (isMobile) return;

    let frameId: number;
    const animateTrail = () => {
      setTrail(prev => {
        const dx = position.x - prev.x;
        const dy = position.y - prev.y;
        return {
          x: prev.x + dx * 0.15,
          y: prev.y + dy * 0.15
        };
      });
      frameId = requestAnimationFrame(animateTrail);
    };

    frameId = requestAnimationFrame(animateTrail);
    return () => cancelAnimationFrame(frameId);
  }, [position, isMobile]);

  if (isMobile) return null;

  return (
    <>
      <div 
        className={`custom-cursor ${isHovered ? 'hovered' : ''}`} 
        style={{ left: `${trail.x}px`, top: `${trail.y}px` }} 
      />
      <div 
        className="custom-cursor-dot" 
        style={{ left: `${position.x}px`, top: `${position.y}px` }} 
      />
    </>
  );
};

export default CustomCursor;
