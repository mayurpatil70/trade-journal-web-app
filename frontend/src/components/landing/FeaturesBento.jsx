import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { Database, Activity, Newspaper, Printer, Bot, Users, Headphones, ShieldCheck, Star, GraduationCap } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    icon: Database,
    title: '10-Year Live Market Data for Backtesting',
    description: 'Access ultra-precise tick data spanning the last decade. Backtest your strategies on Forex, Gold, and Crypto with deep historical context before risking live capital.',
    tag: 'Backtesting Mastery',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.2)',
    glow: 'rgba(59,130,246,0.15)',
    detail: 'Decade-long precision data',
    wide: true,
  },
  {
    icon: Activity,
    title: 'Live Market Charts',
    description: 'Execute trades and analyze setups with real-time, zero-latency market charting built directly into the platform.',
    tag: 'Live Data',
    color: 'var(--l-gain)',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.2)',
    glow: 'rgba(16,185,129,0.12)',
    detail: 'Zero latency charts',
  },
  {
    icon: Newspaper,
    title: 'AI News Impact Analysis',
    description: 'Our proprietary AI scans high and low impact market news 24/7, predicting volatility before it happens so you never get caught off guard.',
    tag: 'AI Intelligence',
    color: 'var(--l-violet)',
    bg: 'rgba(139,92,246,0.08)',
    border: 'rgba(139,92,246,0.2)',
    glow: 'rgba(139,92,246,0.12)',
    detail: 'Predicts news volatility',
  },
  {
    icon: Printer,
    title: 'Printable Digital Trading Journal',
    description: 'Log everything. Export your entire trading journal in any format (PDF, CSV, Excel) and print it out to study your performance off-screen.',
    tag: 'Export Anywhere',
    color: 'var(--l-amber)',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
    glow: 'rgba(245,158,11,0.12)',
    detail: 'Export & Print seamlessly',
  },
  {
    icon: Bot,
    title: 'Trading Bot Integration (No Extra Cost)',
    description: 'The only journal on the market offering direct trading bot integrations at the exact same price point. Fully automate your executions based on your logged setups.',
    tag: 'Unique Selling Point',
    color: 'var(--l-loss)',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.2)',
    glow: 'rgba(239,68,68,0.15)',
    detail: 'Included with your membership',
    wide: true,
  },
  {
    icon: Users,
    title: '10% Lifetime Affiliate Commissions',
    description: 'Share Forex Notes with other traders or your followers and earn a 10% recurring commission on every monthly and yearly package you sell.',
    tag: 'Earn with us',
    color: 'var(--l-gain)',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.2)',
    glow: 'rgba(16,185,129,0.12)',
    detail: 'For users & influencers',
  },
  {
    icon: Headphones,
    title: '24/7 Instant Support',
    description: 'Our backend team is working around the clock. Get fast, instant, and reliable support anytime you need it.',
    tag: 'We got you',
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.08)',
    border: 'rgba(6,182,212,0.2)',
    glow: 'rgba(6,182,212,0.12)',
    detail: 'Instant response times',
  },
  {
    icon: ShieldCheck,
    title: 'Prop Firm Pass Guidance',
    description: 'End-to-end guidance to pass your prop firm challenges. We stay with you every step of the way until your first payout arrives.',
    tag: 'Get Funded',
    color: 'var(--l-gain)',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.2)',
    glow: 'rgba(16,185,129,0.12)',
    detail: 'Until your first payout',
    wide: true,
  },
  {
    icon: Star,
    title: 'Annual Real-Life Trader Events',
    description: 'We host an exclusive real-life event once a year for our members to celebrate glory, network, and grow together.',
    tag: 'Community',
    color: '#f43f5e',
    bg: 'rgba(244,63,94,0.08)',
    border: 'rgba(244,63,94,0.2)',
    glow: 'rgba(244,63,94,0.12)',
    detail: 'Celebrate in person',
  },
  {
    icon: GraduationCap,
    title: 'Dedicated Beginner Guidance',
    description: 'New to trading? We provide specialized guidance and playbooks designed specifically to get beginners up to speed and profitable.',
    tag: 'Learn & Grow',
    color: '#a3e635',
    bg: 'rgba(163,230,53,0.08)',
    border: 'rgba(163,230,53,0.2)',
    glow: 'rgba(163,230,53,0.12)',
    detail: 'From zero to funded',
  }
];

export default function FeaturesBento() {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set('.feature-card', { y: 60, opacity: 0 });
      ScrollTrigger.batch('.feature-card', {
        interval: 0.1,
        batchMax: 2,
        onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, stagger: 0.1, duration: 0.8, ease: 'power3.out' }),
        start: 'top 85%',
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section style={{ padding: '100px 20px', position: 'relative' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{ display: 'inline-block', padding: '6px 14px', borderRadius: '100px', background: 'rgba(16,185,129,0.1)', color: 'var(--l-gain)', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
            Unmatched Value
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, color: "var(--l-ink)", letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Everything You Need to <span style={{ color: 'var(--l-gain)' }}>Dominate</span>
          </h2>
        </div>

        <div ref={containerRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {features.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="feature-card"
                style={{
                  gridColumn: item.wide ? '1 / -1' : 'auto',
                  background: 'linear-gradient(145deg, rgb(var(--l-surf) / 0.9) 0%, rgb(var(--l-surf) / 0.9) 100%)',
                  borderRadius: '24px',
                  padding: '32px',
                  border: `1px solid ${item.border}`,
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: item.wide ? 'row' : 'column',
                  gap: '24px',
                  alignItems: item.wide ? 'center' : 'flex-start',
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: `radial-gradient(circle at top left, ${item.glow}, transparent 60%)`, pointerEvents: 'none' }} />
                
                <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${item.border}`, flexShrink: 0 }}>
                  <Icon size={28} color={item.color} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ color: item.color, fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                    {item.tag}
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: "var(--l-ink)", marginBottom: '12px', letterSpacing: '-0.01em' }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'rgb(var(--l-fg) / calc(0.5 + var(--l-ta)))', lineHeight: 1.6, marginBottom: '20px' }}>
                    {item.description}
                  </p>
                  
                  <div style={{ display: 'inline-block', padding: '6px 12px', borderRadius: '8px', background: 'rgb(var(--l-fg) / 0.03)', border: '1px solid rgb(var(--l-fg) / 0.05)', fontSize: '12px', color: 'rgb(var(--l-fg) / calc(0.7 + var(--l-ta)))', fontWeight: 600 }}>
                    {item.detail}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
