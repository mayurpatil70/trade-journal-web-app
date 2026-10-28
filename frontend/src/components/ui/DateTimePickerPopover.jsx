import { useState, useRef, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Clock,
  Check,
  X,
} from "lucide-react";

/**
 * Format a Date object to "Oct 28, 2026 1:24 PM" format matching TradeFXBook
 */
export function formatTradeFXDateTime(dateObj) {
  if (!dateObj || !(dateObj instanceof Date) || isNaN(dateObj.getTime())) return "";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const m = months[dateObj.getMonth()];
  const d = dateObj.getDate();
  const y = dateObj.getFullYear();

  let hours = dateObj.getHours();
  const minutes = dateObj.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;

  return `${m} ${d}, ${y} ${hours}:${minutes} ${ampm}`;
}

export function formatTradeFXDateOnly(dateObj) {
  if (!dateObj || !(dateObj instanceof Date) || isNaN(dateObj.getTime())) return "";
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const m = months[dateObj.getMonth()];
  const d = dateObj.getDate();
  const y = dateObj.getFullYear();

  const suffix = ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10] || "th";
  return `${m} ${d}${suffix}, ${y}`;
}

export default function DateTimePickerPopover({
  value,
  onChange,
  placeholder = "Optional",
  label = "",
  disabled = false,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState("date"); // "date" | "time"
  const popoverRef = useRef(null);

  const parsedDate = useMemo(() => {
    if (!value) return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }, [value]);

  const [selectedDate, setSelectedDate] = useState(() => parsedDate || new Date());
  const [navMonthDate, setNavMonthDate] = useState(() => parsedDate || new Date());

  const hours24 = selectedDate.getHours();
  const currentHour12 = hours24 % 12 || 12;
  const currentMinute = selectedDate.getMinutes();
  const currentAmPm = hours24 >= 12 ? "PM" : "AM";

  useEffect(() => {
    if (parsedDate) {
      setSelectedDate(parsedDate);
      setNavMonthDate(parsedDate);
    }
  }, [parsedDate]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
        setViewMode("date");
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const navYear = navMonthDate.getFullYear();
  const navMonth = navMonthDate.getMonth();
  const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setNavMonthDate(new Date(navYear, navMonth - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setNavMonthDate(new Date(navYear, navMonth + 1, 1));
  };

  const calendarDays = useMemo(() => {
    const firstDay = new Date(navYear, navMonth, 1);
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday
    const daysInCurrentMonth = new Date(navYear, navMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(navYear, navMonth, 0).getDate();

    const days = [];

    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        dayNumber: daysInPrevMonth - i,
        isCurrentMonth: false,
        date: new Date(navYear, navMonth - 1, daysInPrevMonth - i),
      });
    }

    for (let i = 1; i <= daysInCurrentMonth; i++) {
      days.push({
        dayNumber: i,
        isCurrentMonth: true,
        date: new Date(navYear, navMonth, i),
      });
    }

    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        dayNumber: i,
        isCurrentMonth: false,
        date: new Date(navYear, navMonth + 1, i),
      });
    }

    return days;
  }, [navYear, navMonth]);

  const handlePresetNow = () => {
    const now = new Date();
    setSelectedDate(now);
    setNavMonthDate(now);
    onChange(now);
    setViewMode("time");
  };

  const handlePresetYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setSelectedDate(yesterday);
    setNavMonthDate(yesterday);
    onChange(yesterday);
    setViewMode("time");
  };

  const handleClear = () => {
    onChange(null);
    setIsOpen(false);
    setViewMode("date");
  };

  const handleSelectDay = (dayObj) => {
    const newDate = new Date(dayObj.date);
    newDate.setHours(selectedDate.getHours());
    newDate.setMinutes(selectedDate.getMinutes());
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);
    setSelectedDate(newDate);
    onChange(newDate);
    setViewMode("time");
  };

  const adjustHour = (delta) => {
    const updated = new Date(selectedDate);
    let h = updated.getHours() + delta;
    if (h < 0) h = 23;
    if (h > 23) h = 0;
    updated.setHours(h);
    setSelectedDate(updated);
    onChange(updated);
  };

  const adjustMinute = (delta) => {
    const updated = new Date(selectedDate);
    let m = updated.getMinutes() + delta;
    if (m < 0) m = 59;
    if (m > 59) m = 0;
    updated.setMinutes(m);
    setSelectedDate(updated);
    onChange(updated);
  };

  const toggleAmPm = () => {
    const updated = new Date(selectedDate);
    const h = updated.getHours();
    if (h >= 12) {
      updated.setHours(h - 12);
    } else {
      updated.setHours(h + 12);
    }
    setSelectedDate(updated);
    onChange(updated);
  };

  const isToday = (d) => {
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (d) => {
    if (!parsedDate && !value) return false;
    return (
      d.getDate() === selectedDate.getDate() &&
      d.getMonth() === selectedDate.getMonth() &&
      d.getFullYear() === selectedDate.getFullYear()
    );
  };

  const formattedDisplayText = parsedDate ? formatTradeFXDateTime(parsedDate) : "";

  return (
    <div className={`relative ${className}`} ref={popoverRef}>
      {label && (
        <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}

      {/* Input Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-11 px-3.5 rounded-xl border flex items-center justify-between text-left transition-all ${
          isOpen
            ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-white dark:bg-[#121622]"
            : "border-black/[0.08] dark:border-white/[0.12] bg-white/70 dark:bg-white/[0.04] hover:border-black/20 dark:hover:border-white/20"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <CalendarIcon className="w-4 h-4 text-neutral-400 dark:text-neutral-500 shrink-0" />
          <span
            className={`text-sm truncate ${
              formattedDisplayText
                ? "font-medium text-neutral-900 dark:text-neutral-100"
                : "text-neutral-400 dark:text-neutral-500"
            }`}
          >
            {formattedDisplayText || placeholder}
          </span>
        </div>
        {formattedDisplayText && !disabled && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-md transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-[9999] w-[320px] rounded-3xl bg-white dark:bg-[#121622] border border-black/[0.08] dark:border-white/[0.12] shadow-[0_20px_60px_rgba(0,0,0,0.18)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.7)] backdrop-blur-2xl p-4 animate-in fade-in zoom-in-95 duration-150 select-none">
          {viewMode === "date" ? (
            /* ──────── DATE SELECTION VIEW ──────── */
            <div>
              {/* Presets Row: Now, Yesterday, Clear */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <button
                  type="button"
                  onClick={handlePresetNow}
                  className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-neutral-100 dark:bg-white/[0.06] hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-400 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer text-center"
                >
                  Now
                </button>
                <button
                  type="button"
                  onClick={handlePresetYesterday}
                  className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-neutral-100 dark:bg-white/[0.06] hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-400 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer text-center"
                >
                  Yesterday
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-neutral-100 dark:bg-white/[0.06] hover:bg-rose-500/10 hover:text-rose-600 dark:hover:bg-rose-500/20 dark:hover:text-rose-400 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer text-center"
                >
                  Clear
                </button>
              </div>

              {/* Month Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.08] transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold text-neutral-900 dark:text-white">
                  {monthNamesShort[navMonth]} {navYear}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.08] transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Weekday Names Header */}
              <div className="grid grid-cols-7 mb-2 text-center">
                {["SU", "MO", "TU", "WE", "TH", "FR", "SA"].map((d) => (
                  <span key={d} className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500">
                    {d}
                  </span>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-y-1 text-center">
                {calendarDays.map((dObj, idx) => {
                  const sel = isSelected(dObj.date);
                  const tod = isToday(dObj.date);

                  return (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => handleSelectDay(dObj)}
                      className={`relative w-8 h-8 mx-auto flex items-center justify-center text-xs font-semibold rounded-full transition-all cursor-pointer ${
                        sel
                          ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30 font-bold"
                          : dObj.isCurrentMonth
                          ? "text-neutral-800 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10"
                          : "text-neutral-300 dark:text-neutral-600 hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      <span>{dObj.dayNumber}</span>
                      {tod && !sel && (
                        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Adjust time footer */}
              {parsedDate && (
                <div className="mt-3 pt-2.5 border-t border-black/[0.06] dark:border-white/[0.08] flex justify-end">
                  <button
                    type="button"
                    onClick={() => setViewMode("time")}
                    className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5" /> Adjust Time
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ──────── TIME SELECTION VIEW ──────── */
            <div>
              {/* Back to Calendar Header */}
              <button
                type="button"
                onClick={() => setViewMode("date")}
                className="flex items-center gap-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mb-3 cursor-pointer"
              >
                <div className="p-1 rounded-lg border border-black/[0.08] dark:border-white/[0.1] bg-neutral-50 dark:bg-white/[0.04]">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </div>
                <CalendarIcon className="w-3.5 h-3.5 text-neutral-400" />
                <span>{formatTradeFXDateOnly(selectedDate)}</span>
              </button>

              <div className="border-t border-black/[0.06] dark:border-white/[0.08] my-3" />

              {/* Subtitle */}
              <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-4">
                <Clock className="w-3.5 h-3.5" />
                <span>Set Time</span>
              </div>

              {/* Hour & Minute Spinners with AM/PM Pill */}
              <div className="flex items-center justify-center gap-4 py-2">
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => adjustHour(1)}
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <span className="text-3xl font-extrabold font-mono text-neutral-900 dark:text-white my-1 tracking-tight">
                    {currentHour12.toString().padStart(2, "0")}
                  </span>
                  <button
                    type="button"
                    onClick={() => adjustHour(-1)}
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                <span className="text-2xl font-bold text-neutral-400 dark:text-neutral-500 pb-2">:</span>

                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => adjustMinute(1)}
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <span className="text-3xl font-extrabold font-mono text-neutral-900 dark:text-white my-1 tracking-tight">
                    {currentMinute.toString().padStart(2, "0")}
                  </span>
                  <button
                    type="button"
                    onClick={() => adjustMinute(-1)}
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                <div className="ml-2">
                  <button
                    type="button"
                    onClick={toggleAmPm}
                    className="px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.12] bg-neutral-100 dark:bg-white/[0.06] hover:bg-neutral-200 dark:hover:bg-white/[0.12] text-xs font-bold text-neutral-800 dark:text-neutral-200 transition-colors shadow-sm cursor-pointer"
                  >
                    {currentAmPm}
                  </button>
                </div>
              </div>

              {/* Done Button */}
              <button
                type="button"
                onClick={() => {
                  onChange(selectedDate);
                  setIsOpen(false);
                  setViewMode("date");
                }}
                className="w-full mt-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-2xl transition-all shadow-md shadow-emerald-500/25 active:scale-[0.98] flex items-center justify-center gap-1.5 text-sm cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[2.5]" /> Done
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
