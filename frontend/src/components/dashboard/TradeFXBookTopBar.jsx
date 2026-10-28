import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Clock,
  PenSquare,
  RefreshCw,
  BarChart2,
} from "lucide-react";
import ThemeToggle from "../ThemeToggle";
import NotificationBell from "../NotificationBell";
import AccountFilter from "../AccountFilter";

export default function TradeFXBookTopBar({
  trades = [],
  selectedAccount = "",
  onSelectAccount,
  onOpenAddTradeModal,
  onOpenSearch,
}) {
  const navigate = useNavigate();
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState("");
  const [currentDateStr, setCurrentDateStr] = useState("");
  const dropdownRef = useRef(null);

  const userEmail = localStorage.getItem("userEmail") || "Trader";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Live real-time clock updating every second (e.g. 08:04:40 PM)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setCurrentDateStr(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Dismiss dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsQuickActionsOpen(false);
      }
    };
    if (isQuickActionsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isQuickActionsOpen]);

  return (
    <div className="w-full flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
      {/* ── LEFT: Welcome {Name} & Live Date ── */}
      <div className="shrink-0">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
          {getGreeting()},{" "}
          <span className="text-emerald-500 font-semibold">
            {userEmail.split("@")[0] || "Trader"}
          </span>
        </h1>
        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">
          {currentDateStr || "Today"}
        </p>
      </div>

      {/* ── CENTER: Search Bar with Ctrl+K ── */}
      <div className="flex-1 max-w-sm mx-auto hidden 2xl:block">
        <button
          type="button"
          onClick={onOpenSearch}
          className="w-full h-10 px-3.5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white/80 dark:bg-[#121622]/80 hover:bg-white dark:hover:bg-[#161a29] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 flex items-center justify-between transition-all shadow-sm cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-neutral-400" />
            <span className="text-xs font-medium">Search...</span>
          </div>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-white/[0.08] text-neutral-500 dark:text-neutral-400 border border-black/[0.04] dark:border-white/[0.06]">
            Ctrl+K
          </span>
        </button>
      </div>

      {/* ── RIGHT ACTION CLUSTER (Cleanly aligned horizontally and vertically) ── */}
      <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
        {/* Mobile Search trigger */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="2xl:hidden h-10 w-10 flex items-center justify-center rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#121622] text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/[0.06]"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* 1. Account Dropdown Switcher (Positioned strictly to the left of the '+' symbol) */}
        <AccountFilter
          trades={trades}
          selectedAccount={selectedAccount}
          onChange={onSelectAccount}
        />

        {/* 2. Quick Action (+) Button & Dropdown Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
            className="w-10 h-10 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white/90 dark:bg-[#121622]/90 hover:bg-neutral-50 dark:hover:bg-white/[0.06] text-neutral-700 dark:text-neutral-200 flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Quick Actions"
          >
            <Plus className={`w-5 h-5 transition-transform duration-200 ${isQuickActionsOpen ? "rotate-45" : ""}`} />
          </button>

          {isQuickActionsOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-white dark:bg-[#121622] border border-black/[0.08] dark:border-white/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider border-b border-black/[0.05] dark:border-white/[0.06] mb-1">
                Quick Actions
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsQuickActionsOpen(false);
                  if (onOpenAddTradeModal) onOpenAddTradeModal();
                }}
                className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-2.5 transition-colors cursor-pointer text-left"
              >
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>Add Manual Trade</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsQuickActionsOpen(false);
                  navigate("/trades");
                }}
                className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-2.5 transition-colors cursor-pointer text-left"
              >
                <PenSquare className="w-4 h-4 text-neutral-400" />
                <span>New Journal Entry</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsQuickActionsOpen(false);
                  navigate("/admin/setup");
                }}
                className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-2.5 transition-colors cursor-pointer text-left"
              >
                <RefreshCw className="w-4 h-4 text-neutral-400" />
                <span>Sync MT5 Account</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsQuickActionsOpen(false);
                  navigate("/analytics");
                }}
                className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-2.5 transition-colors cursor-pointer text-left"
              >
                <BarChart2 className="w-4 h-4 text-neutral-400" />
                <span>View Analytics</span>
              </button>
            </div>
          )}
        </div>

        {/* 3. Live Clock Badge */}
        <div className="h-10 px-3 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white/80 dark:bg-[#121622]/80 text-neutral-700 dark:text-neutral-300 flex items-center gap-2 text-xs font-mono font-bold shadow-sm select-none">
          <Clock className="w-3.5 h-3.5 text-neutral-400" />
          <span>{currentTimeStr || "--:--:--"}</span>
        </div>

        {/* 4. User Profile Badge */}
        <div
          onClick={() => navigate("/profile")}
          className="h-10 flex items-center gap-2 px-2 rounded-2xl bg-white/80 dark:bg-[#121622]/80 border border-black/[0.06] dark:border-white/[0.08] hover:border-emerald-500/30 transition-all cursor-pointer shadow-sm select-none"
        >
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center font-bold text-[11px] shadow-sm">
            {userEmail.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:flex flex-col items-start leading-none pr-1">
            <span className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 truncate max-w-[80px]">
              {userEmail.split("@")[0]}
            </span>
            <span className="text-[8px] uppercase font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              PRO
            </span>
          </div>
        </div>

        {/* 5. Notification Bell (Right side of profile icon) */}
        <div className="h-10 p-0.5 rounded-2xl bg-white/80 dark:bg-[#121622]/80 border border-black/[0.06] dark:border-white/[0.08] shadow-sm flex items-center justify-center">
          <NotificationBell />
        </div>

        {/* 6. Theme Switcher (Right side of notification bell) */}
        <div className="h-10 p-0.5 rounded-2xl bg-white/80 dark:bg-[#121622]/80 border border-black/[0.06] dark:border-white/[0.08] shadow-sm flex items-center justify-center">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
