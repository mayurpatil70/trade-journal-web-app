// frontend/src/components/landing/LiquidGlassCarousel.jsx
// High-Performance Auto-Sliding Workspace Showcase (Lightweight CSS 3D/Translate — Zero WebGL Lag)

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import IridescentButton from './IridescentButton';

const DEFAULT_SLIDES = [
  {
    src: '/screenshots/screenshot_1_dashboard.png',
    title: 'Digital Trading Journal',
    sub: 'Account-Wise Real-Time Data Renders',
    badge: 'Live Dashboard',
    color: '#10B981',
  },
  {
    src: '/screenshots/screenshot_2_multiaccount.png',
    title: 'Multi-Account Trade Logging',
    sub: 'Made for Prop Firm Traders',
    badge: 'Trade Logger',
    color: '#3B82F6',
  },
  {
    src: '/screenshots/screenshot_3_livecharts.png',
    title: 'Real-Time TradingView Charts',
    sub: 'Live Charts of All Assets',
    badge: 'Live Market',
    color: '#EC4899',
  },
  {
    src: '/screenshots/screenshot_4_barreplay.png',
    title: '10-Year Candlestick Bar Replay',
    sub: 'Tick-by-Tick Multi-Timeframe Simulator',
    badge: 'Backtesting',
    color: '#F59E0B',
  },
  {
    src: '/screenshots/screenshot_5_calculator.png',
    title: 'Lot Size & Prop Guardian',
    sub: 'Precision Pip Sizing & Drawdown Protection',
    badge: 'Risk Engine',
    color: '#8B5CF6',
  },
];

export default function LiquidGlassCarousel({ userImages = null }) {
  const slides = userImages && userImages.length >= 3 ? userImages : DEFAULT_SLIDES;
  const n = slides.length;

  // Clone 3 sets for continuous seamless looping without warp/teleport glitches
  const items = [...slides, ...slides, ...slides];

  // Start in the middle set (index n = 5 for 5 slides)
  const [currentIndex, setCurrentIndex] = useState(n);
  const [withTransition, setWithTransition] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isInView, setIsInView] = useState(true);

  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  // Active slide in the original 0..n-1 range
  const activeSlideIndex = ((currentIndex % n) + n) % n;
  const activeSlide = slides[activeSlideIndex] || slides[0];

  // Measure container width for fluid responsive card positioning
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateWidth = () => {
      setContainerWidth(el.clientWidth || window.innerWidth);
    };

    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Responsive card dimensions
  const isMobile = containerWidth < 640;
  const isTablet = containerWidth < 1024;
  const cardWidth = isMobile
    ? Math.min(containerWidth * 0.88, 380)
    : isTablet
    ? Math.min(containerWidth * 0.75, 680)
    : Math.min(containerWidth * 0.62, 820);
  const gap = isMobile ? 14 : 24;
  const step = cardWidth + gap;

  // Center the active card in the container
  const trackOffset = containerWidth / 2 - cardWidth / 2 - currentIndex * step;

  // Auto sliding navigation (advances from right to left every 2 seconds)
  const slideNext = useCallback(() => {
    setWithTransition(true);
    setCurrentIndex((prev) => prev + 1);
  }, []);

  const slidePrev = useCallback(() => {
    setWithTransition(true);
    setCurrentIndex((prev) => prev - 1);
  }, []);

  const goToSlide = useCallback((targetIdx) => {
    setWithTransition(true);
    const diff = targetIdx - activeSlideIndex;
    setCurrentIndex((prev) => prev + diff);
  }, [activeSlideIndex]);

  // Handle loop boundary resets seamlessly after transition ends
  const handleTransitionEnd = () => {
    if (currentIndex >= n * 2) {
      // Reached end of 2nd set -> snap back to 1st set clone
      setWithTransition(false);
      setCurrentIndex(currentIndex - n);
    } else if (currentIndex < n) {
      // Reached before 1st set -> snap forward to 2nd set clone
      setWithTransition(false);
      setCurrentIndex(currentIndex + n);
    }
  };

  // Re-enable transition after seamless instant reset
  useEffect(() => {
    if (!withTransition) {
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setWithTransition(true);
        });
      });
      return () => cancelAnimationFrame(id);
    }
  }, [withTransition]);

  // 2-second auto-slide timer (sliding cards right to left every 2s)
  useEffect(() => {
    if (isPaused || !isInView) return;

    const timer = setInterval(() => {
      slideNext();
    }, 2000);

    return () => clearInterval(timer);
  }, [isPaused, isInView, slideNext]);

  // Pause when scrolled out of view to preserve device performance
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Keyboard navigation when hovered
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isPaused) return;
      if (e.key === 'ArrowRight') slideNext();
      if (e.key === 'ArrowLeft') slidePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused, slideNext, slidePrev]);

  // Touch swipe gestures
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);

  const handleTouchStart = (e) => {
    setIsPaused(true);
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };

  const handleTouchMove = (e) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (touchDeltaX.current < -40) {
      slideNext();
    } else if (touchDeltaX.current > 40) {
      slidePrev();
    }
  };

  return (
    <section
      id="app-preview"
      style={{
        position: 'relative',
        width: '100%',
        scrollMarginTop: '70px',
        padding: 'clamp(50px, 7vh, 80px) 0 clamp(40px, 5vh, 60px)',
        background: '#060B10',
        color: '#FFFFFF',
        overflow: 'hidden',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Header Info */}
      <div style={{ maxWidth: '900px', margin: '0 auto 28px', textAlign: 'center', padding: '0 20px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 14px',
            borderRadius: '999px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            fontSize: '10px',
            color: '#10B981',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: '16px',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981', flexShrink: 0 }} />
          <span>Interactive Workspace Showcase</span>
        </div>

        <h2
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(28px, 4.4vw, 48px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            color: '#FFFFFF',
            marginBottom: '12px',
          }}
        >
          Inside the <span style={{ color: '#10B981' }}>Forex Notes Workspace</span>
        </h2>
        <p
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '13px',
            color: 'rgba(255, 255, 255, 0.6)',
            lineHeight: 1.6,
            maxWidth: '560px',
            margin: '0 auto',
          }}
        >
          Auto-sliding showcase of our core analytics views, backtesting simulator, and risk tools.
        </p>
      </div>

      {/* Dynamic Active Title & Subtitle Plate */}
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto 22px',
          textAlign: 'center',
          padding: '0 20px',
          minHeight: '68px',
        }}
      >
        <div
          key={activeSlide.title}
          style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 'clamp(24px, 3.2vw, 38px)',
            fontWeight: 400,
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
            color: '#FFFFFF',
            transition: 'opacity 0.25s ease',
          }}
        >
          {activeSlide.title}
        </div>
        <div
          style={{
            marginTop: '6px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 'clamp(11px, 1.2vw, 13px)',
            color: activeSlide.color || '#0E7C86',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontWeight: 700,
            transition: 'color 0.25s ease',
          }}
        >
          {activeSlide.sub}
        </div>
      </div>

      {/* Sliding Cards Container */}
      <div
        ref={containerRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
          padding: '24px 0 32px',
          cursor: 'grab',
        }}
      >
        {/* Continuous Track (Slides right to left smoothly) */}
        <div
          onTransitionEnd={handleTransitionEnd}
          style={{
            display: 'flex',
            gap: `${gap}px`,
            transform: `translate3d(${trackOffset}px, 0, 0)`,
            transition: withTransition
              ? 'transform 500ms cubic-bezier(0.2, 0.8, 0.2, 1)'
              : 'none',
            willChange: 'transform',
          }}
        >
          {items.map((slide, i) => {
            const isActive = i === currentIndex;
            const isPrev = i === currentIndex - 1;
            const isNext = i === currentIndex + 1;

            return (
              <div
                key={i}
                onClick={() => {
                  if (isPrev) slidePrev();
                  if (isNext) slideNext();
                }}
                style={{
                  flexShrink: 0,
                  width: `${cardWidth}px`,
                  borderRadius: '16px',
                  background: '#0B121A',
                  border: `1px solid ${isActive ? slide.color + '55' : 'rgba(255, 255, 255, 0.08)'}`,
                  overflow: 'hidden',
                  transform: `scale(${isActive ? 1 : 0.92})`,
                  opacity: isActive ? 1 : 0.45,
                  filter: isActive ? 'none' : 'brightness(0.7)',
                  boxShadow: isActive
                    ? `0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 35px -10px ${slide.color}35`
                    : '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
                  transition: withTransition
                    ? 'transform 500ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 500ms ease, filter 500ms ease, border-color 500ms ease, box-shadow 500ms ease'
                    : 'none',
                  cursor: isActive ? 'default' : 'pointer',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                }}
              >
                {/* Window Chrome Header Bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 16px',
                    background: '#0F1A24',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }} />
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                    <span
                      style={{
                        marginLeft: '12px',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'rgba(255, 255, 255, 0.65)',
                        letterSpacing: '0.05em',
                      }}
                    >
                      FOREX NOTES — {slide.badge.toUpperCase()}
                    </span>
                  </div>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: `${slide.color}15`,
                      border: `1px solid ${slide.color}35`,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '10px',
                      fontWeight: 700,
                      color: slide.color,
                      letterSpacing: '0.08em',
                    }}
                  >
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: slide.color }} />
                    LIVE VIEW
                  </span>
                </div>

                {/* Screenshot Image Container */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '1024 / 500',
                    background: '#060B10',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={slide.src}
                    alt={slide.title}
                    loading="eager"
                    decoding="async"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Edge Navigation Buttons */}
        <button
          type="button"
          onClick={slidePrev}
          aria-label="Previous slide"
          style={{
            position: 'absolute',
            left: 'clamp(10px, 2.5vw, 28px)',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: 'rgba(11, 18, 26, 0.88)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 20,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
            transition: 'background 0.2s, border-color 0.2s',
          }}
        >
          <ArrowLeft size={18} />
        </button>

        <button
          type="button"
          onClick={slideNext}
          aria-label="Next slide"
          style={{
            position: 'absolute',
            right: 'clamp(10px, 2.5vw, 28px)',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: 'rgba(11, 18, 26, 0.88)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 20,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
            transition: 'background 0.2s, border-color 0.2s',
          }}
        >
          <ArrowRight size={18} />
        </button>
      </div>

      {/* Slide Indicator Dots */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginTop: '12px',
        }}
      >
        {slides.map((slide, idx) => {
          const isSelected = idx === activeSlideIndex;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => goToSlide(idx)}
              aria-label={`Go to slide ${idx + 1}: ${slide.title}`}
              style={{
                width: isSelected ? '28px' : '8px',
                height: '8px',
                borderRadius: '999px',
                background: isSelected ? slide.color : 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                boxShadow: isSelected ? `0 0 10px ${slide.color}80` : 'none',
              }}
            />
          );
        })}
      </div>

      {/* Bottom CTA Pill */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '28px',
        }}
      >
        <IridescentButton to="/login" size="md">
          EXPLORE ALL 5 WORKSPACES
        </IridescentButton>
      </div>

      {/* Live In-App Screenshots Status */}
      <div
        style={{
          maxWidth: '680px',
          margin: '24px auto 0',
          padding: '12px 20px',
          borderRadius: '12px',
          background: 'rgba(15, 29, 28, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '11px',
          color: 'rgba(237, 234, 227, 0.85)',
        }}
      >
        <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#0E7C86', verticalAlign: '1px', marginRight: '8px' }} />
        <span>Live in-app screenshots active: Multi-account journal, TradingView charts, 10-year bar replay and drawdown calculator.</span>
      </div>
    </section>
  );
}
