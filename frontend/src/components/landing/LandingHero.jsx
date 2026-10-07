// src/components/landing/LandingHero.jsx
// The main hero text and 3D candlestick section

import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MessageSquare, Zap, ShieldCheck, Brain, TrendingUp, Calculator } from 'lucide-react';

// Lazy load Three.js scene only on desktop
const CandlestickScene = lazy(() => import('./CandlestickScene'));

// "What you get" hint chips shown in hero
const TRADER_HINTS = [
  { icon: Brain, label: 'AI Stops Revenge Trades', color: '#ec4899', bg: 'rgba(236,72,153,0.1)', border: 'rgba(236,72,153,0.25)' },
  { icon: ShieldCheck, label: 'Prop Firm Drawdown Auto-Tracked', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
  { icon: Calculator, label: 'Instant Lot Size Sizing', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
  { icon: TrendingUp, label: 'R-Multiple Analytics Engine', color: '#059669', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
];

const LIVE_FEEDS = [
  { id: 1, title: 'AI Blocked Trade', detail: 'Revenge trade detected', time: 'Just now', color: '#ec4899' },
  { id: 2, title: 'Prop Limit Alert', detail: '75% daily drawdown', time: '2m ago', color: '#10b981' },
  { id: 3, title: 'Trade Logged', detail: '+4.2R Win (EURUSD)', time: '5m ago', color: '#10b981' },
  { id: 4, title: 'AI Insight', detail: 'You perform best in London session', time: '12m ago', color: '#059669' },
  // Duplicates for seamless infinite marquee scroll
  { id: 5, title: 'AI Blocked Trade', detail: 'Revenge trade detected', time: 'Just now', color: '#ec4899' },
  { id: 6, title: 'Prop Limit Alert', detail: '75% daily drawdown', time: '2m ago', color: '#10b981' },
  { id: 7, title: 'Trade Logged', detail: '+4.2R Win (EURUSD)', time: '5m ago', color: '#10b981' },
  { id: 8, title: 'AI Insight', detail: 'You perform best in London session', time: '12m ago', color: '#059669' },
];

export default function LandingHero() {
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
  
  // Create a dummy ref object to pass to CandlestickScene since it expects a scrollProgress ref
  // but we removed the GSAP pinning here. It will just default to 0.
  const dummyProgress = { current: 0 };

  return (
    <div style={{ position: 'relative', overflow: 'hidden', paddingTop: '80px', paddingBottom: '100px' }}>
      <div
        className="flex flex-col items-center justify-center px-5"
        style={{ minHeight: '50vh' }}
      >
        {/* Text + 3D Row */}
        <div
          className="flex flex-col md:flex-row items-center justify-center"
          style={{
            width: '100%',
            maxWidth: '1100px',
            gap: '40px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* 3D Candlestick - Desktop Only */}
          <div
            className="hidden md:block order-2 md:order-1"
            style={{ width: '220px', height: '200px', flexShrink: 0 }}
          >
            {isDesktop && (
              <Suspense fallback={<div style={{ width: '100%', height: '100%' }} />}>
                <CandlestickScene scrollProgress={dummyProgress} />
              </Suspense>
            )}
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
              fontSize: 'clamp(2.5rem, 6vw, 4.2rem)',
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              color: 'white',
              marginBottom: '20px',
            }}>
              Stop Bleeding Capital<br />
              <span style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #10b981 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                to Emotional Mistakes.
              </span>
            </h1>

            <p style={{
              fontSize: 'clamp(14px, 1.5vw, 16px)',
              color: 'rgba(255,255,255,0.6)',
              lineHeight: 1.6,
              marginBottom: '32px',
              maxWidth: '520px',
            }}>
              The only trading journal for Forex, Crypto, and Gold that pairs your chart setups with an <strong style={{ color: 'rgba(255,255,255,0.8)' }}>AI psychology guard</strong>, <strong style={{ color: 'rgba(255,255,255,0.8)' }}>prop firm rule tracking</strong>, and <strong style={{ color: 'rgba(255,255,255,0.8)' }}>automated R-multiple analytics</strong> — all for a one-time $11Access Now.
            </p>

            {/* Trader Hint Chips */}
            <div className="flex flex-wrap justify-center md:justify-start" style={{ gap: '8px', marginBottom: '32px' }}>
              {TRADER_HINTS.map(({ icon: Icon, label, color, bg, border }) => (
                <div key={label} style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '10px',
                  background: bg,
                  border: `1px solid ${border}`,
                  fontSize: '11px',
                  color: color,
                  fontWeight: 600,
                  letterSpacing: '0.01em',
                }}>
                  <Icon size={12} />
                  {label}
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center md:justify-start" style={{ gap: '14px' }}>
              <Link
                to="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '14px 32px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #10b981, #047857)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 800,
                  textDecoration: 'none',
                  boxShadow: '0 8px 32px rgba(16,185,129,0.4), 0 0 0 1px rgba(16,185,129,0.3)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  letterSpacing: '0.01em',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 16px 40px rgba(16,185,129,0.5), 0 0 0 1px rgba(16,185,129,0.4)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(16,185,129,0.4), 0 0 0 1px rgba(16,185,129,0.3)';
                }}
              >
                <Zap size={16} />
                Unlock Your Access Now
                <ArrowRight size={16} />
              </Link>
              <a
                href="https://discord.gg/Ajaw3AjfWE"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px 26px',
                  borderRadius: '14px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '14px',
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
                <MessageSquare size={16} color="#5865F2" />
                Join Trader Discord
              </a>
            </div>
          </div>
        </div>

        {/* Floating Live Feed Cards (Right Side) */}
        <div className="hidden xl:block absolute right-4 top-1/2" style={{ transform: 'translateY(-50%)', width: '260px', height: '400px', overflow: 'hidden', zIndex: 0, opacity: 0.7, pointerEvents: 'none' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            animation: 'floatUp 25s linear infinite',
          }}>
            {LIVE_FEEDS.map((feed) => (
              <div key={feed.id} style={{
                padding: '16px',
                background: 'rgba(255,255,255,0.03)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '16px',
                borderLeft: `4px solid ${feed.color}`,
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              }}>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>{feed.time}</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'white', marginBottom: '4px', letterSpacing: '-0.02em' }}>{feed.title}</div>
                <div style={{ fontSize: '12px', color: feed.color, fontWeight: 500 }}>{feed.detail}</div>
              </div>
            ))}
          </div>
          {/* Gradient masks for smooth fade at top/bottom */}
          <div style={{ position: 'absolute', bottom: 0,
    top: "auto", left: 0, right: 0, height: '80px', background: 'linear-gradient(to bottom, #000, transparent)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px', background: 'linear-gradient(to top, #000, transparent)' }} />
        </div>
      </div>
    </div>
  );
}
