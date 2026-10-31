import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { Activity, Code2, Loader2 } from 'lucide-react';
import SymbolPicker from '../components/SymbolPicker';
import { marketApi } from '../api/market';
import { useTheme } from '../components/theme-provider';

const ScriptPanel = lazy(() => import('../components/charts/ScriptPanel'));

const TFS = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];
const LINE_COLORS = ['#0a84ff', '#ff9f0a', '#bf5af2', '#64d2ff'];
const LIVE_POLL_MS = 10000;

const readStored = (key, fallback) => {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
};
const store = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
};
const decimals = (price) => (price >= 1000 ? 2 : price >= 1 ? 4 : 6);

export default function Charts() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const [symbol, setSymbol] = useState(() => readStored('fn_chart_symbol', 'BTCUSDT'));
  const [tf, setTf] = useState(() => readStored('fn_chart_tf', '1h'));
  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [live, setLive] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [overlay, setOverlay] = useState(null);
  const [chartVersion, setChartVersion] = useState(0);

  const boxRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const linesRef = useRef([]);
  const candlesRef = useRef([]);
  const fitRef = useRef(true);

  useEffect(() => {
    const el = boxRef.current;
    const chart = createChart(el, {
      layout: { background: { type: 'solid', color: dark ? '#000000' : '#ffffff' }, textColor: dark ? '#9aa1ad' : '#6b7280' },
      grid: { vertLines: { color: dark ? '#14161a' : '#f2f2f7' }, horzLines: { color: dark ? '#14161a' : '#f2f2f7' } },
      width: el.clientWidth,
      height: el.clientHeight,
      timeScale: { timeVisible: true, secondsVisible: false, borderVisible: false },
      rightPriceScale: { borderVisible: false },
      crosshair: { mode: 1 },
    });
    seriesRef.current = chart.addCandlestickSeries({
      upColor: '#34c759', downColor: '#ff3b30', borderVisible: false, wickUpColor: '#34c759', wickDownColor: '#ff3b30',
    });
    chartRef.current = chart;
    linesRef.current = [];
    const ro = new ResizeObserver(() => chart.resize(el.clientWidth, el.clientHeight));
    ro.observe(el);
    setChartVersion((v) => v + 1);
    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [dark]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setLive(false);
    marketApi
      .candles({ symbol, tf, limit: 1000 })
      .then((res) => {
        if (cancelled) return;
        candlesRef.current = res.candles || [];
        fitRef.current = true;
        setCandles(candlesRef.current);
      })
      .catch((err) => {
        if (cancelled) return;
        candlesRef.current = [];
        setCandles([]);
        setError(err.response?.data?.error || 'Could not load this chart. Try another symbol or timeframe.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [symbol, tf]);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;
    series.setData(candles);
    if (candles.length) {
      const dp = decimals(candles[candles.length - 1].close);
      series.applyOptions({ priceFormat: { type: 'price', precision: dp, minMove: 1 / 10 ** dp } });
      if (fitRef.current) {
        chartRef.current?.timeScale().fitContent();
        fitRef.current = false;
      }
    }
  }, [candles, chartVersion]);

  useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;
    linesRef.current.forEach((l) => chart.removeSeries(l));
    linesRef.current = [];
    if (!overlay) {
      series.setMarkers([]);
      return;
    }
    const data = candlesRef.current;
    linesRef.current = overlay.plots.map((p, n) => {
      const line = chart.addLineSeries({ color: p.color || LINE_COLORS[n % 4], lineWidth: 2, priceLineVisible: false, lastValueVisible: false });
      line.setData(p.values.map((v, i) => (v == null || !data[i] ? null : { time: data[i].time, value: v })).filter(Boolean));
      return line;
    });
    series.setMarkers(
      overlay.signals
        .filter((s) => data[s.i])
        .map((s) => ({
          time: data[s.i].time,
          position: s.side === 'buy' ? 'belowBar' : 'aboveBar',
          shape: s.side === 'buy' ? 'arrowUp' : 'arrowDown',
          color: s.side === 'buy' ? '#34c759' : '#ff3b30',
          text: s.side === 'buy' ? 'Buy' : 'Sell',
        }))
        .sort((a, b) => a.time - b.time),
    );
  }, [overlay, chartVersion]);

  useEffect(() => {
    if (!candles.length) return undefined;
    let stopped = false;
    const tick = async () => {
      try {
        const res = await marketApi.candles({ symbol, tf, limit: 50 });
        if (stopped || !seriesRef.current) return;
        const known = candlesRef.current;
        const lastTime = known[known.length - 1]?.time ?? 0;
        for (const c of res.candles || []) {
          if (c.time < lastTime) continue;
          seriesRef.current.update(c);
          if (c.time === lastTime) known[known.length - 1] = c;
          else known.push(c);
        }
        setLive(true);
      } catch {
        if (!stopped) setLive(false);
      }
    };
    const id = setInterval(tick, LIVE_POLL_MS);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [symbol, tf, candles.length]);

  const getCandles = useCallback(() => candlesRef.current, []);

  return (
    <div className="flex flex-col h-dvh bg-white dark:bg-black pt-14 md:pt-0 overflow-hidden font-sans">
      <div className="flex shrink-0 items-center gap-3 px-3 md:px-6 h-14 border-b border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-black z-20">
        <div className="hidden md:flex w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 items-center justify-center border border-blue-500/20">
          <Activity className="w-4 h-4" />
        </div>
        <SymbolPicker variant="compact" value={symbol} onChange={(s) => { setSymbol(s); store('fn_chart_symbol', s); }} />
        <div className="flex items-center gap-0.5 overflow-x-auto">
          {TFS.map((t) => (
            <button
              key={t}
              onClick={() => { setTf(t); store('fn_chart_tf', t); }}
              className={`px-2 py-1 rounded-lg text-xs font-semibold ${tf === t ? 'bg-[#007aff] text-white' : 'text-neutral-600 dark:text-neutral-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.08]'}`}
            >
              {t}
            </button>
          ))}
        </div>
        <span className={`hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${live ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-neutral-500/10 text-neutral-500 border-neutral-500/20'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${live ? 'bg-green-500 animate-pulse' : 'bg-neutral-400'}`} />
          {live ? 'Live' : 'Delayed'}
        </span>
        <button
          onClick={() => setShowScript((v) => !v)}
          className={`ml-auto flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${showScript ? 'bg-[#007aff] text-white border-[#007aff]' : 'text-neutral-700 dark:text-neutral-200 border-black/[0.08] dark:border-white/[0.12] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'}`}
        >
          <Code2 className="w-4 h-4" /> Script
        </button>
        <div className="hidden md:block w-44 h-8 shrink-0 pointer-events-none" aria-hidden="true" />
      </div>

      <div className="flex flex-1 min-h-0 relative">
        <div className="relative flex-1 min-w-0">
          <div ref={boxRef} className="absolute inset-0" />
          {loading && <Loader2 className="absolute top-3 right-3 w-5 h-5 animate-spin text-neutral-400" />}
          {error && !loading && <p className="absolute inset-0 flex items-center justify-center px-6 text-sm text-neutral-500 text-center">{error}</p>}
        </div>
        {showScript && (
          <div className="max-md:absolute max-md:inset-0 max-md:z-20 md:contents">
            <Suspense fallback={null}>
              <ScriptPanel candles={candles} getCandles={getCandles} onApply={setOverlay} onClose={() => setShowScript(false)} />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
}
