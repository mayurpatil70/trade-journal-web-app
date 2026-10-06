import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export default function Backtest() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Session State
  const [session, setSession] = useState(null);
  const [tradeHistory, setTradeHistory] = useState([]);

  // MT5 Panel State
  const [lotSize, setLotSize] = useState('1.00');
  const [slPrice, setSlPrice] = useState('');
  const [tpPrice, setTpPrice] = useState('');
  const [currentPriceStr, setCurrentPriceStr] = useState('0.00');

  useEffect(() => {
    // Fetch session data
    const saved = localStorage.getItem('backtest_sessions');
    let foundSession = { id: 'demo', name: 'Demo Session', pair: 'BTCUSDT', balance: 10000 };
    if (saved) {
      const parsed = JSON.parse(saved);
      const s = parsed.find(x => x.id === id);
      if (s) foundSession = s;
    }
    setSession(foundSession);
  }, [id]);

  const executeTrade = (type) => {
    if (!slPrice || !tpPrice || !lotSize) {
      alert("Please enter Lot Size, Stop Loss, and Take Profit.");
      return;
    }

    const stopLoss = parseFloat(slPrice);
    const takeProfit = parseFloat(tpPrice);
    const lots = parseFloat(lotSize);
    
    // For a virtual execution simulator using TradingView, we don't have the exact entry price 
    // from the cross-origin iframe on click. We'll simulate a 1:2 R:R win for demonstration,
    // or let the user explicitly tell us they won or lost. 
    // Here we'll just log the intended setup.
    
    const trade = {
      type,
      lots,
      sl: stopLoss,
      tp: takeProfit,
      // Fake PNL based on random outcome for demonstration of execution logger
      pnl: Math.random() > 0.5 ? (lots * 1000) : -(lots * 500)
    };

    setSession(prev => {
      const newBal = prev.balance + trade.pnl;
      const saved = JSON.parse(localStorage.getItem('backtest_sessions') || '[]');
      const updated = saved.map(s => s.id === id ? { ...s, balance: newBal } : s);
      localStorage.setItem('backtest_sessions', JSON.stringify(updated));
      return { ...prev, balance: newBal };
    });
    
    setTradeHistory(prev => [trade, ...prev]);
    setSlPrice('');
    setTpPrice('');
  };

  return (
    <div className="flex flex-col h-screen bg-[#131722] text-white overflow-hidden font-sans">
      
      {/* Top Session Header */}
      <div className="h-14 border-b border-white/10 bg-[#131722] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
           <button onClick={() => navigate('/sessions')} className="p-1.5 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors">
             <ChevronLeft className="w-5 h-5" />
           </button>
           <div>
             <div className="text-sm font-bold">{session?.name || 'TradingView Simulator'}</div>
             <div className="text-[10px] text-gray-500">{session?.pair || 'BTCUSDT'} • Live & Historical Data</div>
           </div>
        </div>
        <div className="text-sm font-mono bg-[#1E222D] px-4 py-1.5 rounded-lg border border-white/5 font-bold">
           Bal: <span className={(session?.balance || 10000) >= 10000 ? "text-emerald-400" : "text-red-400"}>${(session?.balance || 10000).toFixed(2)}</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
        
        {/* Center Chart - TradingView Advanced Widget with Bottom Crop */}
        <div className="flex-1 bg-[#131722] relative overflow-hidden">
          {/* We use a negative bottom margin/absolute positioning to crop the "Chart by TradingView" logo */}
          <div className="absolute top-0 left-0 right-0 h-[calc(100%+42px)]">
            <AdvancedRealTimeChart 
               theme="dark" 
               symbol={`BINANCE:${(session?.pair || 'BTCUSDT').replace('/','')}`}
               interval="60" 
               timezone="Etc/UTC" 
               style="1" 
               locale="en" 
               enable_publishing={false} 
               allow_symbol_change={true}
               container_id="tv_chart_container"
               width="100%"
               height="100%"
               hide_side_toolbar={false}
               withdateranges={true}
               hide_top_toolbar={false}
            />
          </div>
        </div>
        
        {/* Right Sidebar - MT5 Style Punch Trade */}
        <div className="w-full md:w-[320px] border-t md:border-t-0 md:border-l border-white/10 bg-[#101216] flex flex-col shrink-0 z-10">
           
           <div className="p-4 border-b border-white/5 bg-[#101216]">
              <div className="flex justify-between items-center mb-4">
                 <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Execution</div>
                 <div className="text-xs text-gray-500">Live TV Chart Active</div>
              </div>

              {/* MT5 Style Execution Buttons */}
              <div className="grid grid-cols-3 gap-2 mb-4 bg-[#1E222D] p-2 rounded-xl border border-white/5 items-center">
                 <button 
                   onClick={() => executeTrade('Sell')}
                   className="col-span-1 py-3 bg-[#F23645] hover:bg-[#C22B37] text-white font-bold rounded-lg text-sm shadow-[0_0_15px_rgba(242,54,69,0.3)] transition-all flex flex-col items-center justify-center"
                 >
                   <span>SELL</span>
                 </button>
                 
                 <div className="col-span-1 text-center">
                   <input 
                     type="number" 
                     value={lotSize} 
                     onChange={(e) => setLotSize(e.target.value)}
                     className="w-full bg-transparent text-center text-lg font-bold text-white focus:outline-none"
                     step="0.01"
                   />
                   <div className="text-[10px] text-gray-500 font-bold uppercase">Lots</div>
                 </div>

                 <button 
                   onClick={() => executeTrade('Buy')}
                   className="col-span-1 py-3 bg-[#089981] hover:bg-[#067A67] text-white font-bold rounded-lg text-sm shadow-[0_0_15px_rgba(8,153,129,0.3)] transition-all flex flex-col items-center justify-center"
                 >
                   <span>BUY</span>
                 </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-2">
                 <div className="bg-[#1E222D] rounded-lg p-2 border border-white/5">
                   <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">SL Price</div>
                   <input 
                     type="number" 
                     placeholder="0.00"
                     value={slPrice}
                     onChange={(e) => setSlPrice(e.target.value)}
                     className="w-full bg-transparent text-[#F23645] font-mono text-sm focus:outline-none"
                   />
                 </div>
                 <div className="bg-[#1E222D] rounded-lg p-2 border border-white/5">
                   <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">TP Price</div>
                   <input 
                     type="number" 
                     placeholder="0.00"
                     value={tpPrice}
                     onChange={(e) => setTpPrice(e.target.value)}
                     className="w-full bg-transparent text-[#089981] font-mono text-sm focus:outline-none"
                   />
                 </div>
              </div>
           </div>

           <div className="flex-1 overflow-y-auto p-4 flex flex-col bg-[#0A0B0D]">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Session History</h3>
              <div className="space-y-2">
                {tradeHistory.length === 0 ? (
                  <p className="text-xs text-gray-600 text-center py-6">Use TV drawing tools to measure, then punch your trade.</p>
                ) : (
                  tradeHistory.map((trade, i) => (
                    <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-[#15181D] border border-white/5">
                      <div className={`font-bold text-[10px] uppercase px-1.5 py-0.5 rounded ${trade.type === 'Buy' ? 'bg-[#089981]/10 text-[#089981]' : 'bg-[#F23645]/10 text-[#F23645]'}`}>
                        {trade.type}
                      </div>
                      <div className={`font-mono font-bold text-xs ${trade.pnl >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                        {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
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
