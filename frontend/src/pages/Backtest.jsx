import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { init, dispose } from 'klinecharts';
import { Button } from '@/components/ui/button';
import { 
  Play, StepForward, Square, Loader2, 
  MousePointer2, Minus, MoveDiagonal, 
  Layers, Crosshair, Navigation, SplitSquareHorizontal, CircleDot, ChevronLeft
} from 'lucide-react';

const DRAWING_TOOLS = [
  { id: 'pointer', icon: MousePointer2, name: 'Cursor' },
  { id: 'horizontalStraightLine', icon: Minus, name: 'Horizontal Line' },
  { id: 'rayLine', icon: MoveDiagonal, name: 'Trend Line' },
  { id: 'arrowLine', icon: Navigation, name: 'Arrow' },
  { id: 'priceLine', icon: Crosshair, name: 'Price Level' },
  { id: 'priceChannelLine', icon: SplitSquareHorizontal, name: 'Parallel Channel' },
  { id: 'fibonacciLine', icon: Layers, name: 'Fibonacci Retracement' },
  { id: 'fibonacciCircle', icon: CircleDot, name: 'Fibonacci Circle' }
];

export default function Backtest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTool, setActiveTool] = useState('pointer');
  const [currentIndex, setCurrentIndex] = useState(0); 
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Session State
  const [session, setSession] = useState(null);
  const [openTrade, setOpenTrade] = useState(null);
  const [tradeHistory, setTradeHistory] = useState([]);

  // MT5 Panel State
  const [lotSize, setLotSize] = useState('1.00');
  const [slPrice, setSlPrice] = useState('');
  const [tpPrice, setTpPrice] = useState('');

  // 1. Fetch Session Data & Market Data
  useEffect(() => {
    const fetchSession = async () => {
      setLoading(true);
      // Fetch session from local storage or API
      const saved = localStorage.getItem('backtest_sessions');
      let foundSession = { name: 'Demo Session', pair: 'BTCUSDT', balance: 10000 };
      if (saved) {
        const parsed = JSON.parse(saved);
        const s = parsed.find(x => x.id === id);
        if (s) foundSession = s;
      }
      setSession(foundSession);

      // Fetch binance historical data (1 year of 1h candles)
      try {
        const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${foundSession.pair.replace('/','')}&interval=1h&limit=1000`);
        const json = await response.json();
        
        const formattedData = json.map(d => ({
          timestamp: d[0],
          open: parseFloat(d[1]),
          high: parseFloat(d[2]),
          low: parseFloat(d[3]),
          close: parseFloat(d[4]),
          volume: parseFloat(d[5]),
        }));
        
        setData(formattedData);
        setCurrentIndex(200); // Start showing first 200 candles
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [id]);

  // 2. Initialize Klinecharts (v9)
  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    // Capture the current ref value for safe cleanup
    const container = chartContainerRef.current;

    const chart = init(container, {
      grid: {
        horizontal: { color: '#1B2027', size: 1, style: 'dashed' },
        vertical: { color: '#1B2027', size: 1, style: 'dashed' }
      },
      candle: {
        type: 'candle_solid',
        bar: {
          upColor: '#089981',
          downColor: '#F23645',
          noChangeColor: '#888888',
          upBorderColor: '#089981',
          downBorderColor: '#F23645',
          noChangeBorderColor: '#888888',
          upWickColor: '#089981',
          downWickColor: '#F23645',
          noChangeWickColor: '#888888'
        }
      },
      yAxis: { tickText: { color: '#787B86' }, axisLine: { color: '#2b2b43' } },
      xAxis: { tickText: { color: '#787B86' }, axisLine: { color: '#2b2b43' } }
    });

    chart.setStyles({ pane: { background: '#131722' } });
    chartRef.current = chart;
    
    const visibleData = data.slice(0, currentIndex);
    chart.applyNewData(visibleData);

    return () => {
      // FIX: Check if container still exists before disposing to prevent crash on mobile
      if (container) {
        dispose(container);
      }
      chartRef.current = null;
    };
  }, [data]); // Only re-init when full data changes
  
  // 3. Playback Engine
  useEffect(() => {
    if (chartRef.current && data.length > 0) {
      const visibleData = data.slice(0, currentIndex);
      chartRef.current.applyNewData(visibleData);
      
      const currentCandle = visibleData[visibleData.length - 1];
      if (openTrade) checkTradeExit(currentCandle);
      
      if (isPlaying) {
        const timer = setTimeout(stepForward, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [currentIndex, isPlaying]);

  const stepForward = () => {
    if (currentIndex < data.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsPlaying(false);
    }
  };

  // 4. Execution Logic
  const currentPrice = data.length > 0 && currentIndex > 0 ? data[currentIndex - 1].close : 0;

  const executeTrade = (type) => {
    if (openTrade || currentPrice === 0) return; 
    
    // Default SL/TP if left blank
    const slDist = currentPrice * 0.01;
    const tpDist = currentPrice * 0.02;
    
    const finalSl = slPrice ? parseFloat(slPrice) : (type === 'Buy' ? currentPrice - slDist : currentPrice + slDist);
    const finalTp = tpPrice ? parseFloat(tpPrice) : (type === 'Buy' ? currentPrice + tpDist : currentPrice - tpDist);
    
    const trade = {
      type,
      entryPrice: currentPrice,
      sl: finalSl,
      tp: finalTp,
      lots: parseFloat(lotSize) || 1
    };
    
    setOpenTrade(trade);
    
    // Draw MT5 style visual lines on chart
    if (chartRef.current) {
       chartRef.current.createOverlay({
         name: 'priceLine', extendData: `${type} ${trade.lots}`, points: [{ value: currentPrice }],
         styles: { line: { color: type === 'Buy' ? '#089981' : '#F23645' } }
       });
       chartRef.current.createOverlay({
         name: 'priceLine', extendData: 'SL', points: [{ value: finalSl }],
         styles: { line: { color: '#F23645' } }
       });
       chartRef.current.createOverlay({
         name: 'priceLine', extendData: 'TP', points: [{ value: finalTp }],
         styles: { line: { color: '#089981' } }
       });
    }
  };
  
  const checkTradeExit = (candle) => {
    let closed = false;
    let pnl = 0;
    
    // Very simplified multiplier for display
    const multiplier = openTrade.lots * 1000;

    if (openTrade.type === 'Buy') {
      if (candle.low <= openTrade.sl) {
        closed = true;
        pnl = - (openTrade.entryPrice - openTrade.sl) * multiplier;
      } else if (candle.high >= openTrade.tp) {
        closed = true;
        pnl = (openTrade.tp - openTrade.entryPrice) * multiplier;
      }
    } else {
      if (candle.high >= openTrade.sl) {
        closed = true;
        pnl = - (openTrade.sl - openTrade.entryPrice) * multiplier;
      } else if (candle.low <= openTrade.tp) {
        closed = true;
        pnl = (openTrade.entryPrice - openTrade.tp) * multiplier;
      }
    }

    if (closed) {
      setSession(prev => {
        const newBal = prev.balance + pnl;
        // Update local storage
        const saved = JSON.parse(localStorage.getItem('backtest_sessions') || '[]');
        const updated = saved.map(s => s.id === id ? { ...s, balance: newBal } : s);
        localStorage.setItem('backtest_sessions', JSON.stringify(updated));
        return { ...prev, balance: newBal };
      });
      setTradeHistory(prev => [{ ...openTrade, pnl }, ...prev]);
      setOpenTrade(null);
      if (chartRef.current) chartRef.current.removeOverlay();
    }
  };

  const handleToolClick = (toolId) => {
    setActiveTool(toolId);
    if (!chartRef.current) return;
    if (toolId === 'pointer') return;
    
    chartRef.current.createOverlay({
      name: toolId,
      onDrawEnd: function () { setActiveTool('pointer'); }
    });
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
             <div className="text-sm font-bold">{session?.name || 'Loading Session...'}</div>
             <div className="text-[10px] text-gray-500">{session?.pair} • {session?.date}</div>
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
             Bal: <span className={session?.balance >= 10000 ? "text-emerald-400" : "text-red-400"}>${session?.balance?.toFixed(2)}</span>
           </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
        
        {/* Left Toolbar (TV Clone) - Hidden on mobile, visible on md+ */}
        <div className="hidden md:flex w-14 border-r border-white/10 bg-[#131722] flex-col items-center py-4 gap-3 shrink-0">
           {DRAWING_TOOLS.map(tool => (
             <button
               key={tool.id}
               onClick={() => handleToolClick(tool.id)}
               className={`p-2 rounded-lg transition-colors group relative ${activeTool === tool.id ? 'bg-[#2962FF]/20 text-[#2962FF]' : 'text-gray-400 hover:text-gray-200 hover:bg-[#2B3139]'}`}
               title={tool.name}
             >
               <tool.icon className="w-5 h-5" />
             </button>
           ))}
           <div className="w-8 h-px bg-white/10 my-2" />
           <button onClick={() => { if(chartRef.current) chartRef.current.removeOverlay() }} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-[#2B3139] transition-colors" title="Clear Drawings">
             <Crosshair className="w-5 h-5" />
           </button>
        </div>

        {/* Center Chart */}
        <div className="flex-1 relative flex flex-col min-h-[40vh] md:min-h-0">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[#131722] z-10">
              <Loader2 className="w-8 h-8 animate-spin text-[#2962FF]" />
            </div>
          ) : (
             <div ref={chartContainerRef} className="absolute inset-0 w-full h-full" />
          )}
        </div>
        
        {/* Right Sidebar - MT5 Style Punch Trade */}
        <div className="w-full md:w-[320px] border-t md:border-t-0 md:border-l border-white/10 bg-[#101216] flex flex-col shrink-0">
           
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
                   disabled={openTrade !== null}
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
                   disabled={openTrade !== null}
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
              
              {openTrade && (
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-between">
                   <div>
                     <div className={`font-bold text-xs ${openTrade.type === 'Buy' ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                       ACTIVE {openTrade.type.toUpperCase()}
                     </div>
                     <div className="text-[10px] text-blue-300 mt-1">Play chart to hit SL/TP</div>
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
