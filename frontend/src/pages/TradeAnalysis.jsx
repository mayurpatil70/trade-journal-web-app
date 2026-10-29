// frontend/src/pages/TradeAnalysis.jsx
// TradeFXBook Trade Analysis Split-Pane Master-Detail View
// Pixel-accurate replication with macOS / iOS Apple frosted-glass theme

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import AppleSelect from "../components/ui/AppleSelect";
import {
  Activity,
  Search,
  Calendar,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  X,
  Target,
  Brain,
  ShieldCheck,
  Clock,
  Layers,
  FileText,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  PlusCircle,
} from "lucide-react";
import {
  formatCurrency,
  formatHoldDuration,
  getTradePnL,
  normalizeTradeR,
  isTradeWin,
  isTradeLoss,
  isTradeBE,
  filterTradesByTimePeriod,
} from "../utils/performanceMetrics";

export default function TradeAnalysis() {
  const navigate = useNavigate();
  const [allTrades, setAllTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters matching screenshot
  const [outcomeTab, setOutcomeTab] = useState("all"); // "all" | "winners" | "losers" | "be"
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState("This Month"); // "Today", "This Week", "This Month", "Last Month", "3 Months", "1 Year", "All Time"
  const [sortBy, setSortBy] = useState("Date"); // "Date", "P&L", "R-Multiple", "Symbol"

  // Selected trade for the right pane
  const [selectedTradeId, setSelectedTradeId] = useState(null);

  // Image lightbox
  const [lightboxImage, setLightboxImage] = useState(null);

  // Fetch trades
  useEffect(() => {
    const fetchTrades = async () => {
      const userId = localStorage.getItem("userId") || localStorage.getItem("userEmail");
      if (!userId) return navigate("/login");
      try {
        const response = await api.get(`/api/trades?userId=${userId}`);
        const data = response.data?.data || [];
        setAllTrades(data);
      } catch (error) {
        console.error("Failed to fetch trades for Trade Analysis:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrades();
  }, [navigate]);

  // Current formatted date for top subtitle (matches Screenshot: "Wed, Oct 28")
  const currentDateFormatted = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }, []);

  // Time filter options for AppleSelect
  const timeOptions = [
    { value: "This Month", label: "This Month" },
    { value: "Today", label: "Today" },
    { value: "This Week", label: "This Week" },
    { value: "Last Month", label: "Last Month" },
    { value: "3 Months", label: "3 Months" },
    { value: "1 Year", label: "1 Year" },
    { value: "All Time", label: "All Time" },
  ];

  // Sort options for AppleSelect
  const sortOptions = [
    { value: "Date", label: "Date" },
    { value: "P&L", label: "P&L" },
    { value: "R-Multiple", label: "R-Multiple" },
    { value: "Symbol", label: "Symbol" },
  ];

  // Apply time period filtering
  const timeFilteredTrades = useMemo(() => {
    if (timeFilter === "All Time") return allTrades;

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const filtered = allTrades.filter((t) => {
      const dateStr = t.date || t.entry_date;
      if (!dateStr) return true;
      const tTime = new Date(dateStr).getTime();

      if (timeFilter === "Today") {
        return tTime >= startOfDay;
      }
      if (timeFilter === "This Week") {
        const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek).getTime();
        return tTime >= startOfWeek;
      }
      if (timeFilter === "This Month") {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        return tTime >= startOfMonth;
      }
      if (timeFilter === "Last Month") {
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).getTime();
        return tTime >= startOfLastMonth && tTime <= endOfLastMonth;
      }
      if (timeFilter === "3 Months") {
        const cutoff = now.getTime() - 90 * 24 * 60 * 60 * 1000;
        return tTime >= cutoff;
      }
      if (timeFilter === "1 Year") {
        const cutoff = now.getTime() - 365 * 24 * 60 * 60 * 1000;
        return tTime >= cutoff;
      }
      return true;
    });

    return filtered.length > 0 || allTrades.length === 0 ? filtered : allTrades;
  }, [allTrades, timeFilter]);

  // Counts for top tabs based on time-filtered set
  const counts = useMemo(() => {
    let winCount = 0;
    let lossCount = 0;
    let beCount = 0;

    timeFilteredTrades.forEach((t) => {
      if (isTradeWin(t)) winCount++;
      else if (isTradeLoss(t)) lossCount++;
      else if (isTradeBE(t)) beCount++;
    });

    return {
      all: timeFilteredTrades.length,
      winners: winCount,
      losers: lossCount,
      be: beCount,
    };
  }, [timeFilteredTrades]);

  // Filtered & Sorted trade list for the left sidebar
  const visibleTrades = useMemo(() => {
    let list = timeFilteredTrades;

    // Filter by outcome tab
    if (outcomeTab === "winners") {
      list = list.filter(isTradeWin);
    } else if (outcomeTab === "losers") {
      list = list.filter(isTradeLoss);
    } else if (outcomeTab === "be") {
      list = list.filter(isTradeBE);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          (t.asset && t.asset.toLowerCase().includes(q)) ||
          (t.setup && t.setup.toLowerCase().includes(q)) ||
          (t.reason && t.reason.toLowerCase().includes(q)) ||
          (t.account_name && t.account_name.toLowerCase().includes(q))
      );
    }

    // Sort list
    return [...list].sort((a, b) => {
      if (sortBy === "P&L") {
        return getTradePnL(b) - getTradePnL(a);
      }
      if (sortBy === "R-Multiple") {
        return normalizeTradeR(b) - normalizeTradeR(a);
      }
      if (sortBy === "Symbol") {
        return (a.asset || "").localeCompare(b.asset || "");
      }
      // Default: Date (Newest first)
      const da = new Date(`${a.date || a.entry_date || "2000-01-01"}T${a.time || a.entry_time || "00:00:00"}`).getTime();
      const db = new Date(`${b.date || b.entry_date || "2000-01-01"}T${b.time || b.entry_time || "00:00:00"}`).getTime();
      return db - da;
    });
  }, [timeFilteredTrades, outcomeTab, searchQuery, sortBy]);

  // Selected trade object
  const selectedTrade = useMemo(() => {
    if (!selectedTradeId) return visibleTrades[0] || null;
    return allTrades.find((t) => t.id === selectedTradeId) || visibleTrades[0] || null;
  }, [selectedTradeId, allTrades, visibleTrades]);

  // Auto-sync selectedTradeId if null
  useEffect(() => {
    if (!selectedTradeId && visibleTrades.length > 0) {
      setSelectedTradeId(visibleTrades[0].id);
    }
  }, [selectedTradeId, visibleTrades]);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans transition-colors duration-300">
      {/* ── Page Header (Matches Screenshot) ── */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Trade Analysis
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {currentDateFormatted}
          </p>
        </div>
      </div>

      {/* ── Master-Detail 2-Column Layout (Exact match to Screenshot) ── */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* ── LEFT PANEL: Trade Analysis Master List ── */}
        <div className="w-full md:w-[320px] lg:w-[360px] shrink-0 rounded-3xl bg-white dark:bg-[#12151e]/85 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] p-4 shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] flex flex-col h-[calc(100vh-140px)] min-h-[580px]">
          {/* Card Title */}
          <h2 className="text-sm font-bold text-neutral-900 dark:text-white mb-3 px-1">
            Trade Analysis
          </h2>

          {/* Filter Pills Capsule (All, Winners, Losers, BE) */}
          <div className="p-1 rounded-2xl bg-neutral-100 dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] grid grid-cols-4 gap-1 mb-3">
            {[
              { id: "all", label: "All", count: counts.all },
              { id: "winners", label: "Winners", count: counts.winners },
              { id: "losers", label: "Losers", count: counts.losers },
              { id: "be", label: "BE", count: counts.be },
            ].map((tab) => {
              const active = outcomeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setOutcomeTab(tab.id)}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all duration-150 antialiased select-none cursor-pointer ${
                    active
                      ? "bg-[#007AFF] dark:bg-[#0A84FF] text-white shadow-[0_1px_3px_rgba(0,0,0,0.15)] ring-1 ring-white/20"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1 py-0.2 rounded-full font-bold ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-black/5 dark:bg-white/10 text-neutral-500 dark:text-neutral-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Symbol Input (Matches Screenshot) */}
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-neutral-100 dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.08] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Dropdown Row: [ 📅 This Month ⌵ ] [ ⇅ Date ⌵ ] (Matches Screenshot) */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <AppleSelect
              value={timeFilter}
              onChange={(val) => {
                const f = typeof val === "object" && val !== null ? (val.target?.value ?? val.value ?? String(val)) : String(val);
                setTimeFilter(f);
              }}
              options={timeOptions}
              icon={Calendar}
              compact={true}
              placeholder="Timeframe"
            />
            <AppleSelect
              value={sortBy}
              onChange={(val) => {
                const s = typeof val === "object" && val !== null ? (val.target?.value ?? val.value ?? String(val)) : String(val);
                setSortBy(s);
              }}
              options={sortOptions}
              icon={ArrowUpDown}
              compact={true}
              placeholder="Sort"
            />
          </div>

          {/* Trades Feed (Vertical Scrollable Feed) */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2">
            {visibleTrades.length === 0 ? (
              // Empty State matching screenshot
              <div className="h-full flex flex-col items-center justify-center py-16 text-center">
                <svg
                  className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mb-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
                <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500">
                  No trades found
                </p>
              </div>
            ) : (
              visibleTrades.map((t) => {
                const pnl = getTradePnL(t);
                const r = normalizeTradeR(t);
                const isSelected = selectedTradeId === t.id;

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTradeId(t.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-blue-500 bg-blue-50/70 dark:bg-blue-500/10 shadow-sm"
                        : "border-black/[0.04] dark:border-white/[0.05] bg-neutral-50/50 dark:bg-white/[0.02] hover:bg-black/[0.02] dark:hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-neutral-900 dark:text-white">
                          {t.asset}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
                            t.direction === "LONG"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {t.direction}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-bold font-mono ${
                          pnl > 0
                            ? "text-emerald-500 dark:text-emerald-400"
                            : pnl < 0
                            ? "text-rose-500 dark:text-rose-400"
                            : "text-neutral-500"
                        }`}
                      >
                        {formatCurrency(pnl)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-500">
                      <span>
                        {t.date || t.entry_date}
                        {t.time ? ` • ${t.time}` : ""}
                      </span>
                      <span
                        className={`font-mono font-semibold ${
                          r > 0
                            ? "text-emerald-500 dark:text-emerald-400"
                            : r < 0
                            ? "text-rose-500 dark:text-rose-400"
                            : "text-neutral-400"
                        }`}
                      >
                        {r > 0 ? `+${r.toFixed(2)}R` : `${r.toFixed(2)}R`}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL: Detail Analysis Pane (Matches Screenshot) ── */}
        <div className="flex-1 min-w-0 w-full rounded-3xl bg-white dark:bg-[#12151e]/85 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] p-6 lg:p-8 h-[calc(100vh-140px)] min-h-[580px] overflow-y-auto flex flex-col">
          {!selectedTrade ? (
            // ── EMPTY STATE (Exact match to Screenshot) ──
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              {/* Blue Squircle Icon Container */}
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-5 shadow-sm">
                <svg
                  className="w-8 h-8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
              </div>

              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
                Select a trade to analyze
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm leading-relaxed">
                Choose a trade from the list to view detailed analysis, performance metrics, and insights.
              </p>
            </div>
          ) : (
            // ── SELECTED TRADE DETAIL VIEW ──
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-black/[0.06] dark:border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${
                      selectedTrade.direction === "LONG"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    {selectedTrade.direction === "LONG" ? (
                      <ArrowUpRight className="w-6 h-6" />
                    ) : (
                      <ArrowDownRight className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-neutral-900 dark:text-white">
                        {selectedTrade.asset}
                      </h2>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                          selectedTrade.direction === "LONG"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {selectedTrade.direction}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                          isTradeWin(selectedTrade)
                            ? "bg-emerald-500/10 text-emerald-600"
                            : isTradeLoss(selectedTrade)
                            ? "bg-rose-500/10 text-rose-600"
                            : "bg-neutral-500/10 text-neutral-500"
                        }`}
                      >
                        {selectedTrade.result || "Closed"}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {selectedTrade.date || selectedTrade.entry_date} at{" "}
                      {selectedTrade.time || selectedTrade.entry_time || "00:00"}
                      {selectedTrade.account_name ? ` • ${selectedTrade.account_name}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedTradeId(null)}
                    className="p-2 rounded-xl border border-black/[0.06] dark:border-white/[0.08] hover:bg-black/5 dark:hover:bg-white/5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                    title="Close detail"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 4 Highlight Metrics Bento Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                    Realized P&L
                  </span>
                  <span
                    className={`text-2xl font-extrabold tracking-tight ${
                      getTradePnL(selectedTrade) > 0
                        ? "text-emerald-500 dark:text-emerald-400"
                        : getTradePnL(selectedTrade) < 0
                        ? "text-rose-500 dark:text-rose-400"
                        : "text-neutral-900 dark:text-white"
                    }`}
                  >
                    {formatCurrency(getTradePnL(selectedTrade))}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                    R-Multiple
                  </span>
                  <span className="text-2xl font-extrabold tracking-tight font-mono text-neutral-900 dark:text-white">
                    {normalizeTradeR(selectedTrade) > 0
                      ? `+${normalizeTradeR(selectedTrade).toFixed(2)}R`
                      : `${normalizeTradeR(selectedTrade).toFixed(2)}R`}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                    Lot Size
                  </span>
                  <span className="text-2xl font-extrabold tracking-tight font-mono text-neutral-900 dark:text-white">
                    {selectedTrade.lot_size ?? (selectedTrade.executions?.[0]?.lot_size ?? "1.00")}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                    Risk Amount
                  </span>
                  <span className="text-2xl font-extrabold tracking-tight font-mono text-neutral-900 dark:text-white">
                    {formatCurrency(selectedTrade.risk || 100, "$", false)}
                  </span>
                </div>
              </div>

              {/* Execution & Price Levels Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Price Levels Card */}
                <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06]">
                  <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-3 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-blue-500" /> Price Levels
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-black/[0.03] dark:border-white/[0.04]">
                      <span className="text-neutral-500">Entry Price</span>
                      <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200">
                        {selectedTrade.entry ?? "—"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-black/[0.03] dark:border-white/[0.04]">
                      <span className="text-neutral-500">Stop Loss</span>
                      <span className="font-mono font-semibold text-rose-500">
                        {selectedTrade.sl ?? "—"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-black/[0.03] dark:border-white/[0.04]">
                      <span className="text-neutral-500">Take Profit</span>
                      <span className="font-mono font-semibold text-emerald-500">
                        {selectedTrade.tp ?? "—"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-neutral-500">Exit Price</span>
                      <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200">
                        {selectedTrade.exit_price ?? selectedTrade.tp ?? "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Strategy & Rules Card */}
                <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06]">
                  <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-3 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Strategy & Discipline
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-black/[0.03] dark:border-white/[0.04]">
                      <span className="text-neutral-500">Setup</span>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {selectedTrade.setup || "Discretionary"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-black/[0.03] dark:border-white/[0.04]">
                      <span className="text-neutral-500">Session</span>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {selectedTrade.session || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-black/[0.03] dark:border-white/[0.04]">
                      <span className="text-neutral-500">Rule Adherence</span>
                      <span
                        className={`font-semibold ${
                          (selectedTrade.rule_break || "").toLowerCase() === "yes"
                            ? "text-rose-500"
                            : "text-emerald-500"
                        }`}
                      >
                        {(selectedTrade.rule_break || "").toLowerCase() === "yes"
                          ? "Rule Broken ⚠️"
                          : "Rules Followed ✓"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-neutral-500">Pre-trade Emotion</span>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {selectedTrade.emotion_before || "Calm"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trade Catalyst / Reason & Lessons Learned */}
              {(selectedTrade.reason || selectedTrade.lesson) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedTrade.reason && (
                    <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-500/10">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
                        Entry Catalyst
                      </span>
                      <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                        {selectedTrade.reason}
                      </p>
                    </div>
                  )}

                  {selectedTrade.lesson && (
                    <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-500/5 border border-amber-500/10">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-1">
                        Lessons Learned
                      </span>
                      <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                        {selectedTrade.lesson}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Screenshots Gallery */}
              {selectedTrade.images && selectedTrade.images.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block mb-2">
                    Execution Charts
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedTrade.images.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => setLightboxImage(img)}
                        className="rounded-2xl overflow-hidden border border-black/[0.06] dark:border-white/[0.08] cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        <img
                          src={img}
                          alt={`Execution Chart ${idx + 1}`}
                          className="w-full h-44 object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={lightboxImage}
              alt="Zoomed Chart"
              className="max-h-[85vh] w-auto rounded-2xl object-contain shadow-2xl"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
