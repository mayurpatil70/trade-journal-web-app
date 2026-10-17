import { useEffect, useMemo } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Check, ChevronRight } from 'lucide-react';
import { pageByPath, pageJsonLd, HREFLANG_GROUPS, DISCLAIMER, PRICE } from '../data/seoPages';
import { useSeo } from '../lib/seo';
import { WIDGETS } from '../components/seo/Calculators';
import SiteFooter from '../components/seo/SiteFooter';
import FourAssetClassesHero from '../components/seo/FourAssetClassesHero';
import LandingNavbar from '../components/landing/LandingNavbar';
import IridescentButton from '../components/landing/IridescentButton';

export default function SeoLandingPage() {
  const { pathname } = useLocation();
  const cleanPath = pathname.replace(/\/$/, '');
  const page = pageByPath[cleanPath];
  const jsonLd = useMemo(() => page && pageJsonLd(page), [page]);

  // Ensure page always starts at the top upon route visit
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [cleanPath]);

  useSeo({
    path: page?.path ?? pathname,
    title: page?.title ?? '',
    description: page?.description ?? '',
    jsonLd,
    alternates: page && HREFLANG_GROUPS[page.hreflang],
  });

  if (!page) return <Navigate to="/" replace />;
  const Widget = page.widget && WIDGETS[page.widget];
  const isFourAssetClasses = cleanPath === '/markets/four-asset-classes';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#05090E',
        color: '#EDEAE3',
        fontFamily: "'Manrope', sans-serif",
        overflowX: 'hidden',
      }}
    >
      {/* ── UNIFIED SLEEK COMPACT TOP NAVIGATION ── */}
      <LandingNavbar isFixed={false} />

      {/* ── MAIN CONTENT CONTAINER ── */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px 80px' }}>
        {isFourAssetClasses ? (
          <FourAssetClassesHero />
        ) : (
          /* ── STANDARD HERO BANNER ── */
          <section style={{ padding: '36px 0 60px' }}>
            {/* Eyebrow */}
            <div
              style={{
                display: 'inline-block',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#5FD4E8',
                padding: '6px 16px',
                borderRadius: '999px',
                background: 'rgba(14, 124, 134, 0.12)',
                border: '1px solid rgba(95, 212, 232, 0.25)',
                marginBottom: '18px',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {page.eyebrow}
            </div>

            {/* H1 Headline */}
            <h1
              style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: 'clamp(2.4rem, 5vw, 4rem)',
                fontWeight: 400,
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
                lineHeight: 1.08,
                maxWidth: '850px',
                marginBottom: '20px',
              }}
            >
              {page.h1}
            </h1>

            {/* Intro Copy */}
            <p
              style={{
                fontSize: 'clamp(16px, 1.8vw, 18px)',
                color: 'rgba(237, 234, 227, 0.78)',
                lineHeight: 1.7,
                maxWidth: '760px',
                marginBottom: '28px',
              }}
            >
              {page.intro}
            </p>

            {/* Hook Badge */}
            {page.hook && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 16px',
                  borderRadius: '999px',
                  background: 'rgba(232, 115, 42, 0.1)',
                  border: '1px solid rgba(232, 115, 42, 0.28)',
                  color: '#E8732A',
                  fontSize: '12px',
                  fontWeight: 600,
                  fontFamily: "'JetBrains Mono', monospace",
                  marginBottom: '32px',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E8732A', boxShadow: '0 0 8px #E8732A', flexShrink: 0 }} />
                {page.hook}
              </div>
            )}

            {/* CTA Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
              <IridescentButton to="/login" size="md">
                TRY FOREX NOTES FREE
              </IridescentButton>
              <a
                href="#faq"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  borderRadius: '999px',
                  background: 'rgba(15, 29, 28, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#EDEAE3',
                  fontSize: '14px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'border-color 0.2s ease',
                }}
              >
                Questions & Answers ↓
              </a>
            </div>
          </section>
        )}

        {/* ── CALCULATOR WIDGET (IF PRESENT) ── */}
        {Widget && (
          <section aria-label="Interactive Calculator" style={{ marginBottom: '56px' }}>
            <div
              style={{
                background: 'rgba(15, 29, 28, 0.85)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '24px',
                padding: '32px 28px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              }}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: '#5FD4E8',
                  marginBottom: '16px',
                }}
              >
                INTERACTIVE PROP FIRM RISK ENGINE
              </div>
              <Widget {...page.widgetProps} />
            </div>
          </section>
        )}

        {/* ── FEATURE SECTIONS ── */}
        <div id="specifications" style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginBottom: '60px' }}>
          {page.sections.map((s, idx) => (
            <section
              key={s.h2}
              style={{
                background: 'rgba(15, 29, 28, 0.75)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '22px',
                padding: '36px 32px',
                boxShadow: '0 16px 36px rgba(0,0,0,0.25)',
              }}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: idx % 2 === 0 ? '#5FD4E8' : '#E8732A',
                  marginBottom: '12px',
                }}
              >
                {`MODULE 0${idx + 1} · SPECIFICATION`}
              </div>
              <h2
                style={{
                  fontFamily: "'Instrument Serif', Georgia, serif",
                  fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)',
                  fontWeight: 400,
                  color: '#FFFFFF',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.15,
                  marginBottom: '16px',
                }}
              >
                {s.h2}
              </h2>
              <p
                style={{
                  fontSize: '15px',
                  color: 'rgba(237, 234, 227, 0.78)',
                  lineHeight: 1.7,
                  maxWidth: '850px',
                  marginBottom: s.bullets || s.h3s ? '24px' : '0',
                }}
              >
                {s.body}
              </p>

              {s.bullets && (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {s.bullets.map((b) => (
                    <li
                      key={b}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        fontSize: '14px',
                        color: 'rgba(237, 234, 227, 0.88)',
                        lineHeight: 1.6,
                      }}
                    >
                      <Check size={16} color="#0E7C86" style={{ marginTop: '3px', shrink: 0 }} />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}

              {s.h3s && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '16px',
                    marginTop: '24px',
                  }}
                >
                  {s.h3s.map((h) => (
                    <div
                      key={h.h3}
                      style={{
                        background: 'rgba(10, 20, 19, 0.65)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '16px',
                        padding: '20px',
                      }}
                    >
                      <h3
                        style={{
                          fontSize: '16px',
                          fontWeight: 700,
                          color: '#FFFFFF',
                          marginBottom: '8px',
                        }}
                      >
                        {h.h3}
                      </h3>
                      <p style={{ fontSize: '13px', color: 'rgba(237, 234, 227, 0.65)', lineHeight: 1.6, margin: 0 }}>
                        {h.body}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>

        {/* ── PRICING CALLOUT CARD ── */}
        <section
          style={{
            background: 'rgba(15, 29, 28, 0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            padding: '50px 36px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            marginBottom: '64px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-50px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '320px',
              height: '180px',
              background: 'radial-gradient(ellipse, rgba(14, 124, 134, 0.25) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              display: 'inline-block',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: '#5FD4E8',
              padding: '5px 14px',
              borderRadius: '999px',
              background: 'rgba(95, 212, 232, 0.1)',
              border: '1px solid rgba(95, 212, 232, 0.25)',
              marginBottom: '14px',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            TRANSPARENT PRICING · NO HIDDEN FEES
          </div>
          <h2
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 400,
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
              marginBottom: '12px',
            }}
          >
            Backtest, journal and coach in <span style={{ fontStyle: 'italic', color: '#E8732A' }}>one plan</span>
          </h2>
          <p
            style={{
              fontSize: '15px',
              color: 'rgba(237, 234, 227, 0.72)',
              maxWidth: '540px',
              margin: '0 auto 28px',
              lineHeight: 1.6,
            }}
          >
            ${PRICE.monthly}/month or ${PRICE.yearly}/year. Pay securely by Card or USDT (BEP-20). Free trial with instant access for all new accounts.
          </p>
          <IridescentButton to="/login" size="md">
            START YOUR FREE TRIAL
          </IridescentButton>
        </section>

        {/* ── FREQUENTLY ASKED QUESTIONS (HIGH CONTRAST) ── */}
        <section id="faq" style={{ marginBottom: '64px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div
              style={{
                display: 'inline-block',
                fontSize: '10px',
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
              INQUIRIES · FREQUENTLY ASKED
            </div>
            <h2
              style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 400,
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
              }}
            >
              Frequently Asked <span style={{ fontStyle: 'italic', color: '#0E7C86' }}>Questions</span>
            </h2>
          </div>

          <div
            className="landing-faq"
            style={{
              background: 'rgba(15, 29, 28, 0.88)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '22px',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
            }}
          >
            {page.faqs.map((f) => (
              <details
                key={f.q}
                className="group px-6 py-5"
                style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}
              >
                <summary
                  className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold"
                  style={{ color: '#EDEAE3', fontSize: '16px', cursor: 'pointer' }}
                >
                  <span style={{ color: '#EDEAE3', fontWeight: 600, fontSize: '15px' }}>{f.q}</span>
                  <ChevronRight
                    size={18}
                    className="shrink-0 transition-transform group-open:rotate-90"
                    style={{ color: '#0E7C86' }}
                  />
                </summary>
                <p
                  className="mt-3 text-sm leading-relaxed"
                  style={{ color: 'rgba(237, 234, 227, 0.82)', fontSize: '14px', lineHeight: 1.7 }}
                >
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* ── RELATED PAGES PILL BADGES ── */}
        {page.related?.length > 0 && (
          <nav aria-label="Related pages" style={{ marginBottom: '48px' }}>
            <h3
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'rgba(237, 234, 227, 0.55)',
                marginBottom: '14px',
              }}
            >
              EXPLORE RELATED GUIDES & MODULES
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {page.related.map(
                (p) =>
                  pageByPath[p] && (
                    <Link
                      key={p}
                      to={p}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '999px',
                        background: 'rgba(15, 29, 28, 0.7)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        color: '#EDEAE3',
                        fontSize: '12px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(95, 212, 232, 0.4)';
                        e.currentTarget.style.color = '#5FD4E8';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.color = '#EDEAE3';
                      }}
                    >
                      {pageByPath[p].h1}
                    </Link>
                  )
              )}
            </div>
          </nav>
        )}

        {/* ── LEGAL DISCLAIMER ── */}
        <p
          style={{
            fontSize: '12px',
            color: 'rgba(237, 234, 227, 0.4)',
            lineHeight: 1.7,
            maxWidth: '900px',
            marginTop: '32px',
          }}
        >
          {DISCLAIMER}
        </p>
      </main>

      {/* ── UNIFIED KINGFISHER FOOTER ── */}
      <SiteFooter />
    </div>
  );
}
