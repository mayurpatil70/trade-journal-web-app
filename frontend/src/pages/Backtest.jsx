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
  const popularSymbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT'];
  
  // MT5 Panel State
  const [lotSize, setLotSize] = useState('1.00');
  const [slPrice, setSlPrice] = useState('');
  const [tpPrice, setTpPrice] = useState('');
  
  // Active Trade (Long/Short Overlay)
  const [activeTrade, setActiveTrade] = useState(null); 
  
  // Overlay Coordinates State
  const [overlayTop, setOverlayTop] = useState(null);
  const [overlayBottom, setOverlayBottom] = useState(null);
  const [overlayMiddle, setOverlayMiddle] = useState(null);
  const [overlayLeft, setOverlayLeft] = useState(null);

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
    
    const fetchBinance = async () => {
      setLoading(true);
      try {
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
        setCurrentIndex(200); 
        setActiveTrade(null); // Reset trades on symbol switch
      } catch(e) {
        console.error(e);
        // Fallback if symbol is invalid
        if (data.length === 0) {
           alert("Symbol not found on Binance Data Source (Use formatting like BTCUSDT)");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchBinance();
  }, [activeSymbol]);

  // Update Overlay Function
  const updateOverlayPosition = useCallback(() => {
    if (!activeTrade || !chartInstance.current || !seriesInstance.current || data.length === 0) {
      setOverlayTop(null);
      return;
    }
    
    const tpY = seriesInstance.current.priceToCoordinate(activeTrade.tp);
    const slY = seriesInstance.current.priceToCoordinate(activeTrade.sl);
    const entryY = seriesInstance.current.priceToCoordinate(activeTrade.entry);
    
    let startX = chartInstance.current.timeScale().timeToCoordinate(activeTrade.entryTime);
    
    if (tpY !== null && slY !== null && entryY !== null && startX !== null) {
      let topRegion, bottomRegion;
      if (activeTrade.type === 'Buy') {
         topRegion = { top: tpY, height: entryY - tpY, color: 'rgba(8, 153, 129, 0.2)', border: '#089981' };
         bottomRegion = { top: entryY, height: slY - entryY, color: 'rgba(242, 54, 69, 0.2)', border: '#F23645' };
      } else {
         topRegion = { top: slY, height: entryY - slY, color: 'rgba(242, 54, 69, 0.2)', border: '#F23645' };
         bottomRegion = { top: entryY, height: tpY - entryY, color: 'rgba(8, 153, 129, 0.2)', border: '#089981' };
      }
      
      setOverlayTop(topRegion);
      setOverlayBottom(bottomRegion);
      setOverlayMiddle(entryY);
      setOverlayLeft(startX);
    } else {
      setOverlayTop(null);
    }
  }, [activeTrade, data]);

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
    
    chart.subscribeCrosshairMove(updateOverlayPosition);
    chart.timeScale().subscribeVisibleTimeRangeChange(updateOverlayPosition);
    
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth, height: chartContainerRef.current.clientHeight });
        updateOverlayPosition();
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
         updateOverlayPosition(); 
      }

      if (isPlaying) {
        const timer = setTimeout(stepForward, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [currentIndex, isPlaying, activeTrade, updateOverlayPosition]);

  const stepForward = () => {
    if (currentIndex < data.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsPlaying(false);
    }
  };

  const currentPrice = data.length > 0 && currentIndex > 0 ? data[currentIndex - 1].close : 0;

  const executeTrade = (type) => {
    if (activeTrade || currentPrice === 0) return; 
    
    let stopLoss = parseFloat(slPrice);
    let takeProfit = parseFloat(tpPrice);
    const lots = parseFloat(lotSize) || 1;
    
    const dist = currentPrice * 0.01;
    if (!stopLoss) stopLoss = type === 'Buy' ? currentPrice - dist : currentPrice + dist;
    if (!takeProfit) takeProfit = type === 'Buy' ? currentPrice + dist : currentPrice - dist;
    
    const entryTime = data[currentIndex - 1].time;

    setActiveTrade({
      type,
      entry: currentPrice,
      sl: stopLoss,
      tp: takeProfit,
      lots,
      entryTime
    });
    
    setSlPrice(stopLoss.toFixed(2));
    setTpPrice(takeProfit.toFixed(2));
  };
  
  const checkTradeExit = (candle) => {
    let closed = false;
    let pnl = 0;
    const multiplier = activeTrade.lots * 1000;

    if (activeTrade.type === 'Buy') {
      if (candle.low <= activeTrade.sl) {
        closed = true;
        pnl = - (activeTrade.entry - activeTrade.sl) * multiplier;
      } else if (candle.high >= activeTrade.tp) {
        closed = true;
        pnl = (activeTrade.tp - activeTrade.entry) * multiplier;
      }
    } else {
      if (candle.high >= activeTrade.sl) {
        closed = true;
        pnl = - (activeTrade.sl - activeTrade.entry) * multiplier;
      } else if (candle.low <= activeTrade.tp) {
        closed = true;
        pnl = (activeTrade.entry - activeTrade.tp) * multiplier;
      }
    }

    if (closed) {
      setSession(prev => {
        const newBal = prev.balance + pnl;
        const saved = JSON.parse(localStorage.getItem('backtest_sessions') || '[]');
        const updated = saved.map(s => s.id === id ? { ...s, balance: newBal } : s);
        localStorage.setItem('backtest_sessions', JSON.stringify(updated));
        return { ...prev, balance: newBal };
      });
      setTradeHistory(prev => [{ ...activeTrade, pnl }, ...prev]);
      setActiveTrade(null);
      setOverlayTop(null);
    }
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
                  placeholder="Symbol Search (e.g. ETHUSDT)" 
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
               <button className="px-3 py-1 bg-white/10 text-xs rounded-full font-bold">Crypto</button>
             </div>
             <div className="p-2 space-y-1">
               {popularSymbols.filter(s => s.includes(searchInput)).map(sym => (
                 <button 
                   key={sym} 
                   onClick={() => changeSymbol(sym)}
                   className="w-full text-left px-4 py-2 hover:bg-white/5 rounded-lg flex items-center justify-between"
                 >
                   <span className="font-bold">{sym}</span>
                   <span className="text-xs text-gray-500">Binance</span>
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
               <div className="text-[10px] text-gray-500 leading-tight">Binance • Custom Engine</div>
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
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
        
        {/* Center Chart with Custom HTML Overlay */}
        <div className="flex-1 relative flex flex-col min-h-[40vh] md:min-h-0 bg-[#131722] overflow-hidden">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[#131722] z-10">
              <Loader2 className="w-8 h-8 animate-spin text-[#2962FF]" />
            </div>
          ) : (
             <>
               <div ref={chartContainerRef} className="absolute inset-0 w-full h-full" />
               
               {/* CUSTOM LONG/SHORT POSITION HTML OVERLAY */}
               {overlayTop && activeTrade && overlayLeft !== null && (
                 <div className="absolute z-10 pointer-events-none" style={{ left: overlayLeft, width: 200, top: 0, bottom: 0, opacity: 0.85 }}>
                    {/* Top Region */}
                    <div 
                      className="absolute left-0 right-0 border-b border-t border-r border-solid shadow-[0_0_20px_rgba(0,0,0,0.2)] backdrop-blur-[1px]"
                      style={{ 
                        top: overlayTop.top, 
                        height: overlayTop.height, 
                        backgroundColor: overlayTop.color,
                        borderColor: overlayTop.border 
                      }}
                    >
                      <div className="absolute -left-14 top-0 bg-[#1E222D] text-[10px] px-1.5 py-0.5 rounded shadow-lg font-mono font-bold" style={{ color: overlayTop.border }}>
                        {activeTrade.type === 'Buy' ? activeTrade.tp.toFixed(2) : activeTrade.sl.toFixed(2)}
                      </div>
                    </div>
                    
                    {/* Bottom Region */}
                    <div 
                      className="absolute left-0 right-0 border-b border-t border-r border-solid shadow-[0_0_20px_rgba(0,0,0,0.2)] backdrop-blur-[1px]"
                      style={{ 
                        top: overlayBottom.top, 
                        height: overlayBottom.height, 
                        backgroundColor: overlayBottom.color,
                        borderColor: overlayBottom.border 
                      }}
                    >
                      <div className="absolute -left-14 bottom-0 bg-[#1E222D] text-[10px] px-1.5 py-0.5 rounded shadow-lg font-mono font-bold" style={{ color: overlayBottom.border }}>
                        {activeTrade.type === 'Buy' ? activeTrade.sl.toFixed(2) : activeTrade.tp.toFixed(2)}
                      </div>
                    </div>

                    {/* Entry Line */}
                    <div 
                      className="absolute left-0 right-0 h-0 border-t-2 border-gray-400"
                      style={{ top: overlayMiddle }}
                    >
                      <div className="absolute -left-14 -top-2.5 bg-[#1E222D] text-[10px] px-1.5 py-0.5 rounded text-white shadow-lg font-mono font-bold border border-white/10">
                        {activeTrade.entry.toFixed(2)}
                      </div>
                    </div>
                 </div>
               )}
             </>
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
                    {currentPrice.toFixed(2)}
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
                     placeholder="Auto"
                     value={tpPrice}
                     onChange={(e) => setTpPrice(e.target.value)}
                     className="w-full bg-transparent text-[#089981] font-mono text-base focus:outline-none font-bold placeholder:text-gray-700"
                   />
                 </div>
                 <div className="bg-[#131722] rounded-lg p-3 border border-[#2B3139] hover:border-gray-600 transition-colors">
                   <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Stop Loss</div>
                   <input 
                     type="number" 
                     placeholder="Auto"
                     value={slPrice}
                     onChange={(e) => setSlPrice(e.target.value)}
                     className="w-full bg-transparent text-[#F23645] font-mono text-base focus:outline-none font-bold placeholder:text-gray-700"
                   />
                 </div>
              </div>
              
              {activeTrade && (
                <div className="mt-4 p-4 bg-[#2962FF]/10 border border-[#2962FF]/30 rounded-lg flex items-center justify-between">
                   <div>
                     <div className={`font-bold text-sm ${activeTrade.type === 'Buy' ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                       {activeTrade.type.toUpperCase()} TRADE OPEN
                     </div>
                     <div className="text-[10px] text-blue-300 mt-1 flex items-center gap-1">
                       <Play className="w-3 h-3" /> Hit Play to simulate
                     </div>
                   </div>
                   <button onClick={() => checkTradeExit({ high: 0, low: 0 })} className="px-4 py-2 bg-[#131722] hover:bg-red-500/20 text-xs text-red-400 rounded-md transition-colors font-bold border border-red-500/20 hover:border-red-500/50">
                     CLOSE
                   </button>
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
                          Entry: {trade.entry.toFixed(2)}
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
