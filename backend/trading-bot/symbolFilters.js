const decimals = (step) => {
  const s = String(step);
  if (s.includes("e-")) return Number(s.split("e-")[1]);
  return (s.split(".")[1] || "").replace(/0+$/, "").length;
};

export function roundToStep(value, step) {
  if (!(step > 0)) return value;
  const d = decimals(step);
  return Number((Math.floor(Math.round((value / step) * 1e8) / 1e8) * step).toFixed(d));
}

export function roundToTick(value, tick) {
  if (!(tick > 0)) return value;
  const d = decimals(tick);
  return Number((Math.round(value / tick) * tick).toFixed(d));
}

export function parseSymbolInfo(raw) {
  const f = Object.fromEntries((raw.filters || []).map((x) => [x.filterType, x]));
  const notional = f.NOTIONAL || f.MIN_NOTIONAL || {};
  return {
    symbol: raw.symbol,
    baseAsset: raw.baseAsset,
    quoteAsset: raw.quoteAsset,
    tickSize: Number(f.PRICE_FILTER?.tickSize) || 0,
    stepSize: Number(f.LOT_SIZE?.stepSize) || 0,
    minQty: Number(f.LOT_SIZE?.minQty) || 0,
    minNotional: Number(notional.minNotional) || 0,
  };
}

export function normalizeOrder(info, price, quantity) {
  const p = roundToTick(price, info.tickSize);
  const q = roundToStep(quantity, info.stepSize);
  if (q < info.minQty) return { ok: false, reason: "Quantity below minimum lot size", price: p, quantity: q };
  if (p * q < info.minNotional) return { ok: false, reason: "Order value below minimum notional", price: p, quantity: q };
  return { ok: true, price: p, quantity: q };
}

export function createTtlCache(ttlMs, now = () => Date.now()) {
  const map = new Map();
  return {
    get(key) {
      const e = map.get(key);
      if (!e) return null;
      if (now() > e.expiry) {
        map.delete(key);
        return null;
      }
      return e.value;
    },
    set(key, value) {
      map.set(key, { value, expiry: now() + ttlMs });
    },
  };
}
