import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const r = (t) => {
  if (!t) return 0;
  const res = (t.result || '').toLowerCase().trim();
  let val = parseFloat(t.r_multiple);
  if (Number.isNaN(val)) val = 0;
  if (res === 'loss' && val > 0) return -1;
  if (res === 'be') return 0;
  if (res === 'win' && val < 0) return Math.abs(val);
  return val;
};

const isWin = (t) => {
  if (!t) return false;
  const res = (t.result || '').toLowerCase().trim();
  if (res === 'win') return true;
  if (res === 'loss' || res === 'be') return false;
  return r(t) > 0;
};

const fmtR = (v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}R`;

const group = (trades, key) => {
  const map = new Map();
  trades.forEach((t) => {
    const k = (typeof key === 'function' ? key(t) : t[key]) || 'Not logged';
    const g = map.get(k) || { name: k, n: 0, wins: 0, total: 0 };
    g.n += 1;
    g.total += r(t);
    if (isWin(t)) g.wins += 1;
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
    <div className="mac-bento-card rounded-3xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-[15px] font-bold text-neutral-900 dark:text-white">Where your edge comes from</h2>
          <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-1">Journal results grouped by what you logged on each trade</p>
        </div>
        <div className="flex flex-wrap gap-1 bg-black/[0.04] dark:bg-black/30 rounded-xl p-1 border border-black/[0.04] dark:border-white/5">
          {DIMENSIONS.map((d) => (
            <button
              key={d.id}
              onClick={() => setDim(d.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                dim === d.id
                  ? 'bg-white dark:bg-white/15 text-neutral-900 dark:text-white shadow-sm font-semibold'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
      {!rows.length ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Log a few trades to see your breakdown.</p>
      ) : (
        <div className="space-y-2.5">
          {rows.slice(0, 8).map((row) => (
            <div key={row.name} className="grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[180px_minmax(0,1fr)_auto] items-center gap-3 text-xs">
              <span className="text-neutral-700 dark:text-neutral-300 truncate font-medium" title={row.name}>{row.name}</span>
              <div className="hidden md:block h-2 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                <div className={`h-full rounded-full ${row.total >= 0 ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-rose-500 dark:bg-rose-400'}`} style={{ width: `${(Math.abs(row.total) / maxAbs) * 100}%` }} />
              </div>
              <span className="flex gap-3 font-mono tabular-nums">
                <span className="text-neutral-400 dark:text-neutral-500 w-16 text-right whitespace-nowrap">{row.n} trades</span>
                <span className="text-neutral-600 dark:text-neutral-400 w-12 text-right">{row.winRate.toFixed(0)}%</span>
                <span className={`w-16 text-right font-bold ${row.total >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{fmtR(row.total)}</span>
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
        <span className="text-neutral-600 dark:text-neutral-400 font-medium">{label}</span>
        <span className={`font-bold ${v == null ? 'text-neutral-400 dark:text-neutral-500' : v >= 60 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>{v == null ? '-' : `${v.toFixed(0)}%`}</span>
      </div>
      <div className="w-full bg-black/5 dark:bg-white/5 rounded-full h-1.5 overflow-hidden">
        <div className={`h-1.5 rounded-full ${v >= 60 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${v ?? 0}%` }} />
      </div>
    </div>
  );

  return (
    <div className="mac-bento-card rounded-3xl p-6 flex-1">
      <h3 className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-5">Trading Health</h3>
      <div className="space-y-5">
        {bar('Rule following', h.rules)}
        {bar('Psychology tagged', h.tagged)}
        <div className="pt-4 mt-2 border-t border-black/[0.05] dark:border-white/5 space-y-1.5 text-[12px]">
          {h.brokenCost < 0 && <p className="text-neutral-600 dark:text-neutral-300">Broken rules cost you <span className="text-rose-500 font-bold">{fmtR(h.brokenCost)}</span></p>}
          <p className="text-neutral-400 dark:text-neutral-500">{h.missing > 0 ? `${h.missing} trade${h.missing > 1 ? 's' : ''} missing psychology tags` : 'Every trade has psychology tags'}</p>
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
    <div className="mac-bento-card rounded-3xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] font-bold text-neutral-900 dark:text-white">Backtesting</h2>
        <Link to="/sessions" className="text-[12px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">Open sessions</Link>
      </div>
      {!s.n ? (
        <p className="text-sm text-neutral-400 dark:text-neutral-500">No saved backtest trades yet. Replay a market in Sessions to compare practice with live results.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3 text-center">
          <div><p className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 dark:text-neutral-500">Trades</p><p className="text-lg font-bold text-neutral-900 dark:text-white">{s.n}</p></div>
          <div><p className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 dark:text-neutral-500">Win rate</p><p className="text-lg font-bold text-neutral-900 dark:text-white">{s.winRate.toFixed(0)}%</p></div>
          <div><p className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 dark:text-neutral-500">Avg R</p><p className={`text-lg font-bold ${s.avgR >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>{fmtR(s.avgR)}</p></div>
          {live && <p className="col-span-3 text-[12px] text-neutral-400 dark:text-neutral-500 mt-1">Live journal: <span className="text-neutral-700 dark:text-neutral-300 font-semibold">{live.winRate}% win rate, {live.avgR >= 0 ? '+' : ''}{live.avgR}R average</span></p>}
          {s.best && <p className="col-span-3 text-[12px] text-neutral-400 dark:text-neutral-500">Best session: <span className="text-neutral-700 dark:text-neutral-300 font-semibold">{s.best.name}</span> ({s.best.pair})</p>}
        </div>
      )}
    </div>
  );
}
