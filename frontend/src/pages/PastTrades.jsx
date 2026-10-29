import { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";
import AccountFilter from "../components/AccountFilter";
import AppleSelect from "../components/ui/AppleSelect";
import {
  getImmediateCachedTrades,
  getTradesWithCache,
  invalidateTradeCache,
} from "../utils/tradeCache";
import {
  Loader2,
  Search,
  Target,
  Filter,
  ChevronRight,
  Image as ImageIcon,
  X,
  Calendar,
  TrendingUp,
  PlusCircle,
  Clock,
  ArrowUp,
  ArrowDown,
  Brain,
  Pencil,
  Trash2,
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
  const [showFilters, setShowFilters] = useState(false);
  const [directionFilter, setDirectionFilter] = useState("");
  const [sessionFilter, setSessionFilter] = useState("");
  const [accountFilter, setAccountFilter] = useState("");
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState("");
  const [selectedTrade, setSelectedTrade] = useState(null);

  const handleDeleteTrade = async (tradeId) => {
    if (!window.confirm("Delete this trade permanently? This cannot be undone.")) return;
    try {
      await api.delete(`/api/trades/${tradeId}`);
      invalidateTradeCache();
      setTrades((prev) => prev.filter((t) => t.id !== tradeId));
      setSelectedTrade(null);
    } catch (err) {
      alert("Failed to delete trade. Please try again.");
    }
  };

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

  // Pagination logic
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, resultFilter, directionFilter, sessionFilter, accountFilter]);

  const indexOfLastTrade = currentPage * itemsPerPage;
  const indexOfFirstTrade = indexOfLastTrade - itemsPerPage;
  const currentTrades = filteredTrades.slice(indexOfFirstTrade, indexOfLastTrade);
  const totalPages = Math.ceil(filteredTrades.length / itemsPerPage);

  return (
    <div className="w-full max-w-7xl mx-auto font-sans pb-24 px-4 sm:px-6 lg:px-8 mt-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 lg:pr-36 xl:pr-40">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-xs">
              <Calendar className="w-4 h-4" />
            </div>
            Trade Journal
            <span className="px-2.5 py-0.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider">
              {filteredTrades.length} Logs
            </span>
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1 text-xs sm:text-[13px]">
            Your central execution workspace. Filter, search, and review past trade data.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/add-trade")}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all duration-200 text-xs shadow-md shadow-emerald-500/20 active:scale-[0.98] cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" /> Log Trade
        </button>
      </div>

      {/* ── FILTER BAR ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
          <input
            type="text"
            placeholder="Search symbol, setup, or account..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-[#111522] border border-black/[0.08] dark:border-white/10 rounded-2xl py-2.5 pl-11 pr-4 text-neutral-900 dark:text-white text-xs sm:text-sm focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all placeholder-neutral-400 dark:placeholder-neutral-500 shadow-xs"
          />
        </div>

        <div className="flex gap-2.5 items-center flex-wrap sm:flex-nowrap">
          <AppleSelect
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="min-w-[140px]"
            compact
            options={[
              { value: "", label: "All Results" },
              { value: "win", label: "Win ✓" },
              { value: "loss", label: "Loss ✗" },
              { value: "be", label: "Break-Even" },
            ]}
            placeholder="All Results"
          />
          <div className="self-stretch flex items-center">
            <AccountFilter
              trades={trades}
              selectedAccount={accountFilter}
              onChange={setAccountFilter}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            className={`px-3.5 py-2 rounded-2xl transition-all duration-200 flex items-center gap-2 text-xs font-semibold backdrop-blur-xl cursor-pointer ${
              showFilters || directionFilter || sessionFilter || accountFilter
                ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 shadow-xs"
                : "bg-white/80 dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <Filter className="w-3.5 h-3.5" /> More Filters
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-2xl bg-white/70 dark:bg-[#111522]/80 border border-black/[0.06] dark:border-white/[0.08] backdrop-blur-xl">
          <AppleSelect
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value)}
            className="min-w-[140px]"
            compact
            options={[
              { value: "", label: "All Directions" },
              { value: "LONG", label: "Long" },
              { value: "SHORT", label: "Short" },
            ]}
            placeholder="All Directions"
          />
          <AppleSelect
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            className="min-w-[140px]"
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
          {(directionFilter || sessionFilter || accountFilter) && (
            <button
              type="button"
              onClick={() => {
                setDirectionFilter("");
                setSessionFilter("");
                setAccountFilter("");
              }}
              className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* ── TRADE LIST ── */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white/70 dark:bg-[#111522]/80 border border-black/[0.06] dark:border-white/[0.08] rounded-3xl backdrop-blur-xl">
            <Loader2 className="w-7 h-7 text-emerald-500 animate-spin mb-3" />
            <p className="text-neutral-500 dark:text-neutral-400 text-xs font-medium">
              Loading execution history...
            </p>
          </div>
        ) : filteredTrades.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white/70 dark:bg-[#111522]/80 border border-black/[0.06] dark:border-white/[0.08] rounded-3xl text-center px-4 backdrop-blur-xl">
            <Target className="w-10 h-10 text-neutral-400 dark:text-neutral-600 mb-3" />
            <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-1">
              No trades match criteria
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 text-xs">
              Adjust your filters or log a new trade to see it here.
            </p>
          </div>
        ) : (
          <>
            {currentTrades.map((t, idx) => {
              const r = normalizeTradeR(t);
              const isWin = isTradeWin(t);
              const hasImages = t.images && t.images.length > 0;

              return (
                <div
                  key={t.id || idx}
                  onClick={() => setSelectedTrade(t)}
                  className="bg-white dark:bg-[#111522] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_4px_24px_rgba(0,0,0,0.5)] transition-all duration-200 cursor-pointer group"
                >
                  {/* Left: Asset & Time */}
                  <div className="flex items-center gap-3.5 md:w-[25%]">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs border ${
                        t.direction === "LONG"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                      }`}
                      title={t.direction}
                    >
                      {t.direction === "LONG" ? (
                        <ArrowUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-900 dark:text-white text-sm tracking-tight">
                        {t.asset}
                      </h3>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3 h-3 text-neutral-400" /> {t.date}{" "}
                        {t.time && `• ${t.time}`}
                      </p>
                    </div>
                  </div>

                  {/* Middle: Setup & Session */}
                  <div className="flex-1 grid grid-cols-2 gap-4 border-t md:border-t-0 md:border-l border-black/[0.05] dark:border-white/[0.06] pt-3 md:pt-0 md:pl-6">
                    <div>
                      <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-widest mb-0.5">
                        Setup
                      </p>
                      <p className="text-xs text-neutral-800 dark:text-neutral-200 font-semibold truncate">
                        {t.setup || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-widest mb-0.5">
                        Session
                      </p>
                      <p className="text-xs text-neutral-800 dark:text-neutral-200 font-semibold truncate">
                        {t.session || "—"}
                      </p>
                    </div>
                  </div>

                  {/* Right: R-Multiple & Media */}
                  <div className="flex items-center justify-between md:justify-end gap-3.5 border-t md:border-t-0 md:border-l border-black/[0.05] dark:border-white/[0.06] pt-3 md:pt-0 md:pl-6 md:w-[25%]">
                    <div className="flex items-center gap-2">
                      {hasImages && (
                        <ImageIcon className="w-4 h-4 text-neutral-400 group-hover:text-emerald-500 transition-colors" />
                      )}
                    </div>
                    <div
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
                        isWin
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25"
                      }`}
                    >
                      {t.pnl !== null && t.pnl !== undefined && Number(t.pnl) !== 0 && (
                        <span className="font-mono">
                          {Number(t.pnl) >= 0 ? "+" : ""}${Math.abs(Number(t.pnl)).toFixed(2)}
                        </span>
                      )}
                      <span className="font-mono opacity-90">
                        {t.pnl !== null && t.pnl !== undefined && Number(t.pnl) !== 0
                          ? `(${isWin ? "+" : ""}${r.toFixed(2)}R)`
                          : `${isWin ? "+" : ""}${r.toFixed(2)}R`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTrade(t.id);
                      }}
                      className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-rose-500/15 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl transition-all cursor-pointer"
                      title="Delete Trade"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-white transition-colors hidden md:block" />
                  </div>
                </div>
              );
            })}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-8 pt-4">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#111522] border border-black/[0.06] dark:border-white/[0.08] text-neutral-700 dark:text-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-all cursor-pointer shadow-xs"
                >
                  Previous
                </button>
                <span className="text-xs font-mono font-bold text-neutral-500 dark:text-neutral-400 px-2">
                  {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#111522] border border-black/[0.06] dark:border-white/[0.08] text-neutral-700 dark:text-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-all cursor-pointer shadow-xs"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── SELECTED TRADE DETAIL MODAL (macOS Glass Dialog) ── */}
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
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25"
                  }`}
                >
                  {selectedTrade.direction === "LONG" ? (
                    <ArrowUp className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDown className="w-3.5 h-3.5" />
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
                  className="p-2 rounded-xl bg-black/[0.04] dark:bg-white/10 hover:bg-emerald-500/15 text-neutral-600 dark:text-neutral-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
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
                const selLot = selectedTrade.lot_size ?? selectedTrade.executions?.[0]?.lot_size;
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      {
                        label: "Profit / Loss ($)",
                        value:
                          selectedTrade.pnl !== null && selectedTrade.pnl !== undefined && Number(selectedTrade.pnl) !== 0
                            ? `${Number(selectedTrade.pnl) >= 0 ? "+" : ""}$${Math.abs(Number(selectedTrade.pnl)).toFixed(2)}`
                            : "—",
                        isNet: true,
                        isLoss: Number(selectedTrade.pnl) < 0 || selIsLoss,
                      },
                      {
                        label: "Net R",
                        value: `${selR >= 0 ? "+" : ""}${selR.toFixed(2)}R`,
                        isNet: true,
                        isLoss: selIsLoss,
                      },
                      {
                        label: "Result",
                        value: selectedTrade.result?.toUpperCase() || "—",
                        isResult: true,
                        isLoss: selIsLoss,
                      },
                      { label: "Setup", value: selectedTrade.setup || "—" },
                      { label: "Session", value: selectedTrade.session || "—" },
                      { label: "Entry", value: selectedTrade.entry || "—" },
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
                                : "text-emerald-600 dark:text-emerald-400"
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

              {/* Analysis & Lessons Bento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.08]">
                    <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5" /> Technical Analysis
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
                    <Brain className="w-3.5 h-3.5" /> Psychological State
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
