// frontend/src/pages/TraderProblems/MarketHours.jsx
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  Clock,
  Globe,
  Activity,
  Flame,
  Zap,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Timer,
  Compass,
  Building2,
  ChevronRight,
  TrendingUp,
  ChevronDown,
  Check,
} from "lucide-react";
import MarketClock from "../../components/onboarding/MarketClock";

// Major Session Configurations (Hours in UTC)
const SESSIONS = [
  {
    id: "sydney",
    name: "Sydney Session",
    city: "Sydney",
    country: "Australia",
    flag: "🇦🇺",
    utcStart: 22, // 22:00 UTC
    utcEnd: 7,   // 07:00 UTC (crosses midnight)
    volumeShare: "4%",
    volatility: "Low to Moderate",
    volatilityLevel: 1, // 1: low, 2: med, 3: high, 4: ultra
    color: "violet",
    accentBorder: "border-blue-500/30",
    accentBg: "bg-blue-500/10",
    accentText: "text-blue-600 dark:text-blue-400",
    accentGradient: "from-blue-500 to-blue-600",
    description: "Kicks off the global trading day. Relatively calm liquidity, setting initial sentiment for Asia.",
    keyPairs: ["AUD/USD", "NZD/USD", "AUD/JPY", "EUR/AUD"],
    tactics: "Range trades, initial support/resistance establishment, monitoring RBA interest rate announcements.",
  },
  {
    id: "tokyo",
    name: "Tokyo / Asian Session",
    city: "Tokyo",
    country: "Japan",
    flag: "🇯🇵",
    utcStart: 0,  // 00:00 UTC
    utcEnd: 9,   // 09:00 UTC
    volumeShare: "14%",
    volatility: "Moderate",
    volatilityLevel: 2,
    color: "blue",
    accentBorder: "border-blue-500/30",
    accentBg: "bg-blue-500/10",
    accentText: "text-blue-600 dark:text-blue-400",
    accentGradient: "from-blue-500 to-sky-600",
    description: "Driven by Asian central banks, corporate exporters, and BoJ interventions. Establishes the Asian consolidation range.",
    keyPairs: ["USD/JPY", "EUR/JPY", "GBP/JPY", "AUD/JPY"],
    tactics: "Asian range marking (high/low). Ideal for breakout-sweep setups when London opens.",
  },
  {
    id: "london",
    name: "London Session",
    city: "London",
    country: "United Kingdom",
    flag: "🇬🇧",
    utcStart: 8,  // 08:00 UTC
    utcEnd: 16.5, // 16:30 UTC
    volumeShare: "38%",
    volatility: "Very High",
    volatilityLevel: 4,
    color: "emerald",
    accentBorder: "border-blue-500/30",
    accentBg: "bg-blue-500/10",
    accentText: "text-blue-600 dark:text-blue-400",
    accentGradient: "from-blue-500 to-blue-600",
    description: "The financial capital of Forex. Commands the highest single volume share and initiates true daily trends.",
    keyPairs: ["EUR/USD", "GBP/USD", "EUR/GBP", "GBP/JPY"],
    tactics: "London Open Judas swings, false breakouts sweeping Asian liquidity, massive momentum follow-through.",
  },
  {
    id: "newyork",
    name: "New York Session",
    city: "New York",
    country: "United States",
    flag: "🇺🇸",
    utcStart: 13, // 13:00 UTC
    utcEnd: 22,   // 22:00 UTC
    volumeShare: "19%",
    volatility: "Very High",
    volatilityLevel: 4,
    color: "amber",
    accentBorder: "border-amber-500/30",
    accentBg: "bg-amber-500/10",
    accentText: "text-amber-600 dark:text-amber-400",
    accentGradient: "from-amber-500 to-orange-600",
    description: "The global reserve currency powerhouse. Aggressive volatility catalyzed by Wall Street and high-impact US economic news.",
    keyPairs: ["EUR/USD", "USD/JPY", "GBP/USD", "USD/CAD", "XAU/USD"],
    tactics: "US market open reaction, CPI / NFP news trading, continuation of London trend or afternoon reversal.",
  },
];

// High-Impact ICT & Institutional Killzones
const KILLZONES = [
  {
    id: "london-open",
    name: "London Open Killzone",
    subtitle: "The Judas Swing Window",
    utcStart: 7, // 07:00 UTC
    utcEnd: 10,  // 10:00 UTC
    estTime: "2:00 AM – 5:00 AM EST",
    impact: "Extreme Volatility",
    badgeColor: "emerald",
    focus: "EUR/USD, GBP/USD, GBP/JPY, DAX",
    strategy: "Smart money engineers a fake move against the true trend to trap retail breakout traders, sweeping Asian range liquidity before expanding.",
  },
  {
    id: "ny-am",
    name: "New York AM Killzone",
    subtitle: "Wall Street Open & News Driver",
    utcStart: 12, // 12:00 UTC
    utcEnd: 15,  // 15:00 UTC
    estTime: "7:00 AM – 10:00 AM EST",
    impact: "Extreme Volatility",
    badgeColor: "amber",
    focus: "NAS100, US30, Gold (XAUUSD), EUR/USD",
    strategy: "High-impact US data releases (8:30 AM EST) and NYSE equity market open (9:30 AM EST) create massive directional expansions and Fair Value Gap fills.",
  },
  {
    id: "overlap",
    name: "London / New York Overlap",
    subtitle: "The Golden Window (70% Global Volume)",
    utcStart: 13,   // 13:00 UTC
    utcEnd: 16.5,  // 16:30 UTC
    estTime: "8:00 AM – 11:30 AM EST",
    impact: "Peak Daily Liquidity",
    badgeColor: "rose",
    focus: "All USD, EUR & GBP Crosses, Metals",
    strategy: "Both European and North American trading floors are open simultaneously. Tightest spreads, deepest institutional book liquidity, and highest trend reliability.",
  },
  {
    id: "london-close",
    name: "London Close Killzone",
    subtitle: "European Fixing & Profit Taking",
    utcStart: 15, // 15:00 UTC
    utcEnd: 17,  // 17:00 UTC
    estTime: "10:00 AM – 12:00 PM EST",
    impact: "Moderate Reversal",
    badgeColor: "blue",
    focus: "EUR/USD, GBP/USD, Gold",
    strategy: "London banks and asset managers square balance sheets and take profits into the 4:00 PM London fix, frequently causing daily trend retracements.",
  },
  {
    id: "asian-range",
    name: "Asian Range Accumulation",
    subtitle: "Initial Liquidity Build",
    utcStart: 0, // 00:00 UTC
    utcEnd: 4,  // 04:00 UTC
    estTime: "7:00 PM – 11:00 PM EST",
    impact: "Range Consolidation",
    badgeColor: "purple",
    focus: "USD/JPY, AUD/USD, NZD/USD",
    strategy: "Orders accumulate in a tight range. Smart money sets liquidity pools above the Asian High and below the Asian Low for London to harvest.",
  },
];

const TIMEZONES = [
  { id: "LOCAL", label: "Local Device Time", zone: Intl.DateTimeFormat().resolvedOptions().timeZone },
  { id: "UTC", label: "UTC (London Standard / Benchmark)", zone: "UTC" },
  { id: "America/New_York", label: "New York (EST/EDT)", zone: "America/New_York" },
  { id: "Europe/London", label: "London (GMT/BST)", zone: "Europe/London" },
  { id: "Asia/Tokyo", label: "Tokyo (JST)", zone: "Asia/Tokyo" },
  { id: "Australia/Sydney", label: "Sydney (AEST/AEDT)", zone: "Australia/Sydney" },
  { id: "Europe/Frankfurt", label: "Frankfurt (CET/CEST)", zone: "Europe/Berlin" },
  { id: "Asia/Dubai", label: "Dubai (GST, UTC+4)", zone: "Asia/Dubai" },
  { id: "Asia/Kolkata", label: "India / IST (UTC+5:30)", zone: "Asia/Kolkata" },
  { id: "Asia/Singapore", label: "Singapore / Hong Kong (UTC+8)", zone: "Asia/Singapore" },
];

export default function MarketHours() {
  const [now, setNow] = useState(() => new Date());
  const [selectedTz, setSelectedTz] = useState(
    () => localStorage.getItem("forex_preferred_tz") || "LOCAL"
  );
  const [clockTz, setClockTz] = useState("UTC");
  const [isTzDropdownOpen, setIsTzDropdownOpen] = useState(false);
  const tzDropdownRef = useRef(null);
  const menuRef = useRef(null);
  const [coords, setCoords] = useState({
    top: 0,
    left: 0,
    width: 0,
    placeAbove: false,
  });

  // Position calculation with viewport boundary safety (eliminates clipping & stacking bugs)
  const updatePosition = useCallback(() => {
    if (!tzDropdownRef.current) return;
    const rect = tzDropdownRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const estimatedHeight = 300;
    const placeAbove = spaceBelow < estimatedHeight && rect.top > estimatedHeight;

    const menuWidth = Math.max(rect.width, 280);
    let leftPos = rect.right - menuWidth;

    // Viewport safety boundaries
    if (leftPos < 8) leftPos = 8;
    if (leftPos + menuWidth > window.innerWidth - 8) {
      leftPos = window.innerWidth - menuWidth - 8;
    }

    setCoords({
      top: placeAbove ? rect.top - 6 : rect.bottom + 6,
      left: leftPos,
      width: menuWidth,
      placeAbove,
    });
  }, []);

  const toggleDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isTzDropdownOpen) {
      updatePosition();
    }
    setIsTzDropdownOpen((prev) => !prev);
  };

  // Close timezone dropdown on outside click, window resize/scroll, or Escape key
  useEffect(() => {
    if (!isTzDropdownOpen) return;

    const handleOutsideClick = (e) => {
      if (
        tzDropdownRef.current &&
        !tzDropdownRef.current.contains(e.target) &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setIsTzDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsTzDropdownOpen(false);
      }
    };
    const handleWindowChange = () => {
      updatePosition();
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleWindowChange, true);
    window.addEventListener("resize", handleWindowChange);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleWindowChange, true);
      window.removeEventListener("resize", handleWindowChange);
    };
  }, [isTzDropdownOpen, updatePosition]);

  const selectedTzLabel = useMemo(() => {
    const found = TIMEZONES.find((t) => t.id === selectedTz);
    return found ? found.label : "Local Device Time";
  }, [selectedTz]);

  // Live timer tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleTzChange = (tzId) => {
    setSelectedTz(tzId);
    localStorage.setItem("forex_preferred_tz", tzId);
  };

  // Determine active timezone string
  const activeTzString = useMemo(() => {
    if (selectedTz === "LOCAL") {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    }
    const found = TIMEZONES.find((t) => t.id === selectedTz);
    return found ? found.zone : "UTC";
  }, [selectedTz]);

  // Decimal current UTC time (0.00 to 23.99)
  const currentUtcHours = useMemo(() => {
    return now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
  }, [now]);

  // Weekend detection (Forex closes Friday 22:00 UTC, opens Sunday 21:00 UTC)
  const isWeekend = useMemo(() => {
    const day = now.getUTCDay(); // 0 is Sunday, 6 is Saturday
    const hours = now.getUTCHours();
    if (day === 6) return true; // All Saturday
    if (day === 5 && hours >= 22) return true; // Friday after 22:00 UTC
    if (day === 0 && hours < 21) return true; // Sunday before 21:00 UTC
    return false;
  }, [now]);

  // Helper: check if UTC range is currently open
  const isRangeActive = (start, end) => {
    if (isWeekend) return false;
    if (start <= end) {
      return currentUtcHours >= start && currentUtcHours < end;
    }
    // Overnight session (e.g. 22:00 to 07:00)
    return currentUtcHours >= start || currentUtcHours < end;
  };

  // Helper: format time decimal into HH:MM in selected timezone
  const formatHourInTz = (utcHourDecimal) => {
    const d = new Date(now);
    const wholeHours = Math.floor(utcHourDecimal);
    const wholeMinutes = Math.round((utcHourDecimal - wholeHours) * 60);
    d.setUTCHours(wholeHours, wholeMinutes, 0, 0);

    try {
      return new Intl.DateTimeFormat("en-US", {
        timeZone: activeTzString,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(d);
    } catch {
      return `${String(wholeHours).padStart(2, "0")}:${String(wholeMinutes).padStart(2, "0")} UTC`;
    }
  };

  // Helper: calculate countdown to open or close
  const getSessionCountdown = (start, end) => {
    if (isWeekend) {
      // Countdown to Sunday 21:00 UTC
      const nextOpen = new Date(now);
      const day = now.getUTCDay();
      const daysUntilSunday = (7 - day) % 7;
      nextOpen.setUTCDate(now.getUTCDate() + daysUntilSunday);
      nextOpen.setUTCHours(21, 0, 0, 0);
      const diffMs = nextOpen.getTime() - now.getTime();
      if (diffMs > 0) {
        const h = Math.floor(diffMs / (1000 * 60 * 60));
        const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return { label: `Opens Sun in ${h}h ${m}m`, type: "weekend" };
      }
    }

    const active = isRangeActive(start, end);
    let targetHour = active ? end : start;
    let diffHours = targetHour - currentUtcHours;
    if (diffHours < 0) diffHours += 24;

    const totalMinutes = Math.round(diffHours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;

    if (active) {
      return { label: `Closes in ${h}h ${m}m`, type: "closing", active: true };
    }
    return { label: `Opens in ${h}h ${m}m`, type: "opening", active: false };
  };

  // Active sessions count
  const activeSessions = useMemo(() => {
    return SESSIONS.filter((s) => isRangeActive(s.utcStart, s.utcEnd));
  }, [currentUtcHours, isWeekend]);

  // Active killzones
  const activeKillzones = useMemo(() => {
    return KILLZONES.filter((k) => isRangeActive(k.utcStart, k.utcEnd));
  }, [currentUtcHours, isWeekend]);

  // Current market phase description
  const marketPhase = useMemo(() => {
    if (isWeekend) return { title: "Weekend Closed", desc: "Global markets reopen Sunday at 21:00 UTC (Sydney Open).", tone: "amber" };
    if (isRangeActive(13, 16.5)) {
      return { title: "🔥 London / NY Overlap", desc: "Peak global volume & liquidity. High momentum trend continuation.", tone: "rose" };
    }
    if (isRangeActive(7, 10)) {
      return { title: "⚡ London Open Judas Swing", desc: "High volatility. Smart money sweeping Asian high/low liquidity.", tone: "emerald" };
    }
    if (isRangeActive(12, 15)) {
      return { title: "🎯 New York AM Session", desc: "US economic releases & Wall Street opening expansions.", tone: "amber" };
    }
    if (isRangeActive(0, 4)) {
      return { title: "🌙 Asian Accumulation Range", desc: "Lower volatility. Consolidation setting up London breakout targets.", tone: "indigo" };
    }
    if (activeSessions.length > 0) {
      return {
        title: `${activeSessions.map((s) => s.city).join(" & ")} Session Active`,
        desc: "Regular session order flow and standard algorithmic execution.",
        tone: "blue",
      };
    }
    return { title: "Low Volatility Off-Hours", desc: "Spreads may widen during transition periods.", tone: "neutral" };
  }, [activeSessions, isWeekend, currentUtcHours]);

  return (
    <div
      className="w-full max-w-7xl mx-auto font-sans pb-20 px-4 md:px-8 mt-4 md:mt-6 box-border"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {/* Top Breadcrumb Navigation */}
      <div className="mb-4">
        <Link
          to="/tools"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors group px-3 py-1.5 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Tools</span>
        </Link>
      </div>

      <div className="space-y-8 animate-in fade-in duration-300">
        {/* Hero Header Banner with Apple-grade frosted glass */}
        <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-blue-500/10 via-blue-500/10 to-blue-500/10 border border-blue-500/20 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(59,130,246,0.1)]">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-600 flex items-center justify-center text-white shadow-[0_0_24px_rgba(59,130,246,0.4)] shrink-0">
                <Clock className="w-7 h-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
                    Forex Market Hours & Killzones
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-500/15 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/30">
                    Real-Time Radar
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-2xl">
                  Track the 4 major global trading hubs (London, New York, Tokyo, Sydney), high-volatility ICT killzones, and institutional order-flow overlaps.
                </p>
              </div>
            </div>

            {/* Timezone Selector Controls - Apple Bento Custom Dropdown */}
            <div className="relative w-full sm:w-auto" ref={tzDropdownRef}>
              <button
                type="button"
                onClick={toggleDropdown}
                className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl border transition-all duration-200 cursor-pointer text-left w-full sm:min-w-[240px] backdrop-blur-xl shadow-xs group select-none ${
                  isTzDropdownOpen
                    ? "bg-white dark:bg-[#161a24] border-blue-500/50 ring-2 ring-blue-500/20 shadow-md"
                    : "bg-white/80 hover:bg-white dark:bg-[#121418]/90 dark:hover:bg-[#181b22] border-black/[0.08] dark:border-white/10 hover:border-black/20 dark:hover:border-white/20"
                }`}
                aria-haspopup="listbox"
                aria-expanded={isTzDropdownOpen}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400 tracking-wider">
                      Display Timezone
                    </span>
                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate pr-1">
                      {selectedTzLabel}
                    </span>
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-neutral-400 dark:text-neutral-500 shrink-0 transition-transform duration-200 ${
                    isTzDropdownOpen ? "rotate-180 text-blue-500" : "group-hover:text-neutral-700 dark:group-hover:text-neutral-300"
                  }`}
                />
              </button>

              {/* Floating Apple-Style Frosted Glass Dropdown Panel (Portaled for Z-Index Safety) */}
              {isTzDropdownOpen &&
                createPortal(
                  <div
                    ref={menuRef}
                    style={{
                      position: "fixed",
                      top: coords.placeAbove ? undefined : coords.top,
                      bottom: coords.placeAbove
                        ? window.innerHeight - coords.top
                        : undefined,
                      left: coords.left,
                      width: coords.width,
                      zIndex: 999999,
                    }}
                    className="bg-white/95 dark:bg-[#121622]/95 border border-black/[0.08] dark:border-white/[0.12] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.22)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.75)] backdrop-blur-2xl p-1.5 max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 space-y-0.5 select-none"
                    role="listbox"
                  >
                    <div className="px-3 py-1.5 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest border-b border-black/[0.04] dark:border-white/[0.06] mb-1">
                      Select Benchmark Timezone
                    </div>
                    {TIMEZONES.map((tz) => {
                      const isSelected = selectedTz === tz.id;
                      return (
                        <button
                          key={tz.id}
                          type="button"
                          onClick={() => {
                            handleTzChange(tz.id);
                            setIsTzDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors text-left cursor-pointer ${
                            isSelected
                              ? "bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20"
                              : "text-neutral-700 dark:text-neutral-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.08]"
                          }`}
                          role="option"
                          aria-selected={isSelected}
                        >
                          <span className="truncate">{tz.label}</span>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-blue-500 shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>,
                  document.body
                )}
            </div>
          </div>
        </div>

        {/* Global Market Overview Bento Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Market Status */}
          <div className="p-5 rounded-2xl bg-white/80 dark:bg-[#121418]/90 border border-black/[0.06] dark:border-white/10 backdrop-blur-xl shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                Market Status
              </span>
              <span
                className={`flex h-2.5 w-2.5 relative ${
                  isWeekend ? "" : "animate-pulse"
                }`}
              >
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isWeekend ? "bg-amber-500" : "bg-blue-500"
                  }`}
                />
              </span>
            </div>
            <div className="text-lg font-black text-neutral-900 dark:text-white">
              {isWeekend ? "Weekend Closed" : "Forex Market Open"}
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              {isWeekend
                ? "Reopens Sunday 21:00 UTC with Sydney"
                : `${activeSessions.length} active session${activeSessions.length === 1 ? "" : "s"} trading live`}
            </p>
          </div>

          {/* Card 2: Current Phase */}
          <div className="p-5 rounded-2xl bg-white/80 dark:bg-[#121418]/90 border border-black/[0.06] dark:border-white/10 backdrop-blur-xl shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                Current Market Phase
              </span>
              <Activity className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-base font-black text-neutral-900 dark:text-white truncate">
              {marketPhase.title}
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-1">
              {marketPhase.desc}
            </p>
          </div>

          {/* Card 3: Active Killzones */}
          <div className="p-5 rounded-2xl bg-white/80 dark:bg-[#121418]/90 border border-black/[0.06] dark:border-white/10 backdrop-blur-xl shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                ICT Killzone Radar
              </span>
              <Flame className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-lg font-black text-neutral-900 dark:text-white">
              {activeKillzones.length > 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400">
                  {activeKillzones[0].name}
                </span>
              ) : (
                <span className="text-neutral-600 dark:text-neutral-300">Off-Killzone</span>
              )}
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              {activeKillzones.length > 0
                ? activeKillzones[0].subtitle
                : "No institutional killzone currently active"}
            </p>
          </div>

          {/* Card 4: Benchmark Digital Clock */}
          <div className="p-5 rounded-2xl bg-white/80 dark:bg-[#121418]/90 border border-black/[0.06] dark:border-white/10 backdrop-blur-xl shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                Current Time
              </span>
              <Timer className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xl font-mono font-black text-neutral-900 dark:text-white tracking-wider">
              {new Intl.DateTimeFormat("en-US", {
                timeZone: activeTzString,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
              }).format(now)}
            </div>
            <p className="text-[11px] font-mono text-neutral-600 dark:text-neutral-400">
              {activeTzString.split("/").pop().replace("_", " ")}
            </p>
          </div>
        </div>

        {/* 24-Hour Visual Session Schedule (Interactive Horizontal Gantt Bar) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white/80 dark:bg-[#121418]/90 border border-black/[0.06] dark:border-white/10 backdrop-blur-xl shadow-lg space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
                  24-Hour Global Timeline (UTC)
                </h2>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                Pulsing red needle indicates the current exact global time position.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                Active Now
              </span>
              <span className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Peak Overlap
              </span>
            </div>
          </div>

          {/* Gantt Bar Visualization Container */}
          <div className="relative pt-6 pb-2 overflow-x-auto select-none">
            {/* Top 24h Axis Markers */}
            <div className="relative h-6 border-b border-black/[0.08] dark:border-white/10 text-[10px] font-mono text-neutral-600 dark:text-neutral-300">
              {Array.from({ length: 13 }).map((_, i) => {
                const hour = i * 2;
                const leftPercent = (hour / 24) * 100;
                return (
                  <div
                    key={hour}
                    className="absolute -translate-x-1/2 flex flex-col items-center"
                    style={{ left: `${leftPercent}%` }}
                  >
                    <span>{String(hour).padStart(2, "0")}:00</span>
                    <div className="w-[1px] h-1.5 bg-neutral-300 dark:bg-white/20 mt-0.5" />
                  </div>
                );
              })}
            </div>

            {/* Session Horizontal Tracks */}
            <div className="space-y-3 mt-4 relative">
              {SESSIONS.map((session) => {
                const isActive = isRangeActive(session.utcStart, session.utcEnd);

                // Calculate CSS positioning
                let segments = [];
                if (session.utcStart <= session.utcEnd) {
                  const left = (session.utcStart / 24) * 100;
                  const width = ((session.utcEnd - session.utcStart) / 24) * 100;
                  segments.push({ left, width });
                } else {
                  // Crosses midnight: two segments (Start -> 24 and 0 -> End)
                  const left1 = (session.utcStart / 24) * 100;
                  const width1 = ((24 - session.utcStart) / 24) * 100;
                  const left2 = 0;
                  const width2 = (session.utcEnd / 24) * 100;
                  segments.push({ left: left1, width: width1 });
                  segments.push({ left: left2, width: width2 });
                }

                return (
                  <div key={session.id} className="relative h-9 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] flex items-center">
                    {/* Background Bar Segments */}
                    {segments.map((seg, idx) => (
                      <div
                        key={idx}
                        className={`absolute top-1 bottom-1 rounded-lg transition-all duration-300 flex items-center px-3 ${
                          isActive
                            ? `${session.accentBg} ${session.accentBorder} border shadow-xs`
                            : "bg-black/[0.05] dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/5 opacity-60"
                        }`}
                        style={{
                          left: `${seg.left}%`,
                          width: `${seg.width}%`,
                        }}
                      >
                        <span className={`text-[11px] font-bold truncate ${isActive ? session.accentText : "text-neutral-500"}`}>
                          {session.flag} {session.city} ({session.volumeShare})
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })}

              {/* Overlap Special Band (13:00 to 16:30) */}
              <div
                className="absolute top-0 bottom-0 pointer-events-none rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 z-0"
                style={{
                  left: `${(13 / 24) * 100}%`,
                  width: `${((16.5 - 13) / 24) * 100}%`,
                }}
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white dark:text-neutral-950 text-[9px] font-black uppercase px-1.5 py-0.2 rounded shadow-xs whitespace-nowrap">
                  Peak Overlap
                </div>
              </div>

              {/* Current Time Needle */}
              <div
                className="absolute top-0 bottom-0 w-[2px] bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)] z-10 pointer-events-none"
                style={{
                  left: `${(currentUtcHours / 24) * 100}%`,
                }}
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white dark:border-[#121418] shadow-md" />
              </div>
            </div>
          </div>
        </div>

        {/* The 4 Major Trading Session Cards (Bento Grid) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
                Global Financial Hubs
              </h2>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Operating hours converted to your chosen timezone ({activeTzString}).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SESSIONS.map((session) => {
              const active = isRangeActive(session.utcStart, session.utcEnd);
              const countdown = getSessionCountdown(session.utcStart, session.utcEnd);

              return (
                <div
                  key={session.id}
                  className={`p-6 rounded-3xl bg-white/80 dark:bg-[#121418]/90 border transition-all duration-300 backdrop-blur-xl shadow-md ${
                    active
                      ? `${session.accentBorder} shadow-lg ring-1 ${session.accentBorder}`
                      : "border-black/[0.06] dark:border-white/10 hover:border-black/[0.12] dark:hover:border-white/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{session.flag}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                            {session.name}
                          </h3>
                        </div>
                        <span className="text-xs text-neutral-600 dark:text-neutral-400">
                          {session.country} • {session.volumeShare} Daily Market Volume
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                          active
                            ? "bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30"
                            : "bg-neutral-100 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 border border-black/[0.06] dark:border-white/10"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            active ? "bg-blue-500 animate-pulse" : "bg-neutral-400"
                          }`}
                        />
                        {active ? "Session Open" : "Closed"}
                      </span>
                      <span className="text-[11px] font-mono font-medium text-neutral-600 dark:text-neutral-400">
                        {countdown.label}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-4 leading-relaxed">
                    {session.description}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3 pt-4 border-t border-black/[0.06] dark:border-white/10">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-neutral-600 dark:text-neutral-300 block">
                        Hours in Selected Timezone
                      </span>
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-0.5 block">
                        {formatHourInTz(session.utcStart)} – {formatHourInTz(session.utcEnd)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-neutral-600 dark:text-neutral-300 block">
                        Volatility Profile
                      </span>
                      <span className={`text-xs font-bold mt-0.5 block ${session.accentText}`}>
                        {session.volatility}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <span className="text-[10px] font-bold uppercase text-neutral-600 dark:text-neutral-300 block mb-1.5">
                      Prime Currency Pairs
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {session.keyPairs.map((pair) => (
                        <span
                          key={pair}
                          className="px-2.5 py-1 rounded-lg bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/10 text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300"
                        >
                          {pair}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* High-Impact ICT Killzones Bento Section */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white/80 dark:bg-[#121418]/90 border border-black/[0.06] dark:border-white/10 backdrop-blur-xl shadow-lg space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
                  Institutional & ICT Killzones
                </h2>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                Optimal trade entry windows where algorithmic volume, liquidity sweeps, and expansions occur.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {KILLZONES.map((kz) => {
              const active = isRangeActive(kz.utcStart, kz.utcEnd);
              const countdown = getSessionCountdown(kz.utcStart, kz.utcEnd);

              return (
                <div
                  key={kz.id}
                  className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                    active
                      ? "bg-amber-500/[0.07] border-amber-500/40 shadow-md ring-1 ring-amber-500/30"
                      : "bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.06] dark:border-white/10"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                          {kz.name}
                        </h3>
                        <p className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 mt-0.5">
                          {kz.subtitle}
                        </p>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase shrink-0 ${
                          active
                            ? "bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/30 animate-pulse"
                            : "bg-black/[0.04] dark:bg-white/5 text-neutral-500 border border-black/[0.06] dark:border-white/10"
                        }`}
                      >
                        {active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/60 dark:bg-black/20 border border-black/[0.04] dark:border-white/5 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-neutral-600 dark:text-neutral-300 font-medium">Your Time:</span>
                        <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                          {formatHourInTz(kz.utcStart)} – {formatHourInTz(kz.utcEnd)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-neutral-600 dark:text-neutral-300 font-medium">EST Benchmark:</span>
                        <span className="font-mono text-neutral-600 dark:text-neutral-400">{kz.estTime}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-neutral-600 dark:text-neutral-300 font-medium">Timing Status:</span>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{countdown.label}</span>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {kz.strategy}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-black/[0.06] dark:border-white/10 flex items-center justify-between text-[11px]">
                    <span className="text-neutral-600 dark:text-neutral-300 font-medium">Optimal Assets:</span>
                    <span className="font-bold text-neutral-800 dark:text-neutral-200 truncate ml-2">
                      {kz.focus}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Luxury Swiss / Apple Clock & City Clocks Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Analog Dial (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col items-center p-6 rounded-3xl bg-white/80 dark:bg-[#121418]/90 border border-black/[0.06] dark:border-white/10 backdrop-blur-xl shadow-lg">
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                Analog Market Clock
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setClockTz("UTC")}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    clockTz === "UTC"
                      ? "bg-blue-600 text-white"
                      : "bg-black/[0.04] dark:bg-white/5 text-neutral-500"
                  }`}
                >
                  UTC
                </button>
                <button
                  onClick={() => setClockTz("America/New_York")}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    clockTz === "America/New_York"
                      ? "bg-blue-600 text-white"
                      : "bg-black/[0.04] dark:bg-white/5 text-neutral-500"
                  }`}
                >
                  NY
                </button>
                <button
                  onClick={() => setClockTz("Europe/London")}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    clockTz === "Europe/London"
                      ? "bg-blue-600 text-white"
                      : "bg-black/[0.04] dark:bg-white/5 text-neutral-500"
                  }`}
                >
                  LON
                </button>
                <button
                  onClick={() => setClockTz("Asia/Tokyo")}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    clockTz === "Asia/Tokyo"
                      ? "bg-blue-600 text-white"
                      : "bg-black/[0.04] dark:bg-white/5 text-neutral-500"
                  }`}
                >
                  TYO
                </button>
              </div>
            </div>

            <MarketClock timezone={clockTz} />
          </div>

          {/* Right Rules & Golden Advice (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-3xl bg-white/80 dark:bg-[#121418]/90 border border-black/[0.06] dark:border-white/10 backdrop-blur-xl shadow-lg space-y-4">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  The Golden Rules of Session Timing
                </h3>
              </div>

              <div className="space-y-3 text-xs text-neutral-600 dark:text-neutral-400">
                <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/5">
                  <span className="font-bold text-neutral-900 dark:text-white block mb-0.5">
                    1. Focus on the London/NY Overlap (13:00 - 16:30 UTC)
                  </span>
                  Over 70% of total daily forex turnover happens during these 3.5 hours. Spreads are lowest and breakouts have the highest likelihood of continuation.
                </div>

                <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/5">
                  <span className="font-bold text-neutral-900 dark:text-white block mb-0.5">
                    2. Beware of the 5:00 PM EST Rollover Spread Widening
                  </span>
                  Between 21:45 and 22:30 UTC, New York banks close and Sydney opens. Liquidity thins out dramatically, causing broker spreads to blow out on major pairs.
                </div>

                <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/5">
                  <span className="font-bold text-neutral-900 dark:text-white block mb-0.5">
                    3. Mark Asian High & Low Before London Open
                  </span>
                  The Tokyo session consolidates in a predictable range. Look for the London open (07:00-08:00 UTC) to sweep one side of this range before initiating the true trend.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
