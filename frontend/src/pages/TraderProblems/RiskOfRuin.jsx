// frontend/src/pages/TraderProblems/RiskOfRuin.jsx
import { useState, useMemo } from "react";
import {
  TrendingUp,
  Percent,
  Play,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  LineChart,
  Sparkles,
  BarChart2,
} from "lucide-react";

export default function RiskOfRuin() {
  const [winRate, setWinRate] = useState(50); // 50%
  const [riskReward, setRiskReward] = useState(2.0); // 1:2 RR
  const [riskPerTrade, setRiskPerTrade] = useState(1.0); // 1%
  const [startingBalance, setStartingBalance] = useState(10000);
  const [simulationSeed, setSimulationSeed] = useState(1);

  // Calculations
  // 1. Expected Value (EV) per trade in R: (WinRate * RR) - (LossRate * 1)
  const evR = useMemo(() => {
    const w = winRate / 100;
    const l = 1 - w;
    return w * riskReward - l * 1;
  }, [winRate, riskReward]);

  const evDollar = useMemo(() => {
    const riskDollar = (startingBalance * riskPerTrade) / 100;
    return evR * riskDollar;
  }, [evR, startingBalance, riskPerTrade]);

  // 2. Risk of Ruin Approximation (Kaufman / Nauzer formula)
  // a = (1 - (WinRate - LossRate)) / (1 + (WinRate - LossRate))
  const riskOfRuinPercent = useMemo(() => {
    if (evR <= 0) return 100; // Negative expectancy always ruins
    const p = winRate / 100;
    const q = 1 - p;
    // Normalized edge
    const edge = (p * riskReward - q) / riskReward;
    if (edge <= 0) return 100;

    // Approximate ruin probability based on units of risk to blow 50% of account
    const units = 50 / riskPerTrade;
    const ratio = q / (p * riskReward);
    const ror = Math.pow(Math.min(1, ratio), units) * 100;
    return Math.min(100, Math.max(0.01, Math.round(ror * 10) / 10));
  }, [winRate, riskReward, riskPerTrade, evR]);

  // 3. Probability of consecutive losing streaks over 100 trades
  const lossRate = 1 - winRate / 100;
  // Chance of at least 1 streak of N consecutive losses in 100 trades (approx Markov / Feller)
  const getStreakProb = (n) => {
    if (lossRate <= 0) return 0;
    const singleStreakProb = Math.pow(lossRate, n);
    // Over ~100 trials: 1 - (1 - p^n)^N
    const prob = (1 - Math.pow(1 - singleStreakProb, 100 - n + 1)) * 100;
    return Math.min(99.9, Math.max(0.1, prob)).toFixed(1);
  };

  // 4. Monte Carlo 100-Trade Simulation Engine
  const simulationData = useMemo(() => {
    const trades = [startingBalance];
    let balance = startingBalance;
    let maxDrawdown = 0;
    let peak = startingBalance;

    for (let i = 1; i <= 100; i++) {
      // Deterministic pseudorandom using simulationSeed
      const rand = Math.sin(simulationSeed * 1000 + i * 37) * 10000;
      const isWin = (rand - Math.floor(rand)) * 100 < winRate;
      const dollarRisk = (balance * riskPerTrade) / 100;

      if (isWin) {
        balance += dollarRisk * riskReward;
      } else {
        balance -= dollarRisk;
      }
      balance = Math.max(0, balance);
      trades.push(balance);

      if (balance > peak) peak = balance;
      const dd = ((peak - balance) / peak) * 100;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }

    return {
      curve: trades,
      finalBalance: balance,
      maxDrawdown,
      peak,
    };
  }, [winRate, riskReward, riskPerTrade, startingBalance, simulationSeed]);

  // SVG Chart Path Generation
  const svgPath = useMemo(() => {
    const points = simulationData.curve;
    const minVal = Math.min(...points) * 0.95;
    const maxVal = Math.max(...points) * 1.05;
    const range = maxVal - minVal || 1;

    return points
      .map((val, idx) => {
        const x = (idx / 100) * 500;
        const y = 180 - ((val - minVal) / range) * 160;
        return `${idx === 0 ? "M" : "L"} ${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [simulationData]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/20 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(59,130,246,0.1)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] shrink-0">
              <TrendingUp className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  Risk of Ruin & Monte Carlo Reality Check
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Statistical Edge
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Stop quitting profitable strategies after a 4-trade losing streak. Understand the statistical reality of sequence risk.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 text-xs font-semibold text-gray-600 dark:text-gray-300">
            <BarChart2 className="w-4 h-4 text-indigo-400" />
            <span>100-Trade Monte Carlo Engine</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Inputs (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* System Parameters Card */}
          <div className="p-6 rounded-2xl bg-white/80 dark:bg-[#121418]/90 border border-gray-200/80 dark:border-white/10 backdrop-blur-xl shadow-lg space-y-5">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" /> Your Strategy Statistics
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-gray-400">Win Rate</span>
                  <span className="text-blue-400">{winRate}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="80"
                  value={winRate}
                  onChange={(e) => setWinRate(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-gray-400">Risk-to-Reward</span>
                  <span className="text-indigo-400">1:{riskReward}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="4"
                  step="0.25"
                  value={riskReward}
                  onChange={(e) => setRiskReward(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-gray-400">Risk Per Trade</span>
                  <span className={riskPerTrade > 2 ? "text-red-400" : "text-emerald-400"}>
                    {riskPerTrade}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.5"
                  value={riskPerTrade}
                  onChange={(e) => setRiskPerTrade(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Expected Value (EV) Card */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Expected Value (EV)
                </span>
                <span className={`text-2xl font-black ${evR > 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {evR > 0 ? "+" : ""}
                  {evR.toFixed(2)}R
                </span>
                <span className="text-[10px] text-gray-500 block mt-0.5">
                  Per trade over long run
                </span>
              </div>

              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Expected $ Return / Trade
                </span>
                <span className={`text-2xl font-black ${evDollar > 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {evDollar > 0 ? "+" : ""}
                  ${evDollar.toFixed(1)}
                </span>
                <span className="text-[10px] text-gray-500 block mt-0.5">
                  Based on ${startingBalance.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Losing Streak Reality Table */}
          <div className="p-6 rounded-2xl bg-white/80 dark:bg-[#121418]/90 border border-gray-200/80 dark:border-white/10 backdrop-blur-xl shadow-lg space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Streak Probability Over 100 Trades
              </h3>
              <span className="text-xs text-gray-500">Normal Market Variance</span>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Even with a <strong>{winRate}% win rate</strong>, look at how likely you are to suffer multiple losses in a row:
            </p>

            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-gray-400 block text-[10px]">3 Losses</span>
                <span className="text-lg font-black text-amber-400">{getStreakProb(3)}%</span>
                <span className="text-[9px] text-gray-500 block">Certain</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-gray-400 block text-[10px]">5 Losses</span>
                <span className="text-lg font-black text-amber-400">{getStreakProb(5)}%</span>
                <span className="text-[9px] text-gray-500 block">Common</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-gray-400 block text-[10px]">7 Losses</span>
                <span className="text-lg font-black text-red-400">{getStreakProb(7)}%</span>
                <span className="text-[9px] text-gray-500 block">Possible</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-gray-400 block text-[10px]">10 Losses</span>
                <span className="text-lg font-black text-red-400">{getStreakProb(10)}%</span>
                <span className="text-[9px] text-gray-500 block">Rare</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Output: Risk of Ruin & Monte Carlo Chart (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#121418] via-[#0f172a] to-[#0c1219] border border-blue-500/40 shadow-[0_0_40px_rgba(59,130,246,0.2)] text-white space-y-5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Mathematical Risk of Ruin
              </span>
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                  riskOfRuinPercent < 1
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : riskOfRuinPercent < 10
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                }`}
              >
                {riskOfRuinPercent < 1 ? "Zero Ruin Risk" : riskOfRuinPercent < 10 ? "Moderate" : "Danger of Blowing"}
              </span>
            </div>

            <div className="text-center py-2">
              <span
                className={`text-6xl font-black drop-shadow-lg ${
                  riskOfRuinPercent < 1
                    ? "text-emerald-400"
                    : riskOfRuinPercent < 10
                      ? "text-amber-400"
                      : "text-red-500"
                }`}
              >
                {riskOfRuinPercent}%
              </span>
              <p className="text-xs text-gray-400 mt-1">
                Probability of suffering a devastating 50%+ account drawdown.
              </p>
            </div>

            {/* Monte Carlo Visualizer */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <LineChart className="w-4 h-4 text-cyan-400" />
                  100-Trade Simulation Curve
                </span>
                <button
                  type="button"
                  onClick={() => setSimulationSeed((s) => s + 1)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/10 hover:bg-white/20 text-cyan-300 transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Re-roll Simulation
                </button>
              </div>

              {/* Mini SVG Chart */}
              <div className="h-44 w-full bg-black/40 rounded-xl border border-white/10 p-2 flex flex-col justify-between relative overflow-hidden">
                <svg viewBox="0 0 500 180" className="w-full h-full overflow-visible">
                  <path
                    d={svgPath}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>

                <div className="flex justify-between text-[10px] text-gray-400 px-1">
                  <span>Trade 1</span>
                  <span>Trade 50</span>
                  <span>Trade 100</span>
                </div>
              </div>

              {/* Simulation Outcome Stats */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-gray-400 text-[10px] block">Simulated Final Equity</span>
                  <span className="font-bold text-emerald-400">
                    ${simulationData.finalBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-gray-400 text-[10px] block">Max Drawdown Suffered</span>
                  <span className="font-bold text-amber-400">
                    -{simulationData.maxDrawdown.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
