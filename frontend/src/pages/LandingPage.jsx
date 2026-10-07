// frontend/src/pages/LandingPage.jsx
// Cinematic Scrollytelling Landing Page — Forex Notes
// Stack: GSAP + ScrollTrigger, Lenis smooth scroll, React Three Fiber, Glassmorphism

import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Lock,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Zap,
  TrendingUp,
  Star,
} from "lucide-react";

// Landing Components
import { useLenis } from "../components/landing/useLenis";
import AmbientBackground from "../components/landing/AmbientBackground";
import LandingHero from "../components/landing/LandingHero";
import MarketingVideos from "../components/landing/MarketingVideos";
import LandingDashboard from "../components/landing/LandingDashboard";
import FeaturesBento from "../components/landing/FeaturesBento";
import ExtraVideos from "../components/landing/ExtraVideos";

gsap.registerPlugin(ScrollTrigger);

// ─── Trader Testimonials with real photos ───────────────────────────────────
const REVIEWS = [
  {
    photo: "/trader_alex.png",
    name: "Alex P.",
    firm: "Funded $100k FTMO",
    flag: "🇬🇧",
    text: "The AI coach literally saved my FTMO challenge. I was tilted on XAUUSD and about to revenge trade after a -2R loss. It blocked me before I could breach my daily limit.",
    highlight: "Saved FTMO Daily Drawdown",
    highlightColor: "#10b981",
  },
  {
    photo: "/trader_sarah.png",
    name: "Sarah J.",
    firm: "Funded $300k Topstep",
    flag: "🇮🇳",
    text: "Prop firm guardian is a game changer for futures and crypto. I never manually calculate my drawdown limits again. It alerts me at 70% of my trailing max loss.",
    highlight: "Zero rule breaches in 3 months",
    highlightColor: "#10b981",
  },
  {
    photo: "/trader_mike.png",
    name: "Mike T.",
    firm: "Phase 2 Apex Trader",
    flag: "🇺🇸",
    text: "The lot size calculator is wicked fast for Bitcoin and NAS100. Having it integrated right next to my journal — no more switching between spreadsheets mid-session.",
    highlight: "Saves 45 min per trading day",
    highlightColor: "#10b981",
  },
  {
    photo: "/trader_ravi.png",
    name: "Ravi K.",
    firm: "Funded $200k FundingPips",
    flag: "🇮🇳",
    text: "Finally stopped over-leveraging on Gold. The psychology pre-check forces you to pause and assess before execution. It catches my FOMO every single time.",
    highlight: "0 revenge trades since joining",
    highlightColor: "#ec4899",
  },
  {
    photo: "/trader_james.png",
    name: "James L.",
    firm: "Funded $50k FTMO",
    flag: "🇦🇺",
    text: "R-multiple tracking showed I was leaving a ton of money on the table exiting XAUUSD early. Fixed my exits in 2 weeks after seeing my data. My PF jumped from 1.4 to 2.1.",
    highlight: "PF jumped from 1.4 → 2.1 in 2 weeks",
    highlightColor: "#059669",
  },
  {
    photo: "/trader_nina.png",
    name: "Nina B.",
    firm: "Funded $100k MyFundedFX",
    flag: "🇷🇴",
    text: "Switching from Notion to this saved my funded account. The calendar heatmap showed me I should never trade Crypto on weekends — insight paid for this tool 100x.",
    highlight: "Identified her worst trading day",
    highlightColor: "#f59e0b",
  },
  // Duplicates for seamless marquee loop
  {
    photo: "/trader_alex.png",
    name: "Alex P.",
    firm: "Funded $100k FTMO",
    flag: "🇬🇧",
    text: "The AI coach literally saved my FTMO challenge. I was tilted on XAUUSD and about to revenge trade after a -2R loss. It blocked me before I could breach my daily limit.",
    highlight: "Saved FTMO Daily Drawdown",
    highlightColor: "#10b981",
  },
  {
    photo: "/trader_sarah.png",
    name: "Sarah J.",
    firm: "Funded $300k Topstep",
    flag: "🇮🇳",
    text: "Prop firm guardian is a game changer for futures and crypto. I never manually calculate my drawdown limits again. It alerts me at 70% of my trailing max loss.",
    highlight: "Zero rule breaches in 3 months",
    highlightColor: "#10b981",
  },
  {
    photo: "/trader_mike.png",
    name: "Mike T.",
    firm: "Phase 2 Apex Trader",
    flag: "🇺🇸",
    text: "The lot size calculator is wicked fast for Bitcoin and NAS100. Having it integrated right next to my journal — no more switching between spreadsheets mid-session.",
    highlight: "Saves 45 min per trading day",
    highlightColor: "#10b981",
  },
  {
    photo: "/trader_ravi.png",
    name: "Ravi K.",
    firm: "Funded $200k FundingPips",
    flag: "🇮🇳",
    text: "Finally stopped over-leveraging on Gold. The psychology pre-check forces you to pause and assess before execution. It catches my FOMO every single time.",
    highlight: "0 revenge trades since joining",
    highlightColor: "#ec4899",
  },
  {
    photo: "/trader_james.png",
    name: "James L.",
    firm: "Funded $50k FTMO",
    flag: "🇦🇺",
    text: "R-multiple tracking showed I was leaving a ton of money on the table exiting XAUUSD early. Fixed my exits in 2 weeks after seeing my data. My PF jumped from 1.4 to 2.1.",
    highlight: "PF jumped from 1.4 → 2.1 in 2 weeks",
    highlightColor: "#059669",
  },
  {
    photo: "/trader_nina.png",
    name: "Nina B.",
    firm: "Funded $100k MyFundedFX",
    flag: "🇷🇴",
    text: "Switching from Notion to this saved my funded account. The calendar heatmap showed me I should never trade Crypto on weekends — insight paid for this tool 100x.",
    highlight: "Identified her worst trading day",
    highlightColor: "#f59e0b",
  },
];

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
        background: "rgba(12,16,24,0.7)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${color}30`,
        borderRadius: "20px",
        opacity: 0,
      }}
    >
      <div style={{ fontSize: "clamp(2.5rem,5vw,3.5rem)", fontWeight: 900, color, letterSpacing: "-0.04em", marginBottom: "8px" }}>
        {value}
      </div>
      <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{label}</p>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function LandingPage() {
  // Initialize Lenis smooth scroll (drives GSAP ScrollTrigger)
  useLenis();

  const comparisonRef = useRef(null);
  const pricingRef = useRef(null);

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
      style={{
        minHeight: "100vh",
        background: "#000000",
        color: "white",
        fontFamily: "'Inter', sans-serif",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      {/* Fixed ambient glow layer */}
      <AmbientBackground />

      {/* Content layer */}
      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ── Announcement Bar ── */}
        <div style={{
          background: "linear-gradient(90deg, rgba(245,158,11,0.2) 0%, rgba(252,211,77,0.25) 50%, rgba(245,158,11,0.2) 100%)",
          borderBottom: "1px solid rgba(252,211,77,0.4)",
          boxShadow: "0 0 24px rgba(245,158,11,0.2), inset 0 0 12px rgba(252,211,77,0.15)",
          padding: "10px 20px",
          textAlign: "center",
          fontSize: "12px",
          fontWeight: 800,
          color: "#fcd34d",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          letterSpacing: "0.03em",
          textShadow: "0 0 8px rgba(245,158,11,0.6)",
        }}>
          <span>Forex Notes — Track, analyze, and optimize your trading strategy automatically.</span>
          <Link to="/login" style={{ color: "#fbbf24", display: "inline-flex", alignItems: "center", gap: "2px", fontWeight: 900, textDecoration: "underline" }}>
            Claim Access <ChevronRight size={12} />
          </Link>
        </div>

        {/* ── Navigation ── */}
        <header style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          background: "rgba(0,0,0,0.75)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 24px",
            height: "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            {/* Logo */}
            <Link to="/" style={{ display: "flex", alignItems: "center" }}><img src="/logo3d.png" alt="ForexNotes" style={{ height: "48px", objectFit: "contain", filter: "drop-shadow(0 0 16px rgba(16,185,129,0.6))" }} /></Link>

            {/* Nav Links */}
            <nav style={{ display: "flex", gap: "32px", alignItems: "center" }}>
              {[
                { href: "#features", label: "Features" },
                { href: "#comparison", label: "vs. Spreadsheets" },
                { href: "#pricing", label: "Pricing" },
                { href: "https://discord.gg/Ajaw3AjfWE", label: "Community", external: true },
              ].map(({ href, label, external }) => (
                <a
                  key={label}
                  href={href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.5)",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = "white"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
                  className="hidden md:block"
                >
                  {label}
                </a>
              ))}
            </nav>

            {/* Header CTAs */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Link to="/login" style={{
                fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em",
                padding: "8px 16px", borderRadius: "8px",
                color: "rgba(255,255,255,0.6)",
                background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
                textDecoration: "none", transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "white"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
              >
                Sign In
              </Link>
              <Link to="/login" style={{
                fontSize: "11px", fontWeight: 800, letterSpacing: "0.05em",
                padding: "9px 18px", borderRadius: "8px",
                background: "linear-gradient(135deg, #10b981, #047857)",
                color: "white", textDecoration: "none",
                boxShadow: "0 4px 16px rgba(16,185,129,0.35)",
                display: "flex", alignItems: "center", gap: "6px",
                transition: "box-shadow 0.2s, transform 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(16,185,129,0.5)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(16,185,129,0.35)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                Get Access <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </header>

        {/* ── HERO (Text) ── */}
        <LandingHero />

        {/* ── Marketing Videos ── */}
        <MarketingVideos />

        {/* ── Dashboard Mockup ── */}
        <LandingDashboard />

        {/* ── Features Bento ── */}
        <FeaturesBento />

        {/* ── Stats Row ── */}
        <section style={{ padding: "80px 20px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ maxWidth: "900px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
            <AnimatedStat value="3,200+" label="Funded traders using Forex Notes daily" color="#10b981" />
            <AnimatedStat value="$11" label="Affordable monthly & yearly plans available" color="#f59e0b" />
            <AnimatedStat value="94%" label="Users report fewer rule violations within 30 days" color="#10b981" />
          </div>
        </section>

        {/* ── Comparison Section ── */}
        <section
          id="comparison"
          ref={comparisonRef}
          style={{ padding: "100px 20px", borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div style={{ maxWidth: "960px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "56px" }}>
              <div style={{
                display: "inline-block",
                fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em",
                textTransform: "uppercase", color: "#10b981",
                padding: "5px 14px", borderRadius: "999px",
                background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
                marginBottom: "16px",
              }}>Direct Comparison</div>
              <h2 style={{
                fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 900,
                color: "white", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "12px",
              }}>
                Why Traders Ditch Excel & Notion
              </h2>
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)", maxWidth: "480px", margin: "0 auto", lineHeight: 1.7 }}>
                Manual spreadsheets leave you blind to emotional drawdown points and prop firm rules.
              </p>
            </div>

            <div style={{
              background: "rgba(12,16,24,0.8)", backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", overflow: "hidden",
            }}>
              {/* Table Header */}
              <div style={{
                display: "grid", gridTemplateColumns: "2fr 2fr 2fr",
                padding: "14px 24px",
                background: "rgba(255,255,255,0.03)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}>
                <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>Metric</span>
                <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>Spreadsheets / Notion</span>
                <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#10b981" }}>Forex Notes ✓</span>
              </div>
              {COMPARISON.map((row, i) => (
                <div
                  key={i}
                  className="comp-row"
                  style={{
                    display: "grid", gridTemplateColumns: "2fr 2fr 2fr",
                    padding: "16px 24px",
                    borderBottom: i < COMPARISON.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    opacity: 0,
                  }}
                >
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "white" }}>{row.metric}</span>
                  <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>{row.manual}</span>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#10b981", display: "flex", alignItems: "center", gap: "6px" }}>
                    <CheckCircle2 size={13} /> {row.journal}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Testimonials Marquee (Real Photos) ── */}
        <section style={{ padding: "100px 0", borderTop: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
          <div style={{ maxWidth: "960px", margin: "0 auto 56px", textAlign: "center", padding: "0 20px" }}>
            <div style={{
              display: "inline-block", fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em",
              textTransform: "uppercase", color: "#10b981",
              padding: "5px 14px", borderRadius: "999px",
              background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
              marginBottom: "16px",
            }}>Trader Testimonials</div>
            <h2 style={{
              fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 900,
              color: "white", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "12px",
            }}>
              Trusted by Funded Traders<br />
              <span style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>
                Across 40+ Countries
              </span>
            </h2>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", marginTop: "12px" }}>
              {[...Array(5)].map((_, i) => <Star key={i} size={16} color="#f59e0b" fill="#f59e0b" />)}
              <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginLeft: "8px" }}>4.9/5 from 3,200+ traders</span>
            </div>
          </div>

          {/* Marquee Track */}
          <div style={{ overflow: "hidden", width: "100%" }}>
            <div style={{
              display: "flex",
              width: "max-content",
              animation: "marquee 40s linear infinite",
            }}>
              {REVIEWS.map((r, i) => (
                <div
                  key={i}
                  style={{
                    width: "360px",
                    flexShrink: 0,
                    marginRight: "20px",
                    background: "rgba(12,16,24,0.8)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "20px",
                    padding: "24px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                  }}
                >
                  {/* Stars */}
                  <div style={{ display: "flex", gap: "3px", marginBottom: "14px" }}>
                    {[...Array(5)].map((_, j) => <Star key={j} size={12} color="#f59e0b" fill="#f59e0b" />)}
                  </div>

                  {/* Review text */}
                  <p style={{
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.65)",
                    lineHeight: 1.65,
                    marginBottom: "16px",
                    fontStyle: "italic",
                  }}>
                    "{r.text}"
                  </p>

                  {/* Highlight badge */}
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    background: `${r.highlightColor}15`,
                    border: `1px solid ${r.highlightColor}30`,
                    fontSize: "10px",
                    fontWeight: 700,
                    color: r.highlightColor,
                    marginBottom: "16px",
                    letterSpacing: "0.02em",
                  }}>
                    <Zap size={9} />
                    {r.highlight}
                  </div>

                  {/* Author */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "14px" }}>
                    <img
                      src={r.photo}
                      alt={r.name}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "2px solid rgba(255,255,255,0.1)",
                        flexShrink: 0,
                        background: "#1a2030",
                      }}
                      onError={e => {
                        // Fallback to gradient avatar if image fails
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div style={{
                      width: 44, height: 44, borderRadius: "50%",
                      background: "linear-gradient(135deg, #10b981, #059669)",
                      display: "none", alignItems: "center", justifyContent: "center",
                      fontSize: "14px", fontWeight: 800, color: "white", flexShrink: 0,
                    }}>
                      {r.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 800, color: "white" }}>
                        {r.flag} {r.name}
                      </div>
                      <div style={{ fontSize: "11px", color: "#10b981", fontWeight: 600, marginTop: "2px" }}>
                        {r.firm}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section
          id="pricing"
          style={{ padding: "100px 20px", borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div style={{ maxWidth: "640px", margin: "0 auto", textAlign: "center" }}>
            <div style={{
              display: "inline-block", fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em",
              textTransform: "uppercase", color: "#10b981",
              padding: "5px 14px", borderRadius: "999px",
              background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
              marginBottom: "16px",
            }}>Transparent Pricing</div>
            <h2 style={{
              fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 900,
              color: "white", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "12px",
            }}>
              Choose Your Plan.<br />Cancel Anytime.
            </h2>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)", marginBottom: "48px", lineHeight: 1.7 }}>
              Select the best plan that fits your trading journey. Gain instant access today.
            </p>

            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', textAlign: 'left' }}>
              {/* Monthly Plan */}
              <div
                className="pricing-card"
                style={{
                  background: "rgba(12,16,24,0.85)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  border: "1px solid rgba(16,185,129,0.35)",
                  borderRadius: "24px",
                  padding: "40px",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: "0 0 40px rgba(16,185,129,0.05), 0 40px 80px rgba(0,0,0,0.6)",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px", paddingBottom: "32px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div>
                    <h3 style={{ fontSize: "22px", fontWeight: 900, color: "white", letterSpacing: "-0.02em", marginBottom: "6px" }}>
                      Monthly Plan
                    </h3>
                    <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
                      Pay as you go access
                    </p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "20px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textDecoration: "line-through", marginBottom: "-4px" }}>$19</div>
                    <div style={{ fontSize: "42px", fontWeight: 900, color: "white", letterSpacing: "-0.04em", lineHeight: 1 }}>$14</div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>/month</div>
                    <div style={{ fontSize: "10px", fontWeight: 700, color: "#10b981", marginTop: "6px", letterSpacing: "0.02em" }}>+ 10% affiliate rewards</div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
                  {PRICING_FEATURES.slice(0, 5).map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12px", color: "rgba(255,255,255,0.65)" }}>
                      <CheckCircle2 size={14} color="#10b981" style={{ flexShrink: 0, marginTop: "1px" }} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <Link
                  to="/login"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    width: "100%", padding: "16px", borderRadius: "14px",
                    background: "transparent",
                    border: "1px solid rgba(16,185,129,0.4)",
                    color: "white", fontSize: "14px", fontWeight: 800,
                    textDecoration: "none", letterSpacing: "0.01em",
                    transition: "all 0.2s",
                  }}
                >
                  Join Monthly
                </Link>
              </div>

              {/* Yearly Plan */}
              <div
                className="pricing-card"
                style={{
                  background: "rgba(12,16,24,0.85)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  border: "2px solid #10b981",
                  borderRadius: "24px",
                  padding: "40px",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: "0 0 80px rgba(16,185,129,0.15), 0 40px 80px rgba(0,0,0,0.6)",
                }}
              >
                {/* Glow */}
                <div style={{
                  position: "absolute", top: "-60px", right: "-60px",
                  width: "300px", height: "300px",
                  background: "radial-gradient(ellipse, rgba(16,185,129,0.2) 0%, transparent 70%)",
                  pointerEvents: "none",
                }} />
                
                {/* Badge */}
                <div style={{
                  position: "absolute", top: 0, right: 0,
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  color: "white", fontSize: "9px", fontWeight: 900,
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  padding: "8px 20px", borderBottomLeftRadius: "12px",
                }}>
                  Best Value
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px", paddingBottom: "32px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div>
                    <h3 style={{ fontSize: "22px", fontWeight: 900, color: "white", letterSpacing: "-0.02em", marginBottom: "6px" }}>
                      Yearly Plan
                    </h3>
                    <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
                      Save 30% annually
                    </p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "20px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textDecoration: "line-through", marginBottom: "-4px" }}>$168</div>
                    <div style={{ fontSize: "42px", fontWeight: 900, color: "white", letterSpacing: "-0.04em", lineHeight: 1 }}>$117</div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>/year</div>
                    <div style={{ fontSize: "10px", fontWeight: 700, color: "#10b981", marginTop: "6px", letterSpacing: "0.02em" }}>+ 10% affiliate rewards</div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
                  {PRICING_FEATURES.map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12px", color: "rgba(255,255,255,0.65)" }}>
                      <CheckCircle2 size={14} color="#10b981" style={{ flexShrink: 0, marginTop: "1px" }} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <Link
                  to="/login"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    width: "100%", padding: "16px", borderRadius: "14px",
                    background: "linear-gradient(135deg, #10b981, #047857)",
                    color: "white", fontSize: "14px", fontWeight: 800,
                    textDecoration: "none", letterSpacing: "0.01em",
                    boxShadow: "0 8px 32px rgba(16,185,129,0.4)",
                    transition: "all 0.2s",
                  }}
                >
                  <Zap size={16} />
                  Join Yearly
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <ExtraVideos />

        {/* ── Discord Community CTA ── */}
        <section style={{ padding: "80px 20px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{
            maxWidth: "800px", margin: "0 auto",
            background: "linear-gradient(135deg, rgba(88,101,242,0.15) 0%, rgba(12,16,24,0.9) 100%)",
            backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(88,101,242,0.3)", borderRadius: "24px",
            padding: "56px 40px", textAlign: "center",
            position: "relative", overflow: "hidden",
            boxShadow: "0 0 60px rgba(88,101,242,0.1)",
          }}>
            <div style={{
              position: "absolute", top: "-40px", left: "50%", transform: "translateX(-50%)",
              width: "300px", height: "200px",
              background: "radial-gradient(ellipse, rgba(88,101,242,0.2) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />
            <div style={{
              width: 56, height: 56, borderRadius: "16px",
              background: "#5865F2", display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
              boxShadow: "0 8px 32px rgba(88,101,242,0.4)",
            }}>
              <MessageSquare size={26} color="white" />
            </div>
            <h2 style={{
              fontSize: "clamp(1.5rem,3vw,2.2rem)", fontWeight: 900,
              color: "white", letterSpacing: "-0.02em", marginBottom: "12px",
            }}>
              Join the Official Forex Notes Community
            </h2>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)", maxWidth: "500px", margin: "0 auto 28px", lineHeight: 1.7 }}>
              Network with funded traders, share playbook setups, discuss daily market outlooks, and get direct technical support.
            </p>
            <a
              href="https://discord.gg/Ajaw3AjfWE"
              target="_blank" rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "14px 32px", borderRadius: "12px",
                background: "#5865F2", color: "white",
                fontSize: "14px", fontWeight: 800,
                textDecoration: "none",
                boxShadow: "0 8px 32px rgba(88,101,242,0.35)",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 12px 40px rgba(88,101,242,0.55)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 8px 32px rgba(88,101,242,0.35)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <MessageSquare size={16} />
              Enter Discord Server <ChevronRight size={14} />
            </a>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          padding: "40px 20px",
          background: "rgba(0,0,0,0.6)",
        }}>
          <div style={{
            maxWidth: "1200px", margin: "0 auto",
            display: "flex", flexWrap: "wrap",
            alignItems: "center", justifyContent: "space-between", gap: "16px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Activity size={16} color="#10b981" />
              <span style={{ fontSize: "14px", fontWeight: 800, color: "white" }}>Forex Notes</span>
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
                © {new Date().getFullYear()} All Rights Reserved.
              </span>
            </div>
            <div style={{ display: "flex", gap: "24px" }}>
              {[
                { href: "https://discord.gg/Ajaw3AjfWE", label: "Discord", external: true },
                { href: "https://instagram.com/forexnotes.in", label: "Instagram", external: true },
                { href: "/login", label: "Sign In", external: false },
              ].map(({ href, label, external }) =>
                external ? (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", textDecoration: "none", transition: "color 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.color = "white"}
                    onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
                  >{label}</a>
                ) : (
                  <Link key={label} to={href}
                    style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", textDecoration: "none", transition: "color 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.color = "white"}
                    onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
                  >{label}</Link>
                )
              )}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
