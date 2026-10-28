import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, X, Calendar, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { normalizeTradeR, isTradeWin } from "../../pages/Dashboard.jsx";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Helper to convert any date representation to Indian Standard Time (Asia/Kolkata) "YYYY-MM-DD"
export function getIndianDateKey(rawDate) {
  if (!rawDate) return null;
  if (typeof rawDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    return rawDate;
  }
  try {
    const dObj = new Date(rawDate);
    if (isNaN(dObj.getTime())) return String(rawDate).slice(0, 10);
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(dObj);
  } catch {
    return String(rawDate).slice(0, 10);
  }
}

export default function MonthlyPnlCalendar({ trades = [], onTradeClick }) {
  // Live Indian Standard Time today reference
  const indianTodayObj = useMemo(() => {
    try {
      const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const [y, m, d] = formatter.format(new Date()).split("-").map(Number);
      return {
        dateKey: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        year: y,
        month: m - 1, // 0-indexed month
        day: d,
      };
    } catch {
      const d = new Date();
      return {
        dateKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
        year: d.getFullYear(),
        month: d.getMonth(),
        day: d.getDate(),
      };
    }
  }, []);

  // Currently viewed month/year in calendar
  const [currentDate, setCurrentDate] = useState(() => {
    try {
      const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const [y, m] = formatter.format(new Date()).split("-").map(Number);
      return new Date(y, m - 1, 1);
    } catch {
      const d = new Date();
      return new Date(d.getFullYear(), d.getMonth(), 1);
    }
  });

  const [selectedDayInfo, setSelectedDayInfo] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleJumpToToday = () => {
    setCurrentDate(new Date(indianTodayObj.year, indianTodayObj.month, 1));
  };

  const handleYearChange = (e) => {
    const selectedYear = parseInt(e.target.value, 10);
    if (!isNaN(selectedYear)) {
      setCurrentDate(new Date(selectedYear, month, 1));
    }
  };

  // Group trades accurately by Indian Date Key "YYYY-MM-DD"
  const tradesByDate = useMemo(() => {
    const map = {};
    trades.forEach((t) => {
      const d = t.entry_date || t.date || t.created_at;
      if (!d) return;
      const dateKey = getIndianDateKey(d);
      if (!dateKey) return;
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(t);
    });
    return map;
  }, [trades]);

  // Extract all unique trade years for multi-year navigation synchronization
  const availableYears = useMemo(() => {
    const set = new Set();
    const currentY = indianTodayObj.year;
    // Base standard window
    for (let y = currentY - 3; y <= currentY + 3; y++) {
      set.add(y);
    }
    // Also include any years from actual logged trades
    Object.keys(tradesByDate).forEach((key) => {
      const y = parseInt(key.slice(0, 4), 10);
      if (!isNaN(y)) set.add(y);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [tradesByDate, indianTodayObj.year]);

  // Compute monthly P&L for currently viewed month across all years
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

  // Build calendar weeks using real Indian standard (Sunday = 0, Saturday = 6)
  // Headers: Sun, Mon, Tue, Wed, Thu, Fri, Sat, Weekly
  const calendarWeeks = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    // Indian calendar standard: Week starts on SUNDAY (0 = Sun, 1 = Mon, ..., 6 = Sat)
    const dayOfWeek = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const weeks = [];
    let currentWeek = [];

    // Pad previous month days in first week
    const prevMonthDays = new Date(year, month, 0).getDate();
    const prevYear = month === 0 ? year - 1 : year;
    const prevMonthNum = month === 0 ? 12 : month;

    for (let i = dayOfWeek - 1; i >= 0; i--) {
      const pDay = prevMonthDays - i;
      const dateKey = `${prevYear}-${String(prevMonthNum).padStart(2, "0")}-${String(pDay).padStart(2, "0")}`;
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
        dayNumber: pDay,
        isCurrentMonth: false,
        dateKey,
        trades: dayTrades,
        netR: dayR,
        netPnl: dayPnl,
        hasPnl,
        hasTrades: dayTrades.length > 0,
        isProfit: hasPnl ? dayPnl > 0 : dayR > 0,
        isLoss: hasPnl ? dayPnl < 0 : dayR < 0,
      });
    }

    // Days in current month (October 31, 2026 lands accurately on Saturday / Sat column)
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

    // Pad last week with next month days if incomplete
    if (currentWeek.length > 0) {
      let nextDay = 1;
      const nextYear = month === 11 ? year + 1 : year;
      const nextMonthNum = month === 11 ? 1 : month + 2;

      while (currentWeek.length < 7) {
        const dateKey = `${nextYear}-${String(nextMonthNum).padStart(2, "0")}-${String(nextDay).padStart(2, "0")}`;
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
          dayNumber: nextDay++,
          isCurrentMonth: false,
          dateKey,
          trades: dayTrades,
          netR: dayR,
          netPnl: dayPnl,
          hasPnl,
          hasTrades: dayTrades.length > 0,
          isProfit: hasPnl ? dayPnl > 0 : dayR > 0,
          isLoss: hasPnl ? dayPnl < 0 : dayR < 0,
        });
      }
      weeks.push(currentWeek);
    }

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

  return (
    <div className="rounded-3xl p-6 bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col justify-between h-full relative">
      {/* ── CARD HEADER ── */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-[15px] font-bold text-neutral-900 dark:text-white">
            Monthly P&L
          </h2>
          <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500">
            Indian Standard Calendar
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Monthly Value Badge */}
          <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-neutral-100 dark:bg-white/[0.06] text-neutral-700 dark:text-neutral-300">
            Monthly:{" "}
            <span
              className={
                monthlyStats.netR >= 0
                  ? "text-emerald-500 dark:text-emerald-400 font-bold font-mono"
                  : "text-rose-500 dark:text-rose-400 font-bold font-mono"
              }
            >
              {monthlyStats.displayVal}
            </span>
          </span>

          {/* Quick Jump to Today Button */}
          <button
            type="button"
            onClick={handleJumpToToday}
            className="px-2.5 py-1 text-xs font-bold rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-neutral-50 dark:bg-white/[0.03] hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 text-neutral-600 dark:text-neutral-300 transition-all cursor-pointer flex items-center gap-1 shadow-xs active:scale-95"
            title="Jump to Current Indian Month & Date"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Today</span>
          </button>

          {/* Month & Year Navigation with Year Selector */}
          <div className="flex items-center rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-neutral-50 dark:bg-white/[0.03] p-0.5">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 px-1 min-w-[75px] text-center select-none">
              {monthNames[month]}
            </span>
            {/* Year Selector Dropdown for all years */}
            <select
              value={year}
              onChange={handleYearChange}
              className="bg-transparent text-xs font-bold text-neutral-800 dark:text-neutral-200 pr-1 cursor-pointer focus:outline-none"
            >
              {availableYears.map((y) => (
                <option key={y} value={y} className="bg-white dark:bg-[#121622] text-neutral-900 dark:text-white">
                  {y}
                </option>
              ))}
            </select>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 8-COLUMN CALENDAR GRID (Real Indian Standard: Sun to Sat + Weekly) ── */}
      <div className="space-y-1.5 flex-1">
        {/* Column Headers: Sun, Mon, Tue, Wed, Thu, Fri, Sat, Weekly */}
        <div className="grid grid-cols-8 gap-1.5 text-center mb-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((col, idx) => (
            <div
              key={idx}
              className={`text-[11px] font-bold py-1 select-none ${
                idx === 0 || idx === 6
                  ? "text-neutral-400 dark:text-neutral-400 font-extrabold"
                  : "text-neutral-500 dark:text-neutral-400"
              }`}
            >
              {col}
            </div>
          ))}
          <div className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 py-1 select-none">
            Weekly
          </div>
        </div>

        {/* Rows of Weeks with elevated hover effects matching top cards */}
        {calendarWeeks.map((weekObj, wIdx) => (
          <div key={wIdx} className="grid grid-cols-8 gap-1.5">
            {/* 7 Days: each card equipped with tactile hover elevation */}
            {weekObj.days.map((d, dIdx) => {
              const isTodayCell = d.dateKey === indianTodayObj.dateKey;

              return (
                <div
                  key={dIdx}
                  onClick={() => setSelectedDayInfo(d)}
                  className={`min-h-[48px] rounded-2xl p-1.5 flex flex-col justify-between transition-all duration-200 select-none cursor-pointer ${
                    d.isCurrentMonth
                      ? isTodayCell
                        ? "ring-2 ring-emerald-500 dark:ring-emerald-400 bg-emerald-500/[0.12] dark:bg-emerald-500/[0.18] border border-emerald-500/50 shadow-md shadow-emerald-500/15 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/25 hover:scale-[1.07] active:scale-95"
                        : d.hasTrades
                        ? d.isProfit
                          ? "bg-emerald-500/[0.08] dark:bg-emerald-500/[0.14] border border-emerald-500/35 hover:border-emerald-500 hover:bg-emerald-500/[0.16] dark:hover:bg-emerald-500/[0.22] hover:shadow-lg hover:shadow-emerald-500/20 hover:scale-[1.06] active:scale-95"
                          : "bg-rose-500/[0.08] dark:bg-rose-500/[0.14] border border-rose-500/35 hover:border-rose-500 hover:bg-rose-500/[0.16] dark:hover:bg-rose-500/[0.22] hover:shadow-lg hover:shadow-rose-500/20 hover:scale-[1.06] active:scale-95"
                        : "bg-neutral-50/80 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-emerald-500/60 dark:hover:border-emerald-400/60 hover:bg-white dark:hover:bg-white/[0.08] hover:shadow-lg hover:shadow-emerald-500/10 hover:scale-[1.05] active:scale-95"
                      : "bg-neutral-50/30 dark:bg-white/[0.015] border border-black/[0.04] dark:border-white/[0.04] text-neutral-400 dark:text-neutral-600 hover:border-emerald-500/30 dark:hover:border-emerald-400/30 hover:bg-neutral-100/70 dark:hover:bg-white/[0.05] hover:scale-[1.03] active:scale-95"
                  }`}
                >
                  {/* Day Number + Today Micro-badge */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-[11px] leading-none font-bold ${
                        isTodayCell
                          ? "text-emerald-600 dark:text-emerald-400 font-extrabold"
                          : d.isCurrentMonth
                          ? "text-neutral-800 dark:text-neutral-200"
                          : "text-neutral-400 dark:text-neutral-600"
                      }`}
                    >
                      {d.dayNumber}
                    </span>
                    {isTodayCell && (
                      <span className="text-[7px] font-extrabold uppercase px-1 py-0.2 rounded bg-emerald-500 text-white tracking-wider leading-tight shadow-xs">
                        TODAY
                      </span>
                    )}
                  </div>

                  {/* Day Status Indicators */}
                  <div className="flex items-center justify-center gap-1 mt-auto">
                    {/* Trade Result Dot + R value */}
                    {d.hasTrades ? (
                      <div className="flex items-center gap-1">
                        <span
                          className={`w-2 h-2 rounded-full inline-block ${
                            d.isProfit
                              ? "bg-emerald-500 dark:bg-emerald-400 shadow-sm shadow-emerald-500/50"
                              : "bg-rose-500 dark:bg-rose-400 shadow-sm shadow-rose-500/50"
                          }`}
                        />
                        <span
                          className={`text-[10px] font-bold font-mono hidden md:inline-block ${
                            d.isProfit
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {d.netR >= 0 ? "+" : ""}
                          {d.netR.toFixed(1)}R
                        </span>
                      </div>
                    ) : isTodayCell ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 inline-block animate-pulse" />
                    ) : null}
                  </div>
                </div>
              );
            })}

            {/* 8th Column: Weekly Summary Card with matching top-card elevated hover */}
            <div className="min-h-[48px] rounded-2xl p-1.5 bg-neutral-100/70 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] shadow-xs flex flex-col justify-center items-center text-center transition-all duration-200 hover:border-emerald-500/60 dark:hover:border-emerald-400/60 hover:bg-white dark:hover:bg-white/[0.08] hover:shadow-lg hover:shadow-emerald-500/10 hover:scale-[1.05] active:scale-95 cursor-default">
              <span className="text-[9px] font-extrabold uppercase tracking-tight text-neutral-400 dark:text-neutral-500">
                Weekly
              </span>
              <span
                className={`text-[11px] font-bold font-mono my-0.5 ${
                  weekObj.weeklyStat.isProfit
                    ? "text-emerald-600 dark:text-emerald-400"
                    : weekObj.weeklyStat.isLoss
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-neutral-600 dark:text-neutral-400"
                }`}
              >
                {weekObj.weeklyStat.display}
              </span>
              <span className="text-[9px] text-neutral-400 dark:text-neutral-500 leading-none">
                {weekObj.weeklyStat.tradedDays} {weekObj.weeklyStat.tradedDays === 1 ? "day" : "days"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── BOTTOM LEGEND ── */}
      <div className="mt-4 pt-3 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center justify-center gap-6 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 inline-block" />
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
                <span
                  className={
                    selectedDayInfo.isProfit
                      ? "text-emerald-500 font-bold font-mono"
                      : selectedDayInfo.isLoss
                      ? "text-rose-500 font-bold font-mono"
                      : "text-neutral-500 font-bold font-mono"
                  }
                >
                  {selectedDayInfo.netR >= 0 ? "+" : ""}
                  {selectedDayInfo.netR.toFixed(2)}R
                </span>
              </p>
            </div>
            <button
              onClick={() => setSelectedDayInfo(null)}
              className="p-1 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-3 space-y-2 scrollbar-thin">
            {!selectedDayInfo.trades || selectedDayInfo.trades.length === 0 ? (
              <div className="py-8 text-center text-neutral-400 dark:text-neutral-500">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-500" />
                <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  No trades logged on this date
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  Disciplined risk management on non-trading days!
                </p>
              </div>
            ) : (
              selectedDayInfo.trades.map((t, i) => {
                const r = normalizeTradeR(t);
                const isWin = isTradeWin(t);
                return (
                  <div
                    key={i}
                    onClick={() => {
                      if (onTradeClick) onTradeClick(t);
                    }}
                    className="p-3 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between hover:border-emerald-500/30 hover:scale-[1.01] transition-all cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          t.direction === "LONG" ? "bg-emerald-500" : "bg-rose-500"
                        }`}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-neutral-900 dark:text-white">
                            {t.asset || "Trade"}
                          </span>
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border ${
                              t.direction === "LONG"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                            }`}
                          >
                            {t.direction}
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-400">
                          {t.entry_time || t.time || "Trade execution"}
                          {t.setup ? ` · ${t.setup}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs font-bold font-mono px-2 py-0.5 rounded-lg ${
                          isWin
                            ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                            : "text-rose-600 dark:text-rose-400 bg-rose-500/10"
                        }`}
                      >
                        {r >= 0 ? "+" : ""}
                        {r.toFixed(2)}R
                      </span>
                      {t.pnl !== null && t.pnl !== undefined && (
                        <p className="text-[10px] font-mono text-neutral-400 mt-0.5">
                          {Number(t.pnl) >= 0 ? "+" : ""}${Number(t.pnl).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
