// frontend/src/components/dashboard/MorningTradingQuoteModal.jsx
import React, { useState, useEffect } from "react";
import { X, Sparkles, Shield, Compass, Target, CheckCircle2 } from "lucide-react";

const DISCIPLINE_QUOTES = [
  {
    topic: "ON DISCIPLINE",
    icon: "⚖️",
    quote: "A plan only works when you follow it.",
    author: "ForexNotes Philosophy",
  },
  {
    topic: "ON RISK MANAGEMENT",
    icon: "🛡️",
    quote: "Protect your capital first; the profits will take care of themselves.",
    author: "Paul Tudor Jones",
  },
  {
    topic: "ON PATIENCE",
    icon: "⏳",
    quote: "The market is a device for transferring money from the impatient to the patient.",
    author: "Warren Buffett",
  },
  {
    topic: "ON EXECUTION",
    icon: "🎯",
    quote: "You don't need to know what will happen next to make money in trading.",
    author: "Mark Douglas",
  },
  {
    topic: "ON LOSS ACCEPTANCE",
    icon: "💡",
    quote: "Accepting a loss is a skill. The market owes you nothing.",
    author: "Trading Psychology",
  },
  {
    topic: "ON RULE ADHERENCE",
    icon: "📐",
    quote: "Consistency comes from strictly repeatable processes, never luck.",
    author: "Mark Douglas",
  },
];

export default function MorningTradingQuoteModal({ onStartDay }) {
  const [isOpen, setIsOpen] = useState(false);
  const [quoteData, setQuoteData] = useState(DISCIPLINE_QUOTES[0]);

  useEffect(() => {
    try {
      const now = new Date();
      // Format YYYY-MM-DD in local time
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
        now.getDate()
      ).padStart(2, "0")}`;

      const lastDismissedDate = localStorage.getItem("fn_trading_day_started");

      // Reset every morning (if today !== lastDismissedDate)
      if (lastDismissedDate !== todayStr) {
        // Pick quote of the day based on day of year
        const dayOfYear = Math.floor(
          (now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
        );
        const index = dayOfYear % DISCIPLINE_QUOTES.length;
        setQuoteData(DISCIPLINE_QUOTES[index] || DISCIPLINE_QUOTES[0]);
        setIsOpen(true);
      }
    } catch (e) {
      // Fail silently if localStorage disabled
    }
  }, []);

  const handleStartTradingDay = () => {
    try {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
        now.getDate()
      ).padStart(2, "0")}`;
      localStorage.setItem("fn_trading_day_started", todayStr);
    } catch (e) {}

    setIsOpen(false);
    if (onStartDay) onStartDay();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none animate-in fade-in duration-300">
      {/* macOS / iOS Glassmorphism Backdrop Blur */}
      <div
        className="fixed inset-0 bg-neutral-900/40 dark:bg-black/60 backdrop-blur-md transition-opacity"
        onClick={handleStartTradingDay}
      />

      {/* macOS / iOS Transparent Window Card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white/95 dark:bg-[#111622]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.1] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.7)] p-6 sm:p-8 text-center transition-all animate-in zoom-in-95 duration-200">
        
        {/* macOS Top Accent Bar */}
        <div className="w-12 h-1 bg-[#0066FF] rounded-full mx-auto -mt-2 mb-6 opacity-90" />

        {/* Category Pill Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-[11px] font-bold uppercase tracking-wider mb-5">
          <span>{quoteData.icon}</span>
          <span>{quoteData.topic}</span>
        </div>

        {/* Motivational Discipline Quote */}
        <blockquote className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white tracking-tight leading-snug mb-3">
          &ldquo;{quoteData.quote}&rdquo;
        </blockquote>

        <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500 mb-8">
          — {quoteData.author}
        </p>

        {/* Primary Action Button: Start My Trading Day (Apple Squircle & Blue Glow) */}
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleStartTradingDay}
            className="w-full sm:w-auto min-w-[210px] h-11 px-6 rounded-2xl bg-[#0066FF] hover:bg-[#0055D6] active:scale-[0.98] text-white font-bold text-sm shadow-[0_4px_20px_rgba(0,102,255,0.35)] transition-all cursor-pointer flex items-center justify-center gap-2 border border-white/20"
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span className="text-white">Start My Trading Day</span>
          </button>
          
          <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">
            24h trading day check-in • Resets tomorrow morning
          </p>
        </div>
      </div>
    </div>
  );
}
