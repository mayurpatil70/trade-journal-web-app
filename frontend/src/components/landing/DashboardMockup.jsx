// src/components/landing/DashboardMockup.jsx
// A pixel-perfect code-drawn replica of the Forex Notes dashboard
// Used as the hero mockup element animated by GSAP ScrollTrigger

import { TrendingUp, ShieldCheck, Calculator, Activity, BarChart2, Calendar, BookOpen, Settings } from 'lucide-react';

const MiniSparkline = ({ color = '#10b981', data = [30, 55, 40, 70, 60, 85, 75, 90] }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const w = 80;
  const h = 28;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / (max - min || 1)) * h;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <polyline
        points={points}
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const CandlestickMini = () => {
  const candles = [
    { open: 40, close: 65, high: 70, low: 35, bull: true },
    { open: 65, close: 55, high: 72, low: 50, bull: false },
    { open: 55, close: 78, high: 82, low: 52, bull: true },
    { open: 78, close: 68, high: 85, low: 64, bull: false },
    { open: 68, close: 88, high: 92, low: 65, bull: true },
    { open: 88, close: 82, high: 95, low: 78, bull: false },
    { open: 82, close: 95, high: 98, low: 79, bull: true },
    { open: 95, close: 90, high: 100, low: 86, bull: false },
    { open: 90, close: 105, high: 108, low: 87, bull: true },
  ];
  const total = 120;
  const chartH = 56;
  const allVals = candles.flatMap(c => [c.high, c.low]);
  const minV = Math.min(...allVals);
  const maxV = Math.max(...allVals);
  const scaleY = (v) => chartH - ((v - minV) / (maxV - minV)) * chartH;
  const cw = 8;
  const gap = 4;

  return (
    <svg width={total} height={chartH} viewBox={`0 0 ${total} ${chartH}`}>
      {candles.map((c, i) => {
        const x = i * (cw + gap) + 4;
        const bodyTop = Math.min(scaleY(c.open), scaleY(c.close));
        const bodyH = Math.abs(scaleY(c.open) - scaleY(c.close)) || 1;
        const color = c.bull ? '#10b981' : '#ef4444';
        return (
          <g key={i}>
            <line x1={x + cw / 2} y1={scaleY(c.high)} x2={x + cw / 2} y2={scaleY(c.low)} stroke={color} strokeWidth="1" />
            <rect x={x} y={bodyTop} width={cw} height={bodyH} fill={color} rx="1" opacity="0.85" />
          </g>
        );
      })}
    </svg>
  );
};

export default function DashboardMockup({ style = {}, className = '' }) {
  return (
    <div
      className={className}
      style={{
        background: '#090e18',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.08)',
        overflow: 'hidden',
        boxShadow: '0 40px 120px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.05)',
        fontFamily: "'Inter', sans-serif",
        width: '100%',
        ...style,
      }}
    >
      {/* Browser Chrome Bar */}
      <div style={{
        background: '#0d1520',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', opacity: 0.7 }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', opacity: 0.7 }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', opacity: 0.7 }} />
        </div>
        <div style={{
          flex: 1,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '6px',
          padding: '4px 12px',
          fontSize: '10px',
          color: 'rgba(255,255,255,0.35)',
          fontFamily: 'monospace',
          maxWidth: '300px',
          margin: '0 auto',
          textAlign: 'center',
        }}>
          🔒 app.forexnotes.in/dashboard
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={11} style={{ color: '#10b981' }} />
          <span style={{ fontSize: '9px', color: '#10b981', fontWeight: 700, letterSpacing: '0.05em' }}>GUARDIAN ACTIVE</span>
        </div>
      </div>

      {/* App Layout: Sidebar + Main */}
      <div style={{ display: 'flex', height: '360px' }}>
        {/* Sidebar */}
        <div style={{
          width: '48px',
          background: '#0a0f1a',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '12px 0',
          gap: '4px',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '10px',
            background: 'linear-gradient(135deg, #2f8df4, #22d3ee)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '12px',
          }}>
            <Activity size={14} color="white" />
          </div>
          {[
            { icon: BarChart2, active: true, color: '#2f8df4' },
            { icon: TrendingUp, active: false },
            { icon: Calendar, active: false },
            { icon: Calculator, active: false },
            { icon: BookOpen, active: false },
            { icon: Settings, active: false },
          ].map(({ icon: Icon, active, color }, i) => (
            <div key={i} style={{
              width: 32, height: 32, borderRadius: '8px',
              background: active ? 'rgba(47,141,244,0.15)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <Icon size={13} color={active ? (color || '#2f8df4') : 'rgba(255,255,255,0.25)'} />
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: '14px', overflow: 'hidden', background: '#090e18' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>Trading Dashboard</div>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', marginTop: '1px' }}>October 2024 · London Session</div>
            </div>
            <div style={{
              background: 'rgba(16,185,129,0.12)',
              border: '1px solid rgba(16,185,129,0.25)',
              borderRadius: '20px',
              padding: '3px 10px',
              fontSize: '9px',
              color: '#10b981',
              fontWeight: 700,
            }}>
              ● Live Tracking
            </div>
          </div>

          {/* Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
            {[
              { label: 'Win Rate', value: '68.4%', change: '+4.2%', color: '#10b981', spark: [40,55,48,65,60,72,68,75] },
              { label: 'Net R-Multiple', value: '+34.8R', change: 'Avg: 2.4R', color: '#10b981', spark: [20,35,30,50,45,60,55,70] },
              { label: 'Profit Factor', value: '2.18', change: 'Inst. edge', color: '#2f8df4', spark: [50,58,52,65,62,70,68,75] },
              { label: 'Rule Discipline', value: '94%', change: '0 revenge', color: '#22d3ee', spark: [80,82,78,85,83,88,86,90] },
            ].map((s, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px',
                padding: '10px',
              }}>
                <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{s.label}</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: s.color, marginTop: '4px', letterSpacing: '-0.02em' }}>{s.value}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.3)' }}>{s.change}</span>
                  <MiniSparkline color={s.color} data={s.spark} />
                </div>
              </div>
            ))}
          </div>

          {/* Chart + Recent Trades */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
            {/* Chart */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '10px',
              padding: '10px',
            }}>
              <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.35)', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                XAUUSD · Candlestick View
              </div>
              <CandlestickMini />
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <span style={{ fontSize: '8px', color: '#10b981', fontWeight: 700 }}>▲ 9 wins</span>
                <span style={{ fontSize: '8px', color: '#ef4444', fontWeight: 700 }}>▼ 3 losses</span>
              </div>
            </div>

            {/* AI Psychology Coach */}
            <div style={{
              background: 'rgba(124,58,237,0.06)',
              border: '1px solid rgba(124,58,237,0.2)',
              borderRadius: '10px',
              padding: '10px',
            }}>
              <div style={{ fontSize: '8px', color: 'rgba(167,139,250,0.8)', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                🧠 AI Pre-Trade Guard
              </div>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                Emotional state: <span style={{ color: '#10b981', fontWeight: 700 }}>Calm ✓</span>
              </div>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                FOMO detected: <span style={{ color: '#10b981', fontWeight: 700 }}>None ✓</span>
              </div>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                Revenge risk: <span style={{ color: '#10b981', fontWeight: 700 }}>Low ✓</span>
              </div>
              <div style={{
                marginTop: '8px',
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: '6px',
                padding: '5px 8px',
                fontSize: '8px',
                color: '#10b981',
                fontWeight: 700,
              }}>
                ✓ CLEARED TO TRADE
              </div>
            </div>
          </div>

          {/* Recent Trades */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '10px',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '8px', color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Recent Trades
            </div>
            {[
              { dir: 'LONG', pair: 'XAUUSD', setup: 'London Open Liq. Sweep', risk: '0.5%', rr: '+3.20R', color: '#10b981' },
              { dir: 'SHORT', pair: 'GBPUSD', setup: 'NY Session FVG Fill', risk: '1.0%', rr: '+1.80R', color: '#10b981' },
              { dir: 'LONG', pair: 'EURUSD', setup: 'Asia Range Breakout', risk: '0.5%', rr: '-0.50R', color: '#ef4444' },
            ].map((t, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '7px 12px',
                borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.03)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '7px',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    background: t.dir === 'LONG' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                    color: t.dir === 'LONG' ? '#10b981' : '#ef4444',
                    border: `1px solid ${t.dir === 'LONG' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                  }}>{t.dir}</span>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: 'white' }}>{t.pair}</span>
                  <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.3)' }}>{t.setup}</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>Risk: {t.risk}</span>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: t.color, fontFamily: 'monospace' }}>{t.rr}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
