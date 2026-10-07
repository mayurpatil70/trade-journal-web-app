import React from 'react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white', padding: '80px 20px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Link to="/" style={{ color: '#10b981', textDecoration: 'none', marginBottom: '40px', display: 'inline-block' }}>
          &larr; Back to Home
        </Link>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '24px' }}>Privacy Policy</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '32px' }}>Last updated: October 2026</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.7 }}>
          <section>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '16px', color: 'white' }}>1. Information We Collect</h2>
            <p>We collect information you provide directly to us, such as when you create an account, log a trade, or communicate with us. This includes your email address, Discord ID, trading data (e.g., pairs traded like XAUUSD, profit/loss), and prop firm rules you configure.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '16px', color: 'white' }}>2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul style={{ listStyleType: 'disc', paddingLeft: '24px', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Provide, maintain, and improve our AI-powered trading journal.</li>
              <li>Analyze your trading performance to offer personalized psychology insights and R-multiple tracking.</li>
              <li>Monitor your prop firm drawdown limits to send alerts.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '16px', color: 'white' }}>3. Data Security</h2>
            <p>We implement industry-standard security measures to protect your personal information and trading logs. Your financial data is confidential and is only used to provide you with insights.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '16px', color: 'white' }}>4. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us via our Discord community.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
