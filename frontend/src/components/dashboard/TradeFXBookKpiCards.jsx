import {
  Wallet,
  Zap,
  CreditCard,
  Trophy,
  TrendingUp,
  BarChart2,
  ShieldAlert,
  Target,
} from "lucide-react";

export default function TradeFXBookKpiCards({ stats, trades }) {
  // Compute realized vs unrealized
  const closedTrades = trades.filter((t) => t.result !== "open");
  const openTrades = trades.filter((t) => t.result === "open");

  let totalR = parseFloat(stats.totalR) || 0;
  let hasDollarPnl = false;
  let totalDollarPnl = 0;

  trades.forEach((t) => {
    if (t.pnl !== null && t.pnl !== undefined) {
      totalDollarPnl += Number(t.pnl);
      hasDollarPnl = true;
    }
  });

  const totalPnlDisplay = hasDollarPnl
    ? `${totalDollarPnl >= 0 ? "+" : ""}$${Math.abs(totalDollarPnl).toFixed(2)}`
    : `${totalR >= 0 ? "+" : ""}${totalR.toFixed(2)}R`;

  const realizedDisplay = totalPnlDisplay;
  const unrealizedDisplay = "+$0.00";

  const avgRVal = parseFloat(stats.avgR) || 0;
  const netRVal = parseFloat(stats.totalR) || 0;
  const maxDdVal = parseFloat(stats.maxDrawdown) || 0;

  return (
    <div className="space-y-4">
      {/* ── 4 PRIMARY KPI CARDS (Color Theme: Emerald Green, Yellow/Amber, Red, Neutral) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. TOTAL P&L */}
        <div className="rounded-3xl p-5 bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_25px_rgba(0,0,0,0.4)] flex items-start gap-4 transition-all hover:border-emerald-500/30">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              TOTAL P&L
            </p>
            <p
              className={`text-2xl font-extrabold font-mono mt-0.5 tracking-tight ${
                totalR >= 0 ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
              }`}
            >
              {totalPnlDisplay}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-1 font-medium">
              <span>&rarr;</span>
              <span>{trades.length} trades</span>
            </p>
          </div>
        </div>

        {/* 2. UNREALIZED */}
        <div className="rounded-3xl p-5 bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_25px_rgba(0,0,0,0.4)] flex items-start gap-4 transition-all hover:border-amber-500/30">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              UNREALIZED
            </p>
            <p className="text-2xl font-extrabold font-mono mt-0.5 tracking-tight text-neutral-900 dark:text-white">
              {unrealizedDisplay}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
              {openTrades.length} open positions
            </p>
          </div>
        </div>

        {/* 3. REALIZED */}
        <div className="rounded-3xl p-5 bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_25px_rgba(0,0,0,0.4)] flex items-start gap-4 transition-all hover:border-emerald-500/30">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              REALIZED
            </p>
            <p
              className={`text-2xl font-extrabold font-mono mt-0.5 tracking-tight ${
                totalR >= 0 ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
              }`}
            >
              {realizedDisplay}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
              {closedTrades.length} closed trades
            </p>
          </div>
        </div>

        {/* 4. WIN RATE */}
        <div className="rounded-3xl p-5 bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_25px_rgba(0,0,0,0.4)] flex items-start gap-4 transition-all hover:border-amber-500/30">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              WIN RATE
            </p>
            <p className="text-2xl font-extrabold font-mono mt-0.5 tracking-tight text-neutral-900 dark:text-white">
              {stats.winRate}%
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
              PF: {stats.profitFactor} • Avg: {stats.avgR}R
            </p>
          </div>
        </div>
      </div>

      {/* ── 4 SECONDARY METRIC CARDS (Exact same rich properties & dimensions as upper cards) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. PROFIT FACTOR */}
        <div className="rounded-3xl p-5 bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_25px_rgba(0,0,0,0.4)] flex items-start gap-4 transition-all hover:border-emerald-500/30">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              PROFIT FACTOR
            </p>
            <p className="text-2xl font-extrabold font-mono mt-0.5 tracking-tight text-neutral-900 dark:text-white">
              {stats.profitFactor}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
              Win/Loss ratio efficiency
            </p>
          </div>
        </div>

        {/* 2. AVERAGE R */}
        <div className="rounded-3xl p-5 bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_25px_rgba(0,0,0,0.4)] flex items-start gap-4 transition-all hover:border-emerald-500/30">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              AVERAGE R
            </p>
            <p
              className={`text-2xl font-extrabold font-mono mt-0.5 tracking-tight ${
                avgRVal >= 0 ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
              }`}
            >
              {avgRVal >= 0 ? "+" : ""}{stats.avgR}R
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
              Expectancy per closed trade
            </p>
          </div>
        </div>

        {/* 3. MAX DRAWDOWN */}
        <div className="rounded-3xl p-5 bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_25px_rgba(0,0,0,0.4)] flex items-start gap-4 transition-all hover:border-rose-500/30">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              MAX DRAWDOWN
            </p>
            <p className="text-2xl font-extrabold font-mono mt-0.5 tracking-tight text-rose-500 dark:text-rose-400">
              -{stats.maxDrawdown}R
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
              Peak equity drop risk
            </p>
          </div>
        </div>

        {/* 4. NET R-MULTIPLE */}
        <div className="rounded-3xl p-5 bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_25px_rgba(0,0,0,0.4)] flex items-start gap-4 transition-all hover:border-emerald-500/30">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              NET R-MULTIPLE
            </p>
            <p
              className={`text-2xl font-extrabold font-mono mt-0.5 tracking-tight ${
                netRVal >= 0 ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
              }`}
            >
              {netRVal >= 0 ? "+" : ""}{stats.totalR}R
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
              Cumulative risk multiple gain
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
