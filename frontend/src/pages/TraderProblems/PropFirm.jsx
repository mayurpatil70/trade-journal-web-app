// frontend/src/pages/TraderProblems/PropFirm.jsx
import { useState, useEffect } from "react";
import {
  ShieldAlert,
  DollarSign,
  Activity,
  AlertOctagon,
  Loader2,
} from "lucide-react";
import api from "../../api/axios";

export default function PropFirm() {
  const [balance, setBalance] = useState(100000);
  const [maxDrawdownPercent, setMaxDrawdownPercent] = useState(5);

  const [currentDailyPnl, setCurrentDailyPnl] = useState(0);
  const [todaysTradeCount, setTodaysTradeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Automatically fetch today's trades and calculate live PnL
  useEffect(() => {
    const fetchTodayPnl = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      setLoading(true);
      try {
        const response = await api.get(`/api/trades?userId=${userId}`);
        if (response.data.success) {
          const trades = response.data.data;

          // Get today's date in your app's format (YYYY-MM-DD)
          const today = new Date().toISOString().slice(0, 10);
          const todaysTrades = trades.filter((t) => t.date === today);

          setTodaysTradeCount(todaysTrades.length);

          // Calculate Dollar PnL based on Balance, Risk %, and R-Multiple
          let calculatedPnl = 0;
          todaysTrades.forEach((trade) => {
            const riskPercentage = trade.risk ? parseFloat(trade.risk) : 0;
            const rMultiple = trade.r_multiple
              ? parseFloat(trade.r_multiple)
              : 0;

            // Formula: Dollar Risk = Balance * (Risk% / 100)
            // Dollar PnL = Dollar Risk * R-Multiple
            const dollarRiskAmount = balance * (riskPercentage / 100);
            calculatedPnl += dollarRiskAmount * rMultiple;
          });

          setCurrentDailyPnl(calculatedPnl);
        }
      } catch (error) {
        console.error("Failed to fetch trades for Prop Firm Guardian:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTodayPnl();
  }, [balance]); // Re-run math automatically if the user changes their Account Balance

  // Core Calculations
  const maxLossAmount = (balance * maxDrawdownPercent) / 100;
  const remainingBuffer = maxLossAmount + currentDailyPnl; // PnL is negative if losing

  // Calculate percentage of drawdown used (caps at 100%)
  const drawdownUsedPercent =
    currentDailyPnl < 0
      ? Math.min((Math.abs(currentDailyPnl) / maxLossAmount) * 100, 100)
      : 0;

  // Determine dynamic status
  let statusColor = "bg-emerald-500";
  let statusText = "text-emerald-500";
  let statusMessage = "Safe. You have plenty of breathing room today.";

  if (drawdownUsedPercent >= 100) {
    statusColor = "bg-red-600";
    statusText = "text-red-600";
    statusMessage = "ACCOUNT BLOWN. You have breached your daily limit.";
  } else if (drawdownUsedPercent >= 80) {
    statusColor = "bg-red-500";
    statusText = "text-red-500";
    statusMessage =
      "CRITICAL WARNING: You are dangerously close. Stop trading immediately.";
  } else if (drawdownUsedPercent >= 50) {
    statusColor = "bg-yellow-500";
    statusText = "text-yellow-500";
    statusMessage =
      "Caution: You are halfway to your daily limit. Halve your risk.";
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[4px] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
              <ShieldAlert className="w-5 h-5 text-red-500" /> Prop Firm
              Drawdown Guardian
            </h2>
            <p className="text-sm text-gray-500">
              The #1 reason traders lose funded accounts is breaching the daily
              drawdown limit.
            </p>
          </div>

          <div className="px-4 py-2 bg-gray-50 dark:bg-[#1a1d24] border border-gray-200 dark:border-white/10 rounded-[2px] text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2 shrink-0">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#2f8df4]" />
            ) : (
              <Activity className="w-4 h-4 text-[#2f8df4]" />
            )}
            Trades Today:{" "}
            <span className="text-gray-900 dark:text-white">
              {todaysTradeCount}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Inputs */}
          <div className="space-y-4 bg-gray-50 dark:bg-[#1a1d24] p-5 border border-gray-200 dark:border-white/5 rounded-[4px]">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
              Account Parameters
            </h3>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                Starting Balance ($)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={balance}
                  onChange={(e) => setBalance(Number(e.target.value))}
                  className="w-full bg-white dark:bg-[#0d0e12] border border-gray-200 dark:border-white/10 rounded-[2px] pl-9 pr-3 py-2 text-sm text-gray-900 dark:text-white font-bold focus:outline-none focus:border-[#2f8df4]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                Daily Loss Limit (%)
              </label>
              <div className="relative">
                <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={maxDrawdownPercent}
                  onChange={(e) =>
                    setMaxDrawdownPercent(Number(e.target.value))
                  }
                  className="w-full bg-white dark:bg-[#0d0e12] border border-gray-200 dark:border-white/10 rounded-[2px] pl-9 pr-3 py-2 text-sm text-gray-900 dark:text-white font-bold focus:outline-none focus:border-[#2f8df4]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-white/10 mt-4">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                Today's Net PnL ($)
              </label>
              <div className="relative">
                <DollarSign
                  className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${currentDailyPnl >= 0 ? "text-emerald-500" : "text-red-500"}`}
                />
                <input
                  type="text"
                  readOnly
                  value={currentDailyPnl.toFixed(2)}
                  className={`w-full bg-gray-200/50 dark:bg-white/5 border border-transparent rounded-[2px] pl-9 pr-3 py-2 text-sm font-bold focus:outline-none ${currentDailyPnl >= 0 ? "text-emerald-500" : "text-red-500"}`}
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-2 font-medium">
                *Automatically calculated from today's trades based on Risk% and
                R-Multiple.
              </p>
            </div>
          </div>

          {/* Visualizer */}
          <div className="md:col-span-2 space-y-6 bg-gray-50 dark:bg-[#1a1d24] p-5 border border-gray-200 dark:border-white/5 rounded-[4px] flex flex-col justify-center">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                  Max Allowed Loss
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  $
                  {maxLossAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                  Remaining Buffer
                </p>
                <p className={`text-3xl font-bold ${statusText}`}>
                  $
                  {Math.max(0, remainingBuffer).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-4 bg-gray-200 dark:bg-[#0d0e12] rounded-full overflow-hidden border border-gray-300 dark:border-white/5 relative">
              <div
                className={`h-full transition-all duration-700 ease-out ${statusColor}`}
                style={{ width: `${drawdownUsedPercent}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] font-bold text-gray-500 mt-1">
              <span>$0</span>
              <span>50%</span>
              <span>100% Limit</span>
            </div>

            {/* Status Message */}
            <div
              className={`mt-4 p-4 border rounded-[2px] flex items-start gap-3 ${
                drawdownUsedPercent >= 80
                  ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400"
                  : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
              }`}
            >
              <AlertOctagon className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-bold">{statusMessage}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
