import { Link } from 'react-router-dom';

const FOOTER_LINKS = [
  { title: 'Free tools', links: [['/tools/ftmo-drawdown-calculator', 'FTMO drawdown calculator'], ['/tools/fundednext-risk-manager', 'FundedNext risk manager'], ['/tools/lot-size-calculator', 'Lot size calculator']] },
  { title: 'Journal', links: [['/journal/xauusd', 'XAUUSD journal'], ['/journal/eurusd', 'EURUSD journal'], ['/journal/ict-strategy', 'ICT journal'], ['/journal/smc', 'SMC journal'], ['/journal/scalping', 'Scalping journal']] },
  { title: 'Regions', links: [['/india/trading-journal', 'India trading journal'], ['/india/prop-firm-calculator', 'India prop firm calculator'], ['/india/forex-backtesting-software', 'Backtesting for India'], ['/dubai/trading-journal', 'Dubai trading journal'], ['/uae/prop-firm-trader-tools', 'UAE prop firm tools'], ['/uae/islamic-trading-journal', 'Islamic trading journal']] },
  { title: 'Compare', links: [['/vs/fx-replay', 'vs FX Replay'], ['/vs/tradezella', 'vs TradeZella'], ['/vs/traders-casa', 'vs Traders Casa'], ['/vs/tradesviz', 'vs TradesViz'], ['/backtesting/btcusdt', 'BTCUSDT backtesting'], ['/privacy', 'Privacy policy']] },
];

export default function SiteFooter({ copyright = true }) {
  return (
    <footer className="border-t border-white/5 bg-black/60">
      <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        {FOOTER_LINKS.map((g) => (
          <div key={g.title}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">{g.title}</h2>
            <ul className="space-y-2">
              {g.links.map(([to, label]) => (
                <li key={to}><Link to={to} className="text-gray-400 hover:text-emerald-400">{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {copyright && <p className="text-center text-xs text-gray-600 pb-8">© {new Date().getFullYear()} Forex Notes</p>}
    </footer>
  );
}
