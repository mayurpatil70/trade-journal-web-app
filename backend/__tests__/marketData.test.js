import { jest, describe, it, expect, beforeAll, beforeEach } from "@jest/globals";

jest.unstable_mockModule("../config/supabase.js", () => ({ supabase: { from: jest.fn() } }));

let md, cache;
beforeAll(async () => {
  md = await import("../utils/marketData.js");
  cache = await import("../utils/marketCache.js");
});

function fakeDb({ row = null, readError = null, writeError = null } = {}) {
  const upsert = jest.fn(async () => ({ error: writeError }));
  const db = {
    from: jest.fn(() => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: row, error: readError }) }) }),
      upsert,
    })),
  };
  return { db, upsert };
}

describe("resolveSymbol", () => {
  it.each([
    ["EURUSD", "EURUSD=X"],
    ["eur/usd", "EURUSD=X"],
    ["GBPJPY", "GBPJPY=X"],
    ["gold", "GC=F"],
    ["XAUUSD", "GC=F"],
    ["nasdaq", "^NDX"],
    ["US30", "^DJI"],
    ["btc", "BTC-USD"],
    ["BTCUSDT", "BTC-USD"],
  ])("%s → %s", (input, yahoo) => {
    expect(md.resolveSymbol(input).yahoo).toBe(yahoo);
  });

  it.each(["hello", "EURXYZ", "USDUSD", "", null])("rejects %s", (input) => {
    expect(md.resolveSymbol(input)).toBeNull();
  });
});

describe("extractSymbols", () => {
  it("finds instruments in free text, deduped, in order", () => {
    const out = md.extractSymbols("I'm long EUR/USD and gold, thinking about EURUSD again");
    expect(out.map((s) => s.symbol)).toEqual(["EURUSD", "XAUUSD"]);
  });

  it("ignores ordinary words", () => {
    expect(md.extractSymbols("I feel anxious about my last trade")).toEqual([]);
  });

  it("caps the number of symbols", () => {
    const out = md.extractSymbols("EURUSD GBPUSD USDJPY AUDUSD NZDUSD USDCAD");
    expect(out).toHaveLength(4);
  });
});

describe("needsMarketData", () => {
  it("is true for symbols or market keywords, false for pure psychology", () => {
    expect(md.needsMarketData("hi", [{ symbol: "EURUSD" }])).toBe(true);
    expect(md.needsMarketData("what's the market doing today?", [])).toBe(true);
    expect(md.needsMarketData("I feel scared and stressed", [])).toBe(false);
  });
});

describe("fetchYahooQuote", () => {
  const payload = (closes) => ({
    data: {
      chart: {
        result: [
          {
            meta: {
              regularMarketPrice: 1.1,
              chartPreviousClose: 1.0,
              regularMarketDayHigh: 1.12,
              regularMarketDayLow: 0.99,
              regularMarketTime: 1_700_000_000,
            },
            indicators: { quote: [{ close: closes }] },
          },
        ],
      },
    },
  });

  it("maps meta and computes changes", async () => {
    const http = { get: jest.fn(async () => payload([1.0, 1.01, null, 1.02, 1.03, 1.04, 1.05])) };
    const q = await md.fetchYahooQuote("EURUSD=X", http);
    expect(q.price).toBe(1.1);
    expect(q.changePct).toBe(10);
    expect(q.hourChangePct).toBe(8.91);
    expect(q.dayHigh).toBe(1.12);
    expect(q.marketTime).toBe(new Date(1_700_000_000 * 1000).toISOString());
  });

  it("throws when the quote is missing", async () => {
    const http = { get: jest.fn(async () => ({ data: { chart: { result: null } } })) };
    await expect(md.fetchYahooQuote("NOPE", http)).rejects.toThrow(/No quote/);
  });
});

describe("upcomingEvents", () => {
  const now = Date.parse("2026-01-05T12:00:00Z");
  const ev = (date, impact = "High") => ({ title: "x", country: "USD", impact, date });

  it("keeps high/medium events inside the window, sorted", () => {
    const out = md.upcomingEvents(
      [
        ev("2026-01-05T20:00:00Z"),
        ev("2026-01-05T13:00:00Z", "Medium"),
        ev("2026-01-05T14:00:00Z", "Low"),
        ev("2026-01-07T13:00:00Z"),
        ev("2026-01-05T08:00:00Z"),
        ev("garbage"),
      ],
      now,
    );
    expect(out.map((e) => e.date)).toEqual(["2026-01-05T13:00:00Z", "2026-01-05T20:00:00Z"]);
  });
});

describe("formatQuotes", () => {
  it("marks stale quotes and formats precision", () => {
    const text = md.formatQuotes([
      { symbol: "EURUSD", name: "EUR/USD", price: 1.08321, changePct: 0.1, hourChangePct: null, dayHigh: 1.09, dayLow: 1.08, marketTime: "t", stale: true },
      { symbol: "XAUUSD", name: "Gold", price: 2400.123, changePct: -0.5, hourChangePct: 0.2, marketTime: "t", stale: false },
    ]);
    expect(text).toContain("EURUSD (EUR/USD): 1.08321 | day +0.1% | last hour n/a | day range 1.08000-1.09000 | as of t [STALE]");
    expect(text).toContain("XAUUSD (Gold): 2400.12 | day -0.5%");
  });
});

describe("cached (DB cache)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns a fresh row without calling the fetcher", async () => {
    const { db } = fakeDb({ row: { payload: { a: 1 }, fetched_at: "t", expires_at: new Date(Date.now() + 60_000).toISOString() } });
    const fetcher = jest.fn();
    const out = await cache.cached("k1", 1000, fetcher, db);
    expect(out).toMatchObject({ data: { a: 1 }, hit: true, stale: false });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("fetches and upserts on a miss", async () => {
    const { db, upsert } = fakeDb();
    const out = await cache.cached("k2", 5000, async () => ({ b: 2 }), db);
    expect(out).toMatchObject({ data: { b: 2 }, hit: false });
    const row = upsert.mock.calls[0][0];
    expect(row.cache_key).toBe("k2");
    expect(new Date(row.expires_at) - new Date(row.fetched_at)).toBe(5000);
  });

  it("serves a stale row when the fetch fails", async () => {
    const { db } = fakeDb({ row: { payload: { c: 3 }, fetched_at: "old", expires_at: new Date(Date.now() - 1000).toISOString() } });
    const out = await cache.cached("k3", 1000, async () => { throw new Error("down"); }, db);
    expect(out).toMatchObject({ data: { c: 3 }, stale: true });
  });

  it("throws when the fetch fails and nothing is cached", async () => {
    const { db } = fakeDb();
    await expect(cache.cached("k4", 1000, async () => { throw new Error("down"); }, db)).rejects.toThrow("down");
  });

  it("still works when the cache table is unavailable", async () => {
    const { db } = fakeDb({ readError: new Error("relation does not exist"), writeError: new Error("nope") });
    const out = await cache.cached("k5", 1000, async () => ({ d: 4 }), db);
    expect(out.data).toEqual({ d: 4 });
  });

  it("shares one fetch between concurrent misses", async () => {
    const { db } = fakeDb();
    const fetcher = jest.fn(async () => ({ e: 5 }));
    await Promise.all([cache.cached("k6", 1000, fetcher, db), cache.cached("k6", 1000, fetcher, db)]);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
