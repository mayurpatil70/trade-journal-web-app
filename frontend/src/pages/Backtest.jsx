import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createChart } from 'lightweight-charts';
import { Button } from '@/components/ui/button';
import { Play, Square, StepForward, ChevronLeft, Loader2, Search, X } from 'lucide-react';

export default function Backtest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const chartContainerRef = useRef(null);
  const chartInstance = useRef(null);
  const seriesInstance = useRef(null);
  
  // Data state
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0); 
  const [isPlaying, setIsPlaying] = useState(false);

  // Session State
  const [session, setSession] = useState(null);
  const [activeSymbol, setActiveSymbol] = useState('');
  const [tradeHistory, setTradeHistory] = useState([]);
  
  // Symbol Search Modal
  const [showSearch, setShowSearch] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const popularSymbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'XAUUSD', 'EURUSD', 'GBPUSD'];
  
  // MT5 Panel State
  const [lotSize, setLotSize] = useState('1.00');
  const [slPrice, setSlPrice] = useState('');
  const [tpPrice, setTpPrice] = useState('');
  
  // Active Trade State
  const [activeTrade, setActiveTrade] = useState(null); 
  const [livePnl, setLivePnl] = useState(0);
  
  // Price Line References for Chart
  const priceLinesRef = useRef({ entry: null, sl: null, tp: null });

  useEffect(() => {
    // 1. Fetch Session
    const saved = localStorage.getItem('backtest_sessions');
    let foundSession = { id: 'demo', name: 'Demo Session', pair: 'BTCUSDT', balance: 10000 };
    if (saved) {
      const parsed = JSON.parse(saved);
      const s = parsed.find(x => x.id === id);
      if (s) foundSession = s;
    }
    setSession(foundSession);
    setActiveSymbol(foundSession.pair.replace('/', ''));
  }, [id]);

  useEffect(() => {
    if (!activeSymbol) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        // If Crypto, use Binance Free API
        if (activeSymbol.includes('USDT')) {
          const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${activeSymbol}&interval=1h&limit=1000`);
          if (!response.ok) throw new Error("Symbol not found");
          const json = await response.json();
          const formattedData = json.map(d => ({
            time: d[0] / 1000, 
            open: parseFloat(d[1]),
            high: parseFloat(d[2]),
            low: parseFloat(d[3]),
            close: parseFloat(d[4]),
          }));
          setData(formattedData);
        } else {
          // Mock data for Forex/Gold since free public APIs block CORS for these assets
          const mockData = [];
          let currentPrice = activeSymbol === 'XAUUSD' ? 2400 : 1.1000;
          let time = Math.floor(Date.now() / 1000) - (1000 * 3600);
          for (let i = 0; i < 1000; i++) {
            const volatility = activeSymbol === 'XAUUSD' ? 5 : 0.002;
            const open = currentPrice;
            const high = open + (Math.random() * volatility);
            const low = open - (Math.random() * volatility);
            const close = low + (Math.random() * (high - low));
            mockData.push({ time, open, high, low, close });
            currentPrice = close;
            time += 3600;
          }
          setData(mockData);
        }

        setCurrentIndex(200); 
        
        // Reset Trade & Price Lines on Symbol Switch
        setActiveTrade(null);
        setLivePnl(0);
        if (seriesInstance.current) {
          if (priceLinesRef.current.entry) seriesInstance.current.removePriceLine(priceLinesRef.current.entry);
          if (priceLinesRef.current.sl) seriesInstance.current.removePriceLine(priceLinesRef.current.sl);
          if (priceLinesRef.current.tp) seriesInstance.current.removePriceLine(priceLinesRef.current.tp);
          priceLinesRef.current = { entry: null, sl: null, tp: null };
        }

      } catch(e) {
        console.error(e);
        alert("Error fetching data for symbol.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeSymbol]);

  // Init Chart
  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: 'solid', color: '#131722' }, textColor: '#d1d4dc' },
      grid: { vertLines: { color: '#2B3139', style: 1 }, horzLines: { color: '#2B3139', style: 1 } },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: { timeVisible: true, secondsVisible: false, borderColor: '#2B3139' },
      rightPriceScale: { borderColor: '#2B3139' }
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#089981', downColor: '#F23645',
      borderVisible: false, wickUpColor: '#089981', wickDownColor: '#F23645',
    });

    chartInstance.current = chart;
    seriesInstance.current = candlestickSeries;
    
    const visibleData = data.slice(0, currentIndex);
    candlestickSeries.setData(visibleData);
    
    // Re-draw price lines if trade was active (e.g. component re-mounted, rare but safe)
    if (activeTrade) {
      drawPriceLines(activeTrade.entry, activeTrade.sl, activeTrade.tp);
    }
    
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth, height: chartContainerRef.current.clientHeight });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartInstance.current = null;
      seriesInstance.current = null;
    };
  }, [data]); 

  // Playback & Active Trade check
  useEffect(() => {
    if (chartInstance.current && data.length > 0) {
      const visibleData = data.slice(0, currentIndex);
      seriesInstance.current.setData(visibleData);
      
      const currentCandle = visibleData[visibleData.length - 1];
      
      if (activeTrade) {
         checkTradeExit(currentCandle);
      }

      if (isPlaying) {
        const timer = setTimeout(stepForward, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [currentIndex, isPlaying, activeTrade]);

  const stepForward = () => {
    if (currentIndex < data.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsPlaying(false);
    }
  };

  const currentPrice = data.length > 0 && currentIndex > 0 ? data[currentIndex - 1].close : 0;

  const drawPriceLines = (entry, sl, tp) => {
    if (!seriesInstance.current) return;
    
    priceLinesRef.current.entry = seriesInstance.current.createPriceLine({
        price: entry,
        color: '#2962FF',
        lineWidth: 2,
        lineStyle: 0,
        title: 'ENTRY',
        axisLabelVisible: true,
    });
    priceLinesRef.current.sl = seriesInstance.current.createPriceLine({
        price: sl,
        color: '#F23645',
        lineWidth: 2,
        lineStyle: 2,
        title: 'SL',
        axisLabelVisible: true,
    });
    priceLinesRef.current.tp = seriesInstance.current.createPriceLine({
        price: tp,
        color: '#089981',
        lineWidth: 2,
        lineStyle: 2,
        title: 'TP',
        axisLabelVisible: true,
    });
  };

  const removePriceLines = () => {
    if (!seriesInstance.current) return;
    if (priceLinesRef.current.entry) seriesInstance.current.removePriceLine(priceLinesRef.current.entry);
    if (priceLinesRef.current.sl) seriesInstance.current.removePriceLine(priceLinesRef.current.sl);
    if (priceLinesRef.current.tp) seriesInstance.current.removePriceLine(priceLinesRef.current.tp);
    priceLinesRef.current = { entry: null, sl: null, tp: null };
  };

  const executeTrade = (type) => {
    if (activeTrade || currentPrice === 0) return; 
    
    let stopLoss = parseFloat(slPrice);
    let takeProfit = parseFloat(tpPrice);
    const lots = parseFloat(lotSize) || 1;
    
    if (!stopLoss || !takeProfit) {
      alert("Please enter exact SL and TP prices to execute the trade.");
      return;
    }
    
    const entryTime = data[currentIndex - 1].time;

    setActiveTrade({
      type,
      entry: currentPrice,
      sl: stopLoss,
      tp: takeProfit,
      lots,
      entryTime
    });
    
    setLivePnl(0);
    drawPriceLines(currentPrice, stopLoss, takeProfit);
  };
  
  const checkTradeExit = (candle) => {
    let closed = false;
    let finalPnl = 0;
    const multiplier = activeTrade.lots * 1000;

    // Calculate LIVE PNL based on candle close
    const currentLivePnl = activeTrade.type === 'Buy' 
      ? (candle.close - activeTrade.entry) * multiplier 
      : (activeTrade.entry - candle.close) * multiplier;
      
    setLivePnl(currentLivePnl);

    // Check hit conditions based on wicks (high/low)
    if (activeTrade.type === 'Buy') {
      if (candle.low <= activeTrade.sl) {
        closed = true;
        finalPnl = - (activeTrade.entry - activeTrade.sl) * multiplier;
      } else if (candle.high >= activeTrade.tp) {
        closed = true;
        finalPnl = (activeTrade.tp - activeTrade.entry) * multiplier;
      }
    } else {
      if (candle.high >= activeTrade.sl) {
        closed = true;
        finalPnl = - (activeTrade.sl - activeTrade.entry) * multiplier;
      } else if (candle.low <= activeTrade.tp) {
        closed = true;
        finalPnl = (activeTrade.entry - activeTrade.tp) * multiplier;
      }
    }

    if (closed) {
      setSession(prev => {
        const newBal = prev.balance + finalPnl;
        return { ...prev, balance: newBal };
      });
      setTradeHistory(prev => [{ ...activeTrade, pnl: finalPnl }, ...prev]);
      setActiveTrade(null);
      setLivePnl(0);
      removePriceLines();
    }
  };

  const saveSession = () => {
    const saved = JSON.parse(localStorage.getItem('backtest_sessions') || '[]');
    const updated = saved.map(s => s.id === id ? { ...session } : s);
    localStorage.setItem('backtest_sessions', JSON.stringify(updated));
    alert("Session saved successfully!");
  };

  const changeSymbol = (sym) => {
    setActiveSymbol(sym);
    setShowSearch(false);
    setSearchInput('');
  };

  return (
    <div className="flex flex-col h-screen bg-[#131722] text-white overflow-hidden font-sans relative">
      
      {/* Symbol Search Modal Overlay */}
      {showSearch && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24">
           <div className="bg-[#1E222D] w-full max-w-md rounded-xl shadow-2xl border border-white/10 overflow-hidden flex flex-col">
             <div className="flex items-center p-3 border-b border-white/10">
                <Search className="w-5 h-5 text-gray-400 mr-2" />
                <input 
                  autoFocus
                  type="text" 
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                  placeholder="Symbol Search (e.g. XAUUSD)" 
                  className="flex-1 bg-transparent text-lg text-white outline-none placeholder:text-gray-500 font-bold"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchInput) changeSymbol(searchInput);
                  }}
                />
                <button onClick={() => setShowSearch(false)} className="p-1 hover:bg-white/10 rounded-md text-gray-400">
                  <X className="w-5 h-5" />
                </button>
             </div>
             <div className="flex p-2 gap-2 border-b border-white/5 bg-[#131722]/50">
               <button className="px-3 py-1 bg-white/10 text-xs rounded-full font-bold">All Assets</button>
             </div>
             <div className="p-2 space-y-1">
               {popularSymbols.filter(s => s.includes(searchInput)).map(sym => (
                 <button 
                   key={sym} 
                   onClick={() => changeSymbol(sym)}
                   className="w-full text-left px-4 py-2 hover:bg-white/5 rounded-lg flex items-center justify-between"
                 >
                   <span className="font-bold">{sym}</span>
                   <span className="text-xs text-gray-500">{sym.includes('USDT') ? 'Binance' : 'Forex/Metals API'}</span>
                 </button>
               ))}
             </div>
           </div>
        </div>
      )}

      {/* Top Session Header */}
      <div className="h-14 border-b border-white/10 bg-[#131722] flex items-center justify-between px-4 shrink-0 z-20 relative">
        <div className="flex items-center gap-4">
           <button onClick={() => navigate('/sessions')} className="p-1.5 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors">
             <ChevronLeft className="w-5 h-5" />
           </button>
           
           {/* Asset Switcher Button */}
           <button 
             onClick={() => setShowSearch(true)} 
             className="flex items-center gap-2 hover:bg-white/5 px-2 py-1 rounded-md transition-colors"
           >
             <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center font-bold text-[10px]">
               {activeSymbol.substring(0, 1)}
             </div>
             <div className="text-left">
               <div className="text-lg font-bold leading-tight">{activeSymbol}</div>
               <div className="text-[10px] text-gray-500 leading-tight">Data Feed • Pro Engine</div>
             </div>
           </button>
        </div>

        <div className="flex items-center gap-3">
           <div className="flex items-center gap-1 bg-[#1E222D] p-1 rounded-lg">
             <Button size="sm" variant={isPlaying ? "destructive" : "secondary"} className="h-7 px-4 bg-[#2962FF] hover:bg-[#1E4CDB] border-none text-white text-xs rounded-md shadow-lg" onClick={() => setIsPlaying(!isPlaying)}>
               {isPlaying ? <Square className="w-3 h-3 mr-2" /> : <Play className="w-3 h-3 mr-2" />}
               {isPlaying ? "Pause" : "Play"}
             </Button>
             <Button size="sm" variant="secondary" className="h-7 px-3 bg-[#2B3139] hover:bg-[#363C4E] border-none text-white text-xs rounded-md" onClick={stepForward} disabled={isPlaying}>
               <StepForward className="w-4 h-4" />
             </Button>
           </div>
           <div className="text-sm font-mono bg-[#1E222D] px-4 py-1.5 rounded-lg border border-white/5 font-bold shadow-inner">
             Bal: <span className={(session?.balance || 0) >= 10000 ? "text-emerald-400" : "text-red-400"}>${(session?.balance || 0).toFixed(2)}</span>
           </div>
           <Button size="sm" variant="secondary" className="h-7 px-3 bg-[#089981] hover:bg-[#067A67] border-none text-white text-xs rounded-md shadow-lg font-bold" onClick={saveSession}>
             Save Session
           </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
        
        {/* Center Chart */}
        <div className="flex-1 relative flex flex-col min-h-[40vh] md:min-h-0 bg-[#131722] overflow-hidden">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[#131722] z-10">
              <Loader2 className="w-8 h-8 animate-spin text-[#2962FF]" />
            </div>
          ) : (
            <div ref={chartContainerRef} className="absolute inset-0 w-full h-full" />
          )}
        </div>
        
        {/* Right Sidebar - Improved UI */}
        <div className="w-full md:w-[340px] border-t md:border-t-0 md:border-l border-[#2B3139] bg-[#1E222D] flex flex-col shrink-0 z-20 shadow-2xl">
           
           <div className="p-5 border-b border-[#2B3139] bg-[#131722]/50">
              <div className="flex justify-between items-center mb-5">
                 <div className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                   Order Panel
                 </div>
                 <div className="text-2xl font-mono font-bold text-white tracking-tighter">
                    {currentPrice.toFixed(activeSymbol === 'XAUUSD' ? 2 : 5)}
                 </div>
              </div>

              {/* MT5 Style Execution Buttons */}
              <div className="flex gap-2 mb-4 items-stretch">
                 <button 
                   onClick={() => executeTrade('Sell')}
                   disabled={activeTrade !== null}
                   className="flex-1 py-4 bg-[#F23645] hover:bg-[#D92B38] text-white font-bold rounded-lg text-lg shadow-[0_4px_14px_0_rgba(242,54,69,0.39)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                 >
                   SELL
                 </button>
                 
                 <div className="w-24 bg-[#131722] rounded-lg border border-[#2B3139] flex flex-col items-center justify-center p-1">
                   <input 
                     type="number" 
                     value={lotSize} 
                     onChange={(e) => setLotSize(e.target.value)}
                     className="w-full bg-transparent text-center text-lg font-bold text-white focus:outline-none"
                     step="0.01"
                   />
                   <div className="text-[9px] text-gray-500 font-bold uppercase">Lots</div>
                 </div>

                 <button 
                   onClick={() => executeTrade('Buy')}
                   disabled={activeTrade !== null}
                   className="flex-1 py-4 bg-[#089981] hover:bg-[#067A67] text-white font-bold rounded-lg text-lg shadow-[0_4px_14px_0_rgba(8,153,129,0.39)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                 >
                   BUY
                 </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-2">
                 <div className="bg-[#131722] rounded-lg p-3 border border-[#2B3139] hover:border-gray-600 transition-colors">
                   <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Take Profit</div>
                   <input 
                     type="number" 
                     value={tpPrice}
                     onChange={(e) => setTpPrice(e.target.value)}
                     className="w-full bg-transparent text-[#089981] font-mono text-base focus:outline-none font-bold placeholder:text-gray-700"
                   />
                 </div>
                 <div className="bg-[#131722] rounded-lg p-3 border border-[#2B3139] hover:border-gray-600 transition-colors">
                   <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Stop Loss</div>
                   <input 
                     type="number" 
                     value={slPrice}
                     onChange={(e) => setSlPrice(e.target.value)}
                     className="w-full bg-transparent text-[#F23645] font-mono text-base focus:outline-none font-bold placeholder:text-gray-700"
                   />
                 </div>
              </div>
              
              {activeTrade && (
                <div className="mt-4 p-4 bg-[#2962FF]/10 border border-[#2962FF]/30 rounded-lg flex flex-col gap-3">
                   <div className="flex items-center justify-between border-b border-[#2962FF]/20 pb-3">
                     <div>
                       <div className={`font-bold text-sm ${activeTrade.type === 'Buy' ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                         {activeTrade.type.toUpperCase()} TRADE OPEN
                       </div>
                       <div className="text-[10px] text-blue-300 mt-1 flex items-center gap-1">
                         <Play className="w-3 h-3" /> Live Tracking Active
                       </div>
                     </div>
                     <button onClick={() => checkTradeExit({ high: 0, low: 0, close: activeTrade.entry })} className="px-4 py-2 bg-[#131722] hover:bg-red-500/20 text-xs text-red-400 rounded-md transition-colors font-bold border border-red-500/20 hover:border-red-500/50">
                       CLOSE
                     </button>
                   </div>
                   
                   <div className="flex justify-between items-center">
                     <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Running PNL</span>
                     <span className={`text-xl font-mono font-bold ${livePnl >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                        {livePnl >= 0 ? '+' : ''}{livePnl.toFixed(2)}
                     </span>
                   </div>
                </div>
              )}
           </div>

           <div className="flex-1 overflow-y-auto p-5 flex flex-col bg-[#131722]">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Trade Journal</h3>
              <div className="space-y-3">
                {tradeHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 opacity-30">
                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-500 mb-3"></div>
                    <p className="text-xs text-gray-500 font-bold">No positions executed yet.</p>
                  </div>
                ) : (
                  tradeHistory.map((trade, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-[#1E222D] border border-white/5 hover:border-white/10 transition-colors">
                      <div>
                        <div className={`font-bold text-xs uppercase px-2 py-0.5 rounded-sm inline-block mb-1 ${trade.type === 'Buy' ? 'bg-[#089981]/20 text-[#089981]' : 'bg-[#F23645]/20 text-[#F23645]'}`}>
                          {trade.type} {trade.lots}
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          Entry: {trade.entry.toFixed(5)}
                        </div>
                      </div>
                      <div className={`font-mono font-bold text-sm ${trade.pnl >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}`}>
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
