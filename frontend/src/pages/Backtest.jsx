import React, { useEffect, useRef, useState, useMemo } from 'react';
import { init, dispose } from 'klinecharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Play, StepForward, Square, ArrowRightLeft, Loader2, 
  MousePointer2, Pencil, Minus, MoveDiagonal, 
  Layers, Search, ShieldCheck, Crosshair
} from 'lucide-react';

const ASSETS = [
  { symbol: 'BTCUSDT', name: 'Bitcoin', type: 'Crypto' },
  { symbol: 'ETHUSDT', name: 'Ethereum', type: 'Crypto' },
  { symbol: 'SOLUSDT', name: 'Solana', type: 'Crypto' },
  { symbol: 'BNBUSDT', name: 'BNB', type: 'Crypto' },
  { symbol: 'XRPUSDT', name: 'Ripple', type: 'Crypto' },
];

const TIMEFRAMES = [
  { label: '15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: '4h', value: '4h' },
  { label: '1d', value: '1d' },
];

const DRAWING_TOOLS = [
  { id: 'pointer', icon: MousePointer2, name: 'Cursor' },
  { id: 'horizontalStraightLine', icon: Minus, name: 'Horizontal Line' },
  { id: 'rayLine', icon: MoveDiagonal, name: 'Trend Line' },
  { id: 'fibonacciLine', icon: Layers, name: 'Fibonacci Retracement' },
  { id: 'priceLine', icon: Crosshair, name: 'Price Level' }
];

export default function Backtest() {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Settings
  const [pair, setPair] = useState('BTCUSDT');
  const [timeframe, setTimeframe] = useState('1h');
  const [activeTool, setActiveTool] = useState('pointer');
  
  // Backtesting State
  const [currentIndex, setCurrentIndex] = useState(0); 
  const [balance, setBalance] = useState(10000);
  const [openTrade, setOpenTrade] = useState(null);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setIsPlaying(false);
      setOpenTrade(null);
      try {
        const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${timeframe}&limit=1000`);
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
        setCurrentIndex(200); // Start with 200 candles visible
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [pair, timeframe]);

  // Initialize Chart
  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    // Destroy previous instance if exists
    if (chartRef.current) {
      dispose(chartContainerRef.current);
    }

    const chart = init(chartContainerRef.current, {
      grid: {
        horizontal: { color: '#2b2b43', size: 1, style: 'dashed' },
        vertical: { color: '#2b2b43', size: 1, style: 'dashed' }
      },
      candle: {
        type: 'candle_solid',
        bar: {
          upColor: '#26a69a',
          downColor: '#ef5350',
          noChangeColor: '#888888',
          upBorderColor: '#26a69a',
          downBorderColor: '#ef5350',
          noChangeBorderColor: '#888888',
          upWickColor: '#26a69a',
          downWickColor: '#ef5350',
          noChangeWickColor: '#888888'
        }
      },
      yAxis: {
        tickText: { color: '#d1d4dc' },
        axisLine: { color: '#2b2b43' }
      },
      xAxis: {
        tickText: { color: '#d1d4dc' },
        axisLine: { color: '#2b2b43' }
      }
    });

    chart.setStyles({
       pane: { background: '#131722' }
    });

    chartRef.current = chart;
    
    // Set initial visible data
    const visibleData = data.slice(0, currentIndex);
    chart.applyNewData(visibleData);

    return () => {
      dispose(chartContainerRef.current);
      chartRef.current = null;
    };
  }, [data]); // Only re-init when raw data changes
  
  // Sync chart with currentIndex (Step Forward)
  useEffect(() => {
    if (chartRef.current && data.length > 0) {
      // Just update the latest data points instead of re-applying all
      const visibleData = data.slice(0, currentIndex);
      chartRef.current.applyNewData(visibleData);
      
      // Auto-play logic
      if (isPlaying) {
        const timer = setTimeout(stepForward, 250);
        return () => clearTimeout(timer);
      }
    }
  }, [currentIndex, isPlaying]);

  const stepForward = () => {
    if (currentIndex < data.length) {
      const nextCandle = data[currentIndex];
      setCurrentIndex(prev => prev + 1);
      
      if (openTrade) {
        checkTradeExit(nextCandle);
      }
    } else {
      setIsPlaying(false);
    }
  };

  const executeTrade = (type) => {
    if (openTrade) return; 
    
    const currentPrice = data[currentIndex - 1].close;
    // Basic Risk Parameters (Can be made dynamic inputs later)
    const slDistance = currentPrice * 0.015; // 1.5% SL
    const tpDistance = currentPrice * 0.03;  // 3% TP
    
    const sl = type === 'Buy' ? currentPrice - slDistance : currentPrice + slDistance;
    const tp = type === 'Buy' ? currentPrice + tpDistance : currentPrice - tpDistance;
    
    const trade = {
      type,
      entryPrice: currentPrice,
      sl,
      tp,
      entryIndex: currentIndex - 1,
    };
    
    setOpenTrade(trade);
    
    // Draw Long/Short position mock overlay via lines for visual feedback
    if (chartRef.current) {
       chartRef.current.createOverlay({
         name: 'priceLine',
         extendData: 'Entry',
         points: [{ value: currentPrice }]
       });
       chartRef.current.createOverlay({
         name: 'priceLine',
         extendData: 'SL',
         points: [{ value: sl }],
         styles: { line: { color: '#ef5350' } }
       });
       chartRef.current.createOverlay({
         name: 'priceLine',
         extendData: 'TP',
         points: [{ value: tp }],
         styles: { line: { color: '#26a69a' } }
       });
    }
  };
  
  const checkTradeExit = (candle) => {
    let closed = false;
    let pnl = 0;
    let exitPrice = 0;

    if (openTrade.type === 'Buy') {
      if (candle.low <= openTrade.sl) {
        closed = true;
        exitPrice = openTrade.sl;
        pnl = - (openTrade.entryPrice - openTrade.sl);
      } else if (candle.high >= openTrade.tp) {
        closed = true;
        exitPrice = openTrade.tp;
        pnl = (openTrade.tp - openTrade.entryPrice);
      }
    } else {
      if (candle.high >= openTrade.sl) {
        closed = true;
        exitPrice = openTrade.sl;
        pnl = - (openTrade.sl - openTrade.entryPrice);
      } else if (candle.low <= openTrade.tp) {
        closed = true;
        exitPrice = openTrade.tp;
        pnl = (openTrade.entryPrice - openTrade.tp);
      }
    }

    if (closed) {
      const positionSize = 1000;
      const profitPercentage = pnl / openTrade.entryPrice;
      const finalPnl = positionSize * profitPercentage;

      setBalance(prev => prev + finalPnl);
      setTradeHistory(prev => [...prev, { ...openTrade, exitPrice, finalPnl }]);
      setOpenTrade(null);
      
      // Clear position lines
      if (chartRef.current) {
         chartRef.current.removeOverlay(); // Removes all overlays for simplicity
      }
    }
  };

  const handleToolClick = (toolId) => {
    setActiveTool(toolId);
    if (!chartRef.current) return;
    
    if (toolId === 'pointer') {
      // klinecharts doesn't strictly have a "pointer" override, we just stop creating overlays
      return;
    }
    
    chartRef.current.createOverlay({
      name: toolId,
      onDrawEnd: function () {
         setActiveTool('pointer'); // Revert to pointer after drawing
      }
    });
  };

  return (
    <div className="flex flex-col h-screen bg-[#0A0B0D] text-white pt-14 md:pt-0 overflow-hidden font-sans">
      
      {/* Top Toolbar (Asset, Timeframe, Balance) */}
      <div className="h-14 border-b border-white/10 bg-[#131722] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
           
           <div className="flex items-center bg-[#1E222D] rounded-lg p-1 border border-white/5">
             {ASSETS.map(a => (
               <button 
                 key={a.symbol}
                 onClick={() => setPair(a.symbol)}
                 className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${pair === a.symbol ? 'bg-[#2962FF] text-white' : 'text-gray-400 hover:text-white'}`}
               >
                 {a.symbol}
               </button>
             ))}
           </div>
           
           <div className="w-px h-6 bg-white/10 mx-2" />
           
           <div className="flex items-center bg-[#1E222D] rounded-lg p-1 border border-white/5">
             {TIMEFRAMES.map(t => (
               <button 
                 key={t.value}
                 onClick={() => setTimeframe(t.value)}
                 className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${timeframe === t.value ? 'bg-[#2B3139] text-white' : 'text-gray-400 hover:text-white'}`}
               >
                 {t.label}
               </button>
             ))}
           </div>

        </div>
        
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2">
             <Button size="sm" variant={isPlaying ? "destructive" : "secondary"} className="h-8 bg-[#2962FF] hover:bg-[#1E4CDB] border-none text-white text-xs" onClick={() => setIsPlaying(!isPlaying)}>
               {isPlaying ? <Square className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
               {isPlaying ? "Stop" : "Auto-Play"}
             </Button>
             <Button size="sm" variant="secondary" className="h-8 bg-[#2B3139] hover:bg-[#363C4E] border-none text-white text-xs" onClick={stepForward} disabled={isPlaying}>
               <StepForward className="w-3 h-3 mr-1" />
               Next Candle
             </Button>
           </div>
           <div className="w-px h-6 bg-white/10 mx-2" />
           <div className="text-sm font-mono bg-[#1E222D] px-4 py-1.5 rounded-lg border border-white/5 font-bold">
             Balance: <span className={balance >= 10000 ? "text-emerald-400" : "text-red-400"}>${balance.toFixed(2)}</span>
           </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Toolbar (Drawing Tools like TradingView) */}
        <div className="w-14 border-r border-white/10 bg-[#131722] flex flex-col items-center py-4 gap-3 shrink-0">
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
           <button onClick={() => { if(chartRef.current) chartRef.current.removeOverlay() }} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-[#2B3139] transition-colors" title="Clear All Drawings">
             <Crosshair className="w-5 h-5" />
           </button>
        </div>

        {/* Center Chart */}
        <div className="flex-1 bg-[#131722] relative flex flex-col">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[#131722] z-10">
              <div className="flex flex-col items-center">
                <Loader2 className="w-10 h-10 animate-spin text-[#2962FF] mb-4" />
                <p className="text-gray-400 text-sm font-semibold tracking-wider uppercase">Loading Market Data</p>
              </div>
            </div>
          ) : (
             <div ref={chartContainerRef} className="w-full h-full" />
          )}
        </div>
        
        {/* Right Sidebar (Execution & History) */}
        <div className="w-72 border-l border-white/10 bg-[#131722] flex flex-col shrink-0">
           
           <div className="p-4 border-b border-white/10">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Trade Execution</h3>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <Button 
                  className="w-full bg-[#089981] hover:bg-[#067A67] border-none text-white h-10 rounded-lg text-sm font-bold shadow-lg shadow-[#089981]/20" 
                  disabled={openTrade !== null || loading}
                  onClick={() => executeTrade('Buy')}
                >
                  Buy
                </Button>
                <Button 
                  className="w-full bg-[#F23645] hover:bg-[#C22B37] border-none text-white h-10 rounded-lg text-sm font-bold shadow-lg shadow-[#F23645]/20" 
                  disabled={openTrade !== null || loading}
                  onClick={() => executeTrade('Sell')}
                >
                  Sell
                </Button>
              </div>
              
              {openTrade && (
                <div className="p-4 bg-[#1E222D] rounded-xl border border-white/5 space-y-2 text-sm animate-in fade-in zoom-in-95">
                  <div className="font-bold text-white border-b border-white/10 pb-2 mb-3 flex items-center gap-2">
                     <ShieldCheck className="w-4 h-4 text-cyan-400" /> Active Position
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Direction</span> 
                    <span className={`font-bold ${openTrade.type === 'Buy' ? 'text-[#089981]' : 'text-[#F23645]'}`}>{openTrade.type.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Entry</span> 
                    <span className="font-mono text-white">{openTrade.entryPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Stop Loss</span> 
                    <span className="font-mono text-[#F23645]">{openTrade.sl.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Take Profit</span> 
                    <span className="font-mono text-[#089981]">{openTrade.tp.toFixed(2)}</span>
                  </div>
                </div>
              )}
           </div>

           <div className="flex-1 overflow-y-auto p-4 flex flex-col">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Recent Trades</h3>
              
              <div className="space-y-2 flex-1">
                {tradeHistory.length === 0 ? (
                  <p className="text-xs text-gray-600 text-center py-10">No simulated trades yet.</p>
                ) : (
                  [...tradeHistory].reverse().map((trade, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-[#1E222D] border border-white/5 text-sm">
                      <div>
                        <span className={`font-bold text-xs ${trade.type === 'Buy' ? 'text-[#089981]' : 'text-[#F23645]'}`}>{trade.type.toUpperCase()}</span>
                        <div className="text-[10px] text-gray-500 font-mono mt-0.5">Entry: {trade.entryPrice.toFixed(2)}</div>
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
