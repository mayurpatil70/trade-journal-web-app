// frontend/src/pages/PastTrades.jsx
// TradeFXBook Institutional Trades & Portfolio View
// Faithfully replicates https://app.tradefxbook.com/?view=portfolio

import { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import api from "../api/axios";
import AccountFilter from "../components/AccountFilter";
import AppleSelect from "../components/ui/AppleSelect";
import TradeFXBookAddTradeModal from "../components/dashboard/TradeFXBookAddTradeModal";
import {
  getImmediateCachedTrades,
  getTradesWithCache,
  invalidateTradeCache,
  setCachedTrades,
} from "../utils/tradeCache";
import {
  Loader2,
  Search,
  Filter,
  ChevronRight,
  ChevronDown,
  Image as ImageIcon,
  X,
  Plus,
  Trash2,
  Pencil,
  Share2,
  SlidersHorizontal,
  Download,
  Globe,
  TrendingUp,
  TrendingDown,
  Cpu,
  Check,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";

const tradeStamp = (t) => {
  const c = new Date(t.created_at || 0).getTime();
  if (!Number.isNaN(c) && c > 0) return c;
  const d = new Date(`${t.date}T${t.time || "00:00"}`).getTime();
  return Number.isNaN(d) ? 0 : d;
};

const normalizeTradeR = (t) => {
  if (!t) return 0;
  const res = (t.result || "").toLowerCase().trim();
  let r = parseFloat(t.r_multiple);
  if (Number.isNaN(r)) r = 0;
  if (res === "loss" && r > 0) return -1;
  if (res === "be") return 0;
  if (res === "win" && r < 0) return Math.abs(r);
  return r;
};

const isTradeWin = (t) => {
  if (!t) return false;
  const res = (t.result || "").toLowerCase().trim();
  if (res === "win") return true;
  if (res === "loss" || res === "be") return false;
  return normalizeTradeR(t) > 0;
};

export default function PastTrades() {
  const navigate = useNavigate();
  const location = useLocation();

  // Instant 0ms cache-backed state
  const [trades, setTrades] = useState(() => {
    const cached = getImmediateCachedTrades();
    return cached ? [...cached].sort((a, b) => tradeStamp(b) - tradeStamp(a)) : [];
  });
  const [loading, setLoading] = useState(() => !getImmediateCachedTrades());

  // Modals state
  const [isAddTradeModalOpen, setIsAddTradeModalOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);

  // Table & View Controls
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [showViewOptions, setShowViewOptions] = useState(false);
  const [compactDensity, setCompactDensity] = useState(false);
  const [copiedTradeId, setCopiedTradeId] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState("");
  const [directionFilter, setDirectionFilter] = useState("");
  const [sessionFilter, setSessionFilter] = useState("");
  const [accountFilter, setAccountFilter] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = compactDensity ? 20 : 15;

  useEffect(() => {
    const fetchTrades = async () => {
      const userId = localStorage.getItem("userId") || localStorage.getItem("userEmail");
      if (!userId) return navigate("/login");
      try {
        const sorted = await getTradesWithCache(userId);
        const ordered = [...sorted].sort((a, b) => tradeStamp(b) - tradeStamp(a));
        setTrades(ordered);

        // Auto open trade if requested via navigation
        if (location.state?.openTradeId) {
          const t = ordered.find((x) => x.id === location.state.openTradeId);
          if (t) setSelectedTrade(t);
        }
      } catch (error) {
        console.error("Failed to fetch trades:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrades();
  }, [navigate, location.state]);

  // Listen to background trade updates across tabs or routes
  useEffect(() => {
    const handleUpdated = (e) => {
      if (e.detail) {
        setTrades([...e.detail].sort((a, b) => tradeStamp(b) - tradeStamp(a)));
      }
    };
    window.addEventListener("trades_updated", handleUpdated);
    return () => window.removeEventListener("trades_updated", handleUpdated);
  }, []);

  // Filtered dataset
  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      const matchesSearch =
        !search ||
        `${t.asset} ${t.setup} ${t.session} ${t.account_name || ""}`
          .toLowerCase()
          .includes(search.toLowerCase());

      const r = normalizeTradeR(t);
      const res = (t.result || "").toLowerCase().trim();
      let matchesResult = true;
      if (resultFilter === "win") matchesResult = res === "win" || r > 0;
      if (resultFilter === "loss") matchesResult = res === "loss" || r < 0;
      if (resultFilter === "be") matchesResult = res === "be" || r === 0;

      const matchesDirection = !directionFilter || t.direction === directionFilter;
      const matchesSession = !sessionFilter || t.session === sessionFilter;
      const matchesAccount =
        !accountFilter ||
        accountFilter === "All Accounts" ||
        t.account_name === accountFilter;

      return (
        matchesSearch &&
        matchesResult &&
        matchesDirection &&
        matchesSession &&
        matchesAccount
      );
    });
  }, [trades, search, resultFilter, directionFilter, sessionFilter, accountFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, resultFilter, directionFilter, sessionFilter, accountFilter, compactDensity]);

  const indexOfLastTrade = currentPage * itemsPerPage;
  const indexOfFirstTrade = indexOfLastTrade - itemsPerPage;
  const currentTrades = filteredTrades.slice(indexOfFirstTrade, indexOfLastTrade);
  const totalPages = Math.ceil(filteredTrades.length / itemsPerPage);

  // Row selection
  const handleToggleSelectAll = () => {
    if (selectedRowIds.size === currentTrades.length) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(currentTrades.map((t) => t.id)));
    }
  };

  const handleToggleRowSelect = (id, e) => {
    e.stopPropagation();
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Row accordion expansion
  const handleToggleRowExpand = (id, e) => {
    e.stopPropagation();
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Delete single trade
  const handleDeleteTrade = async (tradeId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Delete this trade record permanently?")) return;
    try {
      await api.delete(`/api/trades/${tradeId}`);
      invalidateTradeCache();
      const updated = trades.filter((t) => t.id !== tradeId);
      setTrades(updated);
      setCachedTrades(updated);
      if (selectedTrade?.id === tradeId) setSelectedTrade(null);
    } catch (err) {
      alert("Failed to delete trade. Please try again.");
    }
  };

  // Clear all trades
  const handleClearAllTrades = async () => {
    setIsClearing(true);
    try {
      await api.delete("/api/trades/all");
      invalidateTradeCache();
      setTrades([]);
      setCachedTrades([]);
      setIsClearAllModalOpen(false);
      setSelectedTrade(null);
    } catch (err) {
      console.error("Failed to clear trades:", err);
      alert("Failed to clear trades. Please try again.");
    } finally {
      setIsClearing(false);
    }
  };

  // Share trade link
  const handleShareTrade = (trade, e) => {
    if (e) e.stopPropagation();
    const shareText = `Trade on ${trade.asset}: ${trade.direction} (${normalizeTradeR(trade) >= 0 ? "+" : ""}${normalizeTradeR(trade).toFixed(2)}R) logged on ForexNotes.`;
    navigator.clipboard.writeText(shareText);
    setCopiedTradeId(trade.id);
    setTimeout(() => setCopiedTradeId(null), 2000);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredTrades.length === 0) {
      alert("No trades to export.");
      return;
    }
    const headers = [
      "Open Date",
      "Open Time",
      "Symbol",
      "Direction",
      "Entry Price",
      "Exit Price",
      "Lot Size",
      "Net PnL",
      "R-Multiple",
      "Outcome",
      "Setup",
      "Session",
      "Account",
      "Source",
    ];
    const rows = filteredTrades.map((t) => [
      t.date || "",
      t.time || "",
      t.asset || "",
      t.direction || "",
      t.entry || t.entry_price || "",
      t.exit || t.exit_price || "",
      t.lot_size ?? t.size ?? "",
      t.pnl ?? "",
      normalizeTradeR(t).toFixed(2),
      t.result || "",
      t.setup || "",
      t.session || "",
      t.account_name || "",
      t.source || "Manual",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        headers.join(","),
        ...rows.map((row) =>
          row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `tradefxbook_trades_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-7xl mx-auto font-sans pb-24 px-4 sm:px-6 lg:px-8 mt-4 sm:mt-6 space-y-6">
      {/* ── 1. TOP HEADER (Matches TradeFXBook Screenshot Exactly) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
            Trades
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-500 inline-block" />
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              Not connected
            </span>
          </div>
        </div>

        {/* Action Button Row */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Connect MT4/MT5 Button */}
          <button
            type="button"
            onClick={() => setIsConnectModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-xs sm:text-sm tracking-wide shadow-md shadow-[#0066FF]/20 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>Connect MT4/MT5</span>
          </button>

          {/* Clear All Button */}
          <button
            type="button"
            onClick={() => setIsClearAllModalOpen(true)}
            disabled={trades.length === 0}
            className="px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-500/25 bg-white dark:bg-white/[0.03] hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-500 dark:text-rose-400 font-bold text-xs sm:text-sm active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>

          {/* + Add Trade Button */}
          <button
            type="button"
            onClick={() => setIsAddTradeModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-xs sm:text-sm tracking-wide shadow-md shadow-[#0066FF]/20 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Trade</span>
          </button>
        </div>
      </div>

      {/* ── 2. TRADE HISTORY CARD CONTAINER ── */}
      <div className="rounded-3xl bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-5 sm:p-6 space-y-4 backdrop-blur-xl">
        {/* Card Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              Trade History
            </h2>
            <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium">
              {filteredTrades.length} of {trades.length} trades
            </span>
          </div>

          {/* Card Top Action Toolbar (Filters, View, Export) */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Filters Button */}
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                showFilters || resultFilter || directionFilter || sessionFilter || accountFilter || search
                  ? "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400"
                  : "border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/[0.03] text-neutral-700 dark:text-neutral-300 hover:bg-black/[0.02] dark:hover:bg-white/[0.06]"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
              {(resultFilter || directionFilter || sessionFilter || accountFilter || search) && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF] inline-block" />
              )}
            </button>

            {/* View Button */}
            <button
              type="button"
              onClick={() => setShowViewOptions((v) => !v)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                compactDensity
                  ? "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400"
                  : "border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/[0.03] text-neutral-700 dark:text-neutral-300 hover:bg-black/[0.02] dark:hover:bg-white/[0.06]"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>View</span>
              {compactDensity && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF] inline-block" />
              )}
            </button>

            {/* Export Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/[0.03] text-neutral-700 dark:text-neutral-300 text-xs font-semibold flex items-center gap-1.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.06] transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* ── 3. FREE PLAN NOTICE BANNER (Matches Screenshot Exactly) ── */}
        <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-500/10 border border-blue-200/70 dark:border-blue-500/20 text-xs text-neutral-700 dark:text-neutral-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="m-0 leading-relaxed">
            Free plan loads <strong className="font-bold text-neutral-900 dark:text-white">your last 15 trades</strong>. Upgrade to Pro to unlock full history and longer timeframes.
          </p>
          <Link
            to="/paywall"
            className="text-[#0066FF] dark:text-blue-400 font-bold hover:underline shrink-0 flex items-center gap-1"
          >
            <span>Upgrade to Pro</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* ── EXPANDABLE FILTERS TOOLBAR ── */}
        {showFilters && (
          <div className="p-4 rounded-2xl bg-neutral-50/80 dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08] flex flex-wrap items-center gap-3 animate-in fade-in duration-150">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search symbol, setup, or notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white dark:bg-[#111522] border border-black/[0.08] dark:border-white/10 rounded-xl py-2 pl-10 pr-3 text-xs sm:text-sm text-neutral-900 dark:text-white outline-none focus:border-blue-500/60"
              />
            </div>

            {/* Outcome Filter */}
            <AppleSelect
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              className="min-w-[130px]"
              compact
              options={[
                { value: "", label: "All Results" },
                { value: "win", label: "Win ✓" },
                { value: "loss", label: "Loss ✗" },
                { value: "be", label: "Break-Even" },
              ]}
              placeholder="All Results"
            />

            {/* Direction Filter */}
            <AppleSelect
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value)}
              className="min-w-[130px]"
              compact
              options={[
                { value: "", label: "All Types" },
                { value: "LONG", label: "Long" },
                { value: "SHORT", label: "Short" },
              ]}
              placeholder="All Types"
            />

            {/* Session Filter */}
            <AppleSelect
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value)}
              className="min-w-[130px]"
              compact
              options={[
                { value: "", label: "All Sessions" },
                ...[...new Set(trades.map((t) => t.session).filter(Boolean))].map((x) => ({
                  value: x,
                  label: x,
                })),
              ]}
              placeholder="All Sessions"
            />

            {/* Account Filter */}
            <AccountFilter
              trades={trades}
              selectedAccount={accountFilter}
              onChange={setAccountFilter}
            />

            {(search || resultFilter || directionFilter || sessionFilter || accountFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setResultFilter("");
                  setDirectionFilter("");
                  setSessionFilter("");
                  setAccountFilter("");
                }}
                className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        )}

        {/* ── EXPANDABLE VIEW OPTIONS ── */}
        {showViewOptions && (
          <div className="p-3.5 rounded-2xl bg-neutral-50/80 dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between gap-4 text-xs">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">
              Table Row Density
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCompactDensity(false)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  !compactDensity
                    ? "bg-[#0066FF] text-white shadow-xs"
                    : "bg-white dark:bg-white/[0.04] text-neutral-600 dark:text-neutral-400"
                }`}
              >
                Comfortable
              </button>
              <button
                type="button"
                onClick={() => setCompactDensity(true)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  compactDensity
                    ? "bg-[#0066FF] text-white shadow-xs"
                    : "bg-white dark:bg-white/[0.04] text-neutral-600 dark:text-neutral-400"
                }`}
              >
                Compact (20/pg)
              </button>
            </div>
          </div>
        )}

        {/* ── 4. STRUCTURED DATA TABLE (Matches TradeFXBook Screenshot) ── */}
        <div className="overflow-x-auto border-t border-black/[0.06] dark:border-white/[0.06] pt-2">
          <table className="w-full text-left border-collapse min-w-[840px]">
            {/* Table Header Row */}
            <thead>
              <tr className="border-b border-black/[0.05] dark:border-white/[0.06] text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 select-none">
                <th className="py-3 px-3 w-9 text-center">
                  <input
                    type="checkbox"
                    checked={
                      currentTrades.length > 0 &&
                      selectedRowIds.size === currentTrades.length
                    }
                    onChange={handleToggleSelectAll}
                    className="w-3.5 h-3.5 rounded accent-[#0066FF] cursor-pointer"
                  />
                </th>
                <th className="py-3 px-1 w-6"></th>
                <th className="py-3 px-3">OPEN / CLOSE</th>
                <th className="py-3 px-3">SYMBOL</th>
                <th className="py-3 px-3">TYPE</th>
                <th className="py-3 px-3">ENTRY</th>
                <th className="py-3 px-3">EXIT</th>
                <th className="py-3 px-3">SIZE</th>
                <th className="py-3 px-3">P&L</th>
                <th className="py-3 px-3">SOURCE</th>
                <th className="py-3 px-3 text-right"></th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center">
                    <Loader2 className="w-6 h-6 text-[#0066FF] animate-spin mx-auto mb-2" />
                    <span className="text-neutral-400 text-xs">
                      Loading trade history...
                    </span>
                  </td>
                </tr>
              ) : currentTrades.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center">
                    <div className="max-w-xs mx-auto space-y-2">
                      <p className="text-neutral-500 dark:text-neutral-400 font-semibold text-sm">
                        No trades found
                      </p>
                      <p className="text-neutral-400 text-xs">
                        Adjust your filters or click "+ Add Trade" above to log your first trade execution.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentTrades.map((t, idx) => {
                  const isExpanded = expandedRows.has(t.id);
                  const isSelected = selectedRowIds.has(t.id);
                  const r = normalizeTradeR(t);
                  const isWin = isTradeWin(t);
                  const isLoss = (t.result || "").toLowerCase() === "loss" || r < 0;
                  const isLong = (t.direction || "LONG").toUpperCase() === "LONG";

                  // Format Entry & Exit Dates
                  const openDateStr = t.date ? `${t.date} ${t.time || ""}`.trim() : "—";
                  const closeDateStr = t.exit_date
                    ? `${t.exit_date} ${t.exit_time || ""}`.trim()
                    : t.date || "—";

                  // P&L display
                  const pnlNum = Number(t.pnl);
                  const hasPnl = t.pnl !== null && t.pnl !== undefined && !Number.isNaN(pnlNum) && pnlNum !== 0;

                  return (
                    <tr
                      key={t.id || idx}
                      onClick={() => setSelectedTrade(t)}
                      className={`group hover:bg-black/[0.015] dark:hover:bg-white/[0.025] transition-colors cursor-pointer ${
                        isSelected ? "bg-blue-500/[0.04] dark:bg-blue-500/[0.06]" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleToggleRowSelect(t.id, e)}
                          className="w-3.5 h-3.5 rounded accent-[#0066FF] cursor-pointer"
                        />
                      </td>

                      {/* Expand Chevron */}
                      <td className="py-3.5 px-1 text-center" onClick={(e) => handleToggleRowExpand(t.id, e)}>
                        <button
                          type="button"
                          className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors cursor-pointer"
                          aria-label="Expand trade details"
                        >
                          <ChevronRight
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${
                              isExpanded ? "rotate-90 text-[#0066FF]" : ""
                            }`}
                          />
                        </button>
                      </td>

                      {/* OPEN / CLOSE */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium text-neutral-800 dark:text-neutral-200">
                          <span className="text-neutral-500 dark:text-neutral-400">Open:</span>
                          <span className="font-semibold">{openDateStr}</span>
                          <span className="text-neutral-400 mx-1">·</span>
                          <span className="text-neutral-500 dark:text-neutral-400">Close:</span>
                          <span className="font-semibold">{closeDateStr}</span>
                        </div>
                      </td>

                      {/* SYMBOL */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-white">
                          <Globe className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span>{t.asset}</span>
                        </div>
                      </td>

                      {/* TYPE (Pill Badge: Long / Short) */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
                            isLong
                              ? "bg-blue-500/10 text-[#0066FF] dark:text-blue-400 border-blue-500/20"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                          }`}
                        >
                          {isLong ? (
                            <TrendingUp className="w-3 h-3 stroke-[2.5]" />
                          ) : (
                            <TrendingDown className="w-3 h-3 stroke-[2.5]" />
                          )}
                          <span>{isLong ? "Long" : "Short"}</span>
                        </span>
                      </td>

                      {/* ENTRY */}
                      <td className="py-3.5 px-3 font-mono font-medium text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                        {t.entry || t.entry_price ? Number(t.entry || t.entry_price).toLocaleString() : "—"}
                      </td>

                      {/* EXIT */}
                      <td className="py-3.5 px-3 font-mono font-medium text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                        {t.exit || t.exit_price ? Number(t.exit || t.exit_price).toLocaleString() : "—"}
                      </td>

                      {/* SIZE */}
                      <td className="py-3.5 px-3 font-mono font-medium text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                        {t.lot_size ?? t.size ?? "0.1"}
                      </td>

                      {/* P&L (Vibrant Electric Blue on Profit like TradeFXBook Screenshot) */}
                      <td className="py-3.5 px-3 font-mono font-black text-sm whitespace-nowrap">
                        <span
                          className={
                            isWin
                              ? "text-[#0066FF] dark:text-blue-400 font-black"
                              : isLoss
                              ? "text-rose-500 dark:text-rose-400 font-black"
                              : "text-neutral-500 font-bold"
                          }
                        >
                          {hasPnl
                            ? `${pnlNum >= 0 ? "+" : ""}$${Math.abs(pnlNum).toFixed(2)}`
                            : `${r >= 0 ? "+" : ""}${r.toFixed(2)}R`}
                        </span>
                        {hasPnl && (
                          <span className="text-[10px] font-normal opacity-70 ml-1.5">
                            ({r >= 0 ? "+" : ""}{r.toFixed(2)}R)
                          </span>
                        )}
                      </td>

                      {/* SOURCE */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                            t.source === "MT5" || t.source === "mt5_auto"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                          }`}
                        >
                          {t.source === "MT5" || t.source === "mt5_auto" ? (
                            <Cpu className="w-3 h-3" />
                          ) : (
                            <Pencil className="w-3 h-3" />
                          )}
                          <span>
                            {t.source === "MT5" || t.source === "mt5_auto" ? "MT5 Auto" : "Manual"}
                          </span>
                        </span>
                      </td>

                      {/* Action Icons */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => navigate(`/add-trade?edit=${t.id}`)}
                            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-neutral-500 hover:text-[#0066FF] dark:hover:text-blue-400 transition-colors cursor-pointer"
                            title="Edit Trade"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Share */}
                          <button
                            type="button"
                            onClick={(e) => handleShareTrade(t, e)}
                            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                            title="Share Trade"
                          >
                            {copiedTradeId === t.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Share2 className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteTrade(t.id, e)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-neutral-400 hover:text-rose-500 transition-colors cursor-pointer"
                            title="Delete Trade"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION CONTROLS ── */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center pt-4 border-t border-black/[0.05] dark:border-white/[0.06] text-xs">
            <span className="text-neutral-500 dark:text-neutral-400">
              Showing {indexOfFirstTrade + 1}–{Math.min(indexOfLastTrade, filteredTrades.length)} of {filteredTrades.length} trades
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3.5 py-1.5 rounded-xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/[0.03] text-neutral-700 dark:text-neutral-300 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/[0.02] dark:hover:bg-white/[0.06] transition-all cursor-pointer shadow-xs"
              >
                Previous
              </button>
              <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200 px-2">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3.5 py-1.5 rounded-xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/[0.03] text-neutral-700 dark:text-neutral-300 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/[0.02] dark:hover:bg-white/[0.06] transition-all cursor-pointer shadow-xs"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── CONNECT MT4/MT5 MODAL ── */}
      {isConnectModalOpen && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setIsConnectModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-[#121622] border border-black/[0.08] dark:border-white/[0.12] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-[#0066FF] flex items-center justify-center font-bold">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                    Connect MT4 / MT5 Terminal
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Real-time automatic sync via Investor (Read-Only) credentials
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConnectModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              <div className="p-4 rounded-2xl bg-blue-500/[0.06] border border-blue-500/15">
                <span className="font-bold text-[#0066FF] dark:text-blue-400 block mb-1">
                  100% Secure & Non-Custodial
                </span>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 m-0">
                  We only require your read-only investor password. ForexNotes cannot execute or place trades without your explicit confirmation.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">
                    1
                  </span>
                  <span>Navigate to <strong>Tools &gt; MT5 AI Bot</strong> or Connections setup.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">
                    2
                  </span>
                  <span>Enter your Account Login ID, Broker Server Name, and Investor Password.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">
                    3
                  </span>
                  <span>Enable WebRequest for our secure sync endpoint in your MT5 Terminal options.</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsConnectModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConnectModalOpen(false);
                  navigate("/bot-hub/mt5");
                }}
                className="px-4 py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-xs shadow-md shadow-[#0066FF]/25 cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <span>Launch MT5 Setup</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CLEAR ALL TRADES CONFIRMATION MODAL ── */}
      {isClearAllModalOpen && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => !isClearing && setIsClearAllModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#121622] border border-black/[0.08] dark:border-white/[0.12] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Clear All Trade Records?
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                This action will permanently delete all {trades.length} recorded trade logs from your account. This cannot be undone.
              </p>
            </div>

            <div className="pt-3 flex items-center justify-center gap-2.5">
              <button
                type="button"
                disabled={isClearing}
                onClick={() => setIsClearAllModalOpen(false)}
                className="w-full py-2.5 rounded-xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/[0.03] text-neutral-700 dark:text-neutral-300 font-bold text-xs hover:bg-black/[0.02] dark:hover:bg-white/[0.06] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isClearing}
                onClick={handleClearAllTrades}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-500/25 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isClearing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Clearing...</span>
                  </>
                ) : (
                  <span>Yes, Delete All</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. INTEGRATED ADD TRADE MODAL (TradeFXBook Modal) ── */}
      <TradeFXBookAddTradeModal
        isOpen={isAddTradeModalOpen}
        onClose={() => setIsAddTradeModalOpen(false)}
        onTradeAdded={() => {
          setIsAddTradeModalOpen(false);
          const cached = getImmediateCachedTrades();
          if (cached) {
            setTrades([...cached].sort((a, b) => tradeStamp(b) - tradeStamp(a)));
          }
        }}
        trades={trades}
        activeAccount={accountFilter}
      />

      {/* ── 6. TRADE DETAIL MODAL (macOS Glass Dialog) ── */}
      {selectedTrade && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setSelectedTrade(null)}
        >
          <div
            className="w-full max-w-4xl bg-white dark:bg-[#10141f] border border-black/[0.08] dark:border-white/[0.12] rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.25)] dark:shadow-[0_30px_70px_rgba(0,0,0,0.7)] flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border ${
                    selectedTrade.direction === "LONG"
                      ? "bg-blue-500/10 text-[#0066FF] dark:text-blue-400 border-blue-500/25"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25"
                  }`}
                >
                  {selectedTrade.direction === "LONG" ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  {selectedTrade.direction}
                </span>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
                  {selectedTrade.asset}
                </h2>
                <span className="text-neutral-400 text-xs sm:text-sm">
                  • {selectedTrade.date}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/add-trade?edit=${selectedTrade.id}`)}
                  className="p-2 rounded-xl bg-black/[0.04] dark:bg-white/10 hover:bg-blue-500/15 text-neutral-600 dark:text-neutral-300 hover:text-[#0066FF] dark:hover:text-blue-400 transition-colors cursor-pointer"
                  title="Edit Trade"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteTrade(selectedTrade.id)}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-600 dark:text-rose-400 hover:text-white transition-all cursor-pointer"
                  title="Delete Trade"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTrade(null)}
                  className="p-2 rounded-xl bg-black/[0.04] dark:bg-white/10 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Stat Grid */}
              {(() => {
                const selR = normalizeTradeR(selectedTrade);
                const selIsLoss = (selectedTrade.result || "").toLowerCase() === "loss" || selR < 0;
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      {
                        label: "Net Profit / Loss ($)",
                        value:
                          selectedTrade.pnl !== null && selectedTrade.pnl !== undefined && Number(selectedTrade.pnl) !== 0
                            ? `${Number(selectedTrade.pnl) >= 0 ? "+" : ""}$${Math.abs(Number(selectedTrade.pnl)).toFixed(2)}`
                            : "—",
                        isNet: true,
                        isLoss: Number(selectedTrade.pnl) < 0 || selIsLoss,
                      },
                      {
                        label: "R-Multiple",
                        value: `${selR >= 0 ? "+" : ""}${selR.toFixed(2)}R`,
                        isNet: true,
                        isLoss: selIsLoss,
                      },
                      {
                        label: "Outcome",
                        value: selectedTrade.result?.toUpperCase() || "—",
                        isResult: true,
                        isLoss: selIsLoss,
                      },
                      { label: "Setup", value: selectedTrade.setup || "—" },
                      { label: "Session", value: selectedTrade.session || "—" },
                      { label: "Entry Price", value: selectedTrade.entry || selectedTrade.entry_price || "—" },
                      { label: "Stop Loss", value: selectedTrade.sl || "—" },
                      { label: "Take Profit", value: selectedTrade.tp || "—" },
                    ].map((s, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.08]"
                      >
                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-extrabold uppercase tracking-widest mb-1">
                          {s.label}
                        </p>
                        <p
                          className={`text-sm font-bold font-mono ${
                            s.isNet || s.isResult
                              ? s.isLoss
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-[#0066FF] dark:text-blue-400 font-black"
                              : "text-neutral-900 dark:text-white"
                          }`}
                        >
                          {s.value}
                        </p>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Analysis Bento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.08]">
                    <h3 className="text-xs font-bold text-[#0066FF] dark:text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Technical Reason & Execution
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                      {selectedTrade.reason || "No technical reason recorded."}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.08]">
                    <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" /> Key Lesson
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                      {selectedTrade.lesson || "No lesson recorded."}
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.08] flex flex-col">
                  <h3 className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Psychology & Timing
                  </h3>
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-black/[0.05] dark:border-white/[0.06]">
                    <div className="flex-1">
                      <p className="text-[10px] text-neutral-400 font-bold uppercase mb-0.5">
                        Emotion Before
                      </p>
                      <p className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white">
                        {selectedTrade.emotion_before || "—"}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                    <div className="flex-1">
                      <p className="text-[10px] text-neutral-400 font-bold uppercase mb-0.5">
                        Emotion After
                      </p>
                      <p className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white">
                        {selectedTrade.emotion_after || "—"}
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase mb-1">
                    Psychological Notes
                  </p>
                  <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed flex-1 whitespace-pre-wrap">
                    {selectedTrade.psych_note || "No emotional notes recorded."}
                  </p>
                </div>
              </div>

              {/* Execution Screenshots */}
              {selectedTrade.images && selectedTrade.images.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" /> Chart Screenshots
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedTrade.images.map((img, i) => (
                      <div
                        key={i}
                        onClick={() => window.open(img, "_blank")}
                        className="relative aspect-video rounded-2xl overflow-hidden border border-black/[0.08] dark:border-white/10 group cursor-pointer shadow-xs"
                      >
                        <img
                          src={img}
                          alt="Trade Chart"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="bg-black/80 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/20">
                            View Full Size
                          </span>
                        </div>
                      </div>
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
