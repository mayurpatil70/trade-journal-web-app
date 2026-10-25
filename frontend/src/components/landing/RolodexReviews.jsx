// frontend/src/components/landing/RolodexReviews.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Star, ShieldCheck, ChevronLeft, ChevronRight, Zap } from 'lucide-react';

const REVIEWS = [
  {
    id: 0,
    initial: 'A',
    name: 'Alex P.',
    firm: 'Funded $100k FTMO · UK',
    tag: 'DRAWDOWN GUARDIAN',
    quote: 'The AI coach blocked my revenge trade on Gold after a loss. Literally saved my FTMO challenge from drawdown breach.',
    highlightColor: '#10b981',
  },
  {
    id: 1,
    initial: 'S',
    name: 'Sarah J.',
    firm: 'Funded $300k Topstep · India',
    tag: '10-YR TICK REPLAY',
    quote: '10-year tick replay is the closest thing to live market execution. Backtested my entire London session edge in one weekend.',
    highlightColor: '#10b981',
  },
  {
    id: 2,
    initial: 'M',
    name: 'Mike T.',
    firm: 'Funded Apex Trader · USA',
    tag: 'AUTOMATED R-MULTIPLE',
    quote: 'Replaced three separate messy spreadsheets. Automated R-multiple and drawdown alerts keep my risk airtight every day.',
    highlightColor: '#10b981',
  },
  {
    id: 3,
    initial: 'R',
    name: 'Ravi K.',
    firm: 'Funded $200k FundingPips · Dubai',
    tag: 'PRE-TRADE AI CHECK',
    quote: 'The psychology pre-check forces me to pause before executing FOMO setups. Zero rule violations in over four months.',
    highlightColor: '#ec4899',
  },
  {
    id: 4,
    initial: 'J',
    name: 'James L.',
    firm: 'Funded $50k FTMO · Australia',
    tag: 'PROFIT FACTOR 2.1',
    quote: 'Realized I was cutting winners too early on EURUSD. Fixed my trade management and my profit factor jumped from 1.4 to 2.1.',
    highlightColor: '#059669',
  },
];

const SHUFFLE_INTERVAL = 3500; // 3.5s per requirement

export default function RolodexReviews() {
  const [order, setOrder] = useState([0, 1, 2, 3, 4]);
  const [isFlying, setIsFlying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  // Dragging state for mobile swipe / desktop drag
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const stageRef = useRef(null);

  const shuffleNext = useCallback(() => {
    if (isFlying) return;
    setIsFlying(true);

    setTimeout(() => {
      setOrder((prev) => {
        const next = [...prev];
        const top = next.shift();
        next.push(top);
        return next;
      });
      setIsFlying(false);
    }, 280);
    setProgress(0);
  }, [isFlying]);

  const shufflePrev = useCallback(() => {
    if (isFlying) return;
    setIsFlying(true);

    setTimeout(() => {
      setOrder((prev) => {
        const next = [...prev];
        const back = next.pop();
        next.unshift(back);
        return next;
      });
      setIsFlying(false);
    }, 200);
    setProgress(0);
  }, [isFlying]);

  // 3.5s auto shuffle timer with smooth progress bar
  useEffect(() => {
    if (isPaused || isDragging) return;

    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / SHUFFLE_INTERVAL) * 100, 100);
      setProgress(pct);

      if (elapsed >= SHUFFLE_INTERVAL) {
        shuffleNext();
      }
    }, 60);

    return () => clearInterval(interval);
  }, [isPaused, isDragging, shuffleNext, order]);

  // Touch & Pointer Gesture Handlers (Mobile-first drag)
  const handlePointerDown = (e) => {
    if (isFlying) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

    dragStartRef.current = { x: clientX, y: clientY };
    setIsDragging(true);
    setIsPaused(true);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

    const dx = clientX - dragStartRef.current.x;
    const dy = clientY - dragStartRef.current.y;
    setDragOffset({ x: dx, y: dy });
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    setIsPaused(false);

    const threshold = 60;
    if (Math.abs(dragOffset.x) > threshold || dragOffset.y < -threshold) {
      // Trigger card cycle
      shuffleNext();
    }
    setDragOffset({ x: 0, y: 0 });
  };

  return (
    <section
      id="reviews"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '75vh',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 'clamp(60px, 8vh, 90px) 16px clamp(40px, 6vh, 60px)',
        overflow: 'hidden',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        backgroundColor: '#060b11',
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Soft Glow */}
      <div
        style={{
          position: 'absolute',
          top: '35%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'clamp(300px, 55vw, 650px)',
          height: 'clamp(300px, 55vw, 650px)',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, rgba(201, 169, 110, 0.05) 50%, transparent 70%)',
          filter: 'blur(70px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Header */}
      <div style={{ maxWidth: '640px', margin: '0 auto 28px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#10b981',
            padding: '5px 14px',
            borderRadius: '999px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.22)',
            marginBottom: '14px',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <ShieldCheck size={13} color="#10b981" />
          <span>04 SOCIAL PROOF · 5-CARD DECK</span>
        </div>

        <h2
          style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 'clamp(2.2rem, 4.5vw, 3.5rem)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            lineHeight: 1.08,
            color: '#FFFFFF',
            marginBottom: '10px',
          }}
        >
          Real Funded Traders.<br />
          <span style={{ fontStyle: 'italic', color: '#c9a96e' }}>Zero Filter.</span>
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '3px' }}>
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={15} color="#fbbf24" fill="#fbbf24" />
            ))}
          </div>
          <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', fontFamily: "'JetBrains Mono', monospace" }}>
            4.9 / 5.0 (128+ verified traders)
          </span>
        </div>
      </div>

      {/* 5-Card Stacked Deck Stage */}
      <div
        ref={stageRef}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '430px',
          height: '240px',
          margin: '0 auto 28px',
          perspective: '1000px',
          touchAction: 'pan-y',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          zIndex: 10,
        }}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      >
        {REVIEWS.map((review) => {
          const position = order.indexOf(review.id);
          const isTop = position === 0;

          // Physics offsets per deck depth level
          let translateY = position * 14;
          let scale = 1 - position * 0.05;
          let rotate = position === 0 ? 0 : position % 2 === 1 ? 1.5 : -1.5;
          let opacity = position === 0 ? 1 : Math.max(0.3, 1 - position * 0.17);
          let zIndex = 5 - position;

          // If top card is actively dragged or flying
          let currentTransform = `translate3d(0, ${translateY}px, 0) scale(${scale}) rotate(${rotate}deg)`;

          if (isTop && isDragging) {
            const rotDeg = dragOffset.x * 0.08;
            currentTransform = `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) scale(1.02) rotate(${rotDeg}deg)`;
          } else if (isTop && isFlying) {
            currentTransform = `translate3d(0, -90px, 0) scale(0.96) rotate(-7deg)`;
            opacity = 0.2;
          }

          return (
            <div
              key={review.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                borderRadius: '20px',
                padding: '20px 24px',
                background: 'rgba(14, 23, 38, 0.94)',
                border: '1px solid rgba(255, 255, 255, 0.09)',
                boxShadow: isTop 
                  ? '0 18px 40px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(16, 185, 129, 0.15)'
                  : '0 12px 28px rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                cursor: isTop ? (isDragging ? 'grabbing' : 'grab') : 'default',
                transform: currentTransform,
                opacity: opacity,
                zIndex: zIndex,
                willChange: 'transform, opacity',
                transition: isDragging ? 'none' : 'transform 0.44s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.44s cubic-bezier(0.16, 1, 0.3, 1)',
                pointerEvents: isTop ? 'auto' : 'none',
                boxSizing: 'border-box',
              }}
            >
              {/* Card Top: Avatar initial, Name, 5 Stars */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '11px',
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(201, 169, 110, 0.2))',
                      border: '1.5px solid rgba(16, 185, 129, 0.45)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '1.1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {review.initial}
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>
                      {review.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#10b981', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                      {review.firm}
                    </div>
                  </div>
                </div>

                {/* 5 Stars */}
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[...Array(5)].map((_, s) => (
                    <Star key={s} size={14} color="#fbbf24" fill="#fbbf24" />
                  ))}
                </div>
              </div>

              {/* 2-Line Quote */}
              <p
                style={{
                  fontSize: '13px',
                  lineHeight: 1.5,
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontStyle: 'italic',
                  marginBottom: '12px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  minHeight: '2.8em',
                }}
              >
                "{review.quote}"
              </p>

              {/* Card Footer: Tag Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  paddingTop: '10px',
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.45)',
                }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '10px',
                    fontWeight: 700,
                    color: review.highlightColor,
                  }}
                >
                  <Zap size={10} />
                  <span>{review.tag}</span>
                </div>
                <span>Verified Trader</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls: Prev, Dots, Next */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', position: 'relative', zIndex: 10 }}>
        <button
          onClick={shufflePrev}
          type="button"
          aria-label="Previous Review"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#ffffff',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <ChevronLeft size={16} />
        </button>

        {/* 5 Dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          {REVIEWS.map((_, idx) => {
            const isActive = order[0] === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setOrder((prev) => {
                    const next = [...prev];
                    while (next[0] !== idx) {
                      next.push(next.shift());
                    }
                    return next;
                  });
                  setProgress(0);
                }}
                aria-label={`Jump to review ${idx + 1}`}
                style={{
                  width: isActive ? '22px' : '7px',
                  height: '7px',
                  borderRadius: '999px',
                  background: isActive ? '#10b981' : 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: isActive ? '0 0 8px rgba(16, 185, 129, 0.5)' : 'none',
                }}
              />
            );
          })}
        </div>

        <button
          onClick={shuffleNext}
          type="button"
          aria-label="Next Review"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#ffffff',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* 3.5s auto shuffle timer track */}
      <div
        style={{
          marginTop: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '11px',
          fontFamily: "'JetBrains Mono', monospace",
          color: 'rgba(255, 255, 255, 0.4)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <span>Auto-shuffles every 3.5s · Swipe on mobile</span>
        <div style={{ width: '50px', height: '3px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '999px', overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: '#10b981', transition: 'width 0.06s linear' }} />
        </div>
      </div>
    </section>
  );
}
