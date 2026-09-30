// frontend/src/pages/TraderProblems/PropFirm.jsx
import { useState, useMemo } from "react";
import {
  ShieldAlert,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  TrendingDown,
  Lock,
  Layers,
  Sparkles,
} from "lucide-react";

const FIRM_PRESETS = [
  {
    name: "FTMO",
    balance: 100000,
    dailyLimitPercent: 5.0,
    maxDrawdownPercent: 10.0,
    drawdownType: "Static Balance",
  },
  {
    name: "Funding Pips",
    balance: 100000,
    dailyLimitPercent: 5.0,
    maxDrawdownPercent: 10.0,
    drawdownType: "Trailing Equity",
  },
  {
    name: "The 5%ers",
    balance: 100000,
    dailyLimitPercent: 5.0,
    maxDrawdownPercent: 10.0,
    drawdownType: "Static Balance",
  },
  {
    name: "Topstep",
    balance: 50000,
    dailyLimitPercent: 2.0, // $1,000 on 50k
    maxDrawdownPercent: 4.0, // $2,000 trailing
    drawdownType: "Trailing Equity",
  },
  {
    name: "Custom Firm",
    balance: 50000,
    dailyLimitPercent: 4.0,
    maxDrawdownPercent: 8.0,
    drawdownType: "Trailing Equity",
  },
];

export default function PropFirm() {
  const [selectedFirm, setSelectedFirm] = useState("FTMO");
  const [accountBalance, setAccountBalance] = useState(100000);
  const [highWatermark, setHighWatermark] = useState(102500); // peak equity
  const [currentEquity, setCurrentEquity] = useState(99400); // current live equity
  const [dailyLimitPercent, setDailyLimitPercent] = useState(5.0);
  const [maxDrawdownPercent, setMaxDrawdownPercent] = useState(10.0);
  const [todayStartingBalance, setTodayStartingBalance] = useState(100500);
  const [riskPerTrade, setRiskPerTrade] = useState(1.0); // %

  const handleFirmChange = (firmName) => {
    setSelectedFirm(firmName);
    const preset = FIRM_PRESETS.find((f) => f.name === firmName);
    if (preset) {
      setAccountBalance(preset.balance);
      setDailyLimitPercent(preset.dailyLimitPercent);
      setMaxDrawdownPercent(preset.maxDrawdownPercent);
      setHighWatermark(preset.balance * 1.02);
      setCurrentEquity(preset.balance * 0.99);
      setTodayStartingBalance(preset.balance);
    }
  };

  // Calculations
  // 1. Daily Loss Limit in Dollars (calculated from today's start balance)
  const maxDailyLossAllowed = useMemo(() => {
    return (todayStartingBalance * dailyLimitPercent) / 100;
  }, [todayStartingBalance, dailyLimitPercent]);

  // Today's current loss so far
  const todaysPnL = useMemo(() => {
    return currentEquity - todayStartingBalance;
  }, [currentEquity, todayStartingBalance]);

  // Daily buffer remaining before fail
  const dailyBufferRemaining = useMemo(() => {
    return Math.max(0, maxDailyLossAllowed + todaysPnL);
  }, [maxDailyLossAllowed, todaysPnL]);

  // Daily drawdown usage percentage
  const dailyDrawdownUsedPercent = useMemo(() => {
    if (todaysPnL >= 0) return 0;
    const loss = Math.abs(todaysPnL);
    return Math.min(100, (loss / maxDailyLossAllowed) * 100);
  }, [todaysPnL, maxDailyLossAllowed]);

  // 2. Trailing Max Drawdown Calculation
  // Max loss threshold = Peak (High Watermark) - (Balance * MaxDrawdown%)
  const maxDrawdownDollarLimit = useMemo(() => {
    return (accountBalance * maxDrawdownPercent) / 100;
  }, [accountBalance, maxDrawdownPercent]);

  const trailingBreachLevel = useMemo(() => {
    // For trailing firms, breach is high watermark minus max drawdown
    return highWatermark - maxDrawdownDollarLimit;
  }, [highWatermark, maxDrawdownDollarLimit]);

  const overallBufferRemaining = useMemo(() => {
    return Math.max(0, currentEquity - trailingBreachLevel);
  }, [currentEquity, trailingBreachLevel]);

  // Surviving Trades at current risk
  const cashRiskPerTrade = useMemo(() => {
    return (currentEquity * riskPerTrade) / 100;
  }, [currentEquity, riskPerTrade]);

  const tradesUntilDailyBreach = useMemo(() => {
    if (cashRiskPerTrade <= 0) return 0;
    return Math.floor(dailyBufferRemaining / cashRiskPerTrade);
  }, [dailyBufferRemaining, cashRiskPerTrade]);

  // Status determination
  const isDailyBreached = dailyBufferRemaining <= 0;
  const isOverallBreached = overallBufferRemaining <= 0;
  const isCritical = dailyDrawdownUsedPercent >= 75 || overallBufferRemaining < cashRiskPerTrade * 2;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-red-500/10 via-amber-500/10 to-orange-500/10 border border-red-500/20 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(239,68,68,0.1)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-500 to-amber-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] shrink-0">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  Prop Firm Drawdown Guardian
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-red-500/20 text-red-400 border border-red-500/30">
                  Account Lifesaver
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Protect your funded accounts and challenge evaluations. Monitor exact daily loss limits & trailing high-watermark buffers.
              </p>
            </div>
          </div>

          {/* Firm Preset Selector */}
          <div className="flex flex-wrap gap-2">
            {FIRM_PRESETS.map((firm) => (
              <button
                key={firm.name}
                type="button"
                onClick={() => handleFirmChange(firm.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  selectedFirm === firm.name
                    ? "bg-gradient-to-r from-red-500 to-amber-500 text-white border-transparent shadow-[0_0_15px_rgba(239,68,68,0.35)]"
                    : "bg-white/40 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-red-500/50"
                }`}
              >
                {firm.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Inputs (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Account Metric Inputs */}
          <div className="p-6 rounded-2xl bg-white/80 dark:bg-[#121418]/90 border border-gray-200/80 dark:border-white/10 backdrop-blur-xl shadow-lg space-y-5">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-red-400" /> Account & Rule Parameters
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                  Initial Account Size ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    value={accountBalance}
                    onChange={(e) => setAccountBalance(Number(e.target.value))}
                    className="w-full bg-gray-50 dark:bg-[#0b131d] border border-gray-200 dark:border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                  Day Start Balance ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    value={todayStartingBalance}
                    onChange={(e) => setTodayStartingBalance(Number(e.target.value))}
                    className="w-full bg-gray-50 dark:bg-[#0b131d] border border-gray-200 dark:border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                  Current Live Equity ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    value={currentEquity}
                    onChange={(e) => setCurrentEquity(Number(e.target.value))}
                    className="w-full bg-gray-50 dark:bg-[#0b131d] border border-gray-200 dark:border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                  Peak High-Watermark ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    value={highWatermark}
                    onChange={(e) => setHighWatermark(Number(e.target.value))}
                    className="w-full bg-gray-50 dark:bg-[#0b131d] border border-gray-200 dark:border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-100 dark:border-white/5">
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                  Daily Limit (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={dailyLimitPercent}
                  onChange={(e) => setDailyLimitPercent(Number(e.target.value))}
                  className="w-full bg-gray-50 dark:bg-[#0b131d] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                  Max Drawdown (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={maxDrawdownPercent}
                  onChange={(e) => setMaxDrawdownPercent(Number(e.target.value))}
                  className="w-full bg-gray-50 dark:bg-[#0b131d] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                  My Risk Per Trade (%)
                </label>
                <input
                  type="number"
                  step="0.25"
                  value={riskPerTrade}
                  onChange={(e) => setRiskPerTrade(Number(e.target.value))}
                  className="w-full bg-gray-50 dark:bg-[#0b131d] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Interactive What-If Simulator */}
          <div className="p-6 rounded-2xl bg-white/80 dark:bg-[#121418]/90 border border-gray-200/80 dark:border-white/10 backdrop-blur-xl shadow-lg space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Simulate Next Loss Impact
              </span>
              <span className="text-xs font-bold text-amber-500">
                1 Trade Loss = -${cashRiskPerTrade.toFixed(0)}
              </span>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              At your current risk of <strong>{riskPerTrade}% (${cashRiskPerTrade.toFixed(0)})</strong>, you can survive:
            </p>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-2xl font-black text-amber-400 block">
                  {tradesUntilDailyBreach} Losses
                </span>
                <span className="text-[11px] text-gray-400">
                  Before Today's Daily Lockout
                </span>
              </div>
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <span className="text-2xl font-black text-red-400 block">
                  {Math.floor(overallBufferRemaining / (cashRiskPerTrade || 1))} Losses
                </span>
                <span className="text-[11px] text-gray-400">
                  Before Total Account Termination
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Output Panel (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div
            className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 border backdrop-blur-xl text-white space-y-6 ${
              isDailyBreached || isOverallBreached
                ? "bg-gradient-to-b from-red-950 via-[#180a0a] to-[#121418] border-red-500/60 shadow-[0_0_40px_rgba(239,68,68,0.3)]"
                : isCritical
                  ? "bg-gradient-to-b from-amber-950 via-[#1a140a] to-[#121418] border-amber-500/60 shadow-[0_0_40px_rgba(245,158,11,0.25)]"
                  : "bg-gradient-to-b from-emerald-950/60 via-[#0a1812] to-[#121418] border-emerald-500/40 shadow-[0_0_40px_rgba(16,185,129,0.2)]"
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-300">
                Live Protection Status
              </span>
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                  isDailyBreached || isOverallBreached
                    ? "bg-red-500/20 text-red-400 border-red-500/40"
                    : isCritical
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                      : "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                }`}
              >
                {isDailyBreached
                  ? "Daily Limit Breached"
                  : isOverallBreached
                    ? "Account Terminated"
                    : isCritical
                      ? "Caution Warning"
                      : "Safe Standing"}
              </span>
            </div>

            {/* Remaining Daily Buffer Display */}
            <div className="text-center py-2 space-y-1">
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                Max Allowed Loss Remaining Today
              </span>
              <p
                className={`text-5xl sm:text-6xl font-black ${
                  isDailyBreached
                    ? "text-red-500"
                    : isCritical
                      ? "text-amber-400"
                      : "text-emerald-400"
                }`}
              >
                ${dailyBufferRemaining.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-xs text-gray-400">
                Today's Daily Cap: -${maxDailyLossAllowed.toLocaleString()}
              </p>
            </div>

            {/* Gauge Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-gray-400">Daily Drawdown Used</span>
                <span className={dailyDrawdownUsedPercent > 70 ? "text-red-400" : "text-emerald-400"}>
                  {dailyDrawdownUsedPercent.toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    dailyDrawdownUsedPercent >= 80
                      ? "bg-gradient-to-r from-amber-500 to-red-500"
                      : "bg-gradient-to-r from-emerald-500 to-cyan-500"
                  }`}
                  style={{ width: `${dailyDrawdownUsedPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Trailing Max Buffer */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-medium">Trailing Breach Level:</span>
                <span className="font-bold text-red-300">${trailingBreachLevel.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-medium">Total Buffer to Termination:</span>
                <span className="font-bold text-emerald-400">${overallBufferRemaining.toLocaleString()}</span>
              </div>
            </div>

            {/* Advisory note */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-xs text-gray-300 leading-relaxed flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                Tip: If your drawdown used passes <strong>50%</strong>, reduce your lot size by half immediately to prevent emotional spiral.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
