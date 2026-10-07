export const TIMEFRAMES = ["M1", "M5", "M15", "M30", "H1", "H4", "D1"];
const SYMBOL_RE = /^[A-Za-z0-9._#-]{2,20}$/;
const MAX_CANDLES = 300;
const MIN_CANDLES = 20;

export const NONE = (reason) => ({ action: "NONE", reason });

export function validateCandles(raw) {
  if (!Array.isArray(raw) || raw.length < MIN_CANDLES || raw.length > MAX_CANDLES) {
    return { ok: false, error: `candles must be an array of ${MIN_CANDLES}-${MAX_CANDLES} rows` };
  }
  const candles = [];
  for (const row of raw) {
    if (!Array.isArray(row) || row.length < 5) return { ok: false, error: "each candle must be [time, open, high, low, close, volume?]" };
    const [t, o, h, l, c, v = 0] = row.map(Number);
    if (![t, o, h, l, c, v].every(Number.isFinite) || h < l || o <= 0 || c <= 0) return { ok: false, error: "candles contain invalid numbers" };
    candles.push([t, o, h, l, c, v]);
  }
  return { ok: true, candles };
}

export function validateAnalyzeInput(body = {}) {
  const symbol = String(body.symbol || "").trim();
  if (!SYMBOL_RE.test(symbol)) return { ok: false, error: "invalid symbol" };
  const timeframe = String(body.timeframe || "").toUpperCase();
  if (!TIMEFRAMES.includes(timeframe)) return { ok: false, error: `timeframe must be one of ${TIMEFRAMES.join(", ")}` };
  const c = validateCandles(body.candles);
  if (!c.ok) return c;
  return { ok: true, symbol, timeframe, candles: c.candles };
}

export function validateSettings(input = {}) {
  const errors = [];
  const mode = input.mode ?? "paper";
  if (!["paper", "live"].includes(mode)) errors.push("mode must be paper or live");
  const maxRiskPct = Number(input.maxRiskPct ?? 1);
  if (!(maxRiskPct > 0 && maxRiskPct <= 5)) errors.push("maxRiskPct must be between 0 and 5");
  const minRr = Number(input.minRr ?? 1);
  if (!(minRr >= 0.5 && minRr <= 10)) errors.push("minRr must be between 0.5 and 10");
  const timeframe = String(input.timeframe ?? "H1").toUpperCase();
  if (!TIMEFRAMES.includes(timeframe)) errors.push("invalid timeframe");
  const symbols = Array.isArray(input.symbols) ? input.symbols.map((s) => String(s).trim()).filter(Boolean) : [];
  if (symbols.length > 10 || symbols.some((s) => !SYMBOL_RE.test(s))) errors.push("symbols must be up to 10 valid symbols");
  const autoExecute = Boolean(input.autoExecute);
  if (autoExecute && mode !== "live") errors.push("autoExecute requires live mode");
  if (errors.length) return { ok: false, errors };
  return { ok: true, value: { mode, auto_execute: autoExecute, max_risk_pct: maxRiskPct, min_rr: minRr, timeframe, symbols } };
}

export function parseSignalText(text, extract) {
  try {
    const obj = extract(String(text ?? ""));
    return obj && typeof obj === "object" ? obj : null;
  } catch {
    return null;
  }
}

export function validateSignal(raw, { lastClose, minRr = 1, maxEntryDeviationPct = 2, maxStopPct = 10 } = {}) {
  if (!raw || typeof raw !== "object") return NONE("unparseable model reply");
  const action = String(raw.action ?? "").toUpperCase();
  if (action === "NONE") return NONE(typeof raw.reason === "string" ? raw.reason.slice(0, 200) : "no setup");
  if (action !== "BUY" && action !== "SELL") return NONE("invalid action");

  const entry = Number(raw.entry);
  const sl = Number(raw.sl);
  const tp = Number(raw.tp);
  if (![entry, sl, tp].every((n) => Number.isFinite(n) && n > 0)) return NONE("entry, sl and tp must be positive numbers");

  const ordered = action === "BUY" ? sl < entry && entry < tp : tp < entry && entry < sl;
  if (!ordered) return NONE("sl/tp on the wrong side of entry");

  if (lastClose > 0 && Math.abs(entry - lastClose) / lastClose > maxEntryDeviationPct / 100) return NONE("entry too far from market");
  const risk = Math.abs(entry - sl);
  const reward = Math.abs(tp - entry);
  if (risk / entry > maxStopPct / 100) return NONE("stop loss too wide");
  if (reward / risk < minRr) return NONE("reward to risk below minimum");

  return { action, entry, sl, tp, rr: Number((reward / risk).toFixed(2)) };
}

export function buildSignalMessages({ symbol, timeframe, candles }) {
  const rows = candles.map((c) => c.join(",")).join("\n");
  return [
    {
      role: "system",
      content:
        "You are an expert Smart Money Concepts (SMC) trader. You receive OHLCV candles and look for Order Blocks, Fair Value Gaps and liquidity sweeps. " +
        'Reply ONLY with one JSON object. For a valid setup: {"action":"BUY"|"SELL","entry":number,"sl":number,"tp":number}. ' +
        'With no clear setup: {"action":"NONE"}. Prices must use the same precision as the data. Never add commentary.',
    },
    { role: "user", content: `Symbol: ${symbol}\nTimeframe: ${timeframe}\nCandles (oldest first) as time,open,high,low,close,volume:\n${rows}` },
  ];
}

export async function generateSignal({ symbol, timeframe, candles }, { complete, extract, minRr }) {
  let text;
  try {
    text = await complete(buildSignalMessages({ symbol, timeframe, candles }), { temperature: 0.2, max_tokens: 400 });
  } catch (err) {
    return NONE(`AI unavailable: ${err.message}`.slice(0, 200));
  }
  return validateSignal(parseSignalText(text, extract), { lastClose: candles[candles.length - 1][4], minRr });
}
