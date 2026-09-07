import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

gsap.registerPlugin(ScrollTrigger);

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  is_new?: number;
}

interface CircularShowcaseProps {
  products: Product[];
}

export const CircularShowcase: React.FC<CircularShowcaseProps> = ({ products }) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Filter out the custom builder box virtual product
  const showcaseProducts = products.filter(p => p.slug !== 'custom-happiness-box');
  const N = showcaseProducts.length;

  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);
  const [manualAngleOffset, setManualAngleOffset] = useState(0);
  const [textures, setTextures] = useState<Record<number, THREE.Texture>>({});
  const [theme, setTheme] = useState('dark');

  // Drag controls state tracking
  const dragStart = useRef(0);
  const angleStart = useRef(0);
  const isDragging = useRef(false);

  // Detect current theme transitions
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

  // Async load product packaging textures
  useEffect(() => {
    if (N === 0) return;
    const loader = new THREE.TextureLoader();
    showcaseProducts.forEach(p => {
      if (p.images && p.images[0]) {
        const img = p.images[0];
        const url = img.startsWith('/') ? `http://localhost:5000${img}` : img;
        loader.load(url, (tex) => {
          tex.anisotropy = 8;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          setTextures(prev => ({ ...prev, [p.id]: tex }));
        });
      }
    });
  }, [products]);

  // GSAP ScrollTrigger linking scroll height to orbit progress
  useLayoutEffect(() => {
    if (N === 0 || !containerRef.current) return;

    const trigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top top',
      end: '+=450vh', // Pinned for smooth orbital scroll transitions
      pin: true,
      scrub: 0.8,
      onUpdate: (self) => {
        setScrollProgress(self.progress);
      }
    });

    return () => {
      trigger.kill();
    };
  }, [N]);

  if (N === 0) return null;

  const activeProduct = showcaseProducts[activeIdx];

  const handleInspectProduct = () => {
    navigate(`/product/${activeProduct.slug}`);
  };

  // Pointer drag/swipe event handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    dragStart.current = e.clientX;
    angleStart.current = manualAngleOffset;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const delta = e.clientX - dragStart.current;
    // Map drag pixels to radians
    const newOffset = angleStart.current - (delta * 0.007);
    setManualAngleOffset(newOffset);
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-transparent select-none cursor-grab active:cursor-grabbing"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Dimmed backdrop-blur overlay to push background video behind showcase */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none transition-all duration-700 ease-in-out"
        style={{
          backgroundColor: theme === 'light' ? 'rgba(248, 244, 238, 0.65)' : 'rgba(10, 10, 10, 0.65)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
      />
      
      {/* 3D WebGL Canvas Layer */}
      <div className="absolute inset-0 z-10 w-full h-full">
        <Canvas
          shadows
          camera={{ position: [0, 0.5, 6.5], fov: 42 }}
        >
          <ambientLight intensity={theme === 'light' ? 0.6 : 0.25} />
          
          <directionalLight 
            position={[0, 8, 4]} 
            intensity={theme === 'light' ? 1.8 : 1.2} 
            castShadow 
            shadow-mapSize={[1024, 1024]} 
          />
          
          {/* Spotlight for front-and-center box highlight */}
          <spotLight 
            position={[0, 4, 5.5]} 
            angle={0.45} 
            penumbra={1} 
            intensity={theme === 'light' ? 3.5 : 2.8} 
            color={theme === 'light' ? '#B8860B' : '#FFF8F0'} 
            castShadow 
          />
          
          {/* Fog to fade distant boxes into atmosphere */}
          <fog attach="fog" args={[theme === 'light' ? '#F8F4EE' : '#0A0A0A', 4.8, 8.5]} />

          <CarouselRing 
            products={showcaseProducts} 
            textures={textures}
            scrollProgress={scrollProgress}
            manualAngleOffset={manualAngleOffset}
            activeIdx={activeIdx}
            setActiveIdx={setActiveIdx}
            theme={theme}
          />
        </Canvas>
      </div>

      {/* Floating Active Product Typography Overlay */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-center pointer-events-auto z-20 select-none w-full max-w-sm px-6">
        <div 
          className="border border-brand-gold/15 rounded-3xl p-5 backdrop-blur-xl shadow-2xl space-y-2 relative overflow-hidden transition-all duration-500"
          style={{
            backgroundColor: theme === 'light' ? 'rgba(240, 234, 224, 0.75)' : 'rgba(18, 18, 18, 0.75)'
          }}
        >
          {activeProduct.is_new === 1 && (
            <span className="absolute top-3 right-3 text-[7px] bg-red-700 text-white font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse border border-brand-gold/20">
              New
            </span>
          )}
          
          <span className="text-[8px] text-[var(--text-muted)] uppercase tracking-[0.25em] font-extrabold block">
            {activeProduct.category}
          </span>
          
          <h2 className="text-lg md:text-2xl font-serif font-bold text-[var(--text-color)] tracking-widest uppercase transition-all duration-300 line-clamp-1">
            {activeProduct.name}
          </h2>
          
          <div className="flex items-center justify-center gap-3.5 text-[11px] font-serif pt-1.5">
            <span className="text-[var(--text-muted)] font-bold tracking-widest">${activeProduct.price.toFixed(2)}</span>
            <span className="text-brand-gold opacity-50">|</span>
            <button 
              onClick={handleInspectProduct}
              className="text-brand-gold hover:text-brand-goldLight font-extrabold uppercase tracking-widest transition-colors cursor-pointer flex items-center gap-1.5"
            >
              Inspect details <ArrowRight size={10} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 3D Carousel Ring Group Component
const CarouselRing: React.FC<{
  products: Product[];
  textures: Record<number, THREE.Texture>;
  scrollProgress: number;
  manualAngleOffset: number;
  activeIdx: number;
  setActiveIdx: (idx: number) => void;
  theme: string;
}> = ({ products, textures, scrollProgress, manualAngleOffset, activeIdx, setActiveIdx, theme }) => {
  const groupRef = useRef<THREE.Group>(null);
  const N = products.length;

  const lastProgress = useRef(scrollProgress);
  const currentAngle = useRef(0);
  const lastScrollTime = useRef(0);

  useFrame(() => {
    if (!groupRef.current) return;
    
    const now = performance.now();
    const delta = scrollProgress - lastProgress.current;
    lastProgress.current = scrollProgress;

    // Track user active scroll state
    if (Math.abs(delta) > 0.0001) {
      lastScrollTime.current = now;
      // Slower rotation scaling factor (controlled rotation)
      currentAngle.current += delta * Math.PI * 1.5;
    } else if (now - lastScrollTime.current > 1800) {
      // Inactive auto-rotation: slowly rotate the ring
      currentAngle.current += 0.0018; // ~0.1 radians per second
    }

    const targetRotation = currentAngle.current + manualAngleOffset;

    // Premium physical product display damped rotation (Lerp factor = 0.035 for extra momentum/inertia)
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotation, 0.035);

    // Identify active index closest to front (Z axis positive/front direction)
    let closestIdx = 0;
    let minDistance = Infinity;

    groupRef.current.children.forEach((child, idx) => {
      const worldPos = new THREE.Vector3();
      child.getWorldPosition(worldPos);
      
      // Distance to camera front coordinate [0, 0.5, 6.5]
      const dist = worldPos.distanceTo(new THREE.Vector3(0, 0.5, 6.5));
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = idx;
      }
    });

    if (closestIdx !== activeIdx) {
      setActiveIdx(closestIdx);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.1, -1]}>
      {products.map((product, idx) => {
        const theta = idx * (Math.PI * 2 / N);
        const radius = 3.6; // radius of orbit path
        const x = radius * Math.sin(theta);
        const z = radius * Math.cos(theta);

        const isActive = activeIdx === idx;
        const tex = textures[product.id];

        return (
          <BoxMesh 
            key={product.id} 
            position={[x, 0, z]} 
            isActive={isActive} 
            texture={tex}
            theme={theme}
          />
        );
      })}
    </group>
  );
};

// individual 3D Chocolate Box Mesh component
const BoxMesh: React.FC<{
  position: [number, number, number];
  isActive: boolean;
  texture?: THREE.Texture;
  theme: string;
}> = ({ position, isActive, texture, theme }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    // Always face the camera plane for clean labels rendering
    meshRef.current.lookAt(0, 0.5, 6.5);

    // Staggered size adjustment for orbital depth perception
    const targetScale = isActive ? 1.05 : 0.62;
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.08);
  });

  // Base materials specs
  const boxColor = "#1D0D0E"; // Deep cocoa body
  const goldColor = theme === 'light' ? "#B8860B" : "#C9A84C"; // Gold trims

  return (
    <mesh ref={meshRef} position={position} castShadow receiveShadow>
      <boxGeometry args={[1.0, 1.45, 0.11]} />
      {/* Box face materials mapping in order: Right, Left, Top, Bottom, Front, Back */}
      <meshStandardMaterial attach="material-0" color={boxColor} roughness={0.65} metalness={0.7} />
      <meshStandardMaterial attach="material-1" color={boxColor} roughness={0.65} metalness={0.7} />
      <meshStandardMaterial attach="material-2" color={goldColor} roughness={0.15} metalness={0.9} />
      <meshStandardMaterial attach="material-3" color={goldColor} roughness={0.15} metalness={0.9} />
      {texture ? (
        <meshStandardMaterial attach="material-4" map={texture} roughness={0.35} metalness={0.1} />
      ) : (
        <meshStandardMaterial attach="material-4" color={boxColor} roughness={0.5} metalness={0.3} />
      )}
      <meshStandardMaterial attach="material-5" color={boxColor} roughness={0.65} metalness={0.7} />
    </mesh>
  );
};

export default CircularShowcase;
