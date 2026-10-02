import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import DashboardMockup from './DashboardMockup';

gsap.registerPlugin(ScrollTrigger);

export default function LandingDashboard() {
  const sectionRef = useRef(null);
  const mockupWrapRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Scale and un-tilt the dashboard as it scrolls into view
      gsap.fromTo(
        mockupWrapRef.current,
        {
          scale: 0.8,
          rotateX: 15,
          y: 60,
          opacity: 0,
        },
        {
          scale: 1,
          rotateX: 0,
          y: 0,
          opacity: 1,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 85%',
            end: 'top 30%',
            scrub: 1,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} style={{ padding: '100px 20px', position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 14px',
          borderRadius: '999px',
          background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.25)',
          fontSize: '10px',
          color: '#10b981',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: '24px',
        }}>
          Interactive Dashboard
        </div>
        <h2 style={{
          fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
          fontWeight: 900,
          color: 'white',
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
          marginBottom: '64px',
        }}>
          Everything You Need. <span style={{ color: '#10b981' }}>Nothing You Don't.</span>
        </h2>
        
        {/* Perspective Dashboard Mockup */}
        <div
          ref={mockupWrapRef}
          style={{
            width: '100%',
            transformStyle: 'preserve-3d',
            perspective: '1200px',
            perspectiveOrigin: '50% 40%',
            willChange: 'transform',
          }}
        >
          {/* Glow behind mockup */}
          <div style={{
            position: 'absolute',
            inset: '-20px',
            background: 'radial-gradient(ellipse at 50% 100%, rgba(16,185,129,0.15) 0%, transparent 70%)',
            filter: 'blur(40px)',
            zIndex: 0,
            borderRadius: '24px',
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <DashboardMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
