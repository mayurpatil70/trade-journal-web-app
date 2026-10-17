// frontend/src/components/landing/LiquidGlassCarousel.jsx
import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ArrowLeft, ArrowRight, Upload } from 'lucide-react';
import IridescentButton from './IridescentButton';

// Generates high-resolution vector/canvas mockups for the 5 app views
const createMockupDataUri = (type, title, subtitle, badge, accent) => {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, 900, 600);
  bgGrad.addColorStop(0, '#0B121A');
  bgGrad.addColorStop(1, '#060B10');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 900, 600);

  // Grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 900; x += 45) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 600);
    ctx.stroke();
  }
  for (let y = 0; y < 600; y += 45) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(900, y);
    ctx.stroke();
  }

  // Window Top Bar
  ctx.fillStyle = '#0F1A24';
  ctx.fillRect(0, 0, 900, 48);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.strokeRect(0, 0, 900, 48);

  // Window dots
  ctx.fillStyle = '#EF4444';
  ctx.beginPath(); ctx.arc(24, 24, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#F59E0B';
  ctx.beginPath(); ctx.arc(42, 24, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#10B981';
  ctx.beginPath(); ctx.arc(60, 24, 6, 0, Math.PI * 2); ctx.fill();

  // App Title in Header
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '600 13px "JetBrains Mono", monospace';
  ctx.fillText('FOREX NOTES — ' + badge.toUpperCase(), 90, 28);

  // Content Area
  // Top KPI Card
  ctx.fillStyle = 'rgba(16, 27, 37, 0.85)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.roundRect(40, 75, 480, 110, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = accent;
  ctx.font = '700 11px "JetBrains Mono", monospace';
  ctx.fillText(badge.toUpperCase(), 64, 105);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 24px "Space Grotesk", sans-serif';
  ctx.fillText(title, 64, 142);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '400 13px "Space Mono", monospace';
  ctx.fillText(subtitle, 64, 166);

  // Secondary KPI
  ctx.fillStyle = 'rgba(16, 27, 37, 0.85)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.roundRect(540, 75, 320, 110, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '700 11px "JetBrains Mono", monospace';
  ctx.fillText('LIVE STATUS', 564, 105);

  ctx.fillStyle = accent;
  ctx.font = '800 26px "Space Grotesk", sans-serif';
  ctx.fillText('+4.82R NET EDGE', 564, 144);

  // Main Visual Chart / Table
  ctx.fillStyle = 'rgba(12, 22, 32, 0.9)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  ctx.roundRect(40, 210, 820, 350, 18);
  ctx.fill();
  ctx.stroke();

  // Simulated Candlesticks or Sparkline
  const chartW = 740;
  const chartH = 260;
  const startX = 80;
  const startY = 250;

  // Draw chart axes
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  for (let i = 0; i <= 4; i++) {
    const y = startY + (i / 4) * chartH;
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(startX + chartW, y);
    ctx.stroke();
  }

  // Draw Candles
  const candleCount = 18;
  const cw = 22;
  const cGap = (chartW - candleCount * cw) / (candleCount - 1);
  let curPrice = 280;

  for (let i = 0; i < candleCount; i++) {
    const isBull = Math.sin(i * 0.9) > -0.2;
    const bodyH = Math.max(12, Math.abs(Math.cos(i * 1.2) * 60));
    const wickTop = Math.random() * 20 + 8;
    const wickBottom = Math.random() * 20 + 8;
    curPrice += isBull ? -8 : 6;
    const cx = startX + i * (cw + cGap);
    const cy = Math.max(startY + 30, Math.min(startY + chartH - 60, curPrice));

    ctx.strokeStyle = isBull ? '#10B981' : '#EF4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + cw / 2, cy - wickTop);
    ctx.lineTo(cx + cw / 2, cy + bodyH + wickBottom);
    ctx.stroke();

    ctx.fillStyle = isBull ? '#10B981' : '#EF4444';
    ctx.fillRect(cx, cy, cw, bodyH);
  }

  // Watermark
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.font = '900 70px "Space Grotesk", sans-serif';
  ctx.fillText('FOREX NOTES', 240, 420);

  return canvas.toDataURL('image/jpeg', 0.92);
};

const DEFAULT_SLIDES = [
  {
    src: '/screenshots/screenshot_1_dashboard.png',
    title: 'Digital Trading Journal',
    sub: 'Account-Wise Real-Time Data Renders',
    badge: 'Live Dashboard',
    color: '#10B981',
    ratio: 1.8,
  },
  {
    src: '/screenshots/screenshot_2_multiaccount.png',
    title: 'Multi-Account Trade Logging',
    sub: 'Made for Prop Firm Traders',
    badge: 'Trade Logger',
    color: '#3B82F6',
    ratio: 1.8,
  },
  {
    src: '/screenshots/screenshot_3_livecharts.png',
    title: 'Real-Time TradingView Charts',
    sub: 'Live Charts of All Assets',
    badge: 'Live Market',
    color: '#EC4899',
    ratio: 1.8,
  },
  {
    src: '/screenshots/screenshot_4_barreplay.png',
    title: '10-Year Candlestick Bar Replay',
    sub: 'Tick-by-Tick Multi-Timeframe Simulator',
    badge: 'Backtesting',
    color: '#F59E0B',
    ratio: 1.8,
  },
  {
    src: '/screenshots/screenshot_5_calculator.png',
    title: 'Lot Size & Prop Guardian',
    sub: 'Precision Pip Sizing & Drawdown Protection',
    badge: 'Risk Engine',
    color: '#8B5CF6',
    ratio: 1.8,
  },
];

export default function LiquidGlassCarousel({ userImages = null }) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const titleElRef = useRef(null);
  const subElRef = useRef(null);

  const [activeIdx, setActiveIdx] = useState(0);
  const [slideImages, setSlideImages] = useState(userImages && userImages.length === 5 ? userImages : DEFAULT_SLIDES);

  useEffect(() => {
    if (userImages && userImages.length === 5) {
      setSlideImages(userImages);
    } else {
      setSlideImages(DEFAULT_SLIDES);
    }
  }, [userImages]);

  // WebGL Liquid Glass Shader implementation
  useEffect(() => {
    if (slideImages.length === 0) return;

    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: true });
    if (!gl) return;

    // Load HTML image objects
    const imgEls = slideImages.map((s) => {
      const im = new Image();
      im.src = s.src;
      im.dataset.title = s.title;
      im.dataset.sub = s.sub;
      im.dataset.ratio = String(s.ratio || 1.5);
      return im;
    });

    const strip = document.createElement('canvas');
    const sx = strip.getContext('2d');
    const n = imgEls.length;

    const vs = `attribute vec2 p; varying vec2 v; void main(){ v = p*.5+.5; v.y = 1.-v.y; gl_Position = vec4(p,0.,1.); }`;
    const fs = `precision highp float;
      varying vec2 v; uniform sampler2D t; uniform float k; uniform float ca; uniform float asp;
      vec2 warp(vec2 uv){
        float cx = uv.x - .5;
        float e = smoothstep(.16, .5, abs(cx)); e = e*e*(3.-2.*e);
        float sxv = .5 + cx * (1. - .10*k*e);
        float syv = .5 + (uv.y - .5) / (1. + .85*k*e);
        syv += (uv.y-.5) * .025 * k * e * sin(cx*6.2831);
        return vec2(sxv, syv);
      }
      vec3 tap(vec2 uv){ return (uv.x<0.||uv.x>1.||uv.y<0.||uv.y>1.) ? vec3(0.04, 0.07, 0.1) : texture2D(t, uv).rgb; }
      void main(){
        float cx = v.x - .5;
        float e = smoothstep(.2, .5, abs(cx));
        vec2 d = vec2(sign(cx) * ca * e * e, 0.);
        vec3 col;
        col.r = tap(warp(v + d)).r;
        col.g = tap(warp(v)).g;
        col.b = tap(warp(v - d)).b;
        col += vec3(.08) * e * e * smoothstep(.0,.6, 1.-abs(v.y-.5)*2.);
        gl_FragColor = vec4(col, 1.);
      }`;

    function compileShader(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, compileShader(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach((p) => gl.texParameteri(gl.TEXTURE_2D, p, gl.CLAMP_TO_EDGE));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const uK = gl.getUniformLocation(prog, 'k');
    const uCA = gl.getUniformLocation(prog, 'ca');

    let W = 0, H = 0, dpr = 1, ph = 0, gap = 0, widths = [], centers = [], period = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.round(root.clientWidth * dpr);
      H = Math.round(root.clientHeight * dpr);
      if (W === 0 || H === 0) return;
      canvas.width = strip.width = W;
      canvas.height = strip.height = H;
      gl.viewport(0, 0, W, H);
      ph = Math.min(H * 0.58, W * 0.42);
      gap = ph * 0.14;

      widths = imgEls.map((im) => ph * (im.dataset.ratio ? +im.dataset.ratio : 1.5));
      centers = [];
      let c = 0;
      widths.forEach((w, i) => {
        if (i) c += widths[i - 1] / 2 + gap + w / 2;
        centers.push(c);
      });
      period = c + widths[n - 1] / 2 + gap + widths[0] / 2;
    }

    const camAt = (pos) => {
      const f = Math.floor(pos), t = pos - f, i = ((f % n) + n) % n, j = (i + 1) % n;
      const loops = Math.floor(f / n) * period;
      const a = centers[i] + loops, b = (j === 0 ? centers[0] + period : centers[j]) + loops;
      return a + (b - a) * t;
    };

    const state = { pos: 0, k: 1, ca: 0.004, intro: 0 };
    let lastPos = null, lastT = 0, vel = 0;

    function cover(im, x, y, w, h) {
      if (!im.complete || !im.naturalWidth) {
        sx.fillStyle = '#0F1A24';
        sx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        sx.lineWidth = 1.5;
        if (sx.roundRect) {
          sx.beginPath();
          sx.roundRect(x, y, w, h, 14);
          sx.fill();
          sx.stroke();
        } else {
          sx.fillRect(x, y, w, h);
          sx.strokeRect(x, y, w, h);
        }
        return;
      }
      const r = Math.max(w / im.naturalWidth, h / im.naturalHeight);
      const sw = w / r, sh = h / r;
      sx.drawImage(im, (im.naturalWidth - sw) / 2, (im.naturalHeight - sh) / 2, sw, sh, x, y, w, h);
    }

    function render() {
      if (!W || !sx) return;
      const cam = camAt(state.pos);
      const now = gsap.globalTimeline.time();
      if (lastPos !== null && now > lastT) {
        vel = vel * 0.5 + ((state.pos - lastPos) / (now - lastT)) * 0.5;
      }
      if (now !== lastT) {
        lastPos = state.pos;
        lastT = now;
      }

      // Background fill: sleek dark navy
      sx.fillStyle = '#060B10';
      sx.fillRect(0, 0, W, H);

      // Floor Shadow
      const g = sx.createRadialGradient(W / 2, H * 0.54, 0, W / 2, H * 0.54, W * 0.38);
      g.addColorStop(0, 'rgba(16, 185, 129, 0.12)');
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      sx.fillStyle = g;
      sx.fillRect(0, 0, W, H);

      const top = H * 0.5 - ph / 2;
      // Calculate dynamic k center from camera position so slides repeat infinitely forever
      const kCenter = Math.round(cam / period) || 0;
      for (let i = 0; i < n; i++) {
        for (let k = kCenter - 3; k <= kCenter + 3; k++) {
          const w = widths[i];
          const x = W / 2 + centers[i] + k * period - cam - w / 2;
          if (x > W + w || x + w < -w) continue;
          const drop = state.intro * H * (0.6 + (0.08 * Math.abs(x + w / 2 - W / 2)) / W * 10);
          cover(imgEls[i], x, top + drop, w, ph);
        }
      }

      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, strip);
      const speed = Math.min(Math.abs(vel) * 0.22, 0.7);
      gl.uniform1f(uK, state.k + speed);
      gl.uniform1f(uCA, state.ca + speed * 0.007);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    // Text roll animation
    function setText(el, txt, dir) {
      if (!el) return;
      [...el.children].forEach((line) => {
        gsap.to(line.children, { yPercent: -110 * dir, opacity: 0, duration: 0.45, ease: 'power3.in', stagger: 0.01, onComplete: () => line.remove() });
      });
      const line = document.createElement('div');
      line.style.position = 'relative';
      [...txt].forEach((ch) => {
        const s = document.createElement('span');
        s.textContent = ch;
        s.style.display = 'inline-block';
        s.style.whiteSpace = 'pre';
        line.appendChild(s);
      });
      el.appendChild(line);
      gsap.fromTo(line.children, { yPercent: 110 * dir, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.75, delay: 0.15, ease: 'expo.out', stagger: 0.016 });
    }

    let cur = 0, tween;
    function goTo(target, dur = 1.15) {
      const dir = Math.sign(target - cur) || 1;
      cur = Math.round(target);
      const activeIdxNorm = ((cur % n) + n) % n;
      setActiveIdx(activeIdxNorm);

      tween && tween.kill();
      tween = gsap.to(state, { pos: cur, duration: dur, ease: 'expo.inOut', onUpdate: render });

      const activeIm = imgEls[activeIdxNorm];
      if (activeIm) {
        setText(titleElRef.current, activeIm.dataset.title, dir);
        setText(subElRef.current, activeIm.dataset.sub, dir);
      }
      restartAuto();
    }

    const next = () => goTo(cur + 1);
    const prev = () => goTo(cur - 1);

    // Drag with momentum
    let dragging = false, x0 = 0, p0 = 0, lx = 0, lt = 0, dragV = 0;
    const onPointerDown = (e) => {
      if (e.target.closest('button, a')) return;
      dragging = true;
      x0 = lx = e.clientX;
      p0 = state.pos;
      lt = performance.now();
      dragV = 0;
      tween && tween.kill();
      stopAuto();
    };

    const onPointerMove = (e) => {
      if (!dragging) return;
      const now = performance.now();
      dragV = (e.clientX - lx) / Math.max(1, now - lt);
      lx = e.clientX;
      lt = now;
      const avgW = (period / n) / dpr;
      state.pos = p0 - (e.clientX - x0) / avgW;
      render();
    };

    const onPointerUp = () => {
      if (!dragging) return;
      dragging = false;
      const avgW = (period / n) / dpr;
      goTo(Math.round(state.pos - dragV * 220 / avgW), 1.2);
    };

    root.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    let autoTimer;
    function stopAuto() {
      if (autoTimer) autoTimer.kill();
    }
    function restartAuto() {
      stopAuto();
      autoTimer = gsap.delayedCall(3.2, next);
    }

    root.addEventListener('pointerenter', stopAuto);
    root.addEventListener('pointerleave', restartAuto);

    const onKeyDown = (e) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKeyDown);

    window.addEventListener('resize', () => {
      resize();
      render();
    });

    // Defer intro & texture decode until scrolled into view to keep initial hero load at 60fps
    let hasIntroduced = false;
    const runIntro = () => {
      if (hasIntroduced) return;
      hasIntroduced = true;
      Promise.all(imgEls.map((im) => im.decode ? im.decode().catch(() => {}) : Promise.resolve())).then(() => {
        resize();
        render();
        state.intro = 1;
        state.pos = -1.5;
        state.k = 1.8;
        gsap.to(state, { intro: 0, duration: 1.4, ease: 'expo.out', onUpdate: render });
        gsap.to(state, { pos: 0, k: 1, duration: 1.8, ease: 'expo.inOut', onUpdate: render });
        const im = imgEls[0];
        if (im) {
          setText(titleElRef.current, im.dataset.title, 1);
          setText(subElRef.current, im.dataset.sub, 1);
        }
        restartAuto();
      });
    };

    let isVisible = false;
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible) {
        if (!hasIntroduced) {
          runIntro();
        } else {
          render();
          restartAuto();
        }
      } else {
        stopAuto();
      }
    }, { threshold: 0.05 });

    observer.observe(root);

    // Expose controls to ref
    root.nextSlide = next;
    root.prevSlide = prev;

    return () => {
      observer.disconnect();
      stopAuto();
      root.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('keydown', onKeyDown);
      root.removeEventListener('pointerenter', stopAuto);
      root.removeEventListener('pointerleave', restartAuto);
    };
  }, [slideImages]);

  return (
    <section
      id="app-preview"
      style={{
        position: 'relative',
        width: '100%',
        scrollMarginTop: '70px',
        padding: 'clamp(60px, 8vh, 90px) 0 clamp(40px, 5vh, 60px)',
        background: '#060B10',
        color: '#FFFFFF',
        overflow: 'hidden',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <div style={{ maxWidth: '900px', margin: '0 auto 32px', textAlign: 'center', padding: '0 20px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 14px',
            borderRadius: '999px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            fontSize: '10px',
            color: '#10B981',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: '16px',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981', flexShrink: 0 }} />
          <span>Interactive Liquid Glass Showcase</span>
        </div>

        <h2
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(28px, 4.4vw, 48px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            color: '#FFFFFF',
            marginBottom: '12px',
          }}
        >
          Inside the <span style={{ color: '#10B981' }}>Forex Notes Workspace</span>
        </h2>
        <p
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '13px',
            color: 'rgba(255, 255, 255, 0.6)',
            lineHeight: 1.6,
            maxWidth: '560px',
            margin: '0 auto',
          }}
        >
          Drag horizontally with momentum or use arrow keys to bend the liquid glass lens across our core analytics views.
        </p>
      </div>

      {/* Dynamic Rolling Title & Subtitle Plate (Positioned above canvas with zero overlap) */}
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto 18px',
          textAlign: 'center',
          padding: '0 20px',
        }}
      >
        <div
          ref={titleElRef}
          style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 'clamp(24px, 3.2vw, 38px)',
            fontWeight: 400,
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
            color: '#FFFFFF',
            minHeight: '1.25em',
            position: 'relative',
            overflow: 'hidden',
          }}
        />
        <div
          ref={subElRef}
          style={{
            marginTop: '6px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 'clamp(11px, 1.2vw, 13px)',
            color: '#0E7C86',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontWeight: 700,
            minHeight: '1.25em',
            position: 'relative',
            overflow: 'hidden',
          }}
        />
      </div>

      {/* The Liquid Glass Container */}
      <div
        ref={rootRef}
        style={{
          position: 'relative',
          width: '100%',
          height: 'clamp(400px, 52vh, 480px)',
          overflow: 'hidden',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'pan-y',
          cursor: 'grab',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            display: 'block',
          }}
        />

        {/* Edge Navigation Buttons */}
        <button
          type="button"
          onClick={() => rootRef.current?.prevSlide && rootRef.current.prevSlide()}
          style={{
            position: 'absolute',
            left: 'clamp(10px, 2.5vw, 24px)',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'rgba(11, 18, 26, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'background 0.2s',
          }}
        >
          <ArrowLeft size={16} />
        </button>

        <button
          type="button"
          onClick={() => rootRef.current?.nextSlide && rootRef.current.nextSlide()}
          style={{
            position: 'absolute',
            right: 'clamp(10px, 2.5vw, 24px)',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'rgba(11, 18, 26, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'background 0.2s',
          }}
        >
          <ArrowRight size={16} />
        </button>

        {/* Bottom CTA Pill */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '22px',
            transform: 'translateX(-50%)',
            zIndex: 10,
          }}
        >
          <IridescentButton to="/login" size="md">
            EXPLORE ALL 5 WORKSPACES
          </IridescentButton>
        </div>
      </div>

      {/* Live In-App Screenshots Status */}
      <div
        style={{
          maxWidth: '680px',
          margin: '24px auto 0',
          padding: '12px 20px',
          borderRadius: '12px',
          background: 'rgba(15, 29, 28, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '11px',
          color: 'rgba(237, 234, 227, 0.85)',
        }}
      >
        <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#0E7C86', verticalAlign: '1px', marginRight: '8px' }} />
        <span>Live in-app screenshots active: Multi-account journal, TradingView charts, 10-year bar replay and drawdown calculator.</span>
      </div>
    </section>
  );
}
