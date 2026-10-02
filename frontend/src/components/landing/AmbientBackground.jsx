// src/components/landing/AmbientBackground.jsx
import { useEffect, useRef } from 'react';

export default function AmbientBackground() {
  const blob1 = useRef(null);
  const blob2 = useRef(null);
  const blob3 = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      if (blob1.current) {
        blob1.current.style.transform = `translate(-50%, calc(-50% + ${y * 0.15}px))`;
      }
      if (blob2.current) {
        blob2.current.style.transform = `translate(-30%, calc(-40% - ${y * 0.08}px))`;
      }
      if (blob3.current) {
        blob3.current.style.transform = `translate(-70%, calc(-60% + ${y * 0.05}px))`;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {/* Cyan primary glow */}
      <div
        ref={blob1}
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          width: '800px',
          height: '600px',
          background:
            'radial-gradient(ellipse at center, rgba(34,211,238,0.18) 0%, transparent 70%)',
          filter: 'blur(60px)',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          animation: 'blobDrift1 18s ease-in-out infinite alternate',
        }}
      />
      {/* Deep purple glow */}
      <div
        ref={blob2}
        style={{
          position: 'absolute',
          top: '60%',
          left: '20%',
          width: '700px',
          height: '500px',
          background:
            'radial-gradient(ellipse at center, rgba(124,58,237,0.15) 0%, transparent 70%)',
          filter: 'blur(80px)',
          borderRadius: '50%',
          transform: 'translate(-30%, -40%)',
          animation: 'blobDrift2 22s ease-in-out infinite alternate',
        }}
      />
      {/* Blue accent glow */}
      <div
        ref={blob3}
        style={{
          position: 'absolute',
          top: '40%',
          left: '80%',
          width: '600px',
          height: '400px',
          background:
            'radial-gradient(ellipse at center, rgba(47,141,244,0.12) 0%, transparent 70%)',
          filter: 'blur(70px)',
          borderRadius: '50%',
          transform: 'translate(-70%, -60%)',
          animation: 'blobDrift3 26s ease-in-out infinite alternate',
        }}
      />
    </div>
  );
}
