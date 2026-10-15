import { useEffect, useMemo, useRef, useState } from "react";
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
  const [now, setNow] = useState(() => Date.now());
  const [activeTab, setActiveTab] = useState("all"); // "all" | "upcoming" | "completed"
  const ref = useRef(null);
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

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  // High-impact (Red Folder) events for today (trading day, local calendar day, or upcoming in next 12h)
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
        // 1. Within current trading day session
        const isTradingDay = e.ts >= tDay.start && e.ts < tDay.end;
        // 2. Within user local calendar day
        const isLocalDay = e.ts >= startOfLocalDay.getTime() && e.ts <= endOfLocalDay.getTime();
        // 3. String date match (YYYY-MM-DD or MM-DD-YYYY in date string)
        const isDateStringMatch = typeof e.date === "string" && (e.date.includes(isoDateStr) || e.date.includes(usDateStr));
        // 4. Any upcoming red event in the next 12 hours
        const isUpcomingSoon = e.ts >= now && e.ts <= now + 12 * HOUR;

        return isTradingDay || isLocalDay || isDateStringMatch || isUpcomingSoon;
      })
      .sort((a, b) => a.ts - b.ts);
  }, [events, now]);

  // An event is completed/done if its actual result has been released OR its scheduled time has passed
  const isEventDone = (e) => Boolean(e.actual && String(e.actual).trim() !== "") || e.ts <= now;

  const upcomingRed = useMemo(() => redToday.filter((e) => !isEventDone(e)), [redToday, now]);
  const completedRed = useMemo(() => redToday.filter((e) => isEventDone(e)), [redToday, now]);

  // LIVE COUNT: only show count according to news which is going to happen (not completed)
  const upcomingCount = upcomingRed.length;

  const displayedEvents = useMemo(() => {
    if (activeTab === "upcoming") return upcomingRed;
    if (activeTab === "completed") return completedRed;
    return redToday;
  }, [activeTab, redToday, upcomingRed, completedRed]);

  const toggle = () => {
    setOpen((o) => !o);
  };

  return (
    <div ref={ref} className={className || "relative"}>
      <button
        onClick={toggle}
        title={
          upcomingCount > 0
            ? `${upcomingCount} upcoming high-impact news event${upcomingCount > 1 ? "s" : ""} today`
            : "No pending red folder news"
        }
        className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer group"
      >
        <Bell
          className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${
            upcomingCount > 0 ? "text-red-500" : "text-gray-400"
          }`}
          strokeWidth={upcomingCount > 0 ? 2.5 : 2}
        />

        {upcomingCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[19px] h-[19px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center shadow-md shadow-red-500/40 animate-pulse border border-black/40"
          >
            {upcomingCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(380px,calc(100vw-2rem))] max-h-[75vh] overflow-hidden flex flex-col rounded-2xl border border-white/10 bg-[#0e1116]/95 backdrop-blur-2xl shadow-2xl shadow-black/80 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping inline-block" />
                <h3 className="text-sm font-bold text-white tracking-tight">Red Folder News Today</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-red-400 bg-red-500/15 border border-red-500/30 px-2 py-0.5 rounded-full">
                  {upcomingCount} Upcoming
                </span>
                <span className="text-[11px] text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                  {completedRed.length} Completed
                </span>
              </div>
              <button
                onClick={() => {
                  setOpen(false);
                  navigate("/news");
                }}
                className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                Calendar <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Filter Pills */}
            <div className="mt-3 flex gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5 text-[11px]">
              <button
                onClick={() => setActiveTab("all")}
                className={`flex-1 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  activeTab === "all" ? "bg-white/10 text-white font-bold" : "text-gray-400 hover:text-gray-200"
                }`}
              >
                All ({redToday.length})
              </button>
              <button
                onClick={() => setActiveTab("upcoming")}
                className={`flex-1 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  activeTab === "upcoming" ? "bg-red-500/20 text-red-400 font-bold border border-red-500/30" : "text-gray-400 hover:text-gray-200"
                }`}
              >
                Pending ({upcomingCount})
              </button>
              <button
                onClick={() => setActiveTab("completed")}
                className={`flex-1 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  activeTab === "completed" ? "bg-white/10 text-white font-bold" : "text-gray-400 hover:text-gray-200"
                }`}
              >
                Done ({completedRed.length})
              </button>
            </div>
          </div>

          {/* Events List */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {displayedEvents.length === 0 ? (
              <div className="p-8 text-center">
                <Calendar className="w-8 h-8 text-gray-600 mx-auto mb-2 opacity-50" />
                <p className="text-xs text-gray-400 font-medium">
                  {activeTab === "upcoming"
                    ? "All red folder news for today has completed!"
                    : activeTab === "completed"
                    ? "No completed red folder news yet today."
                    : "No high-impact red folder news scheduled today."}
                </p>
                <p className="text-[10px] text-gray-500 mt-1">Markets clear of major high-impact events</p>
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
                      done ? "bg-black/20 opacity-70 hover:opacity-90" : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 shrink-0">
                            {e.country}
                          </span>
                          <span className="text-xs font-semibold text-gray-200 truncate">
                            {e.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-gray-400 font-mono mt-1">
                          <span>{sessionOf(e.ts)} Session</span>
                          {e.forecast && <span>F: <span className="text-gray-300">{e.forecast}</span></span>}
                          {e.previous && <span>P: <span className="text-gray-300">{e.previous}</span></span>}
                          {e.actual && (
                            <span className="text-emerald-400 font-bold">
                              A: {e.actual}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex flex-col items-end">
                        <span
                          className={`font-mono text-xs font-bold ${
                            done ? "text-gray-500 line-through" : "text-red-400"
                          }`}
                        >
                          {eventTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>

                        {done ? (
                          <span className="text-[9px] font-semibold text-gray-500 flex items-center gap-1 mt-1 bg-white/5 px-1.5 py-0.5 rounded">
                            <CheckCircle2 className="w-2.5 h-2.5 text-gray-500" /> Done
                          </span>
                        ) : diffMinutes <= 0 ? (
                          <span className="text-[9px] font-bold text-red-400 flex items-center gap-1 mt-1 bg-red-500/10 px-1.5 py-0.5 rounded animate-pulse">
                            <Clock className="w-2.5 h-2.5" /> LIVE NOW
                          </span>
                        ) : diffMinutes < 60 ? (
                          <span className="text-[9px] font-bold text-amber-400 flex items-center gap-1 mt-1 bg-amber-500/10 px-1.5 py-0.5 rounded">
                            In {diffMinutes}m
                          </span>
                        ) : (
                          <span className="text-[9px] text-gray-400 mt-1">
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
          <div className="p-3 bg-red-500/5 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
            <span className="flex items-center gap-1 text-red-400 font-medium">
              ⚠️ High slippage risk during releases
            </span>
            <span className="text-[10px] text-gray-500">Auto updates</span>
          </div>
        </div>
      )}
    </div>
  );
}

