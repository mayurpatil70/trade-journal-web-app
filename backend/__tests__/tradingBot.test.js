import { describe, it, expect } from "@jest/globals";
import { roundToStep, roundToTick, normalizeOrder, parseSymbolInfo, createTtlCache } from "../trading-bot/symbolFilters.js";
import { validateBotConfig, parsePagination, pageResult } from "../trading-bot/config.js";
import { buildGridLevels, planBuyOrders, stopLossTriggered, updateTrailingStop, averageEntry, sellPriceFor } from "../trading-bot/strategy.js";

const info = { tickSize: 0.01, stepSize: 0.001, minQty: 0.001, minNotional: 10 };
const valid = { symbol: "btcusdt", strategyType: "GRID", allocatedCapital: 1000, stopLossPercentage: 5, takeProfitPercentage: 2, maxActiveOrders: 4 };

describe("symbol filters", () => {
  it("rounds quantity down to step and price to tick", () => {
    expect(roundToStep(0.12349, 0.001)).toBe(0.123);
    expect(roundToStep(1.9, 1)).toBe(1);
    expect(roundToTick(100.126, 0.01)).toBe(100.13);
  });

  it("rejects orders below min lot or notional", () => {
    expect(normalizeOrder(info, 100, 0.0004).ok).toBe(false);
    expect(normalizeOrder(info, 100, 0.05).ok).toBe(false);
    expect(normalizeOrder(info, 100, 0.2)).toEqual({ ok: true, price: 100, quantity: 0.2 });
  });

  it("parses exchange filters", () => {
    const parsed = parseSymbolInfo({
      symbol: "BTCUSDT", baseAsset: "BTC", quoteAsset: "USDT",
      filters: [{ filterType: "PRICE_FILTER", tickSize: "0.01" }, { filterType: "LOT_SIZE", stepSize: "0.001", minQty: "0.001" }, { filterType: "NOTIONAL", minNotional: "5" }],
    });
    expect(parsed).toMatchObject({ tickSize: 0.01, stepSize: 0.001, minNotional: 5 });
  });

  it("expires cache entries after the TTL", () => {
    let t = 0;
    const cache = createTtlCache(100, () => t);
    cache.set("a", 1);
    expect(cache.get("a")).toBe(1);
    t = 101;
    expect(cache.get("a")).toBeNull();
  });
});

describe("config validation", () => {
  it("accepts and normalizes a valid config", () => {
    const r = validateBotConfig(valid);
    expect(r.ok).toBe(true);
    expect(r.value.symbol).toBe("BTCUSDT");
    expect(r.value.gridSpacingPercentage).toBe(1);
  });

  it("rejects risky or malformed inputs", () => {
    const r = validateBotConfig({ ...valid, symbol: "bad!", stopLossPercentage: 90, maxActiveOrders: 2.5, allocatedCapital: -1 });
    expect(r.ok).toBe(false);
    expect(r.errors).toHaveLength(4);
  });
});

describe("pagination", () => {
  it("clamps page and limit", () => {
    expect(parsePagination({ page: "0", limit: "9999" })).toMatchObject({ page: 1, limit: 100, from: 0, to: 99 });
    expect(parsePagination({ page: "3", limit: "10" })).toMatchObject({ from: 20, to: 29 });
  });

  it("builds a page result", () => {
    expect(pageResult([], 45, { page: 1, limit: 20 }).totalPages).toBe(3);
  });
});

describe("strategy", () => {
  it("builds descending grid levels", () => {
    expect(buildGridLevels({ price: 100, spacingPct: 1, count: 3 }).map((n) => +n.toFixed(2))).toEqual([99, 98, 97]);
  });

  it("plans only open grid slots without duplicating levels", () => {
    const config = { allocatedCapital: 1000, maxActiveOrders: 4, gridSpacingPercentage: 1 };
    const plans = planBuyOrders({ config, info, price: 100, openBuyPrices: [99, 98], balanceQuote: 5000 });
    expect(plans.length).toBeLessThanOrEqual(2);
    expect(plans.every((p) => p.side === "BUY" && p.price < 100)).toBe(true);
    expect(plans.some((p) => Math.abs(p.price - 99) < 0.1)).toBe(false);
  });

  it("detects stop-loss, trailing stop and computes averages", () => {
    expect(stopLossTriggered({ avgEntry: 100, price: 94.9, stopLossPct: 5 })).toBe(true);
    expect(stopLossTriggered({ avgEntry: 100, price: 96, stopLossPct: 5 })).toBe(false);
    expect(updateTrailingStop({ highest: 110, price: 107, trailingPct: 2 }).hit).toBe(true);
    expect(updateTrailingStop({ highest: 110, price: 109, trailingPct: 2 }).hit).toBe(false);
    expect(averageEntry([{ price: 100, quantity: 1 }, { price: 90, quantity: 3 }]).avg).toBe(92.5);
    expect(sellPriceFor(100, 2)).toBe(102);
  });
});
