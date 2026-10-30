import React from 'react';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';
import { useTheme } from '../components/theme-provider';
import { Activity } from 'lucide-react';

export default function Charts() {
  const { theme } = useTheme();
  const surface = theme === 'dark' ? 'bg-[#131722]' : 'bg-white';

  return (
    <div className={`flex flex-col h-dvh ${surface} pt-14 md:pt-0 overflow-hidden font-sans`}>
      {/* ── macOS Desktop Top Header Bar (Clears fixed action buttons & displays live market status) ── */}
      <div className="hidden md:flex h-14 shrink-0 items-center justify-between px-6 border-b border-black/[0.06] dark:border-white/[0.08] bg-white/80 dark:bg-[#131722]/90 backdrop-blur-xl z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-xs">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              Live Market Terminal
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                Live Feed
              </span>
            </h1>
          </div>
        </div>

        {/* Clearance spacer reserving space for desktop top-right action buttons (PenSquare, NotificationBell, ThemeToggle) */}
        <div className="w-44 h-8 pointer-events-none" aria-hidden="true" />
      </div>

      {/* ── TradingView Chart Container ── */}
      <div className={`flex-1 ${surface} relative overflow-hidden`}>
        <div className="absolute top-0 left-0 right-0 h-[calc(100%+42px)]">
          <AdvancedRealTimeChart 
             theme={theme} 
             symbol="BINANCE:BTCUSD" 
             interval="60" 
             timezone="Etc/UTC" 
             style="1" 
             locale="en" 
             enable_publishing={false} 
             allow_symbol_change={true}
             container_id={`tv_chart_container_${theme}`}
             width="100%"
             height="100%"
             hide_side_toolbar={false}
             withdateranges={true}
             hide_volume={true}
             disabled_features={['create_volume_indicator_by_default']}
             studies={[]}
          />
        </div>
      </div>
    </div>
  );
}
