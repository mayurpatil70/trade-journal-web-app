import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const r = (t) => parseFloat(t.r_multiple) || 0;
const fmtR = (v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}R`;

const group = (trades, key) => {
  const map = new Map();
  trades.forEach((t) => {
    const k = (typeof key === 'function' ? key(t) : t[key]) || 'Not logged';
    const g = map.get(k) || { name: k, n: 0, wins: 0, total: 0 };
    g.n += 1;
    g.total += r(t);
    if (r(t) > 0) g.wins += 1;
    map.set(k, g);
  });
  return [...map.values()].map((g) => ({ ...g, winRate: (g.wins / g.n) * 100, avg: g.total / g.n })).sort((a, b) => b.total - a.total);
};

const weekday = (t) => (t.date ? new Date(t.date).toLocaleDateString('en-US', { weekday: 'long' }) : null);

const DIMENSIONS = [
  { id: 'setup', label: 'Setup', key: 'setup' },
  { id: 'session', label: 'Session', key: 'session' },
  { id: 'emotion', label: 'Mindset', key: 'emotion_before' },
  { id: 'asset', label: 'Asset', key: 'asset' },
  { id: 'day', label: 'Weekday', key: weekday },
];

const loadBacktests = () => {
  try {
    return JSON.parse(localStorage.getItem('backtest_sessions') || '[]');
  } catch {
    return [];
  }
};

export function EdgeBreakdown({ trades }) {
  const [dim, setDim] = useState('setup');
  const rows = useMemo(() => group(trades, DIMENSIONS.find((d) => d.id === dim).key), [trades, dim]);
  const maxAbs = Math.max(1, ...rows.map((x) => Math.abs(x.total)));

  return (
    <div className="glossy rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-[15px] font-semibold text-white">Where your edge comes from</h2>
          <p className="text-[12px] text-gray-500 mt-1">Journal results grouped by what you logged on each trade</p>
        </div>
        <div className="flex flex-wrap gap-1 bg-black/30 rounded-lg p-1">
          {DIMENSIONS.map((d) => (
            <button key={d.id} onClick={() => setDim(d.id)} className={`px-3 py-1 rounded-md text-xs font-medium ${dim === d.id ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>{d.label}</button>
          ))}
        </div>
      </div>
      {!rows.length ? (
        <p className="text-sm text-gray-500">Log a few trades to see your breakdown.</p>
      ) : (
        <div className="space-y-2.5">
          {rows.slice(0, 8).map((row) => (
            <div key={row.name} className="grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[180px_minmax(0,1fr)_auto] items-center gap-3 text-xs">
              <span className="text-gray-300 truncate" title={row.name}>{row.name}</span>
              <div className="hidden md:block h-2 rounded-full bg-white/5 overflow-hidden">
                <div className={`h-full rounded-full ${row.total >= 0 ? 'bg-emerald-400' : 'bg-red-400'}`} style={{ width: `${(Math.abs(row.total) / maxAbs) * 100}%` }} />
              </div>
              <span className="flex gap-3 font-mono tabular-nums">
                <span className="text-gray-500 w-16 text-right whitespace-nowrap">{row.n} trades</span>
                <span className="text-gray-400 w-12 text-right">{row.winRate.toFixed(0)}%</span>
                <span className={`w-16 text-right font-semibold ${row.total >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmtR(row.total)}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TradingHealth({ trades }) {
  const h = useMemo(() => {
    const n = trades.length;
    const ruled = trades.filter((t) => t.rule_break === 'yes' || t.rule_break === 'no');
    const followed = ruled.filter((t) => t.rule_break === 'no').length;
    const tagged = trades.filter((t) => t.emotion_before).length;
    const broken = group(trades.filter((t) => t.rule_break === 'yes'), () => 'x')[0];
    return {
      rules: ruled.length ? (followed / ruled.length) * 100 : null,
      tagged: n ? (tagged / n) * 100 : null,
      missing: n - tagged,
      brokenCost: broken ? broken.total : 0,
    };
  }, [trades]);

  const bar = (label, v) => (
    <div>
      <div className="flex justify-between text-xs mb-2">
        <span className="text-gray-400">{label}</span>
        <span className={`font-semibold ${v == null ? 'text-gray-500' : v >= 80 ? 'text-emerald-400' : v >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{v == null ? '-' : `${v.toFixed(0)}%`}</span>
      </div>
      <div className="w-full bg-white/5 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${v >= 80 ? 'bg-emerald-400' : v >= 50 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${v ?? 0}%` }} />
      </div>
    </div>
  );

  return (
    <div className="glossy rounded-2xl p-6 flex-1">
      <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-5">Trading Health</h3>
      <div className="space-y-5">
        {bar('Rule following', h.rules)}
        {bar('Psychology tagged', h.tagged)}
        <div className="pt-4 mt-2 border-t border-white/5 space-y-1.5 text-[12px]">
          {h.brokenCost < 0 && <p className="text-gray-300">Broken rules cost you <span className="text-red-400 font-semibold">{fmtR(h.brokenCost)}</span></p>}
          <p className="text-gray-500">{h.missing > 0 ? `${h.missing} trade${h.missing > 1 ? 's' : ''} missing psychology tags` : 'Every trade has psychology tags'}</p>
        </div>
      </div>
    </div>
  );
}

export function BacktestSummary({ live }) {
  const sessions = useMemo(() => loadBacktests(), []);
  const s = useMemo(() => {
    const trades = sessions.flatMap((x) => x.replay?.trades ?? []);
    const wins = trades.filter((t) => t.pnl > 0).length;
    const best = sessions
      .map((x) => ({ name: x.name, pair: x.pair, pnl: (x.replay?.trades ?? []).reduce((a, t) => a + t.pnl, 0), n: x.replay?.trades?.length ?? 0 }))
      .filter((x) => x.n)
      .sort((a, b) => b.pnl - a.pnl);
    return {
      n: trades.length,
      winRate: trades.length ? (wins / trades.length) * 100 : 0,
      avgR: trades.length ? trades.reduce((a, t) => a + (t.r || 0), 0) / trades.length : 0,
      best: best[0],
    };
  }, [sessions]);

  return (
    <div className="glossy rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] font-semibold text-white">Backtesting</h2>
        <Link to="/sessions" className="text-[12px] text-emerald-400 hover:text-emerald-300">Open sessions</Link>
      </div>
      {!s.n ? (
        <p className="text-sm text-gray-500">No saved backtest trades yet. Replay a market in Sessions to compare practice with live results.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3 text-center">
          <div><p className="text-[10px] uppercase tracking-widest text-gray-500">Trades</p><p className="text-lg font-bold text-white">{s.n}</p></div>
          <div><p className="text-[10px] uppercase tracking-widest text-gray-500">Win rate</p><p className="text-lg font-bold text-white">{s.winRate.toFixed(0)}%</p></div>
          <div><p className="text-[10px] uppercase tracking-widest text-gray-500">Avg R</p><p className={`text-lg font-bold ${s.avgR >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmtR(s.avgR)}</p></div>
          {live && <p className="col-span-3 text-[12px] text-gray-500 mt-1">Live journal: <span className="text-gray-300">{live.winRate}% win rate, {live.avgR >= 0 ? '+' : ''}{live.avgR}R average</span></p>}
          {s.best && <p className="col-span-3 text-[12px] text-gray-500">Best session: <span className="text-gray-300">{s.best.name}</span> ({s.best.pair})</p>}
        </div>
      )}
    </div>
  );
}
