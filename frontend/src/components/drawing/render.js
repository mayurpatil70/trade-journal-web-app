import { MARKERS } from './tools';

const FIB_COLORS = ['#787B86', '#F23645', '#FF9800', '#4CAF50', '#089981', '#00BCD4', '#2962FF', '#9C27B0', '#E91E63'];
const FIB_TIME = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
const UP = '#089981';
const DOWN = '#F23645';

export const rgba = (hex, a) => {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.padEnd(6, '0');
  return `rgba(${parseInt(v.slice(0, 2), 16)},${parseInt(v.slice(2, 4), 16)},${parseInt(v.slice(4, 6), 16)},${a})`;
};

const dashOf = (d, w) => (d === 'dashed' ? [6 + w, 4 + w] : d === 'dotted' ? [w, 3 + w] : []);

const stroke = (ctx, s, color = s.color, width = s.width) => {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dashOf(s.dash, width));
};

const line = (ctx, x1, y1, x2, y2) => {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
};

export const extend = (x1, y1, x2, y2, left, right, W, H) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const k = ((W + H) * 4) / len;
  return [left ? x1 - dx * k : x1, left ? y1 - dy * k : y1, right ? x2 + dx * k : x2, right ? y2 + dy * k : y2];
};

const font = (s, size = s.fontSize) => `${s.italic ? 'italic ' : ''}${s.bold ? 'bold ' : ''}${size}px Inter, system-ui, sans-serif`;

const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
};

const box = (ctx, hit, x, y, lines, { fg = '#fff', bg, border, size = 12, pad = 6, f } = {}) => {
  ctx.font = f || `${size}px Inter, system-ui, sans-serif`;
  const lh = size + 4;
  const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + pad * 2;
  const h = lines.length * lh + pad * 2 - 4;
  roundRect(ctx, x, y, w, h, 4);
  if (bg) {
    ctx.fillStyle = bg;
    ctx.fill();
  }
  if (border) {
    ctx.setLineDash([]);
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.fillStyle = fg;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  lines.forEach((l, i) => ctx.fillText(l, x + pad, y + pad + i * lh));
  hit?.rect(x, y, w, h);
  return { w, h };
};

const arrowHead = (ctx, x1, y1, x2, y2, size) => {
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - size * Math.cos(a - 0.45), y2 - size * Math.sin(a - 0.45));
  ctx.lineTo(x2 - size * Math.cos(a + 0.45), y2 - size * Math.sin(a + 0.45));
  ctx.closePath();
  ctx.fill();
};

const smoothPath = (ctx, pts) => {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length - 1; i += 1) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2;
    const my = (pts[i][1] + pts[i + 1][1]) / 2;
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
  }
  const last = pts[pts.length - 1];
  ctx.lineTo(last[0], last[1]);
  ctx.stroke();
};

const pct = (from, to) => (from ? ((to - from) / from) * 100 : 0);
const signedPct = (v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;

const duration = (sec) => {
  const s = Math.abs(sec);
  if (s >= 86400) return `${(s / 86400).toFixed(1)}d`;
  if (s >= 3600) return `${(s / 3600).toFixed(1)}h`;
  return `${Math.round(s / 60)}m`;
};

function positionTool(ctx, d, P, v, hit) {
  const [e, sl, tp] = P;
  const [pe, psl, ptp] = d.points;
  const x0 = Math.min(e[0], sl[0]);
  const x1 = Math.max(e[0], sl[0], x0 + 40);
  const w = x1 - x0;
  const isLong = ptp.p >= pe.p;
  ctx.setLineDash([]);
  ctx.fillStyle = rgba(UP, 0.18);
  ctx.fillRect(x0, Math.min(e[1], tp[1]), w, Math.abs(tp[1] - e[1]));
  ctx.fillStyle = rgba(DOWN, 0.18);
  ctx.fillRect(x0, Math.min(e[1], sl[1]), w, Math.abs(sl[1] - e[1]));
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#D1D4DC';
  line(ctx, x0, e[1], x1, e[1]);
  ctx.strokeStyle = UP;
  line(ctx, x0, tp[1], x1, tp[1]);
  ctx.strokeStyle = DOWN;
  line(ctx, x0, sl[1], x1, sl[1]);
  hit.rect(x0, Math.min(tp[1], sl[1]), w, Math.abs(tp[1] - sl[1]));
  const risk = Math.abs(pe.p - psl.p);
  const reward = Math.abs(ptp.p - pe.p);
  const rr = risk ? reward / risk : 0;
  const cx = x0 + 4;
  const tpY = isLong ? Math.min(tp[1], e[1]) : Math.max(tp[1], e[1]);
  const slY = isLong ? Math.max(sl[1], e[1]) : Math.min(sl[1], e[1]);
  box(ctx, null, cx, isLong ? tpY - 26 : tpY + 4, [`Target ${v.price(ptp.p)} (${signedPct(pct(pe.p, ptp.p))}) · ${v.price(reward)}`], { bg: rgba(UP, 0.9), size: 11, pad: 4 });
  box(ctx, null, cx, isLong ? slY + 4 : slY - 26, [`Stop ${v.price(psl.p)} (${signedPct(pct(pe.p, psl.p))}) · ${v.price(risk)}`], { bg: rgba(DOWN, 0.9), size: 11, pad: 4 });
  box(ctx, null, cx, e[1] - 11, [`${isLong ? 'Long' : 'Short'} ${v.price(pe.p)} · R:R ${rr.toFixed(2)}`], { bg: 'rgba(19,20,24,0.92)', border: '#2B2D33', size: 11, pad: 4 });
}

export function renderDrawing(ctx, d, v, hit) {
  const s = d.style;
  const P = d.points.map((pt) => [v.x(pt.t), v.y(pt.p)]);
  if (P.some(([x, y]) => x == null || y == null || !Number.isFinite(x) || !Number.isFinite(y))) return;
  const { W, H } = v;
  ctx.save();
  ctx.fillStyle = s.color;
  stroke(ctx, s);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const [a, b, c] = P;

  switch (d.type) {
    case 'trendline':
    case 'ray':
    case 'extended':
    case 'arrow': {
      if (!b) break;
      const L = d.type === 'extended' || (d.type !== 'ray' && s.extendL);
      const R = d.type === 'extended' || d.type === 'ray' || s.extendR;
      const [x1, y1, x2, y2] = extend(a[0], a[1], b[0], b[1], L, R, W, H);
      line(ctx, x1, y1, x2, y2);
      hit.seg(x1, y1, x2, y2);
      if (d.type === 'arrow') {
        const size = 8 + s.width * 2;
        if (s.arrowEnd) arrowHead(ctx, a[0], a[1], b[0], b[1], size);
        if (s.arrowStart) arrowHead(ctx, b[0], b[1], a[0], a[1], size);
      }
      break;
    }
    case 'hline': {
      line(ctx, 0, a[1], W, a[1]);
      hit.seg(0, a[1], W, a[1]);
      if (s.text) {
        ctx.font = font(s, 12);
        ctx.textBaseline = 'bottom';
        ctx.fillText(s.text, 8, a[1] - 3);
      }
      break;
    }
    case 'vline': {
      line(ctx, a[0], 0, a[0], H);
      hit.seg(a[0], 0, a[0], H);
      if (s.text) {
        ctx.font = font(s, 12);
        ctx.textBaseline = 'top';
        ctx.fillText(s.text, a[0] + 4, 8);
      }
      break;
    }
    case 'channel': {
      if (!b) break;
      const slope = b[0] === a[0] ? 0 : (b[1] - a[1]) / (b[0] - a[0]);
      const off = c ? c[1] - (a[1] + slope * (c[0] - a[0])) : 0;
      const l1 = extend(a[0], a[1], b[0], b[1], s.extendL, s.extendR, W, H);
      const l2 = [l1[0], l1[1] + off, l1[2], l1[3] + off];
      if (s.fill && c) {
        ctx.fillStyle = rgba(s.color, s.opacity);
        ctx.beginPath();
        ctx.moveTo(l1[0], l1[1]);
        ctx.lineTo(l1[2], l1[3]);
        ctx.lineTo(l2[2], l2[3]);
        ctx.lineTo(l2[0], l2[1]);
        ctx.closePath();
        ctx.fill();
      }
      line(ctx, ...l1);
      hit.seg(...l1);
      if (c) {
        line(ctx, ...l2);
        hit.seg(...l2);
        hit.poly([[l1[0], l1[1]], [l1[2], l1[3]], [l2[2], l2[3]], [l2[0], l2[1]]]);
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;
        line(ctx, l1[0], l1[1] + off / 2, l1[2], l1[3] + off / 2);
      }
      break;
    }
    case 'rect': {
      if (!b) break;
      const x1 = s.extendL ? 0 : Math.min(a[0], b[0]);
      const x2 = s.extendR ? W : Math.max(a[0], b[0]);
      const y1 = Math.min(a[1], b[1]);
      const h = Math.abs(b[1] - a[1]);
      if (s.fill) {
        ctx.fillStyle = rgba(s.color, s.opacity);
        ctx.fillRect(x1, y1, x2 - x1, h);
      }
      ctx.strokeRect(x1, y1, x2 - x1, h);
      hit.rect(x1, y1, x2 - x1, h);
      if (s.text) {
        ctx.fillStyle = s.color;
        ctx.font = font(s, 12);
        ctx.textBaseline = 'top';
        ctx.fillText(s.text, x1 + 4, y1 + 4);
      }
      break;
    }
    case 'ellipse': {
      if (!b) break;
      const cx = (a[0] + b[0]) / 2;
      const cy = (a[1] + b[1]) / 2;
      const rx = Math.abs(b[0] - a[0]) / 2;
      const ry = Math.abs(b[1] - a[1]) / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      if (s.fill) {
        ctx.fillStyle = rgba(s.color, s.opacity);
        ctx.fill();
      }
      ctx.stroke();
      hit.ellipse(cx, cy, rx, ry);
      break;
    }
    case 'triangle': {
      ctx.beginPath();
      P.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      if (s.fill && P.length === 3) {
        ctx.fillStyle = rgba(s.color, s.opacity);
        ctx.fill();
      }
      ctx.stroke();
      hit.poly(P);
      P.forEach((p, i) => hit.seg(...p, ...P[(i + 1) % P.length]));
      break;
    }
    case 'text': {
      ctx.font = font(s);
      ctx.textAlign = s.align || 'left';
      ctx.textBaseline = 'top';
      const lines = (s.text || 'Text').split('\n');
      const lh = s.fontSize * 1.25;
      const w = Math.max(...lines.map((l) => ctx.measureText(l).width));
      lines.forEach((l, i) => ctx.fillText(l, a[0], a[1] + i * lh));
      const x0 = s.align === 'center' ? a[0] - w / 2 : s.align === 'right' ? a[0] - w : a[0];
      hit.rect(x0 - 2, a[1] - 2, w + 4, lines.length * lh + 4);
      break;
    }
    case 'pricelabel': {
      const label = [v.price(d.points[0].p), s.text].filter(Boolean).join('  ');
      ctx.beginPath();
      ctx.arc(a[0], a[1], 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 1;
      line(ctx, a[0], a[1], a[0] + 10, a[1] - 14);
      box(ctx, hit, a[0] + 10, a[1] - 30, [label], { bg: s.color, size: 12, pad: 5 });
      break;
    }
    case 'callout': {
      if (!b) break;
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      line(ctx, a[0], a[1], b[0], b[1]);
      ctx.beginPath();
      ctx.arc(a[0], a[1], 3, 0, Math.PI * 2);
      ctx.fill();
      hit.seg(a[0], a[1], b[0], b[1]);
      box(ctx, hit, b[0], b[1], (s.text || 'Note').split('\n'), { bg: rgba(s.color, 0.92), size: s.fontSize, f: font(s), pad: 8 });
      break;
    }
    case 'fib':
    case 'fibext': {
      if (!b) break;
      const ext = d.type === 'fibext';
      if (ext && !c) {
        ctx.setLineDash([4, 4]);
        line(ctx, a[0], a[1], b[0], b[1]);
        hit.seg(a[0], a[1], b[0], b[1]);
        break;
      }
      const [pa, pb, pc] = d.points;
      const priceAt = (L) => (ext ? pc.p + (pb.p - pa.p) * L : pb.p + (pa.p - pb.p) * L);
      const xs = ext ? [c[0], c[0] + Math.max(Math.abs(b[0] - a[0]), 60)] : [Math.min(a[0], b[0]), Math.max(a[0], b[0])];
      const x1 = s.extendL ? 0 : xs[0];
      const x2 = s.extendR ? W : xs[1];
      const levels = [...(s.levels || [])].sort((m, n) => m - n);
      const ys = levels.map((L) => v.y(priceAt(L)));
      levels.forEach((L, i) => {
        const y = ys[i];
        if (y == null) return;
        const col = FIB_COLORS[i % FIB_COLORS.length];
        if (s.fill && i > 0 && ys[i - 1] != null) {
          ctx.fillStyle = rgba(col, s.opacity);
          ctx.fillRect(x1, Math.min(y, ys[i - 1]), x2 - x1, Math.abs(y - ys[i - 1]));
        }
        stroke(ctx, s, col);
        line(ctx, x1, y, x2, y);
        hit.seg(x1, y, x2, y);
        if (s.showLabel) {
          ctx.fillStyle = col;
          ctx.font = '11px Inter, system-ui, sans-serif';
          ctx.textBaseline = 'bottom';
          ctx.textAlign = 'left';
          ctx.fillText(`${L} (${v.price(priceAt(L))})`, x1 + 4, y - 2);
        }
      });
      if (ys.length && ys[0] != null && ys[ys.length - 1] != null) hit.rect(x1, Math.min(ys[0], ys[ys.length - 1]), x2 - x1, Math.abs(ys[ys.length - 1] - ys[0]));
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = rgba('#787B86', 0.8);
      ctx.lineWidth = 1;
      ctx.beginPath();
      P.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
      break;
    }
    case 'fibtime': {
      if (!b) break;
      const l0 = v.logical(d.points[0].t);
      const l1 = v.logical(d.points[1].t);
      const dl = l1 - l0;
      ctx.font = '11px Inter, system-ui, sans-serif';
      ctx.textBaseline = 'top';
      FIB_TIME.forEach((f, i) => {
        const x = v.lx(l0 + f * dl);
        if (x == null || x < -5 || x > W + 5) return;
        stroke(ctx, s, FIB_COLORS[i % FIB_COLORS.length]);
        line(ctx, x, 0, x, H);
        hit.seg(x, 0, x, H);
        if (s.showLabel) {
          ctx.fillStyle = FIB_COLORS[i % FIB_COLORS.length];
          ctx.fillText(String(f), x + 3, 6);
        }
      });
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = rgba('#787B86', 0.8);
      line(ctx, a[0], a[1], b[0], b[1]);
      break;
    }
    case 'pitchfork': {
      if (!c) {
        if (b) {
          line(ctx, a[0], a[1], b[0], b[1]);
          hit.seg(a[0], a[1], b[0], b[1]);
        }
        break;
      }
      const m = [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2];
      const dx = m[0] - a[0];
      const dy = m[1] - a[1];
      const med = extend(a[0], a[1], m[0], m[1], false, true, W, H);
      const lb = extend(b[0], b[1], b[0] + dx, b[1] + dy, false, true, W, H);
      const lc = extend(c[0], c[1], c[0] + dx, c[1] + dy, false, true, W, H);
      if (s.fill) {
        ctx.fillStyle = rgba(s.color, s.opacity);
        ctx.beginPath();
        ctx.moveTo(lb[0], lb[1]);
        ctx.lineTo(lb[2], lb[3]);
        ctx.lineTo(lc[2], lc[3]);
        ctx.lineTo(lc[0], lc[1]);
        ctx.closePath();
        ctx.fill();
      }
      [med, lb, lc, [b[0], b[1], c[0], c[1]]].forEach((l) => {
        line(ctx, ...l);
        hit.seg(...l);
      });
      break;
    }
    case 'measure': {
      if (!b) break;
      const [pa, pb] = d.points;
      const up = pb.p >= pa.p;
      const col = up ? '#2962FF' : DOWN;
      const x1 = Math.min(a[0], b[0]);
      const y1 = Math.min(a[1], b[1]);
      const w = Math.abs(b[0] - a[0]);
      const h = Math.abs(b[1] - a[1]);
      ctx.fillStyle = rgba(col, s.opacity);
      ctx.fillRect(x1, y1, w, h);
      hit.rect(x1, y1, w, h);
      ctx.strokeStyle = col;
      ctx.fillStyle = col;
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      const mx = x1 + w / 2;
      const my = y1 + h / 2;
      line(ctx, mx, a[1], mx, b[1]);
      line(ctx, a[0], my, b[0], my);
      if (h > 10) arrowHead(ctx, mx, a[1], mx, b[1], 7);
      if (w > 10) arrowHead(ctx, a[0], my, b[0], my, 7);
      const bars = Math.round(v.logical(pb.t) - v.logical(pa.t));
      const lines = [
        `${v.price(pb.p - pa.p)} (${signedPct(pct(pa.p, pb.p))})`,
        `${bars} bars, ${duration(pb.t - pa.t)}`,
      ];
      if (s.rr) lines.push(`R:R ${s.rr}`);
      ctx.font = '12px Inter, system-ui, sans-serif';
      const bw = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 12;
      box(ctx, null, mx - bw / 2, up ? y1 - 46 : y1 + h + 6, lines, { bg: rgba(col, 0.92), size: 12 });
      break;
    }
    case 'long':
    case 'short':
    case 'rr': {
      if (P.length === 3) positionTool(ctx, d, P, v, hit);
      else if (b) {
        ctx.strokeStyle = '#D1D4DC';
        ctx.lineWidth = 1;
        line(ctx, a[0], a[1], b[0], a[1]);
        ctx.strokeStyle = DOWN;
        line(ctx, a[0], b[1], b[0], b[1]);
      }
      break;
    }
    case 'brush':
    case 'highlighter': {
      if (d.type === 'highlighter') ctx.globalAlpha = s.opacity;
      ctx.setLineDash([]);
      if (P.length === 1) {
        ctx.beginPath();
        ctx.arc(a[0], a[1], s.width / 2, 0, Math.PI * 2);
        ctx.fill();
      } else smoothPath(ctx, P);
      for (let i = 1; i < P.length; i += 1) hit.seg(...P[i - 1], ...P[i], s.width / 2);
      break;
    }
    case 'marker': {
      const m = MARKERS[s.kind] || MARKERS.buy;
      const below = s.kind === 'buy';
      const r = 11;
      const cy = a[1] + (below ? r + 6 : -(r + 6));
      ctx.fillStyle = m.color;
      ctx.beginPath();
      ctx.arc(a[0], cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${m.glyph.length > 1 ? 9 : 12}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(m.glyph, a[0], cy + 1);
      hit.rect(a[0] - r, cy - r, r * 2, r * 2);
      if (s.text) {
        ctx.fillStyle = m.color;
        ctx.font = '11px Inter, system-ui, sans-serif';
        ctx.textBaseline = below ? 'top' : 'bottom';
        ctx.fillText(s.text, a[0], below ? cy + r + 3 : cy - r - 3);
      }
      break;
    }
    default:
  }
  ctx.restore();
}

export const handlePos = (d, v) => {
  if (d.type === 'brush' || d.type === 'highlighter') return [];
  return d.points.map((pt) => {
    const x = v.x(pt.t);
    const y = v.y(pt.p);
    if (x == null || y == null) return null;
    if (d.type === 'hline') return [Math.min(Math.max(x, 12), v.W - 12), y];
    if (d.type === 'vline') return [x, v.H / 2];
    return [x, y];
  });
};

export function renderHandles(ctx, d, v) {
  ctx.save();
  ctx.setLineDash([]);
  handlePos(d, v).forEach((h) => {
    if (!h) return;
    ctx.beginPath();
    ctx.arc(h[0], h[1], 5, 0, Math.PI * 2);
    ctx.fillStyle = '#0A0B0D';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = d.locked ? '#F59E0B' : '#2962FF';
    ctx.stroke();
  });
  ctx.restore();
}

export function renderAxisLabels(ctx, d, v, selected) {
  const s = d.style;
  const priceTag = (p, color) => {
    const y = v.y(p);
    if (y == null || y < 0 || y > v.H) return;
    ctx.font = '11px Inter, system-ui, sans-serif';
    const label = v.price(p);
    roundRect(ctx, v.W + 1, y - 9, v.axisW - 2, 18, 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(label, v.W + 5, y);
  };
  const timeTag = (t, color) => {
    const x = v.x(t);
    if (x == null || x < 0 || x > v.W) return;
    const label = v.time(t);
    ctx.font = '11px Inter, system-ui, sans-serif';
    const w = ctx.measureText(label).width + 10;
    roundRect(ctx, x - w / 2, v.H + 2, w, 18, 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, v.H + 11);
  };
  ctx.save();
  if (d.type === 'hline' && s.showLabel) priceTag(d.points[0].p, s.color);
  else if (d.type === 'vline' && s.showLabel) timeTag(d.points[0].t, s.color);
  else if (selected && d.type !== 'brush' && d.type !== 'highlighter') {
    d.points.forEach((pt) => priceTag(pt.p, '#2962FF'));
    d.points.forEach((pt) => timeTag(pt.t, '#2962FF'));
  }
  ctx.restore();
}
