// backend/utils/marketData.js
// Live market data (Yahoo Finance) + economic calendar, both behind the DB cache.
import axios from "axios";
import { cached } from "./marketCache.js";

const QUOTE_TTL_MS = Number(process.env.MARKET_QUOTE_TTL_SEC || 60) * 1000;
const CALENDAR_TTL_MS = Number(process.env.MARKET_CALENDAR_TTL_SEC || 900) * 1000;
const MAX_SYMBOLS = 4;

const FIAT = new Set(["USD", "EUR", "GBP", "JPY", "AUD", "NZD", "CAD", "CHF"]);
const CRYPTO = new Set(["BTC", "ETH", "SOL", "XRP", "BNB", "DOGE", "ADA", "LTC"]);

const INSTRUMENTS = {
  XAUUSD: { yahoo: "GC=F", name: "Gold" },
  XAGUSD: { yahoo: "SI=F", name: "Silver" },
  USOIL: { yahoo: "CL=F", name: "WTI Oil" },
  UKOIL: { yahoo: "BZ=F", name: "Brent Oil" },
  NAS100: { yahoo: "^NDX", name: "Nasdaq 100" },
  US30: { yahoo: "^DJI", name: "Dow Jones" },
  US500: { yahoo: "^GSPC", name: "S&P 500" },
  GER40: { yahoo: "^GDAXI", name: "DAX" },
  UK100: { yahoo: "^FTSE", name: "FTSE 100" },
  JP225: { yahoo: "^N225", name: "Nikkei 225" },
  DXY: { yahoo: "DX-Y.NYB", name: "US Dollar Index" },
};

const ALIASES = {
  gold: "XAUUSD",
  silver: "XAGUSD",
  oil: "USOIL",
  wti: "USOIL",
  brent: "UKOIL",
  nas100: "NAS100",
  nasdaq: "NAS100",
  us100: "NAS100",
  ndx: "NAS100",
  us30: "US30",
  dow: "US30",
  dji: "US30",
  spx: "US500",
  spx500: "US500",
  us500: "US500",
  sp500: "US500",
  ger40: "GER40",
  dax: "GER40",
  dax40: "GER40",
  uk100: "UK100",
  ftse: "UK100",
  jp225: "JP225",
  nikkei: "JP225",
  dxy: "DXY",
  bitcoin: "BTCUSD",
  btc: "BTCUSD",
  ethereum: "ETHUSD",
  eth: "ETHUSD",
  xau: "XAUUSD",
  xag: "XAGUSD",
};

const MARKET_INTENT =
  /\b(price|market|live|now|today|level|levels|support|resistance|trend|bias|setup|entry|buy|sell|long|short|breakout|volatil\w*|news|nfp|cpi|fomc|rate|analy\w+|forecast|outlook|chart)\b/i;

/** "eur/usd", "EURUSD", "gold" → { symbol, yahoo, name } or null */
export function resolveSymbol(raw) {
  if (!raw) return null;
  const key = String(raw).toUpperCase().replace(/[^A-Z0-9]/g, "");
  const alias = ALIASES[key.toLowerCase()];
  const symbol = alias ?? key;

  if (INSTRUMENTS[symbol]) return { symbol, ...INSTRUMENTS[symbol] };

  const base = symbol.slice(0, 3);
  const quote = symbol.slice(3, 6);
  if (/^[A-Z]{6}$/.test(symbol) && FIAT.has(base) && FIAT.has(quote) && base !== quote) {
    return { symbol, yahoo: `${symbol}=X`, name: `${base}/${quote}` };
  }
  if (/^[A-Z]{6,7}$/.test(symbol) && CRYPTO.has(base) && (quote === "USD" || symbol.endsWith("USDT"))) {
    return { symbol: `${base}USD`, yahoo: `${base}-USD`, name: base };
  }
  return null;
}

/** Instruments mentioned in free text, in order of appearance, deduped. */
export function extractSymbols(text, max = MAX_SYMBOLS) {
  if (!text) return [];
  const found = new Map();
  const tokens = String(text).match(/[A-Za-z0-9]{3,7}(?:\/[A-Za-z]{3})?/g) ?? [];
  for (const token of tokens) {
    const resolved = resolveSymbol(token);
    if (resolved && !found.has(resolved.symbol)) found.set(resolved.symbol, resolved);
    if (found.size >= max) break;
  }
  return [...found.values()];
}

export function needsMarketData(text, symbols) {
  return symbols.length > 0 || MARKET_INTENT.test(text || "");
}

const round = (n, dp) => (Number.isFinite(n) ? Number(n.toFixed(dp)) : null);
const pct = (from, to) => (from ? round(((to - from) / from) * 100, 2) : null);

export async function fetchYahooQuote(yahooSymbol, http = axios) {
  const { data } = await http.get(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}`,
    {
      params: { interval: "15m", range: "1d" },
      timeout: 6000,
      headers: { "User-Agent": "Mozilla/5.0" },
    },
  );

  const result = data?.chart?.result?.[0];
  const meta = result?.meta;
  if (!meta || !Number.isFinite(meta.regularMarketPrice)) {
    throw new Error(`No quote returned for ${yahooSymbol}`);
  }

  const closes = (result.indicators?.quote?.[0]?.close ?? []).filter(Number.isFinite);
  const hourAgo = closes.length > 4 ? closes[closes.length - 5] : null;
  const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? null;

  return {
    price: meta.regularMarketPrice,
    prevClose,
    dayHigh: meta.regularMarketDayHigh ?? null,
    dayLow: meta.regularMarketDayLow ?? null,
    changePct: prevClose ? pct(prevClose, meta.regularMarketPrice) : null,
    hourChangePct: hourAgo ? pct(hourAgo, meta.regularMarketPrice) : null,
    marketTime: meta.regularMarketTime
      ? new Date(meta.regularMarketTime * 1000).toISOString()
      : null,
  };
}

export async function getQuote(instrument) {
  const entry = await cached(`quote:${instrument.yahoo}`, QUOTE_TTL_MS, () =>
    fetchYahooQuote(instrument.yahoo),
  );
  return { ...instrument, ...entry.data, stale: entry.stale, fetchedAt: entry.fetchedAt };
}

/** Quotes for the given instruments; any that fail are dropped. */
export async function getQuotes(instruments) {
  const settled = await Promise.allSettled(instruments.map(getQuote));
  return settled.flatMap((r, i) => {
    if (r.status === "fulfilled") return [r.value];
    console.warn(`[Market] quote failed for ${instruments[i].symbol}:`, r.reason?.message);
    return [];
  });
}

export async function fetchEconomicCalendar(http = axios) {
  const target = "https://nfs.faireconomy.media/ff_calendar_thisweek.json";
  // Proxy avoids Render/Cloudflare IP blocks on the origin.
  const { data } = await http.get(
    `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`,
    { timeout: 15000, headers: { Accept: "application/json" } },
  );
  return Array.isArray(data) ? data : [];
}

export async function getEconomicCalendar() {
  return cached("calendar:thisweek", CALENDAR_TTL_MS, () => fetchEconomicCalendar());
}

/** High/medium impact events from 2h ago to `aheadHours` from now, soonest first. */
export function upcomingEvents(events, now = Date.now(), aheadHours = 24, limit = 8) {
  return (events ?? [])
    .filter((e) => ["High", "Medium"].includes(e.impact))
    .map((e) => ({ ...e, ts: new Date(e.date).getTime() }))
    .filter((e) => Number.isFinite(e.ts) && e.ts >= now - 2 * 3600_000 && e.ts <= now + aheadHours * 3600_000)
    .sort((a, b) => a.ts - b.ts || (a.impact === "High" ? -1 : 1))
    .slice(0, limit);
}

const fmtPrice = (p) => (p >= 1000 ? p.toFixed(2) : p >= 100 ? p.toFixed(3) : p.toFixed(5));
const signed = (n) => (n == null ? "n/a" : `${n > 0 ? "+" : ""}${n}%`);

export function formatQuotes(quotes) {
  if (!quotes.length) return "";
  return quotes
    .map((q) => {
      const parts = [
        `${q.symbol} (${q.name}): ${fmtPrice(q.price)}`,
        `day ${signed(q.changePct)}`,
        `last hour ${signed(q.hourChangePct)}`,
      ];
      if (q.dayHigh != null && q.dayLow != null) {
        parts.push(`day range ${fmtPrice(q.dayLow)}-${fmtPrice(q.dayHigh)}`);
      }
      parts.push(`as of ${q.marketTime ?? q.fetchedAt}${q.stale ? " [STALE]" : ""}`);
      return `- ${parts.join(" | ")}`;
    })
    .join("\n");
}

export function formatEvents(events) {
  if (!events.length) return "";
  return events
    .map((e) => {
      const detail = [
        e.actual ? `actual ${e.actual}` : null,
        e.forecast ? `forecast ${e.forecast}` : null,
        e.previous ? `previous ${e.previous}` : null,
      ].filter(Boolean);
      return `- ${new Date(e.ts).toISOString().slice(0, 16)}Z ${e.country} ${e.impact}: ${e.title}${detail.length ? ` (${detail.join(", ")})` : ""}`;
    })
    .join("\n");
}
