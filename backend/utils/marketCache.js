// backend/utils/marketCache.js
// DB-level cache (Supabase `market_data_cache`) shared across server instances.
import { supabase } from "../config/supabase.js";

const TABLE = "market_data_cache";
const inflight = new Map();
const l1Cache = new Map();

async function readRow(db, key) {
  try {
    const { data, error } = await db
      .from(TABLE)
      .select("payload, fetched_at, expires_at")
      .eq("cache_key", key)
      .maybeSingle();
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn(`[Cache] read failed for ${key}:`, err.message);
    return null;
  }
}

async function writeRow(db, key, payload, ttlMs) {
  const now = Date.now();
  try {
    if (!db || typeof db.from !== "function") return;
    const q = db.from(TABLE);
    if (!q || typeof q.upsert !== "function") return;
    const { error } = await q.upsert({
      cache_key: key,
      payload,
      fetched_at: new Date(now).toISOString(),
      expires_at: new Date(now + ttlMs).toISOString(),
    });
    if (error) throw error;
  } catch (err) {
    console.warn(`[Cache] write failed for ${key}:`, err.message);
  }
}

/**
 * Returns a fresh cached value, or runs `fetcher` and stores the result.
 * If the fetcher fails, an expired row is served (stale: true) before giving up.
 * Concurrent misses for the same key share one fetch.
 * Uses Multi-Tier Caching (L1 RAM -> L2 Supabase DB -> Fetcher).
 */
export async function cached(key, ttlMs, fetcher, db = supabase) {
  const now = Date.now();

  // Tier 1: In-Memory L1 Cache (Instant 0ms RAM lookup, 0 DB queries)
  const l1 = l1Cache.get(key);
  if (l1 && l1.expiresAt > now) {
    return { data: l1.data, fetchedAt: l1.fetchedAt, stale: false, hit: true };
  }

  // Tier 2: Persistent Supabase DB L2 Cache
  const row = await readRow(db, key);
  if (row && new Date(row.expires_at).getTime() > now) {
    const entry = { data: row.payload, fetchedAt: row.fetched_at, stale: false, hit: true };
    l1Cache.set(key, { ...entry, expiresAt: new Date(row.expires_at).getTime() });
    return entry;
  }

  if (inflight.has(key)) return inflight.get(key);

  const pending = (async () => {
    try {
      const data = await fetcher();
      await writeRow(db, key, data, ttlMs);
      const fetchedAt = new Date().toISOString();
      l1Cache.set(key, { data, fetchedAt, expiresAt: Date.now() + ttlMs, stale: false, hit: false });
      return { data, fetchedAt, stale: false, hit: false };
    } catch (err) {
      if (l1) {
        console.warn(`[Cache] serving stale L1 ${key}:`, err.message);
        return { data: l1.data, fetchedAt: l1.fetchedAt, stale: true, hit: true };
      }
      if (row) {
        console.warn(`[Cache] serving stale L2 ${key}:`, err.message);
        return { data: row.payload, fetchedAt: row.fetched_at, stale: true, hit: true };
      }
      throw err;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, pending);
  return pending;
}
