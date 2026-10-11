import { useEffect, useRef } from 'react';
import { useTheme } from '../theme-provider';

const PALETTE = {
  dark: { bull: [16, 185, 129], bear: [239, 68, 68] },
  light: { bull: [21, 128, 61], bear: [185, 28, 28] },
};
const COUNT = 13;
const SPACING = 0.36;
const LIGHT = (() => {
  const v = [0.4, -0.7, 0.6];
  const l = Math.hypot(...v);
  return v.map((c) => c / l);
})();

const FACES = [
  [[0, 1, 2, 3], [0, 0, -1]],
  [[5, 4, 7, 6], [0, 0, 1]],
  [[4, 0, 3, 7], [-1, 0, 0]],
  [[1, 5, 6, 2], [1, 0, 0]],
  [[3, 2, 6, 7], [0, 1, 0]],
  [[4, 5, 1, 0], [0, -1, 0]],
];

let phase = 0;
const nextCandle = (prev) => {
  phase += 0.42;
  const open = prev ? prev.close : 0;
  const target = Math.sin(phase) * 0.85 + Math.sin(phase * 0.37) * 0.25;
  let close = open + (target - open) * 0.6 + (Math.random() - 0.5) * 0.3;
  if (Math.abs(close - open) < 0.08) close = open + (close >= open ? 0.08 : -0.08);
  return { open, close, high: Math.max(open, close) + 0.05 + Math.random() * 0.2, low: Math.min(open, close) - 0.05 - Math.random() * 0.2 };
};

const seed = () => {
  const out = [];
  for (let i = 0; i < COUNT; i += 1) out.push(nextCandle(out[i - 1]));
  return out;
};

// Pseudo-3D candles on a 2D canvas: no WebGL, adaptive frame rate, pauses off-screen.
export default function CandlestickScene() {
  const ref = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    const { bull: BULL, bear: BEAR } = PALETTE[theme];
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let candles = seed();
    let shift = 0;
    let lastAdd = 0;
    let raf = 0;
    let visible = true;
    let lastFrame = 0;
    let slow = 0;
    let minDelta = 1000 / 60;
    let dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = canvas;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    };
    resize();

    const render = (time) => {
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const yaw = Math.sin(time / 4200) * 0.55;
      const pitch = -0.28 + Math.sin(time / 6100) * 0.06;
      const cy = Math.cos(yaw);
      const sy = Math.sin(yaw);
      const cp = Math.cos(pitch);
      const sp = Math.sin(pitch);
      const scale = Math.min(w * 0.8, h * 1.1);
      const camZ = 3.4;
      const rot = ([x, y, z]) => {
        const x1 = x * cy + z * sy;
        const z1 = -x * sy + z * cy;
        return [x1, y * cp - z1 * sp, y * sp + z1 * cp];
      };
      const proj = ([x, y, z]) => {
        const k = scale / (camZ + z);
        return [w / 2 + x * k, h / 2 - y * k];
      };
      const span = (COUNT - 1) * SPACING;
      const boxes = candles.map((c, i) => {
        const x = i * SPACING - span / 2 - shift * SPACING;
        const center = rot([x, (c.open + c.close) / 2, 0]);
        return { c, x, depth: center[2] };
      }).sort((a, b) => b.depth - a.depth);

      boxes.forEach(({ c, x }) => {
        const bull = c.close >= c.open;
        const base = bull ? BULL : BEAR;
        const fadeEdge = Math.max(0, Math.min(1, 1.25 - Math.abs(x) / (span / 2)));
        if (fadeEdge <= 0) return;
        ctx.globalAlpha = fadeEdge;
        const wt = proj(rot([x, c.high, 0]));
        const wb = proj(rot([x, c.low, 0]));
        ctx.strokeStyle = `rgba(${base.join(',')},0.75)`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(wt[0], wt[1]);
        ctx.lineTo(wb[0], wb[1]);
        ctx.stroke();

        const top = Math.max(c.open, c.close);
        const bot = Math.min(c.open, c.close) - 0.015;
        const d = 0.09;
        const corners = [
          [x - d, bot, -d], [x + d, bot, -d], [x + d, top, -d], [x - d, top, -d],
          [x - d, bot, d], [x + d, bot, d], [x + d, top, d], [x - d, top, d],
        ].map(rot);
        FACES.forEach(([idx, n]) => {
          const rn = rot(n);
          const p0 = corners[idx[0]];
          if (rn[0] * p0[0] + rn[1] * p0[1] + rn[2] * (p0[2] + camZ) >= 0) return;
          const lit = 0.35 + 0.65 * Math.max(0, -(rn[0] * LIGHT[0] + rn[1] * LIGHT[1] + rn[2] * LIGHT[2]));
          const pts = idx.map((i) => proj(corners[i]));
          ctx.beginPath();
          pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
          ctx.closePath();
          ctx.fillStyle = `rgb(${base.map((v) => Math.round(v * lit)).join(',')})`;
          ctx.fill();
          if (n[2] === -1) {
            const g = ctx.createLinearGradient(pts[3][0], pts[3][1], pts[0][0], pts[0][1]);
            g.addColorStop(0, 'rgba(255,255,255,0.35)');
            g.addColorStop(0.45, 'rgba(255,255,255,0.05)');
            g.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = g;
            ctx.fill();
          }
        });
      });
      ctx.globalAlpha = 1;
    };

    const loop = (time) => {
      raf = requestAnimationFrame(loop);
      const delta = time - lastFrame;
      if (delta < minDelta - 1) return;
      if (lastFrame && delta > 40) slow += 1;
      else slow = Math.max(0, slow - 1);
      if (slow > 20 && minDelta < 30) {
        minDelta = 1000 / 30;
        dpr = 1;
        resize();
      }
      lastFrame = time;
      if (time - lastAdd > 1600) {
        lastAdd = time;
        candles = [...candles.slice(1), nextCandle(candles[candles.length - 1])];
        shift = -1;
      }
      shift = Math.min(0, shift + delta / 500);
      render(time);
    };

    const start = () => {
      if (!raf && visible && !document.hidden && !reduced) raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      lastFrame = 0;
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(canvas);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVis);
    const ro = new ResizeObserver(() => {
      resize();
      render(performance.now());
    });
    ro.observe(canvas);
    render(0);
    start();
    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [theme]);

  return <canvas ref={ref} aria-hidden="true" style={{ width: '100%', height: '100%', display: 'block' }} />;
}
