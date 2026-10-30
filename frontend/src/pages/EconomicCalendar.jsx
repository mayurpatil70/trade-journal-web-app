// frontend/src/pages/EconomicCalendar.jsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  Globe,
  ExternalLink,
  Calendar,
  ShieldAlert,
  Search,
  AlertTriangle,
  Info,
  Clock,
  LayoutList,
  BarChart2,
  FolderOpen,
  FileText,
  ChevronDown,
  X,
} from "lucide-react";
import { useTheme } from "../components/theme-provider";
import api from "../api/axios";
import initialCalendarFallback from "../data/calendar_fallback.json";
import { parseForexDate, formatToUserTime, formatToDateHeader } from "../utils/forexDate.js";
import { getEventSpecs } from "../utils/forexFactorySpecs.js";

const HOUR = 3600_000;

// Modern Institutional Impact Indicator Badge (TradeFXBook style)
function ImpactFolder({ impact, className = "" }) {
  const imp = String(impact || "").toLowerCase();
  if (imp === "high") {
    return (
      <span title="High Impact" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-mono font-extrabold text-[10px] tracking-wider select-none shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        <span>HIGH</span>
      </span>
    );
  }
  if (imp === "medium") {
    return (
      <span title="Medium Impact" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-mono font-bold text-[10px] tracking-wider select-none shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        <span>MED</span>
      </span>
    );
  }
  if (imp === "low") {
    return (
      <span title="Low Impact" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 font-mono font-medium text-[10px] tracking-wider select-none shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        <span>LOW</span>
      </span>
    );
  }
  return (
    <span title="Non-economic / Holiday" className="inline-flex items-center px-2 py-0.5 rounded-md bg-neutral-500/10 text-neutral-400 border border-neutral-500/20 font-mono text-[10px] select-none shrink-0">
      —
    </span>
  );
}

// Modern Detail Specs Button
function DetailFolderButton({ isOpen, onClick, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title || "Click to view event specifications & analysis"}
      className={`p-1.5 rounded-lg transition-all cursor-pointer border ${
        isOpen
          ? "bg-blue-500/10 text-[#0066FF] dark:text-blue-400 border-blue-500/30 shadow-xs"
          : "hover:bg-black/5 dark:hover:bg-white/10 text-neutral-400 hover:text-blue-500 border-transparent"
      }`}
    >
      <FileText className="w-3.5 h-3.5" />
    </button>
  );
}

// News Impact Analyzer
function analyzeNewsImpact(e) {
  if (!e) return { bias: "Pending", color: "text-neutral-500", badgeBg: "bg-neutral-500/10 text-neutral-600", explanation: "" };
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
  let color = "text-neutral-700 dark:text-neutral-300";
  let badgeBg = "bg-neutral-500/10 text-neutral-800 dark:text-neutral-200 border-neutral-500/25";
  let explanation = "";

  if (actVal !== null && fcVal !== null) {
    if (actVal > fcVal) {
      bias = isInverse ? "Bearish for " + e.country : "Bullish for " + e.country;
      color = isInverse ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400";
      badgeBg = isInverse
        ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30"
        : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
      explanation = `${e.country} ${e.title} printed higher than consensus (${actualStr} vs ${forecastStr} exp). Historically indicates ${isInverse ? "selling" : "buying"} pressure across ${e.country} pairs.`;
    } else if (actVal < fcVal) {
      bias = isInverse ? "Bullish for " + e.country : "Bearish for " + e.country;
      color = isInverse ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400";
      badgeBg = isInverse
        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
        : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30";
      explanation = `${e.country} ${e.title} printed below consensus (${actualStr} vs ${forecastStr} exp). Historically indicates ${isInverse ? "buying" : "selling"} pressure across ${e.country} pairs.`;
    } else {
      bias = "In-line with consensus";
      color = "text-amber-600 dark:text-amber-400";
      badgeBg = "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
      explanation = `${e.country} release came in exactly as forecasted (${actualStr}). Minimal fundamental deviation.`;
    }
  } else {
    const isHigh = e.impact === "High";
    const isMed = e.impact === "Medium";
    bias = isHigh ? "High Volatility Watch" : isMed ? "Medium Risk Watch" : "Pending Release";
    color = isHigh ? "text-rose-600 dark:text-rose-400" : isMed ? "text-amber-600 dark:text-amber-400" : "text-neutral-500";
    badgeBg = isHigh
      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
      : isMed
      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
      : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
    explanation = isHigh
      ? `Major high-volatility event for ${e.country}. Expect rapid spread widening and slippage across major ${e.country} crosses. Avoid market orders +/-15 mins of release.`
      : `Scheduled macroeconomic release for ${e.country}. Monitor print for deviations against market consensus.`;
  }

  return { bias, color, badgeBg, explanation };
}

export default function EconomicCalendar() {
  const container = useRef(null);
  const { isDark } = useTheme();

  // Mode: "forexfactory" (default) or "tradingview"
  const [activeMode, setActiveMode] = useState("forexfactory");

  // Clear legacy corrupted cache keys
  useEffect(() => {
    try {
      localStorage.removeItem("forex_news_cache");
      localStorage.removeItem("forex_news_cache_v2");
    } catch (_) {}
  }, []);

  // Forex Factory Calendar State (instant load from v4 cache or bundled fallback)
  const [events, setEvents] = useState(() => {
    try {
      const cached = localStorage.getItem("forex_news_cache_v4");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return initialCalendarFallback || [];
  });

  const [timeRange, setTimeRange] = useState("week"); // "today" | "week"
  const [impactFilter, setImpactFilter] = useState("all"); // "all" | "High" | "Medium" | "Low"
  const [currencyFilter, setCurrencyFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [expandedRowKey, setExpandedRowKey] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  // Fetch news data
  useEffect(() => {
    let cancelled = false;

    const fetchNews = async () => {
      try {
        const res = await api.get("/api/news");
        if (!cancelled && res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setEvents(res.data.data);
          try {
            localStorage.setItem("forex_news_cache_v4", JSON.stringify(res.data.data));
          } catch (_) {}
          return;
        }
      } catch (err) {
        // Production fallback directly to backend origin
        try {
          const directRes = await fetch("https://forexnotes-web-app.onrender.com/api/news");
          if (directRes.ok) {
            const data = await directRes.json();
            if (!cancelled && data?.data && Array.isArray(data.data)) {
              setEvents(data.data);
              try {
                localStorage.setItem("forex_news_cache_v4", JSON.stringify(data.data));
              } catch (_) {}
            }
          }
        } catch (_) {}
      }
    };

    fetchNews();
    const newsTimer = setInterval(fetchNews, 2 * 60_000);
    const clockTimer = setInterval(() => setNow(Date.now()), 15_000);

    return () => {
      cancelled = true;
      clearInterval(newsTimer);
      clearInterval(clockTimer);
    };
  }, []);

  // TradingView widget injection
  useEffect(() => {
    if (activeMode !== "tradingview" || !container.current) return;
    container.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: isDark ? "dark" : "light",
      isTransparent: true,
      width: "100%",
      height: "100%",
      locale: "en",
      importanceFilter: "-1,0,1",
      currencyFilter: "USD,EUR,GBP,JPY,AUD,CAD,CHF,NZD,CNY",
    });

    container.current.appendChild(script);
  }, [activeMode, isDark]);

  // Normalized events using parseForexDate for IST accuracy
  const normalizedEvents = useMemo(() => {
    return (events || [])
      .map((e) => ({
        ...e,
        ts: parseForexDate(e.date),
        impact: e.impact || "Low",
      }))
      .filter((e) => Number.isFinite(e.ts) && e.ts > 0)
      .sort((a, b) => a.ts - b.ts);
  }, [events]);

  const isEventDone = (e) => Boolean(e.actual && String(e.actual).trim() !== "") || e.ts <= now;

  // Filter events
  const filteredEvents = useMemo(() => {
    const startOfLocalDay = new Date(now);
    startOfLocalDay.setHours(0, 0, 0, 0);
    const endOfLocalDay = new Date(now);
    endOfLocalDay.setHours(23, 59, 59, 999);

    return normalizedEvents.filter((e) => {
      if (timeRange === "today") {
        const isToday =
          (e.ts >= startOfLocalDay.getTime() && e.ts <= endOfLocalDay.getTime()) ||
          (e.ts >= now - 4 * HOUR && e.ts <= now + 16 * HOUR);
        if (!isToday) return false;
      }

      if (impactFilter !== "all") {
        if (String(e.impact).toLowerCase() !== impactFilter.toLowerCase()) return false;
      }

      if (currencyFilter !== "all") {
        if (String(e.country).toUpperCase() !== currencyFilter.toUpperCase()) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (e.title || "").toLowerCase().includes(q);
        const matchCountry = (e.country || "").toLowerCase().includes(q);
        if (!matchTitle && !matchCountry) return false;
      }

      return true;
    });
  }, [normalizedEvents, timeRange, impactFilter, currencyFilter, searchQuery, now]);

  // Group by date with human-readable headers
  const groupedEvents = useMemo(() => {
    const groups = {};
    for (const ev of filteredEvents) {
      const key = formatToDateHeader(ev.ts);
      if (!groups[key]) groups[key] = [];
      groups[key].push(ev);
    }
    return groups;
  }, [filteredEvents]);

  // Auto-select first event if none selected
  useEffect(() => {
    if (!selectedEvent && filteredEvents.length > 0) {
      const firstUpcoming = filteredEvents.find((e) => !isEventDone(e)) || filteredEvents[0];
      setSelectedEvent(firstUpcoming);
    }
  }, [filteredEvents, selectedEvent]);

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-7xl mx-auto space-y-6 pb-24 font-sans text-neutral-900 dark:text-neutral-100">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/10">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                Economic Calendar
              </h1>
              <span className="text-[10px] font-mono font-bold bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/25 px-2 py-0.5 rounded-full">
                IST (UTC+5:30)
              </span>
            </div>
            <p className="text-xs md:text-[13px] text-neutral-600 dark:text-neutral-300 mt-0.5 font-medium">
              Live macroeconomic releases, Forex Factory impact ratings, specifications, and pair reaction analysis.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex p-1 bg-black/[0.05] dark:bg-white/[0.06] rounded-2xl border border-black/[0.08] dark:border-white/10 text-xs">
            <button
              onClick={() => setActiveMode("forexfactory")}
              className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeMode === "forexfactory"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white"
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" /> Forex Factory
            </button>
            <button
              onClick={() => setActiveMode("tradingview")}
              className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeMode === "tradingview"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white"
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" /> TradingView
            </button>
          </div>

          <button
            onClick={() => window.open("https://www.forexfactory.com/calendar", "_blank")}
            className="px-4 py-2 rounded-2xl border border-black/[0.1] dark:border-white/[0.12] bg-white dark:bg-white/[0.06] hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-800 dark:text-neutral-200 text-xs font-bold backdrop-blur-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <span>ForexFactory</span>
            <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
          </button>
        </div>
      </div>

      {/* ── Main View Container ── */}
      {activeMode === "forexfactory" ? (
        <div className="bg-white dark:bg-[#10131b] border border-black/[0.1] dark:border-white/[0.12] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] overflow-hidden transition-colors duration-300 flex flex-col">
          {/* Controls Bar */}
          <div className="p-4 border-b border-black/[0.08] dark:border-white/[0.08] bg-neutral-50/90 dark:bg-white/[0.02] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {/* Time Range */}
                <div className="flex p-0.5 bg-black/[0.05] dark:bg-white/[0.06] rounded-xl border border-black/[0.06] dark:border-white/10 text-xs">
                  <button
                    onClick={() => setTimeRange("today")}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      timeRange === "today"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white"
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setTimeRange("week")}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      timeRange === "week"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white"
                    }`}
                  >
                    This Week
                  </button>
                </div>

                {/* Impact Filter */}
                <div className="flex p-0.5 bg-black/[0.05] dark:bg-white/[0.06] rounded-xl border border-black/[0.06] dark:border-white/10 text-xs">
                  <button
                    onClick={() => setImpactFilter("all")}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      impactFilter === "all"
                        ? "bg-white dark:bg-white/20 text-neutral-900 dark:text-white shadow-sm"
                        : "text-neutral-600 dark:text-neutral-400"
                    }`}
                  >
                    All Impacts
                  </button>
                  <button
                    onClick={() => setImpactFilter("High")}
                    className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      impactFilter === "High"
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 shadow-xs"
                        : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> High
                  </button>
                  <button
                    onClick={() => setImpactFilter("Medium")}
                    className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      impactFilter === "Medium"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-xs"
                        : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Medium
                  </button>
                  <button
                    onClick={() => setImpactFilter("Low")}
                    className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      impactFilter === "Low"
                        ? "bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/30 shadow-xs"
                        : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-slate-400" /> Low
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search CPI, FOMC, Rate..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/10 rounded-xl text-xs text-neutral-900 dark:text-white placeholder-neutral-500 outline-none focus:border-blue-500/50 font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Currency Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide text-[11px]">
              <span className="text-neutral-600 dark:text-neutral-400 font-bold text-[10px] uppercase tracking-wider mr-1 shrink-0">
                Currency:
              </span>
              {["all", "USD", "EUR", "GBP", "CAD", "JPY", "AUD", "NZD", "CHF", "CNY"].map((cur) => (
                <button
                  key={cur}
                  onClick={() => setCurrencyFilter(cur)}
                  className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
                    currencyFilter === cur
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-black/[0.04] dark:bg-white/[0.05] text-neutral-700 dark:text-neutral-300 hover:bg-black/[0.08] dark:hover:bg-white/[0.09]"
                  }`}
                >
                  {cur === "all" ? "All Currencies" : cur}
                </button>
              ))}
            </div>
          </div>

          {/* Table & Impact Drawer Split */}
          <div className="flex-1 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-black/[0.08] dark:divide-white/[0.08]">
            {/* Table Area with STICKY Headers & Sticky Date Groups */}
            <div className="flex-1 overflow-y-auto max-h-[750px]">
              {Object.keys(groupedEvents).length === 0 ? (
                <div className="p-16 text-center">
                  <Calendar className="w-10 h-10 text-neutral-400 dark:text-neutral-600 mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                    No macroeconomic events match your active filters.
                  </p>
                  <button
                    onClick={() => {
                      setTimeRange("week");
                      setImpactFilter("all");
                      setCurrencyFilter("all");
                      setSearchQuery("");
                    }}
                    className="mt-3 px-4 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  {/* STICKY THEAD: Never disappears upon scroll */}
                  <thead className="sticky top-0 z-20 bg-neutral-100 dark:bg-[#151924] border-b border-black/[0.08] dark:border-white/[0.1] shadow-sm">
                    <tr className="text-[11px] font-extrabold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                      <th className="py-2.5 px-3 whitespace-nowrap">Time</th>
                      <th className="py-2.5 px-2 whitespace-nowrap">Cur.</th>
                      <th className="py-2.5 px-2 text-center whitespace-nowrap">Impact</th>
                      <th className="py-2.5 px-2 text-center whitespace-nowrap">Detail</th>
                      <th className="py-2.5 px-3">Event Detail</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">Actual</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">Forecast</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">Previous</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.05]">
                    {Object.entries(groupedEvents).map(([dateLabel, dateEvs]) => (
                      <React.Fragment key={dateLabel}>
                        {/* STICKY DATE GROUP DIVIDER ROW */}
                        <tr className="sticky top-[37px] z-10 bg-neutral-200/95 dark:bg-[#1c2230]/95 backdrop-blur-md border-y border-black/[0.08] dark:border-white/[0.1]">
                          <td colSpan={9} className="py-2 px-3">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs text-neutral-900 dark:text-white uppercase tracking-wider">
                                {dateLabel}
                              </span>
                              <span className="text-[11px] font-mono font-bold text-neutral-600 dark:text-neutral-400">
                                {dateEvs.length} event{dateEvs.length > 1 ? "s" : ""}
                              </span>
                            </div>
                          </td>
                        </tr>

                        {/* Event Rows */}
                        {dateEvs.map((ev, idx) => {
                          const rowKey = `${ev.title}-${ev.ts}-${idx}`;
                          const isDetailOpen = expandedRowKey === rowKey;
                          const done = isEventDone(ev);
                          const impactData = analyzeNewsImpact(ev);
                          const specs = getEventSpecs(ev);
                          const isSelected = selectedEvent?.title === ev.title && selectedEvent?.ts === ev.ts;

                          return (
                            <React.Fragment key={rowKey}>
                              <tr
                                onClick={() => setSelectedEvent(ev)}
                                className={`transition-colors cursor-pointer ${
                                  isSelected || isDetailOpen
                                    ? "bg-blue-500/10 dark:bg-blue-500/15"
                                    : done
                                    ? "hover:bg-neutral-50 dark:hover:bg-white/[0.03] opacity-85 hover:opacity-100"
                                    : "hover:bg-neutral-50 dark:hover:bg-white/[0.04]"
                                }`}
                              >
                                {/* Time in Local IST format */}
                                <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] font-bold text-neutral-800 dark:text-neutral-200">
                                  {formatToUserTime(ev.ts)}
                                </td>

                                {/* Currency Code */}
                                <td className="py-2.5 px-2 whitespace-nowrap">
                                  <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-black/[0.06] dark:bg-white/[0.08] text-neutral-900 dark:text-neutral-100">
                                    {ev.country}
                                  </span>
                                </td>

                                {/* Impact Folder Graphic */}
                                <td className="py-2.5 px-2 text-center whitespace-nowrap">
                                  <ImpactFolder impact={ev.impact} className="w-4 h-4 mx-auto" />
                                </td>

                                {/* Clickable Detail Folder Button (Forex Factory style) */}
                                <td className="py-2.5 px-2 text-center whitespace-nowrap">
                                  <DetailFolderButton
                                    isOpen={isDetailOpen}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedRowKey(isDetailOpen ? null : rowKey);
                                      setSelectedEvent(ev);
                                    }}
                                  />
                                </td>

                                {/* Event Title with high-contrast text */}
                                <td className="py-2.5 px-3">
                                  <span
                                    className={`block truncate max-w-[200px] sm:max-w-xs md:max-w-md ${
                                      ev.impact === "High"
                                        ? "font-extrabold text-neutral-950 dark:text-white text-xs"
                                        : "font-semibold text-neutral-800 dark:text-neutral-200 text-xs"
                                    }`}
                                  >
                                    {ev.title}
                                  </span>
                                </td>

                                {/* Actual */}
                                <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">
                                  {ev.actual ? (
                                    <span
                                      className={`font-bold ${
                                        impactData.color.includes("emerald")
                                          ? "text-emerald-700 dark:text-emerald-400 font-extrabold"
                                          : impactData.color.includes("rose")
                                          ? "text-rose-700 dark:text-rose-400 font-extrabold"
                                          : "text-neutral-900 dark:text-neutral-100"
                                      }`}
                                    >
                                      {ev.actual}
                                    </span>
                                  ) : (
                                    <span className="text-neutral-400 dark:text-neutral-500 font-semibold">-</span>
                                  )}
                                </td>

                                {/* Forecast */}
                                <td className="py-2.5 px-3 text-right font-mono font-medium text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                                  {ev.forecast || "-"}
                                </td>

                                {/* Previous */}
                                <td className="py-2.5 px-3 text-right font-mono font-medium text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                                  {ev.previous || "-"}
                                </td>

                                {/* Action Badge */}
                                <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                  <span
                                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                      ev.actual
                                        ? impactData.badgeBg
                                        : "bg-neutral-100 dark:bg-white/[0.04] text-neutral-500 dark:text-neutral-400 border-black/[0.06] dark:border-white/[0.08]"
                                    }`}
                                  >
                                    {ev.actual ? impactData.bias.split(" ")[0] : "Pending"}
                                  </span>
                                </td>
                              </tr>

                              {/* INLINE FOREX FACTORY DETAIL SPECIFICATIONS ACCORDION */}
                              {isDetailOpen && (
                                <tr className="bg-neutral-100/90 dark:bg-[#121622]/95 border-b-2 border-blue-500/30 animate-in fade-in duration-150">
                                  <td colSpan={9} className="p-4 sm:p-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white dark:bg-[#171c28] p-5 rounded-2xl border border-black/[0.08] dark:border-white/[0.1] shadow-md">
                                      {/* Specs Column */}
                                      <div className="space-y-2.5 text-xs">
                                        <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/[0.08]">
                                          <span className="font-extrabold uppercase tracking-wider text-[11px] text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                                            <FileText className="w-4 h-4 text-blue-500" /> Event Specifications & Methodology
                                          </span>
                                          <span className="font-mono text-[10px] text-neutral-500">
                                            {specs.country} • {specs.impact} Impact
                                          </span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2">
                                          <span className="font-bold text-neutral-600 dark:text-neutral-400">Source:</span>
                                          <span className="col-span-2 text-neutral-900 dark:text-neutral-100 font-semibold">{specs.source}</span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2">
                                          <span className="font-bold text-neutral-600 dark:text-neutral-400">Measures:</span>
                                          <span className="col-span-2 text-neutral-800 dark:text-neutral-200 leading-relaxed font-medium">{specs.measures}</span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2">
                                          <span className="font-bold text-neutral-600 dark:text-neutral-400">Usual Effect:</span>
                                          <span className="col-span-2 text-blue-700 dark:text-blue-400 font-bold">{specs.usualEffect}</span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2">
                                          <span className="font-bold text-neutral-600 dark:text-neutral-400">Frequency:</span>
                                          <span className="col-span-2 text-neutral-800 dark:text-neutral-200 font-medium">{specs.frequency}</span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2">
                                          <span className="font-bold text-neutral-600 dark:text-neutral-400">FF Notes:</span>
                                          <span className="col-span-2 text-neutral-700 dark:text-neutral-300 leading-relaxed italic">{specs.ffNotes}</span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2">
                                          <span className="font-bold text-neutral-600 dark:text-neutral-400">Why Traders Care:</span>
                                          <span className="col-span-2 text-neutral-800 dark:text-neutral-200 leading-relaxed font-medium">{specs.whyTradersCare}</span>
                                        </div>
                                      </div>

                                      {/* Market Reaction & Pairs Column */}
                                      <div className="space-y-4 text-xs">
                                        <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/[0.08]">
                                          <span className="font-extrabold uppercase tracking-wider text-[11px] text-blue-600 dark:text-blue-400">
                                            Market Reaction & Pairs
                                          </span>
                                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${impactData.badgeBg}`}>
                                            {impactData.bias}
                                          </span>
                                        </div>

                                        {/* Prints Grid */}
                                        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-neutral-100 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/5 font-mono text-center">
                                          <div>
                                            <p className="text-[10px] text-neutral-500 uppercase font-bold">Actual</p>
                                            <p className={`text-sm font-extrabold mt-0.5 ${impactData.color}`}>{ev.actual || "Pending"}</p>
                                          </div>
                                          <div>
                                            <p className="text-[10px] text-neutral-500 uppercase font-bold">Forecast</p>
                                            <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">{ev.forecast || "-"}</p>
                                          </div>
                                          <div>
                                            <p className="text-[10px] text-neutral-500 uppercase font-bold">Previous</p>
                                            <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">{ev.previous || "-"}</p>
                                          </div>
                                        </div>

                                        {/* High Volatility Pairs */}
                                        <div>
                                          <p className="font-bold text-[11px] text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-2">
                                            High-Beta Currency Crosses
                                          </p>
                                          <div className="flex flex-wrap gap-2">
                                            {specs.pairs?.map((pair) => (
                                              <span
                                                key={pair}
                                                className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-800 dark:text-blue-300 font-mono font-bold text-xs border border-blue-500/25"
                                              >
                                                {pair}
                                              </span>
                                            ))}
                                          </div>
                                        </div>

                                        {/* Execution Warning */}
                                        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-900 dark:text-rose-200 flex items-start gap-2.5">
                                          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                                          <p className="text-[11px] leading-relaxed font-medium">
                                            <strong>Execution Guard:</strong> Spread widening and slippage spikes occur during this release. Freeze technical entries +/- 15 minutes.
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Impact Analysis Side Panel */}
            <div className="w-full lg:w-88 p-5 bg-neutral-50/90 dark:bg-[#0c0e14]/90 shrink-0 flex flex-col justify-between">
              <div>
                <div className="mb-4">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                    News Impact Analysis
                  </h4>
                </div>

                {selectedEvent ? (
                  (() => {
                    const analysis = analyzeNewsImpact(selectedEvent);
                    const specs = getEventSpecs(selectedEvent);
                    return (
                      <div className="space-y-4 animate-in fade-in">
                        <div className="p-4 rounded-2xl bg-white dark:bg-[#161a24] border border-black/[0.08] dark:border-white/[0.1] shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <ImpactFolder impact={selectedEvent.impact} className="w-4 h-4" />
                              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-neutral-900 dark:text-white">
                                {selectedEvent.country}
                              </span>
                            </div>
                            <span className="text-xs font-mono font-bold text-neutral-600 dark:text-neutral-400">
                              {formatToUserTime(selectedEvent.ts)}
                            </span>
                          </div>
                          <h5 className="font-bold text-sm text-neutral-900 dark:text-white leading-snug">
                            {selectedEvent.title}
                          </h5>

                          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-black/[0.06] dark:border-white/5 font-mono text-center">
                            <div className="p-2 rounded-lg bg-neutral-100 dark:bg-white/[0.03]">
                              <p className="text-[9px] text-neutral-500 font-bold uppercase">Actual</p>
                              <p className={`text-xs font-extrabold mt-0.5 ${analysis.color}`}>
                                {selectedEvent.actual || "Pending"}
                              </p>
                            </div>
                            <div className="p-2 rounded-lg bg-neutral-100 dark:bg-white/[0.03]">
                              <p className="text-[9px] text-neutral-500 font-bold uppercase">Forecast</p>
                              <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">
                                {selectedEvent.forecast || "-"}
                              </p>
                            </div>
                            <div className="p-2 rounded-lg bg-neutral-100 dark:bg-white/[0.03]">
                              <p className="text-[9px] text-neutral-500 font-bold uppercase">Previous</p>
                              <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">
                                {selectedEvent.previous || "-"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Bias & Explanation */}
                        <div className="p-4 rounded-2xl bg-white dark:bg-[#161a24] border border-black/[0.08] dark:border-white/[0.1] shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-extrabold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                              Fundamental Bias
                            </span>
                            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${analysis.badgeBg}`}>
                              {analysis.bias}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-normal">
                            {analysis.explanation}
                          </p>
                        </div>

                        {/* High Volatility Pairs */}
                        {specs?.pairs?.length > 0 && (
                          <div className="p-4 rounded-2xl bg-white dark:bg-[#161a24] border border-black/[0.08] dark:border-white/[0.1] shadow-sm">
                            <span className="text-[11px] font-extrabold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-2">
                              Affected Currency Pairs
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {specs.pairs.map((p) => (
                                <span
                                  key={p}
                                  className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-800 dark:text-blue-300 font-mono font-bold text-[11px] border border-blue-500/20"
                                >
                                  {p}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actionable Rule */}
                        <div className="p-4 rounded-2xl bg-rose-500/[0.08] dark:bg-rose-500/15 border border-rose-500/25 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                          <div>
                            <p className="font-bold text-[11px] uppercase tracking-wider mb-0.5">Trading Rule</p>
                            <p className="text-[11px] leading-relaxed">
                              Freeze entries on {selectedEvent.country} crosses 15 minutes before and after this event to prevent slippage.
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="p-8 text-center border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl">
                    <Info className="w-8 h-8 text-neutral-400 dark:text-neutral-600 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      Select Any Event
                    </p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                      Click any event in the table or click its folder icon to analyze currency bias, forecast deviation, and specs.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-black/[0.08] dark:border-white/[0.08] flex items-center justify-between text-xs">
                <span className="text-[10px] text-neutral-500 font-medium">Forex Factory Live Feed</span>
                <a
                  href="https://www.forexfactory.com/calendar"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1 font-bold"
                >
                  ForexFactory.com <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── TradingView Calendar Widget Container ── */
        <div className="w-full h-[640px] md:h-[700px] bg-white dark:bg-[#10131b] border border-black/[0.1] dark:border-white/[0.12] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] overflow-hidden relative p-2 md:p-3 transition-colors duration-300">
          <div className="absolute inset-2 md:inset-3" ref={container} />
        </div>
      )}

      {/* ── Risk Management Rule Footer ── */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#10131b] border border-black/[0.1] dark:border-white/[0.12] shadow-sm flex items-start gap-3.5 transition-colors duration-300">
        <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[11px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1">
            Forex Factory Risk Management Rule
          </p>
          <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-normal">
            Avoid taking new technical setups 15 minutes before and after high-impact (red folder) news releases due to unpredictable spread widening and slippage.
          </p>
        </div>
      </div>
    </div>
  );
}
