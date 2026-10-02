// src/components/landing/FeaturesBento.jsx
// Scroll-revealed glassmorphism bento grid with GSAP ScrollTrigger.batch

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { Brain, ShieldCheck, Calculator, TrendingUp, Layers, Calendar } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    icon: Brain,
    title: 'AI Pre-Trade Psychology Guard',
    description: 'Before every trade, the AI scans your emotional state — detecting FOMO and revenge trading urges. If you\'re tilted trading XAUUSD or Bitcoin, it blocks you from a costly mistake.',
    tag: 'Protect Your Edge',
    color: '#ec4899',
    bg: 'rgba(236,72,153,0.08)',
    border: 'rgba(236,72,153,0.2)',
    glow: 'rgba(236,72,153,0.15)',
    detail: '23 traders avoided blown accounts this month',
    wide: true,
  },
  {
    icon: ShieldCheck,
    title: 'Prop Firm Challenge Guardian',
    description: 'Track daily drawdown, trailing max loss, and profit targets across every evaluation phase. Get breach alerts before you fail your prop firm challenge.',
    tag: 'Rule Compliance',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.2)',
    glow: 'rgba(16,185,129,0.12)',
    detail: 'Supports FTMO, Apex, MyFundedFX, The5ers',
  },
  {
    icon: Calculator,
    title: 'Precision Lot Size & Pip Calculator',
    description: 'Calculate exact position sizes instantly based on your account balance, risk percentage, and instrument tick value. Perfect for Forex, Gold (XAUUSD), and Crypto markets.',
    tag: 'Precision Sizing',
    color: '#2f8df4',
    bg: 'rgba(47,141,244,0.08)',
    border: 'rgba(47,141,244,0.2)',
    glow: 'rgba(47,141,244,0.12)',
    detail: '0.01 lot precision for Forex & Crypto',
  },
  {
    icon: TrendingUp,
    title: 'Net R & Distribution Analytics',
    description: 'Deep-dive win rate by setup type, session (London/NY/Asia), and R-multiple distribution. See exactly what\'s working and what\'s killing your edge.',
    tag: 'Data Driven',
    color: '#22d3ee',
    bg: 'rgba(34,211,238,0.08)',
    border: 'rgba(34,211,238,0.2)',
    glow: 'rgba(34,211,238,0.12)',
    detail: 'Avg users identify their #1 losing setup in 7 days',
    wide: true,
  },
  {
    icon: Layers,
    title: 'Before/After Chart Archive',
    description: 'Upload pre-entry and post-exit screenshots to build a visual evidence archive of your playbook setups. Build an undeniable track record.',
    tag: 'Visual Journal',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.2)',
    glow: 'rgba(167,139,250,0.12)',
    detail: 'Unlimited cloud storage included',
  },
  {
    icon: Calendar,
    title: 'Daily P&L Performance Calendar',
    description: 'Color-coded heatmap of every trading day. Instantly spot your winning streaks, danger sessions, and consistency patterns at a glance.',
    tag: 'P&L Heatmap',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
    glow: 'rgba(245,158,11,0.12)',
    detail: 'Identifies your most dangerous trading days',
  },
];

export default function FeaturesBento() {
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header reveal
      gsap.fromTo(
        '.features-header',
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.features-header',
            start: 'top 85%',
          },
        }
      );

      // Cards staggered reveal
      ScrollTrigger.batch('.feature-card', {
        start: 'top 88%',
        onEnter: (batch) => {
          gsap.fromTo(
            batch,
            { opacity: 0, y: 60, scale: 0.96 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.7,
              stagger: 0.12,
              ease: 'power3.out',
            }
          );
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="features"
      style={{
        padding: '100px 20px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(0,0,0,0.4)',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div className="features-header" style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 64px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 14px',
            borderRadius: '999px',
            background: 'rgba(47,141,244,0.1)',
            border: '1px solid rgba(47,141,244,0.25)',
            fontSize: '10px',
            color: '#2f8df4',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '16px',
          }}>
            ⚡ Core Features
          </div>
          <h2 style={{
            fontSize: 'clamp(1.8rem, 4vw, 3rem)',
            fontWeight: 900,
            color: 'white',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            marginBottom: '16px',
          }}>
            Everything Funded Traders<br />
            <span style={{
              background: 'linear-gradient(135deg, #2f8df4, #22d3ee)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Need to Stay Funded
            </span>
          </h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>
            Traditional spreadsheets leave you blind to emotional patterns and prop firm limits.
            Forex Notes automates all of it so you can focus on execution.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            const isWide = f.wide;
            return (
              <div
                key={i}
                className={`feature-card h-full flex flex-col ${isWide ? 'md:col-span-2' : 'col-span-1'}`}
                style={{
                  background: 'rgba(12,16,24,0.7)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: `1px solid ${f.border}`,
                  borderRadius: '20px',
                  padding: '28px',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'default',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = `0 20px 60px ${f.glow}, 0 0 0 1px ${f.border}`;
                  e.currentTarget.style.borderColor = f.color + '50';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = f.border;
                }}
              >
                {/* Background glow on hover area */}
                <div style={{
                  position: 'absolute',
                  top: '-40px',
                  right: '-40px',
                  width: '200px',
                  height: '200px',
                  background: `radial-gradient(ellipse, ${f.glow} 0%, transparent 70%)`,
                  pointerEvents: 'none',
                }} />

                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    background: f.bg,
                    border: `1px solid ${f.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={20} color={f.color} />
                  </div>
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: f.color,
                    background: f.bg,
                    border: `1px solid ${f.border}`,
                    padding: '4px 10px',
                    borderRadius: '20px',
                  }}>
                    {f.tag}
                  </span>
                </div>

                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  color: 'white',
                  marginBottom: '10px',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.3,
                }}>
                  {f.title}
                </h3>

                <div className="flex-1">
                  <p style={{
                    fontSize: '13px',
                    color: 'rgba(255,255,255,0.45)',
                    lineHeight: 1.65,
                    marginBottom: '16px',
                  }}>
                    {f.description}
                  </p>
                </div>

                {/* Trader hint detail */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '10px',
                  color: f.color,
                  fontWeight: 600,
                  opacity: 0.8,
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: f.color, display: 'inline-block' }} />
                  {f.detail}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
