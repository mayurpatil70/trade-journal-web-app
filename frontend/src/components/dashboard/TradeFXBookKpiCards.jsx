import { Wallet, Zap, CreditCard, Trophy } from "lucide-react";

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

  return (
    <div className="space-y-3">
      {/* ── 4 PRIMARY CARDS (Color Theme: Emerald Green, Yellow/Amber, Red, Neutral) ── */}
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

      {/* ── SECONDARY STATS BAR (Preserving all metrics with responsive colors) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="px-4 py-2.5 rounded-2xl bg-neutral-100/60 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.05] flex items-center justify-between">
          <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">Profit Factor</span>
          <span className="text-xs font-bold font-mono text-neutral-900 dark:text-white">{stats.profitFactor}</span>
        </div>
        <div className="px-4 py-2.5 rounded-2xl bg-neutral-100/60 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.05] flex items-center justify-between">
          <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">Average R</span>
          <span className={`text-xs font-bold font-mono ${parseFloat(stats.avgR) >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
            {parseFloat(stats.avgR) >= 0 ? "+" : ""}{stats.avgR}R
          </span>
        </div>
        <div className="px-4 py-2.5 rounded-2xl bg-neutral-100/60 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.05] flex items-center justify-between">
          <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">Max Drawdown</span>
          <span className="text-xs font-bold font-mono text-rose-500">-{stats.maxDrawdown}R</span>
        </div>
        <div className="px-4 py-2.5 rounded-2xl bg-neutral-100/60 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.05] flex items-center justify-between">
          <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">Net R-Multiple</span>
          <span className={`text-xs font-bold font-mono ${parseFloat(stats.totalR) >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
            {parseFloat(stats.totalR) >= 0 ? "+" : ""}{stats.totalR}R
          </span>
        </div>
      </div>
    </div>
  );
}
