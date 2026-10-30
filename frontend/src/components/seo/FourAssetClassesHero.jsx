import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Zap, Database, TrendingUp, Layers, CheckCircle2 } from 'lucide-react';
import IridescentButton from '../landing/IridescentButton';

const ASSETS = [
  {
    num: '01 · 24/5 FX',
    numColor: '#5AC8FA',
    title: 'Forex Majors',
    desc: 'EURUSD, GBPUSD, USDJPY tick-by-tick replay & London/NY session analytics.',
    icon: TrendingUp,
  },
  {
    num: '02 · HIGH VOL',
    numColor: '#007AFF',
    title: 'Gold (XAUUSD)',
    desc: 'Track Asian, London, and NY breakouts with automated pip-level risk sizing.',
    icon: Zap,
  },
  {
    num: '03 · CASH OPEN',
    numColor: '#5AC8FA',
    title: 'Global Indices',
    desc: 'NAS100, US30, SPX500 high-momentum execution tracking and volume alerts.',
    icon: Layers,
  },
  {
    num: '04 · 24/7 DEEP',
    numColor: '#38BDF8',
    title: 'Crypto Assets',
    desc: 'BTCUSDT, ETHUSDT 10-year bar replay and weekend volatility filters.',
    icon: Database,
  },
];

const LOGS = [
  {
    tag: 'LOG 01 · AI PSYCHOLOGY PRE-CHECK',
    tagColor: '#5AC8FA',
    title: 'Dermal protection against tilt',
    desc: 'Evaluates your emotional heartbeat before execution without drag.',
  },
  {
    tag: 'LOG 02 · 10-YEAR TICK DATA',
    tagColor: '#5AC8FA',
    title: 'A sixth sense for liquidity',
    desc: '10 full years of tick data to identify hidden algorithmic sweeps.',
  },
  {
    tag: 'LOG 03 · PROP GUARDIAN',
    tagColor: '#007AFF',
    title: 'Rules that never fail',
    desc: 'Trailing daily loss monitor ensures your prop challenge is never breached.',
  },
];

export default function FourAssetClassesHero() {
  return (
    <div style={{ width: '100%', marginBottom: '60px' }}>
      {/* ── EYEBROW ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ width: '28px', height: '2px', background: '#007AFF' }} />
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#5AC8FA',
          }}
        >
          MARKETS & SESSIONS · FOUR ASSET CLASSES & PREDATOR SPEED
        </span>
      </div>

      {/* ── HEADLINE ── */}
      <h1
        style={{
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontSize: 'clamp(2.5rem, 5.5vw, 4.2rem)',
          fontWeight: 400,
          color: 'var(--lp-heading)',
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
          marginBottom: '20px',
        }}
      >
        Four asset classes, <span style={{ fontStyle: 'italic', color: '#007AFF' }}>infinite edge.</span>
      </h1>

      {/* ── INTRO PARAGRAPH ── */}
      <p
        style={{
          fontSize: 'clamp(15px, 1.8vw, 17px)',
          color: 'rgba(var(--lp-fg), 0.76)',
          lineHeight: 1.7,
          maxWidth: '720px',
          marginBottom: '40px',
          fontFamily: "'Manrope', sans-serif",
        }}
      >
        Trade the coastline nobody else can reach. Your AI coach plans your risk around market sessions, news events and your emotional state. High probability setups at dawn, disciplined risk at dusk, and zero revenge trading in between.
      </p>

      {/* ── 4 ASSET CARDS GRID ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        {ASSETS.map((asset) => (
          <div
            key={asset.title}
            style={{
              background: 'rgba(var(--lp-card), 0.75)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(var(--lp-fg), 0.08)',
              borderRadius: '20px',
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '160px',
              transition: 'border-color 0.25s ease, transform 0.2s ease, box-shadow 0.25s ease',
              boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(90, 200, 250, 0.35)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 16px 36px rgba(0,0,0,0.35), 0 0 24px rgba(0, 122, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(var(--lp-fg), 0.08)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.25)';
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: asset.numColor,
                  marginBottom: '10px',
                }}
              >
                {asset.num}
              </div>
              <h3
                style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--lp-heading)',
                  marginBottom: '8px',
                  letterSpacing: '-0.01em',
                }}
              >
                {asset.title}
              </h3>
            </div>
            <p
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: '13px',
                color: 'rgba(var(--lp-fg), 0.65)',
                lineHeight: 1.55,
                margin: 0,
              }}
            >
              {asset.desc}
            </p>
          </div>
        ))}
      </div>

      {/* ── 3 PREDATOR SPEED LOGS GRID ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        {LOGS.map((log) => (
          <div
            key={log.tag}
            style={{
              background: 'rgba(var(--lp-card), 0.9)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(var(--lp-fg), 0.08)',
              borderRadius: '20px',
              padding: '24px 22px',
              transition: 'border-color 0.25s ease, transform 0.2s ease, box-shadow 0.25s ease',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 122, 255, 0.4)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(var(--lp-fg), 0.08)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: log.tagColor,
                marginBottom: '10px',
              }}
            >
              {log.tag}
            </div>
            <h3
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: '17px',
                fontWeight: 700,
                color: 'var(--lp-heading)',
                marginBottom: '8px',
                letterSpacing: '-0.01em',
              }}
            >
              {log.title}
            </h3>
            <p
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: '13px',
                color: 'rgba(var(--lp-fg), 0.68)',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {log.desc}
            </p>
          </div>
        ))}
      </div>

      {/* ── BOTTOM EXPLORATION LINK & CTAs ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          padding: '20px 0',
          borderTop: '1px solid rgba(var(--lp-fg), 0.06)',
        }}
      >
        <a
          href="#specifications"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '12px',
            fontWeight: 600,
            color: '#5AC8FA',
            letterSpacing: '0.08em',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'color 0.2s ease, transform 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#FFFFFF';
            e.currentTarget.style.transform = 'translateX(4px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#5AC8FA';
            e.currentTarget.style.transform = 'translateX(0)';
          }}
        >
          Explore full markets & sessions specification →
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <IridescentButton to="/login" size="md">
            START FREE TRIAL
          </IridescentButton>
        </div>
      </div>
    </div>
  );
}
