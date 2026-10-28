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
    if (val <= 1) return { text: "Conservative", color: "text-emerald-600 dark:text-emerald-400" };
    if (val <= 2) return { text: "Balanced", color: "text-emerald-600 dark:text-emerald-400" };
    if (val <= 3) return { text: "Moderate", color: "text-amber-500 dark:text-amber-400" };
    return { text: "Aggressive", color: "text-rose-500 dark:text-rose-400" };
  };

  const riskLabel = getRiskLabel(maxRiskPerTrade);

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start py-4">
      {/* ── COLUMN 1 (Left, lg:col-span-4): Realistic TradingView Backtesting Preview Card ── */}
      <div className="lg:col-span-4 flex flex-col items-center justify-center lg:sticky lg:top-8 animate-in fade-in duration-300">
        <LiveChartMockup targetRR={targetRR} />
      </div>

      {/* ── COLUMN 2 (Center, lg:col-span-4): First Half of Discipline Rules ── */}
      <div className="lg:col-span-4 space-y-4 animate-in fade-in duration-300">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 text-xs font-mono font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Step 03 • Discipline</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
            Set the guardrails.
          </h2>

          <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-300 font-medium leading-relaxed">
            Boundaries to prevent one bad day from turning into a bad month.
          </p>
        </div>

        {/* 1. Max risk per trade */}
        <div className="p-4 sm:p-4.5 rounded-3xl bg-white/95 dark:bg-[#121622]/95 border border-black/[0.08] dark:border-white/[0.1] shadow-sm hover:border-emerald-500/40 transition-all space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-neutral-900 dark:text-white uppercase tracking-wider">
                  Max risk / trade
                </span>
                <Info className="w-3.5 h-3.5 text-neutral-400" />
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium mt-0.5">
                Per-position ceiling •{" "}
                <span className={`font-bold ${riskLabel.color}`}>{riskLabel.text}</span>
              </p>
            </div>
            <div className="px-3 py-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.08] border border-black/[0.08] dark:border-white/[0.12] font-mono font-black text-xs text-neutral-900 dark:text-white shadow-xs">
              {maxRiskPerTrade}%
            </div>
          </div>

          <input
            type="range"
            min="0.25"
            max="10"
            step="0.25"
            value={maxRiskPerTrade}
            onChange={(e) => setMaxRiskPerTrade(Number(e.target.value))}
            className="w-full accent-emerald-500 h-1.5 bg-neutral-200 dark:bg-white/10 rounded-lg cursor-pointer"
          />

          <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
            {[0.5, 1, 2, 3, 5].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setMaxRiskPerTrade(val)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer ${
                  maxRiskPerTrade === val
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                    : "bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-neutral-700 dark:text-neutral-300 border border-black/[0.05] dark:border-white/[0.08]"
                }`}
              >
                {val}%
              </button>
            ))}
          </div>
        </div>

        {/* 2. Daily loss cap */}
        <div className="p-4 sm:p-4.5 rounded-3xl bg-white/95 dark:bg-[#121622]/95 border border-black/[0.08] dark:border-white/[0.1] shadow-sm hover:border-emerald-500/40 transition-all space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-neutral-900 dark:text-white uppercase tracking-wider">
                  Daily loss cap
                </span>
                <Info className="w-3.5 h-3.5 text-neutral-400" />
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium mt-0.5">Stop-trading threshold</p>
            </div>
            <div className="px-3 py-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.08] border border-black/[0.08] dark:border-white/[0.12] font-mono font-black text-xs text-neutral-900 dark:text-white shadow-xs">
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
            className="w-full accent-emerald-500 h-1.5 bg-neutral-200 dark:bg-white/10 rounded-lg cursor-pointer"
          />

          <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
            {[3, 5, 10, 15].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setDailyLossCap(val)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer ${
                  dailyLossCap === val
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                    : "bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-neutral-700 dark:text-neutral-300 border border-black/[0.05] dark:border-white/[0.08]"
                }`}
              >
                {val}%
              </button>
            ))}
          </div>
        </div>

        {/* 3. Max trades / day */}
        <div className="p-4 sm:p-4.5 rounded-3xl bg-white/95 dark:bg-[#121622]/95 border border-black/[0.08] dark:border-white/[0.1] shadow-sm hover:border-emerald-500/40 transition-all space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-neutral-900 dark:text-white uppercase tracking-wider">
                  Max trades / day
                </span>
                <Info className="w-3.5 h-3.5 text-neutral-400" />
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium mt-0.5">Daily trade ceiling</p>
            </div>
            <div className="px-3 py-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.08] border border-black/[0.08] dark:border-white/[0.12] font-mono font-black text-xs text-neutral-900 dark:text-white shadow-xs">
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
            className="w-full accent-emerald-500 h-1.5 bg-neutral-200 dark:bg-white/10 rounded-lg cursor-pointer"
          />

          <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
            {[1, 2, 3, 5, 8].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setMaxTradesPerDay(val)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer ${
                  maxTradesPerDay === val
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                    : "bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-neutral-700 dark:text-neutral-300 border border-black/[0.05] dark:border-white/[0.08]"
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Loss-streak break */}
        <div className="p-4 sm:p-4.5 rounded-3xl bg-white/95 dark:bg-[#121622]/95 border border-black/[0.08] dark:border-white/[0.1] shadow-sm hover:border-emerald-500/40 transition-all space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-neutral-900 dark:text-white uppercase tracking-wider">
                  Loss-streak break
                </span>
                <Info className="w-3.5 h-3.5 text-neutral-400" />
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium mt-0.5">Step away threshold</p>
            </div>
            <div className="px-3 py-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.08] border border-black/[0.08] dark:border-white/[0.12] font-mono font-black text-xs text-neutral-900 dark:text-white shadow-xs">
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
            className="w-full accent-emerald-500 h-1.5 bg-neutral-200 dark:bg-white/10 rounded-lg cursor-pointer"
          />

          <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
            {[2, 3, 4, 5, 6].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setLossStreakBreak(val)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer ${
                  lossStreakBreak === val
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                    : "bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-neutral-700 dark:text-neutral-300 border border-black/[0.05] dark:border-white/[0.08]"
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── COLUMN 3 (Right, lg:col-span-4): Second Half of Discipline Rules ── */}
      <div className="lg:col-span-4 space-y-4 animate-in fade-in duration-300">
        {/* 5. Target Risk : Reward */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-extrabold text-neutral-900 dark:text-white uppercase tracking-wider">
              Target Risk : Reward
            </span>
            <Info className="w-3.5 h-3.5 text-neutral-400" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {RR_OPTIONS.map((opt) => {
              const isSelected = targetRR === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTargetRR(opt.id)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
                    isSelected
                      ? "bg-emerald-500/10 dark:bg-emerald-500/15 border-2 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-md shadow-emerald-500/20"
                      : "bg-white dark:bg-[#121622] border-black/[0.08] dark:border-white/[0.08] text-neutral-700 dark:text-neutral-300 hover:border-emerald-500/40"
                  }`}
                >
                  <div className="font-mono font-black text-xs text-neutral-900 dark:text-white">{opt.label}</div>
                  <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium mt-0.5">{opt.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 6. Preferred Sessions */}
        <div className="space-y-2">
          <span className="text-xs font-extrabold text-neutral-900 dark:text-white uppercase tracking-wider block">
            Preferred Sessions
          </span>

          <div className="space-y-2">
            {SESSIONS.map((sess) => {
              const isSelected = preferredSessions.includes(sess.id);
              return (
                <button
                  key={sess.id}
                  type="button"
                  onClick={() => toggleSession(sess.id)}
                  className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between shadow-xs ${
                    isSelected
                      ? "bg-emerald-500/10 dark:bg-emerald-500/15 border-2 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-md shadow-emerald-500/20"
                      : "bg-white dark:bg-[#121622] border-black/[0.08] dark:border-white/[0.08] text-neutral-700 dark:text-neutral-300 hover:border-emerald-500/40"
                  }`}
                >
                  <div>
                    <span className="font-extrabold text-xs text-neutral-900 dark:text-white block">{sess.name}</span>
                    <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 font-medium">{sess.time}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-500 stroke-[2.5]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 7. Favorite Pairs (Pick 1-5) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-neutral-900 dark:text-white uppercase tracking-wider">
              Favorite Pairs
            </span>
            <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {favoritePairs.length}/5 selected
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin">
            {POPULAR_PAIRS.map((pair) => {
              const isSelected = favoritePairs.includes(pair);
              return (
                <button
                  key={pair}
                  type="button"
                  onClick={() => togglePair(pair)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs ${
                    isSelected
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                      : "bg-white dark:bg-[#121622] border border-black/[0.08] dark:border-white/[0.08] text-neutral-800 dark:text-neutral-200 hover:border-emerald-500/40 hover:text-emerald-600 dark:hover:text-emerald-400"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
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
