import * as binance from "./binanceClient.js";
import * as store from "./store.js";
import { normalizeOrder } from "./symbolFilters.js";
import { planBuyOrders, sellPriceFor, stopLossTriggered, updateTrailingStop, averageEntry } from "./strategy.js";

const TICK_MS = 15000;
let timer = null;
let running = false;
let lastTickAt = null;

const configOf = (row) => ({ ...row.params, symbol: row.symbol });

async function syncOrders(row, info) {
  for (const o of await store.openOrders(row.id)) {
    if (!o.binance_order_id) continue;
    const remote = await binance.getOrder(row.symbol, o.binance_order_id);
    if (remote.status === o.status && Number(remote.executedQty) === Number(o.executed_qty)) continue;
    await store.updateOrder(o.id, { status: remote.status, executed_qty: Number(remote.executedQty) });
    if (remote.status !== "FILLED") continue;
    await store.log(row.user_id, row.id, `${o.side} ${o.quantity} ${row.symbol} filled at ${o.price}`);
    if (o.side === "BUY") {
      const sell = normalizeOrder(info, sellPriceFor(Number(o.price), row.params.takeProfitPercentage), Number(remote.executedQty));
      if (sell.ok) await placeOrder(row, "SELL", sell.price, sell.quantity, o.id);
    }
  }
}

async function placeOrder(row, side, price, quantity, parentId = null) {
  const clientOrderId = `tj_${row.id.slice(0, 8)}_${Date.now().toString(36)}`;
  try {
    const remote = await binance.placeLimit(row.symbol, side, price, quantity, clientOrderId);
    await store.insertOrder({
      config_id: row.id, user_id: row.user_id, binance_order_id: remote.orderId, client_order_id: clientOrderId,
      symbol: row.symbol, side, type: "LIMIT", price, quantity, status: remote.status, parent_order_id: parentId,
    });
  } catch (err) {
    await store.log(row.user_id, row.id, `${side} order rejected: ${err.message}`, "error");
  }
}

async function exitPosition(row, info, reason, qty, avg, price) {
  for (const o of await store.openOrders(row.id)) {
    await binance.cancelOrder(row.symbol, o.binance_order_id).catch(() => {});
    await store.updateOrder(o.id, { status: "CANCELED" });
  }
  const order = normalizeOrder(info, price, qty);
  if (order.ok) {
    const remote = await binance.placeMarket(row.symbol, "SELL", order.quantity);
    await store.insertOrder({
      config_id: row.id, user_id: row.user_id, binance_order_id: remote.orderId, symbol: row.symbol, side: "SELL", type: "MARKET",
      price, quantity: order.quantity, executed_qty: Number(remote.executedQty), pnl: (price - avg) * order.quantity, status: remote.status,
    });
  }
  await store.updateConfig(row.id, { is_active: false, highest_price: 0 });
  await store.log(row.user_id, row.id, `${reason}: position closed at ~${price}, bot stopped`, "warn");
}

async function tickConfig(row) {
  const info = await binance.getSymbolInfo(row.symbol);
  const price = await binance.getPrice(row.symbol);
  await syncOrders(row, info);

  const fills = (await store.filledBuys(row.id)).map((o) => ({ price: Number(o.price), quantity: Number(o.executed_qty) }));
  const { qty, avg } = averageEntry(fills);

  if (qty > 0) {
    if (stopLossTriggered({ avgEntry: avg, price, stopLossPct: row.params.stopLossPercentage })) {
      return exitPosition(row, info, "Stop-loss hit", qty, avg, price);
    }
    const trail = updateTrailingStop({ highest: Number(row.highest_price), price, trailingPct: row.params.trailingPercentage });
    if (trail.highest !== Number(row.highest_price)) await store.updateConfig(row.id, { highest_price: trail.highest });
    if (trail.hit && price > avg) return exitPosition(row, info, "Trailing stop hit", qty, avg, price);
  }

  const open = await store.openOrders(row.id);
  const openBuys = open.filter((o) => o.side === "BUY").map((o) => Number(o.price));
  const balance = await binance.getFreeBalance(info.quoteAsset);
  for (const plan of planBuyOrders({ config: configOf(row), info, price, openBuyPrices: openBuys, balanceQuote: balance })) {
    await placeOrder(row, "BUY", plan.price, plan.quantity);
  }
}

export async function tick() {
  if (running) return;
  running = true;
  try {
    for (const row of await store.listActiveConfigs()) {
      try {
        await tickConfig(row);
      } catch (err) {
        await store.log(row.user_id, row.id, `Tick failed: ${err.message}`, "error").catch(() => {});
      }
    }
    lastTickAt = new Date().toISOString();
  } finally {
    running = false;
  }
}

export function ensureRunning() {
  if (timer) return;
  timer = setInterval(() => tick().catch(() => {}), TICK_MS);
  timer.unref?.();
}

export const engineState = () => ({ loopRunning: Boolean(timer), lastTickAt });
