const TTL = 5000;
const cache = new Map();

export async function getPrices(symbols) {
  const key = [...symbols].sort().join(",");
  const hit = cache.get(key);
  if (hit && Date.now() < hit.expiry) return hit.data;
  const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(symbols))}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Market data unavailable");
  const data = (await res.json()).map((t) => ({
    symbol: t.symbol,
    price: Number(t.lastPrice),
    changePct: Number(t.priceChangePercent),
  }));
  cache.set(key, { data, expiry: Date.now() + TTL });
  return data;
}
