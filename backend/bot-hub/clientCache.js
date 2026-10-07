import { createBinanceClient, BINANCE_URLS } from "../trading-bot/binanceClient.js";
import { loadCredentials } from "./keysStore.js";

const TTL_MS = 60_000;
const cache = new Map();

export const clientMode = (live) => (live ? "LIVE" : "TESTNET");

export async function getUserClient(userId, { load = loadCredentials, now = Date.now } = {}) {
  const hit = cache.get(userId);
  if (hit && hit.expires > now()) return hit.entry;
  const creds = await load(userId);
  if (!creds) return null;
  const baseUrl = creds.live ? BINANCE_URLS.LIVE : BINANCE_URLS.TESTNET;
  const entry = {
    mode: clientMode(creds.live),
    client: createBinanceClient({ getCredentials: () => ({ apiKey: creds.apiKey, apiSecret: creds.apiSecret }), getBaseUrl: () => baseUrl }),
  };
  cache.set(userId, { entry, expires: now() + TTL_MS });
  return entry;
}

export const invalidateUserClient = (userId) => cache.delete(userId);
export const clearClientCache = () => cache.clear();
