import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import SiteFooter from '../components/seo/SiteFooter';
import LandingNavbar from '../components/landing/LandingNavbar';

export default function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--lp-bg)',
        color: 'var(--lp-text)',
        fontFamily: "'Manrope', sans-serif",
      }}
    >
      {/* ── UNIFIED SLEEK COMPACT TOP NAVIGATION ── */}
      <LandingNavbar isFixed={false} />

      <main style={{ maxWidth: '840px', margin: '0 auto', padding: '60px 24px 100px' }}>
        <Link
          to="/"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '12px',
            color: '#5AC8FA',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '32px',
          }}
        >
          ← Return to Home
        </Link>

        <div
          style={{
            display: 'inline-block',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#007AFF',
            padding: '5px 14px',
            borderRadius: '999px',
            background: 'rgba(0, 122, 255, 0.1)',
            border: '1px solid rgba(0, 122, 255, 0.25)',
            marginBottom: '16px',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          SECURITY & PRIVACY PROTOCOL
        </div>

        <h1
          style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 'clamp(2.5rem, 5vw, 3.8rem)',
            fontWeight: 400,
            color: 'var(--lp-heading)',
            letterSpacing: '-0.02em',
            marginBottom: '12px',
          }}
        >
          Privacy <span style={{ fontStyle: 'italic', color: '#007AFF' }}>Policy</span>
        </h1>
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '12px',
            color: 'rgba(var(--lp-fg), 0.5)',
            marginBottom: '40px',
          }}
        >
          Effective Date: October 2026 · Forex Notes Engine
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <section
            style={{
              background: 'rgba(var(--lp-card), 0.75)',
              border: '1px solid rgba(var(--lp-fg), 0.08)',
              borderRadius: '20px',
              padding: '28px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--lp-heading)', marginBottom: '12px' }}>
              1. Information We Collect
            </h2>
            <p style={{ fontSize: '14px', color: 'rgba(var(--lp-fg), 0.75)', lineHeight: 1.7, margin: 0 }}>
              We collect information you provide directly to us, such as when you create an account, log a trade, or communicate with our team. This includes your email address, Discord ID, trading journal parameters (e.g., pairs traded like XAUUSD, profit/loss, R-multiples), and prop firm rules you configure.
            </p>
          </section>

          <section
            style={{
              background: 'rgba(var(--lp-card), 0.75)',
              border: '1px solid rgba(var(--lp-fg), 0.08)',
              borderRadius: '20px',
              padding: '28px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--lp-heading)', marginBottom: '12px' }}>
              2. How We Use Your Information
            </h2>
            <p style={{ fontSize: '14px', color: 'rgba(var(--lp-fg), 0.75)', lineHeight: 1.7, marginBottom: '12px' }}>
              We use the collected information exclusively to:
            </p>
            <ul style={{ listStyle: 'disc', paddingLeft: '20px', color: 'rgba(var(--lp-fg), 0.75)', fontSize: '14px', lineHeight: 1.7 }}>
              <li>Provide, maintain, and continuously calibrate our AI-powered trading journal.</li>
              <li>Analyze your trade executions to deliver real-time psychology insights and revenge trading tilt detection.</li>
              <li>Monitor your prop firm trailing drawdown limits to sound automated breach warnings.</li>
            </ul>
          </section>

          <section
            style={{
              background: 'rgba(var(--lp-card), 0.75)',
              border: '1px solid rgba(var(--lp-fg), 0.08)',
              borderRadius: '20px',
              padding: '28px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--lp-heading)', marginBottom: '12px' }}>
              3. Data Security & Encryption
            </h2>
            <p style={{ fontSize: '14px', color: 'rgba(var(--lp-fg), 0.75)', lineHeight: 1.7, margin: 0 }}>
              We implement industry-standard encryption protocols to protect your personal information and trading logs. Your financial and journaling data remains strictly confidential and is never sold to brokers or third-party marketers.
            </p>
          </section>

          <section
            style={{
              background: 'rgba(var(--lp-card), 0.75)',
              border: '1px solid rgba(var(--lp-fg), 0.08)',
              borderRadius: '20px',
              padding: '28px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--lp-heading)', marginBottom: '12px' }}>
              4. Contact & Inquiries
            </h2>
            <p style={{ fontSize: '14px', color: 'rgba(var(--lp-fg), 0.75)', lineHeight: 1.7, margin: 0 }}>
              If you have any questions or data requests regarding this Privacy Policy, please contact our team via our official Discord community network.
            </p>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
