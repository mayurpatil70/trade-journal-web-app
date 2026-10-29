// frontend/src/pages/PropAccounts.jsx
// macOS / iOS Apple HIG Bento Redesign for Prop Firm Challenge Guidance

import { useState } from "react";
import {
  TrendingUp,
  ShieldCheck,
  Award,
} from "lucide-react";
import MasterclassPaywall from "../components/MasterclassPaywall.jsx";

export default function PropAccounts() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24 font-sans">
      {/* ── TOP HERO HEADER (Matches macOS / iOS Apple HIG Bento) ── */}
      <div className="rounded-3xl bg-white dark:bg-[#12151e]/85 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shadow-sm shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
                  Prop Firm Challenge Guidance
                </h1>
                <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  VIP Trader Edition
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                Proven strategy, risk models, and psychological rules to pass your prop firm evaluations and secure payouts.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── MASTERCLASS VIP PAYWALL BENTO CARD ── */}
      <MasterclassPaywall />
    </div>
  );
}
