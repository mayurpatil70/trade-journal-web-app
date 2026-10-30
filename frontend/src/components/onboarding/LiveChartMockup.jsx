export default function LiveChartMockup({
  targetRR = "1:2",
  maxRiskPerTrade = 2,
  dailyLossCap = 5,
  maxTradesPerDay = 5,
}) {
  return (
    <div className="relative w-full h-full rounded-3xl bg-white/95 dark:bg-[#0c1017]/95 border border-black/[0.08] dark:border-white/[0.1] shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl p-4 sm:p-5 flex flex-col justify-between select-none overflow-hidden">
      {/* Background ambient radial glow */}
      <div className="absolute -top-16 -left-16 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top macOS Window Header Bar */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-black/[0.06] dark:border-white/[0.08] shrink-0">
        <div className="flex items-center gap-2">
          {/* macOS Traffic Light Buttons */}
          <div className="flex items-center gap-1.5 mr-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <span className="text-xs font-black text-neutral-900 dark:text-white">XAUUSD</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/[0.04] dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-400 font-bold border border-black/[0.04] dark:border-white/[0.06]">
            15m
          </span>
          <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold hidden sm:inline">
            2,654.80
          </span>
        </div>

        {/* Dynamic Risk : Reward Badge */}
        <span className="text-[11px] font-mono font-black px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shadow-xs">
          R:R {targetRR}
        </span>
      </div>

      {/* HD Realistic TradingView Chart Frame (Expanded & Proportional) */}
      <div className="relative flex-1 min-h-[300px] sm:min-h-[340px] w-full rounded-2xl overflow-hidden border border-black/10 dark:border-white/[0.08] bg-[#131722] group shadow-inner">
        {/* Crystal Clear HD TradingView Chart Image */}
        <img
          src="/screenshots/realistic_tradingview_chart.png"
          alt="TradingView Backtest Execution Chart"
          className="w-full h-full object-cover object-center transform transition-transform duration-500 group-hover:scale-[1.01]"
          onError={(e) => {
            // High-res fallback if needed
            e.currentTarget.src = "/screenshots/screenshot_3_livecharts.png";
          }}
        />

        {/* Floating In-Play Execution Badge (Clean, NO overlapping replay label) */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/80 dark:bg-[#121622]/90 border border-blue-500/40 text-blue-400 text-xs font-mono font-bold backdrop-blur-md shadow-lg shadow-blue-500/15">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span>In play: +$620.00 (+2.1R)</span>
        </div>

        {/* Bottom Execution Levels Strip */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono font-bold px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 text-white shadow-md">
          <div className="flex items-center gap-3">
            <span className="text-emerald-400">TP: 2668.50</span>
            <span className="text-sky-400">ENTRY: 2654.80</span>
            <span className="text-rose-400">SL: 2648.20</span>
          </div>
          <span className="text-neutral-400 hidden sm:inline">10-Yr Tick Data</span>
        </div>
      </div>

      {/* Live Discipline Parameters Synchronization Strip (Fills blank space gracefully) */}
      <div className="mt-3.5 p-3 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.05] shrink-0">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block">
              Max Risk
            </span>
            <span className="font-mono font-black text-blue-600 dark:text-blue-400 block mt-0.5">
              {maxRiskPerTrade}%
            </span>
          </div>
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block">
              Daily Cap
            </span>
            <span className="font-mono font-black text-amber-500 dark:text-amber-400 block mt-0.5">
              {dailyLossCap}%
            </span>
          </div>
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block">
              Max Trades
            </span>
            <span className="font-mono font-black text-neutral-800 dark:text-neutral-200 block mt-0.5">
              {maxTradesPerDay}/day
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer Summary Strip */}
      <div className="mt-3 pt-2.5 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 border-t border-black/[0.06] dark:border-white/[0.06] shrink-0">
        <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span>Backtest rules before risking capital</span>
        </div>
        <span className="text-[10px] font-mono text-neutral-400 hidden sm:inline">
          Tick Backtest
        </span>
      </div>
    </div>
  );
}
