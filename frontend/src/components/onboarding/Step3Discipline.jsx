import { useState } from "react";
import { Info, Check } from "lucide-react";
import LiveChartMockup from "./LiveChartMockup";

const RR_OPTIONS = [
  { id: "1:1", label: "1:1", desc: "Balanced" },
  { id: "1:1.5", label: "1:1.5", desc: "Modest edge" },
  { id: "1:2", label: "1:2", desc: "Standard" },
  { id: "1:3", label: "1:3", desc: "Conviction" },
  { id: "1:4+", label: "1:4+", desc: "Asymmetric" },
  { id: "Custom", label: "Custom", desc: "Set your own" },
];

const SESSIONS = [
  { id: "Asian", name: "Asian", time: "00:00 – 09:00 GMT" },
  { id: "London", name: "London", time: "08:00 – 16:00 GMT" },
  { id: "New York", name: "New York", time: "13:00 – 21:00 GMT" },
];

const POPULAR_PAIRS = [
  "EUR/USD",
  "GBP/USD",
  "USD/JPY",
  "USD/CHF",
  "AUD/USD",
  "USD/CAD",
  "NZD/USD",
  "EUR/GBP",
  "EUR/JPY",
  "GBP/JPY",
  "EUR/AUD",
  "GBP/AUD",
  "EUR/CAD",
  "AUD/JPY",
  "XAU/USD",
  "XAG/USD",
  "US30",
  "NAS100",
  "BTC/USD",
  "ETH/USD",
];

export default function Step3Discipline({
  maxRiskPerTrade,
  setMaxRiskPerTrade,
  dailyLossCap,
  setDailyLossCap,
  maxTradesPerDay,
  setMaxTradesPerDay,
  lossStreakBreak,
  setLossStreakBreak,
  targetRR,
  setTargetRR,
  preferredSessions,
  setPreferredSessions,
  favoritePairs,
  setFavoritePairs,
}) {
  const toggleSession = (sessionId) => {
    if (preferredSessions.includes(sessionId)) {
      if (preferredSessions.length > 1) {
        setPreferredSessions(preferredSessions.filter((s) => s !== sessionId));
      }
    } else {
      setPreferredSessions([...preferredSessions, sessionId]);
    }
  };

  const togglePair = (pair) => {
    if (favoritePairs.includes(pair)) {
      setFavoritePairs(favoritePairs.filter((p) => p !== pair));
    } else {
      if (favoritePairs.length < 5) {
        setFavoritePairs([...favoritePairs, pair]);
      }
    }
  };

  const getRiskLabel = (val) => {
    if (val <= 1) return { text: "Conservative", color: "text-emerald-400" };
    if (val <= 2) return { text: "Balanced", color: "text-emerald-400" };
    if (val <= 3) return { text: "Moderate", color: "text-amber-400" };
    return { text: "Aggressive", color: "text-rose-400" };
  };

  const riskLabel = getRiskLabel(maxRiskPerTrade);

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start py-4 lg:py-8">
      {/* ── LEFT COLUMN: Chart & Backtesting Visual Preview (Sticky on desktop) ── */}
      <div className="lg:col-span-5 flex flex-col items-center justify-center lg:sticky lg:top-8 animate-in fade-in duration-300">
        <LiveChartMockup targetRR={targetRR} />
      </div>

      {/* ── RIGHT COLUMN: Discipline Controls (Scrollable) ── */}
      <div className="lg:col-span-7 space-y-7 max-w-2xl animate-in fade-in duration-300">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-emerald-400 mb-3">
            <span className="w-4 h-[2px] bg-emerald-400 rounded-full" />
            <span>Step 03 • Discipline</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Set the guardrails.
          </h2>

          <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
            These are your rails — the boundaries that keep one bad day from turning into a bad month. The risk dial recolors as the stakes climb.
          </p>
        </div>

        {/* 1. Max risk per trade */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Max risk per trade
                </span>
                <Info className="w-3.5 h-3.5 text-neutral-500" />
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Per-position risk ceiling •{" "}
                <span className={`font-semibold ${riskLabel.color}`}>{riskLabel.text}</span>
              </p>
            </div>
            <div className="px-3 py-1 rounded-xl bg-white/[0.06] border border-white/[0.1] font-mono font-bold text-sm text-white">
              {maxRiskPerTrade}%
            </div>
          </div>

          {/* Slider */}
          <input
            type="range"
            min="0.25"
            max="10"
            step="0.25"
            value={maxRiskPerTrade}
            onChange={(e) => setMaxRiskPerTrade(Number(e.target.value))}
            className="w-full accent-emerald-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
          />

          {/* Preset Pills */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            {[0.5, 1, 2, 3, 5].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setMaxRiskPerTrade(val)}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                  maxRiskPerTrade === val
                    ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                    : "bg-white/[0.04] text-neutral-400 hover:text-white hover:bg-white/[0.08]"
                }`}
              >
                {val}%
              </button>
            ))}
          </div>
        </div>

        {/* 2. Daily loss cap */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Daily loss cap
                </span>
                <Info className="w-3.5 h-3.5 text-neutral-500" />
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">Stop-trading threshold</p>
            </div>
            <div className="px-3 py-1 rounded-xl bg-white/[0.06] border border-white/[0.1] font-mono font-bold text-sm text-white">
              {dailyLossCap}%
            </div>
          </div>

          <input
            type="range"
            min="1"
            max="20"
            step="0.5"
            value={dailyLossCap}
            onChange={(e) => setDailyLossCap(Number(e.target.value))}
            className="w-full accent-emerald-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
          />

          <div className="flex items-center gap-2 pt-1 flex-wrap">
            {[3, 5, 10, 15].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setDailyLossCap(val)}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                  dailyLossCap === val
                    ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                    : "bg-white/[0.04] text-neutral-400 hover:text-white hover:bg-white/[0.08]"
                }`}
              >
                {val}%
              </button>
            ))}
          </div>
        </div>

        {/* 3. Max trades / day */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Max trades / day
                </span>
                <Info className="w-3.5 h-3.5 text-neutral-500" />
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">Daily trade ceiling</p>
            </div>
            <div className="px-3 py-1 rounded-xl bg-white/[0.06] border border-white/[0.1] font-mono font-bold text-sm text-white">
              {maxTradesPerDay} trades
            </div>
          </div>

          <input
            type="range"
            min="1"
            max="30"
            step="1"
            value={maxTradesPerDay}
            onChange={(e) => setMaxTradesPerDay(Number(e.target.value))}
            className="w-full accent-emerald-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
          />

          <div className="flex items-center gap-2 pt-1 flex-wrap">
            {[1, 2, 3, 5, 8].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setMaxTradesPerDay(val)}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                  maxTradesPerDay === val
                    ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                    : "bg-white/[0.04] text-neutral-400 hover:text-white hover:bg-white/[0.08]"
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Loss-streak break */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Loss-streak break
                </span>
                <Info className="w-3.5 h-3.5 text-neutral-500" />
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">Step away after consecutive losses</p>
            </div>
            <div className="px-3 py-1 rounded-xl bg-white/[0.06] border border-white/[0.1] font-mono font-bold text-sm text-white">
              {lossStreakBreak} losses
            </div>
          </div>

          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={lossStreakBreak}
            onChange={(e) => setLossStreakBreak(Number(e.target.value))}
            className="w-full accent-emerald-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
          />

          <div className="flex items-center gap-2 pt-1 flex-wrap">
            {[2, 3, 4, 5, 6].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setLossStreakBreak(val)}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                  lossStreakBreak === val
                    ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                    : "bg-white/[0.04] text-neutral-400 hover:text-white hover:bg-white/[0.08]"
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Target Risk : Reward */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Target Risk : Reward
            </span>
            <Info className="w-3.5 h-3.5 text-neutral-500" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {RR_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTargetRR(opt.id)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  targetRR === opt.id
                    ? "bg-emerald-500/15 border-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                    : "bg-white/[0.03] border-white/[0.06] text-neutral-400 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                <div className="font-mono font-bold text-sm text-white">{opt.label}</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 6. Preferred Sessions */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-white uppercase tracking-wider block">
            Preferred Sessions
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {SESSIONS.map((sess) => {
              const isSelected = preferredSessions.includes(sess.id);
              return (
                <button
                  key={sess.id}
                  type="button"
                  onClick={() => toggleSession(sess.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "bg-emerald-500/15 border-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                      : "bg-white/[0.03] border-white/[0.06] text-neutral-400 hover:text-white hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-white">{sess.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400">{sess.time}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 7. Favorite Pairs (Pick 1-5) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Favorite Pairs
            </span>
            <span className="text-xs font-mono font-semibold text-emerald-400">
              {favoritePairs.length}/5 selected
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {POPULAR_PAIRS.map((pair) => {
              const isSelected = favoritePairs.includes(pair);
              return (
                <button
                  key={pair}
                  type="button"
                  onClick={() => togglePair(pair)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                      : "bg-white/[0.03] border border-white/[0.06] text-neutral-300 hover:text-white hover:bg-white/[0.08]"
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                  <span>{pair}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
