// frontend/src/components/landing/KingfisherSection.jsx
// Section 02: Kingfisher Precision — Clean Full One Page
// Self-contained 100vh viewport, pristine untouched video colors, 60fps landing, letter-by-letter handwriting, and clean top structure.

import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight } from 'lucide-react';
import IridescentButton from './IridescentButton';

const BIRD_VIDEO_URL = 'https://thinkingods.com/demos/kingfisher-hero/hero.mp4';

// The moment the bird perches in the clip (in seconds)
export const REVEAL_AT = 4.3;

// Letter-by-letter handwriting / typewriter reveal when bird perches
// Words are grouped in nowrap spans so words NEVER break mid-word across lines
function LetterWriter({ text, isRevealed, baseDelay = 0.1, accentColor = null, isItalic = false }) {
  const words = text.split(' ');
  let charCounter = 0;

  return (
    <span style={{ display: 'inline' }}>
      {words.map((word, wIdx) => {
        const chars = [...word];
        return (
          <span key={wIdx} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
            {chars.map((char) => {
              const charIdx = charCounter++;
              return (
                <span
                  key={charIdx}
                  style={{
                    display: 'inline-block',
                    opacity: isRevealed ? 1 : 0,
                    transform: isRevealed ? 'translateY(0) skewX(0deg)' : 'translateY(16px) skewX(-14deg)',
                    filter: isRevealed ? 'blur(0)' : 'blur(4px)',
                    transition: `opacity 0.45s ease ${baseDelay + charIdx * 0.035}s, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${baseDelay + charIdx * 0.035}s, filter 0.45s ease ${baseDelay + charIdx * 0.035}s`,
                    color: accentColor || 'inherit',
                    fontStyle: isItalic ? 'italic' : 'normal',
                  }}
                >
                  {char}
                </span>
              );
            })}
            {wIdx < words.length - 1 && (
              <span style={{ display: 'inline-block', width: '0.28em' }}>&nbsp;</span>
            )}
          </span>
        );
      })}
    </span>
  );
}

export default function KingfisherSection() {
  const sectionRef = useRef(null);
  const videoRef = useRef(null);
  const canvasHeadRef = useRef(null);
  const canvasWingRef = useRef(null);
  const [isRevealed, setIsRevealed] = useState(false);

  // Smooth scroll helper
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      const fallback = document.querySelector('#app-preview') || document.querySelector('#features');
      if (fallback) fallback.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // IntersectionObserver to pause video when offscreen
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
      { threshold: 0.08 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // Draw crops of video's final frame into canvases
  const drawThumbnails = () => {
    const video = videoRef.current;
    if (!video) return;

    // Crop 1: Head (0.555, 0.335, 0.22)
    const cHead = canvasHeadRef.current;
    if (cHead) {
      const ctx = cHead.getContext('2d');
      if (ctx) {
        cHead.width = 120;
        cHead.height = 120;
        const size = Math.floor(video.videoWidth * 0.22);
        const sx = Math.floor(video.videoWidth * 0.555 - size / 2);
        const sy = Math.floor(video.videoHeight * 0.335 - size / 2);
        ctx.drawImage(video, sx, sy, size, size, 0, 0, 120, 120);
      }
    }

    // Crop 2: Wing (0.43, 0.60, 0.24)
    const cWing = canvasWingRef.current;
    if (cWing) {
      const ctx = cWing.getContext('2d');
      if (ctx) {
        cWing.width = 120;
        cWing.height = 120;
        const size = Math.floor(video.videoWidth * 0.24);
        const sx = Math.floor(video.videoWidth * 0.43 - size / 2);
        const sy = Math.floor(video.videoHeight * 0.60 - size / 2);
        ctx.drawImage(video, sx, sy, size, size, 0, 0, 120, 120);
      }
    }
  };

  // Choreography for landing reveal
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const triggerReveal = () => {
      if (isRevealed) return;
      setIsRevealed(true);
      drawThumbnails();
    };

    const handleTimeUpdate = () => {
      if (isRevealed) return;
      if (video.currentTime >= REVEAL_AT) {
        triggerReveal();
      }
    };

    const hardTimeout = setTimeout(() => {
      triggerReveal();
    }, 7000);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', triggerReveal);
    video.addEventListener('error', triggerReveal);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', triggerReveal);
      video.removeEventListener('error', triggerReveal);
      clearTimeout(hardTimeout);
    };
  }, [isRevealed]);

  return (
    <section
      ref={sectionRef}
      id="kingfisher-section"
      className="kf-root"
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        maxHeight: '100vh',
        minHeight: '680px',
        background: '#B6C3B0',
        color: '#10201F',
        overflow: 'hidden',
        fontFamily: "'Manrope', sans-serif",
      }}
    >
      {/* ── Scoped Responsive Rules for Bird Section ── */}
      <style>{`
        @media (max-width: 768px) {
          .kf-root {
            min-height: 100svh !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
          }
          .kf-hero {
            min-height: 100svh !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            padding-top: 72px !important;
            padding-bottom: 24px !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-start !important;
            gap: 24px !important;
          }
          .kf-giant-word {
            font-size: 22vw !important;
            top: 6vh !important;
          }
          .kf-left-copy {
            max-width: 100% !important;
          }
          .kf-h2 {
            font-size: clamp(32px, 8vw, 48px) !important;
            line-height: 1.05 !important;
          }
        }
      `}</style>

      {/* ── BIRD SECTION: FULL ONE PAGE (Exact 100vh Viewport) ── */}
      <div
        className={`kf-hero ${isRevealed ? 'is-revealed' : ''}`}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          background: '#B6C3B0',
          boxSizing: 'border-box',
          paddingTop: 'clamp(84px, 11vh, 96px)',
          paddingBottom: '24px',
          paddingLeft: 'clamp(20px, 6vw, 100px)',
          paddingRight: 'clamp(20px, 6vw, 100px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
        }}
      >
        {/* Giant watermark BEHIND the bird using mix-blend-mode: darken */}
        <div
          className="kf-giant-word"
          style={{
            position: 'absolute',
            top: '8vh',
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 'clamp(90px, 18vw, 320px)',
            lineHeight: 0.85,
            fontWeight: 400,
            color: '#ADBAA7',
            mixBlendMode: 'darken',
            WebkitMaskImage: 'linear-gradient(180deg, #000 0%, #000 45%, rgba(0,0,0,0.3) 70%, transparent 90%)',
            maskImage: 'linear-gradient(180deg, #000 0%, #000 45%, rgba(0,0,0,0.3) 70%, transparent 90%)',
            pointerEvents: 'none',
            zIndex: 1,
            userSelect: 'none',
          }}
        >
          Precision
        </div>

        {/* Video of Kingfisher Landing — 100% UNTOUCHED NATIVE COLORS (No green scrim!) */}
        <video
          ref={videoRef}
          src={BIRD_VIDEO_URL}
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

        {/* ── TOP STRUCTURE: Left Copy & Right Telemetry Cards (Positioned above video, leaving bird center visible) ── */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '32px',
          }}
        >
          {/* Left Hero Copy */}
          <div
            className="kf-rv kf-left-copy"
            style={{
              maxWidth: '520px',
              opacity: isRevealed ? 1 : 0,
              transform: isRevealed ? 'translateY(0)' : 'translateY(20px)',
              filter: isRevealed ? 'blur(0)' : 'blur(6px)',
              transition: 'all 0.9s cubic-bezier(0.2, 0.7, 0.1, 1) 0.18s',
            }}
          >
            {/* H1 Serif with LetterWriter handwriting animation */}
            <h2
              className="kf-h2"
              style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: 'clamp(38px, 4.4vw, 68px)',
                lineHeight: 1.02,
                fontWeight: 400,
                color: '#10201F',
                marginBottom: '16px',
                textShadow: '0 2px 14px rgba(255,255,255,0.4)',
              }}
            >
              <LetterWriter text="Trades that " isRevealed={isRevealed} baseDelay={0.05} />
              <LetterWriter text="land with precision." isRevealed={isRevealed} baseDelay={0.45} accentColor="#0E7C86" isItalic={true} />
            </h2>

            <p
              style={{
                fontSize: '14.5px',
                lineHeight: 1.6,
                color: '#2E3D3A',
                marginBottom: '20px',
                textShadow: '0 1px 8px rgba(255,255,255,0.3)',
              }}
            >
              It waits, reads the market structure, then lands in one clean motion without splashing the waters. Clean R-multiple execution engineered for funded traders.
            </p>

            {/* Key Value Badges */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '22px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                color: '#1A2E2B',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.55)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(16,32,31,0.12)' }}>
                ✓ ICT & SMC CONFLUENCE
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.55)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(16,32,31,0.12)' }}>
                ✓ MIN 1:3R SETUPS
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.55)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(16,32,31,0.12)' }}>
                ✓ ZERO REVENGE TRADING
              </span>
            </div>

            {/* CTA Row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px' }}>
              <IridescentButton to="/login" size="md">
                START FREE TRIAL
              </IridescentButton>

              <button
                type="button"
                onClick={() => scrollTo('app-preview')}
                style={{
                  background: 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(16,32,31,0.2)',
                  borderRadius: '999px',
                  padding: '11px 20px',
                  color: '#10201F',
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.85)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.6)';
                }}
              >
                <span>Explore In-App Workspaces</span>
                <ArrowDown size={13} color="#0E7C86" />
              </button>
            </div>
          </div>

          {/* Right Cluster: Trust Row + 2 Dark Cards */}
          <div
            className="hidden md:flex kf-rv"
            style={{
              flexDirection: 'column',
              gap: '12px',
              width: 'clamp(260px, 22vw, 320px)',
              opacity: isRevealed ? 1 : 0,
              filter: isRevealed ? 'blur(0)' : 'blur(6px)',
              transition: 'all 0.9s cubic-bezier(0.2, 0.7, 0.1, 1) 0.36s',
            }}
          >
            {/* Trust Row */}
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                color: '#2E3D3A',
                letterSpacing: '0.14em',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                justifyContent: 'flex-end',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0E7C86' }} />
              <span>40+ COUNTRIES · 3,200+ ACTIVE LOGGERS</span>
            </div>

            {/* Side-by-side Dark Cards */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {/* Card 1: Head Crop */}
              <div
                style={{
                  flex: 1,
                  background: 'rgba(15,29,28,0.85)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '18px',
                  padding: '14px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 20px 40px rgba(16,32,31,0.2)',
                }}
              >
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#E8732A', marginBottom: '6px' }}>
                  PROMPTS / 01
                </div>
                <div style={{ width: '100%', height: '88px', borderRadius: '10px', overflow: 'hidden', background: '#172A28', marginBottom: '8px' }}>
                  <canvas ref={canvasHeadRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '18px', color: '#E3E8DE', marginBottom: '4px' }}>
                  Wait · Confluence
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E8732A' }} />
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(227,232,222,0.3)' }} />
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(227,232,222,0.3)' }} />
                </div>
              </div>

              {/* Card 2: Wing Crop */}
              <div
                style={{
                  flex: 1,
                  background: 'rgba(15,29,28,0.85)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '18px',
                  padding: '14px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 20px 40px rgba(16,32,31,0.2)',
                  transform: 'translateY(12px)',
                }}
              >
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#0E7C86', marginBottom: '6px' }}>
                  MOTION / 02
                </div>
                <div style={{ width: '100%', height: '88px', borderRadius: '10px', overflow: 'hidden', background: '#172A28', marginBottom: '8px' }}>
                  <canvas ref={canvasWingRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '18px', color: '#E3E8DE', marginBottom: '4px' }}>
                  60fps Replay
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E8732A' }} />
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(227,232,222,0.3)' }} />
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(227,232,222,0.3)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subtle base fade into workspaces */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '44px',
            background: 'linear-gradient(180deg, transparent, rgba(5,9,14,0.92))',
            pointerEvents: 'none',
            zIndex: 15,
          }}
        />
      </div>
    </section>
  );
}
