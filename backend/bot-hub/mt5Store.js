import { supabase } from "../config/supabase.js";
import { pageResult } from "../trading-bot/config.js";
import { generateBridgeToken, hashToken } from "./crypto.js";

const fail = (error) => {
  if (error) throw new Error(error.message);
};

export const ONLINE_WINDOW_MS = 3 * 60 * 1000;

export const bridgePublic = (row, now = Date.now()) =>
  row && {
    tokenPrefix: row.token_prefix,
    mode: row.mode,
    autoExecute: row.auto_execute,
    symbols: row.symbols,
    timeframe: row.timeframe,
    maxRiskPct: Number(row.max_risk_pct),
    minRr: Number(row.min_rr),
    lastSeenAt: row.last_seen_at,
    online: Boolean(row.last_seen_at) && now - new Date(row.last_seen_at).getTime() < ONLINE_WINDOW_MS,
    createdAt: row.created_at,
  };

export async function getBridge(userId) {
  const { data, error } = await supabase.from("mt5_bridges").select("*").eq("user_id", userId).maybeSingle();
  fail(error);
  return data;
}

export async function issueToken(userId) {
  const token = generateBridgeToken();
  const { error } = await supabase
    .from("mt5_bridges")
    .upsert({ user_id: userId, token_hash: hashToken(token), token_prefix: token.slice(0, 8), last_seen_at: null }, { onConflict: "user_id" });
  fail(error);
  return token;
}

export async function revokeToken(userId) {
  const { error } = await supabase.from("mt5_bridges").delete().eq("user_id", userId);
  fail(error);
}

export async function findByToken(token) {
  const { data, error } = await supabase.from("mt5_bridges").select("*").eq("token_hash", hashToken(token)).maybeSingle();
  fail(error);
  return data;
}

export async function touch(userId) {
  await supabase.from("mt5_bridges").update({ last_seen_at: new Date().toISOString() }).eq("user_id", userId);
}

export async function updateSettings(userId, patch) {
  const { error } = await supabase.from("mt5_bridges").update(patch).eq("user_id", userId);
  fail(error);
}

export async function insertSignal(row) {
  const { data, error } = await supabase.from("mt5_signals").insert(row).select().single();
  fail(error);
  return data;
}

export async function getSignal(userId, id) {
  const { data, error } = await supabase.from("mt5_signals").select("*").eq("user_id", userId).eq("id", id).maybeSingle();
  fail(error);
  return data;
}

export async function updateSignal(userId, id, patch) {
  const { error } = await supabase.from("mt5_signals").update(patch).eq("user_id", userId).eq("id", id);
  fail(error);
}

export async function approvedSignals(userId) {
  const { data, error } = await supabase.from("mt5_signals").select("*").eq("user_id", userId).eq("status", "approved").order("created_at").limit(10);
  fail(error);
  return data;
}

export async function pageSignals(userId, pg, status) {
  let q = supabase.from("mt5_signals").select("*", { count: "exact" }).eq("user_id", userId);
  if (status) q = q.eq("status", status);
  const { data, count, error } = await q.order("created_at", { ascending: false }).range(pg.from, pg.to);
  fail(error);
  return pageResult(data, count ?? 0, pg);
}
