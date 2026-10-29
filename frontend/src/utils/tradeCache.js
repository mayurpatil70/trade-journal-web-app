// frontend/src/utils/tradeCache.js
// Ultra-fast In-Memory SWR (Stale-While-Revalidate) Cache for Trades & Accounts
// Eliminates route navigation delay when switching between Dashboard, Trades, Calendar, Analysis, etc.

import api from "../api/axios";

let cachedTrades = null;
let lastFetchTimestamp = 0;
let inFlightPromise = null;
const CACHE_TTL_MS = 25000; // 25s fresh window

// Normalizer & sorter matching Dashboard
export const sortTradesChronological = (trades = []) => {
  const getTradeTime = (t) => {
    if (!t) return 0;
    const d = t.date || (t.created_at ? t.created_at.slice(0, 10) : "");
    const tm = t.entry_time || t.time || "12:00";
    if (d) {
      const ts = new Date(`${d}T${tm.length === 5 ? tm + ":00" : tm}`).getTime();
      if (!isNaN(ts)) return ts;
    }
    return t.created_at ? new Date(t.created_at).getTime() : 0;
  };

  return [...trades].sort((a, b) => {
    const diff = getTradeTime(a) - getTradeTime(b);
    if (diff !== 0) return diff;
    return new Date(a.created_at || 0) - new Date(b.created_at || 0);
  });
};

/**
 * Returns immediately cached trades synchronously for 0ms initial render.
 */
export const getImmediateCachedTrades = () => {
  return cachedTrades;
};

/**
 * Invalidate cache whenever a trade is added, modified, or deleted.
 */
export const invalidateTradeCache = () => {
  cachedTrades = null;
  lastFetchTimestamp = 0;
  inFlightPromise = null;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("trades_cache_invalidated"));
  }
};

/**
 * Set cache directly (e.g., when adding/editing in local state)
 */
export const setCachedTrades = (trades) => {
  const sorted = sortTradesChronological(trades);
  cachedTrades = sorted;
  lastFetchTimestamp = Date.now();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("trades_updated", { detail: sorted }));
  }
  return sorted;
};

/**
 * Fetch trades with SWR caching.
 * If cache exists, returns cached data immediately while revalidating in background if stale.
 */
export const getTradesWithCache = async (userId, force = false) => {
  const now = Date.now();
  const isFresh = cachedTrades && now - lastFetchTimestamp < CACHE_TTL_MS;

  if (!force && isFresh) {
    return cachedTrades;
  }

  // Deduplicate concurrent requests
  if (inFlightPromise) {
    return inFlightPromise;
  }

  inFlightPromise = (async () => {
    try {
      const res = await api.get(`/api/trades?userId=${encodeURIComponent(userId)}`);
      const raw = res.data?.data || [];
      const sorted = sortTradesChronological(raw);
      cachedTrades = sorted;
      lastFetchTimestamp = Date.now();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("trades_updated", { detail: sorted }));
      }
      return sorted;
    } catch (err) {
      if (cachedTrades) return cachedTrades;
      throw err;
    } finally {
      inFlightPromise = null;
    }
  })();

  return inFlightPromise;
};
