// frontend/src/pages/PerformanceAnalytics.jsx
// Institutional-grade Performance Analytics Dashboard
// Faithfully replicates TradeFXBook Analysis with macOS / iOS Frosted Bento UI

import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import AppleSelect from "../components/ui/AppleSelect";
import AccountFilter from "../components/AccountFilter";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Award,
  ShieldCheck,
  Brain,
  AlertTriangle,
  FileText,
  Clock,
  Target,
  BarChart3,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from "lucide-react";
import {
  filterTradesByTimePeriod,
  filterTradesByOutcome,
  calculatePerformanceMetrics,
  formatCurrency,
  formatHoldDuration,
  getTradePnL,
  isTradeWin,
  isTradeLoss,
  isTradeBE,
} from "../utils/performanceMetrics";

export default function PerformanceAnalytics() {
  const navigate = useNavigate();
  const [allTrades, setAllTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [timePeriod, setTimePeriod] = useState("30 Days"); // "Today", "7 Days", "30 Days", "3 Months", "1 Year", "All Time"
  const [outcomeFilter, setOutcomeFilter] = useState("All Trades"); // "All Trades", "Winners", "Losers"
  const [selectedAccount, setSelectedAccount] = useState(""); // "" = All Accounts (matches /dashboard)

  // Chart Toggle
  const [chartMode, setChartMode] = useState("equity"); // "equity" | "drawdown"
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Calendar State
  const today = new Date();
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDateStr, setSelectedDateStr] = useState(null);

  // Fetch all trades
  useEffect(() => {
    const fetchTrades = async () => {
      const userId = localStorage.getItem("userId") || localStorage.getItem("userEmail");
      if (!userId) return navigate("/login");
      try {
        const response = await api.get(`/api/trades?userId=${userId}`);
        const data = response.data?.data || [];
        setAllTrades(data);
      } catch (error) {
        console.error("Failed to fetch trades for performance analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrades();
  }, [navigate]);

  // Filter pipeline
  const filteredTrades = useMemo(() => {
    let list = allTrades;
    const activeAccount =
      typeof selectedAccount === "object" && selectedAccount !== null
        ? (selectedAccount.target?.value ?? selectedAccount.value ?? String(selectedAccount))
        : String(selectedAccount || "");

    if (activeAccount && activeAccount !== "All Accounts") {
      list = list.filter((t) => t.account_name === activeAccount);
    }
    list = filterTradesByTimePeriod(list, timePeriod);
    list = filterTradesByOutcome(list, outcomeFilter);
    return list;
  }, [allTrades, selectedAccount, timePeriod, outcomeFilter]);

  // Compute metrics
  const metrics = useMemo(() => {
    return calculatePerformanceMetrics(filteredTrades, "$");
  }, [filteredTrades]);

  // Calendar Heatmap Grid Generation
  const calendarData = useMemo(() => {
    const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1);
    const lastDayOfMonth = new Date(calendarYear, calendarMonth + 1, 0);
    const totalDays = lastDayOfMonth.getDate();

    // In JS: Sunday is 0, Monday is 1, ..., Saturday is 6
    // We want Monday as index 0, ..., Sunday as index 6
    const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;

    const weeks = [];
    let currentWeek = [];

    // Leading empty slots
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push(null);
    }

    for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
      const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      const dayData = metrics.dailyPnLMap[dateStr] || null;
      currentWeek.push({
        dayNum,
        dateStr,
        dayData,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Trailing empty slots to fill the final week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    // Compute weekly summaries
    const weeksWithSummary = weeks.map((week) => {
      let weeklyPnL = 0;
      let activeDays = 0;
      week.forEach((cell) => {
        if (cell && cell.dayData) {
          weeklyPnL += cell.dayData.pnl;
          activeDays++;
        }
      });
      return {
        days: week,
        weeklyPnL,
        activeDays,
      };
    });

    return weeksWithSummary;
  }, [calendarYear, calendarMonth, metrics.dailyPnLMap]);

  // Selected Day Trades for Day Trades side inspector
  const selectedDayTrades = useMemo(() => {
    if (!selectedDateStr) return [];
    return metrics.dailyPnLMap[selectedDateStr]?.trades || [];
  }, [selectedDateStr, metrics.dailyPnLMap]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };

  // Profit Factor Status Badge
  const pfBadge = useMemo(() => {
    const pf = metrics.profitFactor;
    if (pf === 0 || pf < 1) {
      return {
        label: "Needs work",
        icon: AlertTriangle,
        className: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      };
    }
    if (pf >= 1 && pf < 1.5) {
      return {
        label: "Moderate",
        icon: Activity,
        className: "text-blue-500 bg-blue-500/10 border-blue-500/20",
      };
    }
    if (pf >= 1.5 && pf < 2.0) {
      return {
        label: "Good",
        icon: Check,
        className: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      };
    }
    return {
      label: "Exceptional",
      icon: Sparkles,
      className: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30",
    };
  }, [metrics.profitFactor]);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans transition-colors duration-300">
      {/* ── Top Header Bar ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-sm">
            <Activity className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
              Performance Analytics
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Institutional performance breakdown & trade intelligence
            </p>
          </div>
        </div>

        {/* Filter Controls Cluster */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Time Period Filter Pills (macOS / iOS Crisp Segmented Control) */}
          <div className="inline-flex items-center p-1 rounded-2xl bg-neutral-200/50 dark:bg-white/[0.06] backdrop-blur-xl border border-black/[0.04] dark:border-white/[0.08]">
            {["Today", "7 Days", "30 Days", "3 Months", "1 Year", "All Time"].map((p) => {
              const active = timePeriod === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setTimePeriod(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 antialiased select-none cursor-pointer ${
                    active
                      ? "bg-[#007AFF] dark:bg-[#0A84FF] text-white shadow-[0_1px_3px_rgba(0,0,0,0.15)] ring-1 ring-white/20"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* Outcome Filter Pills (macOS / iOS Crisp Segmented Control) */}
          <div className="inline-flex items-center p-1 rounded-2xl bg-neutral-200/50 dark:bg-white/[0.06] backdrop-blur-xl border border-black/[0.04] dark:border-white/[0.08]">
            {[
              { id: "All Trades", label: "All Trades", icon: null },
              { id: "Winners", label: "Winners", icon: Check },
              { id: "Losers", label: "Losers", icon: X },
            ].map((f) => {
              const active = outcomeFilter === f.id;
              const Icon = f.icon;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setOutcomeFilter(f.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 antialiased select-none cursor-pointer ${
                    active
                      ? "bg-[#007AFF] dark:bg-[#0A84FF] text-white shadow-[0_1px_3px_rgba(0,0,0,0.15)] ring-1 ring-white/20"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />}
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>

          {/* Account Filter matching Dashboard (All Accounts by default) */}
          <AccountFilter
            trades={allTrades}
            selectedAccount={selectedAccount}
            onChange={setSelectedAccount}
          />
        </div>
      </div>

      {/* ── ROW 1: 4 Top KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* TOTAL P&L */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#12151e]/85 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
              Total P&L
            </p>
            <h2
              className={`text-3xl font-extrabold tracking-tight ${
                metrics.totalPnL > 0
                  ? "text-emerald-500 dark:text-emerald-400"
                  : metrics.totalPnL < 0
                  ? "text-rose-500 dark:text-rose-400"
                  : "text-neutral-900 dark:text-white"
              }`}
            >
              {formatCurrency(metrics.totalPnL)}
            </h2>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-4">
            From {metrics.closedTradesCount} closed trades
          </p>
        </div>

        {/* WIN RATE */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#12151e]/85 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
              Win Rate
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              {metrics.winRate.toFixed(1)}%
            </h2>
          </div>
          <div className="mt-4">
            {/* Visual Progress Bar (Matches Screenshot 1) */}
            <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  metrics.winRate > 0 ? "bg-emerald-500" : "bg-rose-500"
                }`}
                style={{ width: `${Math.max(metrics.winRate, metrics.closedTradesCount > 0 ? 3 : 100)}%` }}
              />
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {metrics.winCount} wins • {metrics.lossCount} losses
            </p>
          </div>
        </div>

        {/* PROFIT FACTOR */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#12151e]/85 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
              Profit Factor
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              {metrics.profitFactor === 99.99 ? "∞" : metrics.profitFactor.toFixed(2)}
            </h2>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs">
            <pfBadge.icon className="w-3.5 h-3.5" />
            <span className="font-semibold">{pfBadge.label}</span>
          </div>
        </div>

        {/* EXPECTANCY */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#12151e]/85 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
              Expectancy
            </p>
            <h2
              className={`text-3xl font-extrabold tracking-tight ${
                metrics.expectancy > 0
                  ? "text-emerald-500 dark:text-emerald-400"
                  : metrics.expectancy < 0
                  ? "text-rose-500 dark:text-rose-400"
                  : "text-neutral-900 dark:text-white"
              }`}
            >
              {formatCurrency(metrics.expectancy)}
            </h2>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-4">
            Expected profit per trade
          </p>
        </div>
      </div>

      {/* ── ROW 2: Equity Curve Card ── */}
      <div className="rounded-3xl bg-white dark:bg-[#12151e]/85 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] overflow-hidden mb-6">
        {/* Card Header with Equity / Drawdown Toggle */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-black/[0.05] dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <Activity className="w-4 h-4 text-blue-500" />
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Equity Curve
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Cumulative P&L progression
              </p>
            </div>
          </div>

          <div className="flex items-center p-0.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-black/[0.04] dark:border-white/[0.06]">
            <button
              onClick={() => setChartMode("equity")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                chartMode === "equity"
                  ? "bg-[#2563EB] text-white shadow-sm"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              Equity
            </button>
            <button
              onClick={() => setChartMode("drawdown")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                chartMode === "drawdown"
                  ? "bg-[#2563EB] text-white shadow-sm"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              Drawdown
            </button>
          </div>
        </div>

        {/* Chart Viewport */}
        <div className="relative p-6 min-h-[300px] flex items-center justify-center">
          {metrics.equityPoints.length <= 1 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="w-10 h-10 text-neutral-400 dark:text-neutral-600 mb-3" />
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                Complete trades to see your equity curve
              </p>
            </div>
          ) : (
            <div className="w-full h-64 relative">
              <EquityCurveSVG
                points={metrics.equityPoints}
                mode={chartMode}
                onHover={setHoveredPoint}
              />
              {/* Tooltip */}
              {hoveredPoint && (
                <div
                  className="pointer-events-none absolute z-20 px-3.5 py-2.5 rounded-xl bg-white/95 dark:bg-[#1a1d28]/95 backdrop-blur-md border border-black/10 dark:border-white/10 shadow-xl text-xs -translate-x-1/2 -translate-y-full mb-3"
                  style={{
                    left: `${hoveredPoint.xPct}%`,
                    top: `${hoveredPoint.yPct}%`,
                  }}
                >
                  <p className="text-[10px] text-neutral-400 font-medium">
                    {hoveredPoint.date}
                  </p>
                  <p
                    className={`text-sm font-bold mt-0.5 ${
                      hoveredPoint.val >= 0 ? "text-emerald-500" : "text-rose-500"
                    }`}
                  >
                    {formatCurrency(hoveredPoint.val)}
                  </p>
                  {hoveredPoint.trade && (
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-neutral-600 dark:text-neutral-300">
                      <span className="font-semibold">{hoveredPoint.trade.asset}</span>
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                          hoveredPoint.trade.direction === "LONG"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-rose-500/10 text-rose-600"
                        }`}
                      >
                        {hoveredPoint.trade.direction}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom 8-Column Mini Stats Strip (Matches Screenshot 1) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 border-t border-black/[0.05] dark:border-white/[0.06] divide-y sm:divide-y-0 sm:divide-x divide-black/[0.05] dark:divide-white/[0.06]">
          {[
            { label: "Avg Winner", val: formatCurrency(metrics.avgWinner) },
            { label: "Avg Loser", val: formatCurrency(metrics.avgLoser) },
            { label: "Best Trade", val: formatCurrency(metrics.bestTrade) },
            { label: "Worst Trade", val: formatCurrency(metrics.worstTrade) },
            { label: "Win Streak", val: metrics.maxWinStreak },
            { label: "Loss Streak", val: metrics.maxLossStreak },
            { label: "Risk:Reward", val: `1:${metrics.riskRewardRatio}` },
            { label: "Open Trades", val: metrics.openTradesCount },
          ].map((stat, i) => (
            <div key={i} className="p-4 flex flex-col justify-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                {stat.label}
              </span>
              <span className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                {stat.val}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── ROW 3: Win / Loss Distribution Card (Matches Screenshot 2) ── */}
      <div className="rounded-3xl bg-white dark:bg-[#12151e]/85 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-blue-500 rounded-full border border-blue-500/30 p-0.5" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Win / Loss Distribution
            </h3>
          </div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
            {metrics.winCount} winners • {metrics.lossCount} losers
          </span>
        </div>

        {/* Distribution Progress Bar */}
        <div className="w-full h-3 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex mb-6">
          {metrics.closedTradesCount === 0 ? (
            <div className="w-full h-full bg-neutral-300 dark:bg-neutral-700/50 flex items-center justify-center text-[9px] text-neutral-400">
              No closed trades
            </div>
          ) : (
            <>
              <div
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${(metrics.winCount / metrics.closedTradesCount) * 100}%` }}
                title={`Wins: ${metrics.winCount}`}
              />
              <div
                className="h-full bg-rose-500 transition-all duration-500"
                style={{ width: `${(metrics.lossCount / metrics.closedTradesCount) * 100}%` }}
                title={`Losses: ${metrics.lossCount}`}
              />
            </>
          )}
        </div>

        {/* 3 Metric Columns Underneath */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-black/[0.05] dark:border-white/[0.06]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1">
              Gross Profit
            </span>
            <span className="text-xl font-bold text-emerald-500 dark:text-emerald-400">
              {formatCurrency(metrics.grossProfit)}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1">
              Gross Loss
            </span>
            <span className="text-xl font-bold text-rose-500 dark:text-rose-400">
              {formatCurrency(metrics.grossLoss)}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1">
              Net Result
            </span>
            <span
              className={`text-xl font-bold ${
                metrics.netResult > 0
                  ? "text-emerald-500 dark:text-emerald-400"
                  : metrics.netResult < 0
                  ? "text-rose-500 dark:text-rose-400"
                  : "text-neutral-900 dark:text-white"
              }`}
            >
              {formatCurrency(metrics.netResult)}
            </span>
          </div>
        </div>
      </div>

      {/* ── ROW 4: 3-Card Grid (Long vs Short, Day Performance, Top Symbols) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Card 1: Long vs Short */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#12151e]/85 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Long vs Short
              </h3>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mb-5">
              Performance by trade direction
            </p>

            {/* Split Ratio Bar */}
            <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex mb-6">
              <div
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${metrics.longTrades.percent}%` }}
              />
              <div
                className="h-full bg-rose-500 transition-all duration-500"
                style={{ width: `${metrics.shortTrades.percent}%` }}
              />
            </div>

            {/* Rows */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-blue-500" />
                  <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">Long</span>
                </div>
                <span className="text-neutral-500 dark:text-neutral-400">
                  {metrics.longTrades.count} trades - {metrics.longTrades.percent.toFixed(1)}%
                </span>
                <span
                  className={`font-bold ${
                    metrics.longTrades.pnl >= 0 ? "text-emerald-500" : "text-rose-500"
                  }`}
                >
                  {formatCurrency(metrics.longTrades.pnl)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500" />
                  <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">Short</span>
                </div>
                <span className="text-neutral-500 dark:text-neutral-400">
                  {metrics.shortTrades.count} trades - {metrics.shortTrades.percent.toFixed(1)}%
                </span>
                <span
                  className={`font-bold ${
                    metrics.shortTrades.pnl >= 0 ? "text-emerald-500" : "text-rose-500"
                  }`}
                >
                  {formatCurrency(metrics.shortTrades.pnl)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Day Performance */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#12151e]/85 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
          <div className="flex items-center gap-2 mb-1">
            <CalendarIcon className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Day Performance
            </h3>
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mb-4">
            Find your best trading days
          </p>

          <div className="space-y-2">
            {metrics.dayPerformance.map((item) => (
              <div key={item.day} className="flex items-center justify-between text-xs">
                <span className="w-8 font-semibold text-neutral-600 dark:text-neutral-400">
                  {item.day}
                </span>
                <div className="flex-1 mx-3 h-2 rounded-full bg-neutral-100 dark:bg-neutral-800/80 overflow-hidden relative">
                  {item.pnl !== 0 && (
                    <div
                      className={`h-full rounded-full ${
                        item.pnl > 0 ? "bg-emerald-500" : "bg-rose-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(10, Math.abs(item.pnl) / (Math.abs(metrics.totalPnL) || 100) * 100)
                        )}%`,
                      }}
                    />
                  )}
                </div>
                <div className="w-20 text-right font-medium">
                  {item.count > 0 ? (
                    <span className={item.pnl >= 0 ? "text-emerald-500 font-bold" : "text-rose-500 font-bold"}>
                      {formatCurrency(item.pnl)}
                    </span>
                  ) : (
                    <span className="text-neutral-400 dark:text-neutral-600">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Top Symbols */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#12151e]/85 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Top Symbols
              </h3>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mb-4">
              Best performing assets
            </p>

            {metrics.topSymbols.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-400 dark:text-neutral-500">
                No symbol data yet
              </div>
            ) : (
              <div className="space-y-3">
                {metrics.topSymbols.slice(0, 5).map((s) => (
                  <div
                    key={s.symbol}
                    className="flex items-center justify-between text-xs p-2 rounded-xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.03] dark:border-white/[0.04]"
                  >
                    <div>
                      <span className="font-bold text-neutral-900 dark:text-white block">
                        {s.symbol}
                      </span>
                      <span className="text-[10px] text-neutral-500">
                        {s.count} trades • {s.winRate.toFixed(0)}% WR
                      </span>
                    </div>
                    <span
                      className={`font-bold ${
                        s.pnl >= 0 ? "text-emerald-500" : "text-rose-500"
                      }`}
                    >
                      {formatCurrency(s.pnl)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── ROW 5: Trading Calendar & Day Trades Inspector (Matches Screenshot 2 & 3) ── */}
      <div className="rounded-3xl bg-white dark:bg-[#12151e]/85 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] p-6 mb-6">
        {/* Calendar Header with Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <CalendarIcon className="w-4 h-4 text-blue-500" />
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Trading Calendar
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Daily P&L heatmap — click a day to see its trades
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
            </button>
            <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200 min-w-[130px] text-center">
              {monthNames[calendarMonth]} {calendarYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
            </button>
          </div>
        </div>

        {/* 2-Column Split: Calendar Grid on Left, Day Trades Inspector on Right */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Calendar Grid (3 columns on XL) */}
          <div className="xl:col-span-3 overflow-x-auto">
            {/* Header row: MON to SUN + WEEKLY */}
            <div className="grid grid-cols-8 gap-2 mb-2 text-center text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider min-w-[560px]">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
              <span className="text-blue-500 dark:text-blue-400">Weekly</span>
            </div>

            {/* Weeks */}
            <div className="space-y-2 min-w-[560px]">
              {calendarData.map((week, wIdx) => (
                <div key={wIdx} className="grid grid-cols-8 gap-2">
                  {week.days.map((cell, dIdx) => {
                    if (!cell) {
                      return (
                        <div
                          key={`empty-${dIdx}`}
                          className="min-h-[64px] rounded-2xl bg-neutral-50/50 dark:bg-white/[0.01] border border-dashed border-black/[0.03] dark:border-white/[0.03]"
                        />
                      );
                    }

                    const hasTrades = Boolean(cell.dayData && cell.dayData.count > 0);
                    const pnl = cell.dayData?.pnl || 0;
                    const isSelected = selectedDateStr === cell.dateStr;

                    return (
                      <div
                        key={cell.dateStr}
                        onClick={() => setSelectedDateStr(cell.dateStr)}
                        className={`min-h-[64px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? "ring-2 ring-blue-500 border-blue-500 bg-blue-50/40 dark:bg-blue-500/10 shadow-md"
                            : hasTrades
                            ? pnl > 0
                              ? "bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/30 hover:border-emerald-500"
                              : pnl < 0
                              ? "bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/30 hover:border-rose-500"
                              : "bg-neutral-100 dark:bg-neutral-800/60 border-neutral-300 dark:border-neutral-700"
                            : "bg-neutral-50/80 dark:bg-white/[0.02] border-black/[0.04] dark:border-white/[0.05] hover:bg-black/[0.02] dark:hover:bg-white/[0.04]"
                        }`}
                      >
                        <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                          {cell.dayNum}
                        </span>

                        {hasTrades && (
                          <div className="mt-1">
                            <span
                              className={`text-[11px] font-bold block ${
                                pnl > 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : pnl < 0
                                  ? "text-rose-600 dark:text-rose-400"
                                  : "text-neutral-500"
                              }`}
                            >
                              {formatCurrency(pnl, "$", false)}
                            </span>
                            <span className="text-[9px] text-neutral-400">
                              {cell.dayData.count}t
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* 8th Column: Weekly Summary */}
                  <div className="min-h-[64px] p-2 rounded-2xl bg-neutral-100/70 dark:bg-neutral-800/40 border border-black/[0.05] dark:border-white/[0.06] flex flex-col justify-center items-center text-center">
                    <span className="text-[9px] uppercase font-bold text-neutral-400">
                      Weekly
                    </span>
                    <span
                      className={`text-xs font-extrabold mt-0.5 ${
                        week.weeklyPnL > 0
                          ? "text-emerald-500"
                          : week.weeklyPnL < 0
                          ? "text-rose-500"
                          : "text-neutral-700 dark:text-neutral-300"
                      }`}
                    >
                      {formatCurrency(week.weeklyPnL)}
                    </span>
                    <span className="text-[9px] text-neutral-400">
                      {week.activeDays} days
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 mt-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.05] text-xs text-neutral-500">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Profitable Day</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Losing Day</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                <span>No Trades</span>
              </div>
            </div>
          </div>

          {/* Right Side Panel: Day Trades Inspector */}
          <div className="xl:col-span-1 rounded-2xl bg-neutral-50 dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.06] p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-black/[0.05] dark:border-white/[0.06]">
              <FileText className="w-4 h-4 text-blue-500" />
              <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                {selectedDateStr ? `Trades: ${selectedDateStr}` : "Day Trades"}
              </h4>
            </div>

            {selectedDayTrades.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
                <CalendarIcon className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mb-2" />
                <p className="text-xs text-neutral-400 dark:text-neutral-500 max-w-[180px]">
                  {selectedDateStr
                    ? "No trades recorded on this date."
                    : "Click on a day with trades to view details"}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {selectedDayTrades.map((t, idx) => {
                  const pnl = getTradePnL(t);
                  return (
                    <div
                      key={t.id || idx}
                      className="p-3 rounded-xl bg-white dark:bg-[#161a24] border border-black/[0.05] dark:border-white/[0.06] shadow-sm text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-neutral-900 dark:text-white">
                          {t.asset}
                        </span>
                        <span
                          className={`font-bold ${
                            pnl >= 0 ? "text-emerald-500" : "text-rose-500"
                          }`}
                        >
                          {formatCurrency(pnl)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            t.direction === "LONG"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {t.direction}
                        </span>
                        <span>{t.time || t.entry_time || "00:00"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── ROW 6: Your Stats Institutional Table (Matches Screenshot 3 & 4) ── */}
      <div className="rounded-3xl bg-white dark:bg-[#12151e]/85 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Your Stats
            </h3>
          </div>
          <span className="px-3 py-1 rounded-xl bg-neutral-100 dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/[0.08] text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
            {timePeriod}
          </span>
        </div>

        {/* 3 Highlight Banners */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-6 border-b border-black/[0.05] dark:border-white/[0.06] mb-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1">
              Best Month
            </span>
            <span className="text-lg font-bold text-neutral-900 dark:text-white">
              {metrics.bestMonth || "—"}
            </span>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              {metrics.bestMonth ? "Top performing month" : "No data"}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1">
              Worst Month
            </span>
            <span className="text-lg font-bold text-neutral-900 dark:text-white">
              {metrics.worstMonth || "—"}
            </span>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              {metrics.worstMonth ? "Lowest performing month" : "No data"}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1">
              Average
            </span>
            <span className="text-lg font-bold text-neutral-900 dark:text-white">
              {formatCurrency(metrics.avgPerMonth)}
            </span>
            <p className="text-[11px] text-neutral-400 mt-0.5">per Month</p>
          </div>
        </div>

        {/* 2-Column Institutional Stats Table (All 32 Statistics from Screenshot 3 & 4) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 divide-y md:divide-y-0 divide-black/[0.05] dark:divide-white/[0.06]">
          {/* Column 1 */}
          <div className="space-y-3">
            {[
              { label: "Total P&L", val: formatCurrency(metrics.totalPnL) },
              { label: "Average daily volume", val: metrics.averageDailyVolume.toFixed(2) },
              { label: "Average winning trade", val: formatCurrency(metrics.avgWinner) },
              { label: "Average losing trade", val: formatCurrency(metrics.avgLoser) },
              { label: "Total number of trades", val: metrics.closedTradesCount },
              { label: "Number of winning trades", val: metrics.winCount },
              { label: "Number of losing trades", val: metrics.lossCount },
              { label: "Number of break even trades", val: metrics.beCount },
              { label: "Max consecutive wins", val: metrics.maxWinStreak },
              { label: "Max consecutive losses", val: metrics.maxLossStreak },
              { label: "Total commissions", val: formatCurrency(metrics.totalCommissions) },
              { label: "Total swap", val: formatCurrency(metrics.totalSwap) },
              { label: "Largest profit", val: formatCurrency(metrics.largestProfit) },
              { label: "Largest loss", val: formatCurrency(metrics.largestLoss) },
              { label: "Avg hold time (All)", val: formatHoldDuration(metrics.avgHoldTimeAll) },
              { label: "Avg hold time (Winners)", val: formatHoldDuration(metrics.avgHoldTimeWins) },
              { label: "Avg hold time (Losers)", val: formatHoldDuration(metrics.avgHoldTimeLosses) },
            ].map((row, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-1.5 text-xs border-b border-black/[0.03] dark:border-white/[0.04]"
              >
                <span className="text-neutral-600 dark:text-neutral-400">{row.label}</span>
                <span className="font-bold text-neutral-900 dark:text-white font-mono">{row.val}</span>
              </div>
            ))}
          </div>

          {/* Column 2 */}
          <div className="space-y-3 pt-3 md:pt-0">
            {[
              { label: "Open trades", val: metrics.openTradesCount },
              { label: "Total trading days", val: metrics.totalTradingDays },
              { label: "Winning days", val: metrics.winningDaysCount },
              { label: "Losing days", val: metrics.losingDaysCount },
              { label: "Breakeven days", val: metrics.breakevenDaysCount },
              { label: "Max consecutive winning days", val: metrics.maxConsecutiveWinningDays },
              { label: "Max consecutive losing days", val: metrics.maxConsecutiveLosingDays },
              { label: "Average daily P&L", val: formatCurrency(metrics.avgDailyPnL) },
              { label: "Average winning day P&L", val: formatCurrency(metrics.avgWinningDayPnL) },
              { label: "Average losing day P&L", val: formatCurrency(metrics.avgLosingDayPnL) },
              { label: "Largest profitable day", val: formatCurrency(metrics.largestProfitableDay) },
              { label: "Largest losing day", val: formatCurrency(metrics.largestLosingDay) },
              { label: "Trade expectancy", val: formatCurrency(metrics.expectancy) },
              { label: "Max drawdown", val: formatCurrency(metrics.maxDrawdown) },
              { label: "Max drawdown %", val: `${metrics.maxDrawdownPct.toFixed(1)}%` },
            ].map((row, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-1.5 text-xs border-b border-black/[0.03] dark:border-white/[0.04]"
              >
                <span className="text-neutral-600 dark:text-neutral-400">{row.label}</span>
                <span className="font-bold text-neutral-900 dark:text-white font-mono">{row.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ROW 7: Integrated Labs (Strategy Analytics, Psychology Lab, Mistake Lab Intelligence) ── */}
      <div className="rounded-3xl bg-white dark:bg-[#12151e]/85 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div className="flex items-center gap-2.5">
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
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Discipline: {metrics.mistakes.ruleAdherenceRate.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* 3 Core Labs Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* LAB 1: Strategy Analytics */}
          <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.05] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-black/[0.04] dark:border-white/[0.05]">
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-emerald-500" /> Strategy Edge
                </span>
                <span className="text-[10px] font-medium text-neutral-400">
                  {metrics.setupInsights.length} Setups
                </span>
              </div>

              {metrics.setupInsights.length === 0 ? (
                <p className="text-xs text-neutral-400 py-6 text-center">No setup data logged</p>
              ) : (
                <div className="space-y-2.5">
                  {metrics.setupInsights.slice(0, 4).map((s) => (
                    <div key={s.name} className="flex items-center justify-between text-xs p-2 rounded-xl bg-white/70 dark:bg-white/[0.02] border border-black/[0.03] dark:border-white/[0.03]">
                      <div className="truncate max-w-[110px]">
                        <p className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">{s.name}</p>
                        <p className="text-[10px] text-neutral-400">{s.count} trades • {s.r > 0 ? `+${s.r}R` : `${s.r}R`}</p>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold font-mono ${s.pnl >= 0 ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}`}>
                          {formatCurrency(s.pnl)}
                        </span>
                        <p className="text-[10px] font-medium text-neutral-400">{s.winRate.toFixed(0)}% Win Rate</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Session Breakdown Mini Bar */}
            {metrics.sessionInsights && metrics.sessionInsights.length > 0 && (
              <div className="mt-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.05]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">Session Edge</p>
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  {metrics.sessionInsights.slice(0, 3).map((sess) => (
                    <div key={sess.name} className="p-1.5 rounded-lg bg-white/80 dark:bg-white/[0.02] border border-black/[0.02] dark:border-white/[0.04]">
                      <p className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300 truncate">{sess.name}</p>
                      <p className={`text-[10px] font-mono font-bold ${sess.pnl >= 0 ? "text-emerald-500" : "text-rose-500"}`}>{formatCurrency(sess.pnl)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* LAB 2: Psychology Lab */}
          <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.05] flex flex-col justify-between">
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
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Rules Followed</p>
                  <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                    {formatCurrency(metrics.rulesFollowed?.pnl || 0)}
                  </p>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {metrics.rulesFollowed?.count || 0} trades • {(metrics.rulesFollowed?.winRate || 0).toFixed(0)}% WR
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-500/[0.06] border border-rose-500/20 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Rules Broken</p>
                  <p className="text-base font-extrabold text-rose-600 dark:text-rose-400 font-mono mt-0.5">
                    {formatCurrency(metrics.rulesBroken?.pnl || 0)}
                  </p>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {metrics.rulesBroken?.count || 0} trades • {(metrics.rulesBroken?.winRate || 0).toFixed(0)}% WR
                  </p>
                </div>
              </div>

              {/* Emotions Tag Feed */}
              {metrics.emotionInsights && metrics.emotionInsights.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Pre-Trade Emotional States</p>
                  {metrics.emotionInsights.slice(0, 3).map((e) => (
                    <div key={e.name} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white/70 dark:bg-white/[0.02]">
                      <span className="font-medium text-neutral-700 dark:text-neutral-300">{e.name}</span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-[10px] text-neutral-400">{e.count}t</span>
                        <span className={`font-bold ${e.pnl >= 0 ? "text-emerald-500" : "text-rose-500"}`}>{formatCurrency(e.pnl)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* LAB 3: Mistake Lab */}
          <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.05] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-black/[0.04] dark:border-white/[0.05]">
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-500" /> Mistake Lab
                </span>
                <span className="text-[10px] font-bold text-rose-500">
                  {metrics.mistakes.unforcedErrorsCount} Breaches
                </span>
              </div>

              <div className="space-y-2 text-xs mb-3.5">
                <div className="flex items-center justify-between p-2 rounded-xl bg-white/70 dark:bg-white/[0.02] border border-black/[0.03] dark:border-white/[0.03]">
                  <span className="text-neutral-600 dark:text-neutral-400">Rule Adherence Rate</span>
                  <span className="font-bold text-emerald-500 font-mono">
                    {metrics.mistakes.ruleAdherenceRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white/70 dark:bg-white/[0.02] border border-black/[0.03] dark:border-white/[0.03]">
                  <span className="text-neutral-600 dark:text-neutral-400">Capital Leak to Mistakes</span>
                  <span className="font-bold text-rose-500 font-mono">
                    {formatCurrency(-metrics.mistakes.costOfMistakes)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white/70 dark:bg-white/[0.02] border border-black/[0.03] dark:border-white/[0.03]">
                  <span className="text-neutral-600 dark:text-neutral-400">Total R Drag</span>
                  <span className="font-bold text-rose-500 font-mono">
                    -{Math.abs(metrics.mistakes.costOfMistakesR || 0).toFixed(1)}R
                  </span>
                </div>
              </div>

              {/* Mistake Audit Feed */}
              {metrics.mistakes.unforcedErrors && metrics.mistakes.unforcedErrors.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">Recent Unforced Errors</p>
                  <div className="space-y-1.5">
                    {metrics.mistakes.unforcedErrors.slice(0, 2).map((err, i) => (
                      <div key={i} className="p-2 rounded-xl bg-rose-500/[0.04] border border-rose-500/10 text-[11px]">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-bold text-rose-600 dark:text-rose-400">{err.setup || "Discretionary"}</span>
                          <span className="font-mono text-rose-500 font-bold">{formatCurrency(err.pnl)}</span>
                        </div>
                        {err.reason && <p className="text-neutral-500 dark:text-neutral-400 truncate">Why: {err.reason}</p>}
                        {err.lesson && <p className="text-neutral-600 dark:text-neutral-300 font-medium truncate">Fix: {err.lesson}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── High Performance Pure SVG Curve Renderer ──
function EquityCurveSVG({ points, mode, onHover }) {
  const svgRef = useRef(null);

  if (!points || points.length === 0) return null;

  const values = points.map((p) => (mode === "equity" ? p.equity : p.drawdown));
  const minVal = Math.min(0, ...values);
  const maxVal = Math.max(10, ...values);
  const range = maxVal - minVal || 1;

  const width = 800;
  const height = 240;
  const padTop = 20;
  const padBottom = 30;
  const chartH = height - padTop - padBottom;

  const coords = points.map((p, idx) => {
    const v = mode === "equity" ? p.equity : p.drawdown;
    const x = (idx / (points.length - 1 || 1)) * width;
    const y = padTop + chartH - ((v - minVal) / range) * chartH;
    return { x, y, val: v, date: p.date, trade: p.trade };
  });

  const pathD = coords.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, "");

  // Area path closing to bottom or zero
  const zeroY = padTop + chartH - ((0 - minVal) / range) * chartH;
  const areaD = `${pathD} L ${width} ${zeroY} L 0 ${zeroY} Z`;

  const handleMouseMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const xPct = (mouseX / rect.width) * 100;

    // Find closest point
    let closest = coords[0];
    let minDiff = Infinity;
    coords.forEach((c) => {
      const cPct = (c.x / width) * 100;
      const diff = Math.abs(cPct - xPct);
      if (diff < minDiff) {
        minDiff = diff;
        closest = c;
      }
    });

    onHover({
      ...closest,
      xPct: (closest.x / width) * 100,
      yPct: (closest.y / height) * 100,
    });
  };

  const isNetPositive = coords[coords.length - 1]?.val >= 0;

  return (
    <div
      className="w-full h-full relative"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => onHover(null)}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor={isNetPositive ? "#10B981" : "#EF4444"}
              stopOpacity="0.25"
            />
            <stop
              offset="100%"
              stopColor={isNetPositive ? "#10B981" : "#EF4444"}
              stopOpacity="0.0"
            />
          </linearGradient>
        </defs>

        {/* Zero Guideline */}
        <line
          x1="0"
          y1={zeroY}
          x2={width}
          y2={zeroY}
          stroke="currentColor"
          className="text-neutral-300 dark:text-neutral-700 stroke-dasharray-[4_4]"
          strokeWidth="1"
          strokeDasharray="4 4"
        />

        {/* Gradient Area Fill */}
        <path d={areaD} fill="url(#equityGrad)" />

        {/* Solid Line Curve */}
        <path
          d={pathD}
          fill="none"
          stroke={isNetPositive ? "#10B981" : "#EF4444"}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Interactive Dots */}
        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r="3"
            className="fill-white dark:fill-[#12151e] stroke-emerald-500 hover:r-5 transition-all"
            strokeWidth="2"
          />
        ))}
      </svg>
    </div>
  );
}
