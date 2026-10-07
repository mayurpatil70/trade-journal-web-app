import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createChart } from 'lightweight-charts';
import {
  Play, Pause, StepForward, ChevronLeft, Loader2, SkipBack, Rewind, FastForward,
  SkipForward, BarChart2, Activity, ChevronRight, X,
} from 'lucide-react';
import SymbolPicker from '../components/SymbolPicker';
import { marketApi } from '../api/market';
import {
  createReplay, positionSize, validateOrder, stepReplay, placeOrder, closePosition,
  cancelPending, modifyPosition, openPnl, computeAnalytics, paginate,
} from '../utils/backtestEngine';

const TFS = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];
const SPEEDS = [
  { label: '1x', ms: 1000 }, { label: '2x', ms: 500 }, { label: '5x', ms: 200 },
  { label: '10x', ms: 100 }, { label: '25x', ms: 40 },
];
const RISKS = [0.5, 1, 2, 3];
const PAGE_SIZE = 10;
const LOAD_LIMIT = 2000;
const ALIASES = { BTCUSD: 'BTCUSDT', ETHUSD: 'ETHUSDT', SOLUSD: 'SOLUSDT', NQ1: 'NQ', ES1: 'ES', GOLD: 'XAUUSD' };

const loadSessions = () => {
  try {
    return JSON.parse(localStorage.getItem('backtest_sessions') || '[]');
  } catch {
    return [];
  }
};

const normalizePair = (pair) => {
  const key = String(pair || 'BTCUSDT').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return ALIASES[key] || key;
};

const countAtOrBefore = (candles, t) => {
  let lo = 0;
  let hi = candles.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (candles[mid].time <= t) lo = mid + 1;
    else hi = mid;
  }
  return lo;
};

const defaultStart = (len) => Math.max(Math.min(Math.floor(len * 0.6), len - 1), Math.min(len, 50));
const fmt = (n, d = 2) => (Number.isFinite(n) ? n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d }) : '-');
const priceDp = (p) => (p >= 1000 ? 2 : p >= 100 ? 3 : p >= 1 ? 4 : 6);
const fmtTime = (t) => (t ? new Date(t * 1000).toISOString().slice(0, 16).replace('T', ' ') : '-');
const num = (v) => (v === '' || v == null ? NaN : parseFloat(v));
const signed = (n, d = 2) => `${n >= 0 ? '+' : '-'}${fmt(Math.abs(n), d)}`;

function EquityCurve({ points }) {
  if (points.length < 2) return <div className="h-24 flex items-center justify-center text-[#787B86]">Equity curve appears after your first closed trade</div>;
  const ys = points.map((p) => p.equity);
  const min = Math.min(...ys);
  const max = Math.max(...ys);
  const span = max - min || 1;
  const path = points.map((p, i) => `${(i / (points.length - 1)) * 260},${86 - ((p.equity - min) / span) * 80}`).join(' ');
  return (
    <svg viewBox="0 0 260 90" className="w-full h-24">
      <polyline points={path} fill="none" stroke="#2962FF" strokeWidth="1.5" />
    </svg>
  );
}

const Stat = ({ label, value, tone }) => (
  <div className="bg-[#16181D] border border-[#222429] rounded p-2">
    <div className="text-[#787B86] mb-0.5">{label}</div>
    <div className={`font-mono font-semibold ${tone || 'text-[#D1D4DC]'}`}>{value}</div>
  </div>
);

export default function Backtest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const linesRef = useRef([]);
  const renderedRef = useRef({ candles: null, count: 0 });
  const candlesRef = useRef([]);
  const anchorTimeRef = useRef(null);

  const [session, setSession] = useState(null);
  const [symbol, setSymbol] = useState('');
  const [tf, setTf] = useState('1h');
  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [run, setRun] = useState({ index: 0, replay: createReplay(10000) });
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1);
  const [savedKey, setSavedKey] = useState(null);
  const [notice, setNotice] = useState('');

  const [tab, setTab] = useState('order');
  const [journalPage, setJournalPage] = useState(1);
  const [side, setSide] = useState('Buy');
  const [type, setType] = useState('Market');
  const [riskPct, setRiskPct] = useState(1);
  const [customRisk, setCustomRisk] = useState(false);
  const [balanceBase, setBalanceBase] = useState('initial');
  const [entry, setEntry] = useState('');
  const [sl, setSl] = useState('');
  const [tp, setTp] = useState('');
  const [openJournal, setOpenJournal] = useState(false);
  const [formError, setFormError] = useState('');
  const [editSl, setEditSl] = useState('');
  const [editTp, setEditTp] = useState('');

  const { replay, index } = run;
  const candle = candles[index - 1];
  const price = candle?.close;
  const finished = candles.length > 0 && index >= candles.length;

  useEffect(() => {
    const found = loadSessions().find((s) => s.id === id);
    const base = found ?? { id, name: `New Session ${new Date().toLocaleDateString()}`, pair: 'BTCUSDT', balance: 10000 };
    const initialBalance = base.initialBalance ?? base.balance;
    const sess = { ...base, initialBalance };
    anchorTimeRef.current = base.replayTime ?? null;
    setSession(sess);
    setRiskPct(base.riskPct ?? 1);
    setTf(base.tf || '1h');
    setRun({ index: 0, replay: base.replay ?? createReplay(initialBalance) });
    setSymbol(normalizePair(base.pair));
  }, [id]);

  useEffect(() => {
    if (!symbol) return undefined;
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    setPlaying(false);
    marketApi
      .candles({ symbol, tf, limit: LOAD_LIMIT })
      .then((res) => {
        if (cancelled) return;
        candlesRef.current = res.candles;
        setCandles(res.candles);
        setRun((r) => {
          const t = anchorTimeRef.current;
          let idx = t ? countAtOrBefore(res.candles, t) : 0;
          if (!idx) {
            idx = defaultStart(res.candles.length);
            if (t) setNotice(`Saved position is outside the ${tf} data range, restarted at a default point.`);
          }
          return { ...r, index: idx };
        });
      })
      .catch((e) => {
        if (cancelled) return;
        candlesRef.current = [];
        setCandles([]);
        setLoadError(e.response?.data?.error || 'Could not load market data.');
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [symbol, tf, reloadKey]);

  useEffect(() => {
    const el = chartContainerRef.current;
    const chart = createChart(el, {
      layout: { background: { type: 'solid', color: '#0A0B0D' }, textColor: '#787B86' },
      grid: { vertLines: { color: '#1B1C20' }, horzLines: { color: '#1B1C20' } },
      width: el.clientWidth,
      height: el.clientHeight,
      timeScale: { timeVisible: true, secondsVisible: false, borderColor: '#1B1C20' },
      rightPriceScale: { borderColor: '#1B1C20' },
      crosshair: { mode: 1, vertLine: { color: '#2B2D33' }, horzLine: { color: '#2B2D33' } },
    });
    seriesRef.current = chart.addCandlestickSeries({
      upColor: '#089981', downColor: '#F23645', borderVisible: false, wickUpColor: '#089981', wickDownColor: '#F23645',
      priceFormat: { type: 'price', precision: 5, minMove: 0.00001 },
    });
    chartRef.current = chart;
    const ro = new ResizeObserver(() => chart.applyOptions({ width: el.clientWidth, height: el.clientHeight }));
    ro.observe(el);
    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      linesRef.current = [];
      renderedRef.current = { candles: null, count: 0 };
    };
  }, []);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series || !candles.length) return;
    const r = renderedRef.current;
    if (r.candles === candles && index === r.count + 1) {
      series.update(candles[index - 1]);
    } else {
      const dp = priceDp(candles[Math.max(index - 1, 0)].close);
      series.applyOptions({ priceFormat: { type: 'price', precision: dp, minMove: 1 / 10 ** dp } });
      series.setData(candles.slice(0, index));
      chartRef.current.timeScale().setVisibleLogicalRange({ from: index - 120, to: index + 15 });
    }
    renderedRef.current = { candles, count: index };
  }, [candles, index]);

  const composing = !replay.position && !replay.pending;
  const entryNum = type === 'Market' ? price : num(entry);
  const slNum = num(sl);
  const tpNum = num(tp);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;
    linesRef.current.forEach((l) => series.removePriceLine(l));
    linesRef.current = [];
    const add = (p, color, title, lineStyle = 2) => {
      if (Number.isFinite(p)) linesRef.current.push(series.createPriceLine({ price: p, color, lineWidth: 1, lineStyle, title, axisLabelVisible: true }));
    };
    const o = replay.position ?? replay.pending;
    if (o) {
      add(o.entry, '#2962FF', replay.position ? 'Entry' : `${replay.pending.type} entry`, 0);
      add(o.sl, '#F23645', 'SL');
      add(o.tp, '#089981', 'TP');
    } else if (tab === 'order') {
      add(entryNum, '#2962FF', 'Entry', 0);
      add(slNum, '#F23645', 'SL');
      add(tpNum, '#089981', 'TP');
    }
  }, [replay.position, replay.pending, tab, entryNum, slNum, tpNum]);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series || !candles.length) return;
    const visible = candles.slice(0, index);
    const snap = (t) => {
      const i = countAtOrBefore(visible, t) - 1;
      return i >= 0 ? visible[i].time : null;
    };
    const marks = [];
    const mark = (t, shape, position, color, text) => {
      const time = snap(t);
      if (time !== null) marks.push({ time, shape, position, color, text });
    };
    const entryMark = (s, t) => (s === 'Buy' ? mark(t, 'arrowUp', 'belowBar', '#2962FF', 'Buy') : mark(t, 'arrowDown', 'aboveBar', '#2962FF', 'Sell'));
    replay.trades.forEach((t) => {
      entryMark(t.side, t.entryTime);
      mark(t.exitTime, 'circle', t.side === 'Buy' ? 'aboveBar' : 'belowBar', t.pnl >= 0 ? '#089981' : '#F23645', `${t.exitReason} ${signed(t.r)}R`);
    });
    if (replay.position) entryMark(replay.position.side, replay.position.entryTime);
    series.setMarkers(marks.sort((a, b) => a.time - b.time));
  }, [replay.trades, replay.position, candles, index]);

  const advance = useCallback((n) => {
    setRun((r) => {
      const all = candlesRef.current;
      let { index: i, replay: rp } = r;
      for (let k = 0; k < n && i < all.length; k += 1) {
        rp = stepReplay(rp, all[i]);
        i += 1;
      }
      return i === r.index ? r : { index: i, replay: rp };
    });
  }, []);

  useEffect(() => {
    if (!playing) return undefined;
    if (finished || loading) {
      setPlaying(false);
      return undefined;
    }
    const timer = setTimeout(() => advance(1), SPEEDS[speedIdx].ms);
    return () => clearTimeout(timer);
  }, [playing, index, finished, loading, speedIdx, advance]);

  const hasActivity = replay.trades.length > 0 || replay.position || replay.pending;

  const seek = (target) => {
    if (target < index) {
      if (hasActivity && !window.confirm('Going back resets your trades for this session. Continue?')) return;
      setRun({ index: target, replay: createReplay(replay.initialBalance) });
    } else {
      advance(target - index);
    }
  };

  const restart = () => seek(defaultStart(candles.length));

  const jumpToDate = (value) => {
    if (!value || !candles.length) return;
    const t = Math.floor(new Date(`${value}T00:00:00Z`).getTime() / 1000);
    const idx = countAtOrBefore(candles, t);
    if (idx < 1) setNotice(`No ${tf} data on or before ${value}. Earliest loaded: ${fmtTime(candles[0].time)} UTC.`);
    else seek(Math.max(idx, 1));
  };

  const changeTf = (next) => {
    anchorTimeRef.current = candle?.time ?? null;
    setNotice('');
    setTf(next);
  };

  const changeSymbol = (next) => {
    if (next === symbol) return;
    if (hasActivity && !window.confirm('Changing symbol resets trades for this session. Continue?')) return;
    anchorTimeRef.current = null;
    setNotice('');
    setRun({ index: 0, replay: createReplay(replay.initialBalance) });
    setSymbol(next);
  };

  const base = balanceBase === 'initial' ? replay.initialBalance : replay.balance;
  const units = positionSize({ balance: base, riskPct: Number(riskPct), entry: entryNum, sl: slNum });
  const estLoss = Number.isFinite(slNum) ? units * Math.abs(entryNum - slNum) : 0;
  const estProfit = Number.isFinite(tpNum) ? units * Math.abs(tpNum - entryNum) : 0;
  const rr = estLoss > 0 ? estProfit / estLoss : 0;

  const submitOrder = () => {
    if (!candle || finished) return;
    const order = { side, type, entry: entryNum, sl: slNum, tp: tpNum };
    const err = validateOrder({ ...order, price });
    if (err) return setFormError(err);
    if (!(units > 0)) return setFormError('Position size is zero. Check risk % and stop distance.');
    setFormError('');
    setRun((r) => ({ ...r, replay: placeOrder(r.replay, { ...order, units }, candle) }));
    setSl('');
    setTp('');
    setEntry('');
    if (openJournal) setTab('journal');
  };

  const autoTp = () => {
    if (!Number.isFinite(slNum) || !Number.isFinite(entryNum)) return;
    const d = Math.abs(entryNum - slNum) * 2;
    setTp((side === 'Buy' ? entryNum + d : entryNum - d).toFixed(priceDp(entryNum)));
  };

  const closeNow = () => setRun((r) => ({ ...r, replay: closePosition(r.replay, price, candle.time) }));
  const cancelOrder = () => setRun((r) => ({ ...r, replay: cancelPending(r.replay) }));

  const updateExits = () => {
    const p = replay.position;
    const newSl = num(editSl);
    const newTp = num(editTp);
    const err = validateOrder({ side: p.side, type: 'Market', entry: p.entry, sl: newSl, tp: newTp, price: p.entry });
    if (err) return setFormError(err);
    setFormError('');
    setRun((r) => ({ ...r, replay: modifyPosition(r.replay, { sl: newSl, tp: newTp }) }));
  };

  useEffect(() => {
    if (replay.position) {
      setEditSl(String(replay.position.sl));
      setEditTp(replay.position.tp == null ? '' : String(replay.position.tp));
    }
  }, [replay.position?.id]);

  const analytics = useMemo(() => computeAnalytics(replay.trades, replay.initialBalance), [replay.trades, replay.initialBalance]);
  const journal = useMemo(() => paginate([...replay.trades].reverse(), journalPage, PAGE_SIZE), [replay.trades, journalPage]);
  const livePnl = replay.position && price ? openPnl(replay.position, price) : 0;
  const equity = replay.balance + livePnl;

  const stateKey = `${symbol}|${tf}|${candle?.time}|${replay.trades.length}|${replay.position?.id}|${replay.pending?.id}|${riskPct}`;
  useEffect(() => {
    if (!loading && candles.length && savedKey === null) setSavedKey(stateKey);
  }, [loading, candles.length, savedKey, stateKey]);
  const dirty = savedKey !== null && savedKey !== stateKey;

  const saveSession = () => {
    const record = {
      ...session,
      pair: symbol,
      tf,
      balance: replay.balance,
      initialBalance: replay.initialBalance,
      riskPct,
      replayTime: candle?.time ?? null,
      replay,
      date: new Date().toLocaleString(),
    };
    const saved = loadSessions();
    const at = saved.findIndex((s) => s.id === id);
    if (at >= 0) saved[at] = record;
    else saved.unshift(record);
    localStorage.setItem('backtest_sessions', JSON.stringify(saved));
    setSession(record);
    setSavedKey(stateKey);
    setNotice('Session saved in this browser.');
  };

  const inputCls = 'w-full bg-[#0A0B0D] border border-[#222429] rounded p-2 text-white outline-none focus:border-[#2962FF] disabled:opacity-50';
  const tabBtn = (key, label, Icon) => (
    <button key={key} onClick={() => setTab(key)} className={`flex-1 flex flex-col items-center justify-center ${tab === key ? 'border-b-2 border-[#2962FF] text-[#2962FF] bg-[#1B1C20]/30' : 'hover:text-white'}`}>
      <Icon className="w-4 h-4 mb-1" /><span className="text-[9px]">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-screen bg-[#0A0B0D] text-[#D1D4DC] overflow-hidden font-sans text-xs fixed inset-0 z-[100]">
      <div className="h-12 border-b border-[#1B1C20] flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-1">
          <button onClick={() => navigate('/sessions')} className="p-1.5 hover:bg-[#1B1C20] rounded text-[#787B86] hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <SymbolPicker variant="compact" value={symbol} onChange={changeSymbol} />
          <div className="h-4 w-px bg-[#1B1C20] mx-2" />
          <select value={tf} onChange={(e) => changeTf(e.target.value)} className="bg-transparent text-[#D1D4DC] font-semibold px-2 py-1.5 rounded hover:bg-[#1B1C20] outline-none">
            {TFS.map((t) => <option key={t} value={t} className="bg-[#0A0B0D]">{t}</option>)}
          </select>
          <div className="h-4 w-px bg-[#1B1C20] mx-2" />
          <button onClick={() => setTab('analytics')} className="flex items-center gap-1 px-2 py-1.5 hover:bg-[#1B1C20] rounded text-[#787B86] hover:text-[#D1D4DC]">
            <BarChart2 className="w-4 h-4" /> Analytics
          </button>
        </div>
        <div className="flex items-center gap-3">
          {notice && (
            <span className="text-[#787B86] flex items-center gap-1 max-w-[320px] truncate" title={notice}>
              {notice}
              <button onClick={() => setNotice('')}><X className="w-3 h-3" /></button>
            </span>
          )}
          {dirty && <span className="text-amber-400">Unsaved changes</span>}
          <button onClick={saveSession} className="px-3 py-1 bg-[#2962FF] hover:bg-[#1E4CDB] text-white font-bold rounded text-xs">Save Session</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 relative overflow-hidden">
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#131418] border border-[#222429] rounded-full px-4 py-2 flex items-center gap-3 shadow-lg">
            <button title="Restart from default start" className="text-[#787B86] hover:text-white" onClick={restart}><SkipBack className="w-4 h-4" /></button>
            <button title="Slower" className="text-[#787B86] hover:text-white disabled:opacity-30" disabled={speedIdx === 0} onClick={() => setSpeedIdx((i) => i - 1)}><Rewind className="w-4 h-4" /></button>
            <button title={playing ? 'Pause' : 'Play'} disabled={finished || loading} className="text-[#2962FF] hover:text-white border border-[#2962FF]/30 p-1 rounded hover:bg-[#2962FF]/10 disabled:opacity-30" onClick={() => setPlaying((p) => !p)}>
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <button title="Step one bar" disabled={finished || loading} className="text-[#787B86] hover:text-white disabled:opacity-30" onClick={() => advance(1)}><StepForward className="w-4 h-4" /></button>
            <button title="Faster" className="text-[#787B86] hover:text-white disabled:opacity-30" disabled={speedIdx === SPEEDS.length - 1} onClick={() => setSpeedIdx((i) => i + 1)}><FastForward className="w-4 h-4" /></button>
            <button title="Forward 10 bars" disabled={finished || loading} className="text-[#787B86] hover:text-white disabled:opacity-30" onClick={() => advance(10)}><SkipForward className="w-4 h-4" /></button>
            <span className="text-[#D1D4DC] font-semibold font-mono w-8 text-center">{SPEEDS[speedIdx].label}</span>
            <input type="date" title="Jump to date" onChange={(e) => jumpToDate(e.target.value)} className="bg-[#0A0B0D] border border-[#222429] rounded px-1 py-0.5 text-[#D1D4DC]" />
          </div>

          <div ref={chartContainerRef} className="absolute inset-0 w-full h-full" />

          {(loading || loadError) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0A0B0D]/90 z-40">
              {loading ? <Loader2 className="w-8 h-8 animate-spin text-[#2962FF]" /> : (
                <>
                  <p className="text-[#F23645]">{loadError}</p>
                  <button onClick={() => setReloadKey((k) => k + 1)} className="px-3 py-1.5 bg-[#2962FF] text-white rounded font-semibold">Retry</button>
                </>
              )}
            </div>
          )}

          {finished && !loading && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-[#131418] border border-[#222429] rounded px-3 py-1.5 text-[#787B86]">End of loaded data. Try a higher timeframe for a longer history.</div>
          )}

          <div className="absolute bottom-0 right-0 z-20 bg-[#0A0B0D] border-t border-l border-[#1B1C20] px-3 py-1 font-mono text-[10px] text-[#787B86]">
            {candle ? `${fmtTime(candle.time)} UTC` : ''}
          </div>
        </div>

        <div className="w-[300px] border-l border-[#1B1C20] bg-[#101114] flex flex-col shrink-0 z-20 text-[11px]">
          <div className="flex h-12 border-b border-[#1B1C20] text-[#787B86]">
            {tabBtn('order', 'Order', Activity)}
            {tabBtn('journal', 'Journal', ChevronRight)}
            {tabBtn('analytics', 'Analytics', BarChart2)}
          </div>

          {tab === 'order' && (
            <>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="font-bold text-sm mb-4">{symbol} <span className="text-[#787B86] text-xs font-normal">{price ? fmt(price, priceDp(price)) : ''}</span></div>

                {replay.position && (
                  <div className="border border-[#222429] rounded p-3 mb-4 bg-[#131418]">
                    <div className="flex justify-between mb-2">
                      <span className={`font-bold ${replay.position.side === 'Buy' ? 'text-[#2962FF]' : 'text-[#F23645]'}`}>{replay.position.side} {fmt(replay.position.units, 4)}</span>
                      <span className={`font-mono ${livePnl >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}`}>{signed(livePnl)}</span>
                    </div>
                    <div className="text-[#787B86] mb-2">Entry {fmt(replay.position.entry, priceDp(replay.position.entry))}</div>
                    <div className="flex gap-2 mb-2">
                      <input type="number" value={editSl} onChange={(e) => setEditSl(e.target.value)} placeholder="SL" className={inputCls} />
                      <input type="number" value={editTp} onChange={(e) => setEditTp(e.target.value)} placeholder="TP" className={inputCls} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={updateExits} className="flex-1 py-1.5 border border-[#222429] rounded hover:border-[#787B86]">Update SL/TP</button>
                      <button onClick={closeNow} className="flex-1 py-1.5 bg-[#F23645] text-white rounded font-semibold">Close position</button>
                    </div>
                  </div>
                )}

                {replay.pending && (
                  <div className="border border-[#222429] rounded p-3 mb-4 bg-[#131418] flex items-center justify-between">
                    <span>{replay.pending.side} {replay.pending.type} @ {fmt(replay.pending.entry, priceDp(replay.pending.entry))}</span>
                    <button onClick={cancelOrder} className="px-2 py-1 border border-[#222429] rounded hover:border-[#F23645]">Cancel</button>
                  </div>
                )}

                {composing && (
                  <>
                    <div className="flex bg-[#16181D] rounded-md p-1 mb-4 border border-[#222429]">
                      <button onClick={() => setSide('Sell')} className={`flex-1 py-2 rounded font-semibold ${side === 'Sell' ? 'bg-[#F23645] text-white' : 'text-[#787B86] hover:text-white'}`}>Sell</button>
                      <button onClick={() => setSide('Buy')} className={`flex-1 py-2 rounded font-semibold ${side === 'Buy' ? 'bg-[#2962FF] text-white' : 'text-[#787B86] hover:text-white'}`}>Buy</button>
                    </div>

                    <div className="flex items-center gap-4 mb-4 text-[#787B86]">
                      {['initial', 'current'].map((b) => (
                        <label key={b} className="flex items-center gap-1.5 cursor-pointer">
                          <input type="radio" checked={balanceBase === b} onChange={() => setBalanceBase(b)} className="accent-[#2962FF]" />
                          {b === 'initial' ? 'Initial balance' : 'Current balance'}
                        </label>
                      ))}
                    </div>

                    <div className="mb-4">
                      <div className="text-[#787B86] mb-2">Risk per trade</div>
                      <div className="flex gap-1">
                        {RISKS.map((r) => (
                          <button key={r} onClick={() => { setRiskPct(r); setCustomRisk(false); }} className={`flex-1 py-1.5 rounded border ${!customRisk && riskPct === r ? 'border-[#2962FF] text-[#2962FF] bg-[#2962FF]/10' : 'border-[#222429] text-[#787B86] hover:border-[#787B86]'}`}>{r}%</button>
                        ))}
                        <button onClick={() => setCustomRisk(true)} className={`flex-1 py-1.5 rounded border ${customRisk ? 'border-[#2962FF] text-[#2962FF] bg-[#2962FF]/10' : 'border-[#222429] text-[#2962FF]'}`}>Custom</button>
                      </div>
                      {customRisk && <input type="number" min="0.01" step="0.1" value={riskPct} onChange={(e) => setRiskPct(e.target.value)} className={`${inputCls} mt-2`} />}
                    </div>

                    <div className="flex border-b border-[#222429] mb-4">
                      {['Market', 'Limit', 'Stop'].map((t) => (
                        <button key={t} onClick={() => { setType(t); setEntry(price ? price.toFixed(priceDp(price)) : ''); }} className={`flex-1 pb-2 font-semibold ${type === t ? 'text-white border-b-2 border-[#2962FF]' : 'text-[#787B86]'}`}>{t}</button>
                      ))}
                    </div>

                    <div className="flex gap-3 mb-3">
                      <div className="flex-1">
                        <div className="text-[#787B86] mb-1.5">Entry price</div>
                        <input type="number" disabled={type === 'Market'} value={type === 'Market' ? (price ?? '') : entry} onChange={(e) => setEntry(e.target.value)} className={inputCls} />
                      </div>
                      <div className="flex-1">
                        <div className="text-[#787B86] mb-1.5">Units (from risk)</div>
                        <input readOnly value={units > 0 ? Number(units.toFixed(4)) : ''} placeholder="Set stop loss" className={inputCls} />
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="text-[#787B86] mb-1.5">Stop loss price</div>
                      <input type="number" value={sl} onChange={(e) => setSl(e.target.value)} placeholder="Required" className={inputCls} />
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between text-[#787B86] mb-1.5">
                        <span>Take profit price</span>
                        <button onClick={autoTp} className="text-[#2962FF] font-semibold">Set 2R</button>
                      </div>
                      <input type="number" value={tp} onChange={(e) => setTp(e.target.value)} placeholder="Optional" className={inputCls} />
                    </div>

                    <div className="flex justify-between border-t border-b border-[#222429] py-3 mb-3">
                      <div><div className="text-[#787B86] mb-1">Est. loss</div><span className="text-[#F23645] font-mono">-{fmt(estLoss)}</span></div>
                      <div><div className="text-[#787B86] mb-1">Est. profit</div><span className="text-[#089981] font-mono">+{fmt(estProfit)}</span></div>
                      <div><div className="text-[#787B86] mb-1">R:R</div><span className="font-mono">1:{fmt(rr)}</span></div>
                    </div>
                    <p className="text-[#787B86] mb-2">P&L = price move x units. Spread, commission, swap and leverage are not simulated.</p>
                  </>
                )}
                {formError && <p className="text-[#F23645] mt-2">{formError}</p>}
              </div>

              {composing && (
                <div className="p-4 border-t border-[#1B1C20]">
                  <label className="flex items-center gap-2 mb-3 text-[#787B86] cursor-pointer">
                    <input type="checkbox" checked={openJournal} onChange={(e) => setOpenJournal(e.target.checked)} className="accent-[#2962FF]" />
                    Open journal after placing
                  </label>
                  <button onClick={submitOrder} disabled={!candle || finished || loading} className="w-full py-3 bg-[#2962FF] hover:bg-[#1E4CDB] text-white font-bold rounded disabled:opacity-50">Place order</button>
                </div>
              )}
            </>
          )}

          {tab === 'journal' && (
            <div className="flex-1 overflow-y-auto p-3">
              {journal.total === 0 && <p className="text-[#787B86] text-center mt-8">No closed trades yet.</p>}
              {journal.items.map((t) => (
                <div key={t.id} className="border border-[#222429] rounded p-2 mb-2 bg-[#131418]">
                  <div className="flex justify-between">
                    <span className={`font-bold ${t.side === 'Buy' ? 'text-[#2962FF]' : 'text-[#F23645]'}`}>#{t.id} {t.side}</span>
                    <span className={`font-mono ${t.pnl >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}`}>{signed(t.pnl)} ({signed(t.r)}R)</span>
                  </div>
                  <div className="text-[#787B86] mt-1">{fmt(t.entry, priceDp(t.entry))} to {fmt(t.exitPrice, priceDp(t.exitPrice))} · {t.exitReason}</div>
                  <div className="text-[#787B86]">{fmtTime(t.entryTime)} to {fmtTime(t.exitTime)}</div>
                </div>
              ))}
              {journal.pages > 1 && (
                <div className="flex items-center justify-between mt-2">
                  <button disabled={journal.page <= 1} onClick={() => setJournalPage(journal.page - 1)} className="px-2 py-1 border border-[#222429] rounded disabled:opacity-30">Prev</button>
                  <span className="text-[#787B86]">{journal.page} / {journal.pages}</span>
                  <button disabled={journal.page >= journal.pages} onClick={() => setJournalPage(journal.page + 1)} className="px-2 py-1 border border-[#222429] rounded disabled:opacity-30">Next</button>
                </div>
              )}
            </div>
          )}

          {tab === 'analytics' && (
            <div className="flex-1 overflow-y-auto p-3">
              <EquityCurve points={analytics.equityCurve} />
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Stat label="Net P&L" value={signed(analytics.netPnl)} tone={analytics.netPnl >= 0 ? 'text-[#089981]' : 'text-[#F23645]'} />
                <Stat label="Return" value={`${fmt(analytics.returnPct)}%`} />
                <Stat label="Trades" value={`${analytics.totalTrades} (${analytics.wins}W / ${analytics.losses}L)`} />
                <Stat label="Win rate" value={`${fmt(analytics.winRate * 100, 1)}%`} />
                <Stat label="Avg R" value={fmt(analytics.avgR)} />
                <Stat label="Total R" value={fmt(analytics.totalR)} />
                <Stat label="Expectancy (R)" value={fmt(analytics.expectancyR)} />
                <Stat label="Expectancy ($)" value={fmt(analytics.expectancy)} />
                <Stat label="Profit factor" value={Number.isFinite(analytics.profitFactor) ? fmt(analytics.profitFactor) : 'Infinity'} />
                <Stat label="Max drawdown" value={`${fmt(analytics.maxDrawdown)} (${fmt(analytics.maxDrawdownPct, 1)}%)`} />
                <Stat label="Avg win" value={fmt(analytics.avgWin)} />
                <Stat label="Avg loss" value={fmt(analytics.avgLoss)} />
                <Stat label="Best trade" value={fmt(analytics.bestTrade)} />
                <Stat label="Worst trade" value={fmt(analytics.worstTrade)} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="h-8 border-t border-[#1B1C20] flex items-center justify-between px-3 shrink-0">
        <div className="text-[#787B86]">{candles.length ? `${index} / ${candles.length} bars loaded` : ''}</div>
        <div className="flex items-center gap-4 font-mono">
          {replay.position && <span>Running P&L: <span className={livePnl >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}>{signed(livePnl)}</span></span>}
          <span className="text-[#787B86]">Balance <span className="text-white font-bold">${fmt(replay.balance)}</span></span>
          <span className="text-[#787B86]">Equity <span className="text-white font-bold">${fmt(equity)}</span></span>
        </div>
      </div>
    </div>
  );
}
