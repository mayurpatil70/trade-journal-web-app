import { useEffect } from "react";
import BrandLogo from "../components/BrandLogo";
import { Link, Navigate, useParams } from "react-router-dom";
import { Check, X, ChevronRight, ShieldCheck } from "lucide-react";
import { COMPETITORS, FOREX_NOTES, SECTIONS, comparisonRows, faqs } from "../data/competitorComparisons";
import SiteFooter from "../components/seo/SiteFooter";
import LandingNavbar from "../components/landing/LandingNavbar";

const SITE = "https://forexnotes.in";

const setMeta = (attr, key, content) => {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

function useSeo(slug, c) {
  useEffect(() => {
    if (!c) return undefined;
    document.head.querySelectorAll('[data-prerender]').forEach((el) => el.remove());
    const url = `${SITE}/vs/${slug}`;
    const prevTitle = document.title;
    document.title = c.title;
    setMeta("name", "description", c.description);
    setMeta("property", "og:title", c.title);
    setMeta("property", "og:description", c.description);
    setMeta("property", "og:url", url);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    const prevCanonical = canonical.href;
    canonical.href = url;
    canonical.disabled = false;

    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.text = JSON.stringify([
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: FOREX_NOTES.name,
        url: SITE,
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web, iOS, Android",
        offers: [
          { "@type": "Offer", price: String(FOREX_NOTES.monthly), priceCurrency: "USD", description: "Monthly plan" },
          { "@type": "Offer", price: String(FOREX_NOTES.yearly), priceCurrency: "USD", description: "Yearly plan" },
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs(c.name).map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ]);
    document.head.appendChild(ld);

    return () => {
      document.title = prevTitle;
      canonical.href = prevCanonical;
      ld.remove();
    };
  }, [slug, c]);
}

const Cell = ({ v }) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
    {v.ok ? (
      <Check size={16} color="#5FD4E8" style={{ marginTop: "2px", flexShrink: 0 }} />
    ) : (
      <X size={16} color="#F87171" style={{ marginTop: "2px", flexShrink: 0 }} />
    )}
    <span style={{ fontSize: "13px", color: v.ok ? "#EDEAE3" : "rgba(237, 234, 227, 0.6)" }}>{v.text}</span>
  </div>
);

export default function CompetitorVsPage() {
  const { competitorSlug } = useParams();
  const c = COMPETITORS[competitorSlug];
  useSeo(competitorSlug, c);

  // Ensure page always starts at the top upon route visit
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [competitorSlug]);

  if (!c) return <Navigate to="/" replace />;

  const yearlySaving = c.monthlyApprox ? c.monthlyApprox * 12 - FOREX_NOTES.yearly : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#05090E",
        color: "#EDEAE3",
        fontFamily: "'Manrope', sans-serif",
        overflowX: "hidden",
      }}
    >
      {/* ── UNIFIED SLEEK COMPACT TOP NAVIGATION ── */}
      <LandingNavbar isFixed={false} />

      {/* ── MAIN CONTENT CONTAINER ── */}
      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "48px 24px 80px" }}>
        {/* Hero Section */}
        <section style={{ textAlign: "center", paddingBottom: "56px" }}>
          <div
            style={{
              display: "inline-block",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#5FD4E8",
              padding: "6px 16px",
              borderRadius: "999px",
              background: "rgba(14, 124, 134, 0.12)",
              border: "1px solid rgba(95, 212, 232, 0.25)",
              marginBottom: "18px",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            01 DIRECT BENCHMARK · FOREX NOTES VS {c.name.toUpperCase()}
          </div>
          <h1
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: "clamp(2.4rem, 5vw, 4rem)",
              fontWeight: 400,
              color: "#FFFFFF",
              letterSpacing: "-0.02em",
              lineHeight: 1.08,
              maxWidth: "850px",
              margin: "0 auto 18px",
            }}
          >
            {c.h1}
          </h1>
          <p
            style={{
              fontSize: "16px",
              color: "rgba(237, 234, 227, 0.75)",
              maxWidth: "680px",
              margin: "0 auto 32px",
              lineHeight: 1.7,
            }}
          >
            {c.hook}
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "14px" }}>
            <Link
              to="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 28px",
                borderRadius: "999px",
                background: "linear-gradient(135deg, #E8732A 0%, #F3A15E 100%)",
                color: "#0F1D1C",
                fontSize: "14px",
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 6px 20px rgba(232, 115, 42, 0.35)",
              }}
            >
              Try Forex Notes Free for 24 Hours
              <span style={{ fontSize: "13px", fontWeight: 800 }}>↗</span>
            </Link>
          </div>
        </section>

        {/* Comparison Matrix Table */}
        <section aria-labelledby="matrix" style={{ marginBottom: "64px" }}>
          <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2
              id="matrix"
              style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: "28px",
                fontWeight: 400,
                color: "#FFFFFF",
              }}
            >
              Side-by-Side <span style={{ fontStyle: "italic", color: "#0E7C86" }}>Feature Matrix</span>
            </h2>
          </div>
          <div
            style={{
              overflowX: "auto",
              background: "rgba(15, 29, 28, 0.88)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "22px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
            }}
          >
            <table style={{ width: "100%", minWidth: "600px", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "rgba(255, 255, 255, 0.03)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                  <th style={{ padding: "16px 24px", fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(237, 234, 227, 0.6)" }}>Feature</th>
                  <th style={{ padding: "16px 24px", fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#5FD4E8" }}>Forex Notes ✓</th>
                  <th style={{ padding: "16px 24px", fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(237, 234, 227, 0.6)" }}>{c.name}</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows(competitorSlug).map((r, i) => (
                  <tr
                    key={r.key}
                    style={{
                      borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                      background: i % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.01)",
                    }}
                  >
                    <th scope="row" style={{ padding: "16px 24px", fontSize: "14px", fontWeight: 600, color: "rgba(237, 234, 227, 0.85)" }}>
                      {r.label}
                    </th>
                    <td style={{ padding: "16px 24px" }}>
                      <Cell v={r.ours} />
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <Cell v={r.theirs} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ marginTop: "12px", fontSize: "11px", color: "rgba(237, 234, 227, 0.4)", fontFamily: "'JetBrains Mono', monospace" }}>
            Based on publicly available vendor information. {c.name} is a trademark of its owner; Forex Notes is not affiliated with it.
          </p>
        </section>

        {/* Value Bento Cards */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "64px" }}>
          {SECTIONS.map((s, idx) => (
            <div
              key={s.h2}
              style={{
                background: "rgba(15, 29, 28, 0.75)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "20px",
                padding: "28px 24px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
              }}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: idx % 2 === 0 ? "#5FD4E8" : "#E8732A",
                  marginBottom: "10px",
                }}
              >
                {`PILLAR 0${idx + 1}`}
              </div>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#FFFFFF", marginBottom: "10px" }}>{s.h2}</h2>
              <p style={{ fontSize: "13px", color: "rgba(237, 234, 227, 0.7)", lineHeight: 1.6, margin: 0 }}>{s.body}</p>
            </div>
          ))}
        </section>

        {/* Pricing / Savings Callout */}
        <section
          style={{
            background: "rgba(15, 29, 28, 0.92)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "24px",
            padding: "48px 36px",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
            marginBottom: "64px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-40px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "300px",
              height: "180px",
              background: "radial-gradient(ellipse, rgba(232, 115, 42, 0.2) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <h2
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 400,
              color: "#FFFFFF",
              letterSpacing: "-0.02em",
              marginBottom: "12px",
            }}
          >
            {yearlySaving > 0 ? (
              <>
                Save about <span style={{ fontStyle: "italic", color: "#E8732A" }}>${yearlySaving}</span> a year
              </>
            ) : (
              <>
                Every feature, <span style={{ fontStyle: "italic", color: "#5FD4E8" }}>one simple price</span>
              </>
            )}
          </h2>
          <p
            style={{
              fontSize: "15px",
              color: "rgba(237, 234, 227, 0.75)",
              maxWidth: "540px",
              margin: "0 auto 28px",
              lineHeight: 1.6,
            }}
          >
            Forex Notes is ${FOREX_NOTES.monthly}/month or ${FOREX_NOTES.yearly}/year
            {c.monthlyApprox ? `, compared with roughly $${c.monthlyApprox}/month for ${c.name}.` : ", with journaling, backtesting and the AI coach included."}
          </p>
          <Link
            to="/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 28px",
              borderRadius: "999px",
              background: "linear-gradient(135deg, #E8732A 0%, #F3A15E 100%)",
              color: "#0F1D1C",
              fontSize: "14px",
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 6px 20px rgba(232, 115, 42, 0.4)",
            }}
          >
            Start Your Free Trial
            <span style={{ fontSize: "13px", fontWeight: 800 }}>↗</span>
          </Link>
        </section>

        {/* FAQs */}
        <section style={{ marginBottom: "64px" }}>
          <h2
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: "28px",
              fontWeight: 400,
              color: "#FFFFFF",
              marginBottom: "20px",
            }}
          >
            Frequently Asked <span style={{ fontStyle: "italic", color: "#0E7C86" }}>Questions</span>
          </h2>
          <div
            className="landing-faq"
            style={{
              background: "rgba(15, 29, 28, 0.88)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "22px",
              overflow: "hidden",
            }}
          >
            {faqs(c.name).map((f) => (
              <details
                key={f.q}
                className="group px-6 py-5"
                style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}
              >
                <summary
                  className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold"
                  style={{ color: "#EDEAE3", fontSize: "16px", cursor: "pointer" }}
                >
                  <span style={{ color: "#EDEAE3", fontWeight: 600, fontSize: "15px" }}>{f.q}</span>
                  <ChevronRight size={18} className="shrink-0 transition-transform group-open:rotate-90" style={{ color: "#0E7C86" }} />
                </summary>
                <p style={{ marginTop: "10px", color: "rgba(237, 234, 227, 0.8)", fontSize: "14px", lineHeight: 1.7, margin: 0 }}>
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Other Comparisons Nav */}
        <nav aria-label="Other comparisons" style={{ marginBottom: "32px" }}>
          <h3
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(237, 234, 227, 0.5)",
              marginBottom: "14px",
            }}
          >
            OTHER PLATFORM COMPARISONS
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {Object.entries(COMPETITORS)
              .filter(([slug]) => slug !== competitorSlug)
              .map(([slug, o]) => (
                <Link
                  key={slug}
                  to={`/vs/${slug}`}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "999px",
                    background: "rgba(15, 29, 28, 0.7)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    color: "#EDEAE3",
                    fontSize: "12px",
                    fontWeight: 600,
                    textDecoration: "none",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(95, 212, 232, 0.4)";
                    e.currentTarget.style.color = "#5FD4E8";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                    e.currentTarget.style.color = "#EDEAE3";
                  }}
                >
                  Forex Notes vs {o.name}
                </Link>
              ))}
          </div>
        </nav>
      </main>

      {/* ── UNIFIED KINGFISHER FOOTER ── */}
      <SiteFooter />
    </div>
  );
}
