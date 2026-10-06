import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, StepForward, ArrowRightLeft, Square, Plus, Loader2 } from 'lucide-react';

export default function Backtest() {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Backtesting State
  const [currentIndex, setCurrentIndex] = useState(0); // Which candle we are currently showing
  const [balance, setBalance] = useState(10000);
  const [openTrade, setOpenTrade] = useState(null);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Asset
  const pair = 'BTCUSDT';
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch 1h candles from Binance for the past year (approx 8760 candles)
        const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${pair}&interval=1h&limit=1000`);
        const json = await response.json();
        
        const formattedData = json.map(d => ({
          time: d[0] / 1000,
          open: parseFloat(d[1]),
          high: parseFloat(d[2]),
          low: parseFloat(d[3]),
          close: parseFloat(d[4]),
        }));
        
        setData(formattedData);
        // Start simulation at the 100th candle to show some history initially
        setCurrentIndex(100);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [pair]);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
      layout: {
        background: { type: 'solid', color: '#1a1a1a' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#2b2b43' },
        horzLines: { color: '#2b2b43' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      }
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;
    
    // Set initial visible data
    const visibleData = data.slice(0, currentIndex);
    candlestickSeries.setData(visibleData);

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data]);
  
  // Sync chart with currentIndex
  useEffect(() => {
    if (seriesRef.current && data.length > 0) {
      const visibleData = data.slice(0, currentIndex);
      seriesRef.current.setData(visibleData);
      
      // Auto-play logic simulation
      if (isPlaying) {
        const timer = setTimeout(stepForward, 200);
        return () => clearTimeout(timer);
      }
    }
  }, [currentIndex, isPlaying]);

  const stepForward = () => {
    if (currentIndex < data.length) {
      const nextCandle = data[currentIndex];
      setCurrentIndex(prev => prev + 1);
      
      // Check for Stop Loss or Take Profit if trade is open
      if (openTrade) {
        checkTradeExit(nextCandle);
      }
    } else {
      setIsPlaying(false);
    }
  };

  const executeTrade = (type) => {
    if (openTrade) return; // Prevent multiple trades for now
    
    const currentPrice = data[currentIndex - 1].close;
    // Simple 1% SL and 2% TP logic for demo
    const slDistance = currentPrice * 0.01;
    const tpDistance = currentPrice * 0.02;
    
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
      // Sell
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
      // Very basic position sizing demo (assume $1000 per trade)
      const positionSize = 1000;
      const profitPercentage = pnl / openTrade.entryPrice;
      const finalPnl = positionSize * profitPercentage;

      setBalance(prev => prev + finalPnl);
      setTradeHistory(prev => [...prev, { ...openTrade, exitPrice, finalPnl }]);
      setOpenTrade(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Backtesting Engine</h1>
        <div className="text-xl font-mono bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-800">
          Balance: <span className={balance >= 10000 ? "text-green-500" : "text-red-500"}>${balance.toFixed(2)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3 bg-zinc-950 border-zinc-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>{pair} - 1h Timeframe</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant={isPlaying ? "destructive" : "secondary"} onClick={() => setIsPlaying(!isPlaying)}>
                {isPlaying ? <Square className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                {isPlaying ? "Stop" : "Auto-Play"}
              </Button>
              <Button size="sm" variant="secondary" onClick={stepForward} disabled={isPlaying}>
                <StepForward className="w-4 h-4 mr-1" />
                Next Candle
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[500px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
              </div>
            ) : (
              <div ref={chartContainerRef} className="w-full rounded-md overflow-hidden border border-zinc-800" />
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-zinc-950 border-zinc-900">
            <CardHeader>
              <CardTitle>Trade Execution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700" 
                  disabled={openTrade !== null || loading}
                  onClick={() => executeTrade('Buy')}
                >
                  <Plus className="w-4 h-4 mr-1" /> Buy
                </Button>
                <Button 
                  className="w-full bg-red-600 hover:bg-red-700" 
                  disabled={openTrade !== null || loading}
                  onClick={() => executeTrade('Sell')}
                >
                  <ArrowRightLeft className="w-4 h-4 mr-1" /> Sell
                </Button>
              </div>
              
              {openTrade && (
                <div className="p-3 bg-zinc-900 rounded border border-zinc-800 mt-4 space-y-1 text-sm">
                  <div className="font-semibold text-zinc-300 border-b border-zinc-800 pb-1 mb-2">Open Position</div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Type:</span> 
                    <span className={openTrade.type === 'Buy' ? 'text-green-500' : 'text-red-500'}>{openTrade.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Entry:</span> 
                    <span>{openTrade.entryPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Stop Loss:</span> 
                    <span className="text-red-400">{openTrade.sl.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Take Profit:</span> 
                    <span className="text-green-400">{openTrade.tp.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-zinc-950 border-zinc-900">
            <CardHeader>
              <CardTitle>Recent Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                {tradeHistory.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-4">No trades yet</p>
                ) : (
                  [...tradeHistory].reverse().map((trade, i) => (
                    <div key={i} className="flex justify-between items-center p-2 rounded bg-zinc-900 border border-zinc-800 text-sm">
                      <div>
                        <span className={`font-bold ${trade.type === 'Buy' ? 'text-green-500' : 'text-red-500'}`}>{trade.type}</span>
                        <div className="text-xs text-zinc-500">Entry: {trade.entryPrice.toFixed(2)}</div>
                      </div>
                      <div className={`font-mono font-bold ${trade.finalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {trade.finalPnl >= 0 ? '+' : ''}{trade.finalPnl.toFixed(2)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
