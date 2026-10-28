import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Clock,
  Bell,
  Sun,
  Moon,
  PenSquare,
  RefreshCw,
  BarChart2,
  PlusCircle,
  User,
} from "lucide-react";
import ThemeToggle from "../ThemeToggle";
import NotificationBell from "../NotificationBell";

export default function TradeFXBookTopBar({
  onOpenAddTradeModal,
  onOpenSearch,
}) {
  const navigate = useNavigate();
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState("");
  const [currentDateStr, setCurrentDateStr] = useState("");
  const dropdownRef = useRef(null);

  const userEmail = localStorage.getItem("userEmail") || "Trader";

  // Live real-time clock updating every second (e.g. 01:14:37 PM)
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
    <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-black/[0.05] dark:border-white/[0.06]">
      {/* ── LEFT: Title & Live Date (Screenshots 1 & 2) ── */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
          Dashboard
        </h1>
        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">
          {currentDateStr || "Today"}
        </p>
      </div>

      {/* ── CENTER: Search Bar with Ctrl+K ── */}
      <div className="flex-1 max-w-md mx-auto hidden lg:block">
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

      {/* ── RIGHT: Action Cluster (Screenshots 1 & 2) ── */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        {/* Mobile Search trigger */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="lg:hidden p-2.5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#121622] text-neutral-600 dark:text-neutral-300"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Theme Toggle */}
        <div className="p-0.5 rounded-2xl bg-white/80 dark:bg-[#121622]/80 border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
          <ThemeToggle />
        </div>

        {/* Quick Action (+) Button & Dropdown Menu (Screenshot 2) */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
            className="w-10 h-10 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white/90 dark:bg-[#121622]/90 hover:bg-neutral-50 dark:hover:bg-white/[0.06] text-neutral-700 dark:text-neutral-200 flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Quick Actions"
          >
            <Plus className={`w-5 h-5 transition-transform duration-200 ${isQuickActionsOpen ? "rotate-45" : ""}`} />
          </button>

          {/* Quick Actions Dropdown Menu (Screenshot 2) */}
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
                className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2.5 transition-colors cursor-pointer text-left"
              >
                <Plus className="w-4 h-4 text-blue-500" />
                <span>Add Manual Trade</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsQuickActionsOpen(false);
                  navigate("/trades");
                }}
                className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2.5 transition-colors cursor-pointer text-left"
              >
                <PenSquare className="w-4 h-4 text-neutral-500" />
                <span>New Journal Entry</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsQuickActionsOpen(false);
                  navigate("/admin/setup");
                }}
                className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2.5 transition-colors cursor-pointer text-left"
              >
                <RefreshCw className="w-4 h-4 text-neutral-500" />
                <span>Sync MT5 Account</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsQuickActionsOpen(false);
                  navigate("/analytics");
                }}
                className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2.5 transition-colors cursor-pointer text-left"
              >
                <BarChart2 className="w-4 h-4 text-neutral-500" />
                <span>View Analytics</span>
              </button>
            </div>
          )}
        </div>

        {/* Live Real-Time Clock Badge (Screenshot 1 & 2) */}
        <div className="h-10 px-3.5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white/80 dark:bg-[#121622]/80 text-neutral-700 dark:text-neutral-300 flex items-center gap-2 text-xs font-mono font-bold shadow-sm select-none">
          <Clock className="w-3.5 h-3.5 text-neutral-400" />
          <span>{currentTimeStr || "--:--:--"}</span>
        </div>

        {/* Notification Bell */}
        <div className="p-0.5 rounded-2xl bg-white/80 dark:bg-[#121622]/80 border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
          <NotificationBell />
        </div>

        {/* User Profile Badge (Screenshot 1) */}
        <div
          onClick={() => navigate("/profile")}
          className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-2xl bg-white/80 dark:bg-[#121622]/80 border border-black/[0.06] dark:border-white/[0.08] hover:border-blue-500/30 transition-all cursor-pointer shadow-sm"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-inner">
            {userEmail.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:flex flex-col items-start leading-none pr-1">
            <span className="text-[12px] font-bold text-neutral-800 dark:text-neutral-200 truncate max-w-[90px]">
              {userEmail.split("@")[0]}
            </span>
            <span className="text-[9px] uppercase font-bold text-blue-600 dark:text-blue-400 mt-0.5">
              PRO
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
