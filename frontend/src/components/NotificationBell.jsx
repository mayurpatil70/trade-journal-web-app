import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Bell, X, Calendar, ArrowRight, CheckCircle2, Clock } from "lucide-react";
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

export default function NotificationBell({ className }) {
  const [events, setEvents] = useState(() => {
    try {
      const cached = localStorage.getItem("forex_news_cache");
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    return [];
  });
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 16 });
  const [now, setNow] = useState(() => Date.now());
  const [activeTab, setActiveTab] = useState("all"); // "all" | "upcoming" | "completed"
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
      if (e.key === "Escape") setOpen(false);
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
  }, [open, updatePosition]);

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

    return events
      .filter((e) => String(e.impact || "").toLowerCase() === "high")
      .map((e) => ({
        ...e,
        ts: new Date(e.date).getTime(),
      }))
      .filter((e) => {
        if (!Number.isFinite(e.ts)) return false;
        const isTradingDay = e.ts >= tDay.start && e.ts < tDay.end;
        const isLocalDay = e.ts >= startOfLocalDay.getTime() && e.ts <= endOfLocalDay.getTime();
        const isDateStringMatch =
          typeof e.date === "string" && (e.date.includes(isoDateStr) || e.date.includes(usDateStr));
        const isUpcomingSoon = e.ts >= now && e.ts <= now + 12 * HOUR;

        return isTradingDay || isLocalDay || isDateStringMatch || isUpcomingSoon;
      })
      .sort((a, b) => a.ts - b.ts);
  }, [events, now]);

  const isEventDone = (e) => Boolean(e.actual && String(e.actual).trim() !== "") || e.ts <= now;

  const upcomingRed = useMemo(() => redToday.filter((e) => !isEventDone(e)), [redToday, now]);
  const completedRed = useMemo(() => redToday.filter((e) => isEventDone(e)), [redToday, now]);

  const upcomingCount = upcomingRed.length;

  const displayedEvents = useMemo(() => {
    if (activeTab === "upcoming") return upcomingRed;
    if (activeTab === "completed") return completedRed;
    return redToday;
  }, [activeTab, redToday, upcomingRed, completedRed]);

  const toggle = () => {
    if (!open) updatePosition();
    setOpen((o) => !o);
  };

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

        {upcomingCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-md shadow-rose-500/50 animate-pulse border-2 border-white dark:border-[#0a0c10]">
            {upcomingCount}
          </span>
        )}
      </button>

      {/* REACT PORTAL: Immune to overflow-hidden and theme-toggle clipping crashes */}
      {open &&
        createPortal(
          <>
            {/* Backdrop for safe click dismissal */}
            <div
              className="fixed inset-0 z-[9990] bg-black/10 dark:bg-black/40 backdrop-blur-[2px] transition-opacity duration-200"
              onClick={() => setOpen(false)}
            />

            {/* Apple macOS Frosted Glass Flyout Card */}
            <div
              ref={dropdownRef}
              style={{
                position: "fixed",
                top: coords.top,
                right: coords.right,
                maxHeight: "min(640px, calc(100vh - " + (coords.top + 24) + "px))",
              }}
              className="z-[9999] w-[min(390px,calc(100vw-2rem))] overflow-hidden flex flex-col rounded-3xl border border-black/[0.08] dark:border-white/[0.12] bg-white/90 dark:bg-[#121622]/90 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.65)] animate-in fade-in zoom-in-95 duration-200"
            >
              {/* Header */}
              <div className="p-4 border-b border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                    </span>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white tracking-tight">
                      Red Folder News
                    </h3>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

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
              </div>

              {/* Events List */}
              <div className="flex-1 overflow-y-auto divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                {displayedEvents.length === 0 ? (
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
                  displayedEvents.map((e, i) => {
                    const done = isEventDone(e);
                    const eventTime = new Date(e.ts);
                    const diffMinutes = Math.round((e.ts - now) / 60000);

                    return (
                      <div
                        key={`${e.title}-${e.ts}-${i}`}
                        className={`p-3.5 transition-colors ${
                          done
                            ? "bg-black/[0.02] dark:bg-black/25 opacity-70 hover:opacity-95"
                            : "hover:bg-black/[0.02] dark:hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
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
                              {eventTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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

              {/* Footer warning */}
              <div className="p-3 bg-rose-500/[0.04] dark:bg-rose-500/10 border-t border-black/[0.05] dark:border-white/5 flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                  ⚠️ High slippage risk during releases
                </span>
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500">Auto syncing</span>
              </div>
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
