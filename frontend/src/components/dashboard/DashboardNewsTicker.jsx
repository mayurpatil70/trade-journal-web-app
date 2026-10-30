// frontend/src/components/dashboard/DashboardNewsTicker.jsx
// Floating Horizontal Economic Calendar News Card for Dashboard
// Apple HIG Frosted Glass UI with Live Forex Factory High & Moderate News Tracking

import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { X, ChevronRight, Calendar, Globe, AlertCircle } from "lucide-react";
import api from "../../api/axios";
import initialCalendarFallback from "../../data/calendar_fallback.json";
import { parseForexDate, formatToUserTime } from "../../utils/forexDate.js";

export default function DashboardNewsTicker() {
  const [newsEvents, setNewsEvents] = useState([]);
  const [isDismissed, setIsDismissed] = useState(false);

  // Retrieve user's display name dynamically
  const traderDisplayName = useMemo(() => {
    try {
      const custom =
        localStorage.getItem("userName") ||
        localStorage.getItem("userDisplayName");
      if (custom && custom.trim() && custom !== "undefined" && custom !== "null") {
        return custom.trim();
      }
      const uid = localStorage.getItem("userId") || localStorage.getItem("userEmail") || "";
      const cached = JSON.parse(localStorage.getItem(`trader_profile_${uid}`) || "{}");
      if (cached.displayName && cached.displayName.trim()) {
        return cached.displayName.trim();
      }
      const email = localStorage.getItem("userEmail") || "";
      if (email && email.includes("@")) {
        return email.split("@")[0];
      }
      return email || "Trader";
    } catch {
      return "Trader";
    }
  }, []);

  // On mount: clear legacy permanent suppression so ticker shows continuously on dashboard returns
  useEffect(() => {
    try {
      sessionStorage.removeItem("fn_hide_news_ticker");
    } catch (_) {}
  }, []);

  // Load news from localStorage cache and live API (syncs with bell icon)
  useEffect(() => {
    let isCancelled = false;

    try {
      const cached = localStorage.getItem("forex_news_cache_v4");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setNewsEvents(parsed);
        }
      } else if (initialCalendarFallback && Array.isArray(initialCalendarFallback)) {
        setNewsEvents(initialCalendarFallback);
      }
    } catch (e) {}

    const fetchLatest = async () => {
      try {
        const res = await api.get("/api/news");
        if (!isCancelled && res.data && Array.isArray(res.data.data)) {
          setNewsEvents(res.data.data);
          try {
            localStorage.setItem("forex_news_cache_v4", JSON.stringify(res.data.data));
          } catch (_) {}
          return;
        }
      } catch (err) {
        // Fallback to direct production endpoint
        try {
          const directRes = await fetch("https://forexnotes-web-app.onrender.com/api/news");
          if (directRes.ok) {
            const data = await directRes.json();
            if (!isCancelled && data?.data && Array.isArray(data.data)) {
              setNewsEvents(data.data);
              try {
                localStorage.setItem("forex_news_cache_v4", JSON.stringify(data.data));
              } catch (_) {}
            }
          }
        } catch (_) {}
      }
    };

    fetchLatest();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Filter for today's High & Moderate (Medium) impact news
  const todayEvents = useMemo(() => {
    const now = new Date();
    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth();
    const todayDate = now.getDate();
    const yyyyMmDd = `${todayYear}-${String(todayMonth + 1).padStart(2, "0")}-${String(todayDate).padStart(2, "0")}`;

    const filtered = (newsEvents || []).filter((ev) => {
      const impact = (ev.impact || "").toLowerCase();
      const isHighOrModerate =
        impact === "high" || impact === "medium" || impact === "moderate";
      if (!isHighOrModerate) return false;

      const ts = parseForexDate(ev.date);
      if (ts) {
        const d = new Date(ts);
        if (
          d.getFullYear() === todayYear &&
          d.getMonth() === todayMonth &&
          d.getDate() === todayDate
        ) {
          return true;
        }
      }

      if (typeof ev.date === "string" && ev.date.startsWith(yyyyMmDd)) {
        return true;
      }

      return false;
    });

    // Sort chronologically
    return filtered.sort((a, b) => {
      const tsA = parseForexDate(a.date);
      const tsB = parseForexDate(b.date);
      return tsA - tsB;
    });
  }, [newsEvents]);

  // If user cut down (x) for this moment, hide it
  if (isDismissed) return null;

  return (
    <aside
      aria-label="Today Economic Calendar News Card"
      className="fixed bottom-3 left-3 right-20 sm:left-6 sm:right-24 md:left-8 md:right-28 lg:left-12 lg:right-32 z-40 max-w-6xl mx-auto h-11 rounded-2xl bg-white/95 dark:bg-[#0c0f17]/95 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.12] shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] flex items-center px-3 sm:px-4 gap-2.5 sm:gap-3.5 overflow-hidden select-none transition-all duration-300"
    >
      {/* ── CASE 1: High & Moderate News Exist Today ── */}
      {todayEvents.length > 0 ? (
        <>
          {/* Left Live Badge */}
          <div className="flex items-center gap-2 shrink-0 pr-2 border-r border-black/[0.08] dark:border-white/[0.08]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0066FF] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0066FF]" />
            </span>
            <span className="font-mono font-black uppercase tracking-wider text-[10px] sm:text-[11px] text-neutral-900 dark:text-white hidden xs:inline">
              TODAY'S NEWS
            </span>
            <span className="px-1.5 py-0.5 rounded-md bg-[#0066FF]/10 text-[#0066FF] dark:text-[#38BDF8] text-[10px] font-bold font-mono">
              {todayEvents.length}
            </span>
          </div>

          {/* Center Marquee with Live Events */}
          <div className="flex-1 overflow-hidden relative flex items-center group cursor-pointer">
            <div className="flex items-center whitespace-nowrap animate-marquee group-hover:[animation-play-state:paused] py-1">
              {[...todayEvents, ...todayEvents].map((ev, idx) => {
                const impact = (ev.impact || "").toLowerCase();
                const isHigh = impact === "high";
                const ts = parseForexDate(ev.date);
                const displayTime = ts ? formatToUserTime(ts) : ev.time || "";

                return (
                  <Link
                    key={`${ev.title || "event"}-${idx}`}
                    to="/news"
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-xl text-neutral-700 dark:text-neutral-300 hover:text-[#0066FF] dark:hover:text-[#38BDF8] hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-all"
                    title={`${ev.country || ""} ${ev.title || ""} (${isHigh ? "High" : "Moderate"} Impact)`}
                  >
                    {/* Country Code */}
                    {ev.country && (
                      <span className="font-mono font-bold text-[10px] text-neutral-900 dark:text-white bg-black/[0.05] dark:bg-white/[0.08] px-1.5 py-0.5 rounded">
                        {ev.country}
                      </span>
                    )}

                    {/* Impact Badge */}
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                        isHigh
                          ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                          : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {isHigh ? "HIGH" : "MOD"}
                    </span>

                    {/* Event Title */}
                    <span className="font-semibold text-xs truncate max-w-[160px] sm:max-w-[240px] md:max-w-[320px]">
                      {ev.title}
                    </span>

                    {/* Time */}
                    {displayTime && (
                      <span className="font-mono text-[10px] text-neutral-500 dark:text-neutral-400 bg-black/[0.03] dark:bg-white/[0.05] px-1.5 py-0.5 rounded">
                        {displayTime}
                      </span>
                    )}

                    {/* Actual vs Forecast if present */}
                    {ev.actual && (
                      <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        Act: {ev.actual}
                      </span>
                    )}

                    {/* Separator Bullet */}
                    <span className="text-neutral-300 dark:text-neutral-700 ml-2 font-bold select-none">
                      •
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        /* ── CASE 2: No High/Moderate Economic News Today (Exact User State Requirement) ── */
        <div className="flex-1 flex items-center justify-between gap-3 overflow-hidden">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-[#0066FF] dark:text-[#38BDF8] flex items-center justify-center shrink-0">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
              Hi <span className="font-bold text-[#0066FF] dark:text-[#38BDF8]">{traderDisplayName}</span>, there is no economic news today
            </p>
          </div>
        </div>
      )}

      {/* ── Right Actions: Calendar Link & Cut (x) Button ── */}
      <div className="flex items-center gap-1.5 shrink-0 pl-2 border-l border-black/[0.08] dark:border-white/[0.08]">
        <Link
          to="/news"
          className="text-[11px] font-bold text-neutral-600 hover:text-[#0066FF] dark:text-neutral-300 dark:hover:text-[#38BDF8] flex items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors"
          title="Open Full Economic Calendar of News"
        >
          <span>Calendar</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="w-6 h-6 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/[0.08] flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
          title="Dismiss news card for now (reappears when you return to dashboard)"
          aria-label="Dismiss news card"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}
