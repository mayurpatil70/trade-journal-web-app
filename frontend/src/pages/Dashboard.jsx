import { useEffect, useState, useMemo } from "react";
import { EdgeBreakdown, TradingHealth, BacktestSummary } from "../components/dashboard/PerformanceHub";
import TradeFXBookTopBar from "../components/dashboard/TradeFXBookTopBar";
import TradeFXBookKpiCards from "../components/dashboard/TradeFXBookKpiCards";
import PerformanceEquityCurve from "../components/dashboard/PerformanceEquityCurve";
import MonthlyPnlCalendar from "../components/dashboard/MonthlyPnlCalendar";
import TradeFXBookAddTradeModal from "../components/dashboard/TradeFXBookAddTradeModal";
import MorningTradingQuoteModal from "../components/dashboard/MorningTradingQuoteModal";
import SocialFollowCard from "../components/dashboard/SocialFollowCard";
import DashboardNewsTicker from "../components/dashboard/DashboardNewsTicker";
import OnboardingRulesModal from "../components/guardrails/OnboardingRulesModal";
import RuleBreachAlert from "../components/guardrails/RuleBreachAlert";
import { validateTradeAgainstRules } from "../utils/guardrailValidator";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { mark3DLoaderShown } from "../utils/navigationState";
import {
  getImmediateCachedTrades,
  getTradesWithCache,
  setCachedTrades,
} from "../utils/tradeCache";
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
  ShieldAlert,
  Target,
  Briefcase,
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

export default function Dashboard() {
  const [allTrades, setAllTrades] = useState(() => getImmediateCachedTrades() || []);
  const [isLoading, setIsLoading] = useState(() => !getImmediateCachedTrades());
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

  // Check 24-hour timeline and daily loss guardrail violations ACCOUNT-WISE
  const dailyBreach = useMemo(() => {
    return validateTradeAgainstRules({
      trade: {},
      rules: disciplineRules,
      allTrades,
      accountName: selectedAccount && selectedAccount !== "All Accounts" ? selectedAccount : null,
    });
  }, [disciplineRules, allTrades, selectedAccount]);

  const fetchProfileAndRules = async () => {
    try {
      const activeUserId = localStorage.getItem("userId") || localStorage.getItem("userEmail");
      if (!activeUserId) return;
      const res = await api.get(`/api/auth/profile?userId=${encodeURIComponent(activeUserId)}`);
      if (res.data?.success && res.data?.profile) {
        const p = res.data.profile;
        if (p.discipline_rules) {
          setDisciplineRules(p.discipline_rules);
          localStorage.setItem(`trader_discipline_${activeUserId}`, JSON.stringify(p.discipline_rules));
        }
        if (p.display_name) {
          localStorage.setItem("userName", p.display_name);
          localStorage.setItem("userDisplayName", p.display_name);
        }
        if (p.avatar_url) {
          localStorage.setItem("userAvatar", p.avatar_url);
          localStorage.setItem(`user_avatar_${activeUserId}`, p.avatar_url);
        }
        if (p.display_name || p.avatar_url) {
          window.dispatchEvent(
            new CustomEvent("user_profile_updated", {
              detail: { displayName: p.display_name, avatarUrl: p.avatar_url },
            })
          );
        }
        if (p.rules_onboarded || (p.discipline_rules && Object.keys(p.discipline_rules).length > 0)) {
          setShowOnboardingRules(false);
          localStorage.setItem(`rules_onboarded_${activeUserId}`, "true");
          localStorage.setItem("rules_onboarded", "true");
          localStorage.setItem(`onboarding_completed_${activeUserId}`, "true");
          localStorage.setItem("onboarding_completed", "true");
        }
      }
    } catch (err) {
      console.warn("[Dashboard] Rules fetch notice:", err.message);
    }
  };

  useEffect(() => {
    const handleRulesUpdated = (e) => {
      if (e.detail) {
        setDisciplineRules(e.detail);
        setShowOnboardingRules(false);
      }
    };
    window.addEventListener("trading-rules-updated", handleRulesUpdated);
    return () => window.removeEventListener("trading-rules-updated", handleRulesUpdated);
  }, []);

  useEffect(() => {
    const activeUserId = localStorage.getItem("userId") || localStorage.getItem("userEmail");
    if (!activeUserId) {
      navigate("/login", { replace: true });
      return;
    }
    fetchTrades();
    fetchProfileAndRules();
  }, [navigate]);

  const fetchTrades = async () => {
    try {
      const userId = localStorage.getItem("userId") || localStorage.getItem("userEmail");
      if (!userId) return navigate("/login");
      const sorted = await getTradesWithCache(userId);
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

  const openPositions = useMemo(() => {
    return (trades || []).filter(
      (t) =>
        (t.result || "").toLowerCase() === "open" ||
        (t.status || "").toLowerCase() === "open" ||
        ((t.exit_price === null || t.exit_price === undefined || t.exit_price === "") &&
          (t.exitPrice === null || t.exitPrice === undefined || t.exitPrice === "") &&
          (t.pnl === null || t.pnl === undefined || t.pnl === ""))
    );
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

      {/* ── 4. OPEN POSITIONS & RECENT ACTIVITY (Matches TradeFXBook Screenshots 3 & 4) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Positions Card */}
        <div className="rounded-3xl p-6 bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#0066FF]" />
                <span>Open Positions</span>
              </h3>
              <span className="text-xs text-neutral-400 font-medium font-mono">
                {openPositions.length} open
              </span>
            </div>

            {openPositions.length === 0 ? (
              <div className="py-6 flex flex-col items-center justify-center text-center">
                <div className="w-11 h-11 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.05] flex items-center justify-center mb-2">
                  <Briefcase className="w-5 h-5 opacity-40 text-neutral-500" />
                </div>
                <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">No open positions</p>
                <p className="text-[11px] text-neutral-400 mt-0.5 mb-3.5">All logged trades are closed</p>

                {/* Discord Server Link & Badge at Empty Card */}
                <a
                  href="https://discord.gg/Ajaw3AjfWE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full p-2.5 rounded-2xl bg-[#5865F2]/[0.08] dark:bg-[#5865F2]/15 border border-[#5865F2]/25 hover:border-[#5865F2]/50 hover:bg-[#5865F2]/[0.12] dark:hover:bg-[#5865F2]/20 transition-all flex items-center justify-between group/disc cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 text-left">
                    <div className="w-8 h-8 rounded-xl bg-[#5865F2] text-white flex items-center justify-center shrink-0 shadow-sm">
                      <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-neutral-900 dark:text-white">ForexNotes Community</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[#5865F2] text-white">VIP Badge</span>
                      </div>
                      <p className="text-[10px] text-neutral-500 dark:text-neutral-400">Join 10,000+ traders discussing live setups</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-[#5865F2] text-white font-bold text-[11px] shadow-sm group-hover/disc:scale-105 transition-transform flex items-center gap-1 shrink-0">
                    <span>Join Server</span>
                    <ArrowRight className="w-3 h-3 text-white" />
                  </span>
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                {openPositions.map((t, idx) => (
                  <div
                    key={idx}
                    onClick={() => navigate("/trades")}
                    className="p-3 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between hover:border-blue-500/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-blue-500/10 text-[#0066FF] dark:text-blue-400 font-black text-xs flex items-center justify-center">
                        {t.asset?.[0] || "$"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-neutral-900 dark:text-white">{t.asset}</p>
                          <span
                            className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                              t.direction === "LONG"
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-rose-500/10 text-rose-600"
                            }`}
                          >
                            {t.direction}
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-400">
                          Entry: {t.entry || "—"} • {t.date || "Today"}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-lg bg-blue-500/10 text-[#0066FF] dark:text-blue-400">
                      Open
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setIsAddTradeModalOpen(true)}
            className="mt-4 pt-3 border-t border-black/[0.05] dark:border-white/[0.06] text-xs font-semibold text-[#0066FF] dark:text-blue-400 hover:text-blue-600 flex items-center gap-1 group cursor-pointer"
          >
            <span>+ Log New Position</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Recent Activity Card */}
        <div className="rounded-3xl p-6 bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col justify-between">
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
                        <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center">
                          🪙
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-neutral-900 dark:text-white">{t.asset}</p>
                            <span
                              className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                t.direction === "LONG"
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : "bg-rose-500/10 text-rose-600"
                              }`}
                            >
                              {t.direction}
                            </span>
                          </div>
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
      </div>

      {/* Trading Health */}
      <div className="w-full">
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
            className="p-5 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.05] hover:border-rose-500/30 cursor-pointer group transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-black/[0.04] dark:border-white/[0.05]">
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-500" /> Mistake Lab
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

            <div className="mt-4 pt-3 border-t border-black/[0.05] dark:border-white/5 text-[11px] text-neutral-600 dark:text-neutral-300 group-hover:text-rose-500 font-semibold flex items-center justify-between">
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
        activeAccount={selectedAccount}
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

      {/* ── 9. MORNING TRADING QUOTE 24H POP-UP MODAL (Screenshot 1) ── */}
      <MorningTradingQuoteModal />

      {/* ── 10. SOCIAL MEDIA FOLLOW CARD (Screenshots 2, 3, 4) ── */}
      <SocialFollowCard />

      {/* ── 11. HORIZONTAL BOTTOM NEWS TICKER BAR (Screenshots 3, 4, 5) ── */}
      <DashboardNewsTicker />
    </div>
  );
}
