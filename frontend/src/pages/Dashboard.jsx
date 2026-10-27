import { useEffect, useState, useMemo } from "react";
import { EdgeBreakdown, TradingHealth, BacktestSummary } from "../components/dashboard/PerformanceHub";
import AccountFilter from "../components/AccountFilter";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { mark3DLoaderShown } from "../utils/navigationState";
import {
  Activity,
  PlusCircle,
  Clock,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  List,
  Brain,
  ShieldCheck,
  ChevronRight,
  Globe,
} from "lucide-react";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

// Mini SVG Equity Curve
const EquityCurve = ({ data, trades = [] }) => {
  const [hover, setHover] = useState(null);
  if (!data || data.length < 2) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
        <Activity className="w-8 h-8 mb-2 opacity-20" />
        <p className="text-xs">Log more trades to generate equity curve</p>
      </div>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 800;
  const height = 200;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d - min) / range) * height;
    return `${x},${y}`;
  });

  const isProfitable = data[data.length - 1] >= data[0];
  const strokeColor = isProfitable ? "#34d399" : "#f87171";
  const fillColor = isProfitable ? "url(#emeraldGradient)" : "url(#redGradient)";

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    setHover({ i: Math.round(ratio * (data.length - 1)), ratio });
  };

  const hi = hover?.i;
  const ht = hi > 0 ? trades[hi - 1] : null;
  const hx = hi != null ? (hi / (data.length - 1)) * width : 0;
  const hy = hi != null ? height - ((data[hi] - min) / range) * height : 0;

  return (
    <div className="relative w-full h-full" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 -10 ${width} ${height + 20}`} className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f87171" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#f87171" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline fill="none" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points.join(" ")} className="drop-shadow-lg" />
        <polygon fill={fillColor} points={`${0},${height} ${points.join(" ")} ${width},${height}`} />
        {hi != null && (
          <>
            <line x1={hx} x2={hx} y1={-10} y2={height + 10} stroke="#ffffff" strokeOpacity="0.15" strokeDasharray="4 4" />
            <circle cx={hx} cy={hy} r="6" fill={strokeColor} stroke="#101216" strokeWidth="2" />
          </>
        )}
      </svg>
      {hi != null && (
        <div
          className="absolute top-0 z-10 w-52 pointer-events-none rounded-xl border border-white/10 bg-[#0b0d10]/95 p-3 text-[11px] shadow-2xl backdrop-blur"
          style={{ left: `${hover.ratio * 100}%`, transform: `translateX(${hover.ratio > 0.6 ? "-105%" : "5%"})` }}
        >
          {ht ? (
            <>
              <div className="flex justify-between text-gray-400"><span>{ht.date}</span><span>#{hi}</span></div>
              <div className="mt-1 font-semibold text-white flex items-center gap-1.5">
                <span>{ht.asset}</span>
                <span
                  className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                    ht.direction === "LONG"
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                      : "bg-red-500/15 text-red-400 border-red-500/25"
                  }`}
                >
                  {ht.direction === "LONG" ? (
                    <ArrowUp className="w-2.5 h-2.5" />
                  ) : (
                    <ArrowDown className="w-2.5 h-2.5" />
                  )}
                  {ht.direction}
                </span>
              </div>
              <div className={`font-mono font-bold ${(parseFloat(ht.r_multiple) || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {(parseFloat(ht.r_multiple) || 0) >= 0 ? "+" : ""}{(parseFloat(ht.r_multiple) || 0).toFixed(2)}R
              </div>
              <div className="mt-1.5 space-y-0.5 text-gray-400">
                {ht.setup && <div>Setup: <span className="text-gray-200">{ht.setup}</span></div>}
                {ht.session && <div>Session: <span className="text-gray-200">{ht.session}</span></div>}
              </div>
            </>
          ) : (
            <div className="text-gray-400">Start</div>
          )}
          <div className="mt-2 border-t border-white/10 pt-1.5 text-gray-400">
            Equity: <span className="font-mono text-white">{data[hi].toFixed(2)}R</span>
          </div>
        </div>
      )}
    </div>
  );
};

export const normalizeTradeR = (t) => {
  if (!t) return 0;
  const res = (t.result || "").toLowerCase().trim();
  let r = parseFloat(t.r_multiple);
  if (Number.isNaN(r)) r = 0;
  if (res === "loss" && r > 0) return -1;
  if (res === "be") return 0;
  if (res === "win" && r < 0) return Math.abs(r);
  return r;
};

export const isTradeWin = (t) => {
  if (!t) return false;
  const res = (t.result || "").toLowerCase().trim();
  if (res === "win") return true;
  if (res === "loss" || res === "be") return false;
  return normalizeTradeR(t) > 0;
};

// Pure stat calculator
function calcStats(trades) {
  let wins = 0, totalR = 0, grossProfit = 0, grossLoss = 0, currentEquity = 0;
  const equityData = [0];
  trades.forEach((t) => {
    const res = (t.result || "").toLowerCase().trim();
    const r = normalizeTradeR(t);
    totalR += r;
    if (res === "win" || (res !== "loss" && res !== "be" && r > 0)) {
      wins++;
      grossProfit += r;
    } else if (res === "loss" || r < 0) {
      grossLoss += Math.abs(r);
    }
    currentEquity += r;
    equityData.push(currentEquity);
  });
  const winRate = trades.length ? (wins / trades.length) * 100 : 0;
  const avgR = trades.length ? totalR / trades.length : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0;
  let maxPeak = 0, maxDD = 0;
  equityData.forEach((eq) => {
    if (eq > maxPeak) maxPeak = eq;
    const dd = maxPeak - eq;
    if (dd > maxDD) maxDD = dd;
  });
  return {
    totalR: totalR.toFixed(2), winRate: winRate.toFixed(1), avgR: avgR.toFixed(2),
    profitFactor: profitFactor.toFixed(2), maxDrawdown: maxDD.toFixed(2),
    totalTrades: trades.length, equityData,
  };
}

// Module-scoped cache for trades
let cachedDashboardTrades = null;

export default function Dashboard() {
  const [allTrades, setAllTrades] = useState(() => cachedDashboardTrades || []);
  const [isLoading, setIsLoading] = useState(() => !cachedDashboardTrades);
  const [selectedAccount, setSelectedAccount] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      const userId = localStorage.getItem("userId") || localStorage.getItem("userEmail");
      if (!userId) return navigate("/login");
      const res = await api.get(`/api/trades?userId=${userId}`);
      const sorted = [...(res.data?.data || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
      cachedDashboardTrades = sorted;
      setAllTrades(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      mark3DLoaderShown();
    }
  };

  // ── ALL useMemo HOOKS MUST BE BEFORE ANY EARLY RETURN ──
  const trades = useMemo(() => {
    if (!selectedAccount) return allTrades;
    return allTrades.filter((t) => t.account_name === selectedAccount);
  }, [allTrades, selectedAccount]);

  const stats = useMemo(() => calcStats(trades), [trades]);

  const analyticsSetups = useMemo(() => {
    const setups = {};
    trades.forEach(t => {
      if (!t.setup) return;
      if (!setups[t.setup]) setups[t.setup] = { total: 0, wins: 0, r: 0 };
      setups[t.setup].total++;
      if (isTradeWin(t)) setups[t.setup].wins++;
      setups[t.setup].r += normalizeTradeR(t);
    });
    return Object.entries(setups)
      .map(([name, d]) => ({ name, netR: d.r, total: d.total, winRate: (d.wins / d.total) * 100 }))
      .sort((a, b) => b.netR - a.netR).slice(0, 3);
  }, [trades]);

  const topEmotion = useMemo(() => {
    const map = {};
    trades.forEach(t => {
      if (!t.emotion_before) return;
      if (!map[t.emotion_before]) map[t.emotion_before] = { r: 0, count: 0 };
      map[t.emotion_before].r += normalizeTradeR(t);
      map[t.emotion_before].count++;
    });
    return Object.entries(map)
      .map(([name, d]) => ({ name, netR: d.r, count: d.count }))
      .sort((a, b) => b.netR - a.netR).slice(0, 3);
  }, [trades]);

  const mistakesData = useMemo(() => {
    const unforced = trades.filter(t => (t.result || "").toLowerCase() === "loss" && t.rule_break === "yes");
    const cost = unforced.reduce((acc, t) => acc + normalizeTradeR(t), 0);
    return { count: unforced.length, cost };
  }, [trades]);

  const insight = useMemo(() => {
    if (trades.length < 5) return { text: "Log more trades to unlock behavioral insights.", type: "neutral" };
    if (parseFloat(stats.profitFactor) < 1.0) return { text: "Your profit factor has dropped below 1.0. Review your recent losing trades to plug the leak.", type: "warning" };
    if (parseFloat(stats.winRate) > 60 && parseFloat(stats.avgR) > 0) return { text: "Strong performance pattern detected. Your edge is currently playing out well.", type: "success" };
    return { text: "Your average R-multiple is stable, but consistency could improve.", type: "neutral" };
  }, [trades, stats]);

  // ── SKELETON WHILE BACKGROUND DATA INITIALIZES ──
  if (isLoading) {
    return (
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 pb-20 animate-pulse">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-black/5 dark:bg-white/5 rounded-2xl" />
            <div className="h-4 w-48 bg-black/5 dark:bg-white/5 rounded-xl" />
          </div>
          <div className="flex items-center gap-3 md:pr-24">
            <div className="h-10 w-36 bg-black/5 dark:bg-white/5 rounded-2xl" />
            <div className="h-10 w-28 bg-emerald-500/20 rounded-2xl" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 rounded-3xl bg-black/5 dark:bg-white/5 border border-black/[0.04] dark:border-white/[0.06]" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 rounded-3xl bg-black/5 dark:bg-white/5 border border-black/[0.04] dark:border-white/[0.06]" />
          <div className="h-72 rounded-3xl bg-black/5 dark:bg-white/5 border border-black/[0.04] dark:border-white/[0.06]" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 pb-20">

      {/* 1. HERO HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium text-neutral-800 dark:text-neutral-100">
            {getGreeting()},{" "}
            <span className="text-neutral-900 dark:text-white font-semibold">
              {localStorage.getItem("userEmail")?.split("@")[0] || "Trader"}
            </span>
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1 text-[13px]">
            Your trading performance at a glance.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap md:pr-28">
          <AccountFilter trades={allTrades} selectedAccount={selectedAccount} onChange={setSelectedAccount} />
          <button
            onClick={() => navigate("/add-trade")}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-2xl transition-all text-[13px] shadow-lg shadow-emerald-500/25 active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" /> Log Trade
          </button>
        </div>
      </div>

      {/* 2. KPI ROW (Apple macOS Bento Box Row) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          {
            label: "Net R-Multiple",
            value: `${stats.totalR >= 0 ? "+" : ""}${stats.totalR}R`,
            color: parseFloat(stats.totalR) >= 0 ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400",
          },
          { label: "Win Rate", value: `${stats.winRate}%`, color: "text-neutral-900 dark:text-white" },
          { label: "Profit Factor", value: stats.profitFactor, color: "text-neutral-900 dark:text-white" },
          {
            label: "Average R",
            value: `${parseFloat(stats.avgR) >= 0 ? "+" : ""}${stats.avgR}R`,
            color: "text-neutral-700 dark:text-neutral-300",
          },
          { label: "Max Drawdown", value: `-${stats.maxDrawdown}R`, color: "text-rose-500 dark:text-rose-400" },
        ].map((kpi, i) => (
          <div key={i} className="mac-bento-card rounded-3xl p-5">
            <p className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-2">
              {kpi.label}
            </p>
            <p className={`ledger-figure text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* 3. MAIN PERFORMANCE AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 mac-bento-card rounded-3xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[15px] font-bold text-neutral-900 dark:text-white">Equity Progression (R)</h2>
              <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-1">
                Cumulative R-Multiple across {selectedAccount ? `"${selectedAccount}"` : "all trades"}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> New Highs
              </span>
            </div>
          </div>
          <div className="flex-1 min-h-[250px] relative">
            <EquityCurve data={stats.equityData} trades={trades} />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="relative overflow-hidden flex flex-col justify-between rounded-3xl p-6 bg-white/70 dark:bg-[#10131b]/70 backdrop-blur-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:border-emerald-500/30 dark:hover:border-emerald-500/30 transition-all duration-300 group">
            {/* Ambient emerald edge glow */}
            <div className="pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full bg-emerald-500/[0.07] dark:bg-emerald-500/[0.12] blur-2xl" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> Economic Calendar
                </h3>
                <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.08] px-2 py-0.5 rounded-full">
                  Live Feed
                </span>
              </div>
              <p className="text-neutral-600 dark:text-neutral-300 text-[13px] leading-relaxed mb-4 font-normal">
                Stay ahead of the markets. Track upcoming high-impact economic events before you execute your trades.
              </p>
            </div>

            <div className="relative z-10 mt-2 pt-4 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between gap-3">
              <button
                onClick={() => navigate("/affiliate")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 dark:border-emerald-500/30 transition-all active:scale-95 cursor-pointer"
              >
                <img src="/logo3d.png" alt="ForexNotes" className="w-3.5 h-3.5 object-contain inline-block shrink-0" />
                <span>Get 10% Off with Affiliate</span>
              </button>
              <button
                onClick={() => navigate("/news")}
                className="text-[12px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 transition-colors group/link cursor-pointer"
              >
                <span>View Calendar</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5" />
              </button>
            </div>
          </div>
          <TradingHealth trades={trades} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><EdgeBreakdown trades={trades} /></div>
        <BacktestSummary live={stats.totalTrades ? stats : null} />
      </div>

      {/* 4. RECENT TRADES */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-bold text-neutral-900 dark:text-white">Recent Executions</h2>
          <button
            onClick={() => navigate("/trades")}
            className="text-[12px] font-semibold text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
          >
            View All History
          </button>
        </div>
        {trades.length === 0 ? (
          <div className="mac-bento-card rounded-3xl p-10 text-center border border-dashed border-black/[0.08] dark:border-white/10">
            <List className="w-8 h-8 text-neutral-400 dark:text-neutral-600 mx-auto mb-3" />
            <h3 className="text-neutral-800 dark:text-neutral-200 font-semibold mb-1">Your trading history starts here.</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-5">
              Log your first trade to begin discovering your performance patterns.
            </p>
            <button
              onClick={() => navigate("/add-trade")}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[13px] font-semibold rounded-xl transition-all shadow-md shadow-emerald-500/25 active:scale-95"
            >
              Add First Trade
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...trades].sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date)).slice(0, 3).map((t, i) => {
              const r = normalizeTradeR(t);
              const isWin = isTradeWin(t);
              return (
                <div key={i} onClick={() => navigate("/trades")} className="mac-bento-card rounded-3xl p-5 hover:border-emerald-500/25 transition-all cursor-pointer group flex flex-col justify-between h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${t.direction === "LONG" ? "bg-emerald-500" : "bg-red-500"}`} />
                        <h4 className="font-semibold text-[14px] text-neutral-900 dark:text-neutral-100">{t.asset}</h4>
                        <span
                          className={`inline-flex items-center gap-0.5 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md border ${
                            t.direction === "LONG"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                          }`}
                        >
                          {t.direction === "LONG" ? (
                            <ArrowUp className="w-2.5 h-2.5" />
                          ) : (
                            <ArrowDown className="w-2.5 h-2.5" />
                          )}
                          {t.direction}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5"><Clock className="w-3 h-3" /> {t.date}</p>
                    </div>
                    <div className={`px-2 py-0.5 rounded-lg border text-[11px] font-bold shrink-0 ${isWin ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"}`}>
                      {r >= 0 ? "+" : ""}{r.toFixed(2)}R
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 border-t border-black/[0.05] dark:border-white/5 pt-3 mt-auto">
                    <span className="truncate max-w-[120px]">{t.setup || "No setup logged"}</span>
                    <span className="font-medium group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Details &rarr;</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. DEEP ANALYSIS MINI-SECTIONS */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-bold text-neutral-900 dark:text-white">Deep Analysis</h2>
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400">{selectedAccount ? `Showing: ${selectedAccount}` : "All Accounts"}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Strategy Analytics Mini */}
          <div onClick={() => navigate("/analytics")} className="mac-bento-card rounded-3xl p-5 hover:border-emerald-500/25 cursor-pointer group transition-all flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-500/10 rounded-xl"><Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /></div>
                  <span className="text-[13px] font-semibold text-neutral-900 dark:text-white">Strategy Analytics</span>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-emerald-500 transition-colors" />
              </div>
              {analyticsSetups.length === 0 ? (
                <p className="text-[12px] text-neutral-500 dark:text-neutral-400">No setup data yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {analyticsSetups.map((s, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-[12px] text-neutral-700 dark:text-neutral-300 truncate max-w-[130px]">{s.name}</span>
                      <span className={`text-[12px] font-bold ${s.netR >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>{s.netR >= 0 ? "+" : ""}{s.netR.toFixed(2)}R</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-black/[0.05] dark:border-white/5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">Full Analysis <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" /></div>
          </div>

          {/* Psychology Lab Mini */}
          <div onClick={() => navigate("/psychology")} className="mac-bento-card rounded-3xl p-5 hover:border-emerald-500/25 cursor-pointer group transition-all flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-500/10 rounded-xl"><Brain className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /></div>
                  <span className="text-[13px] font-semibold text-neutral-900 dark:text-white">Psychology Lab</span>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-emerald-500 transition-colors" />
              </div>
              {topEmotion.length === 0 ? (
                <p className="text-[12px] text-neutral-500 dark:text-neutral-400">No psychology data yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {topEmotion.map((e, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-[12px] text-neutral-700 dark:text-neutral-300 truncate max-w-[130px]">{e.name}</span>
                      <span className={`text-[12px] font-bold ${e.netR >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>{e.netR >= 0 ? "+" : ""}{e.netR.toFixed(2)}R</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-black/[0.05] dark:border-white/5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">Full Analysis <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" /></div>
          </div>

          {/* Mistake Lab Mini */}
          <div onClick={() => navigate("/mistakes")} className="mac-bento-card rounded-3xl p-5 hover:border-rose-500/25 cursor-pointer group transition-all flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-rose-500/10 rounded-xl"><ShieldCheck className="w-4 h-4 text-rose-600 dark:text-rose-400" /></div>
                  <span className="text-[13px] font-semibold text-neutral-900 dark:text-white">Mistake Lab</span>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-rose-500 transition-colors" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-neutral-500 dark:text-neutral-400">Unforced Errors</span>
                  <span className="text-[13px] font-bold text-neutral-900 dark:text-white">{mistakesData.count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-neutral-500 dark:text-neutral-400">Cost of Mistakes</span>
                  <span className={`text-[13px] font-bold ${mistakesData.cost < 0 ? "text-rose-600 dark:text-rose-400" : "text-neutral-600 dark:text-neutral-400"}`}>{mistakesData.cost.toFixed(2)}R</span>
                </div>
                {trades.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">
                      <span>Rule Discipline</span>
                      <span>{(((trades.length - mistakesData.count) / trades.length) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${((trades.length - mistakesData.count) / trades.length) * 100}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-black/[0.05] dark:border-white/5 text-[11px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">Full Analysis <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" /></div>
          </div>

        </div>
      </div>

    </div>
  );
}
