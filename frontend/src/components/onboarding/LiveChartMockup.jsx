export default function LiveChartMockup({ targetRR = "1:2" }) {
  return (
    <div className="relative w-full max-w-[480px] mx-auto rounded-3xl bg-white/95 dark:bg-[#0c1017]/95 border border-black/[0.08] dark:border-white/[0.1] shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl p-5 overflow-hidden select-none">
      {/* Background radial glow */}
      <div className="absolute -top-16 -left-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Chart Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-black text-neutral-900 dark:text-white">XAUUSD</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.06] text-neutral-700 dark:text-neutral-300 font-bold border border-black/[0.04] dark:border-white/[0.06]">
            15m
          </span>
          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-black">1686.798</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
            R:R {targetRR}
          </span>
        </div>
      </div>

      {/* Candlestick & Trade Setup Visualization */}
      <div className="relative h-60 w-full rounded-2xl bg-neutral-900 dark:bg-black/40 border border-black/10 dark:border-white/[0.04] p-3 overflow-hidden flex flex-col justify-between">
        {/* Horizontal Price Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none p-3 opacity-20">
          <div className="w-full border-b border-dashed border-white/20" />
          <div className="w-full border-b border-dashed border-white/20" />
          <div className="w-full border-b border-dashed border-white/20" />
          <div className="w-full border-b border-dashed border-white/20" />
        </div>

        {/* SVG Candlesticks & Execution levels */}
        <svg className="w-full h-full overflow-visible" viewBox="0 0 320 180" preserveAspectRatio="none">
          {/* Shaded Reward Zone (Green) */}
          <rect x="180" y="30" width="130" height="50" fill="#10b981" fillOpacity="0.18" rx="4" />
          {/* Shaded Risk Zone (Red) */}
          <rect x="180" y="80" width="130" height="40" fill="#ef4444" fillOpacity="0.18" rx="4" />

          {/* TP line */}
          <line x1="10" y1="30" x2="310" y2="30" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 3" />
          <text x="235" y="24" fill="#10b981" fontSize="9" fontWeight="bold" fontFamily="monospace">
            TP 1690.710
          </text>

          {/* Entry line */}
          <line x1="10" y1="80" x2="310" y2="80" stroke="#38bdf8" strokeWidth="1.5" />
          <text x="230" y="74" fill="#38bdf8" fontSize="9" fontWeight="bold" fontFamily="monospace">
            BUY 1686.798
          </text>

          {/* SL line */}
          <line x1="10" y1="120" x2="310" y2="120" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 3" />
          <text x="235" y="134" fill="#ef4444" fontSize="9" fontWeight="bold" fontFamily="monospace">
            SL 1683.731
          </text>

          {/* Candlesticks series */}
          {/* 1. Bearish */}
          <line x1="30" y1="80" x2="30" y2="125" stroke="#ef4444" strokeWidth="1" />
          <rect x="26" y="90" width="8" height="25" fill="#ef4444" rx="1" />

          {/* 2. Bullish */}
          <line x1="60" y1="85" x2="60" y2="130" stroke="#10b981" strokeWidth="1" />
          <rect x="56" y="95" width="8" height="25" fill="#10b981" rx="1" />

          {/* 3. Bullish Pin bar */}
          <line x1="90" y1="80" x2="90" y2="140" stroke="#10b981" strokeWidth="1" />
          <rect x="86" y="85" width="8" height="20" fill="#10b981" rx="1" />

          {/* 4. Bearish pullback */}
          <line x1="120" y1="75" x2="120" y2="115" stroke="#ef4444" strokeWidth="1" />
          <rect x="116" y="80" width="8" height="20" fill="#ef4444" rx="1" />

          {/* 5. Strong Bullish breakout */}
          <line x1="150" y1="65" x2="150" y2="110" stroke="#10b981" strokeWidth="1" />
          <rect x="146" y="70" width="8" height="30" fill="#10b981" rx="1" />

          {/* 6. Execution candle at entry */}
          <line x1="180" y1="50" x2="180" y2="95" stroke="#10b981" strokeWidth="1" />
          <rect x="176" y="55" width="8" height="28" fill="#10b981" rx="1" />

          {/* 7. Continued impulse */}
          <line x1="210" y1="35" x2="210" y2="75" stroke="#10b981" strokeWidth="1" />
          <rect x="206" y="38" width="8" height="25" fill="#10b981" rx="1" />
        </svg>

        {/* Live floating entry indicator badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
          <span>In play: +$620.00 (+2.1R)</span>
        </div>
      </div>

      {/* Footer Pill */}
      <div className="mt-4 pt-3 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 border-t border-black/[0.06] dark:border-white/[0.06]">
        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Backtest your rules before risking capital</span>
        </div>
        <span className="font-mono text-neutral-500 text-[10px]">10-Yr Tick Data</span>
      </div>
    </div>
  );
}
