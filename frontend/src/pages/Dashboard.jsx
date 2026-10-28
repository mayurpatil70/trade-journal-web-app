import { useEffect, useState, useMemo } from "react";
import { EdgeBreakdown, TradingHealth, BacktestSummary } from "../components/dashboard/PerformanceHub";
import AccountFilter from "../components/AccountFilter";
import TradeFXBookTopBar from "../components/dashboard/TradeFXBookTopBar";
import TradeFXBookKpiCards from "../components/dashboard/TradeFXBookKpiCards";
import PerformanceEquityCurve from "../components/dashboard/PerformanceEquityCurve";
import MonthlyPnlCalendar from "../components/dashboard/MonthlyPnlCalendar";
import TradeFXBookAddTradeModal from "../components/dashboard/TradeFXBookAddTradeModal";
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
  Inbox,
} from "lucide-react";

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
  let winSum = 0, lossSum = 0, winCount = 0, lossCount = 0;
  let bestTrade = 0, worstTrade = 0;
  const equityData = [0];

  trades.forEach((t) => {
    const res = (t.result || "").toLowerCase().trim();
    const r = normalizeTradeR(t);
    totalR += r;

    if (r > bestTrade) bestTrade = r;
    if (r < worstTrade) worstTrade = r;

    if (res === "win" || (res !== "loss" && res !== "be" && r > 0)) {
      wins++;
      winCount++;
      winSum += r;
      grossProfit += r;
    } else if (res === "loss" || r < 0) {
      lossCount++;
      lossSum += Math.abs(r);
      grossLoss += Math.abs(r);
    }
    currentEquity += r;
    equityData.push(currentEquity);
  });

  const winRate = trades.length ? (wins / trades.length) * 100 : 0;
  const avgR = trades.length ? totalR / trades.length : 0;
  const avgWin = winCount ? winSum / winCount : 0;
  const avgLoss = lossCount ? lossSum / lossCount : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0;

  let maxPeak = 0, maxDD = 0;
  equityData.forEach((eq) => {
    if (eq > maxPeak) maxPeak = eq;
    const dd = maxPeak - eq;
    if (dd > maxDD) maxDD = dd;
  });

  return {
    totalR: totalR.toFixed(2),
    winRate: winRate.toFixed(1),
    avgR: avgR.toFixed(2),
    avgWin: avgWin.toFixed(2),
    avgLoss: avgLoss.toFixed(2),
    bestTrade: bestTrade.toFixed(2),
    worstTrade: worstTrade.toFixed(2),
    profitFactor: profitFactor.toFixed(2),
    maxDrawdown: maxDD.toFixed(2),
    totalTrades: trades.length,
    equityData,
  };
}

let cachedDashboardTrades = null;

export default function Dashboard() {
  const [allTrades, setAllTrades] = useState(() => cachedDashboardTrades || []);
  const [isLoading, setIsLoading] = useState(() => !cachedDashboardTrades);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [isAddTradeModalOpen, setIsAddTradeModalOpen] = useState(false);
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

  const accountNames = useMemo(() => {
    const names = new Set();
    allTrades.forEach((t) => {
      if (t.account_name && t.account_name.trim()) names.add(t.account_name.trim());
    });
    return Array.from(names).sort();
  }, [allTrades]);

  const trades = useMemo(() => {
    if (!selectedAccount) return allTrades;
    return allTrades.filter((t) => t.account_name === selectedAccount);
  }, [allTrades, selectedAccount]);

  const stats = useMemo(() => calcStats(trades), [trades]);

  const openPositions = useMemo(() => {
    return trades.filter((t) => t.result === "open");
  }, [trades]);

  const recentActivityTrades = useMemo(() => {
    return [...trades]
      .sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date))
      .slice(0, 5);
  }, [trades]);

  const analyticsSetups = useMemo(() => {
    const setups = {};
    trades.forEach((t) => {
      if (!t.setup) return;
      if (!setups[t.setup]) setups[t.setup] = { total: 0, wins: 0, r: 0 };
      setups[t.setup].total++;
      if (isTradeWin(t)) setups[t.setup].wins++;
      setups[t.setup].r += normalizeTradeR(t);
    });
    return Object.entries(setups)
      .map(([name, d]) => ({ name, netR: d.r, total: d.total, winRate: (d.wins / d.total) * 100 }))
      .sort((a, b) => b.netR - a.netR)
      .slice(0, 3);
  }, [trades]);

  const topEmotion = useMemo(() => {
    const map = {};
    trades.forEach((t) => {
      if (!t.emotion_before) return;
      if (!map[t.emotion_before]) map[t.emotion_before] = { r: 0, count: 0 };
      map[t.emotion_before].r += normalizeTradeR(t);
      map[t.emotion_before].count++;
    });
    return Object.entries(map)
      .map(([name, d]) => ({ name, netR: d.r, count: d.count }))
      .sort((a, b) => b.netR - a.netR)
      .slice(0, 3);
  }, [trades]);

  const mistakesData = useMemo(() => {
    const unforced = trades.filter((t) => (t.result || "").toLowerCase() === "loss" && t.rule_break === "yes");
    const cost = unforced.reduce((acc, t) => acc + normalizeTradeR(t), 0);
    return { count: unforced.length, cost };
  }, [trades]);

  if (isLoading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-20 animate-pulse">
        <div className="h-14 rounded-2xl bg-black/5 dark:bg-white/5" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-3xl bg-black/5 dark:bg-white/5" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-7 h-80 rounded-3xl bg-black/5 dark:bg-white/5" />
          <div className="xl:col-span-5 h-80 rounded-3xl bg-black/5 dark:bg-white/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-20">
      {/* ── 1. TRADEFXBOOK TOP HORIZONTAL BAR (Screenshots 1 & 2) ── */}
      <TradeFXBookTopBar
        onOpenAddTradeModal={() => setIsAddTradeModalOpen(true)}
        onOpenSearch={() => {
          window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
        }}
      />

      {/* ── ACCOUNT TABS & ACCOUNT-WISE FILTER (All Accounts / Specific Accounts) ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Horizontal scrollable Apple Segmented Tabs for 1-click account switching */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-neutral-100 dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/[0.06] overflow-x-auto scrollbar-none max-w-full">
          <button
            type="button"
            onClick={() => setSelectedAccount("")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              !selectedAccount
                ? "bg-white dark:bg-[#1c2233] text-blue-600 dark:text-blue-400 shadow-sm border border-black/[0.05] dark:border-white/[0.1]"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <span>All Accounts</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/[0.05] dark:bg-white/[0.08] font-mono">
              {allTrades.length}
            </span>
          </button>

          {accountNames.map((acc) => {
            const count = allTrades.filter((t) => t.account_name === acc).length;
            return (
              <button
                key={acc}
                type="button"
                onClick={() => setSelectedAccount(acc)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  selectedAccount === acc
                    ? "bg-white dark:bg-[#1c2233] text-blue-600 dark:text-blue-400 shadow-sm border border-black/[0.05] dark:border-white/[0.1]"
                    : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                <span>{acc}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/[0.05] dark:bg-white/[0.08] font-mono">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <AccountFilter trades={allTrades} selectedAccount={selectedAccount} onChange={setSelectedAccount} />
          <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium hidden md:inline">
            {selectedAccount ? `Filtered: ${selectedAccount}` : "All Accounts"}
          </span>
        </div>
      </div>

      {/* ── 2. TRADEFXBOOK 4 KPI CARDS (Screenshot 1) ── */}
      <TradeFXBookKpiCards stats={stats} trades={trades} />

      {/* ── 3. PERFORMANCE EQUITY CURVE & MONTHLY P&L (Screenshots 1 & 3) ── */}
      {/* Left: Responsive Equity Curve (dates at down, scrollbar, 1d/1w/1m/1y) | Right: Monthly P&L Calendar */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-7">
          <PerformanceEquityCurve trades={trades} />
        </div>
        <div className="xl:col-span-5">
          <MonthlyPnlCalendar
            trades={trades}
            onTradeClick={(t) => {
              navigate("/trades");
            }}
          />
        </div>
      </div>

      {/* ── 4. OPEN POSITIONS & RECENT ACTIVITY (Screenshots 1 & 2) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Positions Card */}
        <div className="rounded-3xl p-6 bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-4">
              Open Positions
            </h3>
            {openPositions.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-500">
                <Inbox className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-xs font-medium">No open positions</p>
              </div>
            ) : (
              <div className="space-y-2">
                {openPositions.slice(0, 3).map((t, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-xs text-neutral-900 dark:text-white">{t.asset}</span>
                      <span className="text-[10px] uppercase font-bold text-blue-500">{t.direction}</span>
                    </div>
                    <span className="text-xs font-mono font-semibold text-amber-500">In Play</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => navigate("/trades")}
            className="mt-4 pt-3 border-t border-black/[0.05] dark:border-white/[0.06] text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 group cursor-pointer"
          >
            <span>View All Positions</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Recent Activity Card */}
        <div className="rounded-3xl p-6 bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Recent Activity
              </h3>
              <span className="text-xs text-neutral-400">{recentActivityTrades.length} trades</span>
            </div>
            {recentActivityTrades.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-500">
                <Clock className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-xs font-medium">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentActivityTrades.map((t, idx) => {
                  const r = normalizeTradeR(t);
                  const isWin = isTradeWin(t);
                  return (
                    <div
                      key={idx}
                      onClick={() => navigate("/trades")}
                      className="p-2.5 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between hover:border-blue-500/25 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2 h-2 rounded-full ${t.direction === "LONG" ? "bg-blue-500" : "bg-rose-500"}`} />
                        <div>
                          <p className="text-xs font-bold text-neutral-900 dark:text-white">{t.asset}</p>
                          <p className="text-[10px] text-neutral-400">{t.date}</p>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-bold font-mono px-2 py-0.5 rounded-lg ${
                          isWin ? "text-blue-600 dark:text-blue-400 bg-blue-500/10" : "text-rose-600 dark:text-rose-400 bg-rose-500/10"
                        }`}
                      >
                        {r >= 0 ? "+" : ""}{r.toFixed(2)}R
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <button
            onClick={() => navigate("/trades")}
            className="mt-4 pt-3 border-t border-black/[0.05] dark:border-white/[0.06] text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 group cursor-pointer"
          >
            <span>View All Activity</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* ── 5. TOP PERFORMERS & QUICK STATS (Screenshot 2) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="rounded-3xl p-6 bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-4">
            Top Performers
          </h3>
          {analyticsSetups.length === 0 ? (
            <p className="text-xs text-neutral-400 py-6 text-center">No trading data yet</p>
          ) : (
            <div className="space-y-3">
              {analyticsSetups.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 dark:bg-white/[0.03]">
                  <div>
                    <span className="text-xs font-bold text-neutral-900 dark:text-white">{s.name}</span>
                    <p className="text-[10px] text-neutral-400">{s.total} trades • {s.winRate.toFixed(0)}% Win Rate</p>
                  </div>
                  <span className="text-xs font-bold font-mono text-blue-600 dark:text-blue-400">
                    +{s.netR.toFixed(2)}R
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats Grid */}
        <div className="rounded-3xl p-6 bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-4">
            Quick Stats
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.05]">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Avg Win</p>
              <p className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">
                +{stats.avgWin}R
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.05]">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Avg Loss</p>
              <p className="text-lg font-bold font-mono text-rose-500 mt-1">
                -{stats.avgLoss}R
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.05]">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Best Trade</p>
              <p className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">
                +{stats.bestTrade}R
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.05]">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Worst Trade</p>
              <p className="text-lg font-bold font-mono text-rose-500 mt-1">
                {stats.worstTrade}R
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 6. ECONOMIC CALENDAR & TRADING HEALTH ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative overflow-hidden flex flex-col justify-between rounded-3xl p-6 bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Economic Calendar Feed
            </h3>
            <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-white/[0.06] px-2 py-0.5 rounded-full">
              Live Macro
            </span>
          </div>
          <p className="text-neutral-600 dark:text-neutral-300 text-sm leading-relaxed mb-4">
            Track upcoming high-impact central bank announcements, CPI releases, and interest rate decisions before executing.
          </p>
          <div className="mt-2 pt-4 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
            <span className="text-xs text-neutral-400">Never get caught off guard by volatility spikes</span>
            <button
              onClick={() => navigate("/news")}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View Full Calendar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <TradingHealth trades={trades} />
      </div>

      {/* ── 7. EDGE BREAKDOWN & BACKTEST SUMMARY ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <EdgeBreakdown trades={trades} />
        </div>
        <BacktestSummary live={stats.totalTrades ? stats : null} />
      </div>

      {/* ── 8. DEEP ANALYSIS (Strategy Analytics, Psychology Lab, Mistake Lab) ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-bold text-neutral-900 dark:text-white">Deep Analysis</h2>
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
            {selectedAccount ? `Showing: ${selectedAccount}` : "All Accounts"}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Strategy Analytics */}
          <div
            onClick={() => navigate("/analytics")}
            className="rounded-3xl p-5 bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] hover:border-blue-500/25 cursor-pointer group transition-all flex flex-col justify-between h-full"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-500/10 rounded-xl">
                    <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-[13px] font-semibold text-neutral-900 dark:text-white">
                    Strategy Analytics
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-blue-500 transition-colors" />
              </div>
              {analyticsSetups.length === 0 ? (
                <p className="text-[12px] text-neutral-500 dark:text-neutral-400">No setup data yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {analyticsSetups.map((s, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-[12px] text-neutral-700 dark:text-neutral-300 truncate max-w-[130px]">
                        {s.name}
                      </span>
                      <span className={`text-[12px] font-bold ${s.netR >= 0 ? "text-blue-600 dark:text-blue-400" : "text-rose-600"}`}>
                        {s.netR >= 0 ? "+" : ""}{s.netR.toFixed(2)}R
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-black/[0.05] dark:border-white/5 text-[11px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
              Full Analysis <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Psychology Lab */}
          <div
            onClick={() => navigate("/psychology")}
            className="rounded-3xl p-5 bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] hover:border-blue-500/25 cursor-pointer group transition-all flex flex-col justify-between h-full"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-500/10 rounded-xl">
                    <Brain className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span className="text-[13px] font-semibold text-neutral-900 dark:text-white">
                    Psychology Lab
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-indigo-500 transition-colors" />
              </div>
              {topEmotion.length === 0 ? (
                <p className="text-[12px] text-neutral-500 dark:text-neutral-400">No psychology data yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {topEmotion.map((e, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-[12px] text-neutral-700 dark:text-neutral-300 truncate max-w-[130px]">
                        {e.name}
                      </span>
                      <span className={`text-[12px] font-bold ${e.netR >= 0 ? "text-blue-600 dark:text-blue-400" : "text-rose-600"}`}>
                        {e.netR >= 0 ? "+" : ""}{e.netR.toFixed(2)}R
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-black/[0.05] dark:border-white/5 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
              Full Analysis <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Mistake Lab */}
          <div
            onClick={() => navigate("/mistakes")}
            className="rounded-3xl p-5 bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] hover:border-rose-500/25 cursor-pointer group transition-all flex flex-col justify-between h-full"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-rose-500/10 rounded-xl">
                    <ShieldCheck className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  </div>
                  <span className="text-[13px] font-semibold text-neutral-900 dark:text-white">
                    Mistake Lab
                  </span>
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
                  <span className={`text-[13px] font-bold ${mistakesData.cost < 0 ? "text-rose-600 dark:text-rose-400" : "text-neutral-600"}`}>
                    {mistakesData.cost.toFixed(2)}R
                  </span>
                </div>
                {trades.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">
                      <span>Rule Discipline</span>
                      <span>{(((trades.length - mistakesData.count) / trades.length) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 dark:bg-blue-500 rounded-full"
                        style={{ width: `${((trades.length - mistakesData.count) / trades.length) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-black/[0.05] dark:border-white/5 text-[11px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
              Full Analysis <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* ── 9. TRADEFXBOOK ADD TRADE MODAL (Screenshots 4 & 5) ── */}
      <TradeFXBookAddTradeModal
        isOpen={isAddTradeModalOpen}
        onClose={() => setIsAddTradeModalOpen(false)}
        onTradeAdded={() => {
          fetchTrades();
        }}
      />
    </div>
  );
}
