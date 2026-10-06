import React, { useState } from 'react';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Crosshair, Calculator } from 'lucide-react';

export default function Backtest() {
  const [balance, setBalance] = useState(10000);
  const [tradeHistory, setTradeHistory] = useState([]);
  
  // Virtual Trade Form
  const [direction, setDirection] = useState('Buy');
  const [entry, setEntry] = useState('');
  const [sl, setSl] = useState('');
  const [tp, setTp] = useState('');

  const handleLogTrade = (e) => {
    e.preventDefault();
    if (!entry || !sl || !tp) return;
    
    const entryPrice = parseFloat(entry);
    const stopLoss = parseFloat(sl);
    const takeProfit = parseFloat(tp);
    
    // Assume 1 standard lot for simplicity, or we calculate based on a fixed risk
    // Simple math: (Exit - Entry) / Entry * PositionSize
    // Let's assume a fixed position size of $1000
    const positionSize = 1000;
    
    // Calculate PnL based on hitting TP
    let pnl = 0;
    if (direction === 'Buy') {
       pnl = ((takeProfit - entryPrice) / entryPrice) * positionSize;
    } else {
       pnl = ((entryPrice - takeProfit) / entryPrice) * positionSize;
    }

    const trade = {
      type: direction,
      entryPrice,
      sl: stopLoss,
      tp: takeProfit,
      finalPnl: pnl
    };

    setBalance(prev => prev + pnl);
    setTradeHistory(prev => [trade, ...prev]);
    
    // Reset form
    setEntry('');
    setSl('');
    setTp('');
  };

  return (
    <div className="flex flex-col h-screen bg-[#0A0B0D] text-white pt-14 md:pt-0 overflow-hidden font-sans">
      
      {/* Top Warning/Info Bar */}
      <div className="h-10 bg-indigo-500/10 border-b border-indigo-500/20 flex items-center justify-center px-4 shrink-0 text-xs text-indigo-300 font-medium tracking-wide">
        Full TradingView Data Feed Active (Free Crypto & Forex Data) • Use chart tools to measure, then log your simulated outcome in the execution panel.
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        
        {/* Center Chart - TradingView Advanced Widget */}
        <div className="flex-1 bg-[#131722] relative flex flex-col min-h-[50vh]">
          <AdvancedRealTimeChart 
             theme="dark" 
             symbol="BINANCE:BTCUSD" // Default
             interval="60" 
             timezone="Etc/UTC" 
             style="1" 
             locale="en" 
             enable_publishing={false} 
             allow_symbol_change={true}
             container_id="tv_chart_container"
             width="100%"
             height="100%"
             hide_side_toolbar={false} // Gives them all the drawing tools!
             withdateranges={true}
          />
        </div>
        
        {/* Right Sidebar (Execution & History) */}
        <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-white/10 bg-[#131722] flex flex-col shrink-0">
           
           <div className="p-5 border-b border-white/10">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><Calculator className="w-4 h-4 text-cyan-400" /> Virtual Execution</h3>
                 <div className="text-sm font-mono bg-[#1E222D] px-3 py-1 rounded-md border border-white/5 font-bold">
                   <span className={balance >= 10000 ? "text-emerald-400" : "text-red-400"}>${balance.toFixed(2)}</span>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <Button 
                  className={`w-full h-9 rounded-lg text-sm font-bold border-none ${direction === 'Buy' ? 'bg-[#089981] text-white shadow-lg shadow-[#089981]/20' : 'bg-[#1E222D] text-gray-400 hover:text-white hover:bg-white/5'}`}
                  onClick={() => setDirection('Buy')}
                >
                  Long
                </Button>
                <Button 
                  className={`w-full h-9 rounded-lg text-sm font-bold border-none ${direction === 'Sell' ? 'bg-[#F23645] text-white shadow-lg shadow-[#F23645]/20' : 'bg-[#1E222D] text-gray-400 hover:text-white hover:bg-white/5'}`}
                  onClick={() => setDirection('Sell')}
                >
                  Short
                </Button>
              </div>
              
              <form onSubmit={handleLogTrade} className="space-y-3">
                 <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Entry Price</label>
                    <input 
                      type="number" 
                      step="any"
                      required
                      value={entry}
                      onChange={e => setEntry(e.target.value)}
                      className="w-full bg-[#1E222D] border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="0.00"
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    <div>
                       <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Stop Loss</label>
                       <input 
                         type="number" 
                         step="any"
                         required
                         value={sl}
                         onChange={e => setSl(e.target.value)}
                         className="w-full bg-[#1E222D] border border-white/10 rounded-lg p-2 text-sm text-[#F23645] font-mono focus:outline-none focus:border-cyan-500 transition-colors"
                         placeholder="0.00"
                       />
                    </div>
                    <div>
                       <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Take Profit</label>
                       <input 
                         type="number" 
                         step="any"
                         required
                         value={tp}
                         onChange={e => setTp(e.target.value)}
                         className="w-full bg-[#1E222D] border border-white/10 rounded-lg p-2 text-sm text-[#089981] font-mono focus:outline-none focus:border-cyan-500 transition-colors"
                         placeholder="0.00"
                       />
                    </div>
                 </div>
                 <Button type="submit" className="w-full mt-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold h-10 shadow-lg shadow-cyan-600/20">
                   Log Virtual Trade (TP Hit)
                 </Button>
              </form>
           </div>

           <div className="flex-1 overflow-y-auto p-4 flex flex-col bg-[#0A0B0D]">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Simulated History</h3>
              
              <div className="space-y-2 flex-1">
                {tradeHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full opacity-50 pt-10">
                     <ShieldCheck className="w-10 h-10 text-gray-600 mb-3" />
                     <p className="text-xs text-gray-500 text-center">Use the drawing tools to measure setups, then log them here.</p>
                  </div>
                ) : (
                  tradeHistory.map((trade, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-[#131722] border border-white/5 text-sm hover:bg-[#1E222D] transition-colors">
                      <div>
                        <span className={`font-bold text-[11px] uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 ${trade.type === 'Buy' ? 'text-[#089981]' : 'text-[#F23645]'}`}>{trade.type}</span>
                        <div className="text-[10px] text-gray-500 font-mono mt-1.5 flex items-center gap-2">
                           <span>IN: {trade.entryPrice.toFixed(2)}</span>
                           <span>OUT: {trade.tp.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className={`font-mono font-bold text-[13px] ${trade.finalPnl >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                        {trade.finalPnl >= 0 ? '+' : ''}{trade.finalPnl.toFixed(2)}
                      </div>
                    </div>
                  ))
                )}
              </div>
           </div>

        </div>

      </div>
    </div>
  );
}
