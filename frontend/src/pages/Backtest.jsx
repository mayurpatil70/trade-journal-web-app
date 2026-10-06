import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createChart } from 'lightweight-charts';
import { 
  Play, Square, StepForward, ChevronLeft, Loader2, Search, X, 
  MousePointer2, Minus, PenLine, Type, Magnet, Lock, Trash2,
  ChevronDown, ChevronRight, Settings, Camera, Maximize,
  SkipBack, Rewind, FastForward, SkipForward, AlertCircle,
  Clock, BarChart2, Activity, LayoutDashboard, Bookmark, Target
} from 'lucide-react';

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
  const [playbackSpeed, setPlaybackSpeed] = useState(300);

  // Session State
  const [session, setSession] = useState(null);
  const [activeSymbol, setActiveSymbol] = useState('');
  
  // FX Replay State
  const [tradeMode, setTradeMode] = useState('Buy'); // 'Buy' or 'Sell'
  const [orderType, setOrderType] = useState('Market'); // 'Market', 'Limit', 'Stop'
  const [riskPercent, setRiskPercent] = useState('1%');
  const [units, setUnits] = useState('60');
  const [entryPrice, setEntryPrice] = useState('');
  const [slPrice, setSlPrice] = useState('');
  const [tpPrice, setTpPrice] = useState('');
  
  const [activeTrade, setActiveTrade] = useState(null); 
  const [livePnl, setLivePnl] = useState(0);
  const priceLinesRef = useRef({ entry: null, sl: null, tp: null });

  useEffect(() => {
    const saved = localStorage.getItem('backtest_sessions');
    let parsed = [];
    if (saved) parsed = JSON.parse(saved);
    
    let foundSession = parsed.find(x => x.id === id);
    if (!foundSession) {
      // Create unsaved temporary session
      foundSession = { 
        id, 
        name: `New Session ${new Date().toLocaleDateString()}`, 
        pair: 'NQ1', 
        balance: 100000 
      };
    }
    
    setSession(foundSession);
    setActiveSymbol(foundSession.pair.replace('/', ''));
  }, [id]);

  useEffect(() => {
    if (!activeSymbol) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const mockData = [];
        let currentPrice = activeSymbol.includes('NQ') ? 2347.74 : 1.1000;
        let time = Math.floor(Date.now() / 1000) - (1000 * 3600);
        for (let i = 0; i < 1000; i++) {
          const volatility = currentPrice > 100 ? 5 : 0.002;
          const open = currentPrice;
          const high = open + (Math.random() * volatility);
          const low = open - (Math.random() * volatility);
          const close = low + (Math.random() * (high - low));
          mockData.push({ time, open, high, low, close });
          currentPrice = close;
          time += 3600;
        }
        setData(mockData);
        setCurrentIndex(200); 
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
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeSymbol]);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: 'solid', color: '#0A0B0D' }, textColor: '#787B86' },
      grid: { vertLines: { color: '#1B1C20', style: 1 }, horzLines: { color: '#1B1C20', style: 1 } },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: { timeVisible: true, secondsVisible: false, borderColor: '#1B1C20' },
      rightPriceScale: { borderColor: '#1B1C20' },
      crosshair: { mode: 1, vertLine: { color: '#2B2D33' }, horzLine: { color: '#2B2D33' } }
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#089981', downColor: '#F23645',
      borderVisible: false, wickUpColor: '#089981', wickDownColor: '#F23645',
    });

    chartInstance.current = chart;
    seriesInstance.current = candlestickSeries;
    
    const visibleData = data.slice(0, currentIndex);
    candlestickSeries.setData(visibleData);
    
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

  useEffect(() => {
    if (chartInstance.current && data.length > 0) {
      const visibleData = data.slice(0, currentIndex);
      seriesInstance.current.setData(visibleData);
      
      const currentCandle = visibleData[visibleData.length - 1];
      if (activeTrade) checkTradeExit(currentCandle);
      
      if (!activeTrade && currentPrice && !entryPrice) {
         setEntryPrice(currentPrice.toFixed(2));
      }

      if (isPlaying) {
        const timer = setTimeout(stepForward, playbackSpeed);
        return () => clearTimeout(timer);
      }
    }
  }, [currentIndex, isPlaying, activeTrade]);

  const stepForward = () => {
    if (currentIndex < data.length) setCurrentIndex(prev => prev + 1);
    else setIsPlaying(false);
  };
  
  const stepBackward = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  const currentPrice = data.length > 0 && currentIndex > 0 ? data[currentIndex - 1].close : 0;

  const drawPreviewLines = useCallback(() => {
    if (!seriesInstance.current || !currentPrice) return;
    
    // Preview Entry
    let ep = parseFloat(entryPrice);
    if (!ep) ep = currentPrice;

    if (priceLinesRef.current.entry) {
        priceLinesRef.current.entry.applyOptions({ price: ep });
    } else {
        priceLinesRef.current.entry = seriesInstance.current.createPriceLine({
            price: ep, color: '#2962FF', lineWidth: 1, lineStyle: 0, title: 'Entry', axisLabelVisible: true,
        });
    }

    // Preview SL
    let sl = parseFloat(slPrice);
    if (sl) {
        if (priceLinesRef.current.sl) {
            priceLinesRef.current.sl.applyOptions({ price: sl });
        } else {
            priceLinesRef.current.sl = seriesInstance.current.createPriceLine({
                price: sl, color: '#F23645', lineWidth: 1, lineStyle: 2, title: 'SL', axisLabelVisible: true,
            });
        }
    } else if (priceLinesRef.current.sl) {
        seriesInstance.current.removePriceLine(priceLinesRef.current.sl);
        priceLinesRef.current.sl = null;
    }

    // Preview TP
    let tp = parseFloat(tpPrice);
    if (tp) {
        if (priceLinesRef.current.tp) {
            priceLinesRef.current.tp.applyOptions({ price: tp });
        } else {
            priceLinesRef.current.tp = seriesInstance.current.createPriceLine({
                price: tp, color: '#089981', lineWidth: 1, lineStyle: 2, title: 'TP', axisLabelVisible: true,
            });
        }
    } else if (priceLinesRef.current.tp) {
        seriesInstance.current.removePriceLine(priceLinesRef.current.tp);
        priceLinesRef.current.tp = null;
    }
  }, [entryPrice, slPrice, tpPrice, currentPrice]);

  useEffect(() => {
      if (!activeTrade) {
          drawPreviewLines();
      }
  }, [entryPrice, slPrice, tpPrice, currentPrice, activeTrade, drawPreviewLines]);

  const drawPriceLines = (entry, sl, tp) => {
    // Solidify lines on trade execute
    drawPreviewLines();
  };

  const removePriceLines = () => {
    if (!seriesInstance.current) return;
    if (priceLinesRef.current.entry) seriesInstance.current.removePriceLine(priceLinesRef.current.entry);
    if (priceLinesRef.current.sl) seriesInstance.current.removePriceLine(priceLinesRef.current.sl);
    if (priceLinesRef.current.tp) seriesInstance.current.removePriceLine(priceLinesRef.current.tp);
    priceLinesRef.current = { entry: null, sl: null, tp: null };
  };

  const executeTrade = () => {
    if (activeTrade || currentPrice === 0) return; 
    let stopLoss = parseFloat(slPrice);
    let takeProfit = parseFloat(tpPrice);
    let entryP = parseFloat(entryPrice) || currentPrice;
    const lots = parseFloat(units) || 60;
    
    if (!stopLoss || !takeProfit) {
      alert("Please enter exact SL and TP prices to execute the trade.");
      return;
    }

    setActiveTrade({
      type: tradeMode,
      entry: entryP,
      sl: stopLoss,
      tp: takeProfit,
      lots,
      entryTime: data[currentIndex - 1].time
    });
    
    setLivePnl(0);
  };
  
  const checkTradeExit = (candle) => {
    let closed = false;
    let finalPnl = 0;
    const multiplier = activeTrade.lots;

    const currentLivePnl = activeTrade.type === 'Buy' 
      ? (candle.close - activeTrade.entry) * multiplier 
      : (activeTrade.entry - candle.close) * multiplier;
      
    setLivePnl(currentLivePnl);

    if (activeTrade.type === 'Buy') {
      if (candle.low <= activeTrade.sl) { closed = true; finalPnl = - (activeTrade.entry - activeTrade.sl) * multiplier; }
      else if (candle.high >= activeTrade.tp) { closed = true; finalPnl = (activeTrade.tp - activeTrade.entry) * multiplier; }
    } else {
      if (candle.high >= activeTrade.sl) { closed = true; finalPnl = - (activeTrade.sl - activeTrade.entry) * multiplier; }
      else if (candle.low <= activeTrade.tp) { closed = true; finalPnl = (activeTrade.entry - activeTrade.tp) * multiplier; }
    }

    if (closed) {
      setSession(prev => {
        const newBal = prev.balance + finalPnl;
        return { ...prev, balance: newBal };
      });
      setActiveTrade(null);
      setLivePnl(0);
      removePriceLines();
    }
  };

  const saveSession = () => {
    if (!session) return;
    const saved = JSON.parse(localStorage.getItem('backtest_sessions') || '[]');
    const existingIndex = saved.findIndex(s => s.id === id);
    if (existingIndex >= 0) {
        saved[existingIndex] = { ...session };
    } else {
        saved.push({ ...session });
    }
    localStorage.setItem('backtest_sessions', JSON.stringify(saved));
    alert("Session saved successfully to your browser data!");
  };

  // FX Replay Specific Calcs
  const estLoss = activeTrade ? (activeTrade.type === 'Buy' ? (activeTrade.entry - activeTrade.sl) * activeTrade.lots : (activeTrade.sl - activeTrade.entry) * activeTrade.lots) : (parseFloat(slPrice) ? (tradeMode === 'Buy' ? (currentPrice - parseFloat(slPrice)) * units : (parseFloat(slPrice) - currentPrice) * units) : 0);
  const estProfit = activeTrade ? (activeTrade.type === 'Buy' ? (activeTrade.tp - activeTrade.entry) * activeTrade.lots : (activeTrade.entry - activeTrade.tp) * activeTrade.lots) : (parseFloat(tpPrice) ? (tradeMode === 'Buy' ? (parseFloat(tpPrice) - currentPrice) * units : (currentPrice - parseFloat(tpPrice)) * units) : 0);
  const rrRatio = estLoss > 0 ? (estProfit / estLoss).toFixed(2) : '0.00';

  return (
    <div className="flex flex-col h-screen bg-[#0A0B0D] text-[#D1D4DC] overflow-hidden font-sans text-xs fixed inset-0 z-[100]">
      
      {/* Top Header - FX Replay Style */}
      <div className="h-12 border-b border-[#1B1C20] bg-[#0A0B0D] flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-1">
           <button onClick={() => navigate('/sessions')} className="p-1.5 hover:bg-[#1B1C20] rounded text-[#787B86] hover:text-white">
             <ChevronLeft className="w-5 h-5" />
           </button>
           <div className="flex items-center gap-2 ml-2">
             <div className="w-6 h-6 rounded-md bg-[#2962FF] flex items-center justify-center font-bold text-[10px] text-white">
               NQ
             </div>
             <div className="font-bold text-sm tracking-wide text-[#D1D4DC] flex items-center gap-2">
               {activeSymbol || 'CME_MINI:NQ1'}
               <span className="text-[#787B86] text-xs font-normal">NQ1 • 1h • CME on FXReplay</span>
             </div>
           </div>

           <div className="h-4 w-px bg-[#1B1C20] mx-3"></div>
           <button className="flex items-center gap-1 px-2 py-1.5 hover:bg-[#1B1C20] rounded text-[#D1D4DC] font-semibold">
             1h <ChevronDown className="w-3 h-3" />
           </button>
           <div className="h-4 w-px bg-[#1B1C20] mx-1"></div>
           <button className="flex items-center gap-1 px-2 py-1.5 hover:bg-[#1B1C20] rounded text-[#787B86] hover:text-[#D1D4DC]">
             <Activity className="w-4 h-4" /> Indicators
           </button>
           <button className="flex items-center gap-1 px-2 py-1.5 hover:bg-[#1B1C20] rounded text-[#787B86] hover:text-[#D1D4DC]">
             <BarChart2 className="w-4 h-4" /> Order flow
           </button>
           <button className="flex items-center gap-1 px-2 py-1.5 hover:bg-[#1B1C20] rounded text-[#787B86] hover:text-[#D1D4DC]">
             <BarChart2 className="w-4 h-4" /> Analytics
           </button>
        </div>

        <div className="flex items-center gap-1">
           <button className="px-2 py-1.5 hover:bg-[#1B1C20] rounded text-[#787B86] hover:text-[#D1D4DC] flex items-center gap-1">
             Text <Settings className="w-3 h-3" />
           </button>
           <div className="h-4 w-px bg-[#1B1C20] mx-1"></div>
           <button onClick={saveSession} className="px-3 py-1 bg-[#2962FF] hover:bg-[#1E4CDB] text-white font-bold rounded text-xs shadow-sm ml-2 mr-2">
             Save Session
           </button>
           <button className="p-1.5 hover:bg-[#1B1C20] rounded text-[#787B86]"><Settings className="w-4 h-4" /></button>
           <button className="p-1.5 hover:bg-[#1B1C20] rounded text-[#787B86]"><Camera className="w-4 h-4" /></button>
           <button className="p-1.5 hover:bg-[#1B1C20] rounded text-[#787B86]"><Maximize className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left Toolbar (Chart Drawing Tools) */}
        <div className="w-12 border-r border-[#1B1C20] bg-[#0A0B0D] flex flex-col items-center py-2 gap-2 shrink-0 z-20">
           <button className="w-8 h-8 rounded hover:bg-[#1B1C20] flex items-center justify-center text-[#787B86]"><MousePointer2 className="w-4 h-4" /></button>
           <button className="w-8 h-8 rounded hover:bg-[#1B1C20] flex items-center justify-center text-[#787B86]"><Minus className="w-4 h-4 rotate-45" /></button>
           <button className="w-8 h-8 rounded hover:bg-[#1B1C20] flex items-center justify-center text-[#787B86]"><Activity className="w-4 h-4" /></button>
           <button className="w-8 h-8 rounded hover:bg-[#1B1C20] flex items-center justify-center text-[#787B86]"><PenLine className="w-4 h-4" /></button>
           <button className="w-8 h-8 rounded hover:bg-[#1B1C20] flex items-center justify-center text-[#787B86]"><Type className="w-4 h-4" /></button>
           
           <div className="w-6 h-px bg-[#1B1C20] my-1"></div>
           
           <button className="w-8 h-8 rounded bg-[#1B1C20] flex items-center justify-center text-[#2962FF] border-l-2 border-[#2962FF]">
             <Target className="w-4 h-4" />
           </button>
           
           <div className="w-6 h-px bg-[#1B1C20] my-1"></div>
           
           <button className="w-8 h-8 rounded hover:bg-[#1B1C20] flex items-center justify-center text-[#787B86]"><Magnet className="w-4 h-4" /></button>
           <button className="w-8 h-8 rounded hover:bg-[#1B1C20] flex items-center justify-center text-[#787B86]"><Lock className="w-4 h-4" /></button>
           <button className="w-8 h-8 rounded hover:bg-[#1B1C20] flex items-center justify-center text-[#787B86]"><Trash2 className="w-4 h-4" /></button>
        </div>

        {/* Center Chart Area */}
        <div className="flex-1 relative bg-[#0A0B0D] overflow-hidden">
          
          {/* Floating Replay Bar */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#131418] border border-[#222429] rounded-full px-4 py-2 flex items-center gap-3 shadow-lg">
             <button className="text-[#787B86] hover:text-white" onClick={() => setCurrentIndex(100)}><SkipBack className="w-4 h-4" /></button>
             <button className="text-[#787B86] hover:text-white"><Rewind className="w-4 h-4" /></button>
             
             {/* Slider Mock */}
             <div className="w-24 h-1 bg-[#222429] rounded-full relative flex items-center">
               <div className="absolute left-0 h-1 bg-[#2962FF] w-2/3 rounded-full"></div>
               <div className="absolute left-2/3 w-3 h-3 bg-white rounded-full shadow -ml-1.5 cursor-pointer"></div>
             </div>
             
             <button className="text-[#787B86] hover:text-white" onClick={stepBackward}><ChevronLeft className="w-4 h-4" /></button>
             <span className="text-[#D1D4DC] font-semibold font-mono text-xs w-8 text-center">4h</span>
             <button className="text-[#2962FF] hover:text-white border border-[#2962FF]/30 p-1 rounded hover:bg-[#2962FF]/10" onClick={() => setIsPlaying(!isPlaying)}>
               {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
             </button>
             <button className="text-[#787B86] hover:text-white" onClick={stepForward}><StepForward className="w-4 h-4" /></button>
             <button className="text-[#787B86] hover:text-white"><SkipForward className="w-4 h-4" /></button>
          </div>

          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0A0B0D] z-10">
              <Loader2 className="w-8 h-8 animate-spin text-[#2962FF]" />
            </div>
          ) : (
            <div ref={chartContainerRef} className="absolute inset-0 w-full h-full" />
          )}

          {/* Bottom Bar Info Overlay (Date/Time/Log) */}
          <div className="absolute bottom-0 right-0 z-20 flex items-center bg-[#0A0B0D] border-t border-l border-[#1B1C20] px-3 py-1 gap-3">
             <span className="text-[#787B86] font-mono text-[10px]">14:44:59 UTC</span>
             <span className="text-[#787B86] text-[10px]">% log auto</span>
             <Settings className="w-3 h-3 text-[#787B86]" />
          </div>
        </div>
        
        {/* Right Sidebar - FX Replay Order Panel Clone */}
        <div className="w-[300px] border-l border-[#1B1C20] bg-[#101114] flex flex-col shrink-0 z-20 shadow-2xl relative text-[11px]">
           
           {/* Mini Tabs */}
           <div className="flex h-12 border-b border-[#1B1C20] text-[#787B86]">
             <div className="flex-1 flex flex-col items-center justify-center border-b-2 border-[#2962FF] text-[#2962FF] bg-[#1B1C20]/30 cursor-pointer">
               <div className="w-5 h-5 rounded-full border border-current flex items-center justify-center mb-0.5 font-bold text-xs">+</div>
               <span className="text-[9px]">Order</span>
             </div>
             <div className="flex-1 flex flex-col items-center justify-center hover:text-white cursor-pointer"><LayoutDashboard className="w-4 h-4 mb-1" /><span className="text-[9px]">Presets</span></div>
             <div className="flex-1 flex flex-col items-center justify-center hover:text-white cursor-pointer"><Bookmark className="w-4 h-4 mb-1" /><span className="text-[9px]">Watchlist</span></div>
             <div className="flex-1 flex flex-col items-center justify-center hover:text-white cursor-pointer"><BarChart2 className="w-4 h-4 mb-1" /><span className="text-[9px]">Journal</span></div>
             <div className="flex-1 flex flex-col items-center justify-center hover:text-white cursor-pointer"><AlertCircle className="w-4 h-4 mb-1" /><span className="text-[9px]">Alerts</span></div>
           </div>

           <div className="flex-1 overflow-y-auto p-4 flex flex-col">
              
              <div className="flex items-center justify-between mb-4">
                 <div className="font-bold text-sm text-[#D1D4DC]">NQ1 <span className="text-[#787B86] text-xs font-normal">CME_MINI</span></div>
                 <button className="flex items-center gap-1 border border-[#222429] rounded px-2 py-1 text-[#787B86] hover:text-white">
                   <Settings className="w-3 h-3" /> Presets
                 </button>
              </div>

              {/* Sell / Buy Tabs */}
              <div className="flex bg-[#16181D] rounded-md p-1 mb-4 border border-[#222429]">
                 <button 
                   onClick={() => setTradeMode('Sell')}
                   className={`flex-1 py-2 text-center rounded font-semibold transition-colors ${tradeMode === 'Sell' ? 'bg-[#F23645] text-white' : 'text-[#787B86] hover:text-white'}`}
                 >
                   Sell
                 </button>
                 <button 
                   onClick={() => setTradeMode('Buy')}
                   className={`flex-1 py-2 text-center rounded font-semibold transition-colors ${tradeMode === 'Buy' ? 'bg-[#2962FF] text-white' : 'text-[#787B86] hover:text-white'}`}
                 >
                   Buy
                 </button>
              </div>

              {/* Balance Select */}
              <div className="flex items-center gap-4 mb-4 text-[#787B86]">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <div className="w-3 h-3 rounded-full border border-[#2962FF] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2962FF]"></div>
                  </div>
                  Initial balance
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <div className="w-3 h-3 rounded-full border border-[#787B86]"></div>
                  Current balance
                </label>
              </div>

              {/* Risk % */}
              <div className="mb-4">
                <div className="text-[#787B86] mb-2">Set risk percentage</div>
                <div className="flex gap-1">
                  {['0.5%', '1%', '2%', '3%'].map(r => (
                    <button key={r} onClick={() => setRiskPercent(r)} className={`flex-1 py-1.5 rounded border ${riskPercent === r ? 'border-[#2962FF] text-[#2962FF] bg-[#2962FF]/10' : 'border-[#222429] text-[#787B86] hover:border-[#787B86]'}`}>{r}</button>
                  ))}
                  <button className="flex-1 py-1.5 rounded border border-[#222429] text-[#2962FF] font-semibold">Custom</button>
                </div>
              </div>

              {/* Metrics */}
              <div className="flex justify-between border-t border-b border-[#222429] py-3 mb-4">
                <div className="flex flex-col">
                  <span className="text-[#787B86] mb-1">Est. loss</span>
                  <span className="text-[#F23645] font-mono">-${Math.abs(estLoss).toFixed(2)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[#787B86] mb-1">Est. profit</span>
                  <span className="text-[#089981] font-mono">+${Math.abs(estProfit).toFixed(2)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[#787B86] mb-1">R:R ratio</span>
                  <span className="text-[#D1D4DC] font-mono">1:{rrRatio}</span>
                </div>
              </div>

              {/* Type */}
              <div className="mb-4">
                <div className="text-[#787B86] mb-2">Type</div>
                <div className="flex border-b border-[#222429]">
                  {['Market', 'Limit', 'Stop'].map(t => (
                    <button key={t} onClick={() => setOrderType(t)} className={`flex-1 pb-2 font-semibold ${orderType === t ? 'text-white border-b-2 border-[#2962FF]' : 'text-[#787B86]'}`}>{t}</button>
                  ))}
                </div>
              </div>

              {/* Units & Entry */}
              <div className="flex gap-3 mb-4">
                <div className="flex-1">
                  <div className="text-[#787B86] mb-1.5">Units</div>
                  <input type="number" value={units} onChange={e=>setUnits(e.target.value)} className="w-full bg-[#0A0B0D] border border-[#222429] rounded p-2 text-white outline-none focus:border-[#2962FF]" />
                </div>
                <div className="flex-1">
                  <div className="text-[#787B86] mb-1.5">Entry price</div>
                  <input type="number" value={entryPrice} onChange={e=>setEntryPrice(e.target.value)} className="w-full bg-[#0A0B0D] border border-[#222429] rounded p-2 text-white outline-none focus:border-[#2962FF]" />
                </div>
              </div>

              {/* Exits */}
              <div className="mb-4">
                <div className="text-[#787B86] mb-2">Exits</div>
                
                <div className="border border-[#222429] rounded p-3 mb-2 bg-[#131418]">
                  <div className="flex justify-between items-center mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div className="w-6 h-3.5 bg-[#2962FF] rounded-full relative">
                        <div className="w-2.5 h-2.5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                      </div>
                      <span className="text-[#D1D4DC]">Stop loss</span>
                    </label>
                    <span className="text-[#787B86] flex items-center gap-1 cursor-pointer">Price <ChevronDown className="w-3 h-3" /></span>
                  </div>
                  <input type="number" value={slPrice} onChange={e=>setSlPrice(e.target.value)} placeholder="Stop loss price" className="w-full bg-[#0A0B0D] border border-[#222429] rounded p-2 text-white outline-none focus:border-[#2962FF]" />
                </div>

                <div className="border border-[#222429] rounded p-3 bg-[#131418] mb-2">
                  <div className="flex justify-between items-center mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div className="w-6 h-3.5 bg-[#2962FF] rounded-full relative">
                        <div className="w-2.5 h-2.5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                      </div>
                      <span className="text-[#D1D4DC]">Take profit</span>
                    </label>
                    <span className="text-[#787B86] flex items-center gap-1 cursor-pointer">Price <ChevronDown className="w-3 h-3" /></span>
                  </div>
                  <input type="number" value={tpPrice} onChange={e=>setTpPrice(e.target.value)} placeholder="Take profit price" className="w-full bg-[#0A0B0D] border border-[#222429] rounded p-2 text-white outline-none focus:border-[#2962FF]" />
                </div>

                <button className="text-[#2962FF] font-semibold py-2 w-full text-left">Add partial +</button>
              </div>

              {/* Auto Breakeven */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-6 h-3.5 bg-[#222429] rounded-full relative">
                  <div className="w-2.5 h-2.5 bg-[#787B86] rounded-full absolute left-0.5 top-0.5"></div>
                </div>
                <span className="text-[#787B86]">Auto breakeven</span>
              </div>

           </div>

           {/* Place Order Button Sticky Bottom */}
           <div className="p-4 border-t border-[#1B1C20] bg-[#101114]">
             <label className="flex items-center gap-2 mb-3 text-[#787B86] cursor-pointer">
               <div className="w-3.5 h-3.5 border border-[#787B86] rounded-sm"></div>
               Open journal after placing
             </label>
             <button 
               onClick={executeTrade}
               disabled={activeTrade !== null}
               className="w-full py-3 bg-[#2962FF] hover:bg-[#1E4CDB] text-white font-bold rounded shadow disabled:opacity-50"
             >
               Place order
             </button>
           </div>
        </div>

      </div>

      {/* Extreme Bottom Global Status Bar */}
      <div className="h-8 border-t border-[#1B1C20] bg-[#0A0B0D] flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-2">
          <button className="bg-[#2962FF] text-white px-3 py-1 rounded text-[10px] font-bold flex items-center gap-1"><Maximize className="w-3 h-3 rotate-45" /> Buy</button>
          <button className="bg-[#F23645] text-white px-3 py-1 rounded text-[10px] font-bold flex items-center gap-1"><Maximize className="w-3 h-3 rotate-135" /> Sell</button>
          <div className="bg-[#1B1C20] text-white px-4 py-1 rounded text-[10px] font-bold">1</div>
        </div>
        <div className="flex items-center gap-3 text-[#D1D4DC]">
           {activeTrade && (
             <div className="flex items-center gap-2 text-xs font-mono mr-4">
               Running PNL: <span className={livePnl >= 0 ? "text-[#089981]" : "text-[#F23645]"}>{livePnl >= 0 ? '+' : ''}{livePnl.toFixed(2)}</span>
             </div>
           )}
           <span className="font-mono font-bold">${(session?.balance || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
           <button><Settings className="w-4 h-4 text-[#787B86]" /></button>
        </div>
      </div>
    </div>
  );
}
