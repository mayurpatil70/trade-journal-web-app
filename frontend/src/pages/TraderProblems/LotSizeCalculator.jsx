// frontend/src/pages/TraderProblems/LotSizeCalculator.jsx
import { useState, useMemo } from "react";
import {
  Calculator,
  DollarSign,
  Percent,
  Copy,
  Check,
  TrendingUp,
  Target,
  AlertCircle,
  Sparkles,
  Zap,
} from "lucide-react";

const INSTRUMENTS = [
  {
    symbol: "EURUSD",
    name: "EUR/USD (Forex Major)",
    type: "forex",
    pipSize: 0.0001,
    contractSize: 100000,
    pipValueStandard: 10, // $10 per pip on 1 standard lot
    defaultEntry: 1.0850,
    defaultSL: 1.0825,
  },
  {
    symbol: "GBPUSD",
    name: "GBP/USD (Forex Major)",
    type: "forex",
    pipSize: 0.0001,
    contractSize: 100000,
    pipValueStandard: 10,
    defaultEntry: 1.2950,
    defaultSL: 1.2920,
  },
  {
    symbol: "USDJPY",
    name: "USD/JPY (JPY Pair)",
    type: "jpy",
    pipSize: 0.01,
    contractSize: 100000,
    pipValueStandard: 6.7, // approx $6.70 per pip depending on JPY rate ~150
    defaultEntry: 152.4,
    defaultSL: 152.0,
  },
  {
    symbol: "XAUUSD",
    name: "Gold (XAU/USD)",
    type: "commodity",
    pipSize: 0.1, // 10 cents = 1 pip / 1 point = $1
    contractSize: 100, // 100 oz per lot
    pipValueStandard: 10, // $10 per $0.10 move on 1 lot
    defaultEntry: 2750.0,
    defaultSL: 2742.0,
  },
  {
    symbol: "US30",
    name: "Dow Jones (US30 Index)",
    type: "index",
    pipSize: 1.0, // 1 index point
    contractSize: 1,
    pipValueStandard: 1, // $1 per point per lot/contract
    defaultEntry: 42500,
    defaultSL: 42420,
  },
  {
    symbol: "NAS100",
    name: "Nasdaq (NAS100 Index)",
    type: "index",
    pipSize: 1.0,
    contractSize: 1,
    pipValueStandard: 1,
    defaultEntry: 20400,
    defaultSL: 20350,
  },
  {
    symbol: "BTCUSD",
    name: "Bitcoin (BTC/USD)",
    type: "crypto",
    pipSize: 1.0,
    contractSize: 1,
    pipValueStandard: 1,
    defaultEntry: 92000,
    defaultSL: 90500,
  },
];

const EQUITY_PRESETS = [5000, 10000, 25000, 50000, 100000, 200000];
const RISK_PERCENT_PRESETS = [0.25, 0.5, 1.0, 1.5, 2.0];

export default function LotSizeCalculator() {
  const [balance, setBalance] = useState(50000);
  const [riskMode, setRiskMode] = useState("percent"); // 'percent' or 'cash'
  const [riskPercent, setRiskPercent] = useState(1.0);
  const [riskCash, setRiskCash] = useState(500);

  const [selectedSymbol, setSelectedSymbol] = useState("XAUUSD");
  const [inputMode, setInputMode] = useState("prices"); // 'prices' or 'pips'
  const [entryPrice, setEntryPrice] = useState(2750.0);
  const [slPrice, setSlPrice] = useState(2742.0);
  const [manualPips, setManualPips] = useState(80);

  const [copied, setCopied] = useState(false);

  const instrument = useMemo(() => {
    return (
      INSTRUMENTS.find((inst) => inst.symbol === selectedSymbol) ||
      INSTRUMENTS[3]
    );
  }, [selectedSymbol]);

  // Handle instrument change
  const handleInstrumentSelect = (sym) => {
    setSelectedSymbol(sym);
    const found = INSTRUMENTS.find((i) => i.symbol === sym);
    if (found) {
      setEntryPrice(found.defaultEntry);
      setSlPrice(found.defaultSL);
    }
  };

  // Dollar risk calculation
  const totalDollarRisk = useMemo(() => {
    if (riskMode === "percent") {
      return (Number(balance || 0) * Number(riskPercent || 0)) / 100;
    }
    return Number(riskCash || 0);
  }, [balance, riskMode, riskPercent, riskCash]);

  // Pips distance calculation
  const pipDistance = useMemo(() => {
    if (inputMode === "pips") {
      return Math.max(0.1, Number(manualPips || 0));
    }
    const diff = Math.abs(Number(entryPrice || 0) - Number(slPrice || 0));
    const pips = diff / (instrument.pipSize || 1);
    return Math.max(0.1, pips);
  }, [inputMode, manualPips, entryPrice, slPrice, instrument]);

  // Lot size calculation
  // Formula: Lot Size = Dollar Risk / (Pip Distance * Pip Value per Standard Lot)
  const lotSize = useMemo(() => {
    if (pipDistance <= 0 || instrument.pipValueStandard <= 0) return 0;
    const rawLot = totalDollarRisk / (pipDistance * instrument.pipValueStandard);
    // Format to 2 decimal places (standard micro-lot precision: 0.01)
    return Math.max(0.01, Math.floor(rawLot * 100) / 100);
  }, [totalDollarRisk, pipDistance, instrument]);

  // Pip value at calculated lot size
  const currentPipValue = useMemo(() => {
    return (lotSize * instrument.pipValueStandard).toFixed(2);
  }, [lotSize, instrument]);

  const handleCopy = () => {
    navigator.clipboard.writeText(lotSize.toFixed(2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Title with Glow */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-blue-500/10 border border-emerald-500/20 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(16,185,129,0.1)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] shrink-0">
              <Calculator className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  Precision Lot Size Calculator
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Zero Overleverage
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Never blow your account on position sizing. Calculate the exact standard lot size for your exact dollar risk.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 text-xs font-semibold text-gray-600 dark:text-gray-300">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Multi-Asset Pip Engine</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Inputs Section (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Account Equity Card */}
          <div className="p-6 rounded-2xl bg-white/80 dark:bg-[#121418]/90 border border-gray-200/80 dark:border-white/10 backdrop-blur-xl shadow-lg space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                Account Equity / Balance
              </label>
              <span className="text-xs font-bold text-emerald-500">
                ${Number(balance || 0).toLocaleString()}
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">
                $
              </span>
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(Number(e.target.value))}
                className="w-full bg-gray-50 dark:bg-[#0b131d] border border-gray-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-3.5 text-lg font-black text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner"
                placeholder="50000"
              />
            </div>

            {/* Quick Equity Chips */}
            <div className="flex flex-wrap gap-2 pt-1">
              {EQUITY_PRESETS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setBalance(amt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    balance === amt
                      ? "bg-emerald-500 text-white border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                      : "bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-emerald-500/50"
                  }`}
                >
                  ${(amt / 1000).toFixed(0)}k
                </button>
              ))}
            </div>
          </div>

          {/* 2. Risk Model Card */}
          <div className="p-6 rounded-2xl bg-white/80 dark:bg-[#121418]/90 border border-gray-200/80 dark:border-white/10 backdrop-blur-xl shadow-lg space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-cyan-500" />
                Risk Allocation
              </label>

              {/* Mode Toggle */}
              <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-lg border border-gray-200 dark:border-white/10 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setRiskMode("percent")}
                  className={`px-3 py-1 rounded-md transition-all ${
                    riskMode === "percent"
                      ? "bg-cyan-500 text-white shadow-sm"
                      : "text-gray-500 hover:text-white"
                  }`}
                >
                  Percentage (%)
                </button>
                <button
                  type="button"
                  onClick={() => setRiskMode("cash")}
                  className={`px-3 py-1 rounded-md transition-all ${
                    riskMode === "cash"
                      ? "bg-cyan-500 text-white shadow-sm"
                      : "text-gray-500 hover:text-white"
                  }`}
                >
                  Fixed Cash ($)
                </button>
              </div>
            </div>

            {riskMode === "percent" ? (
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10"
                    value={riskPercent}
                    onChange={(e) => setRiskPercent(Number(e.target.value))}
                    className="w-full bg-gray-50 dark:bg-[#0b131d] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-lg font-black text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all shadow-inner"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                    %
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {RISK_PERCENT_PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setRiskPercent(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        riskPercent === p
                          ? "bg-cyan-500 text-white border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.35)]"
                          : "bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-cyan-500/50"
                      }`}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">
                  $
                </span>
                <input
                  type="number"
                  value={riskCash}
                  onChange={(e) => setRiskCash(Number(e.target.value))}
                  className="w-full bg-gray-50 dark:bg-[#0b131d] border border-gray-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-3.5 text-lg font-black text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all shadow-inner"
                />
              </div>
            )}
          </div>

          {/* 3. Instrument & Stop Loss Card */}
          <div className="p-6 rounded-2xl bg-white/80 dark:bg-[#121418]/90 border border-gray-200/80 dark:border-white/10 backdrop-blur-xl shadow-lg space-y-5">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                Trading Pair / Asset
              </label>
              <select
                value={selectedSymbol}
                onChange={(e) => handleInstrumentSelect(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#0b131d] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-base font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              >
                {INSTRUMENTS.map((inst) => (
                  <option key={inst.symbol} value={inst.symbol}>
                    {inst.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-between items-center pt-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Stop Loss Method
              </label>
              <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-lg border border-gray-200 dark:border-white/10 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setInputMode("prices")}
                  className={`px-3 py-1 rounded-md transition-all ${
                    inputMode === "prices"
                      ? "bg-blue-500 text-white shadow-sm"
                      : "text-gray-500 hover:text-white"
                  }`}
                >
                  Entry & SL Price
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("pips")}
                  className={`px-3 py-1 rounded-md transition-all ${
                    inputMode === "pips"
                      ? "bg-blue-500 text-white shadow-sm"
                      : "text-gray-500 hover:text-white"
                  }`}
                >
                  Direct Pips / Points
                </button>
              </div>
            </div>

            {inputMode === "prices" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] font-bold text-gray-400 block mb-1.5">
                    Entry Price
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(Number(e.target.value))}
                    className="w-full bg-gray-50 dark:bg-[#0b131d] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-gray-400 block mb-1.5">
                    Stop Loss Price
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={slPrice}
                    onChange={(e) => setSlPrice(Number(e.target.value))}
                    className="w-full bg-gray-50 dark:bg-[#0b131d] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>
              </div>
            ) : (
              <div>
                <span className="text-[11px] font-bold text-gray-400 block mb-1.5">
                  Stop Loss Distance ({instrument.type === "index" ? "Points" : "Pips"})
                </span>
                <input
                  type="number"
                  step="any"
                  value={manualPips}
                  onChange={(e) => setManualPips(Number(e.target.value))}
                  className="w-full bg-gray-50 dark:bg-[#0b131d] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-base font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Output Card (5 Cols) - Glowing Hero Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-[#121418] via-[#101b2b] to-[#0c1219] border border-[#2f8df4]/40 shadow-[0_0_50px_rgba(47,141,244,0.18)] text-white space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                <Zap className="w-4 h-4" /> Recommended Execution
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Safe Lot
              </span>
            </div>

            {/* Giant Lot Display */}
            <div className="text-center py-4 space-y-2">
              <p className="text-xs text-gray-400 font-medium">Standard Lots</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 drop-shadow-[0_0_25px_rgba(52,211,153,0.4)]">
                  {lotSize.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-emerald-400/90 font-medium">
                {instrument.symbol} • {pipDistance.toFixed(1)} {instrument.type === "index" ? "pts" : "pips"} Stop Loss
              </p>
            </div>

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                copied
                  ? "bg-emerald-500 text-white shadow-emerald-500/30"
                  : "bg-gradient-to-r from-[#2f8df4] to-cyan-500 hover:from-[#2376e8] hover:to-cyan-600 text-white shadow-[0_0_20px_rgba(47,141,244,0.4)] hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" /> Copied {lotSize.toFixed(2)} Lots!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" /> Copy Lot Size ({lotSize.toFixed(2)})
                </>
              )}
            </button>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10 text-xs">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <span className="text-gray-400">Total Cash at Risk</span>
                <p className="text-lg font-black text-red-400">
                  -${totalDollarRisk.toFixed(2)}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <span className="text-gray-400">Pip Value</span>
                <p className="text-lg font-black text-cyan-300">
                  ${currentPipValue}/pip
                </p>
              </div>
            </div>

            {/* Risk-to-Reward Targets */}
            <div className="space-y-2 pt-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                Target Profits by R:R
              </p>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-gray-400 block text-[10px]">1:1 RR</span>
                  <span className="font-bold text-emerald-400">
                    +${totalDollarRisk.toFixed(0)}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
                  <span className="text-gray-400 block text-[10px]">1:2 RR</span>
                  <span className="font-bold text-emerald-300">
                    +${(totalDollarRisk * 2).toFixed(0)}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40">
                  <span className="text-gray-400 block text-[10px]">1:3 RR</span>
                  <span className="font-bold text-emerald-200">
                    +${(totalDollarRisk * 3).toFixed(0)}
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
