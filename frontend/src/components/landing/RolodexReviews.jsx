// frontend/src/components/landing/RolodexReviews.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Star, Zap, ShieldCheck } from 'lucide-react';

const TRADERS = [
  {
    photo: '/trader_alex.png',
    name: 'Alex P.',
    firm: 'Funded $100k FTMO',
    flag: '🇬🇧',
    text: 'The AI coach literally saved my FTMO challenge. I was tilted on XAUUSD and about to revenge trade after a -2R loss. It blocked me before I could breach my daily limit.',
    highlight: 'Saved FTMO Daily Drawdown',
    highlightColor: '#10b981',
  },
  {
    photo: '/trader_sarah.png',
    name: 'Sarah J.',
    firm: 'Funded $300k Topstep',
    flag: '🇮🇳',
    text: 'Prop firm guardian is a game changer for futures and crypto. I never manually calculate my drawdown limits again. It alerts me at 70% of my trailing max loss.',
    highlight: 'Zero rule breaches in 3 months',
    highlightColor: '#10b981',
  },
  {
    photo: '/trader_mike.png',
    name: 'Mike T.',
    firm: 'Phase 2 Apex Trader',
    flag: '🇺🇸',
    text: 'The lot size calculator is wicked fast for Bitcoin and NAS100. Having it integrated right next to my journal — no more switching between spreadsheets mid-session.',
    highlight: 'Saves 45 min per trading day',
    highlightColor: '#10b981',
  },
  {
    photo: '/trader_ravi.png',
    name: 'Ravi K.',
    firm: 'Funded $200k FundingPips',
    flag: '🇮🇳',
    text: 'Finally stopped over-leveraging on Gold. The psychology pre-check forces you to pause and assess before execution. It catches my FOMO every single time.',
    highlight: '0 revenge trades since joining',
    highlightColor: '#ec4899',
  },
  {
    photo: '/trader_james.png',
    name: 'James L.',
    firm: 'Funded $50k FTMO',
    flag: '🇦🇺',
    text: 'R-multiple tracking showed I was leaving a ton of money on the table exiting XAUUSD early. Fixed my exits in 2 weeks after seeing my data. My PF jumped from 1.4 to 2.1.',
    highlight: 'PF jumped from 1.4 → 2.1 in 2 weeks',
    highlightColor: '#059669',
  },
  {
    photo: '/trader_nina.png',
    name: 'Nina B.',
    firm: 'Funded $100k MyFundedFX',
    flag: '🇷🇴',
    text: 'Switching from Notion to this saved my funded account. The calendar heatmap showed me I should never trade Crypto on weekends — insight paid for this tool 100x.',
    highlight: 'Identified her worst trading day',
    highlightColor: '#f59e0b',
  },
];

// Generate 22 cards around the wheel
const CARDS_22 = Array.from({ length: 22 }, (_, i) => ({
  ...TRADERS[i % TRADERS.length],
  id: i,
}));

export default function RolodexReviews() {
  const stageRef = useRef(null);
  const cardRefs = useRef([]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    let animId;
    let rotation = 0;
    let vel = 0.0045;
    const TAU = Math.PI * 2;
    const NUM_CARDS = 22;

    let dragging = false;
    let lastX = 0;

    const onPointerDown = (e) => {
      dragging = true;
      lastX = e.clientX;
      vel = 0;
      stage.setPointerCapture?.(e.pointerId);
    };

    const onPointerMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      const deltaRot = dx * 0.0045;
      rotation += deltaRot;
      vel = deltaRot;
    };

    const onPointerUp = (e) => {
      if (!dragging) return;
      dragging = false;
      try {
        stage.releasePointerCapture?.(e.pointerId);
      } catch (err) {}
    };

    stage.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    let isVisible = false;

    const tick = () => {
      if (!isVisible) return;

      const rect = stage.getBoundingClientRect();
      const stageW = rect.width;
      const stageH = rect.height;
      if (!stageW || !stageH) {
        animId = requestAnimationFrame(tick);
        return;
      }
      const isMobile = stageW < 640;
      const R = (isMobile ? 0.38 : 0.62) * Math.min(stageW, stageH);
      const yTilt = isMobile ? 0.28 : 0.42;

      // If not dragging, apply velocity and ease back toward idle drift 0.0045
      if (!dragging) {
        rotation += vel;
        vel += (0.0045 - vel) * 0.02;
      }

      // Calculate each card's coordinates
      const cardData = [];
      for (let i = 0; i < NUM_CARDS; i++) {
        const a = rotation + (i / NUM_CARDS) * TAU;
        const x = Math.sin(a) * R;
        const z = Math.cos(a) * R;
        const y = -Math.cos(a) * R * yTilt; // The tilt derived from z
        const depth = (z / R + 1) / 2; // 0 at back, 1 at front

        cardData.push({
          idx: i,
          x,
          y,
          z,
          depth,
          rotDeg: Math.sin(a) * (isMobile ? 8 : 14),
          opacity: isMobile ? (0.2 + depth * 0.8) : (0.25 + depth * 0.75),
          scale: isMobile ? (0.62 + depth * 0.45) : (0.55 + depth * 0.55),
        });
      }

      // Sort cards by z ascending so browser resolves overlaps correctly
      cardData.sort((a, b) => a.z - b.z);

      // Apply transforms & z-indexes
      cardData.forEach((item, sortedZIndex) => {
        const el = cardRefs.current[item.idx];
        if (el) {
          el.style.zIndex = String(sortedZIndex + 1);
          el.style.transform = `translate(-50%, -50%) translate3d(${item.x}px, ${item.y}px, 0px) rotate(${item.rotDeg}deg) scale(${item.scale})`;
          el.style.opacity = String(item.opacity);
        }
      });

      animId = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible) {
        cancelAnimationFrame(animId);
        animId = requestAnimationFrame(tick);
      } else {
        cancelAnimationFrame(animId);
      }
    }, { threshold: 0.05 });

    observer.observe(stage);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animId);
      stage.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, []);

  return (
    <section
      id="reviews"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100svh',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 'clamp(60px, 8vh, 85px) 16px clamp(24px, 4vh, 48px)',
        overflow: 'hidden',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      {/* Header */}
      <div style={{ maxWidth: '960px', margin: '0 auto 20px', textAlign: 'center', padding: '0 16px', position: 'relative', zIndex: 10 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#E8732A',
            padding: '5px 14px',
            borderRadius: '999px',
            background: 'rgba(232, 115, 42, 0.1)',
            border: '1px solid rgba(232, 115, 42, 0.25)',
            marginBottom: '12px',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <ShieldCheck size={12} color="#E8732A" />
          <span>04 SOCIAL PROOF · REAL TRADERS</span>
        </div>

        <h2
          style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 'clamp(2.2rem, 4.4vw, 3.6rem)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
            color: '#FFFFFF',
            marginBottom: '8px',
          }}
        >
          3D Rolodex of Funded Traders<br />
          <span style={{ fontStyle: 'italic', color: '#0E7C86' }}>Across 40+ Countries</span>
        </h2>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '8px' }}>
          <div style={{ display: 'flex', gap: '3px' }}>
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={15} color="#E8732A" fill="#E8732A" />
            ))}
          </div>
          <span style={{ fontSize: '12px', color: 'rgba(237, 234, 227, 0.7)', fontFamily: "'JetBrains Mono', monospace" }}>
            4.9 / 5.0 from 3,200+ traders · Drag or throw wheel with momentum
          </span>
        </div>
      </div>

      {/* 3D Rolodex Wheel Stage */}
      <div
        ref={stageRef}
        style={{
          position: 'relative',
          width: '100%',
          height: 'clamp(400px, 48vh, 520px)',
          cursor: 'grab',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'pan-y',
          perspective: '1200px',
        }}
      >
        {CARDS_22.map((card, i) => (
          <div
            key={card.id}
            ref={(el) => (cardRefs.current[i] = el)}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 'clamp(230px, 72vw, 305px)',
              borderRadius: '22px',
              padding: '18px 20px',
              background: 'rgba(15, 29, 28, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.45)',
              transformStyle: 'preserve-3d',
              willChange: 'transform, opacity',
              pointerEvents: 'none',
            }}
          >
            {/* Stars row */}
            <div style={{ display: 'flex', gap: '3px', marginBottom: '10px' }}>
              {[...Array(5)].map((_, s) => (
                <Star key={s} size={12} color="#E8732A" fill="#E8732A" />
              ))}
            </div>

            {/* Review text */}
            <p
              style={{
                fontSize: '12px',
                lineHeight: 1.55,
                color: 'rgba(255, 255, 255, 0.85)',
                marginBottom: '14px',
                fontStyle: 'italic',
              }}
            >
              "{card.text}"
            </p>

            {/* Highlight badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '6px',
                background: `${card.highlightColor}20`,
                border: `1px solid ${card.highlightColor}40`,
                fontSize: '10px',
                fontWeight: 700,
                color: card.highlightColor,
                marginBottom: '14px',
                letterSpacing: '0.02em',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <Zap size={10} />
              <span>{card.highlight}</span>
            </div>

            {/* Author Row with Real Human Photo */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                paddingTop: '12px',
              }}
            >
              <img
                src={card.photo}
                alt={card.name}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid rgba(16, 185, 129, 0.5)',
                  flexShrink: 0,
                  background: 'rgba(255, 255, 255, 0.1)',
                }}
              />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>
                  {card.flag} {card.name}
                </div>
                <div style={{ fontSize: '11px', color: '#10B981', fontWeight: 600, marginTop: '2px', fontFamily: "'JetBrains Mono', monospace" }}>
                  {card.firm}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
