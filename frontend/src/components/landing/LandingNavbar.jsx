import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, BarChart2, Shield, BookOpen, Calculator, Layers, Zap } from 'lucide-react';
import BrandLogo from '../BrandLogo';
import IridescentButton from './IridescentButton';

const NAV_LINKS = [
  { label: 'Markets', to: '/markets/four-asset-classes', icon: Layers },
  { label: 'Backtesting', to: '/backtesting/btcusdt', icon: BarChart2 },
  { label: 'Journal', to: '/journal/xauusd', icon: BookOpen },
  { label: 'Free Tools', to: '/tools/ftmo-drawdown-calculator', icon: Calculator },
  { label: 'Traders Lounge', to: '/#lounge', isAnchor: true },
  { label: 'Compare', to: '/vs/tradezella', icon: Shield },
  { label: 'Pricing', to: '/#pricing', isAnchor: true },
];

export default function LandingNavbar({ isFixed = true }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { pathname } = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleAnchorClick = (id) => {
    setMobileMenuOpen(false);
    if (pathname === '/') {
      const el = document.getElementById(id.replace(/^#/, ''));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.location.href = '/' + id;
  };

  return (
    <>
      <header
        className="glossy-navbar ios-landing"
        style={{
          position: isFixed ? 'fixed' : 'sticky',
          top: 0,
          left: 0,
          right: 0,
          height: '62px',
          padding: '0 clamp(16px, 3.5vw, 44px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 60,
          background: 'linear-gradient(180deg, rgba(var(--lp-card), 0.55) 0%, rgba(var(--lp-card), 0.18) 70%, transparent 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: 'none',
          boxShadow: 'none',
          boxSizing: 'border-box',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Left: Brand Logo & Title with Glossy Design */}
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
            flexShrink: 0,
            padding: '5px 14px 5px 6px',
            borderRadius: '999px',
            background: 'linear-gradient(135deg, rgba(var(--lp-fg), 0.12) 0%, rgba(90, 200, 250, 0.06) 50%, rgba(var(--lp-fg), 0.02) 100%)',
            border: '1px solid rgba(var(--lp-fg), 0.2)',
            boxShadow: 'inset 0 1px 1px 0 rgba(var(--lp-fg), 0.35), 0 4px 16px rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            transition: 'all 0.25s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(90, 200, 250, 0.45)';
            e.currentTarget.style.boxShadow = 'inset 0 1px 1px 0 rgba(var(--lp-fg), 0.45), 0 6px 24px rgba(90, 200, 250, 0.28)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(var(--lp-fg), 0.2)';
            e.currentTarget.style.boxShadow = 'inset 0 1px 1px 0 rgba(var(--lp-fg), 0.35), 0 4px 16px rgba(0, 0, 0, 0.3)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          onClick={() => {
            if (pathname === '/') {
              window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            }
          }}
        >
          <img
            src="/brand/fn-mark-256.webp"
            alt="Forex Notes"
            width={34}
            height={34}
            style={{ width: 34, height: 34, objectFit: 'contain', filter: 'drop-shadow(0 4px 10px rgba(34, 197, 94, 0.35))' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontFamily: "'Space Grotesk', -apple-system, sans-serif",
                fontSize: '13.5px',
                fontWeight: 800,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                background: 'linear-gradient(135deg, #FFFFFF 0%, #D4F4F9 50%, #5AC8FA 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block',
              }}
            >
              FOREX
            </span>
            <span
              style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: '17px',
                fontWeight: 400,
                fontStyle: 'italic',
                letterSpacing: '0.04em',
                color: '#5AC8FA',
                textShadow: '0 0 14px rgba(90, 200, 250, 0.5)',
                display: 'inline-block',
                lineHeight: 1,
              }}
            >
              Notes
            </span>
          </div>
        </Link>

        {/* Right: Start Free Trial Button + Three-Line Menu Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <IridescentButton to="/login" size="sm">
            START FREE TRIAL
          </IridescentButton>

          {/* Three-Line Menu Toggle Button (Visible on all screens) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            style={{
              background: 'linear-gradient(180deg, rgba(var(--lp-fg), 0.12) 0%, rgba(var(--lp-fg), 0.03) 100%)',
              border: '1px solid rgba(var(--lp-fg), 0.18)',
              borderRadius: '10px',
              padding: '7px 9px',
              color: 'var(--lp-text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 1px 0 rgba(var(--lp-fg), 0.25), 0 4px 12px rgba(0, 0, 0, 0.25)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(90, 200, 250, 0.45)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(var(--lp-fg), 0.18)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* ── UNIFIED NAVIGATION DRAWER (Desktop & Mobile) ── */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop Blur Overlay */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 58,
              background: 'rgba(var(--lp-card), 0.55)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              transition: 'opacity 0.2s ease',
            }}
          />

          {/* Drawer Panel */}
          <div
            style={{
              position: 'fixed',
              top: '64px',
              right: 'clamp(12px, 3.5vw, 44px)',
              width: 'min(400px, calc(100vw - 24px))',
              maxHeight: 'calc(100vh - 84px)',
              zIndex: 59,
              background: 'linear-gradient(180deg, rgba(var(--lp-card), 0.94) 0%, rgba(var(--lp-card), 0.98) 100%)',
              backdropFilter: 'blur(36px) saturate(190%)',
              WebkitBackdropFilter: 'blur(36px) saturate(190%)',
              border: '1px solid rgba(var(--lp-fg), 0.12)',
              borderRadius: '24px',
              boxShadow: 'inset 0 1px 0 0 rgba(var(--lp-fg), 0.2), 0 24px 60px rgba(0, 0, 0, 0.65)',
              padding: '24px 20px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '20px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                  paddingLeft: '6px',
                  paddingRight: '6px',
                }}
              >
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: '#5AC8FA',
                  }}
                >
                  MAIN ROUTES & PLATFORM HUBS
                </span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(var(--lp-fg), 0.6)',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {NAV_LINKS.map((item) => {
                const Icon = item.icon || Zap;
                if (item.isAnchor) {
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => handleAnchorClick(item.to.replace('/', ''))}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, rgba(var(--lp-fg), 0.05) 0%, rgba(var(--lp-fg), 0.015) 100%)',
                        border: '1px solid rgba(var(--lp-fg), 0.08)',
                        boxShadow: 'inset 0 1px 0 0 rgba(var(--lp-fg), 0.1)',
                        color: 'var(--lp-text)',
                        fontFamily: "'Manrope', sans-serif",
                        fontSize: '14px',
                        fontWeight: 600,
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(90, 200, 250, 0.4)';
                        e.currentTarget.style.color = '#5AC8FA';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(var(--lp-fg), 0.08)';
                        e.currentTarget.style.color = 'var(--lp-text)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Zap size={15} color="#5AC8FA" />
                        <span>{item.label}</span>
                      </div>
                      <ArrowRight size={13} color="#5AC8FA" />
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '14px',
                      background: pathname === item.to
                        ? 'linear-gradient(135deg, rgba(0, 122, 255, 0.35) 0%, rgba(90, 200, 250, 0.1) 100%)'
                        : 'linear-gradient(135deg, rgba(var(--lp-fg), 0.05) 0%, rgba(var(--lp-fg), 0.015) 100%)',
                      border: pathname === item.to
                        ? '1px solid rgba(90, 200, 250, 0.45)'
                        : '1px solid rgba(var(--lp-fg), 0.08)',
                      boxShadow: pathname === item.to
                        ? 'inset 0 1px 0 0 rgba(var(--lp-fg), 0.2), 0 4px 16px rgba(0, 122, 255, 0.25)'
                        : 'inset 0 1px 0 0 rgba(var(--lp-fg), 0.1)',
                      color: pathname === item.to ? '#5AC8FA' : 'var(--lp-text)',
                      textDecoration: 'none',
                      fontFamily: "'Manrope', sans-serif",
                      fontSize: '14px',
                      fontWeight: 600,
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (pathname !== item.to) {
                        e.currentTarget.style.borderColor = 'rgba(90, 200, 250, 0.4)';
                        e.currentTarget.style.color = '#5AC8FA';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (pathname !== item.to) {
                        e.currentTarget.style.borderColor = 'rgba(var(--lp-fg), 0.08)';
                        e.currentTarget.style.color = 'var(--lp-text)';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Icon size={15} color={pathname === item.to ? '#5AC8FA' : '#007AFF'} />
                      <span>{item.label}</span>
                    </div>
                    <ArrowRight size={13} color={pathname === item.to ? '#5AC8FA' : 'rgba(var(--lp-fg), 0.4)'} />
                  </Link>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(var(--lp-fg), 0.08)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <IridescentButton
                to="/login"
                size="md"
                onClick={() => setMobileMenuOpen(false)}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                START FREE TRIAL
              </IridescentButton>

              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '11px',
                  borderRadius: '999px',
                  background: 'linear-gradient(180deg, rgba(var(--lp-fg), 0.08) 0%, rgba(var(--lp-fg), 0.02) 100%)',
                  border: '1px solid rgba(var(--lp-fg), 0.14)',
                  boxShadow: 'inset 0 1px 0 rgba(var(--lp-fg), 0.16)',
                  color: 'var(--lp-text)',
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Sign In to Your Workspace
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
