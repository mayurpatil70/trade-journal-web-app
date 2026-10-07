import crypto from "crypto";
import { parseSymbolInfo, createTtlCache } from "./symbolFilters.js";

const TESTNET = "https://testnet.binance.vision";
const LIVE = "https://api.binance.com";

export const isLiveEnabled = () => process.env.BOT_ENABLE_LIVE === "true";
export const getMode = () => (isLiveEnabled() ? "LIVE" : "TESTNET");
export const keysConfigured = () => Boolean(process.env.BINANCE_API_KEY && process.env.BINANCE_API_SECRET);

const symbolCache = createTtlCache(60 * 60 * 1000);

export function createBinanceClient({ getCredentials, getBaseUrl }) {
  async function request(method, path, params = {}, signed = false) {
    const query = new URLSearchParams(params);
    const headers = {};
    if (signed) {
      const { apiKey, apiSecret } = getCredentials();
      if (!apiKey || !apiSecret) throw new Error("Binance API keys are not configured.");
      query.set("timestamp", Date.now());
      query.set("recvWindow", 5000);
      query.set("signature", crypto.createHmac("sha256", apiSecret).update(query.toString()).digest("hex"));
      headers["X-MBX-APIKEY"] = apiKey;
    }
    const res = await fetch(`${getBaseUrl()}${path}?${query}`, { method, headers, signal: AbortSignal.timeout(10000) });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.msg || `Binance error ${res.status}`);
    return body;
  }

  return {
    async getSymbolInfo(symbol) {
      const key = `${getBaseUrl()}:${symbol}`;
      const cached = symbolCache.get(key);
      if (cached) return cached;
      const data = await request("GET", "/api/v3/exchangeInfo", { symbol });
      const info = parseSymbolInfo(data.symbols[0]);
      symbolCache.set(key, info);
      return info;
    },
    getPrice: async (symbol) => Number((await request("GET", "/api/v3/ticker/price", { symbol })).price),
    async getFreeBalance(asset) {
      const acct = await request("GET", "/api/v3/account", {}, true);
      return Number(acct.balances.find((b) => b.asset === asset)?.free || 0);
    },
    getAccount: () => request("GET", "/api/v3/account", {}, true),
    placeLimit: (symbol, side, price, quantity, clientOrderId) =>
      request("POST", "/api/v3/order", { symbol, side, type: "LIMIT", timeInForce: "GTC", price, quantity, newClientOrderId: clientOrderId }, true),
    placeMarket: (symbol, side, quantity) => request("POST", "/api/v3/order", { symbol, side, type: "MARKET", quantity }, true),
    getOrder: (symbol, orderId) => request("GET", "/api/v3/order", { symbol, orderId }, true),
    cancelOrder: (symbol, orderId) => request("DELETE", "/api/v3/order", { symbol, orderId }, true),
  };
}

export const envClient = createBinanceClient({
  getCredentials: () => ({ apiKey: process.env.BINANCE_API_KEY, apiSecret: process.env.BINANCE_API_SECRET }),
  getBaseUrl: () => (isLiveEnabled() ? LIVE : TESTNET),
});

export const { getSymbolInfo, getPrice, getFreeBalance, placeLimit, placeMarket, getOrder, cancelOrder } = envClient;
export const BINANCE_URLS = { TESTNET, LIVE };
