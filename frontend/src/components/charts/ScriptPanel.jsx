import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Eraser, Trash2, X } from 'lucide-react';
import { runScript } from '../../lib/scriptRunner';

const STORE = 'fn_chart_script';
const read = () => {
  try {
    return localStorage.getItem(STORE) || '';
  } catch {
    return '';
  }
};

const fmtTime = (t) => new Date(t * 1000).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function ScriptPanel({ candles, getCandles, onApply, onClose }) {
  const [code, setCode] = useState(read);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
  const applied = useRef(false);

  const run = useCallback(async () => {
    const data = getCandles();
    if (!data.length || !code.trim()) return;
    try {
      localStorage.setItem(STORE, code);
    } catch {
      /* storage unavailable */
    }
    setRunning(true);
    setError('');
    const res = await runScript(code, data);
    setRunning(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    applied.current = true;
    setResult({ ...res, times: res.signals.map((s) => data[s.i].time) });
    onApply({ signals: res.signals, plots: res.plots });
  }, [code, getCandles, onApply]);

  useEffect(() => {
    if (applied.current) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candles]);

  const remove = () => {
    applied.current = false;
    setResult(null);
    setError('');
    onApply(null);
  };

  return (
    <aside className="flex flex-col w-full md:w-[380px] shrink-0 h-full border-l border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-black">
      <div className="flex items-center justify-between px-4 h-12 shrink-0 border-b border-black/[0.06] dark:border-white/[0.08]">
        <span className="text-sm font-bold text-neutral-900 dark:text-white">Script editor</span>
        <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-500 hover:bg-black/[0.05] dark:hover:bg-white/[0.08]" aria-label="Close script editor">
          <X className="w-4 h-4" />
        </button>
      </div>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
        placeholder={'// Write your indicator here, then press Add to chart.\n// data.close, data.high, data.low, data.open, data.time\n// ta.sma, ta.ema, ta.rsi, ta.highest, ta.lowest\n// ta.crossover(a, b), ta.crossunder(a, b)\n// signal(index, "buy" | "sell")\n// plot("name", values, "#0a84ff")'}
        className="flex-1 min-h-[160px] resize-none p-3 font-mono text-[12px] leading-relaxed bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 outline-none"
      />

      <div className="shrink-0 border-t border-black/[0.06] dark:border-white/[0.08] p-3 space-y-2 max-h-[40%] overflow-y-auto">
        <div className="flex gap-2">
          <button
            onClick={run}
            disabled={running || !candles.length || !code.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-[#007aff] hover:bg-[#0a84ff] disabled:opacity-50 text-white text-sm font-semibold"
          >
            <Play className="w-4 h-4" /> Add to chart
          </button>
          <button
            onClick={remove}
            disabled={!result}
            title="Remove from chart"
            aria-label="Remove from chart"
            className="px-3 rounded-xl bg-black/[0.05] dark:bg-white/[0.08] text-neutral-700 dark:text-neutral-200 disabled:opacity-40"
          >
            <Eraser className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCode('')}
            disabled={!code}
            title="Clear editor"
            aria-label="Clear editor"
            className="px-3 rounded-xl bg-black/[0.05] dark:bg-white/[0.08] text-neutral-700 dark:text-neutral-200 disabled:opacity-40"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {result && (
          <div className="text-xs text-neutral-600 dark:text-neutral-300 space-y-1">
            <p className="font-semibold">{result.signals.length} signals on this chart</p>
            {result.signals.slice(-10).reverse().map((s, n) => (
              <div key={n} className="flex justify-between">
                <span className={s.side === 'buy' ? 'text-[#34c759]' : 'text-[#ff3b30]'}>{s.side === 'buy' ? 'Buy' : 'Sell'}{s.text ? ` · ${s.text}` : ''}</span>
                <span>{fmtTime(result.times[result.times.length - 1 - n])}</span>
              </div>
            ))}
            {result.log.map((l, n) => <p key={n} className="font-mono">{l}</p>)}
          </div>
        )}
      </div>
    </aside>
  );
}
