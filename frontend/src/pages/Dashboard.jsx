import { useEffect, useState, useMemo } from "react";
import { EdgeBreakdown, TradingHealth, BacktestSummary } from "../components/dashboard/PerformanceHub";
import TradeFXBookTopBar from "../components/dashboard/TradeFXBookTopBar";
import TradeFXBookKpiCards from "../components/dashboard/TradeFXBookKpiCards";
import PerformanceEquityCurve from "../components/dashboard/PerformanceEquityCurve";
import MonthlyPnlCalendar from "../components/dashboard/MonthlyPnlCalendar";
import TradeFXBookAddTradeModal from "../components/dashboard/TradeFXBookAddTradeModal";
import OnboardingRulesModal from "../components/guardrails/OnboardingRulesModal";
import RuleBreachAlert from "../components/guardrails/RuleBreachAlert";
import { validateTradeAgainstRules } from "../utils/guardrailValidator";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { mark3DLoaderShown } from "../utils/navigationState";
import {
  calculatePerformanceMetrics,
  formatCurrency,
} from "../utils/performanceMetrics";
import {
  Activity,
  Clock,
  ArrowRight,
  ChevronRight,
  Brain,
  ShieldCheck,
  Target,
} from "lucide-react";

export const normalizeTradeR = (t) => {
  if (!t) return 0;
  const res = (t.result || "").toLowerCase().trim();
  let r = parseFloat(t.r_multiple);
  if (Number.isNaN(r)) r = 0;
  if (res === "loss") return r !== 0 ? -Math.abs(r) : -1;
  if (res === "be") return 0;
  if (res === "win") return r !== 0 ? Math.abs(r) : 1;
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

  let totalDollarPnl = 0;
  let nonZeroDollarCount = 0;
  let totalRRR = 0;
  let rrrCount = 0;
  let currentDollarEquity = 0;
  let maxDollarPeak = 0;
  let maxDollarDD = 0;

  trades.forEach((t) => {
    const res = (t.result || "").toLowerCase().trim();
    const r = normalizeTradeR(t);
    totalR += r;

    // Dollar PnL accumulation
    if (t.pnl !== null && t.pnl !== undefined && !isNaN(Number(t.pnl))) {
      const p = Number(t.pnl);
      totalDollarPnl += p;
      if (p !== 0) nonZeroDollarCount++;
      currentDollarEquity += p;
      if (currentDollarEquity > maxDollarPeak) maxDollarPeak = currentDollarEquity;
      const dollarDD = maxDollarPeak - currentDollarEquity;
      if (dollarDD > maxDollarDD) maxDollarDD = dollarDD;
    }

    // Average RRR calculation (Planned / Target R:R)
    if (t.entry && t.sl && t.tp) {
      const entry = Number(t.entry);
      const sl = Number(t.sl);
      const tp = Number(t.tp);
      const riskDist = Math.abs(entry - sl);
      const rewardDist = Math.abs(tp - entry);
      if (riskDist > 0 && rewardDist > 0) {
        totalRRR += rewardDist / riskDist;
        rrrCount++;
      }
    } else if (r > 0) {
      totalRRR += r;
      rrrCount++;
    }

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

  const avgRRR = rrrCount > 0 ? (totalRRR / rrrCount).toFixed(2) : "2.00";

  return {
    totalR: totalR.toFixed(2),
    winRate: winRate.toFixed(1),
    avgR: avgR.toFixed(2),
    avgRRR,
    avgWin: avgWin.toFixed(2),
    avgLoss: avgLoss.toFixed(2),
    bestTrade: bestTrade.toFixed(2),
    worstTrade: worstTrade.toFixed(2),
    profitFactor: profitFactor.toFixed(2),
    maxDrawdown: maxDD.toFixed(2),
    maxDollarDD: maxDollarDD.toFixed(2),
    totalDollarPnl: totalDollarPnl.toFixed(2),
    hasDollarPnl: nonZeroDollarCount > 0,
    totalTrades: trades.length,
    wins,
    losses: lossCount,
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

  const userId = localStorage.getItem("userId") || localStorage.getItem("userEmail") || "trader";
  const [showOnboardingRules, setShowOnboardingRules] = useState(() => {
    const onboarded =
      localStorage.getItem(`rules_onboarded_${userId}`) === "true" ||
      localStorage.getItem("rules_onboarded") === "true";
    return !onboarded;
  });

  const [disciplineRules, setDisciplineRules] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`trader_discipline_${userId}`) || "{}");
    } catch (e) {
      return {};
    }
  });

  // Check 24-hour timeline and daily loss guardrail violations
  const dailyBreach = useMemo(() => {
    return validateTradeAgainstRules({
      trade: {},
      rules: disciplineRules,
      allTrades,
    });
  }, [disciplineRules, allTrades]);

  useEffect(() => {
    const activeUserId = localStorage.getItem("userId") || localStorage.getItem("userEmail");
    const isOnboardingCompleted =
      localStorage.getItem(`onboarding_completed_${activeUserId}`) === "true" ||
      localStorage.getItem("onboarding_completed") === "true";

    if (!isOnboardingCompleted) {
      navigate("/onboarding", { replace: true });
      return;
    }
    fetchTrades();
  }, [navigate]);

  const fetchTrades = async () => {
    try {
      const userId = localStorage.getItem("userId") || localStorage.getItem("userEmail");
      if (!userId) return navigate("/login");
      const res = await api.get(`/api/trades?userId=${userId}`);
      const getTradeTime = (t) => {
        if (!t) return 0;
        const d = t.date || (t.created_at ? t.created_at.slice(0, 10) : "");
        const tm = t.entry_time || t.time || "12:00";
        if (d) {
          const ts = new Date(`${d}T${tm.length === 5 ? tm + ":00" : tm}`).getTime();
          if (!isNaN(ts)) return ts;
        }
        return t.created_at ? new Date(t.created_at).getTime() : 0;
      };
      const sorted = [...(res.data?.data || [])].sort((a, b) => {
        const diff = getTradeTime(a) - getTradeTime(b);
        if (diff !== 0) return diff;
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      });
      cachedDashboardTrades = sorted;
      setAllTrades(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      mark3DLoaderShown();
    }
  };

  const trades = useMemo(() => {
    if (!selectedAccount) return allTrades;
    return allTrades.filter((t) => t.account_name === selectedAccount);
  }, [allTrades, selectedAccount]);

  const stats = useMemo(() => calcStats(trades), [trades]);

  const recentActivityTrades = useMemo(() => {
    return [...trades]
      .sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date))
      .slice(0, 5);
  }, [trades]);

  const performanceMetrics = useMemo(() => {
    return calculatePerformanceMetrics(trades, "$");
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
      {/* Welcome {name}, Ctrl+K Search, Dropdown Account Switcher, Quick Actions (+), Live Clock, Profile, Bell, Theme Toggle */}
      <TradeFXBookTopBar
        trades={allTrades}
        selectedAccount={selectedAccount}
        onSelectAccount={setSelectedAccount}
        onOpenAddTradeModal={() => setIsAddTradeModalOpen(true)}
        onOpenSearch={() => {
          window.dispatchEvent(new CustomEvent("open-spotlight-search"));
          window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
        }}
      />

      {/* ── REAL-TIME GUARDRAIL BREACH ALERT (Top Red Card) ── */}
      {dailyBreach.isBreached && (
        <RuleBreachAlert breach={dailyBreach.primaryBreach} />
      )}

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

      {/* ── 4. RECENT ACTIVITY & TRADING HEALTH (Screenshots 4 & 5) ── */}
      {/* Recent Activity relocated into 2-column slot in place of Economic Calendar feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Card */}
        <div className="lg:col-span-2 rounded-3xl p-6 bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-500" />
                <span>Recent Activity</span>
              </h3>
              <span className="text-xs text-neutral-400 font-medium">
                {recentActivityTrades.length} trades
              </span>
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
                      className="p-3 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between hover:border-emerald-500/25 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            t.direction === "LONG" ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                        />
                        <div>
                          <p className="text-xs font-bold text-neutral-900 dark:text-white">{t.asset}</p>
                          <p className="text-[10px] text-neutral-400">{t.date}</p>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-bold font-mono px-2.5 py-1 rounded-xl ${
                          isWin
                            ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                            : "text-rose-600 dark:text-rose-400 bg-rose-500/10"
                        }`}
                      >
                        {r >= 0 ? "+" : ""}
                        {r.toFixed(2)}R
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <button
            onClick={() => navigate("/trades")}
            className="mt-4 pt-3 border-t border-black/[0.05] dark:border-white/[0.06] text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 group cursor-pointer"
          >
            <span>View All Activity</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Trading Health */}
        <TradingHealth trades={trades} />
      </div>

      {/* ── 5. EDGE BREAKDOWN & BACKTEST SUMMARY ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <EdgeBreakdown trades={trades} />
        </div>
        <BacktestSummary live={stats.totalTrades ? stats : null} />
      </div>

      {/* ── 6. TRADING INTELLIGENCE & LABS HUB (Deep Analysis) ── */}
      <div className="rounded-3xl bg-white dark:bg-[#12151e]/85 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Trading Intelligence & Labs Hub
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Consolidated Strategy Analytics, Psychology Lab discipline, and Mistake Lab leak detection.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium mr-1">
              {selectedAccount ? `Showing: ${selectedAccount}` : "All Accounts"}
            </span>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Discipline: {(performanceMetrics.mistakes?.ruleAdherenceRate || 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* 3 Core Labs Bento Grid (Matches Institutional Performance Hub) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LAB 1: Strategy Edge */}
          <div
            onClick={() => navigate("/analysis/performance")}
            className="p-5 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.05] hover:border-emerald-500/30 cursor-pointer group transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-black/[0.04] dark:border-white/[0.05]">
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-emerald-500" /> Strategy Edge
                </span>
                <span className="text-[10px] font-medium text-neutral-400">
                  {performanceMetrics.setupInsights?.length || 0} Setups
                </span>
              </div>

              {(!performanceMetrics.setupInsights || performanceMetrics.setupInsights.length === 0) ? (
                <p className="text-xs text-neutral-400 py-6 text-center">No setup data logged</p>
              ) : (
                <div className="space-y-2.5">
                  {performanceMetrics.setupInsights.slice(0, 4).map((s) => (
                    <div
                      key={s.name}
                      className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-white/70 dark:bg-white/[0.02] border border-black/[0.03] dark:border-white/[0.03]"
                    >
                      <div className="truncate max-w-[130px]">
                        <p className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">{s.name}</p>
                        <p className="text-[10px] text-neutral-400">
                          {s.count} trades • {s.r > 0 ? `+${s.r}R` : `${s.r}R`}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-bold font-mono ${
                            s.pnl >= 0 ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
                          }`}
                        >
                          {formatCurrency(s.pnl)}
                        </span>
                        <p className="text-[10px] font-medium text-neutral-400">
                          {(s.winRate || 0).toFixed(0)}% Win Rate
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Session Breakdown Mini Bar */}
            <div>
              {performanceMetrics.sessionInsights && performanceMetrics.sessionInsights.length > 0 && (
                <div className="mt-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.05]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">Session Edge</p>
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    {performanceMetrics.sessionInsights.slice(0, 3).map((sess) => (
                      <div
                        key={sess.name}
                        className="p-1.5 rounded-lg bg-white/80 dark:bg-white/[0.02] border border-black/[0.02] dark:border-white/[0.04]"
                      >
                        <p className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300 truncate">{sess.name}</p>
                        <p className={`text-[10px] font-mono font-bold ${sess.pnl >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                          {formatCurrency(sess.pnl)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-black/[0.05] dark:border-white/5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-between">
                <span>Full Strategy Analytics</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>

          {/* LAB 2: Psychology & Discipline */}
          <div
            onClick={() => navigate("/analysis/performance")}
            className="p-5 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.05] hover:border-purple-500/30 cursor-pointer group transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-black/[0.04] dark:border-white/[0.05]">
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-purple-500" /> Psychology & Discipline
                </span>
                <span className="text-[10px] font-medium text-neutral-400">Rules vs Emotions</span>
              </div>

              {/* Side-by-Side: Followed vs Broken Rules */}
              <div className="grid grid-cols-2 gap-2 mb-3.5">
                <div className="p-2.5 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Rules Followed
                  </p>
                  <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                    {formatCurrency(performanceMetrics.rulesFollowed?.pnl || 0)}
                  </p>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {performanceMetrics.rulesFollowed?.count || 0} trades • {(performanceMetrics.rulesFollowed?.winRate || 0).toFixed(0)}% WR
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-500/[0.06] border border-rose-500/20 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    Rules Broken
                  </p>
                  <p className="text-base font-extrabold text-rose-600 dark:text-rose-400 font-mono mt-0.5">
                    {formatCurrency(performanceMetrics.rulesBroken?.pnl || 0)}
                  </p>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {performanceMetrics.rulesBroken?.count || 0} trades • {(performanceMetrics.rulesBroken?.winRate || 0).toFixed(0)}% WR
                  </p>
                </div>
              </div>

              {/* Emotions Tag Feed */}
              {performanceMetrics.emotionInsights && performanceMetrics.emotionInsights.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Pre-Trade Emotional States</p>
                  {performanceMetrics.emotionInsights.slice(0, 3).map((e) => (
                    <div
                      key={e.name}
                      className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-white/70 dark:bg-white/[0.02] border border-black/[0.02] dark:border-white/[0.03]"
                    >
                      <span className="font-medium text-neutral-700 dark:text-neutral-300">{e.name}</span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-[10px] text-neutral-400">{e.count}t</span>
                        <span className={`font-bold ${e.pnl >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                          {formatCurrency(e.pnl)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-black/[0.05] dark:border-white/5 text-[11px] text-purple-600 dark:text-purple-400 font-semibold flex items-center justify-between">
              <span>Full Psychology Lab</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* LAB 3: Mistake Lab */}
          <div
            onClick={() => navigate("/analysis/performance")}
            className="p-5 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.05] hover:border-amber-500/30 cursor-pointer group transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-black/[0.04] dark:border-white/[0.05]">
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-500" /> Mistake Lab
                </span>
                <span className="text-[10px] font-bold text-rose-500">
                  {performanceMetrics.mistakes?.unforcedErrorsCount || 0} Breaches
                </span>
              </div>

              <div className="space-y-2 text-xs mb-3.5">
                <div className="flex items-center justify-between p-2 rounded-xl bg-white/70 dark:bg-white/[0.02] border border-black/[0.03] dark:border-white/[0.03]">
                  <span className="text-neutral-600 dark:text-neutral-400">Rule Adherence Rate</span>
                  <span className="font-bold text-emerald-500 font-mono">
                    {(performanceMetrics.mistakes?.ruleAdherenceRate || 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white/70 dark:bg-white/[0.02] border border-black/[0.03] dark:border-white/[0.03]">
                  <span className="text-neutral-600 dark:text-neutral-400">Capital Leak to Mistakes</span>
                  <span className="font-bold text-rose-500 font-mono">
                    {formatCurrency(-(performanceMetrics.mistakes?.costOfMistakes || 0))}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white/70 dark:bg-white/[0.02] border border-black/[0.03] dark:border-white/[0.03]">
                  <span className="text-neutral-600 dark:text-neutral-400">Total R Drag</span>
                  <span className="font-bold text-rose-500 font-mono">
                    -{Math.abs(performanceMetrics.mistakes?.costOfMistakesR || 0).toFixed(1)}R
                  </span>
                </div>
              </div>

              {/* Mistake Audit Feed */}
              {performanceMetrics.mistakes?.unforcedErrors && performanceMetrics.mistakes.unforcedErrors.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                    Recent Unforced Errors
                  </p>
                  <div className="space-y-1.5">
                    {performanceMetrics.mistakes.unforcedErrors.slice(0, 2).map((err, i) => (
                      <div key={i} className="p-2 rounded-xl bg-rose-500/[0.04] border border-rose-500/10 text-[11px]">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-bold text-rose-600 dark:text-rose-400">
                            {err.setup || err.asset || "Discretionary"}
                          </span>
                          <span className="font-mono text-rose-500 font-bold">{formatCurrency(err.pnl)}</span>
                        </div>
                        {(err.reason || err.notes) && (
                          <p className="text-neutral-500 dark:text-neutral-400 truncate">Why: {err.reason || err.notes}</p>
                        )}
                        {(err.lesson || err.takeaway) && (
                          <p className="text-neutral-600 dark:text-neutral-300 font-medium truncate">Fix: {err.lesson || err.takeaway}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!performanceMetrics.mistakes?.unforcedErrors || performanceMetrics.mistakes.unforcedErrors.length === 0) && (
                <div className="p-3 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/10 text-center">
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Zero Unforced Errors</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">100% disciplined rule execution</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-black/[0.05] dark:border-white/5 text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center justify-between">
              <span>Full Mistake Lab</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* ── 7. TRADEFXBOOK ADD TRADE MODAL (Screenshots 4 & 5) ── */}
      <TradeFXBookAddTradeModal
        isOpen={isAddTradeModalOpen}
        onClose={() => setIsAddTradeModalOpen(false)}
        onTradeAdded={() => {
          fetchTrades();
        }}
        trades={allTrades}
      />

      {/* ── 8. MANDATORY ONBOARDING GUARDRAILS MODAL (New User First Login) ── */}
      <OnboardingRulesModal
        isOpen={showOnboardingRules}
        userId={userId}
        onComplete={(savedRules) => {
          setShowOnboardingRules(false);
          setDisciplineRules(savedRules);
        }}
      />
    </div>
  );
}
