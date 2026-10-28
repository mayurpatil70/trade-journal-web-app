import { User, Scale, Globe, MessageSquare } from "lucide-react";
import LiveDashboardMockup from "./LiveDashboardMockup";

export default function Step1Welcome({ onNext }) {
  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center py-4 lg:py-8">
      {/* ── LEFT COLUMN: Text & 3 Steps Overview ── */}
      <div className="lg:col-span-6 space-y-6 lg:space-y-8 animate-in fade-in duration-300">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 text-xs font-mono font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Welcome Aboard</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black text-neutral-900 dark:text-white tracking-tight leading-[1.1]">
            Your trading journal, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-500">
              finally
            </span>{" "}
            in one place.
          </h1>

          <p className="mt-4 text-sm sm:text-base text-neutral-600 dark:text-neutral-300 font-medium leading-relaxed max-w-lg">
            Log every position, codify the rules you trade by, and watch the data sharpen your edge. Four short steps, then you're live.
          </p>
        </div>

        {/* 3 Steps Overview Cards - High Contrast & Attractive */}
        <div className="space-y-3.5 max-w-lg">
          {/* 01: Identity */}
          <div
            onClick={onNext}
            className="p-4 sm:p-5 rounded-3xl bg-white/95 dark:bg-[#121622]/95 border border-black/[0.08] dark:border-white/[0.1] shadow-[0_8px_25px_rgba(0,0,0,0.05)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.4)] hover:border-emerald-500/50 hover:shadow-[0_12px_35px_rgba(16,185,129,0.15)] transition-all flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-200">
                <User className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-neutral-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Identity
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 font-medium mt-0.5">
                  Forge your trader handle and avatar
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.08] border border-black/[0.06] dark:border-white/[0.1] text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 group-hover:border-emerald-500/40 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-all">
              01
            </span>
          </div>

          {/* 02: Discipline */}
          <div
            onClick={onNext}
            className="p-4 sm:p-5 rounded-3xl bg-white/95 dark:bg-[#121622]/95 border border-black/[0.08] dark:border-white/[0.1] shadow-[0_8px_25px_rgba(0,0,0,0.05)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.4)] hover:border-emerald-500/50 hover:shadow-[0_12px_35px_rgba(16,185,129,0.15)] transition-all flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-200">
                <Scale className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-neutral-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Discipline
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 font-medium mt-0.5">
                  Codify the risk rules you live by
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.08] border border-black/[0.06] dark:border-white/[0.1] text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 group-hover:border-emerald-500/40 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-all">
              02
            </span>
          </div>

          {/* 03: Preferences */}
          <div
            onClick={onNext}
            className="p-4 sm:p-5 rounded-3xl bg-white/95 dark:bg-[#121622]/95 border border-black/[0.08] dark:border-white/[0.1] shadow-[0_8px_25px_rgba(0,0,0,0.05)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.4)] hover:border-emerald-500/50 hover:shadow-[0_12px_35px_rgba(16,185,129,0.15)] transition-all flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-200">
                <Globe className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-neutral-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Preferences
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 font-medium mt-0.5">
                  Currency and timezone calibration
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.08] border border-black/[0.06] dark:border-white/[0.1] text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 group-hover:border-emerald-500/40 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-all">
              03
            </span>
          </div>
        </div>
      </div>

      {/* ── RIGHT COLUMN: Live Dashboard Mockup ── */}
      <div className="lg:col-span-6 flex flex-col items-center justify-center relative animate-in fade-in duration-300">
        <LiveDashboardMockup />

        {/* Floating Help Tooltip bottom-right - High Contrast & Attractive */}
        <div className="mt-4 w-full max-w-[540px] flex justify-end">
          <div className="p-3.5 rounded-2xl bg-white/95 dark:bg-[#121622]/95 border border-black/[0.08] dark:border-white/[0.12] shadow-[0_10px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_15px_35px_rgba(0,0,0,0.5)] backdrop-blur-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="text-left text-xs">
              <p className="font-extrabold text-neutral-900 dark:text-white leading-tight">Got questions?</p>
              <p className="text-neutral-600 dark:text-neutral-300 text-[11px] font-medium mt-0.5">
                Chat with our team anytime — we're here to help!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
