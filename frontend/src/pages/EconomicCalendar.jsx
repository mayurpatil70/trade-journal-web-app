// frontend/src/pages/EconomicCalendar.jsx
import { useEffect, useRef, useState, useMemo } from "react";
import {
  Globe,
  ExternalLink,
  Calendar,
  ShieldAlert,
  Search,
  Sparkles,
  AlertTriangle,
  Info,
  Clock,
  LayoutList,
  BarChart2,
} from "lucide-react";
import { useTheme } from "../components/theme-provider";
import api from "../api/axios";

const HOUR = 3600_000;

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

export default function EconomicCalendar() {
  const container = useRef(null);
  const { isDark } = useTheme();

  // Mode: "forexfactory" (default) or "tradingview"
  const [activeMode, setActiveMode] = useState("forexfactory");

  // Forex Factory Calendar State
  const [events, setEvents] = useState(() => {
    try {
      const cached = localStorage.getItem("forex_news_cache");
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    return [];
  });
  const [timeRange, setTimeRange] = useState("today"); // "today" | "week"
  const [impactFilter, setImpactFilter] = useState("all"); // "all" | "High" | "Medium" | "Low"
  const [currencyFilter, setCurrencyFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  // Fetch news data
  useEffect(() => {
    let cancelled = false;
    const fetchNews = () => {
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
        .catch(() => {});
    };
    fetchNews();
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 15_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
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

  // Normalized events
  const normalizedEvents = useMemo(() => {
    return (events || [])
      .map((e) => ({
        ...e,
        ts: new Date(e.date).getTime(),
        impact: e.impact || "Low",
      }))
      .filter((e) => Number.isFinite(e.ts))
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

  // Group by date
  const groupedEvents = useMemo(() => {
    const groups = {};
    for (const ev of filteredEvents) {
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
  }, [filteredEvents]);

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-7xl mx-auto space-y-6 pb-24 font-sans">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/10">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-medium text-neutral-800 dark:text-neutral-100">
              Economic Calendar
            </h1>
            <p className="text-xs md:text-[13px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              Live macroeconomic releases, Forex Factory impact ratings, and pair reaction analysis.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex p-1 bg-black/[0.04] dark:bg-white/[0.06] rounded-2xl border border-black/[0.06] dark:border-white/10 text-xs">
            <button
              onClick={() => setActiveMode("forexfactory")}
              className={`px-3.5 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeMode === "forexfactory"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" /> Forex Factory
            </button>
            <button
              onClick={() => setActiveMode("tradingview")}
              className={`px-3.5 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeMode === "tradingview"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" /> TradingView
            </button>
          </div>

          <button
            onClick={() => window.open("https://www.forexfactory.com/calendar", "_blank")}
            className="px-4 py-2 rounded-2xl border border-black/[0.08] dark:border-white/[0.12] bg-white/75 dark:bg-white/[0.06] hover:bg-black/5 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-200 text-xs font-semibold backdrop-blur-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <span>ForexFactory</span>
            <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
          </button>
        </div>
      </div>

      {/* ── Main View Container ── */}
      {activeMode === "forexfactory" ? (
        <div className="bg-white/70 dark:bg-[#10131b]/70 border border-black/[0.08] dark:border-white/[0.12] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] backdrop-blur-2xl overflow-hidden transition-colors duration-300 flex flex-col">
          {/* Controls Bar */}
          <div className="p-4 border-b border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {/* Time Range */}
                <div className="flex p-0.5 bg-black/[0.04] dark:bg-white/[0.06] rounded-xl border border-black/[0.04] dark:border-white/10 text-xs">
                  <button
                    onClick={() => setTimeRange("today")}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      timeRange === "today"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white"
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setTimeRange("week")}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      timeRange === "week"
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
                    onClick={() => setImpactFilter("all")}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      impactFilter === "all"
                        ? "bg-white dark:bg-white/20 text-neutral-900 dark:text-white shadow-sm"
                        : "text-neutral-500 dark:text-neutral-400"
                    }`}
                  >
                    All Impacts
                  </button>
                  <button
                    onClick={() => setImpactFilter("High")}
                    className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      impactFilter === "High"
                        ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 shadow-sm"
                        : "text-neutral-500 dark:text-neutral-400"
                    }`}
                  >
                    <ImpactFolder impact="High" className="w-3.5 h-3.5" /> High
                  </button>
                  <button
                    onClick={() => setImpactFilter("Medium")}
                    className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      impactFilter === "Medium"
                        ? "bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30 shadow-sm"
                        : "text-neutral-500 dark:text-neutral-400"
                    }`}
                  >
                    <ImpactFolder impact="Medium" className="w-3.5 h-3.5" /> Medium
                  </button>
                  <button
                    onClick={() => setImpactFilter("Low")}
                    className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      impactFilter === "Low"
                        ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-sm"
                        : "text-neutral-500 dark:text-neutral-400"
                    }`}
                  >
                    <ImpactFolder impact="Low" className="w-3.5 h-3.5" /> Low
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
                  className="w-full pl-8 pr-3 py-1.5 bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/10 rounded-xl text-xs text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            {/* Currency Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide text-[11px]">
              <span className="text-neutral-400 dark:text-neutral-500 font-semibold text-[10px] uppercase tracking-wider mr-1 shrink-0">
                Currency:
              </span>
              {["all", "USD", "EUR", "GBP", "CAD", "JPY", "AUD", "NZD", "CHF", "CNY"].map((cur) => (
                <button
                  key={cur}
                  onClick={() => setCurrencyFilter(cur)}
                  className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-all cursor-pointer ${
                    currencyFilter === cur
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-black/[0.03] dark:bg-white/[0.05] text-neutral-600 dark:text-neutral-300 hover:bg-black/[0.06] dark:hover:bg-white/[0.09]"
                  }`}
                >
                  {cur === "all" ? "All Currencies" : cur}
                </button>
              ))}
            </div>
          </div>

          {/* Table & Impact Drawer Split */}
          <div className="flex-1 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-black/[0.06] dark:divide-white/[0.08]">
            {/* Table Area */}
            <div className="flex-1 p-3 sm:p-5 overflow-y-auto max-h-[750px]">
              {Object.keys(groupedEvents).length === 0 ? (
                <div className="p-16 text-center">
                  <Calendar className="w-10 h-10 text-neutral-400 dark:text-neutral-600 mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    No macroeconomic events match your filters.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedEvents).map(([dateLabel, dateEvs]) => (
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
                              <th className="py-2.5 px-3 text-right">Action</th>
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
                                  <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-neutral-600 dark:text-neutral-300">
                                    {evTime.toLocaleTimeString([], {
                                      hour: "numeric",
                                      minute: "2-digit",
                                      hour12: true,
                                    })}
                                  </td>
                                  <td className="py-2.5 px-2 whitespace-nowrap">
                                    <span className="font-bold font-mono text-[11px] px-1.5 py-0.5 rounded bg-black/[0.05] dark:bg-white/[0.08] text-neutral-800 dark:text-neutral-200">
                                      {ev.country}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-2 text-center whitespace-nowrap">
                                    <ImpactFolder impact={ev.impact} className="w-4 h-4 mx-auto" />
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span
                                      className={`truncate max-w-[220px] sm:max-w-xs md:max-w-md ${
                                        ev.impact === "High" ? "font-bold text-neutral-900 dark:text-white" : ""
                                      }`}
                                    >
                                      {ev.title}
                                    </span>
                                  </td>
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
                                  <td className="py-2.5 px-2 text-right font-mono text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                                    {ev.forecast || "-"}
                                  </td>
                                  <td className="py-2.5 px-2 text-right font-mono text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                                    {ev.previous || "-"}
                                  </td>
                                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${impactData.badgeBg}`}
                                    >
                                      Analyze
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

            {/* Impact Analysis Side Panel */}
            <div className="w-full lg:w-88 p-5 bg-neutral-50/70 dark:bg-[#0c0e14]/70 shrink-0 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
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
                        <div className="p-4 rounded-2xl bg-white dark:bg-[#161a24] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <ImpactFolder impact={selectedEvent.impact} className="w-4 h-4" />
                              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-neutral-900 dark:text-white">
                                {selectedEvent.country}
                              </span>
                            </div>
                            <span className="text-xs font-mono text-neutral-500">
                              {evTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                            </span>
                          </div>
                          <h5 className="font-bold text-sm text-neutral-900 dark:text-white">
                            {selectedEvent.title}
                          </h5>

                          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-black/[0.04] dark:border-white/5 font-mono text-center">
                            <div className="p-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.02]">
                              <p className="text-[9px] text-neutral-400">Actual</p>
                              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                {selectedEvent.actual || "Pending"}
                              </p>
                            </div>
                            <div className="p-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.02]">
                              <p className="text-[9px] text-neutral-400">Forecast</p>
                              <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mt-0.5">
                                {selectedEvent.forecast || "-"}
                              </p>
                            </div>
                            <div className="p-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.02]">
                              <p className="text-[9px] text-neutral-400">Previous</p>
                              <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mt-0.5">
                                {selectedEvent.previous || "-"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Bias & Explanation */}
                        <div className="p-4 rounded-2xl bg-white dark:bg-[#161a24] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                              Fundamental Bias
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
                        <div className="p-4 rounded-2xl bg-rose-500/[0.04] dark:bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
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
                    <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Select Any Event
                    </p>
                    <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
                      Click any event in the table to analyze currency bias, forecast deviation, and slippage impact.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between text-xs">
                <span className="text-[10px] text-neutral-400">Forex Factory Live Feed</span>
                <a
                  href="https://www.forexfactory.com/calendar"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  ForexFactory.com <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── TradingView Calendar Widget Container ── */
        <div className="w-full h-[640px] md:h-[700px] bg-white/70 dark:bg-[#10131b]/70 border border-black/[0.08] dark:border-white/[0.12] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] backdrop-blur-2xl overflow-hidden relative p-2 md:p-3 transition-colors duration-300">
          <div className="absolute inset-2 md:inset-3" ref={container} />
        </div>
      )}

      {/* ── Risk Management Rule Footer ── */}
      <div className="p-5 rounded-3xl bg-white/70 dark:bg-[#10131b]/70 border border-black/[0.08] dark:border-white/[0.12] shadow-sm backdrop-blur-2xl flex items-start gap-3.5 transition-colors duration-300">
        <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1">
            Forex Factory Risk Management Rule
          </p>
          <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-normal">
            Avoid taking new technical setups 15 minutes before and after high-impact (red folder) news releases due to unpredictable spread widening and slippage.
          </p>
        </div>
      </div>
    </div>
  );
}
