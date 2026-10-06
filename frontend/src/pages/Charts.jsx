import React from 'react';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';

export default function Charts() {
  return (
    <div className="flex flex-col h-screen bg-[#131722] text-white pt-14 md:pt-0 overflow-hidden font-sans">
      <div className="flex-1 bg-[#131722] relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[calc(100%+42px)]">
          <AdvancedRealTimeChart 
             theme="dark" 
             symbol="BINANCE:BTCUSD" 
             interval="60" 
             timezone="Etc/UTC" 
             style="1" 
             locale="en" 
             enable_publishing={false} 
             allow_symbol_change={true}
             container_id="tv_chart_container_live"
             width="100%"
             height="100%"
             hide_side_toolbar={false}
             withdateranges={true}
          />
        </div>
      </div>
    </div>
  );
}
