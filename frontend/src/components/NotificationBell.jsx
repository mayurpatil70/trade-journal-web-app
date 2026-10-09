import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import api from "../api/axios";

const HOUR = 3600_000;
// Trading day runs 3:30 AM to 2:30 AM IST (22:00 to 21:00 UTC).
const DAY_START_UTC_HOUR = 22;
const SEEN_KEY = "news_bell_seen";

const tradingDay = (now = Date.now()) => {
  const d = new Date(now);
  let start = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), DAY_START_UTC_HOUR);
  if (start > now) start -= 24 * HOUR;
  return { start, end: start + 23 * HOUR, now };
};

const sessionOf = (ts) => {
  const h = new Date(ts).getUTCHours();
  if (h >= 22 || h < 7) return "Asian";
  if (h < 13) return "London";
  return "New York";
};

const readSeen = () => {
  try {
    return Number(localStorage.getItem(SEEN_KEY)) || 0;
  } catch {
    return 0;
  }
};

export default function NotificationBell({ className }) {
  const [events, setEvents] = useState([]);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(readSeen);
  const [day, setDay] = useState(tradingDay);
  const ref = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      api.get("/api/news").then((res) => !cancelled && setEvents(res.data?.data || [])).catch(() => {});
    load();
    const timer = setInterval(() => {
      setDay(tradingDay());
      load();
    }, 5 * 60_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const red = useMemo(
    () =>
      events
        .filter((e) => e.impact === "High")
        .map((e) => ({ ...e, ts: new Date(e.date).getTime() }))
        .filter((e) => e.ts >= day.start && e.ts < day.end)
        .sort((a, b) => a.ts - b.ts),
    [events, day],
  );

  const unread = seen < day.start ? red.length : 0;

  const toggle = () => {
    setOpen((o) => !o);
    if (!open) {
      setSeen(day.start);
      try {
        localStorage.setItem(SEEN_KEY, String(day.start));
      } catch {
        /* storage unavailable */
      }
    }
  };

  return (
    <div ref={ref} className={className || "relative"}>
      <button
        onClick={toggle}
        title="High impact news today"
        className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
      >
        <Bell className={`w-5 h-5 ${unread ? "text-red-400" : ""}`} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(340px,calc(100vw-2rem))] max-h-[70vh] overflow-y-auto rounded-xl border border-white/10 bg-[#101216]/95 backdrop-blur-xl shadow-2xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div>
              <p className="text-sm font-semibold text-white">Red folder news</p>
              <p className="text-[11px] text-gray-500">Today, 3:30 AM to 2:30 AM IST</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          {red.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-gray-500">No high impact news today.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {red.map((e, i) => (
                <li key={`${e.title}-${e.ts}-${i}`} className="px-4 py-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-white">{e.country} · {e.title}</span>
                    <span className={`shrink-0 font-mono ${e.ts < day.now ? "text-gray-500" : "text-red-400"}`}>
                      {new Date(e.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="mt-1 flex gap-3 text-gray-500">
                    <span>{sessionOf(e.ts)} session</span>
                    {e.forecast && <span>F: {e.forecast}</span>}
                    {e.previous && <span>P: {e.previous}</span>}
                    {e.actual && <span className="text-gray-300">A: {e.actual}</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
