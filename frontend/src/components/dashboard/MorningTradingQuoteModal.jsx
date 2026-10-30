// frontend/src/components/dashboard/MorningTradingQuoteModal.jsx
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle2, Sparkles } from "lucide-react";

const DISCIPLINE_QUOTES = [
  {
    topic: "ON DISCIPLINE",
    icon: "⚖️",
    quote: "A plan only works when you follow it.",
    author: "ForexNotes Philosophy",
  },
  {
    topic: "ON EXECUTION",
    icon: "🎯",
    quote: "You don't need to know what will happen next to make money in trading.",
    author: "Mark Douglas",
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

  // Control body scroll lock and hide external floating widgets when open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("fn-morning-modal-open");
      document.body.style.overflow = "hidden";
    } else {
      document.body.classList.remove("fn-morning-modal-open");
      document.body.style.overflow = "";
    }

    return () => {
      document.body.classList.remove("fn-morning-modal-open");
      document.body.style.overflow = "";
    };
  }, [isOpen]);

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

  // Render via React Portal directly into document.body to cover the entire viewport
  // (Full screen: completely covers sidebar navbar, topbar, and floating AI widgets)
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[999999] w-screen h-screen min-h-screen flex items-center justify-center p-4 sm:p-6 select-none animate-in fade-in duration-300"
    >
      {/* ── 1. Full Viewport Deep Blur Backdrop (Covers 100% of navbar & AI) ── */}
      <div
        className="fixed inset-0 w-screen h-screen min-h-screen bg-neutral-950/65 dark:bg-black/80 backdrop-blur-2xl transition-all duration-300"
        onClick={handleStartTradingDay}
      />

      {/* ── 2. macOS / iOS Glassmorphism Card with Interactive Hover Effects ── */}
      <div className="group relative z-10 w-full max-w-[440px] overflow-hidden rounded-[28px] bg-white/95 dark:bg-[#111622]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.12] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35)] dark:shadow-[0_25px_80px_-15px_rgba(0,0,0,0.8)] p-6 sm:p-8 text-center transition-all duration-300 hover:scale-[1.015] hover:shadow-[0_30px_90px_rgba(0,102,255,0.22)] dark:hover:shadow-[0_30px_90px_rgba(0,102,255,0.38)] hover:border-blue-500/40 dark:hover:border-blue-400/50 animate-in zoom-in-95 duration-250">
        
        {/* Subtle macOS top close button */}
        <button
          type="button"
          onClick={handleStartTradingDay}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all hover:scale-110 cursor-pointer"
          title="Close (Starts Trading Day)"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* macOS Top Accent Blue Notch (Expands and glows on card hover) */}
        <div className="w-12 h-1.5 bg-[#0066FF] rounded-full mx-auto -mt-2 mb-6 opacity-95 transition-all duration-300 group-hover:w-20 group-hover:shadow-[0_0_14px_#0066FF]" />

        {/* Category Pill Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-[11px] font-bold uppercase tracking-wider mb-5 transition-all duration-200 hover:scale-105 hover:bg-amber-500/15 cursor-default">
          <span className="text-xs">{quoteData.icon}</span>
          <span>{quoteData.topic}</span>
        </div>

        {/* Motivational Discipline Quote (Clean typography like TradeFXBook) */}
        <blockquote className="text-lg sm:text-[22px] font-bold text-neutral-900 dark:text-white tracking-tight leading-snug mb-3.5 px-1 sm:px-2 group-hover:text-[#0066FF] dark:group-hover:text-blue-400 transition-colors duration-300">
          &ldquo;{quoteData.quote}&rdquo;
        </blockquote>

        {/* Author / Philosophy attribution */}
        <p className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 mb-8 tracking-wide">
          — {quoteData.author}
        </p>

        {/* Primary Action Button: "Start My Trading Day" with Shimmer & Glow Hover Effects */}
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleStartTradingDay}
            className="group/btn relative overflow-hidden w-full sm:w-auto min-w-[230px] h-12 px-7 rounded-2xl bg-[#0066FF] hover:bg-gradient-to-r hover:from-[#0066FF] hover:to-[#0055D6] active:scale-[0.98] text-white font-bold text-sm shadow-[0_4px_20px_rgba(0,102,255,0.4)] hover:shadow-[0_8px_32px_rgba(0,102,255,0.65)] hover:scale-105 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 border border-white/25"
          >
            {/* Animated Shimmer Gleam on Hover */}
            <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

            <CheckCircle2 className="w-4 h-4 text-white group-hover/btn:rotate-12 transition-transform duration-200" />
            <span className="text-white tracking-wide">Start My Trading Day</span>
          </button>
          
          <p className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 mt-1.5">
            24h trading day check-in • Resets tomorrow morning
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
