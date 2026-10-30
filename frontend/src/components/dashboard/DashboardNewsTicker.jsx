// frontend/src/components/dashboard/DashboardNewsTicker.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X, ChevronRight, ExternalLink } from "lucide-react";
import api from "../../api/axios";
import initialCalendarFallback from "../../data/calendar_fallback.json";

export default function DashboardNewsTicker() {
  const [newsEvents, setNewsEvents] = useState([]);
  const [isVisible, setIsVisible] = useState(() => {
    try {
      return sessionStorage.getItem("fn_hide_news_ticker") !== "true";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    let isCancelled = false;

    // Load initial events from cache or fallback
    try {
      const cached = localStorage.getItem("forex_news_cache_v4");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setNewsEvents(parsed.slice(0, 20));
        }
      } else if (initialCalendarFallback && Array.isArray(initialCalendarFallback)) {
        setNewsEvents(initialCalendarFallback.slice(0, 20));
      }
    } catch (e) {}

    // Fetch fresh news from API
    const fetchLatest = async () => {
      try {
        const res = await api.get("/api/news");
        if (!isCancelled && res.data && Array.isArray(res.data.data)) {
          setNewsEvents(res.data.data.slice(0, 25));
        }
      } catch (err) {
        // Fallback remains active
      }
    };

    fetchLatest();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleDismiss = () => {
    try {
      sessionStorage.setItem("fn_hide_news_ticker", "true");
    } catch (e) {}
    setIsVisible(false);
  };

  if (!isVisible || newsEvents.length === 0) return null;

  return (
    <aside
      aria-label="Market News Ticker"
      className="fixed bottom-0 left-0 right-0 z-30 h-9 bg-white/95 dark:bg-[#0c0f17]/95 backdrop-blur-md border-t border-black/[0.08] dark:border-white/[0.08] shadow-[0_-4px_16px_rgba(0,0,0,0.04)] flex items-center select-none text-xs overflow-hidden"
    >
      {/* ── Left Badge: Animated Blue Dot & NEWS Label ── */}
      <div className="flex items-center gap-2 px-3 h-full bg-white dark:bg-[#0c0f17] border-r border-black/[0.08] dark:border-white/[0.08] shrink-0 z-10 shadow-[4px_0_12px_rgba(0,0,0,0.03)]">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0066FF] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0066FF]" />
        </span>
        <span className="font-mono font-black uppercase tracking-wider text-[11px] text-neutral-900 dark:text-white">
          NEWS
        </span>
      </div>

      {/* ── Center: Infinite / Continuous Scrolling Marquee Ticker ── */}
      <div className="flex-1 overflow-hidden relative flex items-center group cursor-pointer">
        <div className="flex items-center whitespace-nowrap animate-marquee group-hover:[animation-play-state:paused] py-1">
          {/* Duplicate list to produce a seamless loop */}
          {[...newsEvents, ...newsEvents].map((ev, idx) => {
            const impact = (ev.impact || "").toLowerCase();
            const dotColor =
              impact === "high"
                ? "bg-rose-500"
                : impact === "medium"
                ? "bg-amber-500"
                : "bg-neutral-400";

            return (
              <Link
                key={`${ev.title || "ev"}-${idx}`}
                to="/news"
                className="inline-flex items-center gap-1.5 px-3 py-0.5 text-neutral-700 dark:text-neutral-300 hover:text-[#0066FF] dark:hover:text-[#38BDF8] transition-colors"
                title={`${ev.country || ""} ${ev.title || ""} (${ev.impact || "Low"} Impact)`}
              >
                {/* Country Code */}
                {ev.country && (
                  <span className="font-mono font-bold text-[10px] text-neutral-900 dark:text-white bg-black/[0.04] dark:bg-white/[0.06] px-1 py-0.5 rounded">
                    {ev.country}
                  </span>
                )}

                {/* Impact Indicator Dot */}
                <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`} />

                {/* Event Title */}
                <span className="font-medium text-xs truncate max-w-[220px]">
                  {ev.title}
                </span>

                {/* Event Time */}
                {ev.time && (
                  <span className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
                    {ev.time}
                  </span>
                )}

                {/* Actual vs Forecast if present */}
                {ev.actual && (
                  <span className="font-mono text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Act: {ev.actual}
                  </span>
                )}

                {/* Ticker Separator Bullet */}
                <span className="text-neutral-300 dark:text-neutral-700 ml-2 font-bold select-none">
                  ·
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Right: Economic Calendar Quick Link & Dismiss Button ── */}
      <div className="flex items-center gap-1.5 px-2.5 h-full bg-white dark:bg-[#0c0f17] border-l border-black/[0.08] dark:border-white/[0.08] shrink-0 z-10">
        <Link
          to="/news"
          className="text-[10px] font-bold text-neutral-500 hover:text-[#0066FF] dark:text-neutral-400 dark:hover:text-blue-400 flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-neutral-100 dark:hover:bg-white/[0.05] transition-colors"
          title="Open Full Economic Calendar of News"
        >
          <span>Calendar</span>
          <ChevronRight className="w-3 h-3" />
        </Link>
        <button
          type="button"
          onClick={handleDismiss}
          className="w-5 h-5 rounded hover:bg-neutral-100 dark:hover:bg-white/[0.08] flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
          title="Hide News Ticker"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </aside>
  );
}
