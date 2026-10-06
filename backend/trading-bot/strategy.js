import { normalizeOrder } from "./symbolFilters.js";

export function buildGridLevels({ price, spacingPct, count }) {
  return Array.from({ length: count }, (_, i) => price * (1 - ((i + 1) * spacingPct) / 100));
}

export function planBuyOrders({ config, info, price, openBuyPrices, balanceQuote }) {
  const slots = config.maxActiveOrders - openBuyPrices.length;
  if (slots <= 0) return [];
  const perOrder = Math.min(config.allocatedCapital / config.maxActiveOrders, balanceQuote / config.maxActiveOrders);
  const levels = buildGridLevels({ price, spacingPct: config.gridSpacingPercentage, count: config.maxActiveOrders });
  const tolerance = (config.gridSpacingPercentage / 100) * price * 0.25;
  const plans = [];
  for (const level of levels) {
    if (plans.length >= slots) break;
    if (openBuyPrices.some((p) => Math.abs(p - level) < tolerance)) continue;
    const order = normalizeOrder(info, level, perOrder / level);
    if (order.ok) plans.push({ side: "BUY", price: order.price, quantity: order.quantity });
  }
  return plans;
}

export function sellPriceFor(buyPrice, takeProfitPct) {
  return buyPrice * (1 + takeProfitPct / 100);
}

export function stopLossTriggered({ avgEntry, price, stopLossPct }) {
  return avgEntry > 0 && price <= avgEntry * (1 - stopLossPct / 100);
}

export function updateTrailingStop({ highest, price, trailingPct }) {
  const nextHigh = Math.max(highest || 0, price);
  const stop = trailingPct > 0 ? nextHigh * (1 - trailingPct / 100) : null;
  return { highest: nextHigh, stop, hit: stop != null && price <= stop };
}

export function averageEntry(fills) {
  const qty = fills.reduce((s, f) => s + f.quantity, 0);
  if (!qty) return { qty: 0, avg: 0 };
  return { qty, avg: fills.reduce((s, f) => s + f.price * f.quantity, 0) / qty };
}
