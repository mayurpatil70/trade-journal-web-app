// frontend/src/pages/LandingPage.jsx
// Cinematic Scrollytelling Landing Page — Forex Notes
// Sequence: Ship Hero (Veloria) → Mako Shark → Kingfisher Bird → Dot Grid Singularity Canvas → Liquid Glass Carousel → Bento Features → Comparison → 3D Rolodex Reviews → Pricing → FAQ → Discord → Particle Cloak Footer

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  MessageSquare,
  XCircle,
  Zap,
} from "lucide-react";

// Landing Components
import { useLenis } from "../components/landing/useLenis";
import MakoSharkSection from "../components/landing/MakoSharkSection";
import KingfisherSection from "../components/landing/KingfisherSection";
import LiquidGlassCarousel from "../components/landing/LiquidGlassCarousel";
import FeaturesBento from "../components/landing/FeaturesBento";
import LoungeShowcase from "../components/landing/LoungeShowcase";
import RolodexReviews from "../components/landing/RolodexReviews";
import ParticleCloakFooter from "../components/landing/ParticleCloakFooter";
import IridescentButton from "../components/landing/IridescentButton";
import SocialProofToast from "../components/landing/SocialProofToast";
import { LANDING_FAQS } from "../data/seoPages";

gsap.registerPlugin(ScrollTrigger);

const COMPARISON = [
  {
    metric: "Execution & Broker Sync",
    manual: "Manual CSV copy-pasting at midnight (missed trades & errors)",
    journal: "Instant MT4/MT5 & cTrader sub-second automated sync",
    proof: "< 12ms Sync"
  },
  {
    metric: "AI Pre-Trade Guard",
    manual: "Zero emotional defense; impulse revenge trades allowed",
    journal: "Active risk-locking guard & automated tilt prevention",
    proof: "94% Tilt Blocked"
  },
  {
    metric: "R-Multiple Expectancy",
    manual: "Misleading raw dollar P&L only (hides poor risk-reward)",
    journal: "Automated MAE/MFE curves & statistical expectancy",
    proof: "True Quant Math"
  },
  {
    metric: "Prop Firm Drawdown",
    manual: "No live trailing drawdown warnings (causes easy breaches)",
    journal: "Real-time FTMO & Topstep trailing breach alarms",
    proof: "83.4% Pass Rate"
  },
  {
    metric: "10-Year Bar Replay",
    manual: "Static screenshots with hindsight bias and no tick data",
    journal: "Multi-timeframe institutional tick bar replay engine",
    proof: "10-Yr Tick Replay"
  },
  {
    metric: "Audited Security & Proof",
    manual: "Unverified sheets rejected by prop firms and investors",
    journal: "Cryptographically signed PDF audit vault & AES-256 cloud",
    proof: "Cryptographic Proof"
  },
];

const PRICING_FEATURES = [
  "Unlimited Trade Logging & Cloud Archive",
  "Automated R-Multiple & P&L Engine",
  "Built-in Lot Size & Pip Sizing Calculator",
  "Prop Firm Guardian Drawdown Monitor",
  "AI Psychology Leak Detection (Pre-Trade Guard)",
  "Interactive Before/After Screenshot Archive",
  "Economic Calendar & News Integration",
  "Private Discord Community Access",
];

// ─── Stat Counter (1.6s Ease-Out Count-Up on Scroll) ─────────────────────────
function AnimatedStat({ value, label, color }) {
  const ref = useRef(null);
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const match = String(value).match(/^([^\d.]*)(\d+(?:\.\d+)?)(.*)$/);
    if (!match) return;

    const prefix = match[1];
    const targetNum = parseFloat(match[2].replace(/,/g, ''));
    const suffix = match[3];
    const decimals = match[2].includes('.') ? match[2].split('.')[1].length : 0;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();

          gsap.fromTo(
            el,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }
          );

          const startTime = performance.now();
          const duration = 1600;

          function tick(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            const current = targetNum * eased;

            let formatted;
            if (decimals > 0) {
              const parts = current.toFixed(decimals).split('.');
              parts[0] = parseInt(parts[0], 10).toLocaleString('en-US');
              formatted = parts.join('.');
            } else {
              formatted = Math.round(current).toLocaleString('en-US');
            }

            setDisplayValue(`${prefix}${formatted}${suffix}`);

            if (progress < 1) {
              requestAnimationFrame(tick);
            } else {
              setDisplayValue(value);
            }
          }

          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div
      ref={ref}
      style={{
        textAlign: "center",
        padding: "32px 24px",
        background: "rgba(15, 29, 28, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "22px",
        opacity: 0,
        boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
      }}
    >
      <div
        style={{
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontSize: "clamp(2.8rem, 6vw, 4rem)",
          fontWeight: 400,
          color: color,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          marginBottom: "10px",
          fontStyle: "italic",
        }}
      >
        {displayValue}
      </div>
      <p style={{ fontSize: "13px", color: "rgba(237, 234, 227, 0.75)", lineHeight: 1.5, fontFamily: "'Manrope', sans-serif" }}>{label}</p>
    </div>
  );
}

// ─── Odometer Digit Reel (60fps GPU translateY) ─────────────────────────────
function OdometerPrice({ value, height = 36 }) {
  const digits = String(value).split('');
  return (
    <div
      style={{
        display: 'inline-flex',
        height: `${height}px`,
        overflow: 'hidden',
        lineHeight: `${height}px`,
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 700,
        verticalAlign: 'baseline',
      }}
      aria-hidden="true"
    >
      {digits.map((char, i) => {
        const isNum = !isNaN(parseInt(char, 10));
        if (!isNum) {
          return (
            <span key={i} style={{ height: `${height}px`, lineHeight: `${height}px` }}>
              {char}
            </span>
          );
        }
        const num = parseInt(char, 10);
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              transform: `translate3d(0, ${-num * height}px, 0)`,
              transition: `transform 0.48s cubic-bezier(0.16, 1, 0.3, 1) ${i * 45}ms`,
              willChange: 'transform',
            }}
          >
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <span
                key={n}
                style={{
                  height: `${height}px`,
                  lineHeight: `${height}px`,
                  width: '0.6em',
                  textAlign: 'center',
                }}
              >
                {n}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function LandingPage() {
  const [billingCycle, setBillingCycle] = useState('monthly');
  // Initialize Lenis smooth scroll
  useLenis();

  const comparisonRef = useRef(null);

  // When user refreshes anywhere on the landing page, redirect/reset directly to the hero section (Mako shark)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const resetToSharkHero = () => {
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      const shark = document.getElementById('mako-section');
      if (shark) {
        shark.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    };

    resetToSharkHero();
    const rafId = requestAnimationFrame(resetToSharkHero);
    const t1 = setTimeout(resetToSharkHero, 30);
    const t2 = setTimeout(resetToSharkHero, 150);

    const onBeforeUnload = () => {
      window.scrollTo(0, 0);
    };
    const onPageShow = () => {
      resetToSharkHero();
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('pageshow', onPageShow);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, []);

  // Scroll-reveal for comparison rows
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray(".comp-row").forEach((row, i) => {
        gsap.fromTo(
          row,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            delay: i * 0.09,
            ease: "power2.out",
            scrollTrigger: {
              trigger: row,
              start: "top 92%",
              onEnter: () => {
                row.classList.add("is-revealed");
              },
            },
          }
        );
      });

      // Pricing card reveal
      gsap.fromTo(
        ".pricing-card",
        { opacity: 0, y: 50, scale: 0.97 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".pricing-card",
            start: "top 85%",
          },
        }
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <div
      className="landing-root"
      style={{
        minHeight: "100vh",
        background: "#05090E",
        color: "#F4EFE6",
        fontFamily: "'Manrope', sans-serif",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      {/* Scoped CSS for Kingfisher UI and Mobile Layout */}
      <style>{`
        @keyframes compCrossShake {
          0%, 100% { transform: scale(1) translateX(0); }
          20% { transform: scale(1) translateX(-3px); }
          40% { transform: scale(1) translateX(3px); }
          60% { transform: scale(1) translateX(-2px); }
          80% { transform: scale(1) translateX(2px); }
        }
        @keyframes compCheckPop {
          0% { opacity: 0; transform: scale(0); }
          70% { opacity: 1; transform: scale(1.3); }
          100% { opacity: 1; transform: scale(1); }
        }
        .comp-cross-icon {
          opacity: 0;
          transform: scale(0.6);
        }
        .comp-row.is-revealed .comp-cross-icon {
          opacity: 1;
          transform: scale(1);
          animation: compCrossShake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) 0.15s both;
        }
        .comp-check-icon {
          opacity: 0;
          transform: scale(0);
        }
        .comp-row.is-revealed .comp-check-icon {
          animation: compCheckPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.25s both;
        }
        .comp-our-col {
          background: linear-gradient(90deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.11) 100%);
          border-left: 1px solid rgba(16, 185, 129, 0.32);
          box-shadow: inset 0 0 18px rgba(16, 185, 129, 0.12);
        }
        @media (max-width: 640px) {
          .pricing-card {
            padding: 22px !important;
          }
          .comp-table-wrapper {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
          }
          .comp-table-inner {
            min-width: 580px !important;
          }
          .risk-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .discord-cta-box {
            padding: 36px 18px !important;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .comp-cross-icon, .comp-check-icon {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>

      {/* ── 01 HERO SECTION: MAKO SHARK 10-YEAR REPLAY & AI PSYCHOLOGY COACH ── */}
      <MakoSharkSection />

      {/* ── 02 PRECISION SECTION: KINGFISHER (Landing With Precision) ── */}
      <KingfisherSection />

      {/* ── 04 CORE APPLICATION SECTIONS WRAPPER ── */}
      <div style={{ position: "relative", zIndex: 10, background: "#05090E" }}>
        {/* Content running above smooth dark background */}
        <div style={{ position: "relative", zIndex: 1 }}>

          {/* In-App Screenshots: Auto-Sliding Card Carousel */}
          <LiquidGlassCarousel />

          {/* Features Bento */}
          <FeaturesBento />

          <LoungeShowcase />

          {/* Stats Counter Row */}
          <section style={{ padding: "80px 20px", borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
            <div style={{ maxWidth: "900px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
              <AnimatedStat value="3,200+" label="Funded traders using Forex Notes daily" color="#0E7C86" />
              <AnimatedStat value="50% OFF" label="Massive discounts on Yearly plan available ($114)" color="#E8732A" />
              <AnimatedStat value="94%" label="Users report fewer rule violations within 30 days" color="#5FD4E8" />
            </div>
          </section>

          {/* Direct Comparison Section: Why Traders Ditch Excel & Notion */}
          <section
            id="comparison"
            ref={comparisonRef}
            style={{ padding: "100px 20px", borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}
          >
            <div style={{ maxWidth: "960px", margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: "56px" }}>
                <div style={{
                  display: "inline-block",
                  fontSize: "10px", fontWeight: 700, letterSpacing: "0.16em",
                  textTransform: "uppercase", color: "#E8732A",
                  padding: "5px 14px", borderRadius: "999px",
                  background: "rgba(232, 115, 42, 0.1)", border: "1px solid rgba(232, 115, 42, 0.25)",
                  marginBottom: "16px",
                  fontFamily: "'JetBrains Mono', monospace",
                }}>02 FIELD NOTES · DIRECT COMPARISON</div>
                <h2 style={{
                  fontFamily: "'Instrument Serif', Georgia, serif",
                  fontSize: "clamp(2.2rem, 4.5vw, 3.2rem)", fontWeight: 400,
                  color: "#FFFFFF", letterSpacing: "-0.02em", lineHeight: 1.05, marginBottom: "12px",
                }}>
                  Why Traders Ditch <span style={{ fontStyle: "italic", color: "#0E7C86" }}>Excel & Notion</span>
                </h2>
                <p style={{ fontSize: "14px", color: "rgba(237, 234, 227, 0.7)", maxWidth: "480px", margin: "0 auto", lineHeight: 1.7 }}>
                  Manual spreadsheets leave you blind to emotional drawdown points and prop firm rules.
                </p>
              </div>

              <div className="block sm:hidden text-center text-[11px] text-[#5FD4E8] font-mono mb-3 tracking-widest uppercase">
                ← Swipe table to compare →
              </div>

              <div
                className="comp-table-wrapper"
                style={{
                  background: "rgba(15, 29, 28, 0.88)", backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "22px", overflow: "hidden",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
                }}
              >
                <div className="comp-table-inner">
                  {/* Table Header */}
                  <div style={{
                    display: "grid", gridTemplateColumns: "1.2fr 1.25fr 1.45fr",
                    padding: "16px 24px",
                    background: "rgba(255, 255, 255, 0.03)",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                  }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(237, 234, 227, 0.6)" }}>Execution Metric</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(237, 234, 227, 0.6)" }}>Spreadsheets &amp; Notion</span>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#10b981" }}>Forex Notes (Us) ★</span>
                      <span style={{ fontSize: "9px", fontFamily: "'JetBrains Mono', monospace", color: "#34d399", background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.35)", padding: "2px 6px", borderRadius: "4px", textTransform: "uppercase" }}>Recommended</span>
                    </div>
                  </div>
                  {COMPARISON.map((row, i) => (
                    <div
                      key={i}
                      className="comp-row"
                      style={{
                        display: "grid", gridTemplateColumns: "1.2fr 1.25fr 1.45fr",
                        borderBottom: i < COMPARISON.length - 1 ? "1px solid rgba(255, 255, 255, 0.04)" : "none",
                        opacity: 0,
                      }}
                    >
                      <div style={{ padding: "16px 24px", display: "flex", alignItems: "center" }}>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#FFFFFF" }}>{row.metric}</span>
                      </div>
                      <div style={{ padding: "16px 24px", display: "flex", alignItems: "flex-start", gap: "8px", color: "rgba(237, 234, 227, 0.65)", fontSize: "12px" }}>
                        <span className="comp-cross-icon" style={{ color: "#ef4444", flexShrink: 0, marginTop: "2px", display: "inline-flex" }}>
                          <XCircle size={14} color="#ef4444" />
                        </span>
                        <span>{row.manual}</span>
                      </div>
                      <div
                        className="comp-our-col"
                        style={{
                          padding: "16px 24px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          justifyContent: "center",
                        }}
                      >
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#FFFFFF", display: "flex", alignItems: "flex-start", gap: "8px" }}>
                          <span className="comp-check-icon" style={{ color: "#10b981", flexShrink: 0, marginTop: "2px", display: "inline-flex" }}>
                            <CheckCircle2 size={14} color="#10b981" />
                          </span>
                          <span>{row.journal}</span>
                        </div>
                        {row.proof && (
                          <span style={{
                            marginLeft: "22px",
                            fontSize: "9.5px",
                            fontFamily: "'JetBrains Mono', monospace",
                            color: "#34d399",
                            background: "rgba(16, 185, 129, 0.12)",
                            border: "1px solid rgba(16, 185, 129, 0.3)",
                            padding: "1px 6px",
                            borderRadius: "4px",
                            width: "fit-content",
                            fontWeight: 700,
                          }}>
                            {row.proof}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── THE PROP FIRM RISK & PASS RATE BRIDGE (Pushes Rolodex down so it starts cleanly on its own full screen) ── */}
          <section style={{ padding: "80px 20px 100px", borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
            <div style={{ maxWidth: "1060px", margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: "40px" }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  fontSize: "11px", fontWeight: 700, letterSpacing: "0.16em",
                  textTransform: "uppercase", color: "#E8732A",
                  padding: "6px 16px", borderRadius: "999px",
                  background: "rgba(232, 115, 42, 0.1)", border: "1px solid rgba(232, 115, 42, 0.25)",
                  marginBottom: "14px", fontFamily: "'JetBrains Mono', monospace",
                }}>
                  <span>03 RISK GOVERNANCE · CAPITAL PRESERVATION</span>
                </div>
                <h3 style={{
                  fontFamily: "'Instrument Serif', Georgia, serif",
                  fontSize: "clamp(2rem, 4.2vw, 3.2rem)", fontWeight: 400,
                  color: "#FFFFFF", letterSpacing: "-0.02em", lineHeight: 1.1,
                }}>
                  Built to Protect Your Funded Capital Across <span style={{ fontStyle: "italic", color: "#0E7C86" }}>Every Challenge</span>
                </h3>
                <p style={{ fontSize: "14.5px", color: "rgba(237, 234, 227, 0.7)", maxWidth: "620px", margin: "14px auto 0", lineHeight: 1.65 }}>
                  Manual spreadsheets let emotions slip through. Forex Notes acts as your automated safety net, sounding alerts before trailing drawdowns or revenge trades threaten your payouts.
                </p>
              </div>

              {/* 3 Benefit Highlight Cards */}
              <div className="risk-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
                <div style={{
                  background: "rgba(15, 29, 28, 0.85)", backdropFilter: "blur(20px)",
                  border: "1px solid rgba(14, 124, 134, 0.25)", borderRadius: "22px", padding: "28px",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
                }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "#0E7C86", fontWeight: 800, letterSpacing: "0.14em", marginBottom: "8px" }}>
                    01 · PROP GUARDIAN
                  </div>
                  <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "22px", fontWeight: 400, color: "#FFFFFF", marginBottom: "8px" }}>
                    Real-Time Trailing Drawdown
                  </div>
                  <p style={{ fontSize: "13px", color: "rgba(237, 234, 227, 0.7)", lineHeight: 1.6 }}>
                    Live tracking against FTMO, FundedNext, and Topstep drawdown rules. Instant alerts at 70% threshold so you never violate max loss limits.
                  </p>
                </div>

                <div style={{
                  background: "rgba(15, 29, 28, 0.85)", backdropFilter: "blur(20px)",
                  border: "1px solid rgba(232, 115, 42, 0.25)", borderRadius: "22px", padding: "28px",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
                }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "#E8732A", fontWeight: 800, letterSpacing: "0.14em", marginBottom: "8px" }}>
                    02 · AI PRE-TRADE CHECK
                  </div>
                  <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "22px", fontWeight: 400, color: "#FFFFFF", marginBottom: "8px" }}>
                    Emotional Circuit Breaker
                  </div>
                  <p style={{ fontSize: "13px", color: "rgba(237, 234, 227, 0.7)", lineHeight: 1.6 }}>
                    Blocks tilted entries after sudden loss streaks. Validates your setup against your written trading plan before allowing execution.
                  </p>
                </div>

                <div style={{
                  background: "rgba(15, 29, 28, 0.85)", backdropFilter: "blur(20px)",
                  border: "1px solid rgba(243, 161, 94, 0.25)", borderRadius: "22px", padding: "28px",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
                }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "#F3A15E", fontWeight: 800, letterSpacing: "0.14em", marginBottom: "8px" }}>
                    03 · EXECUTION ANALYTICS
                  </div>
                  <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "22px", fontWeight: 400, color: "#FFFFFF", marginBottom: "8px" }}>
                    Automatic R-Multiple Calculation
                  </div>
                  <p style={{ fontSize: "13px", color: "rgba(237, 234, 227, 0.7)", lineHeight: 1.6 }}>
                    No manual formulas or broken sheet links. One-click sync computes precise risk-to-reward ratios and session profit factors instantly.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 3D Rolodex Trader Reviews */}
          <RolodexReviews />

          {/* Pricing Section */}
          <section
            id="pricing"
            style={{
              padding: "clamp(80px, 10vh, 110px) 16px clamp(60px, 8vh, 90px)",
              borderTop: "1px solid rgba(255, 255, 255, 0.06)",
              scrollMarginTop: "90px",
              position: "relative",
            }}
          >
            <div style={{ maxWidth: "1060px", margin: "0 auto", textAlign: "center" }}>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#10b981",
                padding: "5px 14px",
                borderRadius: "999px",
                background: "rgba(16, 185, 129, 0.08)",
                border: "1px solid rgba(16, 185, 129, 0.22)",
                marginBottom: "16px",
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }} />
                <span>04 MEMBERSHIP · TRANSPARENT PRICING</span>
              </div>

              <h2 style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: "clamp(2.3rem, 5vw, 3.8rem)",
                fontWeight: 400,
                color: "#FFFFFF",
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
                marginBottom: "12px",
              }}>
                Choose Your Edge.<br />
                <span style={{ fontStyle: "italic", color: "#c9a96e" }}>Cancel Anytime.</span>
              </h2>

              <p style={{
                fontSize: "14px",
                color: "rgba(237, 234, 227, 0.7)",
                marginBottom: "32px",
                lineHeight: 1.6,
                maxWidth: "520px",
                margin: "0 auto 32px"
              }}>
                Select the plan that fits your trading journey. Instant automated activation with card or USDT BEP-20.
              </p>

              {/* Monthly / Yearly Toggle */}
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                position: "relative",
                background: "rgba(15, 23, 42, 0.7)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "999px",
                padding: "4px",
                marginBottom: "48px",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.35)",
                userSelect: "none",
              }}>
                <div
                  style={{
                    position: "absolute",
                    top: "4px",
                    bottom: "4px",
                    width: "148px",
                    borderRadius: "999px",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    boxShadow: "0 4px 18px rgba(16, 185, 129, 0.35)",
                    transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    transform: billingCycle === "yearly" ? "translateX(148px)" : "translateX(0px)",
                  }}
                />

                <button
                  type="button"
                  onClick={() => setBillingCycle("monthly")}
                  style={{
                    position: "relative",
                    zIndex: 2,
                    width: "148px",
                    padding: "9px 0",
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    color: billingCycle === "monthly" ? "#ffffff" : "rgba(255, 255, 255, 0.5)",
                    transition: "color 0.2s",
                  }}
                >
                  <span>MONTHLY</span>
                  <span style={{
                    fontSize: "9px",
                    fontWeight: 800,
                    padding: "1px 6px",
                    borderRadius: "999px",
                    background: billingCycle === "monthly" ? "rgba(255, 255, 255, 0.22)" : "rgba(16, 185, 129, 0.15)",
                    color: billingCycle === "monthly" ? "#ffffff" : "#34d399",
                    border: billingCycle === "monthly" ? "none" : "1px solid rgba(16, 185, 129, 0.35)",
                  }}>
                    25% OFF
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setBillingCycle("yearly")}
                  style={{
                    position: "relative",
                    zIndex: 2,
                    width: "148px",
                    padding: "9px 0",
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    color: billingCycle === "yearly" ? "#ffffff" : "rgba(255, 255, 255, 0.5)",
                    transition: "color 0.2s",
                  }}
                >
                  <span>YEARLY</span>
                  <span style={{
                    fontSize: "9px",
                    fontWeight: 800,
                    padding: "1px 6px",
                    borderRadius: "999px",
                    background: billingCycle === "yearly" ? "rgba(255, 255, 255, 0.22)" : "rgba(16, 185, 129, 0.15)",
                    color: billingCycle === "yearly" ? "#ffffff" : "#34d399",
                    border: billingCycle === "yearly" ? "none" : "1px solid rgba(16, 185, 129, 0.35)",
                  }}>
                    50% OFF
                  </span>
                </button>
              </div>

              {/* 2 Plans Grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "28px",
                maxWidth: "860px",
                margin: "0 auto",
                textAlign: "left",
                alignItems: "stretch",
              }}>

                {/* Plan 1: Starter */}
                <div
                  className="pricing-card"
                  style={{
                    background: "rgba(15, 29, 28, 0.88)",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "24px",
                    padding: "32px",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
                  }}
                >
                  <div style={{ marginBottom: "20px", paddingBottom: "20px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                    <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "26px", color: "#FFFFFF", marginBottom: "4px" }}>
                      Starter
                    </h3>
                    <p style={{ fontSize: "12px", color: "rgba(237, 234, 227, 0.6)" }}>
                      24 hours full test drive
                    </p>
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                      <span style={{ fontSize: "24px", fontWeight: 700, color: "#FFFFFF" }}>$</span>
                      <OdometerPrice value="0" height={42} />
                      <span style={{ fontSize: "11px", fontFamily: "'JetBrains Mono', monospace", color: "rgba(237, 234, 227, 0.55)" }}>/forever</span>
                    </div>
                    <div style={{ fontSize: "11px", color: "rgba(237, 234, 227, 0.45)", fontFamily: "'JetBrains Mono', monospace", marginTop: "2px" }}>
                      No credit card needed
                    </div>
                    <div style={{ height: "26px", marginTop: "10px" }} />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px", flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12px", color: "rgba(237, 234, 227, 0.75)" }}>
                      <CheckCircle2 size={14} color="#10b981" style={{ flexShrink: 0, marginTop: "1px" }} />
                      <span>Full access to Trading Journal</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12px", color: "rgba(237, 234, 227, 0.75)" }}>
                      <CheckCircle2 size={14} color="#10b981" style={{ flexShrink: 0, marginTop: "1px" }} />
                      <span>Basic Session Analytics & Insights</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12px", color: "rgba(237, 234, 227, 0.75)" }}>
                      <CheckCircle2 size={14} color="#10b981" style={{ flexShrink: 0, marginTop: "1px" }} />
                      <span>24 Hours Free Replay Access</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12px", color: "rgba(237, 234, 227, 0.75)" }}>
                      <CheckCircle2 size={14} color="#10b981" style={{ flexShrink: 0, marginTop: "1px" }} />
                      <span>Prop Firm Drawdown Calculator</span>
                    </div>
                  </div>

                  <Link
                    to="/login"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "100%",
                      padding: "13px",
                      borderRadius: "999px",
                      marginTop: "auto",
                      background: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.16)",
                      color: "#FFFFFF",
                      fontSize: "12px",
                      fontWeight: 700,
                      fontFamily: "'JetBrains Mono', monospace",
                      textDecoration: "none",
                      letterSpacing: "0.04em",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)"; e.currentTarget.style.borderColor = "#10b981"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)"; e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.16)"; }}
                  >
                    START FREE TRIAL
                  </Link>
                </div>

                {/* Plan 2: Pro Trader (Most Popular) */}
                <div
                  className="pricing-card"
                  style={{
                    background: "rgba(16, 36, 35, 0.95)",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    border: "2px solid #10b981",
                    borderRadius: "24px",
                    padding: "32px",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(16, 185, 129, 0.18)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      background: "linear-gradient(135deg, #10b981, #059669)",
                      color: "white",
                      fontSize: "9px",
                      fontWeight: 900,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      padding: "6px 14px",
                      borderBottomLeftRadius: "12px",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    MOST POPULAR
                  </div>

                  <div style={{ marginBottom: "20px", paddingBottom: "20px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                    <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "26px", color: "#FFFFFF", marginBottom: "4px" }}>
                      Pro Trader
                    </h3>
                    <p style={{ fontSize: "12px", color: "rgba(237, 234, 227, 0.6)" }}>
                      Full 10-year replay & AI coach suite
                    </p>
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                      <span style={{ fontSize: "24px", fontWeight: 700, color: "#FFFFFF" }}>$</span>
                      <OdometerPrice value={billingCycle === "yearly" ? 114 : 14} height={42} />
                      <span style={{ fontSize: "11px", fontFamily: "'JetBrains Mono', monospace", color: "rgba(237, 234, 227, 0.55)" }}>
                        {billingCycle === "yearly" ? "/year" : "/month"}
                      </span>
                    </div>
                    <div style={{ fontSize: "11px", color: "rgba(237, 234, 227, 0.4)", textDecoration: "line-through", fontFamily: "'JetBrains Mono', monospace", marginTop: "2px" }}>
                      {billingCycle === "yearly" ? "$228/year" : "$19/month"}
                    </div>
                    {/* Pop-in Save Badge */}
                    <div style={{ height: "26px", marginTop: "10px", display: "flex", alignItems: "center" }}>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "3px 9px",
                          borderRadius: "6px",
                          background: "rgba(16, 185, 129, 0.2)",
                          border: "1px solid rgba(16, 185, 129, 0.35)",
                          color: "#34d399",
                          fontSize: "10px",
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 700,
                          transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                        }}
                      >
                        {billingCycle === "yearly" ? "⚡ SAVE 50% ($114/yr)" : "⚡ SAVE 25% ($14/mo)"}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px", flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12px", color: "rgba(237, 234, 227, 0.85)" }}>
                      <CheckCircle2 size={14} color="#10b981" style={{ flexShrink: 0, marginTop: "1px" }} />
                      <span><strong>10 Years</strong> of historical tick replay data</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12px", color: "rgba(237, 234, 227, 0.85)" }}>
                      <CheckCircle2 size={14} color="#10b981" style={{ flexShrink: 0, marginTop: "1px" }} />
                      <span><strong>AI Psychology Coach</strong> (Pre-Trade Guard)</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12px", color: "rgba(237, 234, 227, 0.85)" }}>
                      <CheckCircle2 size={14} color="#10b981" style={{ flexShrink: 0, marginTop: "1px" }} />
                      <span>FTMO & Prop firm daily drawdown shield</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12px", color: "rgba(237, 234, 227, 0.85)" }}>
                      <CheckCircle2 size={14} color="#10b981" style={{ flexShrink: 0, marginTop: "1px" }} />
                      <span>Automated R-Multiple & session analytics</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12px", color: "rgba(237, 234, 227, 0.85)" }}>
                      <CheckCircle2 size={14} color="#10b981" style={{ flexShrink: 0, marginTop: "1px" }} />
                      <span>Private Discord Alpha community</span>
                    </div>
                  </div>

                  <IridescentButton
                    to="/login"
                    size="md"
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    {billingCycle === "yearly" ? "JOIN YEARLY ($114)" : "JOIN MONTHLY ($14)"}
                  </IridescentButton>
                </div>

              </div>
            </div>
          </section>

          {/* Frequently Asked Questions */}
          <section id="faq" className="px-5 py-20" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
            <div className="max-w-3xl mx-auto">
              <div style={{ textAlign: "center", marginBottom: "36px" }}>
                <div style={{
                  display: "inline-block", fontSize: "10px", fontWeight: 700, letterSpacing: "0.16em",
                  textTransform: "uppercase", color: "#E8732A",
                  padding: "5px 14px", borderRadius: "999px",
                  background: "rgba(232, 115, 42, 0.1)", border: "1px solid rgba(232, 115, 42, 0.25)",
                  marginBottom: "14px",
                  fontFamily: "'JetBrains Mono', monospace",
                }}>05 INQUIRIES · FREQUENTLY ASKED</div>
                <h2 style={{
                  fontFamily: "'Instrument Serif', Georgia, serif",
                  fontSize: "clamp(2rem, 4.2vw, 3.2rem)", fontWeight: 400,
                  color: "#FFFFFF", letterSpacing: "-0.02em", lineHeight: 1.1,
                }}>
                  Frequently Asked <span style={{ fontStyle: "italic", color: "#0E7C86" }}>Questions</span>
                </h2>
              </div>
              <div className="landing-faq" style={{ background: 'rgba(15, 29, 28, 0.88)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '22px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.35)' }}>
                {LANDING_FAQS.map((f) => (
                  <details key={f.q} className="group px-6 py-5" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold" style={{ color: "#EDEAE3", fontSize: "16px", cursor: "pointer" }}>
                      <span style={{ color: "#EDEAE3", fontWeight: 600, fontSize: "15px" }}>{f.q}</span>
                      <ChevronRight size={18} className="shrink-0 transition-transform group-open:rotate-90" style={{ color: "#0E7C86" }} />
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed" style={{ color: "rgba(237, 234, 227, 0.82)", fontSize: "14px", lineHeight: 1.7 }}>{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          {/* Discord Community CTA */}
          <section style={{ padding: "80px 20px", borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
            <div
              className="discord-cta-box"
              style={{
                maxWidth: "800px", margin: "0 auto",
                background: "rgba(15, 29, 28, 0.92)",
                backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "24px",
                padding: "clamp(36px, 6vw, 56px) clamp(20px, 4vw, 40px)", textAlign: "center",
                position: "relative", overflow: "hidden",
                boxShadow: "0 20px 60px rgba(0,0,0,0.4), 0 0 40px rgba(14, 124, 134, 0.15)",
              }}
            >
              <div style={{
                position: "absolute", top: "-40px", left: "50%", transform: "translateX(-50%)",
                width: "300px", height: "200px",
                background: "radial-gradient(ellipse, rgba(14, 124, 134, 0.2) 0%, transparent 70%)",
                pointerEvents: "none",
              }} />
              <div style={{
                width: 56, height: 56, borderRadius: "16px",
                background: "rgba(14, 124, 134, 0.2)", display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px",
                border: "1px solid rgba(14, 124, 134, 0.4)",
                boxShadow: "0 8px 32px rgba(14, 124, 134, 0.25)",
              }}>
                <MessageSquare size={26} color="#5FD4E8" />
              </div>
              <div style={{
                display: "inline-block", fontSize: "10px", fontWeight: 700, letterSpacing: "0.16em",
                textTransform: "uppercase", color: "#5FD4E8",
                padding: "5px 14px", borderRadius: "999px",
                background: "rgba(95, 212, 232, 0.1)", border: "1px solid rgba(95, 212, 232, 0.25)",
                marginBottom: "14px",
                fontFamily: "'JetBrains Mono', monospace",
              }}>06 TRADER SANCTUARY · DISCORD NETWORK</div>
              <h2 style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: "clamp(1.8rem,3.6vw,2.8rem)", fontWeight: 400,
                color: "#FFFFFF", letterSpacing: "-0.02em", marginBottom: "12px",
              }}>
                Join the Official Forex Notes <span style={{ fontStyle: "italic", color: "#E8732A" }}>Community</span>
              </h2>
              <p style={{ fontSize: "14px", color: "rgba(237, 234, 227, 0.7)", maxWidth: "500px", margin: "0 auto 28px", lineHeight: 1.7 }}>
                Network with funded traders, share playbook setups, discuss daily market outlooks, and get direct technical support.
              </p>
              <IridescentButton
                href="https://discord.gg/Ajaw3AjfWE"
                target="_blank"
                rel="noopener noreferrer"
                size="lg"
              >
                ENTER DISCORD SERVER
              </IridescentButton>
            </div>
          </section>

        </div>
      </div>

      {/* ── 05 FOOTER WITH PARTICLE CLOAK CANVAS (Over DOM plate + SEO Links) ── */}
      <ParticleCloakFooter />

      {/* ── Live Trader Social Proof Toast (Bottom-Left) ── */}
      <SocialProofToast />
    </div>
  );
}
