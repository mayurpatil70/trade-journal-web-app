// backend/utils/marketCache.js
// DB-level cache (Supabase `market_data_cache`) shared across server instances.
import { supabase } from "../config/supabase.js";

const TABLE = "market_data_cache";
const inflight = new Map();

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
    const { error } = await db.from(TABLE).upsert({
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
 */
export async function cached(key, ttlMs, fetcher, db = supabase) {
  const row = await readRow(db, key);
  if (row && new Date(row.expires_at).getTime() > Date.now()) {
    return { data: row.payload, fetchedAt: row.fetched_at, stale: false, hit: true };
  }

  if (inflight.has(key)) return inflight.get(key);

  const pending = (async () => {
    try {
      const data = await fetcher();
      await writeRow(db, key, data, ttlMs);
      return { data, fetchedAt: new Date().toISOString(), stale: false, hit: false };
    } catch (err) {
      if (row) {
        console.warn(`[Cache] serving stale ${key}:`, err.message);
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
