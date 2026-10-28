export default function LiveChartMockup({ targetRR = "1:2" }) {
  return (
    <div className="relative w-full max-w-[500px] mx-auto rounded-3xl bg-white/95 dark:bg-[#0c1017]/95 border border-black/[0.08] dark:border-white/[0.1] shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl p-4 sm:p-5 overflow-hidden select-none">
      {/* Background radial glow */}
      <div className="absolute -top-16 -left-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top macOS Window Chrome Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
        {/* macOS Traffic Light Buttons */}
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block shadow-2xs" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block shadow-2xs" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block shadow-2xs" />
          <span className="ml-2 text-xs font-black text-neutral-900 dark:text-white flex items-center gap-1.5">
            <span>XAUUSD</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/[0.04] dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-400 font-bold border border-black/[0.04] dark:border-white/[0.06]">
              15m
            </span>
          </span>
        </div>

        {/* Dynamic Risk : Reward Badge */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
            R:R {targetRR}
          </span>
        </div>
      </div>

      {/* Realistic TradingView Backtesting Simulation Container */}
      <div className="relative h-64 sm:h-72 w-full rounded-2xl overflow-hidden border border-black/10 dark:border-white/[0.08] bg-black group shadow-inner">
        {/* High-Resolution TradingView Bar Replay Chart Image */}
        <img
          src="/screenshots/screenshot_4_barreplay.png"
          alt="TradingView Bar Replay Backtesting Chart"
          className="w-full h-full object-cover object-center transform transition-transform duration-500 group-hover:scale-[1.02]"
          onError={(e) => {
            // Fallback to livecharts screenshot if barreplay not found
            e.currentTarget.src = "/screenshots/screenshot_3_livecharts.png";
          }}
        />

        {/* Subtle Dark Gradient Overlay for Glass Badge Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 pointer-events-none" />

        {/* Floating Live In-Play P&L Overlay Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/75 dark:bg-[#121622]/90 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold backdrop-blur-md shadow-lg shadow-emerald-500/15">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>In play: +$620.00 (+2.1R)</span>
        </div>

        {/* Floating TradingView Watermark Badge */}
        <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-mono font-semibold text-neutral-300">
          TradingView Replay
        </div>

        {/* Live Execution Level Markers */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono font-bold px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-white">
          <div className="flex items-center gap-3">
            <span className="text-emerald-400">TP: 1690.710</span>
            <span className="text-sky-400">ENTRY: 1686.798</span>
            <span className="text-rose-400">SL: 1683.731</span>
          </div>
          <span className="text-neutral-400 hidden sm:inline">10-Yr Tick Data</span>
        </div>
      </div>

      {/* Footer Pill */}
      <div className="mt-3.5 pt-2.5 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 border-t border-black/[0.06] dark:border-white/[0.06]">
        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Backtest your rules before risking capital</span>
        </div>
        <span className="text-[10px] font-mono text-neutral-400">Multi-Timeframe</span>
      </div>
    </div>
  );
}
