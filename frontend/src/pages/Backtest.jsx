import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createChart } from 'lightweight-charts';
import { Button } from '@/components/ui/button';
import { Play, Square, StepForward, ChevronLeft, Loader2 } from 'lucide-react';

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
  const [tradeHistory, setTradeHistory] = useState([]);
  
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

    // 2. Fetch Market Data (Binance 1h limit 1000)
    const fetchBinance = async () => {
      setLoading(true);
      try {
        const symbol = foundSession.pair.replace('/', '');
        const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=1000`);
        const json = await response.json();
        const formattedData = json.map(d => ({
          time: d[0] / 1000, 
          open: parseFloat(d[1]),
          high: parseFloat(d[2]),
          low: parseFloat(d[3]),
          close: parseFloat(d[4]),
        }));
        
        setData(formattedData);
        setCurrentIndex(200); // start at index 200
      } catch(e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchBinance();
  }, [id]);

  // Update Overlay Function
  const updateOverlayPosition = useCallback(() => {
    if (!activeTrade || !chartInstance.current || !seriesInstance.current || data.length === 0) {
      setOverlayTop(null);
      return;
    }
    
    const tpY = seriesInstance.current.priceToCoordinate(activeTrade.tp);
    const slY = seriesInstance.current.priceToCoordinate(activeTrade.sl);
    const entryY = seriesInstance.current.priceToCoordinate(activeTrade.entry);
    
    // Convert time to X coordinate. It returns null if the time is outside the visible range, but we want it to scroll offscreen.
    // If it's null, we just hide the overlay for now to prevent errors, or we clamp it.
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
      grid: { vertLines: { color: '#2B3139' }, horzLines: { color: '#2B3139' } },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: { timeVisible: true, secondsVisible: false }
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#089981', downColor: '#F23645',
      borderVisible: false, wickUpColor: '#089981', wickDownColor: '#F23645',
    });

    chartInstance.current = chart;
    seriesInstance.current = candlestickSeries;
    
    // Initial data
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

  return (
    <div className="flex flex-col h-screen bg-[#131722] text-white overflow-hidden font-sans">
      
      {/* Top Session Header */}
      <div className="h-14 border-b border-white/10 bg-[#131722] flex items-center justify-between px-4 shrink-0 z-20 relative">
        <div className="flex items-center gap-4">
           <button onClick={() => navigate('/sessions')} className="p-1.5 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors">
             <ChevronLeft className="w-5 h-5" />
           </button>
           <div>
             <div className="text-sm font-bold">{session?.name || 'Loading Session...'}</div>
             <div className="text-[10px] text-gray-500">{session?.pair} • Dynamic Overlay Engine</div>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-1 bg-[#1E222D] p-1 rounded-lg">
             <Button size="sm" variant={isPlaying ? "destructive" : "secondary"} className="h-7 px-3 bg-[#2962FF] hover:bg-[#1E4CDB] border-none text-white text-xs rounded-md" onClick={() => setIsPlaying(!isPlaying)}>
               {isPlaying ? <Square className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
               {isPlaying ? "Pause" : "Play"}
             </Button>
             <Button size="sm" variant="secondary" className="h-7 px-3 bg-[#2B3139] hover:bg-[#363C4E] border-none text-white text-xs rounded-md" onClick={stepForward} disabled={isPlaying}>
               <StepForward className="w-3 h-3" />
             </Button>
           </div>
           <div className="text-sm font-mono bg-[#1E222D] px-4 py-1.5 rounded-lg border border-white/5 font-bold">
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
                 <div className="absolute z-10 pointer-events-none" style={{ left: overlayLeft, width: 200, top: 0, bottom: 0, opacity: 0.8 }}>
                    {/* Top Region */}
                    <div 
                      className="absolute left-0 right-0 border-b border-t border-r border-solid"
                      style={{ 
                        top: overlayTop.top, 
                        height: overlayTop.height, 
                        backgroundColor: overlayTop.color,
                        borderColor: overlayTop.border 
                      }}
                    >
                      <div className="absolute -left-12 top-0 bg-[#1E222D] text-[9px] px-1 rounded shadow" style={{ color: overlayTop.border }}>
                        {activeTrade.type === 'Buy' ? activeTrade.tp.toFixed(2) : activeTrade.sl.toFixed(2)}
                      </div>
                    </div>
                    
                    {/* Bottom Region */}
                    <div 
                      className="absolute left-0 right-0 border-b border-t border-r border-solid"
                      style={{ 
                        top: overlayBottom.top, 
                        height: overlayBottom.height, 
                        backgroundColor: overlayBottom.color,
                        borderColor: overlayBottom.border 
                      }}
                    >
                      <div className="absolute -left-12 bottom-0 bg-[#1E222D] text-[9px] px-1 rounded shadow" style={{ color: overlayBottom.border }}>
                        {activeTrade.type === 'Buy' ? activeTrade.sl.toFixed(2) : activeTrade.tp.toFixed(2)}
                      </div>
                    </div>

                    {/* Entry Line */}
                    <div 
                      className="absolute left-0 right-0 h-0 border-t border-gray-400"
                      style={{ top: overlayMiddle }}
                    >
                      <div className="absolute -left-12 -top-2 bg-[#1E222D] text-[9px] px-1 rounded text-white shadow">
                        {activeTrade.entry.toFixed(2)}
                      </div>
                    </div>
                 </div>
               )}
             </>
          )}
        </div>
        
        {/* Right Sidebar - MT5 Style Punch Trade */}
        <div className="w-full md:w-[320px] border-t md:border-t-0 md:border-l border-white/10 bg-[#101216] flex flex-col shrink-0 z-20">
           
           <div className="p-4 border-b border-white/5">
              <div className="flex justify-between items-center mb-4">
                 <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Execution</div>
                 <div className="text-xl font-mono font-bold text-white tracking-tighter">
                    {currentPrice.toFixed(2)}
                 </div>
              </div>

              {/* MT5 Style Execution Buttons */}
              <div className="grid grid-cols-3 gap-2 mb-4 bg-[#1E222D] p-2 rounded-xl border border-white/5 items-center">
                 <button 
                   onClick={() => executeTrade('Sell')}
                   disabled={activeTrade !== null}
                   className="col-span-1 py-3 bg-[#F23645] hover:bg-[#C22B37] text-white font-bold rounded-lg text-sm shadow-[0_0_15px_rgba(242,54,69,0.3)] disabled:opacity-50 transition-all flex flex-col items-center justify-center"
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
                   disabled={activeTrade !== null}
                   className="col-span-1 py-3 bg-[#089981] hover:bg-[#067A67] text-white font-bold rounded-lg text-sm shadow-[0_0_15px_rgba(8,153,129,0.3)] disabled:opacity-50 transition-all flex flex-col items-center justify-center"
                 >
                   <span>BUY</span>
                 </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-2">
                 <div className="bg-[#1E222D] rounded-lg p-2 border border-white/5">
                   <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">SL Price</div>
                   <input 
                     type="number" 
                     placeholder="Auto"
                     value={slPrice}
                     onChange={(e) => setSlPrice(e.target.value)}
                     className="w-full bg-transparent text-[#F23645] font-mono text-sm focus:outline-none"
                   />
                 </div>
                 <div className="bg-[#1E222D] rounded-lg p-2 border border-white/5">
                   <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">TP Price</div>
                   <input 
                     type="number" 
                     placeholder="Auto"
                     value={tpPrice}
                     onChange={(e) => setTpPrice(e.target.value)}
                     className="w-full bg-transparent text-[#089981] font-mono text-sm focus:outline-none"
                   />
                 </div>
              </div>
              
              {activeTrade && (
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-between">
                   <div>
                     <div className={`font-bold text-xs ${activeTrade.type === 'Buy' ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                       ACTIVE {activeTrade.type.toUpperCase()} RUNNING
                     </div>
                     <div className="text-[10px] text-blue-300 mt-1">Overlay drawn on chart</div>
                   </div>
                   <button onClick={() => checkTradeExit({ high: 0, low: 0 })} className="px-3 py-1.5 bg-[#1E222D] hover:bg-red-500/20 text-xs text-red-400 rounded-md transition-colors font-bold">
                     CLOSE
                   </button>
                </div>
              )}
           </div>

           <div className="flex-1 overflow-y-auto p-4 flex flex-col bg-[#0A0B0D]">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Session History</h3>
              <div className="space-y-2">
                {tradeHistory.length === 0 ? (
                  <p className="text-xs text-gray-600 text-center py-6">No trades yet.</p>
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
