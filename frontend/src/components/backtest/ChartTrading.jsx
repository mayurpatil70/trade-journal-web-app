import { useEffect, useRef, useState } from 'react';
import { openPnl } from '../../utils/backtestEngine';

const GRAB_PX = 14;
const BLUE = '#2962FF';
const RED = '#F23645';
const GREEN = '#089981';

const dp = (p) => (p >= 1000 ? 2 : p >= 100 ? 3 : p >= 1 ? 4 : 6);
const money = (n) => `${n >= 0 ? '+' : '-'}$${Math.abs(n).toFixed(2)}`;

function levelLabel(kind, p, position) {
  const dir = position.side === 'Buy' ? 1 : -1;
  const pnl = (p - position.entry) * dir * position.units;
  const risk = Math.abs(position.entry - position.initialSl) * position.units;
  const r = risk > 0 ? pnl / risk : 0;
  const pts = Math.abs(p - position.entry);
  return `${kind} ${p.toFixed(dp(p))} | ${money(pnl)} | ${r >= 0 ? '+' : ''}${r.toFixed(2)}R | ${pts.toFixed(dp(p) > 2 ? 2 : dp(p))} pts`;
}

export default function ChartTrading({ chartRef, seriesRef, containerRef, position, price, onModify, onClose }) {
  const [drag, setDrag] = useState(null);
  const [ys, setYs] = useState({});
  const [axisW, setAxisW] = useState(60);
  const [box, setBox] = useState({ left: 0, width: 0 });
  const dragRef = useRef(null);
  const linesRef = useRef([]);
  const posRef = useRef(position);
  useEffect(() => {
    posRef.current = position;
  }, [position]);

  const sl = drag?.kind === 'sl' ? drag.price : position?.sl;
  const tp = drag?.kind === 'tp' ? drag.price : position?.tp;

  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return undefined;
    linesRef.current.forEach((l) => series.removePriceLine(l));
    linesRef.current = [];
    if (!position) return undefined;
    const add = (p, color, title, lineStyle) => {
      if (Number.isFinite(p)) linesRef.current.push(series.createPriceLine({ price: p, color, lineWidth: 1, lineStyle, title, axisLabelVisible: true }));
    };
    const pnl = Number.isFinite(price) ? openPnl(position, price) : 0;
    add(position.entry, BLUE, `${position.side} ${position.units.toFixed(4)} | ${money(pnl)}`, 0);
    add(sl, RED, levelLabel('SL', sl, position), 2);
    add(tp, GREEN, levelLabel('TP', tp, position), 2);
    return () => {
      linesRef.current.forEach((l) => series.removePriceLine(l));
      linesRef.current = [];
    };
  }, [seriesRef, position, price, sl, tp]);

  useEffect(() => {
    if (!position) return undefined;
    let raf;
    const tick = () => {
      const series = seriesRef.current;
      const chart = chartRef.current;
      const el = containerRef.current;
      if (series && chart && el) {
        const y = (p) => (Number.isFinite(p) ? series.priceToCoordinate(p) : null);
        const next = { entry: y(posRef.current?.entry), sl: y(sl), tp: y(tp) };
        setYs((prev) => (['entry', 'sl', 'tp'].every((k) => Math.round(prev[k] ?? -1) === Math.round(next[k] ?? -1)) ? prev : next));
        const w = chart.priceScale('right').width();
        setAxisW((prev) => (prev === w ? prev : w));
        setBox((prev) => (prev.left === el.offsetLeft && prev.width === el.clientWidth ? prev : { left: el.offsetLeft, width: el.clientWidth }));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [chartRef, seriesRef, containerRef, position, sl, tp]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !position) return undefined;
    const series = () => seriesRef.current;
    const chart = () => chartRef.current;

    const pick = (clientY, clientX) => {
      const p = posRef.current;
      const s = series();
      if (!p || !s) return null;
      const rect = el.getBoundingClientRect();
      if (clientX > rect.right - chart().priceScale('right').width()) return null;
      const y = clientY - rect.top;
      const hit = [['sl', p.sl], ['tp', p.tp]]
        .map(([kind, v]) => ({ kind, d: Number.isFinite(v) ? Math.abs((s.priceToCoordinate(v) ?? -1e9) - y) : Infinity }))
        .filter((c) => c.d <= GRAB_PX)
        .sort((a, b) => a.d - b.d)[0];
      return hit?.kind ?? null;
    };

    const valid = (kind, v) => {
      const p = posRef.current;
      const buy = p.side === 'Buy';
      if (kind === 'sl') return buy ? v < p.entry : v > p.entry;
      return buy ? v > p.entry : v < p.entry;
    };

    const lock = (on) => chart().applyOptions({ handleScroll: !on, handleScale: !on });

    const onDown = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (e.target.closest?.('[data-trade-badge]')) return;
      const kind = pick(e.clientY, e.clientX);
      if (!kind) return;
      e.stopImmediatePropagation();
      e.preventDefault();
      lock(true);
      const start = posRef.current[kind];
      dragRef.current = { kind, price: start };
      setDrag({ kind, price: start });
    };

    const onMove = (e) => {
      const d = dragRef.current;
      if (!d) return;
      const rect = el.getBoundingClientRect();
      const v = series().coordinateToPrice(e.clientY - rect.top);
      if (v == null || !valid(d.kind, v)) return;
      dragRef.current = { ...d, price: v };
      setDrag({ kind: d.kind, price: v });
    };

    const onUp = () => {
      const d = dragRef.current;
      if (!d) return;
      dragRef.current = null;
      lock(false);
      setDrag(null);
      const p = posRef.current;
      onModify({ sl: d.kind === 'sl' ? d.price : p.sl, tp: d.kind === 'tp' ? d.price : p.tp });
    };

    const onTouchStart = (e) => {
      if (e.target.closest?.('[data-trade-badge]')) return;
      const t = e.touches[0];
      if (t && pick(t.clientY, t.clientX)) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    };

    el.addEventListener('pointerdown', onDown, true);
    el.addEventListener('touchstart', onTouchStart, { capture: true, passive: false });
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown, true);
      el.removeEventListener('touchstart', onTouchStart, true);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      if (dragRef.current) {
        dragRef.current = null;
        chart()?.applyOptions({ handleScroll: true, handleScale: true });
      }
    };
  }, [chartRef, seriesRef, containerRef, position, onModify]);

  if (!position) return null;

  const badge = (key, y, label, color, onClick, title) => (Number.isFinite(y) ? (
    <button
      key={key}
      data-trade-badge
      title={title}
      onClick={onClick}
      style={{ top: y - 10, right: axisW + 6, borderColor: color, color }}
      className="pointer-events-auto absolute h-5 px-1.5 rounded bg-popover/90 border text-[10px] font-bold leading-none hover:bg-accent"
    >
      {label}
    </button>
  ) : null);

  return (
    <div className="absolute top-0 bottom-0 z-30 pointer-events-none" style={{ left: box.left, width: box.width }}>
      {badge('close', ys.entry, '✕', BLUE, onClose, 'Close trade at market')}
      {Number.isFinite(sl) && badge('sl', ys.sl, '✕ SL', RED, () => onModify({ sl: undefined, tp: position.tp }), 'Cancel stop loss')}
      {Number.isFinite(tp) && badge('tp', ys.tp, '✕ TP', GREEN, () => onModify({ sl: position.sl, tp: undefined }), 'Cancel take profit')}
    </div>
  );
}
