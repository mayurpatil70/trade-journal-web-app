import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { Database, Activity, Newspaper, Printer, Bot, Users, Headphones, ShieldCheck, GraduationCap } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const Logo3DIcon = ({ size = 28 }) => (
  <img src="/logo3d.png" alt="ForexNotes" style={{ width: size, height: size }} className="object-contain" />
);

const features = [
  {
    icon: Database,
    title: '10-Year Live Market Data for Backtesting',
    description: 'Access ultra-precise tick data spanning the last decade. Backtest your strategies on Forex, Gold, and Crypto with deep historical context before risking live capital.',
    tag: 'Backtesting Mastery',
    color: '#38BDF8',
    bg: 'rgba(56, 189, 248, 0.1)',
    border: 'rgba(56, 189, 248, 0.25)',
    glow: 'rgba(56, 189, 248, 0.15)',
    detail: 'Decade-long precision data',
    wide: true,
  },
  {
    icon: Activity,
    title: 'Live Market Charts',
    description: 'Execute trades and analyze setups with real-time, zero-latency market charting built directly into the platform.',
    tag: 'Live Data',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.1)',
    border: 'rgba(16, 185, 129, 0.25)',
    glow: 'rgba(16, 185, 129, 0.15)',
    detail: 'Zero latency charts',
  },
  {
    icon: Newspaper,
    title: 'AI News Impact Analysis',
    description: 'Our proprietary AI scans high and low impact market news 24/7, predicting volatility before it happens so you never get caught off guard.',
    tag: 'AI Intelligence',
    color: '#A78BFA',
    bg: 'rgba(167, 139, 250, 0.1)',
    border: 'rgba(167, 139, 250, 0.25)',
    glow: 'rgba(167, 139, 250, 0.15)',
    detail: 'Predicts news volatility',
  },
  {
    icon: Printer,
    title: 'Printable Digital Trading Journal',
    description: 'Log everything. Export your entire trading journal in any format (PDF, CSV, Excel) and print it out to study your performance off-screen.',
    tag: 'Export Anywhere',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.25)',
    glow: 'rgba(245, 158, 11, 0.15)',
    detail: 'Export & Print seamlessly',
  },
  {
    icon: Bot,
    title: 'Trading Bot Integration (No Extra Cost)',
    description: 'The only journal on the market offering direct trading bot integrations at the exact same price point. Fully automate your executions based on your logged setups.',
    tag: 'Unique Selling Point',
    color: '#F0524A',
    bg: 'rgba(240, 82, 74, 0.1)',
    border: 'rgba(240, 82, 74, 0.25)',
    glow: 'rgba(240, 82, 74, 0.15)',
    detail: 'Included with your membership',
    wide: true,
  },
  {
    icon: Users,
    title: '10% Lifetime Affiliate Commissions',
    description: 'Share Forex Notes with other traders or your followers and earn a 10% recurring commission on every monthly and yearly package you sell.',
    tag: 'Earn with us',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.1)',
    border: 'rgba(16, 185, 129, 0.25)',
    glow: 'rgba(16, 185, 129, 0.15)',
    detail: 'For users & influencers',
  },
  {
    icon: Headphones,
    title: '24/7 Instant Support',
    description: 'Our backend team is working around the clock. Get fast, instant, and reliable support anytime you need it.',
    tag: 'We got you',
    color: '#06B6D4',
    bg: 'rgba(6, 182, 212, 0.1)',
    border: 'rgba(6, 182, 212, 0.25)',
    glow: 'rgba(6, 182, 212, 0.15)',
    detail: 'Instant response times',
  },
  {
    icon: ShieldCheck,
    title: 'Prop Firm Pass Guidance',
    description: 'End-to-end guidance to pass your prop firm challenges. We stay with you every step of the way until your first payout arrives.',
    tag: 'Get Funded',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.1)',
    border: 'rgba(16, 185, 129, 0.25)',
    glow: 'rgba(16, 185, 129, 0.15)',
    detail: 'Until your first payout',
    wide: true,
  },
  {
    icon: Logo3DIcon,
    title: 'Annual Real-Life Trader Events',
    description: 'We host an exclusive real-life event once a year for our members to celebrate glory, network, and grow together.',
    tag: 'Community',
    color: '#F43F5E',
    bg: 'rgba(244, 63, 94, 0.1)',
    border: 'rgba(244, 63, 94, 0.25)',
    glow: 'rgba(244, 63, 94, 0.15)',
    detail: 'Celebrate in person',
  },
  {
    icon: GraduationCap,
    title: 'Dedicated Beginner Guidance',
    description: 'New to trading? We provide specialized guidance and playbooks designed specifically to get beginners up to speed and profitable.',
    tag: 'Learn & Grow',
    color: '#84CC16',
    bg: 'rgba(132, 204, 22, 0.1)',
    border: 'rgba(132, 204, 22, 0.25)',
    glow: 'rgba(132, 204, 22, 0.15)',
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
    <section id="features" style={{ padding: '100px 20px', position: 'relative' }}>
      {/* Scoped CSS for Bento Mobile Responsiveness */}
      <style>{`
        @media (max-width: 768px) {
          #features {
            padding: 60px 16px !important;
          }
          .features-bento-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .feature-card {
            flex-direction: column !important;
            align-items: flex-start !important;
            padding: 20px 18px !important;
            gap: 16px !important;
          }
        }
      `}</style>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '100px', background: 'rgba(232,115,42,0.1)', border: '1px solid rgba(232,115,42,0.25)', color: '#E8732A', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: '16px', fontFamily: "'JetBrains Mono', monospace" }}>
            03 FIELD CAPABILITIES · UNMATCHED EDGE
          </div>
          <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', fontWeight: 400, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.05 }}>
            Everything You Need to <span style={{ fontStyle: 'italic', color: '#0E7C86' }}>Dominate</span>
          </h2>
          <p style={{ fontSize: '15px', color: 'rgba(237, 234, 227, 0.7)', maxWidth: '560px', margin: '14px auto 0', lineHeight: 1.65, fontFamily: "'Manrope', sans-serif" }}>
            Institutional backtesting, algorithmic volatility analysis, and automated risk rules in one unified trading journal.
          </p>
        </div>

        <div ref={containerRef} className="features-bento-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
          {features.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="feature-card"
                style={{
                  gridColumn: item.wide ? '1 / -1' : 'auto',
                  background: 'rgba(15, 29, 28, 0.85)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  borderRadius: '22px',
                  padding: '30px',
                  border: `1px solid ${item.border}`,
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: item.wide ? 'row' : 'column',
                  gap: '24px',
                  alignItems: item.wide ? 'center' : 'flex-start',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35)',
                  transition: 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.borderColor = item.color;
                  e.currentTarget.style.boxShadow = `0 24px 60px rgba(0, 0, 0, 0.5), 0 0 25px ${item.glow}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = item.border;
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.35)';
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: `radial-gradient(circle at top left, ${item.glow}, transparent 65%)`, pointerEvents: 'none' }} />
                
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${item.border}`, flexShrink: 0, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                  <Icon size={26} color={item.color} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ color: item.color, fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '8px', fontFamily: "'JetBrains Mono', monospace" }}>
                    {item.tag}
                  </div>
                  <h3 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '23px', fontWeight: 400, color: '#FFFFFF', marginBottom: '8px', letterSpacing: '0.01em' }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: '13.5px', color: 'rgba(237, 234, 227, 0.72)', lineHeight: 1.65, marginBottom: '18px', fontFamily: "'Manrope', sans-serif" }}>
                    {item.description}
                  </p>
                  
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '11px', color: 'rgba(237, 234, 227, 0.85)', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: item.color, boxShadow: `0 0 6px ${item.color}`, flexShrink: 0 }} />
                    <span>{item.detail}</span>
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
