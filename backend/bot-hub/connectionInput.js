import { maskKey } from "./crypto.js";

const EXCHANGES = ["binance"];
const KEY_RE = /^[A-Za-z0-9]{16,128}$/;

export function validateConnectionInput(input = {}) {
  const errors = [];
  const exchange = String(input.exchange || "").toLowerCase();
  if (!EXCHANGES.includes(exchange)) errors.push(`exchange must be one of ${EXCHANGES.join(", ")}`);
  const apiKey = String(input.apiKey || "").trim();
  const apiSecret = String(input.apiSecret || "").trim();
  if (!KEY_RE.test(apiKey)) errors.push("apiKey format is invalid");
  if (!KEY_RE.test(apiSecret)) errors.push("apiSecret format is invalid");
  if (errors.length) return { ok: false, errors };
  return { ok: true, value: { exchange, apiKey, apiSecret, label: String(input.label || "").slice(0, 40) } };
}

export const toPublic = (row) => ({
  id: row.id,
  exchange: row.exchange,
  label: row.label,
  apiKeyMasked: maskKey(row.api_key),
  live: Boolean(row.live_enabled),
  status: "connected",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
