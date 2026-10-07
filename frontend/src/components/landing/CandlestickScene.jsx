// src/components/landing/CandlestickScene.jsx
// React Three Fiber 3D rotating candlestick chart
// Scroll-position linked tilt via GSAP

import { useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

const candleData = [
  { bull: true,  h: 0.9, body: 0.5, y: -0.8 },
  { bull: false, h: 0.7, body: 0.4, y: -0.6 },
  { bull: true,  h: 1.1, body: 0.65, y: -0.3 },
  { bull: true,  h: 0.8, body: 0.45, y: -0.55 },
  { bull: false, h: 1.0, body: 0.55, y: -0.45 },
  { bull: true,  h: 1.3, body: 0.75, y: -0.15 },
  { bull: false, h: 0.9, body: 0.5, y: -0.35 },
  { bull: true,  h: 1.5, body: 0.85, y: 0.0 },
  { bull: true,  h: 1.2, body: 0.7, y: 0.1 },
  { bull: false, h: 1.0, body: 0.6, y: -0.1 },
  { bull: true,  h: 1.6, body: 0.9, y: 0.2 },
];

function Candle({ position, bull, bodyHeight, wickHeight, scrollProgress }) {
  const bodyRef = useRef();
  const wickRef = useRef();

  const bullColor = new THREE.Color('#10b981');
  const bearColor = new THREE.Color('#ef4444');
  const color = bull ? bullColor : bearColor;

  useFrame((state) => {
    if (bodyRef.current) {
      bodyRef.current.material.emissiveIntensity =
        0.3 + Math.sin(state.clock.elapsedTime * 1.5 + position[0]) * 0.15;
    }
  });

  return (
    <group position={position}>
      {/* Wick */}
      <mesh ref={wickRef} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.015, wickHeight, 6]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} transparent opacity={0.7} />
      </mesh>
      {/* Body */}
      <mesh ref={bodyRef} position={[0, 0, 0]}>
        <boxGeometry args={[0.18, bodyHeight, 0.18]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          transparent
          opacity={0.9}
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>
    </group>
  );
}

function GlowSphere({ position, color }) {
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.8}>
      <mesh position={position}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <MeshDistortMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.5}
          distort={0.4}
          speed={3}
          transparent
          opacity={0.6}
        />
      </mesh>
    </Float>
  );
}

function CandlestickGroup({ scrollProgress }) {
  const groupRef = useRef();
  const spacing = 0.35;
  const totalW = candleData.length * spacing;

  useFrame((state) => {
    if (!groupRef.current) return;
    // Slow auto-rotation
    groupRef.current.rotation.y += 0.003;
    // Subtle bob
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.05;
    // Scroll-linked tilt
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      scrollProgress.current * -0.4,
      0.05
    );
  });

  return (
    <group ref={groupRef}>
      {candleData.map((c, i) => (
        <Candle
          key={i}
          position={[i * spacing - totalW / 2, c.y, 0]}
          bull={c.bull}
          bodyHeight={c.body}
          wickHeight={c.h}
          scrollProgress={scrollProgress}
        />
      ))}
      {/* Ambient glow spheres */}
      <GlowSphere position={[-1.5, 0.8, -0.5]} color="#059669" />
      <GlowSphere position={[1.8, -0.5, -0.3]} color="#7c3aed" />
      <GlowSphere position={[0, 1.2, -0.8]} color="#10b981" />
    </group>
  );
}

export default function CandlestickScene({ scrollProgress }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 4], fov: 45 }}
      style={{ background: 'transparent' }}
      gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
      dpr={[1, 1.5]}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={1.2} color="#059669" />
        <pointLight position={[-5, -3, 3]} intensity={0.8} color="#7c3aed" />
        <pointLight position={[0, 8, 2]} intensity={0.6} color="#10b981" />
        <CandlestickGroup scrollProgress={scrollProgress} />
      </Suspense>
    </Canvas>
  );
}
