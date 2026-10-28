import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  X,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Clock,
  Maximize2,
  Minimize2,
  Search,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Info,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const HOUR = 3600_000;
// Trading day runs 3:30 AM to 2:30 AM IST (22:00 to 21:00 UTC next day).
const DAY_START_UTC_HOUR = 22;

const getTradingDay = (now = Date.now()) => {
  const d = new Date(now);
  let start = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), DAY_START_UTC_HOUR);
  if (start > now) start -= 24 * HOUR;
  return { start, end: start + 24 * HOUR, now };
};

const sessionOf = (ts) => {
  const h = new Date(ts).getUTCHours();
  if (h >= 22 || h < 7) return "Asian";
  if (h < 13) return "London";
  return "New York";
};

// Forex Factory Iconic Folder Graphic
function ImpactFolder({ impact, className = "w-4 h-4" }) {
  const imp = String(impact || "").toLowerCase();
  if (imp === "high") {
    return (
      <span title="High Impact (Red Folder)" className="inline-flex items-center justify-center shrink-0">
        <svg className={className} viewBox="0 0 24 24" fill="#ef4444" stroke="#b91c1c" strokeWidth="1.2">
          <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      </span>
    );
  }
  if (imp === "medium") {
    return (
      <span title="Medium Impact (Orange Folder)" className="inline-flex items-center justify-center shrink-0">
        <svg className={className} viewBox="0 0 24 24" fill="#f97316" stroke="#c2410c" strokeWidth="1.2">
          <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      </span>
    );
  }
  if (imp === "low") {
    return (
      <span title="Low Impact (Yellow Folder)" className="inline-flex items-center justify-center shrink-0">
        <svg className={className} viewBox="0 0 24 24" fill="#eab308" stroke="#a16207" strokeWidth="1.2">
          <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      </span>
    );
  }
  return (
    <span title="Non-economic / Holiday" className="inline-flex items-center justify-center shrink-0 opacity-60">
      <svg className={className} viewBox="0 0 24 24" fill="#9ca3af" stroke="#4b5563" strokeWidth="1.2">
        <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    </span>
  );
}

// News Impact Analyzer
function analyzeNewsImpact(e) {
  if (!e) return null;
  const actualStr = String(e.actual || "").trim();
  const forecastStr = String(e.forecast || "").trim();

  const parseVal = (str) => {
    if (!str) return null;
    const num = parseFloat(str.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(num) ? num : null;
  };

  const actVal = parseVal(actualStr);
  const fcVal = parseVal(forecastStr);
  const isInverse = /\b(unemployment|jobless|claims)\b/i.test(e.title || "");

  let bias = "Pending Release";
  let color = "text-neutral-500 dark:text-neutral-400";
  let badgeBg = "bg-neutral-500/10 text-neutral-600 dark:text-neutral-300 border-neutral-500/20";
  let explanation = "";

  if (actVal !== null && fcVal !== null) {
    if (actVal > fcVal) {
      bias = isInverse ? "Bearish for " + e.country : "Bullish for " + e.country;
      color = isInverse ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400";
      badgeBg = isInverse
        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      explanation = `${e.country} ${e.title} printed higher than consensus (${actualStr} vs ${forecastStr} exp). Historically indicates ${isInverse ? "selling" : "buying"} pressure across ${e.country} pairs.`;
    } else if (actVal < fcVal) {
      bias = isInverse ? "Bullish for " + e.country : "Bearish for " + e.country;
      color = isInverse ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400";
      badgeBg = isInverse
        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
        : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
      explanation = `${e.country} ${e.title} printed below consensus (${actualStr} vs ${forecastStr} exp). Historically indicates ${isInverse ? "buying" : "selling"} pressure across ${e.country} pairs.`;
    } else {
      bias = "In-line with consensus";
      color = "text-amber-600 dark:text-amber-400";
      badgeBg = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      explanation = `${e.country} release came in exactly as forecasted (${actualStr}). Minimal fundamental deviation.`;
    }
  } else {
    bias = e.impact === "High" ? "High Volatility Release" : "Moderate Risk Event";
    color = e.impact === "High" ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400";
    badgeBg = e.impact === "High"
      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    explanation = `Major high-volatility event for ${e.country}. Expect rapid spread widening and slippage across major ${e.country} crosses (e.g. ${e.country === "USD" ? "EURUSD, GBPUSD, XAUUSD" : e.country + "/USD"}). Avoid market orders +/-15 mins of release.`;
  }

  return { bias, color, badgeBg, explanation };
}

export default function NotificationBell({ className }) {
  const [events, setEvents] = useState(() => {
    try {
      const cached = localStorage.getItem("forex_news_cache");
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    return [];
  });
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 16 });
  const [now, setNow] = useState(() => Date.now());
  const [activeTab, setActiveTab] = useState("all"); // "all" | "upcoming" | "completed"

  // Expanded View Controls
  const [expandedTimeRange, setExpandedTimeRange] = useState("today"); // "today" | "week"
  const [expandedImpactFilter, setExpandedImpactFilter] = useState("all"); // "all" | "High" | "Medium" | "Low"
  const [expandedCurrency, setExpandedCurrency] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);

  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Load news and refresh clock
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      api
        .get("/api/news")
        .then((res) => {
          if (!cancelled && res.data?.data && Array.isArray(res.data.data)) {
            setEvents(res.data.data);
            try {
              localStorage.setItem("forex_news_cache", JSON.stringify(res.data.data));
            } catch (_) {}
          }
        })
        .catch((err) => {
          console.warn("[NotificationBell] Failed to fetch live news:", err.message);
        });

    load();

    // Refetch news every 2 minutes
    const newsTimer = setInterval(load, 2 * 60_000);

    // Live clock ticker every 15 seconds to immediately decrement counter when event passes
    const clockTimer = setInterval(() => {
      setNow(Date.now());
    }, 15_000);

    return () => {
      cancelled = true;
      clearInterval(newsTimer);
      clearInterval(clockTimer);
    };
  }, []);

  // Update floating dropdown position anchored to button
  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const right = Math.max(16, window.innerWidth - rect.right);
    const top = rect.bottom + 8;
    setCoords({ top, right });
  }, []);

  // Handle outside click & window events
  useEffect(() => {
    if (!open) return;

    updatePosition();

    const handleOutsideClick = (e) => {
      // Don't close if expanded, to avoid accidental dismissals during analysis
      if (expanded) return;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (selectedEvent) {
          setSelectedEvent(null);
        } else if (expanded) {
          setExpanded(false);
        } else {
          setOpen(false);
        }
      }
    };

    window.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, expanded, selectedEvent, updatePosition]);

  // Clean event timestamp mapping
  const normalizedEvents = useMemo(() => {
    return (events || [])
      .map((e) => {
        const ts = new Date(e.date).getTime();
        return {
          ...e,
          ts,
          impact: e.impact || "Low",
        };
      })
      .filter((e) => Number.isFinite(e.ts))
      .sort((a, b) => a.ts - b.ts);
  }, [events]);

  // High-impact (Red Folder) events for today
  const redToday = useMemo(() => {
    const tDay = getTradingDay(now);
    const startOfLocalDay = new Date(now);
    startOfLocalDay.setHours(0, 0, 0, 0);
    const endOfLocalDay = new Date(now);
    endOfLocalDay.setHours(23, 59, 59, 999);

    const localYear = startOfLocalDay.getFullYear();
    const localMonth = String(startOfLocalDay.getMonth() + 1).padStart(2, "0");
    const localDate = String(startOfLocalDay.getDate()).padStart(2, "0");
    const isoDateStr = `${localYear}-${localMonth}-${localDate}`;
    const usDateStr = `${localMonth}-${localDate}-${localYear}`;

    return normalizedEvents
      .filter((e) => String(e.impact || "").toLowerCase() === "high")
      .filter((e) => {
        const isTradingDay = e.ts >= tDay.start && e.ts < tDay.end;
        const isLocalDay = e.ts >= startOfLocalDay.getTime() && e.ts <= endOfLocalDay.getTime();
        const isDateStringMatch =
          typeof e.date === "string" && (e.date.includes(isoDateStr) || e.date.includes(usDateStr));
        const isUpcomingSoon = e.ts >= now && e.ts <= now + 12 * HOUR;

        return isTradingDay || isLocalDay || isDateStringMatch || isUpcomingSoon;
      });
  }, [normalizedEvents, now]);

  const isEventDone = (e) => Boolean(e.actual && String(e.actual).trim() !== "") || e.ts <= now;

  const upcomingRed = useMemo(() => redToday.filter((e) => !isEventDone(e)), [redToday, now]);
  const completedRed = useMemo(() => redToday.filter((e) => isEventDone(e)), [redToday, now]);

  const upcomingCount = upcomingRed.length;

  const displayedCompactEvents = useMemo(() => {
    if (activeTab === "upcoming") return upcomingRed;
    if (activeTab === "completed") return completedRed;
    return redToday;
  }, [activeTab, redToday, upcomingRed, completedRed]);

  // Full calendar events for expanded view
  const expandedFilteredEvents = useMemo(() => {
    const startOfLocalDay = new Date(now);
    startOfLocalDay.setHours(0, 0, 0, 0);
    const endOfLocalDay = new Date(now);
    endOfLocalDay.setHours(23, 59, 59, 999);

    return normalizedEvents.filter((e) => {
      // Time range filter
      if (expandedTimeRange === "today") {
        const isToday =
          (e.ts >= startOfLocalDay.getTime() && e.ts <= endOfLocalDay.getTime()) ||
          (e.ts >= now - 4 * HOUR && e.ts <= now + 16 * HOUR);
        if (!isToday) return false;
      }

      // Impact filter
      if (expandedImpactFilter !== "all") {
        if (String(e.impact).toLowerCase() !== expandedImpactFilter.toLowerCase()) return false;
      }

      // Currency filter
      if (expandedCurrency !== "all") {
        if (String(e.country).toUpperCase() !== expandedCurrency.toUpperCase()) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (e.title || "").toLowerCase().includes(q);
        const matchCountry = (e.country || "").toLowerCase().includes(q);
        if (!matchTitle && !matchCountry) return false;
      }

      return true;
    });
  }, [normalizedEvents, expandedTimeRange, expandedImpactFilter, expandedCurrency, searchQuery, now]);

  // Group events by date for the Forex Factory table
  const groupedEventsByDate = useMemo(() => {
    const groups = {};
    for (const ev of expandedFilteredEvents) {
      const d = new Date(ev.ts);
      const key = d.toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      if (!groups[key]) groups[key] = [];
      groups[key].push(ev);
    }
    return groups;
  }, [expandedFilteredEvents]);

  const toggle = () => {
    if (!open) updatePosition();
    setOpen((o) => !o);
  };

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  return (
    <div className={className || "relative inline-flex"}>
      {/* Apple-styled Glass Squircle Bell Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        title={
          upcomingCount > 0
            ? `${upcomingCount} upcoming high-impact news event${upcomingCount > 1 ? "s" : ""} today`
            : "No pending red folder news"
        }
        aria-label="High impact news notifications"
        className="group relative h-9 w-9 shrink-0 rounded-xl border border-black/[0.08] dark:border-white/[0.12] bg-white/70 dark:bg-white/[0.08] backdrop-blur-xl text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:shadow transition-all duration-300 active:scale-95 cursor-pointer flex items-center justify-center"
      >
        <span className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 dark:via-white/30 to-transparent" />
        <Bell
          className={`w-[18px] h-[18px] transition-transform duration-300 group-hover:scale-110 ${
            upcomingCount > 0
              ? "text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]"
              : "text-neutral-600 dark:text-neutral-300"
          }`}
          strokeWidth={upcomingCount > 0 ? 2.4 : 2}
        />

        {/* Crisp, 100% visible solid count badge (no opacity fading) */}
        {upcomingCount > 0 && (
          <div className="absolute -top-1.5 -right-1.5 flex items-center justify-center pointer-events-none">
            {/* Subtle background ping indicator */}
            <span className="animate-ping absolute inset-0 rounded-full bg-rose-500 opacity-25" />
            <span className="relative min-w-[19px] h-[19px] px-1 rounded-full bg-rose-600 text-white text-[11px] font-black flex items-center justify-center shadow-md shadow-rose-600/40 border-2 border-white dark:border-[#0a0c10] leading-none select-none">
              {upcomingCount}
            </span>
          </div>
        )}
      </button>

      {/* REACT PORTAL: Dropdown & Expanded Modal */}
      {open &&
        createPortal(
          <>
            {/* Backdrop */}
            <div
              className={`fixed inset-0 z-[9990] transition-opacity duration-200 ${
                expanded ? "bg-black/60 dark:bg-black/80 backdrop-blur-md" : "bg-black/20 dark:bg-black/50 backdrop-blur-[2px]"
              }`}
              onClick={() => {
                if (!expanded) setOpen(false);
              }}
            />

            {/* Modal Card: Responsive to Mobile Screen Bounds & Expand Option */}
            <div
              ref={dropdownRef}
              style={
                expanded
                  ? undefined
                  : isMobile
                  ? {
                      position: "fixed",
                      top: Math.max(64, coords.top),
                      left: 12,
                      right: 12,
                      margin: "0 auto",
                      maxHeight: "calc(100vh - " + (Math.max(64, coords.top) + 20) + "px)",
                    }
                  : {
                      position: "fixed",
                      top: coords.top,
                      right: Math.min(Math.max(16, coords.right), Math.max(16, window.innerWidth - 410)),
                      maxHeight: "min(640px, calc(100vh - " + (coords.top + 24) + "px))",
                    }
              }
              className={
                expanded
                  ? "z-[9999] fixed inset-2 sm:inset-5 md:inset-8 w-auto max-w-6xl mx-auto overflow-hidden flex flex-col rounded-2xl md:rounded-3xl border border-black/[0.08] dark:border-white/[0.12] bg-white/95 dark:bg-[#10131c]/95 backdrop-blur-2xl shadow-[0_25px_80px_rgba(0,0,0,0.25)] dark:shadow-[0_30px_90px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-200"
                  : `z-[9999] ${
                      isMobile ? "w-auto max-w-[calc(100vw-24px)]" : "w-[min(390px,calc(100vw-2rem))]"
                    } overflow-hidden flex flex-col rounded-3xl border border-black/[0.08] dark:border-white/[0.12] bg-white/90 dark:bg-[#121622]/90 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.65)] animate-in fade-in zoom-in-95 duration-200`
              }
            >
              {/* Header */}
              <div className="p-4 border-b border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                    </span>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
                      {expanded ? "Forex Factory Economic Calendar & Impact Analyzer" : "Red Folder News"}
                      {expanded && (
                        <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          Live Feed
                        </span>
                      )}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Expand Option Like AI Coach */}
                    <button
                      type="button"
                      onClick={() => setExpanded((e) => !e)}
                      title={expanded ? "Collapse to notification view" : "Expand full Forex Factory calendar"}
                      className="text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        setExpanded(false);
                        setSelectedEvent(null);
                      }}
                      className="text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Subheader Filters: Compact vs Expanded */}
                {!expanded ? (
                  <>
                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 px-2.5 py-0.5 rounded-full">
                          {upcomingCount} Upcoming
                        </span>
                        <span className="text-[11px] text-neutral-500 dark:text-neutral-400 bg-black/5 dark:bg-white/5 border border-black/[0.04] dark:border-white/10 px-2.5 py-0.5 rounded-full">
                          {completedRed.length} Completed
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setOpen(false);
                          navigate("/news");
                        }}
                        className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                      >
                        Calendar <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Apple Segmented Control Pills */}
                    <div className="mt-3 flex gap-1 p-1 bg-black/[0.04] dark:bg-black/40 rounded-xl border border-black/[0.04] dark:border-white/5 text-[11px]">
                      <button
                        onClick={() => setActiveTab("all")}
                        className={`flex-1 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                          activeTab === "all"
                            ? "bg-white dark:bg-white/15 text-neutral-900 dark:text-white font-bold shadow-sm"
                            : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                        }`}
                      >
                        All ({redToday.length})
                      </button>
                      <button
                        onClick={() => setActiveTab("upcoming")}
                        className={`flex-1 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                          activeTab === "upcoming"
                            ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/30 shadow-sm"
                            : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                        }`}
                      >
                        Pending ({upcomingCount})
                      </button>
                      <button
                        onClick={() => setActiveTab("completed")}
                        className={`flex-1 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                          activeTab === "completed"
                            ? "bg-white dark:bg-white/15 text-neutral-900 dark:text-white font-bold shadow-sm"
                            : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                        }`}
                      >
                        Done ({completedRed.length})
                      </button>
                    </div>
                  </>
                ) : (
                  /* Expanded Mode Filter Toolbar */
                  <div className="mt-3 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      {/* Range & Impact Segmented Pills */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Day vs Week */}
                        <div className="flex p-0.5 bg-black/[0.04] dark:bg-white/[0.06] rounded-xl border border-black/[0.04] dark:border-white/10 text-xs">
                          <button
                            onClick={() => setExpandedTimeRange("today")}
                            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                              expandedTimeRange === "today"
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white"
                            }`}
                          >
                            Today
                          </button>
                          <button
                            onClick={() => setExpandedTimeRange("week")}
                            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                              expandedTimeRange === "week"
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white"
                            }`}
                          >
                            This Week
                          </button>
                        </div>

                        {/* Impact Filter */}
                        <div className="flex p-0.5 bg-black/[0.04] dark:bg-white/[0.06] rounded-xl border border-black/[0.04] dark:border-white/10 text-xs">
                          <button
                            onClick={() => setExpandedImpactFilter("all")}
                            className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                              expandedImpactFilter === "all"
                                ? "bg-white dark:bg-white/20 text-neutral-900 dark:text-white shadow-sm"
                                : "text-neutral-500 dark:text-neutral-400"
                            }`}
                          >
                            All Impacts
                          </button>
                          <button
                            onClick={() => setExpandedImpactFilter("High")}
                            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                              expandedImpactFilter === "High"
                                ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 shadow-sm"
                                : "text-neutral-500 dark:text-neutral-400"
                            }`}
                          >
                            <ImpactFolder impact="High" className="w-3.5 h-3.5" /> High
                          </button>
                          <button
                            onClick={() => setExpandedImpactFilter("Medium")}
                            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                              expandedImpactFilter === "Medium"
                                ? "bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30 shadow-sm"
                                : "text-neutral-500 dark:text-neutral-400"
                            }`}
                          >
                            <ImpactFolder impact="Medium" className="w-3.5 h-3.5" /> Medium
                          </button>
                          <button
                            onClick={() => setExpandedImpactFilter("Low")}
                            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                              expandedImpactFilter === "Low"
                                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-sm"
                                : "text-neutral-500 dark:text-neutral-400"
                            }`}
                          >
                            <ImpactFolder impact="Low" className="w-3.5 h-3.5" /> Low
                          </button>
                        </div>
                      </div>

                      {/* Search Input */}
                      <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <input
                          type="text"
                          placeholder="Search CPI, FOMC, Rate..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/10 rounded-xl text-xs text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:border-emerald-500/50"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Currency Filter Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide text-[11px]">
                      <span className="text-neutral-400 dark:text-neutral-500 font-semibold text-[10px] uppercase tracking-wider mr-1 shrink-0">
                        Currency:
                      </span>
                      {["all", "USD", "EUR", "GBP", "CAD", "JPY", "AUD", "NZD", "CHF", "CNY"].map((cur) => (
                        <button
                          key={cur}
                          onClick={() => setExpandedCurrency(cur)}
                          className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-all cursor-pointer ${
                            expandedCurrency === cur
                              ? "bg-emerald-600 text-white shadow-sm"
                              : "bg-black/[0.03] dark:bg-white/[0.05] text-neutral-600 dark:text-neutral-300 hover:bg-black/[0.06] dark:hover:bg-white/[0.09]"
                          }`}
                        >
                          {cur === "all" ? "All" : cur}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Content View ── */}
              {!expanded ? (
                /* Compact Event Notification List */
                <div className="flex-1 overflow-y-auto divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                  {displayedCompactEvents.length === 0 ? (
                    <div className="p-8 text-center">
                      <Calendar className="w-8 h-8 text-neutral-400 dark:text-neutral-600 mx-auto mb-2 opacity-50" />
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 font-medium">
                        {activeTab === "upcoming"
                          ? "All red folder news for today has completed!"
                          : activeTab === "completed"
                          ? "No completed red folder news yet today."
                          : "No high-impact red folder news scheduled today."}
                      </p>
                      <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">
                        Markets clear of major high-impact events
                      </p>
                    </div>
                  ) : (
                    displayedCompactEvents.map((e, i) => {
                      const done = isEventDone(e);
                      const eventTime = new Date(e.ts);
                      const diffMinutes = Math.round((e.ts - now) / 60000);

                      return (
                        <div
                          key={`${e.title}-${e.ts}-${i}`}
                          onClick={() => {
                            setSelectedEvent(e);
                            setExpanded(true);
                          }}
                          className={`p-3.5 transition-colors cursor-pointer ${
                            done
                              ? "bg-black/[0.02] dark:bg-black/25 opacity-70 hover:opacity-95"
                              : "hover:bg-black/[0.02] dark:hover:bg-white/[0.04]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <ImpactFolder impact={e.impact} className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/25 shrink-0">
                                  {e.country}
                                </span>
                                <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                                  {e.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-2.5 text-[11px] text-neutral-500 dark:text-neutral-400 font-mono mt-1">
                                <span>{sessionOf(e.ts)} Session</span>
                                {e.forecast && (
                                  <span>
                                    F: <span className="text-neutral-700 dark:text-neutral-300">{e.forecast}</span>
                                  </span>
                                )}
                                {e.previous && (
                                  <span>
                                    P: <span className="text-neutral-700 dark:text-neutral-300">{e.previous}</span>
                                  </span>
                                )}
                                {e.actual && (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                    A: {e.actual}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="shrink-0 flex flex-col items-end">
                              <span
                                className={`font-mono text-xs font-bold ${
                                  done
                                    ? "text-neutral-400 dark:text-neutral-500 line-through"
                                    : "text-rose-600 dark:text-rose-400"
                                }`}
                              >
                                {eventTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })}
                              </span>

                              {done ? (
                                <span className="text-[9px] font-semibold text-neutral-400 dark:text-neutral-500 flex items-center gap-1 mt-1 bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded-full">
                                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" /> Done
                                </span>
                              ) : diffMinutes <= 0 ? (
                                <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1 bg-rose-500/10 dark:bg-rose-500/15 px-1.5 py-0.5 rounded-full animate-pulse border border-rose-500/25">
                                  <Clock className="w-2.5 h-2.5" /> LIVE
                                </span>
                              ) : diffMinutes < 60 ? (
                                <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1 bg-amber-500/10 dark:bg-amber-500/15 px-1.5 py-0.5 rounded-full border border-amber-500/20">
                                  In {diffMinutes}m
                                </span>
                              ) : (
                                <span className="text-[9px] text-neutral-400 dark:text-neutral-500 mt-1">
                                  Upcoming
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                /* Full Forex Factory Calendar Table (Expanded Mode) */
                <div className="flex-1 overflow-y-auto flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-black/[0.06] dark:divide-white/[0.08]">
                  {/* Table view */}
                  <div className="flex-1 overflow-y-auto p-2 sm:p-4">
                    {Object.keys(groupedEventsByDate).length === 0 ? (
                      <div className="p-12 text-center">
                        <Calendar className="w-10 h-10 text-neutral-400 dark:text-neutral-600 mx-auto mb-3 opacity-40" />
                        <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                          No economic events match your active filters.
                        </p>
                        <button
                          onClick={() => {
                            setExpandedTimeRange("week");
                            setExpandedImpactFilter("all");
                            setExpandedCurrency("all");
                            setSearchQuery("");
                          }}
                          className="mt-3 px-4 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-colors cursor-pointer"
                        >
                          Reset Filters
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {Object.entries(groupedEventsByDate).map(([dateLabel, dateEvs]) => (
                          <div
                            key={dateLabel}
                            className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden bg-white/70 dark:bg-white/[0.02]"
                          >
                            {/* Date Group Header */}
                            <div className="px-4 py-2.5 bg-neutral-100 dark:bg-[#151923] border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
                              <span className="font-bold text-xs text-neutral-800 dark:text-neutral-200">
                                {dateLabel}
                              </span>
                              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                                {dateEvs.length} event{dateEvs.length > 1 ? "s" : ""}
                              </span>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="border-b border-black/[0.04] dark:border-white/[0.04] text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider bg-black/[0.01] dark:bg-white/[0.01]">
                                    <th className="py-2.5 px-3">Time</th>
                                    <th className="py-2.5 px-2">Cur.</th>
                                    <th className="py-2.5 px-2 text-center">Impact</th>
                                    <th className="py-2.5 px-3">Event Detail</th>
                                    <th className="py-2.5 px-2 text-right">Actual</th>
                                    <th className="py-2.5 px-2 text-right">Forecast</th>
                                    <th className="py-2.5 px-2 text-right">Previous</th>
                                    <th className="py-2.5 px-3 text-right">Analysis</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-black/[0.03] dark:divide-white/[0.04] font-medium">
                                  {dateEvs.map((ev, idx) => {
                                    const done = isEventDone(ev);
                                    const evTime = new Date(ev.ts);
                                    const impactData = analyzeNewsImpact(ev);
                                    const isSelected = selectedEvent?.title === ev.title && selectedEvent?.ts === ev.ts;

                                    return (
                                      <tr
                                        key={`${ev.title}-${ev.ts}-${idx}`}
                                        onClick={() => setSelectedEvent(ev)}
                                        className={`transition-colors cursor-pointer ${
                                          isSelected
                                            ? "bg-emerald-500/10 dark:bg-emerald-500/15"
                                            : done
                                            ? "opacity-75 hover:opacity-100 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                                            : "hover:bg-black/[0.02] dark:hover:bg-white/[0.04]"
                                        }`}
                                      >
                                        {/* Time */}
                                        <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-neutral-600 dark:text-neutral-300">
                                          {evTime.toLocaleTimeString([], {
                                            hour: "numeric",
                                            minute: "2-digit",
                                            hour12: true,
                                          })}
                                        </td>

                                        {/* Currency */}
                                        <td className="py-2.5 px-2 whitespace-nowrap">
                                          <span className="font-bold font-mono text-[11px] px-1.5 py-0.5 rounded bg-black/[0.05] dark:bg-white/[0.08] text-neutral-800 dark:text-neutral-200">
                                            {ev.country}
                                          </span>
                                        </td>

                                        {/* Impact Folder */}
                                        <td className="py-2.5 px-2 text-center whitespace-nowrap">
                                          <ImpactFolder impact={ev.impact} className="w-4 h-4 mx-auto" />
                                        </td>

                                        {/* Event Detail */}
                                        <td className="py-2.5 px-3">
                                          <div className="flex items-center gap-1.5">
                                            <span
                                              className={`truncate max-w-[220px] sm:max-w-xs md:max-w-md ${
                                                ev.impact === "High" ? "font-bold text-neutral-900 dark:text-white" : ""
                                              }`}
                                            >
                                              {ev.title}
                                            </span>
                                          </div>
                                        </td>

                                        {/* Actual */}
                                        <td className="py-2.5 px-2 text-right font-mono whitespace-nowrap">
                                          {ev.actual ? (
                                            <span
                                              className={`font-bold ${
                                                impactData.color.includes("emerald")
                                                  ? "text-emerald-600 dark:text-emerald-400"
                                                  : impactData.color.includes("rose")
                                                  ? "text-rose-600 dark:text-rose-400"
                                                  : "text-neutral-800 dark:text-neutral-200"
                                              }`}
                                            >
                                              {ev.actual}
                                            </span>
                                          ) : (
                                            <span className="text-neutral-400 dark:text-neutral-600">-</span>
                                          )}
                                        </td>

                                        {/* Forecast */}
                                        <td className="py-2.5 px-2 text-right font-mono text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                                          {ev.forecast || "-"}
                                        </td>

                                        {/* Previous */}
                                        <td className="py-2.5 px-2 text-right font-mono text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                                          {ev.previous || "-"}
                                        </td>

                                        {/* Quick Impact Pill */}
                                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                          <span
                                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${impactData.badgeBg}`}
                                          >
                                            {impactData.bias.split(" ")[0]}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Impact Analysis Drawer / Sidepane */}
                  <div className="w-full md:w-80 p-4 bg-neutral-50/70 dark:bg-[#0c0e14]/70 shrink-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-emerald-500" />
                        <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                          News Impact Analysis
                        </h4>
                      </div>

                      {selectedEvent ? (
                        (() => {
                          const analysis = analyzeNewsImpact(selectedEvent);
                          const evTime = new Date(selectedEvent.ts);
                          return (
                            <div className="space-y-4 animate-in fade-in">
                              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#161a24] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-1.5">
                                    <ImpactFolder impact={selectedEvent.impact} className="w-4 h-4" />
                                    <span className="font-mono font-bold text-xs px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-neutral-900 dark:text-white">
                                      {selectedEvent.country}
                                    </span>
                                  </div>
                                  <span className="text-[11px] font-mono text-neutral-500">
                                    {evTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                                  </span>
                                </div>
                                <h5 className="font-bold text-sm text-neutral-900 dark:text-white">
                                  {selectedEvent.title}
                                </h5>

                                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-black/[0.04] dark:border-white/5 font-mono text-center">
                                  <div className="p-1.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.02]">
                                    <p className="text-[9px] text-neutral-400">Actual</p>
                                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                      {selectedEvent.actual || "Pending"}
                                    </p>
                                  </div>
                                  <div className="p-1.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.02]">
                                    <p className="text-[9px] text-neutral-400">Forecast</p>
                                    <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mt-0.5">
                                      {selectedEvent.forecast || "-"}
                                    </p>
                                  </div>
                                  <div className="p-1.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.02]">
                                    <p className="text-[9px] text-neutral-400">Previous</p>
                                    <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mt-0.5">
                                      {selectedEvent.previous || "-"}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Bias & Explanation */}
                              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#161a24] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                                    Market Bias
                                  </span>
                                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${analysis.badgeBg}`}>
                                    {analysis.bias}
                                  </span>
                                </div>
                                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-normal">
                                  {analysis.explanation}
                                </p>
                              </div>

                              {/* Actionable Rule */}
                              <div className="p-3.5 rounded-2xl bg-rose-500/[0.04] dark:bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
                                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                                <div>
                                  <p className="font-bold text-[11px] uppercase tracking-wider mb-0.5">Execution Rule</p>
                                  <p className="text-[11px] leading-relaxed">
                                    Freeze technical entries 15 minutes before and after this release. Protect active positions with break-even stops.
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        <div className="p-6 text-center border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl">
                          <Info className="w-6 h-6 text-neutral-400 dark:text-neutral-600 mx-auto mb-2 opacity-60" />
                          <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                            Select Any Event
                          </p>
                          <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
                            Click on any row in the calendar table to inspect market impact, forecast deviations, and pair bias.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
                      <span className="text-[10px] text-neutral-400">Forex Factory Live Feed</span>
                      <a
                        href="https://www.forexfactory.com/calendar"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        ForexFactory.com <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Compact Footer warning */}
              {!expanded && (
                <div className="p-3 bg-rose-500/[0.04] dark:bg-rose-500/10 border-t border-black/[0.05] dark:border-white/5 flex items-center justify-between text-[11px] shrink-0">
                  <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                    ⚠️ High slippage risk during releases
                  </span>
                  <button
                    onClick={() => setExpanded(true)}
                    className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1"
                  >
                    Analyze impact <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
