import axios from "axios";

export const TIMEFRAMES = ["1m", "5m", "15m", "30m", "1h", "4h", "1d"];

const TF_SECONDS = { "1m": 60, "5m": 300, "15m": 900, "30m": 1800, "1h": 3600, "4h": 14400, "1d": 86400 };

const YAHOO_PLAN = {
  "1m": { interval: "1m", range: "7d" },
  "5m": { interval: "5m", range: "60d" },
  "15m": { interval: "15m", range: "60d" },
  "30m": { interval: "30m", range: "60d" },
  "1h": { interval: "1h", range: "730d" },
  "4h": { interval: "1h", range: "730d", aggregate: "4h" },
  "1d": { interval: "1d", range: "10y" },
};

const BINANCE_HOSTS = ["https://data-api.binance.vision", "https://api.binance.com"];
const YAHOO_HOSTS = ["query1.finance.yahoo.com", "query2.finance.yahoo.com"];
const BINANCE_PAGE = 1000;
const MAX_CANDLES = 5000;
const TTL_MS = { "1m": 30_000, "5m": 60_000, "15m": 120_000, "30m": 180_000, "1h": 300_000, "4h": 600_000, "1d": 900_000 };

const cache = new Map();
const inflight = new Map();

export function clearCandleCache() {
  cache.clear();
  inflight.clear();
}

export function normalizeCandles(rows) {
  const byTime = new Map();
  for (const c of rows) {
    const ok = [c.time, c.open, c.high, c.low, c.close].every((v) => Number.isFinite(v));
    if (ok && c.high >= c.low) byTime.set(c.time, c);
  }
  return [...byTime.values()].sort((a, b) => a.time - b.time);
}

export function aggregateCandles(candles, seconds) {
  const out = [];
  for (const c of candles) {
    const bucket = Math.floor(c.time / seconds) * seconds;
    const last = out[out.length - 1];
    if (last && last.time === bucket) {
      last.high = Math.max(last.high, c.high);
      last.low = Math.min(last.low, c.low);
      last.close = c.close;
      last.volume += c.volume ?? 0;
    } else {
      out.push({ time: bucket, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume ?? 0 });
    }
  }
  return out;
}

export function parseYahooChart(data) {
  const result = data?.chart?.result?.[0];
  const q = result?.indicators?.quote?.[0];
  if (!result?.timestamp || !q) return [];
  return normalizeCandles(
    result.timestamp.map((t, i) => ({
      time: t,
      open: q.open?.[i],
      high: q.high?.[i],
      low: q.low?.[i],
      close: q.close?.[i],
      volume: q.volume?.[i] ?? 0,
    })),
  );
}

export function parseBinanceKlines(rows) {
  return normalizeCandles(
    rows.map((r) => ({
      time: Math.floor(r[0] / 1000),
      open: Number(r[1]),
      high: Number(r[2]),
      low: Number(r[3]),
      close: Number(r[4]),
      volume: Number(r[5]),
    })),
  );
}

async function binanceGet(path, params, http) {
  let lastErr;
  for (const host of BINANCE_HOSTS) {
    try {
      const { data } = await http.get(`${host}${path}`, { params, timeout: 10000 });
      return data;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

export async function fetchBinanceCandles(symbol, tf, limit, toSec, http = axios) {
  let endTime = toSec ? toSec * 1000 : undefined;
  let rows = [];
  while (rows.length < limit) {
    const want = Math.min(BINANCE_PAGE, limit - rows.length);
    const page = await binanceGet("/api/v3/klines", { symbol, interval: tf, limit: want, endTime }, http);
    if (!page.length) break;
    rows = page.concat(rows);
    endTime = page[0][0] - 1;
    if (page.length < want) break;
  }
  return parseBinanceKlines(rows);
}

export async function fetchYahooCandles(yahooSymbol, tf, toSec, http = axios) {
  const plan = YAHOO_PLAN[tf];
  const params = { interval: plan.interval, range: plan.range, includePrePost: false };
  let lastErr;
  for (const host of YAHOO_HOSTS) {
    try {
      const { data } = await http.get(`https://${host}/v8/finance/chart/${encodeURIComponent(yahooSymbol)}`, {
        params,
        timeout: 15000,
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      let candles = parseYahooChart(data);
      if (plan.aggregate) candles = aggregateCandles(candles, TF_SECONDS[plan.aggregate]);
      return toSec ? candles.filter((c) => c.time <= toSec) : candles;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

export async function getCandles(entry, tf, { limit = 1000, to } = {}, http = axios) {
  if (!TF_SECONDS[tf]) throw new Error(`Unsupported timeframe ${tf}`);
  const count = Math.min(Math.max(Number(limit) || 1000, 50), MAX_CANDLES);
  const toSec = to ? Number(to) : undefined;
  const key = `${entry.symbol}:${tf}:${count}:${toSec ?? "latest"}`;
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.candles;
  if (inflight.has(key)) return inflight.get(key);

  const pending = (async () => {
    try {
      const raw =
        entry.assetClass === "crypto"
          ? await fetchBinanceCandles(entry.symbol, tf, count, toSec, http)
          : await fetchYahooCandles(entry.yahoo, tf, toSec, http);
      const candles = raw.slice(-count);
      cache.set(key, { candles, expires: Date.now() + (toSec ? 3_600_000 : TTL_MS[tf]) });
      return candles;
    } catch (err) {
      if (hit) return hit.candles;
      throw err;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, pending);
  return pending;
}
