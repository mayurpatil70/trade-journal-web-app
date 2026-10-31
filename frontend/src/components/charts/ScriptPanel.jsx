import { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { Play, Loader2, X } from 'lucide-react';
import SymbolPicker from '../SymbolPicker';
import { marketApi } from '../../api/market';
import { runScript, SCRIPT_TEMPLATES } from '../../lib/scriptRunner';
import { useTheme } from '../theme-provider';

const TFS = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];
const STORE = 'fn_chart_script';
const read = (k, d) => {
  try {
    return localStorage.getItem(k) || d;
  } catch {
    return d;
  }
};
const write = (k, v) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* storage unavailable */
  }
};

export default function ScriptPanel({ onClose }) {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const [symbol, setSymbol] = useState(() => read(`${STORE}_symbol`, 'BTCUSDT'));
  const [tf, setTf] = useState(() => read(`${STORE}_tf`, '1h'));
  const [code, setCode] = useState(() => read(STORE, SCRIPT_TEMPLATES['EMA cross']));
  const [candles, setCandles] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const boxRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const linesRef = useRef([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    marketApi
      .candles({ symbol, tf, limit: 500 })
      .then((res) => {
        if (!cancelled) setCandles(res.candles || []);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load candles for this symbol.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [symbol, tf]);

  useEffect(() => {
    const el = boxRef.current;
    const chart = createChart(el, {
      layout: { background: { type: 'solid', color: dark ? '#000000' : '#ffffff' }, textColor: dark ? '#9aa1ad' : '#6b7280' },
      grid: { vertLines: { color: dark ? '#14161a' : '#f2f2f7' }, horzLines: { color: dark ? '#14161a' : '#f2f2f7' } },
      width: el.clientWidth,
      height: el.clientHeight,
      timeScale: { timeVisible: true, secondsVisible: false },
    });
    seriesRef.current = chart.addCandlestickSeries({
      upColor: '#34c759', downColor: '#ff3b30', borderVisible: false, wickUpColor: '#34c759', wickDownColor: '#ff3b30',
    });
    chartRef.current = chart;
    linesRef.current = [];
    const ro = new ResizeObserver(() => chart.resize(el.clientWidth, el.clientHeight));
    ro.observe(el);
    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [dark]);

  useEffect(() => {
    if (!seriesRef.current) return;
    seriesRef.current.setData(candles);
    seriesRef.current.setMarkers([]);
    setResult(null);
  }, [candles, dark]);

  const run = async () => {
    if (!candles.length) return;
    write(STORE, code);
    setError('');
    const res = await runScript(code, candles);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    const chart = chartRef.current;
    linesRef.current.forEach((s) => chart.removeSeries(s));
    linesRef.current = res.plots.map((p, n) => {
      const line = chart.addLineSeries({
        color: p.color || ['#0a84ff', '#ff9f0a', '#bf5af2', '#64d2ff'][n % 4], lineWidth: 2, priceLineVisible: false, lastValueVisible: false,
      });
      line.setData(p.values.map((v, i) => (v == null ? null : { time: candles[i].time, value: v })).filter(Boolean));
      return line;
    });
    const marks = res.signals
      .map((s) => ({
        time: candles[s.i].time,
        position: s.side === 'buy' ? 'belowBar' : 'aboveBar',
        shape: s.side === 'buy' ? 'arrowUp' : 'arrowDown',
        color: s.side === 'buy' ? '#34c759' : '#ff3b30',
        text: s.side === 'buy' ? 'Buy' : 'Sell',
      }))
      .sort((a, b) => a.time - b.time);
    seriesRef.current.setMarkers(marks);
    setResult({ signals: res.signals, log: res.log });
  };

  const fmtTime = (t) => new Date(t * 1000).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <aside className="flex flex-col w-full md:w-[420px] shrink-0 h-full border-l border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-black">
      <div className="flex items-center justify-between px-4 h-12 shrink-0 border-b border-black/[0.06] dark:border-white/[0.08]">
        <span className="text-sm font-bold text-neutral-900 dark:text-white">Script editor</span>
        <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-500 hover:bg-black/[0.05] dark:hover:bg-white/[0.08]" aria-label="Close script panel">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 border-b border-black/[0.06] dark:border-white/[0.08]">
        <SymbolPicker variant="compact" value={symbol} onChange={(s) => { setSymbol(s); write(`${STORE}_symbol`, s); }} />
        <select
          value={tf}
          onChange={(e) => { setTf(e.target.value); write(`${STORE}_tf`, e.target.value); }}
          className="text-xs rounded-lg px-2 py-1.5 bg-black/[0.04] dark:bg-white/[0.08] text-neutral-900 dark:text-white"
        >
          {TFS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value=""
          onChange={(e) => e.target.value && setCode(SCRIPT_TEMPLATES[e.target.value])}
          className="ml-auto text-xs rounded-lg px-2 py-1.5 bg-black/[0.04] dark:bg-white/[0.08] text-neutral-900 dark:text-white"
        >
          <option value="">Templates</option>
          {Object.keys(SCRIPT_TEMPLATES).map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="relative h-[34%] min-h-[180px] border-b border-black/[0.06] dark:border-white/[0.08]">
        <div ref={boxRef} className="absolute inset-0" />
        {loading && <Loader2 className="absolute top-2 right-2 w-4 h-4 animate-spin text-neutral-400" />}
      </div>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
        className="flex-1 min-h-[140px] resize-none p-3 font-mono text-[12px] leading-relaxed bg-neutral-50 dark:bg-[#0b0b0d] text-neutral-900 dark:text-neutral-100 outline-none"
      />

      <div className="shrink-0 border-t border-black/[0.06] dark:border-white/[0.08] p-3 space-y-2 max-h-[30%] overflow-y-auto">
        <button
          onClick={run}
          disabled={loading || !candles.length}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#007aff] hover:bg-[#0a84ff] disabled:opacity-50 text-white text-sm font-semibold"
        >
          <Play className="w-4 h-4" /> Run on chart
        </button>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {result && (
          <div className="text-xs text-neutral-600 dark:text-neutral-300 space-y-1">
            <p className="font-semibold">{result.signals.length} signals</p>
            {result.signals.slice(-12).reverse().map((s, n) => (
              <div key={n} className="flex justify-between">
                <span className={s.side === 'buy' ? 'text-[#34c759]' : 'text-[#ff3b30]'}>{s.side === 'buy' ? 'Buy' : 'Sell'}{s.text ? ` · ${s.text}` : ''}</span>
                <span>{fmtTime(candles[s.i].time)}</span>
              </div>
            ))}
            {result.log.map((l, n) => <p key={n} className="font-mono">{l}</p>)}
          </div>
        )}
        <p className="text-[11px] text-neutral-500">
          Scripts are JavaScript and run in your browser on this panel's candles. Signals show here, not on the TradingView chart.
        </p>
      </div>
    </aside>
  );
}
