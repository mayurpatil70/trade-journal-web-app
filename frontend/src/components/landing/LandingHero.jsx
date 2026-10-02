// src/components/landing/LandingHero.jsx
// The main scrollytelling hero section
// Uses GSAP ScrollTrigger + Lenis for cinematic scroll-pinning

import { useRef, useEffect, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { ArrowRight, MessageSquare, Zap, ShieldCheck, Brain, TrendingUp, Calculator } from 'lucide-react';
import DashboardMockup from './DashboardMockup';

gsap.registerPlugin(ScrollTrigger);

// Lazy load Three.js scene only on desktop
const CandlestickScene = lazy(() => import('./CandlestickScene'));

// "What you get" hint chips shown in hero
const TRADER_HINTS = [
  { icon: Brain, label: 'AI Stops Revenge Trades', color: '#ec4899', bg: 'rgba(236,72,153,0.1)', border: 'rgba(236,72,153,0.25)' },
  { icon: ShieldCheck, label: 'Prop Firm Drawdown Auto-Tracked', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
  { icon: Calculator, label: 'Instant Lot Size Sizing', color: '#2f8df4', bg: 'rgba(47,141,244,0.1)', border: 'rgba(47,141,244,0.25)' },
  { icon: TrendingUp, label: 'R-Multiple Analytics Engine', color: '#22d3ee', bg: 'rgba(34,211,238,0.1)', border: 'rgba(34,211,238,0.25)' },
];

export default function LandingHero() {
  const pinContainerRef = useRef(null);
  const stickyRef = useRef(null);
  const textRef = useRef(null);
  const mockupWrapRef = useRef(null);
  const canvasRef = useRef(null);
  const scrollProgress = useRef(0);
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pinContainerRef.current,
          start: 'top top',
          end: '+=180%',
          pin: stickyRef.current,
          scrub: 1.4,
          onUpdate: (self) => {
            scrollProgress.current = self.progress;
          },
        },
      });

      // Text block fades out
      tl.to(textRef.current, {
        opacity: 0,
        y: -50,
        duration: 0.4,
      }, 0);

      // 3D canvas fades left
      if (canvasRef.current) {
        tl.to(canvasRef.current, {
          x: -60,
          opacity: 0,
          duration: 0.4,
        }, 0);
      }

      // Dashboard mockup scales up from perspective-tilted state to full flat
      tl.fromTo(
        mockupWrapRef.current,
        {
          scale: 0.58,
          rotateX: 18,
          y: 60,
          opacity: 0.6,
        },
        {
          scale: 1,
          rotateX: 0,
          y: 0,
          opacity: 1,
          duration: 1,
          ease: 'power2.out',
        },
        0
      );
    }, pinContainerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={pinContainerRef} style={{ height: '280vh', position: 'relative' }}>
      <div
        ref={stickyRef}
        className="flex flex-col items-center justify-start md:justify-center pt-24 md:pt-0 px-5"
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Text + 3D Row */}
        <div
          ref={textRef}
          className="flex flex-col md:flex-row items-center justify-center"
          style={{
            width: '100%',
            maxWidth: '1100px',
            gap: '40px',
            marginBottom: '40px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* 3D Candlestick */}
          <div
            ref={canvasRef}
            className="order-2 md:order-1"
            style={{ width: '220px', height: '200px', flexShrink: 0 }}
          >
            <Suspense fallback={<div style={{ width: '100%', height: '100%' }} />}>
              <CandlestickScene scrollProgress={scrollProgress} />
            </Suspense>
          </div>

          {/* Hero Text */}
          <div className="order-1 md:order-2 text-center md:text-left" style={{ maxWidth: '600px' }}>
            {/* Live badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 600,
              marginBottom: '20px',
              letterSpacing: '0.02em',
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              Built for Funded & Prop Firm Traders
            </div>

            <h1 style={{
              fontSize: 'clamp(2rem, 5vw, 3.8rem)',
              fontWeight: 900,
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
              color: 'white',
              marginBottom: '16px',
            }}>
              Stop Bleeding Capital<br />
              <span style={{
                background: 'linear-gradient(135deg, #2f8df4 0%, #22d3ee 50%, #10b981 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                to Emotional Mistakes.
              </span>
            </h1>

            <p style={{
              fontSize: 'clamp(13px, 1.5vw, 15px)',
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.7,
              marginBottom: '24px',
              maxWidth: '480px',
            }}>
              The only trading journal that pairs your chart setups with an <strong style={{ color: 'rgba(255,255,255,0.75)' }}>AI psychology guard</strong>, <strong style={{ color: 'rgba(255,255,255,0.75)' }}>prop firm rule tracking</strong>, and <strong style={{ color: 'rgba(255,255,255,0.75)' }}>automated R-multiple analytics</strong> — all for a one-time $11 USDT.
            </p>

            {/* Trader Hint Chips */}
            <div className="flex flex-wrap justify-center md:justify-start" style={{ gap: '8px', marginBottom: '28px' }}>
              {TRADER_HINTS.map(({ icon: Icon, label, color, bg, border }) => (
                <div key={label} style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  background: bg,
                  border: `1px solid ${border}`,
                  fontSize: '11px',
                  color: color,
                  fontWeight: 600,
                  letterSpacing: '0.01em',
                }}>
                  <Icon size={11} />
                  {label}
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center md:justify-start" style={{ gap: '12px' }}>
              <Link
                to="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '13px 28px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #2f8df4, #1d6fd8)',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 8px 32px rgba(47,141,244,0.4), 0 0 0 1px rgba(47,141,244,0.3)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  letterSpacing: '0.01em',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(47,141,244,0.5), 0 0 0 1px rgba(47,141,244,0.4)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(47,141,244,0.4), 0 0 0 1px rgba(47,141,244,0.3)';
                }}
              >
                <Zap size={14} />
                Unlock Lifetime Access — $11 USDT
                <ArrowRight size={14} />
              </Link>
              <a
                href="https://discord.gg/Ajaw3AjfWE"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '13px 22px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'background 0.2s, color 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                }}
              >
                <MessageSquare size={14} color="#5865F2" />
                Join Trader Discord
              </a>
            </div>
          </div>
        </div>

        {/* Perspective Dashboard Mockup */}
        <div
          ref={mockupWrapRef}
          style={{
            width: '100%',
            maxWidth: '900px',
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
            background: 'radial-gradient(ellipse at 50% 100%, rgba(47,141,244,0.2) 0%, transparent 70%)',
            filter: 'blur(30px)',
            zIndex: 0,
            borderRadius: '24px',
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <DashboardMockup />
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{
          position: 'absolute',
          bottom: '32px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          opacity: 0.4,
          animation: 'scrollBounce 2s ease-in-out infinite',
        }}>
          <span style={{ fontSize: '9px', color: 'white', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600 }}>Scroll to explore</span>
          <div style={{ width: 1, height: 28, background: 'linear-gradient(to bottom, white, transparent)' }} />
        </div>
      </div>
    </div>
  );
}
