import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, ContactShadows, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface ModelProps {
  color?: string;
  progress?: number; // 0 to 1
}

// Procedural 3D Exploded Chocolate Model
const ChocolateModel: React.FC<ModelProps> = ({ color = '#2E1911', progress = 0 }) => {
  const groupRef = useRef<THREE.Group | null>(null);

  // Dynamic animation values based on scroll progress phases
  let boxY = 0;
  let wrapperY = 0;
  let wrapperOpacity = 1;
  const baseScale = 1;
  let explodeFactor = 0;
  let ingredientsOpacity = 0;
  let ingredientsYOffset = 0;

  // Phase mapping (0.0 to 1.0)
  if (progress >= 0.2 && progress < 0.4) {
    // 1. Explosion Phase (0.2 -> 0.4)
    const factor = (progress - 0.2) / 0.2; // 0 to 1
    boxY = factor * 2.8;
    wrapperY = -factor * 1.5;
    wrapperOpacity = 1 - factor * 0.3;
    explodeFactor = factor;
  } else if (progress >= 0.4 && progress <= 0.7) {
    // 2. Technical View Phase (0.4 -> 0.7)
    boxY = 2.8;
    wrapperY = -1.5;
    wrapperOpacity = 0.7;
    explodeFactor = 1;
    
    // Ingredients fade in
    if (progress >= 0.45) {
      ingredientsOpacity = Math.min(1, (progress - 0.45) / 0.15); // fade in over 15% progress
    } else {
      ingredientsOpacity = 0;
    }
  } else if (progress > 0.7 && progress < 0.85) {
    // 3. Reassembly Phase (0.7 -> 0.85)
    const factor = 1 - (progress - 0.7) / 0.15; // 1 to 0
    boxY = factor * 2.8;
    wrapperY = -factor * 1.5;
    wrapperOpacity = 0.7 + (1 - factor) * 0.3;
    explodeFactor = factor;
    ingredientsOpacity = factor;
  } else if (progress >= 0.85) {
    // 4. Fully Reassembled (0.85 -> 1.0)
    boxY = 0;
    wrapperY = 0;
    wrapperOpacity = 1;
    explodeFactor = 0;
    ingredientsOpacity = 0;
  }

  // Smooth floating tilt/rotation
  useFrame((state) => {
    if (groupRef.current) {
      // Base continuous rotation combined with scroll-driven rotation
      const time = state.clock.getElapsedTime();
      groupRef.current.rotation.y = time * 0.15 + progress * Math.PI * 2;
      groupRef.current.rotation.x = Math.sin(time * 0.5) * 0.1;
      
      // Floating animation for ingredients in exploded phase
      ingredientsYOffset = Math.sin(time * 1.5) * 0.15;
    }
  });

  const boxMaterial = new THREE.MeshStandardMaterial({
    color: '#1E0B0D', // Dark luxury maroon
    roughness: 0.4,
    metalness: 0.1,
    bumpScale: 0.05
  });

  const goldMaterial = new THREE.MeshStandardMaterial({
    color: '#D4AF37', // Gold wrapper
    roughness: 0.22,
    metalness: 0.95,
    transparent: true,
    opacity: wrapperOpacity
  });

  const chocolateMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: 0.35,
    metalness: 0.06
  });

  const beanMaterial = new THREE.MeshStandardMaterial({
    color: '#42281D', // Cocoa bean dark brown
    roughness: 0.6,
    metalness: 0.05,
    transparent: true,
    opacity: ingredientsOpacity
  });

  // Segments layout (3 cols x 5 rows)
  const cols = 3;
  const rows = 5;
  const pieces: React.ReactNode[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const baseX = (c - (cols - 1) / 2) * 0.65;
      const baseZ = (r - (rows - 1) / 2) * 0.75;
      
      // Separate pieces outwards during explosion
      const pX = baseX + (baseX * 0.45 * explodeFactor);
      const pZ = baseZ + (baseZ * 0.45 * explodeFactor);
      const pY = 0.1 + ((r + c) * 0.07 * explodeFactor); // staggered vertical explosion

      pieces.push(
        <mesh 
          key={`${r}-${c}`} 
          position={[pX, pY, pZ]}
          material={chocolateMaterial}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.55, 0.15, 0.65]} />
        </mesh>
      );
    }
  }

  return (
    <group ref={groupRef} dispose={null} scale={[baseScale, baseScale, baseScale]}>
      {/* 1. Base Chocolate Plate (with staggered explosion) */}
      <mesh 
        material={chocolateMaterial} 
        castShadow 
        receiveShadow 
        position={[0, -0.05 + (-0.1 * explodeFactor), 0]}
      >
        <boxGeometry args={[2.2, 0.18, 4.0]} />
      </mesh>
      
      {/* 2. Grid of Individual Chocolate Squares */}
      {pieces}

      {/* 3. Gold Foil Wrapper (translates down) */}
      <group position={[0, wrapperY, 0]}>
        <mesh material={goldMaterial} castShadow>
          <boxGeometry args={[2.3, 0.25, 4.1]} />
        </mesh>
      </group>

      {/* 4. Luxury Box Lid Cover (translates up) */}
      <group position={[0, boxY, 0]}>
        <mesh material={boxMaterial} castShadow>
          <boxGeometry args={[2.45, 0.4, 4.25]} />
        </mesh>
        {/* Gold Accent Strip on the Box lid */}
        <mesh position={[0, 0.21, 0]} material={goldMaterial}>
          <boxGeometry args={[0.4, 0.01, 4.26]} />
        </mesh>
      </group>

      {/* 5. Floating Ingredients (Cocoa Beans) - visible during explosion */}
      {ingredientsOpacity > 0 && (
        <group position={[0, ingredientsYOffset, 0]}>
          <mesh position={[-2.0, 0.5, -1.5]} material={beanMaterial} scale={[0.3, 0.45, 0.3]}>
            <sphereGeometry />
          </mesh>
          <mesh position={[2.0, -0.5, 1.2]} material={beanMaterial} scale={[0.25, 0.4, 0.25]}>
            <sphereGeometry />
          </mesh>
          <mesh position={[-1.8, -1.0, 1.5]} material={beanMaterial} scale={[0.35, 0.5, 0.35]}>
            <sphereGeometry />
          </mesh>
          <mesh position={[2.2, 0.8, -1.0]} material={beanMaterial} scale={[0.28, 0.42, 0.28]}>
            <sphereGeometry />
          </mesh>
        </group>
      )}
    </group>
  );
};

interface ThreeDChocolateProps {
  type?: 'dark' | 'milk' | 'white' | 'raspberry' | 'custom';
  progress?: number;
  interactive?: boolean;
}

export const ThreeDChocolate: React.FC<ThreeDChocolateProps> = ({ type = 'dark', progress = 0, interactive = true }) => {
  const colorMap = {
    dark: '#2E1911',
    milk: '#5C3E2F',
    white: '#E5DFCD',
    raspberry: '#4A0E17',
    custom: '#D4AF37'
  };

  const selectedColor = colorMap[type] || colorMap.dark;

  return (
    <div className="w-full h-full min-h-[400px] md:min-h-[500px] relative select-none">
      <Canvas
        shadows
        camera={{ position: [0, 5, 7.5], fov: 42 }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
      >
        <color attach="background" args={['#0d0506']} />
        
        {/* Soft Ambient lighting */}
        <ambientLight intensity={0.45} />
        
        {/* Luxury Gold and White spot studios */}
        <directionalLight 
          position={[6, 12, 4]} 
          intensity={1.3} 
          castShadow 
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[-6, 6, -4]} intensity={0.65} color="#D4AF37" />
        <pointLight position={[0, -2, 6]} intensity={0.7} color="#FFFFFF" />

        <Float
          speed={1.5} 
          rotationIntensity={0.15} 
          floatIntensity={0.4}
        >
          <ChocolateModel color={selectedColor} progress={progress} />
        </Float>

        <ContactShadows 
          position={[0, -2.6, 0]} 
          opacity={0.65} 
          scale={8} 
          blur={2.8} 
          far={5} 
        />

        {interactive && (
          <OrbitControls 
            enableZoom={false} 
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.8}
          />
        )}
      </Canvas>
    </div>
  );
};

export default ThreeDChocolate;
