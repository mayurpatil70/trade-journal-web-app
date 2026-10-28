import { User, Scale, Globe, ArrowRight, MessageSquare } from "lucide-react";
import LiveDashboardMockup from "./LiveDashboardMockup";

export default function Step1Welcome({ onNext }) {
  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center py-4 lg:py-8">
      {/* ── LEFT COLUMN: Text & 3 Steps Overview ── */}
      <div className="lg:col-span-6 space-y-6 lg:space-y-8 animate-in fade-in duration-300">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-emerald-400 mb-3">
            <span className="w-4 h-[2px] bg-emerald-400 rounded-full" />
            <span>Welcome Aboard</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black text-white tracking-tight leading-[1.1]">
            Your trading journal, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500">
              finally
            </span>{" "}
            in one place.
          </h1>

          <p className="mt-4 text-sm sm:text-base text-neutral-400 leading-relaxed max-w-lg">
            Log every position, codify the rules you trade by, and watch the data sharpen your edge. Four short steps, then you're live.
          </p>
        </div>

        {/* 3 Steps Overview Cards */}
        <div className="space-y-3 max-w-lg">
          {/* 01: Identity */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-emerald-500/30 transition-all flex items-center justify-between group">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-neutral-300 group-hover:text-emerald-400 transition-colors">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                  Identity
                </h3>
                <p className="text-xs text-neutral-400">Forge your trader handle and avatar</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-neutral-500 group-hover:text-emerald-400 transition-colors">
              01
            </span>
          </div>

          {/* 02: Discipline */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-emerald-500/30 transition-all flex items-center justify-between group">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-neutral-300 group-hover:text-emerald-400 transition-colors">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                  Discipline
                </h3>
                <p className="text-xs text-neutral-400">Codify the risk rules you live by</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-neutral-500 group-hover:text-emerald-400 transition-colors">
              02
            </span>
          </div>

          {/* 03: Preferences */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-emerald-500/30 transition-all flex items-center justify-between group">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-neutral-300 group-hover:text-emerald-400 transition-colors">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                  Preferences
                </h3>
                <p className="text-xs text-neutral-400">Currency and timezone calibration</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-neutral-500 group-hover:text-emerald-400 transition-colors">
              03
            </span>
          </div>
        </div>
      </div>

      {/* ── RIGHT COLUMN: Live Dashboard Mockup ── */}
      <div className="lg:col-span-6 flex flex-col items-center justify-center relative animate-in fade-in duration-300">
        <LiveDashboardMockup />

        {/* Floating Help Tooltip bottom-right */}
        <div className="mt-4 w-full max-w-[540px] flex justify-end">
          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl flex items-center gap-3 shadow-lg">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="text-left text-xs">
              <p className="font-bold text-white leading-tight">Got questions?</p>
              <p className="text-neutral-400 text-[11px]">Chat with our team anytime — we're here to help!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
