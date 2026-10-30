// frontend/src/components/landing/ParticleCloakFooter.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../BrandLogo';
import IridescentButton from './IridescentButton';

const FOOTER_LINKS = [
  {
    title: 'Free tools',
    links: [
      ['/tools/ftmo-drawdown-calculator', 'FTMO drawdown calculator'],
      ['/tools/fundednext-risk-manager', 'FundedNext risk manager'],
      ['/tools/lot-size-calculator', 'Lot size calculator'],
    ],
  },
  {
    title: 'Journal',
    links: [
      ['/journal/xauusd', 'XAUUSD journal'],
      ['/journal/eurusd', 'EURUSD journal'],
      ['/journal/ict-strategy', 'ICT journal'],
      ['/journal/smc', 'SMC journal'],
      ['/journal/scalping', 'Scalping journal'],
    ],
  },
  {
    title: 'Regions',
    links: [
      ['/india/forex-trading-journal', 'India forex journal'],
      ['/india/trading-journal', 'India trading journal'],
      ['/india/prop-firm-calculator', 'India prop firm calculator'],
      ['/india/forex-backtesting-software', 'Backtesting for India'],
      ['/dubai/forex-trading-journal', 'Dubai forex journal'],
      ['/dubai/trading-journal', 'Dubai trading journal'],
      ['/uae/prop-firm-trader-tools', 'UAE prop firm tools'],
      ['/uae/islamic-trading-journal', 'Islamic trading journal'],
    ],
  },
  {
    title: 'Compare',
    links: [
      ['/vs/tradezella', 'vs TradeZella'],
      ['/vs/tradersync', 'vs TraderSync'],
      ['/vs/fx-replay', 'vs FX Replay'],
      ['/vs/edgewonk', 'vs Edgewonk'],
      ['/vs/tradesviz', 'vs TradesViz'],
      ['/vs/traders-casa', 'vs Traders Casa'],
      ['/backtesting/btcusdt', 'BTCUSDT backtesting'],
      ['/markets/four-asset-classes', 'Four asset classes & speed'],
      ['/privacy', 'Privacy policy'],
    ],
  },
];

export default function ParticleCloakFooter() {
  return (
    <footer
      className="ios-landing"
      style={{
        position: 'relative',
        background: 'var(--lp-bg)',
        color: 'var(--lp-heading)',
        borderTop: '1px solid rgba(var(--lp-fg), 0.08)',
        overflow: 'hidden',
      }}
    >
      {/* Scoped CSS for Footer Mobile Responsiveness */}
      <style>{`
        @media (max-width: 640px) {
          .footer-seo-container {
            padding: 40px 16px 24px !important;
          }
          .footer-sitemap-container {
            padding: 32px 16px 48px !important;
          }
          .footer-pillars-grid {
            grid-template-columns: 1fr !important;
          }
          .footer-assets-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 480px) {
          .footer-assets-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* ── Sleek, 60fps Lightweight CTA Plate (Zero Canvas/CPU Overhead) ── */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '340px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'clamp(50px, 8vh, 80px) 20px',
          overflow: 'hidden',
          background: 'radial-gradient(ellipse at 50% 40%, rgba(0, 122, 255, 0.08) 0%, transparent 70%)',
        }}
      >
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            textAlign: 'center',
            maxWidth: '850px',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: '#007AFF',
              marginBottom: '16px',
            }}
          >
            FOREX NOTES · THE TRADER'S OPERATING SYSTEM
          </div>

          <h2
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: 'clamp(38px, 6.5vw, 84px)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              lineHeight: 1.02,
              color: 'var(--lp-heading)',
              marginBottom: '28px',
            }}
          >
            Trade Without Regret.<br /><span style={{ fontStyle: 'italic', color: '#007AFF' }}>Master Every Session.</span>
          </h2>

          <div style={{ display: 'inline-block' }}>
            <IridescentButton to="/login">
              CLAIM ACCESS NOW
            </IridescentButton>
          </div>
        </div>
      </div>

      {/* ── Giant Watermark Wordmark ── */}
      <div
        style={{
          textAlign: 'center',
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontSize: 'clamp(56px, 12vw, 180px)',
          lineHeight: 0.8,
          fontWeight: 400,
          color: 'rgba(var(--lp-fg), 0.03)',
          userSelect: 'none',
          pointerEvents: 'none',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          marginTop: '-30px',
        }}
      >
        FOREX NOTES
      </div>

      {/* ── SEO SHOWCASE: FOUR ASSET CLASSES & PREDATOR SPEED (100% Keyword & Copy Preservation) ── */}
      <div
        className="footer-seo-container"
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '60px 24px 36px',
          borderTop: '1px solid rgba(var(--lp-fg), 0.08)',
          position: 'relative',
          zIndex: 5,
        }}
      >
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ width: 24, height: 2, background: '#007AFF' }} />
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#007AFF',
              }}
            >
              MARKETS & SESSIONS · FOUR ASSET CLASSES & PREDATOR SPEED
            </span>
          </div>

          <h2
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: 'clamp(30px, 4.4vw, 50px)',
              fontWeight: 400,
              color: 'var(--lp-heading)',
              letterSpacing: '-0.02em',
              marginBottom: '12px',
            }}
          >
            Four asset classes,{' '}
            <span style={{ fontStyle: 'italic', color: '#007AFF' }}>
              infinite edge.
            </span>
          </h2>

          <p style={{ fontSize: '14.5px', color: 'rgba(var(--lp-fg), 0.7)', maxWidth: '720px', lineHeight: 1.65, marginBottom: '24px', fontFamily: "'Manrope', sans-serif" }}>
            Trade the coastline nobody else can reach. Your AI coach plans your risk around market sessions, news events and your emotional state. High probability setups at dawn, disciplined risk at dusk, and zero revenge trading in between.
          </p>
        </div>

        {/* 4 Asset Class Tiles */}
        <div className="footer-assets-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '28px' }}>
          <div style={{ background: 'rgba(var(--lp-card), 0.85)', border: '1px solid rgba(var(--lp-fg),0.08)', borderRadius: '18px', padding: '20px' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#007AFF', marginBottom: '6px', fontWeight: 700, letterSpacing: '0.12em' }}>01 · 24/5 FX</div>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '20px', fontWeight: 400, color: 'var(--lp-heading)', marginBottom: '6px' }}>Forex Majors</div>
            <div style={{ fontSize: '12.5px', color: 'rgba(var(--lp-fg),0.7)', lineHeight: 1.5, fontFamily: "'Manrope', sans-serif" }}>
              EURUSD, GBPUSD, USDJPY tick-by-tick replay & London/NY session analytics.
            </div>
          </div>

          <div style={{ background: 'rgba(var(--lp-card), 0.85)', border: '1px solid rgba(var(--lp-fg),0.08)', borderRadius: '18px', padding: '20px' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#007AFF', marginBottom: '6px', fontWeight: 700, letterSpacing: '0.12em' }}>02 · HIGH VOL</div>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '20px', fontWeight: 400, color: 'var(--lp-heading)', marginBottom: '6px' }}>Gold (XAUUSD)</div>
            <div style={{ fontSize: '12.5px', color: 'rgba(var(--lp-fg),0.7)', lineHeight: 1.5, fontFamily: "'Manrope', sans-serif" }}>
              Track Asian, London, and NY breakouts with automated pip-level risk sizing.
            </div>
          </div>

          <div style={{ background: 'rgba(var(--lp-card), 0.85)', border: '1px solid rgba(var(--lp-fg),0.08)', borderRadius: '18px', padding: '20px' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#5AC8FA', marginBottom: '6px', fontWeight: 700, letterSpacing: '0.12em' }}>03 · CASH OPEN</div>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '20px', fontWeight: 400, color: 'var(--lp-heading)', marginBottom: '6px' }}>Global Indices</div>
            <div style={{ fontSize: '12.5px', color: 'rgba(var(--lp-fg),0.7)', lineHeight: 1.5, fontFamily: "'Manrope', sans-serif" }}>
              NAS100, US30, SPX500 high-momentum execution tracking and volume alerts.
            </div>
          </div>

          <div style={{ background: 'rgba(var(--lp-card), 0.65)', border: '1px solid rgba(var(--lp-fg),0.08)', borderRadius: '16px', padding: '18px' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#8B5CF6', marginBottom: '6px' }}>04 · 24/7 DEEP</div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--lp-heading)', marginBottom: '6px' }}>Crypto Assets</div>
            <div style={{ fontSize: '12.5px', color: 'rgba(var(--lp-fg),0.65)', lineHeight: 1.5 }}>
              BTCUSDT, ETHUSDT 10-year bar replay and weekend volatility filters.
            </div>
          </div>
        </div>

        {/* 3 Dive Log / Predator Speed Pillars */}
        <div className="footer-pillars-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '22px' }}>
          <div style={{ background: 'rgba(var(--lp-card), 0.5)', border: '1px solid rgba(90, 200, 250,0.15)', borderRadius: '16px', padding: '18px' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#5AC8FA', letterSpacing: '0.12em', marginBottom: '6px' }}>
              LOG 01 · AI PSYCHOLOGY PRE-CHECK
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--lp-text)', marginBottom: '6px' }}>Dermal protection against tilt</div>
            <div style={{ fontSize: '12.5px', color: 'rgba(var(--lp-fg),0.7)', lineHeight: 1.5 }}>
              Evaluates your emotional heartbeat before execution without drag.
            </div>
          </div>

          <div style={{ background: 'rgba(var(--lp-card), 0.5)', border: '1px solid rgba(90, 200, 250,0.15)', borderRadius: '16px', padding: '18px' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#5AC8FA', letterSpacing: '0.12em', marginBottom: '6px' }}>
              LOG 02 · 10-YEAR TICK DATA
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--lp-text)', marginBottom: '6px' }}>A sixth sense for liquidity</div>
            <div style={{ fontSize: '12.5px', color: 'rgba(var(--lp-fg),0.7)', lineHeight: 1.5 }}>
              10 full years of tick data to identify hidden algorithmic sweeps.
            </div>
          </div>

          <div style={{ background: 'rgba(var(--lp-card), 0.5)', border: '1px solid rgba(90, 200, 250,0.15)', borderRadius: '16px', padding: '18px' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#F0524A', letterSpacing: '0.12em', marginBottom: '6px' }}>
              LOG 03 · PROP GUARDIAN
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--lp-text)', marginBottom: '6px' }}>Rules that never fail</div>
            <div style={{ fontSize: '12.5px', color: 'rgba(var(--lp-fg),0.7)', lineHeight: 1.5 }}>
              Trailing daily loss monitor ensures your prop challenge is never breached.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Link
            to="/markets/four-asset-classes"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: '#007AFF',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Explore full markets & sessions specification →</span>
          </Link>
        </div>
      </div>

      {/* ── SEO Sitemap Directory (100% Preserved) ── */}
      <div
        className="footer-sitemap-container"
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '40px 24px 60px',
          borderTop: '1px solid rgba(var(--lp-fg), 0.06)',
          position: 'relative',
          zIndex: 5,
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px', marginBottom: '48px' }}>
          {FOOTER_LINKS.map((g) => (
            <div key={g.title}>
              <h3
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  color: '#5AC8FA',
                  marginBottom: '16px',
                }}
              >
                {g.title}
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '11px' }}>
                {g.links.map(([to, label]) => (
                  <li key={to}>
                    <Link
                      to={to}
                      onClick={() => {
                        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                        document.documentElement.scrollTop = 0;
                        document.body.scrollTop = 0;
                      }}
                      style={{
                        fontSize: '13px',
                        color: 'rgba(var(--lp-fg), 0.72)',
                        textDecoration: 'none',
                        transition: 'color 0.2s ease, transform 0.2s ease',
                        display: 'inline-block',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#5AC8FA';
                        e.currentTarget.style.transform = 'translateX(2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'rgba(var(--lp-fg), 0.72)';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Legal & Socials Row */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            paddingTop: '24px',
            borderTop: '1px solid rgba(var(--lp-fg), 0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BrandLogo style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
            <span style={{ fontSize: '12px', color: 'rgba(var(--lp-fg), 0.45)', fontFamily: "'JetBrains Mono', monospace" }}>
              © {new Date().getFullYear()} Forex Notes. All rights reserved.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <a
              href="https://discord.gg/Ajaw3AjfWE"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '12px', color: 'rgba(var(--lp-fg), 0.6)', textDecoration: 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#5865F2')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(var(--lp-fg), 0.6)')}
            >
              Discord
            </a>
            <a
              href="https://instagram.com/forexnotes.in"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '12px', color: 'rgba(var(--lp-fg), 0.6)', textDecoration: 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#E1306C')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(var(--lp-fg), 0.6)')}
            >
              Instagram
            </a>
            <Link
              to="/privacy"
              style={{ fontSize: '12px', color: 'rgba(var(--lp-fg), 0.65)', textDecoration: 'none', transition: 'color 0.2s ease' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#5AC8FA')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(var(--lp-fg), 0.65)')}
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
