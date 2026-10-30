// frontend/src/components/landing/DotGridBackground.jsx
import React, { useEffect, useRef } from 'react';

export default function DotGridBackground({ accentColor = '#007AFF' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let cols = 0;
    let rows = 0;
    const SPACING = 26;

    // Grid points: 2D array of { ox, oy, x, y, g }
    let grid = [];

    // Pointer state
    let realX = null;
    let realY = null;
    let easedX = 0;
    let easedY = 0;
    let hasEntered = false;
    let isTouch = false;
    let startTime = performance.now();
    let animId;

    const initGrid = () => {
      cols = Math.ceil(width / SPACING) + 2;
      rows = Math.ceil(height / SPACING) + 2;
      grid = [];

      for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
          const ox = (c - 0.5) * SPACING;
          const oy = (r - 0.5) * SPACING;
          row.push({
            ox,
            oy,
            x: ox,
            y: oy,
            g: 0,
          });
        }
        grid.push(row);
      }
    };

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);

      initGrid();
      if (!hasEntered) {
        easedX = width * 0.5;
        easedY = height * 0.5;
      }
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(canvas);
    handleResize();

    const onPointerMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      hasEntered = true;
      realX = e.clientX - rect.left;
      realY = e.clientY - rect.top;
    };

    const onPointerLeave = () => {
      // Allow drift to resume if left
      realX = null;
      realY = null;
    };

    const onTouchStart = () => {
      isTouch = true;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('touchstart', onTouchStart, { passive: true });

    // Parse accent color into RGB for alpha application
    let accentR = 16, accentG = 185, accentB = 129;
    if (accentColor.startsWith('#')) {
      const hex = accentColor.replace('#', '');
      if (hex.length === 6) {
        accentR = parseInt(hex.substring(0, 2), 16);
        accentG = parseInt(hex.substring(2, 4), 16);
        accentB = parseInt(hex.substring(4, 6), 16);
      }
    }

    const render = () => {
      if (!width || !height) {
        animId = requestAnimationFrame(render);
        return;
      }

      const now = performance.now();
      const t = (now - startTime) * 0.001;

      // Pointer easing or Lissajous drift
      let targetX, targetY;
      if (!hasEntered || isTouch || realX === null) {
        // Lissajous drift
        const lx = 0.5 + 0.34 * Math.sin(t * 0.7) * Math.cos(t * 0.23);
        const ly = 0.5 + 0.30 * Math.sin(t * 0.52 + 1.1);
        targetX = lx * width;
        targetY = ly * height;
      } else {
        targetX = realX;
        targetY = realY;
      }

      easedX += (targetX - easedX) * 0.10;
      easedY += (targetY - easedY) * 0.10;

      const minDim = Math.min(width, height);
      const SIG = 0.42 * minDim;
      const PULL = 0.30 * minDim;
      const twoSigSq = 2 * SIG * SIG;

      // Update grid points
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const pt = grid[r][c];
          const dx = easedX - pt.ox;
          const dy = easedY - pt.oy;
          const d = Math.hypot(dx, dy);

          const g = Math.exp(-(d * d) / twoSigSq);
          pt.g = g;

          if (d > 0.001) {
            const pullAmount = g * PULL;
            pt.x = pt.ox + (dx / d) * pullAmount;
            pt.y = pt.oy + (dy / d) * pullAmount;
          } else {
            pt.x = pt.ox;
            pt.y = pt.oy;
          }
        }
      }

      // Draw
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Draw lines
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const pt = grid[r][c];

          // Right neighbor
          if (c < cols - 1) {
            const rightPt = grid[r][c + 1];
            const avgG = (pt.g + rightPt.g) * 0.5;
            if (avgG >= 0.004) {
              const alpha = 0.04 + avgG * 0.62;
              ctx.strokeStyle = `rgba(${accentR}, ${accentG}, ${accentB}, ${alpha})`;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(pt.x, pt.y);
              ctx.lineTo(rightPt.x, rightPt.y);
              ctx.stroke();
            }
          }

          // Down neighbor
          if (r < rows - 1) {
            const downPt = grid[r + 1][c];
            const avgG = (pt.g + downPt.g) * 0.5;
            if (avgG >= 0.004) {
              const alpha = 0.04 + avgG * 0.62;
              ctx.strokeStyle = `rgba(${accentR}, ${accentG}, ${accentB}, ${alpha})`;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(pt.x, pt.y);
              ctx.lineTo(downPt.x, downPt.y);
              ctx.stroke();
            }
          }
        }
      }

      // Draw dots
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const pt = grid[r][c];
          const radius = 0.9 + pt.g * 1.9;
          const alpha = 0.16 + pt.g * 0.62;

          ctx.fillStyle = `rgba(${accentR}, ${accentG}, ${accentB}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('touchstart', onTouchStart);
    };
  }, [accentColor]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
