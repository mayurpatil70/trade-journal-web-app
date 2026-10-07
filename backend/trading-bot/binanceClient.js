import crypto from "crypto";
import { parseSymbolInfo, createTtlCache } from "./symbolFilters.js";

const TESTNET = "https://testnet.binance.vision";
const LIVE = "https://api.binance.com";

export const isLiveEnabled = () => process.env.BOT_ENABLE_LIVE === "true";
const baseUrl = () => (isLiveEnabled() ? LIVE : TESTNET);
export const getMode = () => (isLiveEnabled() ? "LIVE" : "TESTNET");
export const keysConfigured = () => Boolean(process.env.BINANCE_API_KEY && process.env.BINANCE_API_SECRET);

const symbolCache = createTtlCache(60 * 60 * 1000);

async function request(method, path, params = {}, signed = false) {
  const query = new URLSearchParams(params);
  const headers = {};
  if (signed) {
    if (!keysConfigured()) throw new Error("Binance API keys are not configured on the server.");
    query.set("timestamp", Date.now());
    query.set("recvWindow", 5000);
    query.set("signature", crypto.createHmac("sha256", process.env.BINANCE_API_SECRET).update(query.toString()).digest("hex"));
    headers["X-MBX-APIKEY"] = process.env.BINANCE_API_KEY;
  }
  const res = await fetch(`${baseUrl()}${path}?${query}`, { method, headers, signal: AbortSignal.timeout(10000) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.msg || `Binance error ${res.status}`);
  return body;
}

export async function getSymbolInfo(symbol) {
  const cached = symbolCache.get(symbol);
  if (cached) return cached;
  const data = await request("GET", "/api/v3/exchangeInfo", { symbol });
  const info = parseSymbolInfo(data.symbols[0]);
  symbolCache.set(symbol, info);
  return info;
}

export const getPrice = async (symbol) => Number((await request("GET", "/api/v3/ticker/price", { symbol })).price);

export async function getFreeBalance(asset) {
  const acct = await request("GET", "/api/v3/account", {}, true);
  return Number(acct.balances.find((b) => b.asset === asset)?.free || 0);
}

export const placeLimit = (symbol, side, price, quantity, clientOrderId) =>
  request("POST", "/api/v3/order", { symbol, side, type: "LIMIT", timeInForce: "GTC", price, quantity, newClientOrderId: clientOrderId }, true);

export const placeMarket = (symbol, side, quantity) => request("POST", "/api/v3/order", { symbol, side, type: "MARKET", quantity }, true);
export const getOrder = (symbol, orderId) => request("GET", "/api/v3/order", { symbol, orderId }, true);
export const cancelOrder = (symbol, orderId) => request("DELETE", "/api/v3/order", { symbol, orderId }, true);
