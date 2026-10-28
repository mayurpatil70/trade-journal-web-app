export default function LiveDashboardMockup() {
  return (
    <div className="relative w-full max-w-[540px] mx-auto rounded-3xl bg-white/95 dark:bg-[#0c1017]/95 border border-black/[0.08] dark:border-white/[0.1] shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl p-5 overflow-hidden select-none">
      {/* Background radial ambient glow */}
      <div className="absolute -top-20 -right-20 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Mini Mockup Top Bar */}
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          <span className="text-[11px] font-extrabold text-neutral-900 dark:text-white ml-2">Dashboard</span>
          <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">ForexNotes</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-black/[0.04] dark:bg-white/[0.06] text-neutral-700 dark:text-neutral-300 font-bold border border-black/[0.04] dark:border-white/[0.06]">
            01:14:33 PM
          </span>
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black flex items-center justify-center">
            P
          </div>
        </div>
      </div>

      {/* 4 Mini KPI Cards */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="p-2.5 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.05]">
          <span className="text-[8px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">Total P&L</span>
          <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400 block mt-0.5">+$3,618.50</span>
          <span className="text-[8px] text-neutral-500 font-medium">11 trades</span>
        </div>
        <div className="p-2.5 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.05]">
          <span className="text-[8px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">Unrealized</span>
          <span className="text-xs font-black font-mono text-amber-500 block mt-0.5">+$3,567.21</span>
          <span className="text-[8px] text-neutral-500 font-medium">2 open</span>
        </div>
        <div className="p-2.5 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.05]">
          <span className="text-[8px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">Realized</span>
          <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400 block mt-0.5">+$51.29</span>
          <span className="text-[8px] text-neutral-500 font-medium">9 closed</span>
        </div>
        <div className="p-2.5 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.05]">
          <span className="text-[8px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">Win Rate</span>
          <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400 block mt-0.5">67%</span>
          <span className="text-[8px] text-neutral-500 font-medium">Above avg</span>
        </div>
      </div>

      {/* Mid Section: Mini Equity Curve Chart + Monthly PnL */}
      <div className="grid grid-cols-12 gap-3 mb-4">
        {/* Equity Curve */}
        <div className="col-span-7 p-3 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.05] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-[9px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">Performance</span>
              <p className="text-sm font-black font-mono text-neutral-900 dark:text-white">+$3,591.53</p>
            </div>
            <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              +899.5%
            </span>
          </div>

          {/* SVG Mini Curve */}
          <div className="h-20 w-full relative">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 200 70" preserveAspectRatio="none">
              <defs>
                <linearGradient id="mockupGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="20" x2="200" y2="20" stroke="currentColor" className="text-black/5 dark:text-white/5" strokeDasharray="2 2" />
              <line x1="0" y1="45" x2="200" y2="45" stroke="currentColor" className="text-black/5 dark:text-white/5" strokeDasharray="2 2" />
              <path
                d="M 0,65 L 30,62 L 60,60 L 90,52 L 120,48 L 150,30 L 175,18 L 200,8 L 200,70 L 0,70 Z"
                fill="url(#mockupGrad)"
              />
              <path
                d="M 0,65 L 30,62 L 60,60 L 90,52 L 120,48 L 150,30 L 175,18 L 200,8"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="200" cy="8" r="3.5" fill="#10b981" />
              <circle cx="200" cy="8" r="7" fill="#10b981" opacity="0.3" />
            </svg>
          </div>
          <div className="flex justify-between text-[8px] font-mono text-neutral-500 dark:text-neutral-400 mt-1">
            <span>Jan 01</span>
            <span>Jan 15</span>
            <span>Today</span>
          </div>
        </div>

        {/* Mini Monthly P&L Calendar */}
        <div className="col-span-5 p-3 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.05] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-bold text-neutral-700 dark:text-neutral-300">Monthly P&L</span>
            <span className="text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400">+$3.6k</span>
          </div>
          {/* Mini Calendar Dots Grid */}
          <div className="grid grid-cols-7 gap-1 py-1">
            {Array.from({ length: 28 }).map((_, i) => {
              const isProfit = [2, 5, 8, 11, 14, 18, 21, 23, 26].includes(i);
              const isLoss = [4, 12, 19].includes(i);
              return (
                <div
                  key={i}
                  className={`h-3 rounded-sm flex items-center justify-center text-[7px] font-mono ${
                    isProfit
                      ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30"
                      : isLoss
                      ? "bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold border border-rose-500/30"
                      : "bg-black/[0.03] dark:bg-white/[0.02] text-neutral-400 dark:text-neutral-600"
                  }`}
                >
                  {i + 1}
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-3 pt-1 text-[7px] text-neutral-500 dark:text-neutral-400 font-medium">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Profit
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Loss
            </span>
          </div>
        </div>
      </div>

      {/* Mini Open Positions strip */}
      <div className="p-2.5 rounded-2xl bg-neutral-50 dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[10px] font-bold text-neutral-900 dark:text-white">XAUUSD</span>
          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold uppercase">
            BUY • In Play
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">+$240.00</span>
      </div>

      {/* Live Badge at Bottom */}
      <div className="mt-3 pt-2.5 flex items-center justify-between text-[10px] text-neutral-500 dark:text-neutral-400 border-t border-black/[0.04] dark:border-white/[0.04]">
        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live dashboard preview</span>
        </div>
        <span className="text-neutral-500 font-medium">Auto-syncing real accounts</span>
      </div>
    </div>
  );
}
