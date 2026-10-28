// frontend/src/pages/TradeAnalysis.jsx
// Trade Analysis page displaying user-logged trades from /add-trade with rich filters
// macOS / iOS Frosted Bento UI theme with responsive dark/light mode

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import AppleSelect from "../components/ui/AppleSelect";
import {
  FileText,
  Search,
  Filter,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  Brain,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  RefreshCw,
} from "lucide-react";
import {
  formatCurrency,
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

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("All Accounts");
  const [selectedDirection, setSelectedDirection] = useState("All");
  const [selectedOutcome, setSelectedOutcome] = useState("All");
  const [selectedSetup, setSelectedSetup] = useState("All Setups");
  const [selectedSession, setSelectedSession] = useState("All Sessions");
  const [selectedTimeRange, setSelectedTimeRange] = useState("All Time");

  // Inspection Modal
  const [inspectedTrade, setInspectedTrade] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const fetchTrades = async () => {
    setLoading(true);
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

  useEffect(() => {
    fetchTrades();
  }, [navigate]);

  // Options for AppleSelect filters
  const accountOptions = useMemo(() => {
    const accs = new Set();
    allTrades.forEach((t) => {
      if (t.account_name) accs.add(t.account_name);
    });
    return [
      { value: "All Accounts", label: "All Accounts" },
      ...Array.from(accs).map((a) => ({ value: a, label: a })),
    ];
  }, [allTrades]);

  const setupOptions = useMemo(() => {
    const s = new Set();
    allTrades.forEach((t) => {
      if (t.setup) s.add(t.setup);
    });
    return [
      { value: "All Setups", label: "All Setups" },
      ...Array.from(s).map((val) => ({ value: val, label: val })),
    ];
  }, [allTrades]);

  const sessionOptions = [
    { value: "All Sessions", label: "All Sessions" },
    { value: "Asian", label: "Asian Session" },
    { value: "London", label: "London Session" },
    { value: "New York", label: "New York Session" },
  ];

  const directionOptions = [
    { value: "All", label: "All Directions" },
    { value: "LONG", label: "Long Only" },
    { value: "SHORT", label: "Short Only" },
  ];

  const outcomeOptions = [
    { value: "All", label: "All Outcomes" },
    { value: "WIN", label: "Wins" },
    { value: "LOSS", label: "Losses" },
    { value: "BE", label: "Break Even" },
  ];

  const timeRangeOptions = [
    { value: "All Time", label: "All Time" },
    { value: "Today", label: "Today" },
    { value: "7 Days", label: "Last 7 Days" },
    { value: "30 Days", label: "Last 30 Days" },
    { value: "3 Months", label: "Last 3 Months" },
    { value: "1 Year", label: "Last 1 Year" },
  ];

  // Filter application
  const filteredTrades = useMemo(() => {
    let list = allTrades;

    if (selectedAccount !== "All Accounts") {
      list = list.filter((t) => t.account_name === selectedAccount);
    }

    if (selectedDirection !== "All") {
      list = list.filter((t) => (t.direction || "").toUpperCase() === selectedDirection);
    }

    if (selectedOutcome !== "All") {
      if (selectedOutcome === "WIN") list = list.filter(isTradeWin);
      else if (selectedOutcome === "LOSS") list = list.filter(isTradeLoss);
      else if (selectedOutcome === "BE") list = list.filter(isTradeBE);
    }

    if (selectedSetup !== "All Setups") {
      list = list.filter((t) => t.setup === selectedSetup);
    }

    if (selectedSession !== "All Sessions") {
      list = list.filter((t) => (t.session || "").toLowerCase().includes(selectedSession.toLowerCase()));
    }

    list = filterTradesByTimePeriod(list, selectedTimeRange);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          (t.asset && t.asset.toLowerCase().includes(q)) ||
          (t.setup && t.setup.toLowerCase().includes(q)) ||
          (t.reason && t.reason.toLowerCase().includes(q)) ||
          (t.lesson && t.lesson.toLowerCase().includes(q)) ||
          (t.account_name && t.account_name.toLowerCase().includes(q))
      );
    }

    return list;
  }, [
    allTrades,
    selectedAccount,
    selectedDirection,
    selectedOutcome,
    selectedSetup,
    selectedSession,
    selectedTimeRange,
    searchQuery,
  ]);

  // Filtered KPI summaries
  const summary = useMemo(() => {
    const total = filteredTrades.length;
    let netPnL = 0;
    let grossProfit = 0;
    let grossLoss = 0;
    let wins = 0;
    let losses = 0;
    let totalLots = 0;

    filteredTrades.forEach((t) => {
      const p = getTradePnL(t);
      netPnL += p;
      if (p > 0) {
        grossProfit += p;
        wins++;
      } else if (p < 0) {
        grossLoss += p;
        losses++;
      }
      const lots = Number(t.lot_size) || 0;
      totalLots += lots;
    });

    const winRate = total > 0 ? (wins / total) * 100 : 0;
    const profitFactor = Math.abs(grossLoss) > 0 ? grossProfit / Math.abs(grossLoss) : grossProfit > 0 ? 99.99 : 0;

    return {
      total,
      netPnL,
      winRate,
      wins,
      losses,
      profitFactor,
      totalLots,
      avgPnL: total > 0 ? netPnL / total : 0,
    };
  }, [filteredTrades]);

  // Paginated trades
  const totalPages = Math.ceil(filteredTrades.length / itemsPerPage) || 1;
  const paginatedTrades = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTrades.slice(start, start + itemsPerPage);
  }, [filteredTrades, currentPage]);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans transition-colors duration-300">
      {/* ── Top Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-sm">
            <FileText className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Trade Analysis
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Deep execution log, filtered metrics & performance inspector
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/add-trade")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs shadow-md shadow-emerald-500/25 active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Trade</span>
          </button>
        </div>
      </div>

      {/* ── Summary Counters Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Trades Logged", val: summary.total, sub: `${summary.wins}W • ${summary.losses}L` },
          { label: "Win Rate", val: `${summary.winRate.toFixed(1)}%`, sub: "Filtered Trades" },
          {
            label: "Net Realized P&L",
            val: formatCurrency(summary.netPnL),
            sub: summary.netPnL >= 0 ? "Profitable" : "Drawdown",
            color: summary.netPnL >= 0 ? "text-emerald-500" : "text-rose-500",
          },
          {
            label: "Profit Factor",
            val: summary.profitFactor === 99.99 ? "∞" : summary.profitFactor.toFixed(2),
            sub: summary.profitFactor >= 1.5 ? "Solid Edge" : "Review Setups",
          },
          { label: "Avg Trade P&L", val: formatCurrency(summary.avgPnL), sub: "Per closed trade" },
          { label: "Total Volume", val: `${summary.totalLots.toFixed(2)} lots`, sub: "Execution size" },
        ].map((item, i) => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-white dark:bg-[#12151e]/85 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-sm flex flex-col justify-between"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              {item.label}
            </span>
            <span className={`text-lg font-extrabold tracking-tight mt-1 truncate ${item.color || "text-neutral-900 dark:text-white"}`}>
              {item.val}
            </span>
            <span className="text-[10px] text-neutral-400 mt-1">{item.sub}</span>
          </div>
        ))}
      </div>

      {/* ── Filter Controls Bar ── */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#12151e]/85 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-sm mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search symbol, setup..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-neutral-100 dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.08] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Account Filter */}
          <AppleSelect
            value={selectedAccount}
            onChange={setSelectedAccount}
            options={accountOptions}
            placeholder="Account"
          />

          {/* Direction Filter */}
          <AppleSelect
            value={selectedDirection}
            onChange={setSelectedDirection}
            options={directionOptions}
            placeholder="Direction"
          />

          {/* Outcome Filter */}
          <AppleSelect
            value={selectedOutcome}
            onChange={setSelectedOutcome}
            options={outcomeOptions}
            placeholder="Outcome"
          />

          {/* Setup Filter */}
          <AppleSelect
            value={selectedSetup}
            onChange={setSelectedSetup}
            options={setupOptions}
            placeholder="Setup"
          />

          {/* Time Range Filter */}
          <AppleSelect
            value={selectedTimeRange}
            onChange={setSelectedTimeRange}
            options={timeRangeOptions}
            placeholder="Time Range"
          />
        </div>
      </div>

      {/* ── Trade Log Table ── */}
      <div className="rounded-3xl bg-white dark:bg-[#12151e]/85 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] overflow-hidden">
        {filteredTrades.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center px-4">
            <FileText className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mb-3" />
            <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-200 mb-1">
              No trades found
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mb-5">
              {allTrades.length === 0
                ? "You haven't logged any trades yet. Log your first trade via /add-trade to unlock Trade Analysis."
                : "No trades match the current filter selection. Try adjusting or resetting your filters."}
            </p>
            {allTrades.length === 0 ? (
              <button
                onClick={() => navigate("/add-trade")}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-all"
              >
                Log First Trade
              </button>
            ) : (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedAccount("All Accounts");
                  setSelectedDirection("All");
                  setSelectedOutcome("All");
                  setSelectedSetup("All Setups");
                  setSelectedSession("All Sessions");
                  setSelectedTimeRange("All Time");
                }}
                className="px-4 py-2 rounded-xl bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold text-xs transition-all"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-white/[0.02] border-b border-black/[0.05] dark:border-white/[0.06] text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                <tr>
                  <th className="py-3.5 px-4">Date / Time</th>
                  <th className="py-3.5 px-4">Symbol</th>
                  <th className="py-3.5 px-4">Direction</th>
                  <th className="py-3.5 px-4">Entry / Exit</th>
                  <th className="py-3.5 px-4">Lot Size</th>
                  <th className="py-3.5 px-4">R-Multiple</th>
                  <th className="py-3.5 px-4">Realized P&L</th>
                  <th className="py-3.5 px-4">Setup</th>
                  <th className="py-3.5 px-4">Rules</th>
                  <th className="py-3.5 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                {paginatedTrades.map((t) => {
                  const pnl = getTradePnL(t);
                  const r = normalizeTradeR(t);
                  const isWin = isTradeWin(t);
                  const isLoss = isTradeLoss(t);
                  const ruleFollowed = (t.rule_break || "").toLowerCase() !== "yes";

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-black/[0.015] dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
                      onClick={() => setInspectedTrade(t)}
                    >
                      {/* Date */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-semibold text-neutral-900 dark:text-white block">
                          {t.date || t.entry_date || "—"}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          {t.time || t.entry_time || "00:00"}
                        </span>
                      </td>

                      {/* Symbol */}
                      <td className="py-3 px-4 font-bold text-neutral-900 dark:text-white whitespace-nowrap">
                        {t.asset}
                      </td>

                      {/* Direction */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            t.direction === "LONG"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {t.direction === "LONG" ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          {t.direction}
                        </span>
                      </td>

                      {/* Entry / Exit */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">
                        <span className="text-neutral-700 dark:text-neutral-300">{t.entry ?? "—"}</span>
                        <span className="text-neutral-400 mx-1">→</span>
                        <span className="text-neutral-500">{t.exit_price ?? t.tp ?? "—"}</span>
                      </td>

                      {/* Lot Size */}
                      <td className="py-3 px-4 font-mono text-[11px] text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                        {t.lot_size ?? (t.executions?.[0]?.lot_size ?? "—")}
                      </td>

                      {/* R-Multiple */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] font-semibold">
                        <span className={r > 0 ? "text-emerald-500" : r < 0 ? "text-rose-500" : "text-neutral-400"}>
                          {r > 0 ? `+${r.toFixed(2)}R` : `${r.toFixed(2)}R`}
                        </span>
                      </td>

                      {/* Realized PnL */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] font-bold">
                        <span className={pnl > 0 ? "text-emerald-500" : pnl < 0 ? "text-rose-500" : "text-neutral-400"}>
                          {formatCurrency(pnl)}
                        </span>
                      </td>

                      {/* Setup */}
                      <td className="py-3 px-4 whitespace-nowrap text-neutral-600 dark:text-neutral-400">
                        {t.setup || "Discretionary"}
                      </td>

                      {/* Rule adherence */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {ruleFollowed ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            <Check className="w-3.5 h-3.5" /> Adhered
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-rose-500 font-semibold">
                            <AlertTriangle className="w-3.5 h-3.5" /> Broken
                          </span>
                        )}
                      </td>

                      {/* Inspect */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectedTrade(t);
                          }}
                          className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                          title="Inspect trade details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Strip */}
        {filteredTrades.length > itemsPerPage && (
          <div className="px-6 py-4 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between text-xs text-neutral-500">
            <span>
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredTrades.length)} of{" "}
              {filteredTrades.length} trades
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1 rounded-lg border border-black/[0.06] dark:border-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Previous
              </button>
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1 rounded-lg border border-black/[0.06] dark:border-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Apple-Style Trade Detail Inspector Modal ── */}
      {inspectedTrade && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setInspectedTrade(null)}
        >
          <div
            className="w-full max-w-xl rounded-3xl bg-white dark:bg-[#121622] border border-black/[0.08] dark:border-white/[0.12] shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
                    inspectedTrade.direction === "LONG"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {inspectedTrade.direction === "LONG" ? (
                    <ArrowUpRight className="w-5 h-5" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                    {inspectedTrade.asset} • {inspectedTrade.direction}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {inspectedTrade.date || inspectedTrade.entry_date} at{" "}
                    {inspectedTrade.time || inspectedTrade.entry_time || "00:00"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInspectedTrade(null)}
                className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-5 space-y-5 text-xs">
              {/* Financial Outcome Banner */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                    Realized P&L
                  </span>
                  <span
                    className={`text-2xl font-black ${
                      getTradePnL(inspectedTrade) >= 0 ? "text-emerald-500" : "text-rose-500"
                    }`}
                  >
                    {formatCurrency(getTradePnL(inspectedTrade))}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                    R-Multiple
                  </span>
                  <span className="text-lg font-bold font-mono text-neutral-900 dark:text-white">
                    {normalizeTradeR(inspectedTrade) > 0
                      ? `+${normalizeTradeR(inspectedTrade).toFixed(2)}R`
                      : `${normalizeTradeR(inspectedTrade).toFixed(2)}R`}
                  </span>
                </div>
              </div>

              {/* Price Details Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05]">
                  <span className="text-[10px] uppercase text-neutral-400 block">Entry</span>
                  <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                    {inspectedTrade.entry ?? "—"}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05]">
                  <span className="text-[10px] uppercase text-neutral-400 block">Stop Loss</span>
                  <span className="font-mono font-bold text-rose-500">
                    {inspectedTrade.sl ?? "—"}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05]">
                  <span className="text-[10px] uppercase text-neutral-400 block">Take Profit</span>
                  <span className="font-mono font-bold text-emerald-500">
                    {inspectedTrade.tp ?? "—"}
                  </span>
                </div>
              </div>

              {/* Strategy & Context */}
              <div className="space-y-2">
                <div className="flex items-center justify-between py-1 border-b border-black/[0.04] dark:border-white/[0.04]">
                  <span className="text-neutral-500">Setup</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    {inspectedTrade.setup || "Discretionary"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-black/[0.04] dark:border-white/[0.04]">
                  <span className="text-neutral-500">Session</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    {inspectedTrade.session || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-black/[0.04] dark:border-white/[0.04]">
                  <span className="text-neutral-500">Account</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    {inspectedTrade.account_name || "Default Account"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-black/[0.04] dark:border-white/[0.04]">
                  <span className="text-neutral-500">Rule Adherence</span>
                  <span
                    className={`font-semibold ${
                      (inspectedTrade.rule_break || "").toLowerCase() === "yes"
                        ? "text-rose-500"
                        : "text-emerald-500"
                    }`}
                  >
                    {(inspectedTrade.rule_break || "").toLowerCase() === "yes"
                      ? "Rule Broken"
                      : "Rules Followed"}
                  </span>
                </div>
              </div>

              {/* Trade Notes / Reason & Lesson */}
              {(inspectedTrade.reason || inspectedTrade.lesson) && (
                <div className="space-y-3 pt-2">
                  {inspectedTrade.reason && (
                    <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                      <span className="text-[10px] uppercase font-bold text-blue-500 block mb-1">
                        Entry Catalyst / Reason
                      </span>
                      <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                        {inspectedTrade.reason}
                      </p>
                    </div>
                  )}
                  {inspectedTrade.lesson && (
                    <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                      <span className="text-[10px] uppercase font-bold text-amber-500 block mb-1">
                        Lesson Learned
                      </span>
                      <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                        {inspectedTrade.lesson}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Chart Screenshots if any */}
              {inspectedTrade.images && inspectedTrade.images.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-2">
                    Execution Screenshots
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {inspectedTrade.images.map((img, i) => (
                      <a
                        key={i}
                        href={img}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl overflow-hidden border border-black/[0.05] dark:border-white/[0.08] hover:opacity-90 transition-opacity"
                      >
                        <img src={img} alt={`Trade ${i + 1}`} className="w-full h-32 object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
