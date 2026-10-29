import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import AccountFilter from "../components/AccountFilter";
import {
  getImmediateCachedTrades,
  getTradesWithCache,
} from "../utils/tradeCache";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Target,
  X,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Brain,
  Zap,
} from "lucide-react";

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

export default function PerformanceCalendar() {
  const navigate = useNavigate();

  // Instant 0ms cache-backed state
  const [trades, setTrades] = useState(() => getImmediateCachedTrades() || []);
  const [loading, setLoading] = useState(() => !getImmediateCachedTrades());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayTrades, setSelectedDayTrades] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState("");

  useEffect(() => {
    const fetchTrades = async () => {
      const userId = localStorage.getItem("userId") || localStorage.getItem("userEmail");
      if (!userId) return navigate("/login");
      try {
        const sorted = await getTradesWithCache(userId);
        setTrades(sorted);
      } catch (error) {
        console.error("Failed to fetch calendar trades:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrades();
  }, [navigate]);

  useEffect(() => {
    const handleUpdated = (e) => {
      if (e.detail) setTrades(e.detail);
    };
    window.addEventListener("trades_updated", handleUpdated);
    return () => window.removeEventListener("trades_updated", handleUpdated);
  }, []);

  const filteredTrades = useMemo(() => {
    if (!selectedAccount || selectedAccount === "All Accounts") return trades;
    return trades.filter((t) => t.account_name === selectedAccount);
  }, [trades, selectedAccount]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startingDayIndex = (firstDayOfMonth.getDay() + 6) % 7;

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <div className="w-full max-w-7xl mx-auto font-sans pb-24 px-4 sm:px-6 lg:px-8 mt-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 lg:pr-36 xl:pr-40">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 shadow-xs">
              <CalendarIcon className="w-4 h-4" />
            </div>
            Performance Calendar
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1 text-xs sm:text-[13px]">
            Visualize your daily P&L, trading frequency, and consistency.
            {selectedAccount && (
              <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-bold">
                • {selectedAccount}
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <AccountFilter
            trades={trades}
            selectedAccount={selectedAccount}
            onChange={setSelectedAccount}
          />
          <div className="flex items-center gap-2 bg-white/80 dark:bg-[#111522] border border-black/[0.08] dark:border-white/10 rounded-2xl p-1.5 shadow-xs backdrop-blur-xl">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white min-w-[130px] text-center select-none">
              {monthNames[month]} {year}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-96 bg-white/70 dark:bg-[#111522]/80 border border-black/[0.06] dark:border-white/[0.08] rounded-3xl backdrop-blur-xl">
          <Loader2 className="w-7 h-7 text-purple-500 animate-spin mb-3" />
          <p className="text-neutral-500 dark:text-neutral-400 text-xs font-medium">
            Loading performance data...
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#111522] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-3 sm:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          {/* Day Names Row */}
          <div className="grid grid-cols-7 gap-1 sm:gap-3 mb-3">
            {dayNames.map((d, i) => (
              <div
                key={i}
                className="text-center text-[10px] font-extrabold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
            {Array.from({ length: startingDayIndex }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="min-h-[64px] sm:min-h-[110px] bg-neutral-100/40 dark:bg-white/[0.01] border border-black/[0.02] dark:border-white/[0.02] rounded-xl sm:rounded-2xl"
              />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const dayTrades = filteredTrades.filter((t) => (t.date || "").slice(0, 10) === dateString);

              const netDayR = dayTrades.reduce((acc, t) => acc + normalizeTradeR(t), 0);
              const hasTrades = dayTrades.length > 0;
              const isPositive = netDayR >= 0;
              const brokeRules = dayTrades.some((t) => t.rule_break === "yes");

              return (
                <div
                  key={dayNum}
                  onClick={() => hasTrades && setSelectedDayTrades({ date: dateString, trades: dayTrades })}
                  className={`min-h-[64px] sm:min-h-[110px] rounded-xl sm:rounded-2xl p-2 sm:p-3 flex flex-col min-w-0 transition-all duration-200 relative overflow-hidden group select-none ${
                    hasTrades
                      ? "bg-white dark:bg-[#151926] border border-black/[0.08] dark:border-white/10 cursor-pointer hover:border-purple-500/60 dark:hover:border-purple-500/60 hover:shadow-md shadow-xs"
                      : "bg-neutral-50/70 dark:bg-[#0c0e15] border border-black/[0.03] dark:border-white/[0.03]"
                  }`}
                >
                  <div className="flex items-start justify-between relative z-10">
                    <span
                      className={`text-xs sm:text-sm font-bold ${
                        hasTrades
                          ? "text-neutral-900 dark:text-white"
                          : "text-neutral-400 dark:text-neutral-600"
                      }`}
                    >
                      {dayNum}
                    </span>
                    {hasTrades && (
                      <span
                        className={`hidden sm:inline text-[10px] font-bold px-1.5 py-0.5 rounded-lg border font-mono ${
                          isPositive
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25"
                        }`}
                      >
                        {isPositive ? "+" : ""}
                        {netDayR.toFixed(2)}R
                      </span>
                    )}
                  </div>

                  {hasTrades && (
                    <span
                      className={`sm:hidden mt-0.5 text-[9px] font-bold leading-none font-mono ${
                        isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {netDayR.toFixed(1)}R
                    </span>
                  )}

                  {hasTrades && (
                    <div className="mt-auto relative z-10 pt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="hidden sm:inline text-[10px] text-neutral-400 dark:text-neutral-500 font-semibold">
                          {dayTrades.length} trade{dayTrades.length > 1 ? "s" : ""}
                        </span>
                        {brokeRules && <Zap className="w-3 h-3 text-rose-500" />}
                      </div>
                      <div className="flex gap-1 h-1.5 rounded-full overflow-hidden bg-black/5 dark:bg-white/10">
                        {dayTrades.map((t, idx) => (
                          <div
                            key={idx}
                            className={`flex-1 ${
                              normalizeTradeR(t) >= 0 ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {hasTrades && (
                    <div
                      className={`absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t opacity-10 pointer-events-none ${
                        isPositive ? "from-emerald-500 to-transparent" : "from-rose-500 to-transparent"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── DAILY REVIEW MODAL (macOS Glass Dialog) ── */}
      {selectedDayTrades && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setSelectedDayTrades(null)}
        >
          <div
            className="w-full max-w-3xl max-h-[85vh] bg-white dark:bg-[#10141f] border border-black/[0.08] dark:border-white/[0.12] rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.25)] dark:shadow-[0_30px_70px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2 tracking-tight">
                  <CalendarIcon className="w-5 h-5 text-purple-500" /> {selectedDayTrades.date}
                </h2>
                <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-0.5">
                  Daily execution breakdown ({selectedDayTrades.trades.length} trades)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayTrades(null)}
                className="p-2 rounded-xl bg-black/[0.04] dark:bg-white/10 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal List */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3">
              {selectedDayTrades.trades.map((t, idx) => {
                const r = normalizeTradeR(t);
                const isWin = isTradeWin(t);
                return (
                  <div
                    key={t.id || idx}
                    onClick={() => navigate("/trades", { state: { openTradeId: t.id } })}
                    className="bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.08] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all duration-200"
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs border ${
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
                        <h3 className="font-bold text-neutral-900 dark:text-white text-sm">
                          {t.asset}
                        </h3>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {t.setup || "Setup"} • {t.session || "Session"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 justify-between md:justify-end">
                      {t.rule_break === "yes" && (
                        <span className="text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full border border-rose-500/25 uppercase tracking-widest font-extrabold">
                          Rule Broken
                        </span>
                      )}
                      <div
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold font-mono ${
                          isWin
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25"
                        }`}
                      >
                        {isWin ? "+" : ""}
                        {r.toFixed(2)}R
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
