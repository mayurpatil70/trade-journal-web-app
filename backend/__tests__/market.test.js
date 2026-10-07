import { describe, it, expect } from "@jest/globals";
import {
  STATIC_CATALOG, buildCryptoEntries, searchSymbols, findSymbol,
} from "../market/symbolCatalog.js";
import { aggregateCandles, normalizeCandles, parseBinanceKlines, parseYahooChart } from "../market/candles.js";

const info = {
  symbols: [
    { symbol: "ETHBTC", status: "TRADING", baseAsset: "ETH", quoteAsset: "BTC" },
    { symbol: "BTCUSDT", status: "TRADING", baseAsset: "BTC", quoteAsset: "USDT" },
    { symbol: "OLDUSDT", status: "BREAK", baseAsset: "OLD", quoteAsset: "USDT" },
    { symbol: "BTCEUR", status: "TRADING", baseAsset: "BTC", quoteAsset: "EUR" },
    { symbol: "SOLUSDT", status: "TRADING", baseAsset: "SOL", quoteAsset: "USDT" },
  ],
};

describe("symbol catalog", () => {
  it("covers forex, indices and futures with a chart source", () => {
    for (const cls of ["forex", "indices", "futures"]) {
      const items = STATIC_CATALOG.filter((e) => e.assetClass === cls);
      expect(items.length).toBeGreaterThan(10);
      expect(items.every((e) => e.yahoo && e.chart)).toBe(true);
    }
    expect(findSymbol(STATIC_CATALOG, "xau/usd")?.yahoo).toBe("GC=F");
  });

  it("marks non-crypto symbols as not executable on Binance, with a reason", () => {
    const eur = findSymbol(STATIC_CATALOG, "EURUSD");
    expect(eur.executable).toEqual({ binance: false, mt5: true });
    expect(eur.reason).toMatch(/MT5/);
  });

  it("keeps only trading spot pairs with supported quotes, USDT first", () => {
    const list = buildCryptoEntries(info);
    expect(list.map((e) => e.symbol)).toEqual(["BTCUSDT", "SOLUSDT", "ETHBTC"]);
    expect(list.every((e) => e.executable.binance)).toBe(true);
  });

  it("searches by symbol or name, exact matches first, and filters by class", () => {
    const all = [...buildCryptoEntries(info), ...STATIC_CATALOG];
    expect(searchSymbols(all, { q: "btc" }).data[0].symbol).toBe("BTCUSDT");
    expect(searchSymbols(all, { assetClass: "indices", q: "dax" }).data.map((e) => e.symbol)).toEqual(["GER40"]);
    expect(searchSymbols(all, { q: "eur/usd" }).data[0].symbol).toBe("EURUSD");
  });

  it("paginates", () => {
    const first = searchSymbols(STATIC_CATALOG, { assetClass: "forex", limit: 10, page: 1 });
    const second = searchSymbols(STATIC_CATALOG, { assetClass: "forex", limit: 10, page: 2 });
    expect(first.data).toHaveLength(10);
    expect(first.hasMore).toBe(true);
    expect(second.data[0].symbol).not.toBe(first.data[0].symbol);
    expect(first.total).toBe(STATIC_CATALOG.filter((e) => e.assetClass === "forex").length);
  });
});

describe("candle parsing", () => {
  it("drops null rows from Yahoo and sorts ascending", () => {
    const data = {
      chart: { result: [{ timestamp: [300, 100, 200], indicators: { quote: [{ open: [3, 1, null], high: [4, 2, null], low: [2, 0.5, null], close: [3.5, 1.5, null], volume: [1, 1, 1] }] } }] },
    };
    expect(parseYahooChart(data).map((c) => c.time)).toEqual([100, 300]);
  });

  it("parses Binance klines to seconds", () => {
    const [c] = parseBinanceKlines([[1700000000000, "1", "2", "0.5", "1.5", "10"]]);
    expect(c).toEqual({ time: 1700000000, open: 1, high: 2, low: 0.5, close: 1.5, volume: 10 });
  });

  it("dedupes by time and drops inverted candles", () => {
    const out = normalizeCandles([
      { time: 1, open: 1, high: 2, low: 1, close: 2 },
      { time: 1, open: 1, high: 3, low: 1, close: 3 },
      { time: 2, open: 1, high: 1, low: 2, close: 1 },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].high).toBe(3);
  });

  it("aggregates 1h into 4h buckets", () => {
    const h = (t, o, hi, l, c) => ({ time: t, open: o, high: hi, low: l, close: c, volume: 1 });
    const out = aggregateCandles([h(0, 1, 2, 1, 2), h(3600, 2, 5, 2, 4), h(14400, 4, 4, 3, 3)], 14400);
    expect(out).toEqual([
      { time: 0, open: 1, high: 5, low: 1, close: 4, volume: 2 },
      { time: 14400, open: 4, high: 4, low: 3, close: 3, volume: 1 },
    ]);
  });
});
