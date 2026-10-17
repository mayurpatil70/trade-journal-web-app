// frontend/src/components/landing/MakoSharkSection.jsx
// Section 01 Hero: Mako Shark 10-Year Historical Replay & AI Psychology Coach
// Full SEO text preserved 100% from forexnotes.in & previous hero.
// Fixed frosted chrome navigation, full-screen ocean hero, 4 market sessions, dive log & scrollytelling ascent bridge.

import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, Shield, Zap } from 'lucide-react';
import LandingNavbar from './LandingNavbar';
import IridescentButton from './IridescentButton';

const SHARK_VIDEO_URL = 'https://thinkingods.com/demos/mako-hero/hero.mp4';
const THUMB_EYE = 'https://thinkingods.com/demos/mako-hero/thumb-eye.jpg';
const THUMB_JAW = 'https://thinkingods.com/demos/mako-hero/thumb-jaw.jpg';
const THUMB_TAIL = 'https://thinkingods.com/demos/mako-hero/thumb-tail.jpg';

// The apex strike moment (in seconds)
export const REVEAL_AT = 5.0;

export default function MakoSharkSection() {
  const sectionRef = useRef(null);
  const videoRef = useRef(null);
  const depthMarkerRef = useRef(null);
  const depthReadoutRef = useRef(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isBite, setIsBite] = useState(false);
  const [lockedDepth, setLockedDepth] = useState(false);

  // Smooth scroll helper
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Immediate reveal for hero copy on mount so visitors see the value prop instantly
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsRevealed(true);
    }, 280);
    return () => clearTimeout(timer);
  }, []);

  // Autoplay video on load with fallback on first interaction
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const playVideo = () => {
      const p = video.play();
      if (p !== undefined) {
        p.catch(() => {
          const onFirstGesture = () => {
            video.play().catch(() => {});
            window.removeEventListener('pointerdown', onFirstGesture);
            window.removeEventListener('scroll', onFirstGesture);
          };
          window.addEventListener('pointerdown', onFirstGesture, { once: true });
          window.addEventListener('scroll', onFirstGesture, { once: true, passive: true });
        });
      }
    };

    playVideo();
  }, []);

  // IntersectionObserver to pause video when user scrolls far away
  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.05 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // Initialize theme tokens on mount without GPU pipeline readback stalls
  useEffect(() => {
    document.documentElement.style.setProperty('--mako-bg', '#071A33');
    document.documentElement.style.setProperty('--mako-ghost', '#102745');
  }, []);

  // Depth meter and apex strike choreography
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let triggerBiteTimeout = null;

    const triggerBite = () => {
      if (lockedDepth) return;
      setLockedDepth(true);
      setIsBite(true);
      if (depthMarkerRef.current) depthMarkerRef.current.style.top = '100%';
      if (depthReadoutRef.current) depthReadoutRef.current.textContent = '200m';

      triggerBiteTimeout = setTimeout(() => {
        setIsBite(false);
      }, 700);
    };

    const handleTimeUpdate = () => {
      const t = video.currentTime;
      const progress = Math.min(t / REVEAL_AT, 1);
      const d = Math.round(progress * 200);

      if (depthMarkerRef.current && !lockedDepth) {
        depthMarkerRef.current.style.top = `${progress * 100}%`;
      }
      if (depthReadoutRef.current && !lockedDepth) {
        depthReadoutRef.current.textContent = `${String(d).padStart(3, '0')}m`;
      }

      if (t >= REVEAL_AT && !lockedDepth) {
        triggerBite();
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', triggerBite);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', triggerBite);
      if (triggerBiteTimeout) clearTimeout(triggerBiteTimeout);
    };
  }, [lockedDepth]);

  return (
    <section
      ref={sectionRef}
      id="mako-section"
      className="mako-root"
      style={{
        position: 'relative',
        background: '#040E1E',
        color: '#EDEAE3',
        overflow: 'hidden',
        fontFamily: "'Manrope', sans-serif",
      }}
    >
      {/* ── Scoped Responsive & Styling Rules for Kingfisher Theme Harmony ── */}
      <style>{`
        @media (max-width: 768px) {
          .mako-hero-container {
            min-height: 100svh !important;
            height: auto !important;
            min-height: 780px !important;
            padding-top: 66px !important;
            padding-bottom: 14px !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            overflow: hidden !important;
          }
          .mako-hero-video {
            object-position: center 48% !important;
          }
          .mako-copy-container {
            position: relative !important;
            top: auto !important;
            left: auto !important;
            transform: none !important;
            max-width: 100% !important;
            padding: 0 16px !important;
            margin-bottom: 0 !important;
            z-index: 10 !important;
          }
          .mako-copy-container h1 {
            font-size: clamp(24px, 6.8vw, 34px) !important;
            line-height: 1.06 !important;
            margin-bottom: 8px !important;
          }
          .mako-copy-container p {
            font-size: 12.5px !important;
            line-height: 1.48 !important;
            margin-bottom: 12px !important;
            max-width: 100% !important;
          }
          .mako-copy-cta-row {
            margin-bottom: 10px !important;
            gap: 8px !important;
          }
          .mako-copy-cta-row a, .mako-copy-cta-row button {
            padding: 9px 18px !important;
            height: 40px !important;
            font-size: 11.5px !important;
          }
          .mako-copy-trust-row {
            font-size: 9px !important;
            gap: 6px !important;
          }
          .mako-hero-dock {
            position: relative !important;
            bottom: auto !important;
            left: auto !important;
            right: auto !important;
            transform: none !important;
            margin-top: auto !important;
            margin-bottom: 6px !important;
            margin-left: 12px !important;
            margin-right: 12px !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 6px !important;
            padding: 8px !important;
            background: rgba(7, 24, 46, 0.78) !important;
            backdrop-filter: blur(24px) saturate(1.4) !important;
            -webkit-backdrop-filter: blur(24px) saturate(1.4) !important;
            border-radius: 16px !important;
            border: 1px solid rgba(237, 234, 227, 0.12) !important;
            z-index: 10 !important;
          }
          .mako-dock-cell {
            padding: 6px 8px !important;
            border-right: none !important;
            gap: 8px !important;
            background: rgba(255, 255, 255, 0.035) !important;
            border-radius: 10px !important;
          }
          .mako-dock-cell img {
            width: 30px !important;
            height: 30px !important;
            border-radius: 8px !important;
          }
          .mako-dock-cell .dock-title {
            font-size: 13.5px !important;
            line-height: 1.15 !important;
          }
          .mako-giant-word {
            font-size: 18vw !important;
            top: 7vh !important;
          }
          .ascent-bridge-container {
            min-height: 100svh !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            padding: 72px 16px 36px !important;
            gap: 24px !important;
          }
          .ascent-bridge-container h2 {
            font-size: clamp(28px, 7vw, 40px) !important;
            line-height: 1.08 !important;
          }
          .ascent-stats-band {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
            padding: 12px 14px !important;
          }
        }
      `}</style>

      {/* ── UNIFIED SLEEK COMPACT TOP NAVIGATION ── */}
      <LandingNavbar isFixed={true} />

      {/* ── 01 HERO VIEWPORT (100vh Full Screen, min-height 760px) ── */}
      <div
        id="mako-hero"
        className={`mako-hero mako-hero-container ${isRevealed ? 'is-revealed' : ''} ${isBite ? 'bite' : ''}`}
        style={{
          position: 'relative',
          width: '100%',
          height: '100vh',
          minHeight: '760px',
          overflow: 'hidden',
          isolation: 'isolate',
          background: 'var(--mako-bg, #071A33)',
        }}
      >
        {/* Giant word BEHIND the shark using mix-blend-mode: lighten */}
        <div
          className="mako-giant-word"
          style={{
            position: 'absolute',
            top: '8vh',
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 'clamp(120px, 25vw, 440px)',
            lineHeight: 0.8,
            fontWeight: 400,
            color: 'var(--mako-ghost, #102745)',
            mixBlendMode: 'lighten',
            WebkitMaskImage: 'linear-gradient(180deg, #000 0%, #000 40%, rgba(0,0,0,0.3) 66%, transparent 88%)',
            maskImage: 'linear-gradient(180deg, #000 0%, #000 40%, rgba(0,0,0,0.3) 66%, transparent 88%)',
            pointerEvents: 'none',
            zIndex: 1,
            userSelect: 'none',
            letterSpacing: isRevealed ? '-0.01em' : '0.02em',
            opacity: 1,
            transition: 'letter-spacing 2.6s cubic-bezier(0.2, 0.7, 0.1, 1)',
          }}
        >
          FOREX
        </div>

        {/* Video of Mako Shark Swimming Out of Deep Blue */}
        <video
          ref={videoRef}
          className="mako-hero-video"
          src={SHARK_VIDEO_URL}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          controlsList="nodownload noplaybackrate"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 2,
            pointerEvents: 'none',
            transform: 'translateZ(0)',
            WebkitTransform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            willChange: 'transform',
          }}
        />

        {/* Legibility Overlays & Oceanic Scrim */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `
              linear-gradient(180deg, rgba(7,26,51,0.88) 0%, rgba(7,26,51,0.5) 20%, transparent 45%),
              linear-gradient(90deg, rgba(7,26,51,0.85) 0%, rgba(7,26,51,0.5) 34%, transparent 55%),
              linear-gradient(0deg, rgba(4,14,30,0.92) 0%, transparent 40%)
            `,
            zIndex: 3,
            pointerEvents: 'none',
          }}
        />

        {/* ── Depth Gauge (Left Edge) ── */}
        <div
          className="hidden md:flex mako-gauge"
          style={{
            position: 'absolute',
            left: '28px',
            top: '22vh',
            bottom: '26vh',
            width: '46px',
            zIndex: 10,
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            pointerEvents: 'none',
          }}
        >
          {/* Label DEPTH rotated */}
          <div
            style={{
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.22em',
              color: '#7D8FA6',
              marginBottom: '16px',
            }}
          >
            DEPTH
          </div>

          {/* Vertical Track with Ticks */}
          <div
            style={{
              position: 'relative',
              flex: 1,
              width: '10px',
              background: 'repeating-linear-gradient(180deg, rgba(237,234,227,0.15) 0px, rgba(237,234,227,0.15) 1px, transparent 1px, transparent 12px)',
            }}
          >
            {/* Marker */}
            <div
              ref={depthMarkerRef}
              style={{
                position: 'absolute',
                left: '-3px',
                top: '0%',
                width: '16px',
                height: '2px',
                background: lockedDepth ? '#F0524A' : '#5FD4E8',
                boxShadow: lockedDepth ? '0 0 10px #F0524A' : '0 0 10px #5FD4E8',
                transition: 'background 0.3s ease',
                willChange: 'top',
              }}
            />
          </div>

          {/* Readout e.g. "000m" */}
          <div
            ref={depthReadoutRef}
            style={{
              marginTop: '16px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              fontVariantNumeric: 'tabular-nums',
              fontWeight: 700,
              color: lockedDepth ? '#F0524A' : '#5FD4E8',
              letterSpacing: '0.05em',
            }}
          >
            000m
          </div>
        </div>

        {/* ── Left Hero Copy (Centered Vertically) ── */}
        <div
          className="mako-rv mako-copy-container"
          style={{
            position: 'absolute',
            left: 'clamp(24px, 7vw, 120px)',
            top: '48%',
            maxWidth: 'min(580px, 86vw)',
            zIndex: 10,
            opacity: isRevealed ? 1 : 0,
            transform: isRevealed ? 'translateY(-50%)' : 'translateY(calc(-50% + 24px))',
            filter: isRevealed ? 'blur(0)' : 'blur(6px)',
            transition: 'all 0.9s cubic-bezier(0.2, 0.7, 0.1, 1) 0.18s',
          }}
        >
          {/* Eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <span style={{ width: 32, height: 2, background: '#E8732A' }} />
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.18em',
                color: '#5FD4E8',
                textTransform: 'uppercase',
              }}
            >
              10-YEAR HISTORICAL REPLAY · AI PSYCHOLOGY COACH
            </span>
          </div>

          {/* H1 Display Serif */}
          <h1
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: 'clamp(44px, 5.8vw, 88px)',
              lineHeight: 0.94,
              fontWeight: 400,
              color: '#EDEAE3',
              marginBottom: '18px',
              textShadow: '0 4px 30px rgba(0,0,0,0.65)',
            }}
          >
            Backtest 10 Years of Markets.{' '}
            <span style={{ display: 'block', color: '#EDEAE3' }}>Journal Every Trade.</span>
            <span style={{ fontStyle: 'italic', color: '#5FD4E8' }}>
              Master Your Mind.
            </span>
          </h1>

          {/* 16px SEO Lede */}
          <p
            style={{
              fontSize: '15px',
              lineHeight: 1.65,
              color: 'rgba(237,234,227,0.85)',
              maxWidth: '470px',
              marginBottom: '26px',
              textShadow: '0 2px 14px rgba(0,0,0,0.5)',
            }}
          >
            Forex Notes is a bar replay backtesting platform with 10 years of historical data, a digital trading journal with an AI psychology coach, and prop firm challenge tools in one app. From $14/month.
          </p>

          {/* CTA Buttons */}
          <div className="mako-copy-cta-row" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', marginBottom: '22px' }}>
            <IridescentButton to="/login" size="md">
              START 24H TRIAL
            </IridescentButton>

            <button
              type="button"
              onClick={() => scrollTo('kingfisher-section')}
              style={{
                height: '46px',
                padding: '0 20px',
                borderRadius: '999px',
                background: 'rgba(10,28,52,0.5)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(237,234,227,0.18)',
                color: '#EDEAE3',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(18,44,78,0.7)';
                e.currentTarget.style.borderColor = '#5FD4E8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(10,28,52,0.5)';
                e.currentTarget.style.borderColor = 'rgba(237,234,227,0.18)';
              }}
            >
              <span>EXPLORE PRECISION</span>
              <ArrowDown size={13} color="#5FD4E8" />
            </button>
          </div>

          {/* High-Trust Stat Badge Strip */}
          <div
            className="mako-copy-trust-row"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '12px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              color: 'rgba(237,234,227,0.7)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#5FD4E8' }}>
              ✓ 10Y TICK DATA
            </span>
            <span>·</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#EDEAE3' }}>
              AI RISK GUARD
            </span>
            <span>·</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10B981' }}>
              94% PASS RATE
            </span>
            <span>·</span>
            <span style={{ color: '#F0524A' }}>$14/MO</span>
            <span>·</span>
            <span>3,200+ TRADERS</span>
          </div>
        </div>

        {/* ── Frosted Glass Dock (Along Bottom of Hero Viewport) ── */}
        <div
          className="mako-rv mako-hero-dock"
          style={{
            position: 'absolute',
            bottom: '22px',
            left: 'clamp(20px, 4vw, 60px)',
            right: 'clamp(20px, 4vw, 60px)',
            borderRadius: '20px',
            background: 'rgba(10,28,52,0.55)',
            backdropFilter: 'blur(20px) saturate(1.25)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.25)',
            border: '1px solid rgba(237,234,227,0.14)',
            padding: '10px 14px',
            zIndex: 10,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            opacity: isRevealed ? 1 : 0,
            transform: isRevealed ? 'translateY(0)' : 'translateY(30px)',
            filter: isRevealed ? 'blur(0)' : 'blur(6px)',
            transition: 'all 0.9s cubic-bezier(0.2, 0.7, 0.1, 1) 0.36s',
          }}
        >
          {/* Cell 1: 10Y Replay */}
          <div className="mako-dock-cell" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 8px', borderRight: '1px solid rgba(237,234,227,0.1)' }}>
            <img src={THUMB_JAW} alt="10Y Tick Replay" style={{ width: 48, height: 48, borderRadius: '10px', objectFit: 'cover' }} />
            <div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#5FD4E8', letterSpacing: '0.12em', textTransform: 'uppercase' }}>01 REPLAY</div>
              <div className="dock-title" style={{ fontFamily: "'Instrument Serif', serif", fontSize: '17px', color: '#EDEAE3' }}>Bar Replay Backtester</div>
            </div>
          </div>

          {/* Cell 2: AI Psychology */}
          <div className="mako-dock-cell" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 8px', borderRight: '1px solid rgba(237,234,227,0.1)' }}>
            <img src={THUMB_EYE} alt="AI Psychology" style={{ width: 48, height: 48, borderRadius: '10px', objectFit: 'cover' }} />
            <div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#7D8FA6', letterSpacing: '0.12em', textTransform: 'uppercase' }}>02 PSYCHOLOGY</div>
              <div className="dock-title" style={{ fontFamily: "'Instrument Serif', serif", fontSize: '17px', color: '#EDEAE3' }}>AI Coach isLIVE</div>
            </div>
          </div>

          {/* Cell 3: Prop Firm Guardian */}
          <div className="mako-dock-cell" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 8px', borderRight: '1px solid rgba(237,234,227,0.1)' }}>
            <img src={THUMB_TAIL} alt="Prop Firm Guardian" style={{ width: 48, height: 48, borderRadius: '10px', objectFit: 'cover' }} />
            <div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#7D8FA6', letterSpacing: '0.12em', textTransform: 'uppercase' }}>03 RISK GUARD</div>
              <div className="dock-title" style={{ fontFamily: "'Instrument Serif', serif", fontSize: '17px', color: '#EDEAE3' }}>Prop Firm Guardian</div>
            </div>
          </div>

          {/* Cell 4: Automated Bots & Status */}
          <div className="mako-dock-cell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px' }}>
            <div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#7D8FA6', letterSpacing: '0.14em' }}>04 AUTOMATION</div>
              <div className="dock-title" style={{ fontFamily: "'Instrument Serif', serif", fontSize: '16px', color: '#EDEAE3' }}>Automated Trading Bots</div>
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '999px',
                background: 'rgba(95,212,232,0.12)',
                border: '1px solid rgba(95,212,232,0.3)',
                color: '#5FD4E8',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.08em',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5FD4E8', boxShadow: '0 0 6px #5FD4E8' }} />
              <span>APEX HUNT</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 02 ASCENT BRIDGE & TELEMETRY: OCEAN WATER INTO DAYLIGHT (EXACT 100vh VIEWPORT) ── */}
      <div
        id="ascent-bridge"
        className="ascent-bridge-container"
        style={{
          width: '100%',
          height: '100vh',
          maxHeight: '100vh',
          minHeight: '680px',
          boxSizing: 'border-box',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #040E1E 0%, #071A33 15%, #0B2236 30%, #12313B 45%, #1E4544 60%, #3B5F55 75%, #688A7B 88%, #96B2A3 96%, var(--kf-bg, #B6C3B0) 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          textAlign: 'center',
          paddingTop: 'clamp(84px, 11vh, 104px)',
          paddingBottom: '28px',
          paddingLeft: 'clamp(20px, 4vw, 48px)',
          paddingRight: 'clamp(20px, 4vw, 48px)',
          position: 'relative',
        }}
      >
        {/* Top: Compact Navy Stats Band */}
        <div
          className="ascent-stats-band"
          style={{
            width: '100%',
            maxWidth: '1060px',
            background: 'rgba(7, 26, 51, 0.75)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '18px',
            border: '1px solid rgba(237,234,227,0.14)',
            padding: '16px 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            boxShadow: '0 16px 40px rgba(0,0,0,0.3)',
          }}
        >
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#7D8FA6', letterSpacing: '0.14em', marginBottom: '4px' }}>HISTORY DEPTH</div>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '24px', color: '#EDEAE3', marginBottom: '4px' }}>10 Years</div>
            <div style={{ width: '100%', height: 3, background: 'rgba(237,234,227,0.1)', borderRadius: 2 }}>
              <div style={{ width: '92%', height: '100%', background: '#5FD4E8', borderRadius: 2 }} />
            </div>
          </div>

          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#7D8FA6', letterSpacing: '0.14em', marginBottom: '4px' }}>AI GUARD</div>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '24px', color: '#5FD4E8', marginBottom: '4px' }}>Active</div>
            <div style={{ width: '100%', height: 3, background: 'linear-gradient(90deg, #5FD4E8, #E8732A)', borderRadius: 2 }} />
          </div>

          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#7D8FA6', letterSpacing: '0.14em', marginBottom: '4px' }}>PASS RATE</div>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '24px', color: '#EDEAE3', marginBottom: '4px' }}>94% Pass</div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ width: 6, height: 6, background: '#EDEAE3', borderRadius: '50%', opacity: 0.75 }} />
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#7D8FA6', letterSpacing: '0.14em', marginBottom: '4px' }}>MONTHLY PRICE</div>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '24px', color: '#E8732A', fontStyle: 'italic' }}>$14/month</div>
            <div style={{ fontSize: '10px', color: '#7D8FA6', fontFamily: "'JetBrains Mono', monospace" }}>50% off on yearly</div>
          </div>
        </div>

        {/* Center: Ascent Copy */}
        <div style={{ maxWidth: '640px', padding: '0 20px', margin: 'auto 0' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: '#5FD4E8',
              marginBottom: '12px',
            }}
          >
            <span>02 · ASCENDING FROM THE DEEP</span>
          </div>

          <h2
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: 'clamp(34px, 4.2vw, 56px)',
              lineHeight: 1.05,
              color: '#EDEAE3',
              marginBottom: '14px',
            }}
          >
            Trade the coastline{' '}
            <span style={{ fontStyle: 'italic', color: '#5FD4E8' }}>
              nobody else
            </span>{' '}
            can reach.
          </h2>

          <p style={{ fontSize: '14px', color: '#B7C3D1', maxWidth: '520px', margin: '0 auto 20px', lineHeight: 1.6 }}>
            Your AI coach plans your risk around market sessions, news events and your emotional state. High probability setups at dawn, disciplined risk at dusk, and zero revenge trading in between.
          </p>

          <IridescentButton to="/login" size="md">
            START FREE TRIAL
          </IridescentButton>
        </div>

        {/* Downward Scrollytelling Cue into Daylight */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
          }}
          onClick={() => scrollTo('kingfisher-section')}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#5FD4E8',
              opacity: 0.9,
            }}
          >
            · · · SURFACE INTO DAYLIGHT · · ·
          </div>
          <div
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: 'clamp(22px, 2.6vw, 34px)',
              fontStyle: 'italic',
              color: '#EDEAE3',
            }}
          >
            Watch precision land.
          </div>
          <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '9px', fontFamily: "'JetBrains Mono', monospace", color: 'rgba(237,234,227,0.8)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              SURFACE TO AIR ↓
            </span>
            <div style={{ width: 1, height: 32, background: 'linear-gradient(180deg, #5FD4E8 0%, var(--kf-bg, #B6C3B0) 100%)' }} />
          </div>
        </div>
      </div>
    </section>
  );
}
