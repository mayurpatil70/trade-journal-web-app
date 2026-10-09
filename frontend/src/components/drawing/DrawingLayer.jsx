import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import DrawingToolbar from './DrawingToolbar';
import DrawingSettings from './DrawingSettings';
import { renderDrawing, renderHandles, renderAxisLabels, handlePos } from './render';
import { TOOLS, styleFor, parseTool, uid } from './tools';

const HIT_TOL = 6;
const HISTORY_MAX = 100;
const POSITION = new Set(['long', 'short', 'rr']);

const fmtTime = (t) => new Date(t * 1000).toISOString().slice(0, 16).replace('T', ' ');

const distSeg = (px, py, x1, y1, x2, y2) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  const k = l2 ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l2)) : 0;
  return Math.hypot(px - (x1 + k * dx), py - (y1 + k * dy));
};

const inPoly = (x, y, pts) => {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i, i += 1) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

const hitPrims = (prims, x, y) => prims.some((p) => {
  switch (p[0]) {
    case 's': return distSeg(x, y, p[1], p[2], p[3], p[4]) <= HIT_TOL + (p[5] || 0);
    case 'r': return x >= p[1] - 3 && x <= p[1] + p[3] + 3 && y >= p[2] - 3 && y <= p[2] + p[4] + 3;
    case 'p': return p[1].length > 2 && inPoly(x, y, p[1]);
    case 'e': return p[3] > 0 && p[4] > 0 && ((x - p[1]) / p[3]) ** 2 + ((y - p[2]) / p[4]) ** 2 <= 1.1;
    default: return false;
  }
});

const collector = () => {
  const prims = [];
  return {
    prims,
    seg: (x1, y1, x2, y2, tol = 0) => prims.push(['s', x1, y1, x2, y2, tol]),
    rect: (x, y, w, h) => prims.push(['r', x, y, w, h]),
    poly: (pts) => prims.push(['p', pts]),
    ellipse: (cx, cy, rx, ry) => prims.push(['e', cx, cy, rx, ry]),
  };
};

const isTyping = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);

export default function DrawingLayer({ chartRef, seriesRef, containerRef, candles, drawings, onChange, readOnly, resetKey }) {
  const [tool, setToolState] = useState('cursor');
  const [selected, setSelected] = useState([]);
  const [hiddenAll, setHiddenAll] = useState(false);
  const [lockedAll, setLockedAll] = useState(false);
  const [hist, setHist] = useState({ undo: 0, redo: 0 });
  const [barOpen, setBarOpen] = useState(() => window.innerWidth >= 768);
  const [focusText, setFocusText] = useState(null);

  const canvasRef = useRef(null);
  const dRef = useRef(drawings || []);
  const candlesRef = useRef(candles);
  const toolRef = useRef(tool);
  const selRef = useRef(selected);
  const flagsRef = useRef({ hiddenAll, lockedAll, readOnly });
  const historyRef = useRef({ past: [], future: [] });
  const placingRef = useRef(null);
  const dragRef = useRef(null);
  const blockRef = useRef(false);
  const hitsRef = useRef(new Map());
  const dirtyRef = useRef(true);
  const sigRef = useRef('');
  const clipRef = useRef(null);
  const onChangeRef = useRef(onChange);

  useLayoutEffect(() => {
    candlesRef.current = candles;
    toolRef.current = tool;
    selRef.current = selected;
    flagsRef.current = { hiddenAll, lockedAll, readOnly };
    onChangeRef.current = onChange;
  });

  const redraw = () => {
    dirtyRef.current = true;
  };

  useEffect(() => {
    if (drawings !== dRef.current) {
      dRef.current = drawings || [];
      redraw();
    }
  }, [drawings]);

  useEffect(() => {
    historyRef.current = { past: [], future: [] };
    setHist({ undo: 0, redo: 0 });
    setSelected([]);
    placingRef.current = null;
    redraw();
  }, [resetKey]);

  useEffect(redraw, [candles, selected, hiddenAll]);

  const setTool = useCallback((t) => {
    placingRef.current = null;
    setToolState(t);
    redraw();
  }, []);

  const syncHist = () => setHist({ undo: historyRef.current.past.length, redo: historyRef.current.future.length });

  const commit = useCallback((next, before = dRef.current) => {
    const h = historyRef.current;
    h.past.push(before);
    if (h.past.length > HISTORY_MAX) h.past.shift();
    h.future = [];
    dRef.current = next;
    onChangeRef.current?.(next);
    syncHist();
    redraw();
  }, []);

  const undo = useCallback(() => {
    const h = historyRef.current;
    if (!h.past.length) return;
    h.future.push(dRef.current);
    dRef.current = h.past.pop();
    onChangeRef.current?.(dRef.current);
    setSelected((s) => s.filter((id) => dRef.current.some((d) => d.id === id)));
    syncHist();
    redraw();
  }, []);

  const redo = useCallback(() => {
    const h = historyRef.current;
    if (!h.future.length) return;
    h.past.push(dRef.current);
    dRef.current = h.future.pop();
    onChangeRef.current?.(dRef.current);
    syncHist();
    redraw();
  }, []);

  const buildView = useCallback(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    const el = containerRef.current;
    const cs = candlesRef.current;
    if (!chart || !series || !el || !cs?.length) return null;
    const ts = chart.timeScale();
    const n = cs.length;
    const iv = n > 1 ? cs[n - 1].time - cs[n - 2].time : 60;
    const logical = (t) => {
      if (t <= cs[0].time) return (t - cs[0].time) / iv;
      if (t >= cs[n - 1].time) return n - 1 + (t - cs[n - 1].time) / iv;
      let lo = 0;
      let hi = n - 1;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (cs[mid].time <= t) lo = mid;
        else hi = mid;
      }
      return lo + (t - cs[lo].time) / (cs[hi].time - cs[lo].time);
    };
    const timeAt = (l) => {
      if (l <= 0) return cs[0].time + l * iv;
      if (l >= n - 1) return cs[n - 1].time + (l - (n - 1)) * iv;
      const i = Math.floor(l);
      return cs[i].time + (l - i) * (cs[i + 1].time - cs[i].time);
    };
    const lx = (l) => ts.logicalToCoordinate(l);
    let fmt;
    try {
      fmt = series.priceFormatter();
    } catch {
      fmt = { format: (p) => p.toFixed(2) };
    }
    return {
      W: ts.width(),
      H: el.clientHeight - ts.height(),
      axisW: el.clientWidth - ts.width(),
      logical,
      timeAt,
      lx,
      x: (t) => lx(logical(t)),
      y: (p) => series.priceToCoordinate(p),
      price: (p) => fmt.format(p),
      time: fmtTime,
      toPoint: (x, y, snap) => {
        let l = ts.coordinateToLogical(x);
        const p = series.coordinateToPrice(y);
        if (l == null || p == null) return null;
        if (snap) l = Math.round(l);
        return { t: timeAt(l), p };
      },
      toLogical: (x) => ts.coordinateToLogical(x),
      toPrice: (y) => series.coordinateToPrice(y),
    };
  }, [chartRef, seriesRef, containerRef]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const el = containerRef.current;
    if (!canvas || !el) return;
    const dpr = window.devicePixelRatio || 1;
    const cw = el.clientWidth;
    const ch = el.clientHeight;
    if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      canvas.style.width = `${cw}px`;
      canvas.style.height = `${ch}px`;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);
    hitsRef.current = new Map();
    const v = buildView();
    if (!v) return;
    const sel = new Set(selRef.current);
    const placing = placingRef.current?.d;
    const list = flagsRef.current.hiddenAll ? [] : dRef.current.filter((d) => !d.hidden);
    if (placing) list.push(placing);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, v.W, v.H);
    ctx.clip();
    list.forEach((d) => {
      const hit = collector();
      renderDrawing(ctx, d, v, hit);
      hitsRef.current.set(d.id, hit.prims);
    });
    list.forEach((d) => (sel.has(d.id) || d === placing) && renderHandles(ctx, d, v));
    ctx.restore();
    list.forEach((d) => renderAxisLabels(ctx, d, v, sel.has(d.id) || d === placing));
  }, [buildView, containerRef]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const canvas = document.createElement('canvas');
    Object.assign(canvas.style, { position: 'absolute', left: '0', top: '0', pointerEvents: 'none', zIndex: '3' });
    el.appendChild(canvas);
    canvasRef.current = canvas;
    let raf;
    const loop = () => {
      const chart = chartRef.current;
      const series = seriesRef.current;
      if (chart && series) {
        const r = chart.timeScale().getVisibleLogicalRange();
        const sig = `${r?.from},${r?.to},${series.coordinateToPrice(0)},${series.coordinateToPrice(100)},${el.clientWidth},${el.clientHeight}`;
        if (dirtyRef.current || sig !== sigRef.current) {
          sigRef.current = sig;
          dirtyRef.current = false;
          draw();
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      canvas.remove();
      canvasRef.current = null;
    };
  }, [containerRef, chartRef, seriesRef, draw]);

  const hitTest = useCallback((x, y, v) => {
    const list = dRef.current;
    const sel = new Set(selRef.current);
    for (let i = list.length - 1; i >= 0; i -= 1) {
      const d = list[i];
      if (!sel.has(d.id) || d.hidden) continue;
      const hs = handlePos(d, v);
      const h = hs.findIndex((p) => p && Math.hypot(p[0] - x, p[1] - y) <= 8);
      if (h >= 0) return { id: d.id, handle: h };
    }
    for (let i = list.length - 1; i >= 0; i -= 1) {
      const prims = hitsRef.current.get(list[i].id);
      if (prims && hitPrims(prims, x, y)) return { id: list[i].id };
    }
    return null;
  }, []);

  const finalize = useCallback((d) => {
    placingRef.current = null;
    commit([...dRef.current, d]);
    setSelected([d.id]);
    setToolState('cursor');
    if (['text', 'callout', 'pricelabel'].includes(d.type)) setFocusText(d.id);
  }, [commit]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || readOnly) return undefined;

    const local = (e) => {
      const r = el.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const block = (e) => {
      blockRef.current = true;
      e.preventDefault();
      e.stopPropagation();
    };

    const onDown = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const v = buildView();
      if (!v) return;
      const { x, y } = local(e);
      const placing = placingRef.current;
      if (placing) {
        block(e);
        placing.downFresh = false;
        return;
      }
      if (x > v.W || y > v.H) return;
      const t = toolRef.current;
      if (t !== 'cursor') {
        block(e);
        const { type, kind } = parseTool(t);
        const def = TOOLS[type];
        const pt = v.toPoint(x, y, def.n > 0);
        if (!pt) return;
        const style = styleFor(type);
        if (kind) style.kind = kind;
        const d = { id: uid(), type, style, points: [pt] };
        if (def.n === 0) {
          placingRef.current = { d, free: true, last: [x, y] };
        } else if (def.n === 1) {
          if (type === 'long' || type === 'short') {
            const span = Math.abs(v.toPrice(y - 40) - pt.p) || pt.p * 0.005;
            const t1 = v.timeAt(Math.round(v.logical(pt.t)) + 25);
            const dir = type === 'long' ? 1 : -1;
            d.points = [pt, { t: t1, p: pt.p - dir * span }, { t: t1, p: pt.p + dir * span * 2 }];
          }
          finalize(d);
        } else {
          d.points.push({ ...pt });
          placingRef.current = { d, fixed: 1, downFresh: true, down: [x, y] };
        }
        redraw();
        return;
      }
      const hit = hitTest(x, y, v);
      if (!hit) {
        if (selRef.current.length && !e.shiftKey) setSelected([]);
        return;
      }
      block(e);
      let sel = selRef.current;
      if (e.shiftKey) sel = sel.includes(hit.id) ? sel.filter((s) => s !== hit.id) : [...sel, hit.id];
      else if (!sel.includes(hit.id)) sel = [hit.id];
      setSelected(sel);
      selRef.current = sel;
      if (flagsRef.current.lockedAll) return;
      const movable = dRef.current.filter((d) => sel.includes(d.id) && !d.locked);
      if (!movable.length) return;
      if (hit.handle != null && dRef.current.find((d) => d.id === hit.id)?.locked) return;
      dragRef.current = {
        handle: hit.handle,
        id: hit.id,
        before: dRef.current,
        start: new Map(movable.map((d) => [d.id, d.points])),
        l0: v.toLogical(x),
        p0: v.toPrice(y),
        moved: false,
      };
    };

    const onMove = (e) => {
      const placing = placingRef.current;
      const drag = dragRef.current;
      const v = (placing || drag || toolRef.current === 'cursor') && buildView();
      if (!v) return;
      const { x, y } = local(e);
      if (placing) {
        const pts = placing.d.points;
        if (placing.free) {
          if (!blockRef.current) return;
          if (Math.hypot(x - placing.last[0], y - placing.last[1]) < 2) return;
          const pt = v.toPoint(x, y, false);
          if (pt) pts.push(pt);
          placing.last = [x, y];
        } else {
          const pt = v.toPoint(x, y, true);
          if (!pt) return;
          if (POSITION.has(placing.d.type) && placing.fixed === 2) {
            pts[1] = { ...pts[1], t: pt.t };
            pts[2] = pt;
          } else pts[placing.fixed] = pt;
        }
        redraw();
        return;
      }
      if (drag) {
        e.preventDefault();
        drag.moved = true;
        if (drag.handle != null) {
          const d = dRef.current.find((dd) => dd.id === drag.id);
          const pt = d && v.toPoint(x, y, true);
          if (!pt) return;
          const pts = drag.start.get(d.id).map((p) => ({ ...p }));
          const i = drag.handle;
          if (d.type === 'hline') pts[0].p = pt.p;
          else if (d.type === 'vline') pts[0].t = pt.t;
          else if (POSITION.has(d.type) && i > 0) {
            pts[i].p = pt.p;
            pts[1].t = pt.t;
            pts[2].t = pt.t;
          } else pts[i] = pt;
          dRef.current = dRef.current.map((dd) => (dd.id === d.id ? { ...dd, points: pts } : dd));
        } else {
          const l = v.toLogical(x);
          const p = v.toPrice(y);
          if (l == null || p == null || drag.l0 == null) return;
          const dl = Math.round(l - drag.l0);
          const dp = p - drag.p0;
          dRef.current = dRef.current.map((d) => {
            const start = drag.start.get(d.id);
            if (!start) return d;
            return { ...d, points: start.map((pt) => ({ t: v.timeAt(v.logical(pt.t) + dl), p: pt.p + dp })) };
          });
        }
        redraw();
        return;
      }
      if (e.pointerType === 'mouse') {
        const over = x <= v.W && y <= v.H && hitTest(x, y, v);
        el.classList.toggle('dl-hover', !!over);
      }
    };

    const onUp = (e) => {
      const placing = placingRef.current;
      if (placing) {
        if (placing.free) {
          if (blockRef.current) finalize(placing.d);
        } else {
          const { x, y } = local(e);
          if (placing.downFresh && Math.hypot(x - placing.down[0], y - placing.down[1]) < 5) {
            placing.downFresh = false;
          } else {
            placing.downFresh = false;
            placing.fixed += 1;
            if (placing.fixed >= TOOLS[placing.d.type].n) finalize(placing.d);
            else placing.d.points.push({ ...placing.d.points[placing.fixed - 1] });
          }
        }
      }
      const drag = dragRef.current;
      if (drag) {
        dragRef.current = null;
        if (drag.moved) commit(dRef.current, drag.before);
      }
      blockRef.current = false;
    };

    const swallow = (e) => {
      if (blockRef.current || placingRef.current) {
        e.stopPropagation();
        if (e.cancelable && e.type === 'touchstart') e.preventDefault();
      }
    };

    el.addEventListener('pointerdown', onDown, true);
    el.addEventListener('mousedown', swallow, true);
    el.addEventListener('touchstart', swallow, { capture: true, passive: false });
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown, true);
      el.removeEventListener('mousedown', swallow, true);
      el.removeEventListener('touchstart', swallow, { capture: true });
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [containerRef, readOnly, buildView, hitTest, finalize, commit]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.classList.toggle('dl-drawing', tool !== 'cursor' && !readOnly);
    el.style.touchAction = tool !== 'cursor' ? 'none' : '';
  }, [tool, readOnly, containerRef]);

  const update = useCallback((ids, fn) => {
    commit(dRef.current.map((d) => (ids.includes(d.id) ? fn(d) : d)));
  }, [commit]);

  const remove = useCallback((ids) => {
    commit(dRef.current.filter((d) => !ids.includes(d.id)));
    setSelected([]);
  }, [commit]);

  const clone = useCallback((src) => {
    const v = buildView();
    const copies = src.map((d) => ({
      ...structuredClone(d),
      id: uid(),
      locked: false,
      points: d.points.map((pt) => ({ t: v ? v.timeAt(v.logical(pt.t) + 5) : pt.t, p: pt.p })),
    }));
    commit([...dRef.current, ...copies]);
    setSelected(copies.map((d) => d.id));
  }, [buildView, commit]);

  useEffect(() => {
    if (readOnly) return undefined;
    const onKey = (e) => {
      if (isTyping(document.activeElement)) return;
      const mod = e.ctrlKey || e.metaKey;
      const sel = selRef.current;
      const k = e.key.toLowerCase();
      if (e.key === 'Escape') {
        if (placingRef.current) placingRef.current = null;
        setToolState('cursor');
        setSelected([]);
        redraw();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && sel.length) {
        e.preventDefault();
        remove(sel);
      } else if (mod && k === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (mod && (k === 'y' || (k === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      } else if (mod && k === 'c' && sel.length) {
        clipRef.current = dRef.current.filter((d) => sel.includes(d.id));
      } else if (mod && k === 'v' && clipRef.current?.length) {
        e.preventDefault();
        clone(clipRef.current);
      } else if (mod && k === 'd' && sel.length) {
        e.preventDefault();
        clone(dRef.current.filter((d) => sel.includes(d.id)));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [readOnly, undo, redo, remove, clone]);

  if (readOnly) return null;

  const all = drawings || [];
  const selDrawings = all.filter((d) => selected.includes(d.id));

  return (
    <>
      <div className={`absolute left-0 top-0 bottom-0 z-50 ${barOpen ? '' : 'hidden'} md:block`}>
        <DrawingToolbar
          tool={tool}
          setTool={setTool}
          undo={undo}
          redo={redo}
          canUndo={hist.undo > 0}
          canRedo={hist.redo > 0}
          hidden={hiddenAll}
          toggleHidden={() => {
            if (hiddenAll && all.some((d) => d.hidden)) commit(all.map((d) => ({ ...d, hidden: false })));
            setHiddenAll(!hiddenAll);
          }}
          locked={lockedAll}
          toggleLocked={() => setLockedAll(!lockedAll)}
          clearAll={() => remove(all.map((d) => d.id))}
          count={all.length}
        />
      </div>
      <button
        onClick={() => setBarOpen(!barOpen)}
        title={barOpen ? 'Hide drawing tools' : 'Drawing tools'}
        className={`md:hidden absolute bottom-10 z-30 p-1.5 rounded-r-md bg-[#16181D] border border-[#222429] border-l-0 text-[#787B86] ${barOpen ? 'left-11' : 'left-0'}`}
      >
        {barOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
      </button>
      {selDrawings.length > 0 && (
        <DrawingSettings
          key={selected.join()}
          drawings={selDrawings}
          focusText={focusText}
          onFocused={() => setFocusText(null)}
          onStyle={(patch) => update(selected, (d) => ({ ...d, style: { ...d.style, ...patch } }))}
          onPatch={(patch) => update(selected, (d) => ({ ...d, ...patch }))}
          onDelete={() => remove(selected)}
          onDuplicate={() => clone(selDrawings)}
          onClose={() => setSelected([])}
        />
      )}
    </>
  );
}
