// frontend/src/pages/PerformanceCalendar.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Target,
  X,
  TrendingUp,
  Brain,
  Image as ImageIcon,
} from "lucide-react";

export default function PerformanceCalendar() {
  const navigate = useNavigate();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Day View Modal State
  const [selectedDayTrades, setSelectedDayTrades] = useState(null);
  const [selectedTradeDetail, setSelectedTradeDetail] = useState(null);

  useEffect(() => {
    const fetchTrades = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        navigate("/login");
        return;
      }

      try {
        const response = await api.get(`/api/trades?userId=${userId}`);
        setTrades(response.data.data || []);
      } catch (error) {
        console.error("Failed to fetch calendar trades:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();
  }, [navigate]);

  // Calendar Math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startingDayIndex = (firstDayOfMonth.getDay() + 6) % 7; // Monday start

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getResultPill = (result) => {
    const res = result?.toLowerCase();
    if (res === "win")
      return "bg-[#e6f4ea] dark:bg-[#0d3429] text-[#137333] dark:text-[#36d99d] border-[#137333]/30 dark:border-[#36d99d]/30";
    if (res === "loss")
      return "bg-[#fce8e6] dark:bg-[#35151c] text-[#c5221f] dark:text-[#ff7c89] border-[#c5221f]/30 dark:border-[#ff7c89]/30";
    return "bg-[#fef7e0] dark:bg-[#34280e] text-[#b06000] dark:text-[#f5c65d] border-[#b06000]/30 dark:border-[#f5c65d]/30";
  };

  return (
    <div
      className="w-full max-w-7xl mx-auto font-sans pb-16 px-4 md:px-8 mt-6 md:mt-8 box-border"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header */}
      <div className="mb-8 md:mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-[2px] bg-[#22d3ee]/10 flex items-center justify-center border border-[#22d3ee]/20 shrink-0">
            <CalendarIcon className="w-5 h-5 md:w-6 md:h-6 text-[#22d3ee]" />
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-1">
              Performance Calendar
            </h1>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
              Track your P&L and daily trade outcomes graphically.
            </p>
          </div>
        </div>

        {/* Month Selector Controls */}
        <div className="flex items-center gap-3 bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] px-4 py-2 shadow-sm">
          <button
            onClick={handlePrevMonth}
            className="p-1 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold text-gray-900 dark:text-white min-w-[140px] text-center">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px]">
          <Loader2 className="w-8 h-8 text-[#22d3ee] animate-spin mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            Loading calendar history...
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-4 md:p-6 shadow-xl">
          {/* Weekday Names Header */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {dayNames.map((d, i) => (
              <div
                key={i}
                className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest py-2"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty slots for previous month offset */}
            {Array.from({ length: startingDayIndex }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="min-h-[90px] md:min-h-[110px] bg-gray-50/50 dark:bg-[#0a0a0a]/40 border border-gray-100 dark:border-white/[0.02] rounded-[2px] opacity-30"
              ></div>
            ))}

            {/* Actual Days of the Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const formattedDay = String(dayNum).padStart(2, "0");
              const formattedMonth = String(month + 1).padStart(2, "0");
              const dateString = `${year}-${formattedMonth}-${formattedDay}`;

              // Filter trades for this specific date
              const dayTrades = trades.filter(
                (t) => (t.date || "").slice(0, 10) === dateString,
              );
              const wins = dayTrades.filter(
                (t) => t.result?.toLowerCase() === "win",
              ).length;
              const losses = dayTrades.filter(
                (t) => t.result?.toLowerCase() === "loss",
              ).length;
              const netDayR = dayTrades.reduce(
                (acc, t) => acc + parseFloat(t.r_multiple || 0),
                0,
              );

              const hasTrades = dayTrades.length > 0;
              const isPositive = netDayR >= 0;

              return (
                <div
                  key={dayNum}
                  onClick={() =>
                    hasTrades &&
                    setSelectedDayTrades({
                      date: dateString,
                      trades: dayTrades,
                    })
                  }
                  className={`min-h-[90px] md:min-h-[110px] bg-gray-50 dark:bg-[#0b131d] border border-gray-200 dark:border-[#1f2c3b] rounded-[2px] p-2 md:p-3 flex flex-col justify-between transition-all ${hasTrades ? "cursor-pointer hover:border-[#2f8df4] hover:shadow-md" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      {dayNum}
                    </span>
                    {hasTrades && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-[2px] ${isPositive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400"}`}
                      >
                        {isPositive ? "+" : ""}
                        {netDayR.toFixed(1)}R
                      </span>
                    )}
                  </div>

                  {/* Graphical Activity Bar / Count */}
                  {hasTrades ? (
                    <div className="space-y-1.5 mt-auto">
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                        {dayTrades.length} trade
                        {dayTrades.length > 1 ? "s" : ""} ({wins}W / {losses}L)
                      </div>
                      <div
                        className={`w-full h-1.5 rounded-full ${isPositive ? "bg-emerald-500" : "bg-red-500"}`}
                      ></div>
                    </div>
                  ) : (
                    <div className="mt-auto"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day Trades Modal */}
      {selectedDayTrades && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedDayTrades(null)}
          ></div>
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/10 rounded-[2px] shadow-2xl p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-200 dark:border-white/5">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Trades on {selectedDayTrades.date}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Click any trade to view complete journal details.
                </p>
              </div>
              <button
                onClick={() => setSelectedDayTrades(null)}
                className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-[2px] bg-gray-100 dark:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {selectedDayTrades.trades.map((t, idx) => {
                const r = parseFloat(t.r_multiple || 0);
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedTradeDetail(t)}
                    className="p-4 bg-gray-50 dark:bg-[#0b131d] border border-gray-200 dark:border-[#1f2c3b] rounded-[2px] flex items-center justify-between cursor-pointer hover:border-[#2f8df4] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-white dark:bg-[#1a1d24] border border-gray-200 dark:border-white/5 rounded-[2px] flex items-center justify-center text-xs font-bold text-gray-800 dark:text-white">
                        {t.asset?.substring(0, 2)}
                      </span>
                      <div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {t.asset} ·{" "}
                          <span
                            className={
                              t.direction === "LONG"
                                ? "text-emerald-500"
                                : "text-red-500"
                            }
                          >
                            {t.direction}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {t.setup} · {t.session} Session
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-2 py-1 text-[9px] font-bold uppercase tracking-widest rounded-[2px] border ${getResultPill(t.result)}`}
                      >
                        {t.result}
                      </span>
                      <div
                        className={`text-xs font-bold mt-1 ${r >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-red-600 dark:text-red-500"}`}
                      >
                        {r >= 0 ? "+" : ""}
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

      {/* Individual Trade Detail Modal (Reused from Past Trades) */}
      {selectedTradeDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedTradeDetail(null)}
          ></div>
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-[2px] shadow-2xl flex flex-col scrollbar-hide">
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-white dark:bg-[#121418] border-b border-gray-200 dark:border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[2px] bg-gray-100 dark:bg-[#1a1d24] border border-gray-200 dark:border-white/5 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-[#2f8df4]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedTradeDetail.asset} ({selectedTradeDetail.direction}
                    )
                  </h2>
                  <p className="text-xs text-gray-500">
                    {selectedTradeDetail.date} at {selectedTradeDetail.time} ·{" "}
                    {selectedTradeDetail.session} Session
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTradeDetail(null)}
                className="p-2 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-white rounded-[2px]"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-6 bg-gray-50 dark:bg-[#0a0a0a]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#121418] p-4 rounded-[2px] border border-gray-200 dark:border-white/5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                    Setup
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {selectedTradeDetail.setup}
                  </span>
                </div>
                <div className="bg-white dark:bg-[#121418] p-4 rounded-[2px] border border-gray-200 dark:border-white/5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                    Result
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-[2px] border ${getResultPill(selectedTradeDetail.result)}`}
                  >
                    {selectedTradeDetail.result}
                  </span>
                </div>
                <div className="bg-white dark:bg-[#121418] p-4 rounded-[2px] border border-gray-200 dark:border-white/5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                    Net R
                  </span>
                  <span
                    className={`text-sm font-bold ${parseFloat(selectedTradeDetail.r_multiple) >= 0 ? "text-emerald-500" : "text-red-500"}`}
                  >
                    {parseFloat(selectedTradeDetail.r_multiple || 0).toFixed(2)}
                    R
                  </span>
                </div>
                <div className="bg-white dark:bg-[#121418] p-4 rounded-[2px] border border-gray-200 dark:border-white/5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                    Risk %
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {selectedTradeDetail.risk}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-[#121418] p-5 rounded-[2px] border border-gray-200 dark:border-white/5">
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-2">
                    Analysis
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {selectedTradeDetail.reason || "No analysis recorded."}
                  </p>
                </div>
                <div className="bg-white dark:bg-[#121418] p-5 rounded-[2px] border border-gray-200 dark:border-white/5">
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-2">
                    Lesson
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {selectedTradeDetail.lesson || "No lesson recorded."}
                  </p>
                </div>
              </div>

              {selectedTradeDetail.images &&
                selectedTradeDetail.images.length > 0 && (
                  <div className="bg-white dark:bg-[#121418] p-5 rounded-[2px] border border-gray-200 dark:border-white/5">
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-4">
                      Charts
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {selectedTradeDetail.images.map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt="Trade Chart"
                          className="w-full h-40 object-cover rounded-[2px] border border-gray-200 dark:border-white/10"
                        />
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
