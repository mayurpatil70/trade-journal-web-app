import { useEffect, useRef } from 'react';

// Vibrant neon-electric trading palette: high saturation, never muddy or washed out
const BULL = [16, 215, 140]; // Electric Emerald
const BEAR = [255, 59, 92];   // Vibrant Crimson Ruby

const COUNT = 14;
const SPACING = 0.34;
const LIGHT = (() => {
  const v = [0.5, -0.65, 0.58];
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

// Pseudo-3D candles on a 2D canvas: continuous fluid motion, live micro-ticks, glossy crystal finish
export default function CandlestickScene() {
  const ref = useRef(null);
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const nextCandle = (prev) => {
      phaseRef.current += 0.38;
      const ph = phaseRef.current;
      const open = prev ? prev.close : 0;
      const target = Math.sin(ph) * 0.8 + Math.sin(ph * 0.43) * 0.3;
      let close = open + (target - open) * 0.55 + (Math.random() - 0.5) * 0.25;
      if (Math.abs(close - open) < 0.09) close = open + (close >= open ? 0.09 : -0.09);
      const high = Math.max(open, close) + 0.06 + Math.random() * 0.18;
      const low = Math.min(open, close) - 0.06 - Math.random() * 0.18;
      return { open, close, baseClose: close, high, low };
    };

    const seed = () => {
      const out = [];
      for (let i = 0; i < COUNT; i += 1) out.push(nextCandle(out[i - 1]));
      return out;
    };

    let candles = seed();
    let shiftProgress = 1; // 0 to 1
    let lastAdd = performance.now();
    let raf = 0;
    let visible = true;
    let lastFrame = performance.now();
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

      // Continuous organic camera breathing so scene is always alive
      const yaw = Math.sin(time / 3600) * 0.52 + Math.cos(time / 6200) * 0.12;
      const pitch = -0.27 + Math.sin(time / 4800) * 0.08;
      const cy = Math.cos(yaw);
      const sy = Math.sin(yaw);
      const cp = Math.cos(pitch);
      const sp = Math.sin(pitch);
      const scale = Math.min(w * 0.85, h * 1.15);
      const camZ = 3.35;

      const rot = ([x, y, z]) => {
        const x1 = x * cy + z * sy;
        const z1 = -x * sy + z * cy;
        return [x1, y * cp - z1 * sp, y * sp + z1 * cp];
      };

      const proj = ([x, y, z]) => {
        const k = scale / (camZ + z);
        return [w / 2 + x * k, h / 2 - y * k];
      };

      // Smooth cubic easing for candle step transition
      const smoothShift = shiftProgress < 1
        ? (1 - Math.pow(1 - shiftProgress, 2.5)) - 1
        : 0;

      const span = (COUNT - 1) * SPACING;

      // Active live tick on newest candle: realistic subtle market pulse
      const liveCandle = candles[candles.length - 1];
      if (liveCandle) {
        const tick = Math.sin(time / 220) * 0.05 + Math.sin(time / 440) * 0.03;
        liveCandle.close = liveCandle.baseClose + tick;
        liveCandle.high = Math.max(liveCandle.high, liveCandle.close + 0.04);
        liveCandle.low = Math.min(liveCandle.low, liveCandle.close - 0.04);
      }

      // Depth sort boxes
      const boxes = candles.map((c, i) => {
        const x = i * SPACING - span / 2 - smoothShift * SPACING;
        const center = rot([x, (c.open + c.close) / 2, 0]);
        return { c, x, depth: center[2], index: i };
      }).sort((a, b) => b.depth - a.depth);

      // 1. Draw soft floor shadow reflections
      boxes.forEach(({ x }) => {
        const fadeEdge = Math.max(0, Math.min(1, 1.3 - Math.abs(x) / (span / 2)));
        if (fadeEdge <= 0) return;
        const floorPt = proj(rot([x, -1.1, 0]));
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(floorPt[0], floorPt[1], 14 * (scale / 400), 4 * (scale / 400), 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 0, 0, ${0.12 * fadeEdge})`;
        ctx.fill();
        ctx.restore();
      });

      // 2. Draw 3D Candlesticks with rich lighting & glossy bevels
      boxes.forEach(({ c, x, index }) => {
        const bull = c.close >= c.open;
        const base = bull ? BULL : BEAR;
        const fadeEdge = Math.max(0, Math.min(1, 1.25 - Math.abs(x) / (span / 2)));
        if (fadeEdge <= 0) return;

        ctx.globalAlpha = fadeEdge;

        // Wick
        const wt = proj(rot([x, c.high, 0]));
        const wb = proj(rot([x, c.low, 0]));
        ctx.strokeStyle = `rgb(${base.join(',')})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(wt[0], wt[1]);
        ctx.lineTo(wb[0], wb[1]);
        ctx.stroke();

        // Candle Body Box
        const top = Math.max(c.open, c.close);
        const bot = Math.min(c.open, c.close) - 0.02;
        const d = 0.095;
        const corners = [
          [x - d, bot, -d], [x + d, bot, -d], [x + d, top, -d], [x - d, top, -d],
          [x - d, bot, d], [x + d, bot, d], [x + d, top, d], [x - d, top, d],
        ].map(rot);

        FACES.forEach(([idx, n]) => {
          const rn = rot(n);
          const p0 = corners[idx[0]];
          if (rn[0] * p0[0] + rn[1] * p0[1] + rn[2] * (p0[2] + camZ) >= 0) return;

          // High ambient lighting floor (0.65) ensures faces never look muddy or faint in light mode
          const lit = 0.65 + 0.35 * Math.max(0, -(rn[0] * LIGHT[0] + rn[1] * LIGHT[1] + rn[2] * LIGHT[2]));
          const pts = idx.map((i) => proj(corners[i]));

          ctx.beginPath();
          pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
          ctx.closePath();
          ctx.fillStyle = `rgb(${base.map((v) => Math.min(255, Math.round(v * lit))).join(',')})`;
          ctx.fill();

          // Subtle glossy edge stroke for crisp crystal definition
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.18 * lit})`;
          ctx.lineWidth = 0.75;
          ctx.stroke();

          // Specular glass highlight on front & top facets
          if (n[2] === -1 || n[1] === 1) {
            const g = ctx.createLinearGradient(pts[3][0], pts[3][1], pts[0][0], pts[0][1]);
            g.addColorStop(0, 'rgba(255,255,255,0.45)');
            g.addColorStop(0.35, 'rgba(255,255,255,0.15)');
            g.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = g;
            ctx.fill();
          }
        });

        // 3. Live pulsing neon aura on the forming candle (last candle)
        if (index === candles.length - 1) {
          const tip = proj(rot([x, c.close, 0]));
          const pulse = (Math.sin(time / 200) + 1) / 2; // 0 to 1
          const rad = 4 + pulse * 4;

          ctx.save();
          ctx.beginPath();
          ctx.arc(tip[0], tip[1], rad * 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${base.join(',')}, ${0.25 * (1 - pulse)})`;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(tip[0], tip[1], rad, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, 0.9)`;
          ctx.fill();
          ctx.restore();
        }
      });

      ctx.globalAlpha = 1;
    };

    const loop = (time) => {
      raf = requestAnimationFrame(loop);
      const delta = Math.min(time - lastFrame, 64);
      lastFrame = time;

      // Advance shift transition smoothly
      if (shiftProgress < 1) {
        shiftProgress = Math.min(1, shiftProgress + delta / 650);
      }

      // Generate new candle periodically (every 1.5 seconds)
      if (time - lastAdd > 1500) {
        lastAdd = time;
        candles = [...candles.slice(1), nextCandle(candles[candles.length - 1])];
        shiftProgress = 0; // Trigger smooth glide animation
      }

      render(time);
    };

    const start = () => {
      if (!raf && visible && !document.hidden) {
        lastFrame = performance.now();
        lastAdd = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };

    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
      else stop();
    }, { threshold: 0.1 });
    io.observe(canvas);

    const onVis = () => {
      if (document.hidden) stop();
      else start();
    };
    document.addEventListener('visibilitychange', onVis);

    const ro = new ResizeObserver(() => {
      resize();
      render(performance.now());
    });
    ro.observe(canvas);

    render(performance.now());
    start();

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" style={{ width: '100%', height: '100%', display: 'block' }} />;
}
