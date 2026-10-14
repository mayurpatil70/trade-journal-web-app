import { useEffect, useState, useMemo } from "react";
import { EdgeBreakdown, TradingHealth, BacktestSummary } from "../components/dashboard/PerformanceHub";
import AccountFilter from "../components/AccountFilter";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import {
  Activity,
  PlusCircle,
  Clock,
  ArrowRight,
  List,
  Brain,
  ShieldCheck,
  ChevronRight,
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
              <div className="mt-1 font-semibold text-white">{ht.asset} {ht.direction}</div>
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

export default function Dashboard() {
  const [allTrades, setAllTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState("");
  const navigate = useNavigate();

  useEffect(() => { fetchTrades(); }, []);

  const fetchTrades = async () => {
    try {
      const userId = localStorage.getItem("userId") || localStorage.getItem("userEmail");
      if (!userId) return navigate("/login");
      const res = await api.get(`/api/trades?userId=${userId}`);
      const sorted = [...(res.data?.data || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
      setAllTrades(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
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

  // ── EARLY RETURN AFTER ALL HOOKS ──
  if (isLoading) {
    return (
      <div className="p-8 h-full flex flex-col gap-6">
        <div className="h-20 bg-white/5 rounded-2xl animate-pulse"></div>
        <div className="grid grid-cols-5 gap-4">
          {[1,2,3,4,5].map(i => <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse"></div>)}
        </div>
        <div className="h-64 bg-white/5 rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 pb-20">

      {/* 1. HERO HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium text-gray-200">
            {getGreeting()}, <span className="text-white font-semibold">{localStorage.getItem("userEmail")?.split("@")[0] || "Trader"}</span>
          </h1>
          <p className="text-gray-500 mt-1 text-[13px]">Your trading performance at a glance.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <AccountFilter trades={allTrades} selectedAccount={selectedAccount} onChange={setSelectedAccount} />
          <button onClick={() => navigate("/add-trade")} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors text-[13px] shadow-lg shadow-emerald-500/20">
            <PlusCircle className="w-4 h-4" /> Log Trade
          </button>
        </div>
      </div>

      {/* 2. KPI ROW */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Net R-Multiple", value: `${stats.totalR >= 0 ? "+" : ""}${stats.totalR}R`, color: parseFloat(stats.totalR) >= 0 ? "text-emerald-400" : "text-red-400" },
          { label: "Win Rate", value: `${stats.winRate}%`, color: "text-white" },
          { label: "Profit Factor", value: stats.profitFactor, color: "text-white" },
          { label: "Average R", value: `${parseFloat(stats.avgR) >= 0 ? "+" : ""}${stats.avgR}R`, color: "text-gray-300" },
          { label: "Max Drawdown", value: `-${stats.maxDrawdown}R`, color: "text-red-400" },
        ].map((kpi, i) => (
          <div key={i} className="glossy rounded-2xl p-5">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2">{kpi.label}</p>
            <p className={`ledger-figure text-3xl ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* 3. MAIN PERFORMANCE AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glossy rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[15px] font-semibold text-white">Equity Progression (R)</h2>
              <p className="text-[12px] text-gray-500 mt-1">Cumulative R-Multiple across {selectedAccount ? `"${selectedAccount}"` : "all trades"}</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400" /> New Highs</span>
            </div>
          </div>
          <div className="flex-1 min-h-[250px] relative">
            <EquityCurve data={stats.equityData} trades={trades} />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-gradient-to-br from-emerald-50 to-white dark:from-[#102a3a] dark:to-[#0A0B0D] border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden group flex flex-col justify-between">
            <div>
              <h3 className="text-[11px] font-semibold text-emerald-500 uppercase tracking-widest mb-3">Economic Calendar</h3>
              <p className="text-gray-200 text-[13px] leading-relaxed mb-4 relative z-10">
                Stay ahead of the markets. Track upcoming high-impact economic events before you execute your trades.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center relative z-10">
              <button
                onClick={() => navigate("/affiliate")}
                className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-black bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 transition-all shadow-md shadow-amber-500/30 hover:shadow-amber-400/50 hover:scale-105 active:scale-95"
              >
                <Sparkles className="w-3 h-3" /> Get 10% Off with Affiliate
              </button>
              <button onClick={() => navigate("/news")} className="text-[12px] font-semibold text-emerald-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                View Calendar <ArrowRight className="w-3 h-3" />
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
          <h2 className="text-[15px] font-semibold text-white">Recent Executions</h2>
          <button onClick={() => navigate("/trades")} className="text-[12px] font-semibold text-gray-400 hover:text-white transition-colors">View All History</button>
        </div>
        {trades.length === 0 ? (
          <div className="bg-[#101216] border border-white/5 rounded-2xl p-10 text-center">
            <List className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <h3 className="text-gray-300 font-medium mb-1">Your trading history starts here.</h3>
            <p className="text-xs text-gray-500 mb-5">Log your first trade to begin discovering your performance patterns.</p>
            <button onClick={() => navigate("/add-trade")} className="px-5 py-2 bg-white/10 hover:bg-white/15 text-white text-[13px] font-medium rounded-lg transition-colors">Add First Trade</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...trades].sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date)).slice(0, 3).map((t, i) => {
              const r = normalizeTradeR(t);
              const isWin = isTradeWin(t);
              return (
                <div key={i} onClick={() => navigate("/trades")} className="bg-[#101216] border border-white/5 rounded-2xl p-5 hover:bg-[#15181D] hover:border-white/10 transition-all cursor-pointer group">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${t.direction === "LONG" ? "bg-emerald-400" : "bg-purple-400"}`} />
                        <h4 className="font-semibold text-[14px] text-gray-100">{t.asset}</h4>
                        <span className="text-[9px] uppercase font-bold text-gray-400 px-1.5 py-0.5 bg-white/5 rounded">{t.direction}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 flex items-center gap-1.5"><Clock className="w-3 h-3" /> {t.date}</p>
                    </div>
                    <div className={`px-2 py-0.5 rounded-md border text-[11px] font-bold ${isWin ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                      {r >= 0 ? "+" : ""}{r.toFixed(2)}R
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-400 border-t border-white/5 pt-3">
                    <span className="truncate max-w-[120px]">{t.setup || "No setup logged"}</span>
                    <span className="group-hover:text-white transition-colors">Details &rarr;</span>
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
          <h2 className="text-[15px] font-semibold text-white">Deep Analysis</h2>
          <span className="text-[11px] text-gray-500">{selectedAccount ? `Showing: ${selectedAccount}` : "All Accounts"}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Strategy Analytics Mini */}
          <div onClick={() => navigate("/analytics")} className="bg-[#101216] border border-white/5 hover:border-emerald-500/20 rounded-2xl p-5 cursor-pointer group transition-all hover:bg-[#101e18]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/10 rounded-xl"><Activity className="w-4 h-4 text-emerald-400" /></div>
                <span className="text-[13px] font-semibold text-white">Strategy Analytics</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 transition-colors" />
            </div>
            {analyticsSetups.length === 0 ? (
              <p className="text-[12px] text-gray-600">No setup data yet.</p>
            ) : (
              <div className="space-y-2">
                {analyticsSetups.map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-300 truncate max-w-[130px]">{s.name}</span>
                    <span className={`text-[12px] font-bold ${s.netR >= 0 ? "text-emerald-400" : "text-red-400"}`}>{s.netR >= 0 ? "+" : ""}{s.netR.toFixed(2)}R</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">Full Analysis <ArrowRight className="w-3 h-3" /></div>
          </div>

          {/* Psychology Lab Mini */}
          <div onClick={() => navigate("/psychology")} className="bg-[#101216] border border-white/5 hover:border-purple-500/20 rounded-2xl p-5 cursor-pointer group transition-all hover:bg-[#130e1a]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-500/10 rounded-xl"><Brain className="w-4 h-4 text-purple-400" /></div>
                <span className="text-[13px] font-semibold text-white">Psychology Lab</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-purple-400 transition-colors" />
            </div>
            {topEmotion.length === 0 ? (
              <p className="text-[12px] text-gray-600">No psychology data yet.</p>
            ) : (
              <div className="space-y-2">
                {topEmotion.map((e, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-300 truncate max-w-[130px]">{e.name}</span>
                    <span className={`text-[12px] font-bold ${e.netR >= 0 ? "text-emerald-400" : "text-red-400"}`}>{e.netR >= 0 ? "+" : ""}{e.netR.toFixed(2)}R</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-purple-400 font-semibold flex items-center gap-1">Full Analysis <ArrowRight className="w-3 h-3" /></div>
          </div>

          {/* Mistake Lab Mini */}
          <div onClick={() => navigate("/mistakes")} className="bg-[#101216] border border-white/5 hover:border-amber-500/20 rounded-2xl p-5 cursor-pointer group transition-all hover:bg-[#1a1508]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 rounded-xl"><ShieldCheck className="w-4 h-4 text-amber-400" /></div>
                <span className="text-[13px] font-semibold text-white">Mistake Lab</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-amber-400 transition-colors" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-gray-400">Unforced Errors</span>
                <span className="text-[13px] font-bold text-white">{mistakesData.count}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-gray-400">Cost of Mistakes</span>
                <span className={`text-[13px] font-bold ${mistakesData.cost < 0 ? "text-red-400" : "text-gray-300"}`}>{mistakesData.cost.toFixed(2)}R</span>
              </div>
              {trades.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                    <span>Rule Discipline</span>
                    <span>{(((trades.length - mistakesData.count) / trades.length) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${((trades.length - mistakesData.count) / trades.length) * 100}%` }} />
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-amber-400 font-semibold flex items-center gap-1">Full Analysis <ArrowRight className="w-3 h-3" /></div>
          </div>

        </div>
      </div>

    </div>
  );
}

const Sparkles = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
  </svg>
);
