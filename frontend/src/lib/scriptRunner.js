const WORKER_SRC = `
const ta = {
  sma(v, n) { const o = new Array(v.length).fill(null); let s = 0; for (let i = 0; i < v.length; i++) { s += v[i]; if (i >= n) s -= v[i - n]; if (i >= n - 1) o[i] = s / n; } return o; },
  ema(v, n) { const o = new Array(v.length).fill(null); const k = 2 / (n + 1); let p = null; for (let i = 0; i < v.length; i++) { p = p === null ? v[i] : v[i] * k + p * (1 - k); if (i >= n - 1) o[i] = p; } return o; },
  rsi(v, n) { const o = new Array(v.length).fill(null); let g = 0, l = 0; for (let i = 1; i < v.length; i++) { const d = v[i] - v[i - 1]; const up = Math.max(d, 0), dn = Math.max(-d, 0); if (i <= n) { g += up / n; l += dn / n; } else { g = (g * (n - 1) + up) / n; l = (l * (n - 1) + dn) / n; } if (i >= n) o[i] = l === 0 ? 100 : 100 - 100 / (1 + g / l); } return o; },
  highest(v, n) { return v.map((_, i) => i < n - 1 ? null : Math.max(...v.slice(i - n + 1, i + 1))); },
  lowest(v, n) { return v.map((_, i) => i < n - 1 ? null : Math.min(...v.slice(i - n + 1, i + 1))); },
  crossover(a, b) { return a.map((x, i) => i > 0 && x != null && b[i] != null && a[i - 1] != null && b[i - 1] != null && a[i - 1] <= b[i - 1] && x > b[i]); },
  crossunder(a, b) { return a.map((x, i) => i > 0 && x != null && b[i] != null && a[i - 1] != null && b[i - 1] != null && a[i - 1] >= b[i - 1] && x < b[i]); },
};
const blocked = ['fetch', 'XMLHttpRequest', 'WebSocket', 'importScripts', 'postMessage', 'self', 'indexedDB', 'caches', 'EventSource', 'BroadcastChannel'];
onmessage = (e) => {
  const { code, candles } = e.data;
  const signals = [];
  const plots = [];
  const data = {
    time: candles.map((c) => c.time), open: candles.map((c) => c.open), high: candles.map((c) => c.high),
    low: candles.map((c) => c.low), close: candles.map((c) => c.close), volume: candles.map((c) => c.volume || 0),
  };
  const signal = (i, side, text) => { if (Number.isInteger(i) && i >= 0 && i < candles.length && (side === 'buy' || side === 'sell')) signals.push({ i, side, text: text ? String(text) : '' }); };
  const plot = (name, values, color) => { plots.push({ name: String(name), values: Array.from(values, (v) => (typeof v === 'number' && isFinite(v) ? v : null)), color }); };
  const log = [];
  const console = { log: (...a) => log.push(a.map(String).join(' ')) };
  try {
    new Function('data', 'ta', 'signal', 'plot', 'console', ...blocked, code)(data, ta, signal, plot, console, ...blocked.map(() => undefined));
    postMessage({ ok: true, signals, plots, log });
  } catch (err) {
    postMessage({ ok: false, error: String(err && err.message ? err.message : err) });
  }
};
`;

export function runScript(code, candles, timeoutMs = 4000) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(new Blob([WORKER_SRC], { type: 'text/javascript' }));
    const worker = new Worker(url);
    const done = (result) => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve(result);
    };
    const timer = setTimeout(() => done({ ok: false, error: 'Script took too long and was stopped.' }), timeoutMs);
    worker.onmessage = (e) => done(e.data);
    worker.onerror = (e) => done({ ok: false, error: e.message || 'Script failed to run.' });
    worker.postMessage({ code, candles });
  });
}
