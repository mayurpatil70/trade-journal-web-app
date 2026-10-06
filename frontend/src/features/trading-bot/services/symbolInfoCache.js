const TTL = 60 * 60 * 1000;
const BASE = "https://api.binance.com";
const cache = new Map();
const inflight = new Map();

const num = (v) => Number(v) || 0;

function parse(raw) {
  const f = Object.fromEntries(raw.filters.map((x) => [x.filterType, x]));
  const notional = f.NOTIONAL || f.MIN_NOTIONAL || {};
  return {
    symbol: raw.symbol,
    baseAsset: raw.baseAsset,
    quoteAsset: raw.quoteAsset,
    tickSize: num(f.PRICE_FILTER?.tickSize),
    stepSize: num(f.LOT_SIZE?.stepSize),
    minNotional: num(notional.minNotional),
  };
}

export async function getSymbolInfo(symbol) {
  const hit = cache.get(symbol);
  if (hit && Date.now() < hit.expiry) return hit.data;
  if (inflight.has(symbol)) return inflight.get(symbol);
  const req = fetch(`${BASE}/api/v3/exchangeInfo?symbol=${encodeURIComponent(symbol)}`)
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Unknown symbol"))))
    .then((body) => {
      const data = parse(body.symbols[0]);
      cache.set(symbol, { data, expiry: Date.now() + TTL });
      return data;
    })
    .finally(() => inflight.delete(symbol));
  inflight.set(symbol, req);
  return req;
}
