// frontend/src/components/landing/ShipHeroSection.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUpRight, Check, Sparkles } from 'lucide-react';
import IridescentButton from './IridescentButton';

const VIDEO_URL = 'https://thinkingods.com/demos/veloria-yacht/assets/yacht.mp4';
const POSTER_URL = 'https://thinkingods.com/demos/veloria-yacht/assets/yacht-poster.jpg';
const CARDS = [
  { img: 'https://thinkingods.com/demos/veloria-yacht/assets/t1.jpg', tag: '01 REPLAY', title: ['Bar replay', 'backtester'], desc: '10-Year historical tick data across forex, gold & crypto.' },
  { img: 'https://thinkingods.com/demos/veloria-yacht/assets/t2.jpg', tag: '02 PSYCHOLOGY', title: ['AI Coach', 'isLIVE'], desc: 'Pre-trade check blocks revenge trades before drawdown breach.' },
  { img: 'https://thinkingods.com/demos/veloria-yacht/assets/t3.jpg', tag: '03 RISK GUARD', title: ['Prop firm', 'guardian'], desc: 'Real-time daily & trailing drawdown alerts for FTMO & Topstep.' },
  { img: 'https://thinkingods.com/demos/veloria-yacht/assets/t4.jpg', tag: '04 AUTOMATION', title: ['Automated', 'trading bots'], desc: 'Execute your logged setups directly at zero extra cost.' },
];

const SECTIONS = [
  { id: 'fn-hero', label: 'HOME', num: '01' },
  { id: 'fn-onboard', label: 'FEATURES', num: '02' },
  { id: 'fn-voyage', label: 'THE EDGE', num: '03' },
  { id: 'fn-destinations', label: 'SESSIONS', num: '04' },
  { id: 'ocean-submersion', label: 'SUBMERGE', num: '05' },
];

export default function ShipHeroSection() {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [activeSection, setActiveSection] = useState('01');

  // Handle Video Mode (loop vs scrub)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const mode = new URLSearchParams(window.location.search).get('mode') || 'loop';

    if (mode === 'scrub') {
      video.autoplay = false;
      video.loop = false;
      video.pause();

      let rafId;
      const handleScroll = () => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          if (!video.duration) return;
          const progress = Math.min(Math.max(window.scrollY / (window.innerHeight * 3), 0), 1);
          video.currentTime = progress * Math.max(video.duration - 0.05, 0.1);
        });
      };

      const onLoaded = () => handleScroll();
      video.addEventListener('loadedmetadata', onLoaded);
      window.addEventListener('scroll', handleScroll, { passive: true });

      return () => {
        video.removeEventListener('loadedmetadata', onLoaded);
        window.removeEventListener('scroll', handleScroll);
        if (rafId) cancelAnimationFrame(rafId);
      };
    } else {
      // Loop mode
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          const startOnPointer = () => {
            video.play().catch(() => {});
            window.removeEventListener('pointerdown', startOnPointer);
          };
          window.addEventListener('pointerdown', startOnPointer, { once: true });
        });
      }
    }
  }, []);

  const [isInShipView, setIsInShipView] = useState(true);

  // Pause video and hide fixed chrome when out of ship section
  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInShipView(entry.isIntersecting);
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Section index observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = entry.target.getAttribute('data-i');
            if (idx) setActiveSection(idx);
          }
        });
      },
      { threshold: 0.5 }
    );

    const sectionEls = document.querySelectorAll('[data-i]');
    sectionEls.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Smooth scroll to section
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div
      ref={containerRef}
      className="veloria-root"
      style={{
        position: 'relative',
        color: '#F4EFE6',
        fontFamily: "'Manrope', sans-serif",
        background: 'transparent',
        overflowX: 'clip',
      }}
    >
      {/* ── Fixed Background Video Layer (Visible behind Ship beats 01-04) ── */}
      <div
        className="veloria-bg"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none',
          opacity: isInShipView ? 1 : 0,
          transition: 'opacity 0.4s ease',
          transform: 'translateZ(0)',
          willChange: 'opacity',
        }}
      >
        <video
          ref={videoRef}
          id="bgVideo"
          src={VIDEO_URL}
          poster={POSTER_URL}
          autoPlay
          muted
          defaultMuted
          loop
          playsInline
          webkit-playsinline="true"
          x5-playsinline="true"
          preload="auto"
          disablePictureInPicture
          controlsList="nodownload noplaybackrate nofullscreen"
          onEnded={(e) => {
            e.currentTarget.currentTime = 0;
            e.currentTarget.play().catch(() => {});
          }}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'translateZ(0)',
            pointerEvents: 'none',
          }}
        />
        {/* Three Gradient Scrims preserving yacht in center */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `
              linear-gradient(90deg, rgba(3,8,13,0.78) 0%, rgba(3,8,13,0.35) 32%, transparent 55%),
              linear-gradient(0deg, rgba(3,8,13,0.80) 0%, transparent 38%),
              linear-gradient(180deg, rgba(3,8,13,0.55) 0%, transparent 18%)
            `,
            pointerEvents: 'none',
            transform: 'translateZ(0)',
          }}
        />
      </div>

      {/* ── Fixed Chrome: Header (z-index 30) ── */}
      <header
        className="veloria-header"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '96px',
          padding: '0 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 30,
          pointerEvents: isInShipView ? 'auto' : 'none',
          opacity: isInShipView ? 1 : 0,
          transition: 'opacity 0.35s ease',
        }}
      >
        {/* Left: Frosted glass pill logo */}
        <Link
          to="/"
          style={{
            pointerEvents: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 24px',
            borderRadius: '999px',
            background: 'rgba(8,15,22,0.42)',
            backdropFilter: 'blur(18px) saturate(120%)',
            WebkitBackdropFilter: 'blur(18px) saturate(120%)',
            border: '1px solid rgba(244,239,230,0.16)',
            textDecoration: 'none',
            color: '#F4EFE6',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          }}
        >
          <img src="/logo3d.png" alt="Forex Notes" style={{ width: 22, height: 22, objectFit: 'contain' }} />
          <span
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '21px',
              fontWeight: 600,
              letterSpacing: '0.34em',
              textTransform: 'uppercase',
              color: '#F4EFE6',
            }}
          >
            FOREX NOTES
          </span>
        </Link>

        {/* Center: Four Anchor Links */}
        <nav
          className="hidden md:flex"
          style={{
            pointerEvents: 'auto',
            alignItems: 'center',
            gap: '52px',
            padding: '12px 32px',
            borderRadius: '999px',
            background: 'rgba(8,15,22,0.35)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(244,239,230,0.1)',
          }}
        >
          {[
            { id: 'fn-onboard', label: 'FEATURES' },
            { id: 'fn-voyage', label: 'THE EDGE' },
            { id: 'fn-destinations', label: 'SESSIONS' },
            { id: 'pricing', label: 'PRICING' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: "'Manrope', sans-serif",
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'rgba(244,239,230,0.72)',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#C9A96E')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(244,239,230,0.72)')}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right: Iridescent Pill CTA */}
        <div style={{ pointerEvents: 'auto' }}>
          <IridescentButton to="/login">
            CLAIM ACCESS
          </IridescentButton>
        </div>
      </header>

      {/* ── Fixed Chrome: Section Index (z-index 30, right side) ── */}
      <div
        className="hidden lg:flex"
        style={{
          position: 'fixed',
          right: '40px',
          top: '170px',
          zIndex: 30,
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '22px',
          pointerEvents: isInShipView ? 'auto' : 'none',
          opacity: isInShipView ? 1 : 0,
          transition: 'opacity 0.35s ease',
        }}
      >
        {SECTIONS.map((sec) => {
          const isActive = activeSection === sec.num;
          return (
            <button
              key={sec.id}
              onClick={() => scrollTo(sec.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 0',
                color: isActive ? '#C9A96E' : 'rgba(244,239,230,0.55)',
                transition: 'all 0.3s ease',
              }}
            >
              {isActive && (
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: '#C9A96E',
                    animation: 'slideInLeft 0.3s ease forwards',
                  }}
                >
                  {sec.label}
                </span>
              )}
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                }}
              >
                {sec.num}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Content Stream (z-index 10) ── */}
      <div style={{ position: 'relative', zIndex: 10 }}>

        {/* ── 01 HERO ── */}
        <section
          id="fn-hero"
          data-i="01"
          style={{
            position: 'relative',
            minHeight: '100vh',
            minHeight: '760px',
            paddingLeft: 'clamp(20px, 5.5vw, 80px)',
            paddingRight: 'clamp(20px, 10.4vw, 150px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            paddingTop: 'clamp(140px, 20vh, 200px)',
            paddingBottom: '56px',
            boxSizing: 'border-box',
          }}
        >
          {/* Hero Left Group */}
          <div
            className="hero-copy-group"
            style={{
              maxWidth: 'min(580px, 85vw)',
              animation: 'veloriaFadeUp 1.2s cubic-bezier(0.2, 0.7, 0.2, 1) forwards',
            }}
          >
            {/* Accent Eyebrow */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              <span style={{ width: 40, height: 1.5, background: '#C9A96E', display: 'inline-block' }} />
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.28em',
                  color: '#C9A96E',
                  textTransform: 'uppercase',
                }}
              >
                10-YEAR HISTORICAL REPLAY · AI PSYCHOLOGY COACH
              </span>
            </div>

            {/* H1 Serif */}
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 'clamp(52px, 6.4vw, 92px)',
                fontWeight: 500,
                lineHeight: 0.94,
                letterSpacing: '-0.02em',
                color: '#F4EFE6',
                textShadow: '0 2px 24px rgba(0,0,0,0.45)',
                marginBottom: '20px',
              }}
            >
              Backtest 10 Years of Markets. Journal Every Trade.{' '}
              <span style={{ fontStyle: 'italic', fontWeight: 400, color: '#C9A96E' }}>
                Master Your Mind.
              </span>
            </h1>

            {/* 16px Lede */}
            <p
              style={{
                fontSize: '16px',
                lineHeight: 1.65,
                color: 'rgba(244,239,230,0.88)',
                maxWidth: '440px',
                marginBottom: '32px',
                textShadow: '0 1px 12px rgba(0,0,0,0.4)',
              }}
            >
              Forex Notes is a bar replay backtesting platform with 10 years of historical data, a digital trading journal with an AI psychology coach, and prop firm challenge tools in one app. From $14/month.
            </p>

            {/* Two 54px Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
              <IridescentButton to="/login">
                START FREE TRIAL
              </IridescentButton>

              <button
                type="button"
                onClick={() => scrollTo('fn-onboard')}
                style={{
                  height: '54px',
                  padding: '0 24px',
                  borderRadius: '999px',
                  background: 'rgba(8,15,22,0.42)',
                  backdropFilter: 'blur(18px) saturate(120%)',
                  WebkitBackdropFilter: 'blur(18px) saturate(120%)',
                  border: '1px solid rgba(244,239,230,0.16)',
                  color: '#F4EFE6',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(18,30,44,0.6)';
                  e.currentTarget.style.borderColor = 'rgba(244,239,230,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(8,15,22,0.42)';
                  e.currentTarget.style.borderColor = 'rgba(244,239,230,0.16)';
                }}
              >
                <span>EXPLORE ECOSYSTEM</span>
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'rgba(244,239,230,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ArrowDown size={14} />
                </span>
              </button>
            </div>
          </div>

          {/* Bottom Row: Scroll Cue (left) + Glass Stat Card (bottom-right) */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: '24px',
              marginTop: '40px',
            }}
          >
            {/* Scroll Cue */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: 1,
                  height: 40,
                  background: 'linear-gradient(180deg, #C9A96E, transparent)',
                  animation: 'scrollCueLoop 2.2s ease-in-out infinite',
                }}
              />
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '0.24em',
                  textTransform: 'uppercase',
                  color: 'rgba(244,239,230,0.65)',
                }}
              >
                SCROLL TO SET SAIL
              </span>
            </div>

            {/* Bottom-right Glass Stat Card */}
            <div
              style={{
                width: 'min(380px, 90vw)',
                borderRadius: '24px',
                padding: '24px 28px',
                background: 'rgba(8,15,22,0.52)',
                backdropFilter: 'blur(22px) saturate(130%)',
                WebkitBackdropFilter: 'blur(22px) saturate(130%)',
                border: '1px solid rgba(244,239,230,0.18)',
                boxShadow: '0 24px 50px rgba(0,0,0,0.45)',
                position: 'relative',
              }}
            >
              {/* Header row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '10px',
                      fontWeight: 600,
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      color: '#C9A96E',
                      marginBottom: '4px',
                    }}
                  >
                    FEATURED PLATFORM
                  </div>
                  <div
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: '30px',
                      fontWeight: 500,
                      color: '#F4EFE6',
                      lineHeight: 1,
                    }}
                  >
                    Alpha Terminal
                  </div>
                </div>

                {/* Huge Serif 10Y */}
                <div
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: '60px',
                    fontWeight: 500,
                    color: '#C9A96E',
                    lineHeight: 0.8,
                    display: 'flex',
                    alignItems: 'baseline',
                  }}
                >
                  10<span style={{ fontSize: '24px', marginLeft: '2px' }}>Y</span>
                </div>
              </div>

              {/* 3px Track filled 72% in accent */}
              <div style={{ width: '100%', height: '3px', background: 'rgba(244,239,230,0.12)', borderRadius: '999px', overflow: 'hidden', marginBottom: '10px' }}>
                <div style={{ width: '72%', height: '100%', background: '#C9A96E', borderRadius: '999px' }} />
              </div>

              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '9px',
                  fontWeight: 600,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(244,239,230,0.6)',
                  marginBottom: '16px',
                }}
              >
                3,200+ FUNDED TRADERS · 40+ COUNTRIES
              </div>

              {/* Hairline divider */}
              <div style={{ width: '100%', height: 1, background: 'rgba(244,239,230,0.12)', marginBottom: '16px' }} />

              {/* 4 Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 600, color: '#F4EFE6', fontFamily: "'Cormorant Garamond', serif" }}>10Y</div>
                  <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'rgba(244,239,230,0.5)', letterSpacing: '0.05em' }}>Tick Data</div>
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 600, color: '#F4EFE6', fontFamily: "'Cormorant Garamond', serif" }}>AI</div>
                  <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'rgba(244,239,230,0.5)', letterSpacing: '0.05em' }}>Guard</div>
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 600, color: '#F4EFE6', fontFamily: "'Cormorant Garamond', serif" }}>94%</div>
                  <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'rgba(244,239,230,0.5)', letterSpacing: '0.05em' }}>Pass Rate</div>
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 600, color: '#C9A96E', fontFamily: "'Cormorant Garamond', serif" }}>$14</div>
                  <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'rgba(244,239,230,0.5)', letterSpacing: '0.05em' }}>Per Month</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 02 ONBOARD (Four Floating Corner Cards framing hull) ── */}
        <section
          id="fn-onboard"
          data-i="02"
          style={{
            position: 'relative',
            minHeight: '100vh',
            minHeight: '760px',
            paddingLeft: 'clamp(20px, 5.5vw, 80px)',
            paddingRight: 'clamp(20px, 10.4vw, 150px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
            paddingTop: '80px',
            paddingBottom: '60px',
          }}
        >
          {/* Desktop Floating Layout */}
          <div className="relative w-full h-[620px] hidden md:block">
            {/* Card 1: Top Left */}
            <div
              className="veloria-card veloria-card-tl"
              style={{
                position: 'absolute',
                left: 0,
                top: '6%',
                width: 'clamp(220px, 19vw, 290px)',
                aspectRatio: '29/22',
                borderRadius: '28px',
                overflow: 'hidden',
                border: '1px solid rgba(244,239,230,0.18)',
                boxShadow: '0 30px 60px rgba(0,0,0,0.45)',
                transition: 'transform 0.5s cubic-bezier(0.2, 0.7, 0.2, 1)',
              }}
            >
              <img src={CARDS[0].img} alt="Bar Replay Backtester" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(3,8,13,0.88) 0%, rgba(3,8,13,0.3) 55%, transparent 100%)' }} />
              <div style={{ position: 'absolute', top: '18px', left: '20px' }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#C9A96E', letterSpacing: '0.15em', marginBottom: '4px' }}>{CARDS[0].tag}</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '26px', lineHeight: 1.05, fontWeight: 500, color: '#F4EFE6' }}>
                  {CARDS[0].title[0]}<br />{CARDS[0].title[1]}
                </div>
              </div>
              <div style={{ position: 'absolute', top: '18px', right: '18px', width: 44, height: 44, borderRadius: '50%', background: 'rgba(8,15,22,0.45)', backdropFilter: 'blur(10px)', border: '1px solid rgba(244,239,230,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowUpRight size={18} color="#C9A96E" />
              </div>
            </div>

            {/* Card 2: Bottom Left (staggered) */}
            <div
              className="veloria-card veloria-card-bl"
              style={{
                position: 'absolute',
                left: '7vw',
                top: '52%',
                width: 'clamp(220px, 19vw, 290px)',
                aspectRatio: '29/22',
                borderRadius: '28px',
                overflow: 'hidden',
                border: '1px solid rgba(244,239,230,0.18)',
                boxShadow: '0 30px 60px rgba(0,0,0,0.45)',
                transition: 'transform 0.5s cubic-bezier(0.2, 0.7, 0.2, 1)',
              }}
            >
              <img src={CARDS[1].img} alt="AI Psychology Coach" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(3,8,13,0.88) 0%, rgba(3,8,13,0.3) 55%, transparent 100%)' }} />
              <div style={{ position: 'absolute', top: '18px', left: '20px' }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#C9A96E', letterSpacing: '0.15em', marginBottom: '4px' }}>{CARDS[1].tag}</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '26px', lineHeight: 1.05, fontWeight: 500, color: '#F4EFE6' }}>
                  {CARDS[1].title[0]}<br />{CARDS[1].title[1]}
                </div>
              </div>
              <div style={{ position: 'absolute', top: '18px', right: '18px', width: 44, height: 44, borderRadius: '50%', background: 'rgba(8,15,22,0.45)', backdropFilter: 'blur(10px)', border: '1px solid rgba(244,239,230,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowUpRight size={18} color="#C9A96E" />
              </div>
            </div>

            {/* Card 3: Top Right */}
            <div
              className="veloria-card veloria-card-tr"
              style={{
                position: 'absolute',
                right: '7vw',
                top: '6%',
                width: 'clamp(220px, 19vw, 290px)',
                aspectRatio: '29/22',
                borderRadius: '28px',
                overflow: 'hidden',
                border: '1px solid rgba(244,239,230,0.18)',
                boxShadow: '0 30px 60px rgba(0,0,0,0.45)',
                transition: 'transform 0.5s cubic-bezier(0.2, 0.7, 0.2, 1)',
              }}
            >
              <img src={CARDS[2].img} alt="Prop Firm Drawdown Guardian" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(3,8,13,0.88) 0%, rgba(3,8,13,0.3) 55%, transparent 100%)' }} />
              <div style={{ position: 'absolute', top: '18px', left: '20px' }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#C9A96E', letterSpacing: '0.15em', marginBottom: '4px' }}>{CARDS[2].tag}</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '26px', lineHeight: 1.05, fontWeight: 500, color: '#F4EFE6' }}>
                  {CARDS[2].title[0]}<br />{CARDS[2].title[1]}
                </div>
              </div>
              <div style={{ position: 'absolute', top: '18px', right: '18px', width: 44, height: 44, borderRadius: '50%', background: 'rgba(8,15,22,0.45)', backdropFilter: 'blur(10px)', border: '1px solid rgba(244,239,230,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowUpRight size={18} color="#C9A96E" />
              </div>
            </div>

            {/* Card 4: Bottom Right (staggered) */}
            <div
              className="veloria-card veloria-card-br"
              style={{
                position: 'absolute',
                right: 0,
                top: '52%',
                width: 'clamp(220px, 19vw, 290px)',
                aspectRatio: '29/22',
                borderRadius: '28px',
                overflow: 'hidden',
                border: '1px solid rgba(244,239,230,0.18)',
                boxShadow: '0 30px 60px rgba(0,0,0,0.45)',
                transition: 'transform 0.5s cubic-bezier(0.2, 0.7, 0.2, 1)',
              }}
            >
              <img src={CARDS[3].img} alt="Automated Trading Bot Hub" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(3,8,13,0.88) 0%, rgba(3,8,13,0.3) 55%, transparent 100%)' }} />
              <div style={{ position: 'absolute', top: '18px', left: '20px' }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#C9A96E', letterSpacing: '0.15em', marginBottom: '4px' }}>{CARDS[3].tag}</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '26px', lineHeight: 1.05, fontWeight: 500, color: '#F4EFE6' }}>
                  {CARDS[3].title[0]}<br />{CARDS[3].title[1]}
                </div>
              </div>
              <div style={{ position: 'absolute', top: '18px', right: '18px', width: 44, height: 44, borderRadius: '50%', background: 'rgba(8,15,22,0.45)', backdropFilter: 'blur(10px)', border: '1px solid rgba(244,239,230,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowUpRight size={18} color="#C9A96E" />
              </div>
            </div>
          </div>

          {/* Mobile Grid for Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden my-8">
            {CARDS.map((card, idx) => (
              <div
                key={idx}
                style={{
                  borderRadius: '20px',
                  overflow: 'hidden',
                  position: 'relative',
                  aspectRatio: '29/22',
                  border: '1px solid rgba(244,239,230,0.18)',
                }}
              >
                <img src={card.img} alt={card.tag} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(3,8,13,0.85) 0%, transparent 100%)' }} />
                <div style={{ position: 'absolute', top: '16px', left: '16px' }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#C9A96E', letterSpacing: '0.12em' }}>{card.tag}</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', fontWeight: 500, color: '#F4EFE6' }}>
                    {card.title.join(' ')}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom-Center Title & Lede */}
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto', zIndex: 2 }}>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 'clamp(54px, 6.8vw, 98px)',
                fontWeight: 500,
                lineHeight: 0.95,
                color: '#F4EFE6',
                marginBottom: '16px',
                textShadow: '0 2px 24px rgba(0,0,0,0.5)',
              }}
            >
              Made to{' '}
              <span style={{ fontStyle: 'italic', fontWeight: 400, color: '#C9A96E' }}>
                execute.
              </span>
            </h2>
            <p
              style={{
                fontSize: '17px',
                lineHeight: 1.65,
                color: 'rgba(244,239,230,0.85)',
                margin: '0 auto',
                textShadow: '0 1px 12px rgba(0,0,0,0.5)',
              }}
            >
              A private AI coach, 10 years of tick replay and automated prop firm tracking aboard. The platform runs silently around the way you execute your edge.
            </p>
          </div>
        </section>

        {/* ── 03 THE VOYAGE / THE EDGE (Hull Owns the Frame) ── */}
        <section
          id="fn-voyage"
          data-i="03"
          style={{
            position: 'relative',
            minHeight: '100vh',
            minHeight: '760px',
            paddingLeft: 'clamp(20px, 5.5vw, 80px)',
            paddingRight: 'clamp(20px, 10.4vw, 150px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            paddingBottom: '96px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: '40px',
            }}
          >
            {/* Bottom-left: growing accent line + H2 */}
            <div style={{ maxWidth: 'min(760px, 58vw)' }}>
              <div
                style={{
                  width: 64,
                  height: 2,
                  background: '#C9A96E',
                  marginBottom: '20px',
                  borderRadius: '2px',
                }}
              />
              <h2
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 'clamp(46px, 5.4vw, 78px)',
                  fontWeight: 500,
                  lineHeight: 0.98,
                  color: '#F4EFE6',
                  textShadow: '0 2px 24px rgba(0,0,0,0.5)',
                }}
              >
                Trade the coastline{' '}
                <span style={{ fontStyle: 'italic', fontWeight: 400, color: '#C9A96E' }}>
                  nobody else
                </span>{' '}
                can reach.
              </h2>
            </div>

            {/* Bottom-right: Route planning paragraph + Accent Link */}
            <div style={{ maxWidth: 'min(420px, 85vw)' }}>
              <p
                style={{
                  fontSize: '15px',
                  lineHeight: 1.7,
                  color: 'rgba(244,239,230,0.85)',
                  marginBottom: '20px',
                  textShadow: '0 1px 12px rgba(0,0,0,0.5)',
                }}
              >
                Your AI coach plans your risk around market sessions, news events and your emotional state. High probability setups at dawn, disciplined risk at dusk, and zero revenge trading in between.
              </p>
              <button
                type="button"
                onClick={() => scrollTo('fn-destinations')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: '#C9A96E',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'gap 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.gap = '14px')}
                onMouseLeave={(e) => (e.currentTarget.style.gap = '8px')}
              >
                <span>SEE MARKETS WE COVER</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </section>

        {/* ── 04 DESTINATIONS / SESSIONS & MARKETS ── */}
        <section
          id="fn-destinations"
          data-i="04"
          style={{
            position: 'relative',
            minHeight: '100vh',
            minHeight: '760px',
            paddingLeft: 'clamp(20px, 5.5vw, 80px)',
            paddingRight: 'clamp(20px, 10.4vw, 150px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            paddingTop: 'clamp(120px, 18vh, 160px)',
            paddingBottom: '64px',
            boxSizing: 'border-box',
          }}
        >
          {/* Top-left Eyebrow + H2 */}
          <div style={{ maxWidth: '640px' }}>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: '#C9A96E',
                marginBottom: '12px',
              }}
            >
              MARKETS & SESSIONS
            </div>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 'clamp(46px, 5.2vw, 74px)',
                fontWeight: 500,
                lineHeight: 0.98,
                color: '#F4EFE6',
                textShadow: '0 2px 24px rgba(0,0,0,0.5)',
              }}
            >
              Four asset classes,{' '}
              <span style={{ fontStyle: 'italic', fontWeight: 400, color: '#C9A96E' }}>
                infinite edge.
              </span>
            </h2>
          </div>

          {/* Bottom 4-Column Grid of Glass Tiles */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginTop: '40px',
            }}
          >
            {[
              { num: '01', sub: '24/5 FX', name: 'Forex Majors', desc: 'EURUSD, GBPUSD, USDJPY tick-by-tick replay & London/NY session analytics.' },
              { num: '02', sub: 'HIGH VOL', name: 'Gold (XAUUSD)', desc: 'Track Asian, London, and NY breakouts with automated pip-level risk sizing.' },
              { num: '03', sub: 'CASH OPEN', name: 'Global Indices', desc: 'NAS100, US30, SPX500 high-momentum execution tracking and volume alerts.' },
              { num: '04', sub: '24/7 DEEP', name: 'Crypto Assets', desc: 'BTCUSDT, ETHUSDT 10-year bar replay and weekend volatility filters.' },
            ].map((tile, i) => (
              <div
                key={i}
                style={{
                  borderRadius: '22px',
                  padding: '24px 20px',
                  minHeight: '170px',
                  background: 'rgba(8,15,22,0.46)',
                  backdropFilter: 'blur(20px) saturate(120%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(120%)',
                  border: '1px solid rgba(244,239,230,0.16)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(8,15,22,0.75)';
                  e.currentTarget.style.borderColor = '#C9A96E';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(8,15,22,0.46)';
                  e.currentTarget.style.borderColor = 'rgba(244,239,230,0.16)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: 700, color: '#C9A96E' }}>{tile.num}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(244,239,230,0.6)' }}>{tile.sub}</span>
                </div>
                <div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '28px', fontWeight: 500, color: '#F4EFE6', marginBottom: '8px', lineHeight: 1.1 }}>
                    {tile.name}
                  </div>
                  <div style={{ fontSize: '13px', lineHeight: 1.5, color: 'rgba(244,239,230,0.72)' }}>
                    {tile.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── OCEAN SUBMERSION BRIDGE: 100vh Full Screen with Arrow and Copy at the Down Side ── */}
        <section
          id="ocean-submersion"
          data-i="05"
          style={{
            position: 'relative',
            zIndex: 10,
            minHeight: '100vh',
            minHeight: '760px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, transparent 0%, rgba(3,8,13,0.5) 20%, rgba(4,14,30,0.9) 65%, #071A33 100%)',
            paddingLeft: 'clamp(20px, 5.5vw, 80px)',
            paddingRight: 'clamp(20px, 10.4vw, 150px)',
            paddingTop: 'clamp(100px, 14vh, 140px)',
            paddingBottom: '48px',
            boxSizing: 'border-box',
          }}
        >
          {/* Top: Eyebrow + Subtitle */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              <span style={{ width: 40, height: 1.5, background: '#5AC8FA', display: 'inline-block' }} />
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.26em',
                  color: '#5AC8FA',
                  textTransform: 'uppercase',
                }}
              >
                05 · THE OCEAN SUBMERSION
              </span>
            </div>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 'clamp(36px, 4.4vw, 64px)',
                fontWeight: 500,
                lineHeight: 0.98,
                color: '#F4EFE6',
                textShadow: '0 2px 24px rgba(0,0,0,0.6)',
              }}
            >
              Departing surface waters.{' '}
              <span style={{ fontStyle: 'italic', fontWeight: 400, color: '#5AC8FA' }}>
                Descending into the deep.
              </span>
            </h2>
          </div>

          {/* Middle: Atmospheric Telemetry Cards framing the yacht in deep water */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px',
              margin: '32px 0',
            }}
          >
            {[
              {
                tag: 'PRESSURE · 1.0 ATM',
                val: '10Y Replay',
                desc: 'Tick-by-tick market depth across 10 full years of historical data.',
              },
              {
                tag: 'SONAR SENSING',
                val: 'AI Pre-Trade Guard',
                desc: 'Real-time physiological risk audit before order transmission.',
              },
              {
                tag: 'ABYSSAL BOUNDARY',
                val: 'Prop Guardian',
                desc: 'Trailing drawdown alerts calibrated to funded challenge rules.',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(8,18,32,0.5)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(95,212,232,0.18)',
                  borderRadius: '20px',
                  padding: '24px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', fontWeight: 700, color: '#5AC8FA', letterSpacing: '0.15em', marginBottom: '8px' }}>
                  {item.tag}
                </div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', fontWeight: 500, color: '#F4EFE6', marginBottom: '6px' }}>
                  {item.val}
                </div>
                <div style={{ fontSize: '13px', lineHeight: 1.5, color: 'rgba(244,239,230,0.7)' }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>

          {/* Down Side: Submersion Callout & Downward Arrow Cue at the bottom */}
          <div
            style={{
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: '#5AC8FA',
                opacity: 0.9,
              }}
            >
              · · · SUBMERGE BENEATH THE SURFACE · · ·
            </div>
            <h3
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 'clamp(28px, 3.6vw, 48px)',
                fontWeight: 400,
                fontStyle: 'italic',
                color: '#F4EFE6',
                margin: 0,
                textShadow: '0 2px 20px rgba(0,0,0,0.7)',
              }}
            >
              From open waters to predator depths.
            </h3>
            <p
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: '14px',
                color: 'rgba(244,239,230,0.72)',
                maxWidth: '520px',
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              Descending beneath the waves into institutional liquidity sweeps, precision tick analytics, and apex market execution.
            </p>
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", color: '#5AC8FA', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                DIVE TO STRIKE ↓
              </span>
              <div style={{ width: 1, height: 42, background: 'linear-gradient(180deg, #5AC8FA, transparent)' }} />
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
