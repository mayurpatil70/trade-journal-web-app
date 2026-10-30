import { Link } from 'react-router-dom';

const FOOTER_LINKS = [
  {
    title: 'FREE TOOLS',
    links: [
      ['/tools/ftmo-drawdown-calculator', 'FTMO drawdown calculator'],
      ['/tools/fundednext-risk-manager', 'FundedNext risk manager'],
      ['/tools/lot-size-calculator', 'Lot size calculator'],
    ],
  },
  {
    title: 'JOURNAL',
    links: [
      ['/journal/xauusd', 'XAUUSD journal'],
      ['/journal/eurusd', 'EURUSD journal'],
      ['/journal/ict-strategy', 'ICT journal'],
      ['/journal/smc', 'SMC journal'],
      ['/journal/scalping', 'Scalping journal'],
      ['/journal/gbpusd', 'GBPUSD journal'],
      ['/journal/nas100', 'NAS100 indices journal'],
      ['/journal/prop-firm', 'Prop firm journal'],
    ],
  },
  {
    title: 'REGIONS',
    links: [
      ['/india/forex-trading-journal', 'India forex journal'],
      ['/india/trading-journal', 'India trading journal'],
      ['/india/prop-firm-calculator', 'India prop firm calculator'],
      ['/india/forex-backtesting-software', 'Backtesting for India'],
      ['/dubai/forex-trading-journal', 'Dubai forex journal'],
      ['/dubai/trading-journal', 'Dubai trading journal'],
      ['/uae/prop-firm-trader-tools', 'UAE prop firm tools'],
      ['/uae/islamic-trading-journal', 'Islamic trading journal'],
    ],
  },
  {
    title: 'LEARN',
    links: [
      ['/learn/how-to-keep-a-trading-journal', 'How to keep a trading journal'],
      ['/learn/trading-journal-template', 'Trading journal template'],
      ['/learn/revenge-trading', 'Stop revenge trading'],
    ],
  },
  {
    title: 'COMPARE',
    links: [
      ['/vs/tradezella', 'vs TradeZella'],
      ['/vs/tradersync', 'vs TraderSync'],
      ['/vs/fx-replay', 'vs FX Replay'],
      ['/vs/edgewonk', 'vs Edgewonk'],
      ['/vs/tradesviz', 'vs TradesViz'],
      ['/vs/traders-casa', 'vs Traders Casa'],
      ['/vs/myfxbook', 'vs Myfxbook'],
      ['/backtesting/btcusdt', 'BTCUSDT backtesting'],
      ['/markets/four-asset-classes', 'Four asset classes & speed'],
      ['/privacy', 'Privacy policy'],
    ],
  },
];

export default function SiteFooter({ copyright = true }) {
  return (
    <footer
      className="ios-landing"
      style={{
        borderTop: '1px solid rgba(var(--lp-fg), 0.08)',
        background: 'var(--lp-bg)',
        color: 'var(--lp-text)',
        fontFamily: "'Manrope', sans-serif",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-5 gap-10 text-sm">
        {FOOTER_LINKS.map((g) => (
          <div key={g.title}>
            <h2
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#5AC8FA',
                marginBottom: '18px',
              }}
            >
              {g.title}
            </h2>
            <ul className="space-y-2.5">
              {g.links.map(([to, label]) => (
                <li key={to}>
                  <Link
                    to={to}
                    onClick={() => {
                      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                      document.documentElement.scrollTop = 0;
                      document.body.scrollTop = 0;
                    }}
                    style={{
                      color: 'rgba(var(--lp-fg), 0.7)',
                      fontSize: '13px',
                      textDecoration: 'none',
                      transition: 'color 0.2s ease, transform 0.2s ease',
                      display: 'inline-block',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#5AC8FA';
                      e.currentTarget.style.transform = 'translateX(2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'rgba(var(--lp-fg), 0.7)';
                      e.currentTarget.style.transform = 'translateX(0px)';
                    }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {copyright && (
        <div
          style={{
            borderTop: '1px solid rgba(var(--lp-fg), 0.05)',
            padding: '24px 20px',
            textAlign: 'center',
            fontSize: '12px',
            color: 'rgba(var(--lp-fg), 0.45)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          © {new Date().getFullYear()} Forex Notes · Precision Journaling, 10Y Backtesting & AI Psychology Coach
        </div>
      )}
    </footer>
  );
}
