// frontend/src/pages/LandingPage.jsx
// Cinematic Scrollytelling Landing Page — Forex Notes
// Sequence: Ship Hero (Veloria) → Mako Shark → Kingfisher Bird → Dot Grid Singularity Canvas → Liquid Glass Carousel → Bento Features → Comparison → 3D Rolodex Reviews → Pricing → FAQ → Discord → Particle Cloak Footer

import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  MessageSquare,
  Zap,
} from "lucide-react";

// Landing Components
import { useLenis } from "../components/landing/useLenis";
import MakoSharkSection from "../components/landing/MakoSharkSection";
import KingfisherSection from "../components/landing/KingfisherSection";
import LiquidGlassCarousel from "../components/landing/LiquidGlassCarousel";
import FeaturesBento from "../components/landing/FeaturesBento";
import RolodexReviews from "../components/landing/RolodexReviews";
import ParticleCloakFooter from "../components/landing/ParticleCloakFooter";
import IridescentButton from "../components/landing/IridescentButton";
import { LANDING_FAQS } from "../data/seoPages";

gsap.registerPlugin(ScrollTrigger);

const COMPARISON = [
  { metric: "Data Privacy", manual: "Stored on Google's servers", journal: "Encrypted & User-Owned" },
  { metric: "Execution Tracking", manual: "Messy spreadsheet formulas", journal: "One-click R-Multiple calculation" },
  { metric: "Psychology & Emotion", manual: "Ignored or forgotten", journal: "Built-in AI Pre-Trade Guard" },
  { metric: "Prop Firm Drawdown", manual: "Manual calculation errors", journal: "Automated breach threshold alerts" },
  { metric: "Lot Size Sizing", manual: "Error-prone mental math", journal: "Precision calculator built-in" },
  { metric: "Pricing Model", manual: "Monthly $30–50/mo forever", journal: "Flexible Monthly & Yearly Memberships" },
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

// ─── Stat Counter ────────────────────────────────────────────────────────────
function AnimatedStat({ value, label, color }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      once: true,
      onEnter: () => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }
        );
      },
    });
    return () => trigger.kill();
  }, []);

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
        {value}
      </div>
      <p style={{ fontSize: "13px", color: "rgba(237, 234, 227, 0.75)", lineHeight: 1.5, fontFamily: "'Manrope', sans-serif" }}>{label}</p>
    </div>
  );
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function LandingPage() {
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
          { opacity: 0, x: -30 },
          {
            opacity: 1,
            x: 0,
            duration: 0.5,
            delay: i * 0.08,
            ease: "power2.out",
            scrollTrigger: {
              trigger: row,
              start: "top 90%",
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
        @media (max-width: 640px) {
          .pricing-card {
            padding: 22px !important;
          }
          .comp-table-wrapper {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
          }
          .comp-table-inner {
            min-width: 520px !important;
          }
          .risk-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .discord-cta-box {
            padding: 36px 18px !important;
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

          {/* In-App Screenshots: Liquid Glass WebGL Carousel */}
          <LiquidGlassCarousel />

          {/* Features Bento */}
          <FeaturesBento />

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
                    display: "grid", gridTemplateColumns: "2fr 2fr 2fr",
                    padding: "16px 24px",
                    background: "rgba(255, 255, 255, 0.03)",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                  }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(237, 234, 227, 0.6)" }}>Metric</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(237, 234, 227, 0.6)" }}>Spreadsheets / Notion</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#5FD4E8" }}>Forex Notes ✓</span>
                  </div>
                  {COMPARISON.map((row, i) => (
                    <div
                      key={i}
                      className="comp-row"
                      style={{
                        display: "grid", gridTemplateColumns: "2fr 2fr 2fr",
                        padding: "16px 24px",
                        borderBottom: i < COMPARISON.length - 1 ? "1px solid rgba(255, 255, 255, 0.04)" : "none",
                        opacity: 0,
                      }}
                    >
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#FFFFFF" }}>{row.metric}</span>
                      <span style={{ fontSize: "12px", color: "rgba(237, 234, 227, 0.6)" }}>{row.manual}</span>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#5FD4E8", display: "flex", alignItems: "center", gap: "6px" }}>
                        <CheckCircle2 size={13} color="#5FD4E8" /> {row.journal}
                      </span>
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
            }}
          >
            <div style={{ maxWidth: "860px", margin: "0 auto", textAlign: "center" }}>
              <div style={{
                display: "inline-block", fontSize: "10px", fontWeight: 700, letterSpacing: "0.16em",
                textTransform: "uppercase", color: "#E8732A",
                padding: "5px 14px", borderRadius: "999px",
                background: "rgba(232, 115, 42, 0.1)", border: "1px solid rgba(232, 115, 42, 0.25)",
                marginBottom: "16px",
                fontFamily: "'JetBrains Mono', monospace",
              }}>04 MEMBERSHIP · TRANSPARENT PRICING</div>
              <h2 style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: "clamp(2.2rem, 4.8vw, 3.6rem)", fontWeight: 400,
                color: "#FFFFFF", letterSpacing: "-0.02em", lineHeight: 1.05, marginBottom: "12px",
              }}>
                Choose Your Plan.<br /><span style={{ fontStyle: "italic", color: "#0E7C86" }}>Cancel Anytime.</span>
              </h2>
              <p style={{ fontSize: "14px", color: "rgba(237, 234, 227, 0.7)", marginBottom: "40px", lineHeight: 1.7, maxWidth: "520px", margin: "0 auto 40px" }}>
                Select the best plan that fits your trading journey. Gain instant access today with card or USDT BEP-20.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', textAlign: 'left', maxWidth: '820px', margin: '0 auto' }}>
                {/* Monthly Plan */}
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
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px", paddingBottom: "24px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                    <div>
                      <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "26px", fontWeight: 400, color: "#FFFFFF", letterSpacing: "0.01em", marginBottom: "4px" }}>
                        Monthly Plan
                      </h3>
                      <p style={{ fontSize: "12px", color: "rgba(237, 234, 227, 0.6)" }}>
                        Pay as you go access
                      </p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: "16px", fontWeight: 700, color: "rgba(237, 234, 227, 0.4)", textDecoration: "line-through", marginBottom: "-2px" }}>$19</div>
                      <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "42px", fontWeight: 400, color: "#FFFFFF", letterSpacing: "-0.02em", lineHeight: 1 }}>$14</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", fontWeight: 700, color: "rgba(237, 234, 227, 0.55)" }}>/month</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", fontWeight: 700, color: "#0E7C86", marginTop: "4px", letterSpacing: "0.02em" }}>+ 10% affiliate rewards</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>
                    {PRICING_FEATURES.slice(0, 5).map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12px", color: "rgba(237, 234, 227, 0.75)" }}>
                        <CheckCircle2 size={14} color="#0E7C86" style={{ flexShrink: 0, marginTop: "1px" }} />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <Link
                    to="/login"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                      width: "100%", padding: "13px", borderRadius: "999px", marginTop: "auto",
                      background: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.16)",
                      color: "#FFFFFF", fontSize: "13px", fontWeight: 700,
                      textDecoration: "none", letterSpacing: "0.02em",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)"; e.currentTarget.style.borderColor = "#0E7C86"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)"; e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.16)"; }}
                  >
                    <span>Join Monthly</span>
                    <ArrowRight size={13} color="#0E7C86" />
                  </Link>
                </div>

                {/* Yearly Plan */}
                <div
                  className="pricing-card"
                  style={{
                    background: "rgba(23, 42, 40, 0.95)",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    border: "2px solid #E8732A",
                    borderRadius: "24px",
                    padding: "32px",
                    position: "relative",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(232, 115, 42, 0.15)",
                  }}
                >
                  {/* Glow */}
                  <div style={{
                    position: "absolute", top: "-60px", right: "-60px",
                    width: "300px", height: "300px",
                    background: "radial-gradient(ellipse, rgba(232, 115, 42, 0.2) 0%, transparent 70%)",
                    pointerEvents: "none",
                  }} />

                  {/* Badge */}
                  <div style={{
                    position: "absolute", top: 0, right: 0,
                    background: "linear-gradient(135deg, #E8732A, #F3A15E)",
                    color: "white", fontSize: "9px", fontWeight: 900,
                    letterSpacing: "0.1em", textTransform: "uppercase",
                    padding: "6px 14px", borderBottomLeftRadius: "12px",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    50% OFF YEARLY · BEST VALUE
                  </div>

                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px", paddingBottom: "24px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                    <div>
                      <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "26px", fontWeight: 400, color: "#FFFFFF", letterSpacing: "0.01em", marginBottom: "4px" }}>
                        Yearly Plan
                      </h3>
                      <p style={{ fontSize: "12px", color: "rgba(237, 234, 227, 0.6)" }}>
                        Massive 50% discount! Hurry up, grab it ASAP!
                      </p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: "16px", fontWeight: 700, color: "rgba(237, 234, 227, 0.4)", textDecoration: "line-through", marginBottom: "-2px" }}>$228</div>
                      <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "42px", fontWeight: 400, color: "#FFFFFF", letterSpacing: "-0.02em", lineHeight: 1 }}>$114</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", fontWeight: 700, color: "rgba(237, 234, 227, 0.55)" }}>/year</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", fontWeight: 700, color: "#E8732A", marginTop: "4px", letterSpacing: "0.02em" }}>+ 10% affiliate rewards</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>
                    {PRICING_FEATURES.map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12px", color: "rgba(237, 234, 227, 0.75)" }}>
                        <CheckCircle2 size={14} color="#E8732A" style={{ flexShrink: 0, marginTop: "1px" }} />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <IridescentButton
                    to="/login"
                    size="md"
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    JOIN YEARLY
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
    </div>
  );
}
