import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, X, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import { normalizeTradeR, isTradeWin } from "../../pages/Dashboard.jsx";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function MonthlyPnlCalendar({ trades = [], onTradeClick }) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDayInfo, setSelectedDayInfo] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Group trades by date string "YYYY-MM-DD"
  const tradesByDate = useMemo(() => {
    const map = {};
    trades.forEach((t) => {
      const d = t.entry_date || t.date;
      if (!d) return;
      // Extract YYYY-MM-DD
      const dateKey = d.slice(0, 10);
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(t);
    });
    return map;
  }, [trades]);

  // Compute monthly P&L for current month
  const monthlyStats = useMemo(() => {
    let netR = 0;
    let netPnl = 0;
    let hasPnl = false;
    let tradedDays = 0;

    const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    Object.keys(tradesByDate).forEach((key) => {
      if (key.startsWith(prefix)) {
        tradedDays++;
        const dayTrades = tradesByDate[key];
        dayTrades.forEach((t) => {
          netR += normalizeTradeR(t);
          if (t.pnl !== null && t.pnl !== undefined) {
            netPnl += Number(t.pnl);
            hasPnl = true;
          }
        });
      }
    });

    const displayVal = hasPnl
      ? `${netPnl >= 0 ? "+" : ""}$${Math.abs(netPnl).toFixed(2)}`
      : `${netR >= 0 ? "+" : ""}${netR.toFixed(2)}R`;

    return { netR, netPnl, displayVal, tradedDays };
  }, [tradesByDate, year, month]);

  // Build calendar weeks (8 columns: M, T, W, T, F, S, S, Weekly)
  const calendarWeeks = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    // Sunday is 0; Monday should be 0 in Europe/TradeFXBook (M, T, W, T, F, S, S)
    const dayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0, Sunday = 6
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const weeks = [];
    let currentWeek = [];

    // Pad previous month days in first week
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = dayOfWeek - 1; i >= 0; i--) {
      currentWeek.push({
        dayNumber: prevMonthDays - i,
        isCurrentMonth: false,
        dateKey: null,
      });
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayTrades = tradesByDate[dateKey] || [];

      let dayR = 0;
      let dayPnl = 0;
      let hasPnl = false;
      dayTrades.forEach((t) => {
        dayR += normalizeTradeR(t);
        if (t.pnl !== null && t.pnl !== undefined) {
          dayPnl += Number(t.pnl);
          hasPnl = true;
        }
      });

      currentWeek.push({
        dayNumber: day,
        isCurrentMonth: true,
        dateKey,
        trades: dayTrades,
        netR: dayR,
        netPnl: dayPnl,
        hasPnl,
        hasTrades: dayTrades.length > 0,
        isProfit: hasPnl ? dayPnl > 0 : dayR > 0,
        isLoss: hasPnl ? dayPnl < 0 : dayR < 0,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Pad last week if incomplete
    if (currentWeek.length > 0) {
      let nextDay = 1;
      while (currentWeek.length < 7) {
        currentWeek.push({
          dayNumber: nextDay++,
          isCurrentMonth: false,
          dateKey: null,
        });
      }
      weeks.push(currentWeek);
    }

    // Calculate weekly summary for each week row
    return weeks.map((week) => {
      let weekR = 0;
      let weekPnl = 0;
      let hasPnl = false;
      let tradedDaysCount = 0;

      week.forEach((d) => {
        if (d.isCurrentMonth && d.hasTrades) {
          tradedDaysCount++;
          weekR += d.netR;
          if (d.hasPnl) {
            weekPnl += d.netPnl;
            hasPnl = true;
          }
        }
      });

      const weeklyDisplay = hasPnl
        ? `${weekPnl >= 0 ? "+" : ""}$${Math.abs(weekPnl).toFixed(0)}`
        : weekR === 0
        ? "$0"
        : `${weekR >= 0 ? "+" : ""}${weekR.toFixed(1)}R`;

      return {
        days: week,
        weeklyStat: {
          display: weeklyDisplay,
          tradedDays: tradedDaysCount,
          isProfit: hasPnl ? weekPnl > 0 : weekR > 0,
          isLoss: hasPnl ? weekPnl < 0 : weekR < 0,
        },
      };
    });
  }, [year, month, tradesByDate]);

  const todayStr = useMemo(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  }, []);

  return (
    <div className="rounded-3xl p-6 bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col justify-between h-full relative">
      {/* ── CARD HEADER (Screenshot 1 & 3) ── */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <h2 className="text-[15px] font-bold text-neutral-900 dark:text-white">
          Monthly P&L
        </h2>

        <div className="flex items-center gap-2">
          {/* Monthly Value Badge */}
          <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-neutral-100 dark:bg-white/[0.06] text-neutral-700 dark:text-neutral-300">
            Monthly: <span className={monthlyStats.netR >= 0 ? "text-blue-600 dark:text-blue-400 font-bold" : "text-rose-600 dark:text-rose-400 font-bold"}>{monthlyStats.displayVal}</span>
          </span>

          {/* Month Navigation: < October 2026 > */}
          <div className="flex items-center rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-neutral-50 dark:bg-white/[0.03] p-0.5">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/[0.08] transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 px-2 min-w-[95px] text-center select-none">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/[0.08] transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 8-COLUMN CALENDAR GRID (Screenshot 1 & 3) ── */}
      <div className="space-y-1.5 flex-1">
        {/* Column Headers (M T W T F S S Weekly) */}
        <div className="grid grid-cols-8 gap-1.5 text-center mb-1">
          {["M", "T", "W", "T", "F", "S", "S"].map((col, idx) => (
            <div key={idx} className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 py-1">
              {col}
            </div>
          ))}
          <div className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 py-1">
            Weekly
          </div>
        </div>

        {/* Rows of Weeks */}
        {calendarWeeks.map((weekObj, wIdx) => (
          <div key={wIdx} className="grid grid-cols-8 gap-1.5">
            {/* 7 Days */}
            {weekObj.days.map((d, dIdx) => {
              const isTodayCell = d.dateKey === todayStr;

              return (
                <div
                  key={dIdx}
                  onClick={() => {
                    if (d.isCurrentMonth && d.hasTrades) {
                      setSelectedDayInfo(d);
                    }
                  }}
                  className={`min-h-[46px] rounded-xl p-1.5 flex flex-col justify-between transition-all select-none ${
                    d.isCurrentMonth
                      ? d.hasTrades
                        ? "bg-neutral-100/90 dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.1] hover:border-blue-500/50 hover:shadow-sm cursor-pointer"
                        : "bg-neutral-50/70 dark:bg-white/[0.02] border border-black/[0.03] dark:border-white/[0.04]"
                      : "opacity-25 bg-transparent border border-transparent"
                  }`}
                >
                  {/* Day Number */}
                  <span
                    className={`text-[11px] leading-none font-semibold ${
                      d.isCurrentMonth
                        ? "text-neutral-700 dark:text-neutral-300"
                        : "text-neutral-400 dark:text-neutral-600"
                    }`}
                  >
                    {d.dayNumber}
                  </span>

                  {/* Day Status Indicators (Screenshots 1 & 3) */}
                  <div className="flex items-center justify-center gap-1 mt-auto">
                    {/* Today indicator: small blue dot under day number */}
                    {isTodayCell && !d.hasTrades && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block shadow-sm" />
                    )}

                    {/* Trade Result Dot: Blue for profit, Red for loss */}
                    {d.hasTrades && (
                      <div className="flex items-center gap-1">
                        <span
                          className={`w-2 h-2 rounded-full inline-block ${
                            d.isProfit
                              ? "bg-blue-600 dark:bg-blue-400 shadow-sm shadow-blue-500/50"
                              : "bg-rose-500 dark:bg-rose-400 shadow-sm shadow-rose-500/50"
                          }`}
                        />
                        <span
                          className={`text-[10px] font-bold font-mono hidden md:inline-block ${
                            d.isProfit
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {d.netR >= 0 ? "+" : ""}{d.netR.toFixed(1)}R
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* 8th Column: Weekly Summary Card (Screenshot 1 & 3) */}
            <div className="min-h-[46px] rounded-xl p-1.5 bg-neutral-100/60 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.05] flex flex-col justify-center items-center text-center">
              <span className="text-[9px] font-extrabold uppercase tracking-tight text-neutral-400 dark:text-neutral-500">
                Weekly
              </span>
              <span
                className={`text-[11px] font-bold font-mono my-0.5 ${
                  weekObj.weeklyStat.isProfit
                    ? "text-blue-600 dark:text-blue-400"
                    : weekObj.weeklyStat.isLoss
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-neutral-600 dark:text-neutral-400"
                }`}
              >
                {weekObj.weeklyStat.display}
              </span>
              <span className="text-[9px] text-neutral-400 dark:text-neutral-500 leading-none">
                Traded Days {weekObj.weeklyStat.tradedDays}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── BOTTOM LEGEND (Screenshot 1 & 3) ── */}
      <div className="mt-4 pt-3 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center justify-center gap-6 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 inline-block" />
          <span>Profit</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 dark:bg-rose-400 inline-block" />
          <span>Loss</span>
        </div>
      </div>

      {/* ── DAY TRADES MODAL/POPOVER ON CLICK ── */}
      {selectedDayInfo && (
        <div className="absolute inset-0 z-20 rounded-3xl bg-white/95 dark:bg-[#121622]/95 backdrop-blur-md p-5 flex flex-col animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Trades for {selectedDayInfo.dateKey}
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Net Day Performance:{" "}
                <span className={selectedDayInfo.isProfit ? "text-blue-600 font-bold" : "text-rose-500 font-bold"}>
                  {selectedDayInfo.netR >= 0 ? "+" : ""}{selectedDayInfo.netR.toFixed(2)}R
                </span>
              </p>
            </div>
            <button
              onClick={() => setSelectedDayInfo(null)}
              className="p-1 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.08] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-3 space-y-2 scrollbar-thin">
            {selectedDayInfo.trades.map((t, idx) => {
              const r = normalizeTradeR(t);
              const isWin = isTradeWin(t);

              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (onTradeClick) onTradeClick(t);
                  }}
                  className="p-3 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-neutral-50 dark:bg-white/[0.03] hover:border-blue-500/30 transition-all flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl ${
                        t.direction === "LONG"
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                          : "bg-rose-500/10 text-rose-500 dark:text-rose-400"
                      }`}
                    >
                      {t.direction === "LONG" ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-neutral-900 dark:text-white">
                          {t.asset}
                        </span>
                        <span className="text-[10px] uppercase font-semibold text-neutral-500">
                          {t.direction}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-neutral-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {t.time || t.entry_time || "12:00"}
                        </span>
                        {t.setup && <span>• {t.setup}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs font-bold font-mono px-2 py-0.5 rounded-lg ${
                        isWin
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {r >= 0 ? "+" : ""}{r.toFixed(2)}R
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
