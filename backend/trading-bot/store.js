import { supabase } from "../config/supabase.js";
import { pageResult } from "./config.js";

const fail = (error) => {
  if (error) throw new Error(error.message);
};

export async function listConfigs(userId) {
  const { data, error } = await supabase.from("bot_configs").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  fail(error);
  return data;
}

export async function listActiveConfigs() {
  const { data, error } = await supabase.from("bot_configs").select("*").eq("is_active", true);
  fail(error);
  return data;
}

export async function getConfig(userId, id) {
  const { data, error } = await supabase.from("bot_configs").select("*").eq("user_id", userId).eq("id", id).maybeSingle();
  fail(error);
  return data;
}

export async function createConfig(userId, v) {
  const { name, symbol, strategyType, ...params } = v;
  const { data, error } = await supabase
    .from("bot_configs")
    .insert({ user_id: userId, name, symbol, strategy_type: strategyType, params })
    .select()
    .single();
  fail(error);
  return data;
}

export async function updateConfig(id, patch) {
  const { error } = await supabase.from("bot_configs").update(patch).eq("id", id);
  fail(error);
}

export async function deleteConfig(userId, id) {
  const { error } = await supabase.from("bot_configs").delete().eq("user_id", userId).eq("id", id);
  fail(error);
}

export async function insertOrder(row) {
  const { data, error } = await supabase.from("bot_orders").insert(row).select().single();
  fail(error);
  return data;
}

export async function updateOrder(id, patch) {
  const { error } = await supabase.from("bot_orders").update(patch).eq("id", id);
  fail(error);
}

export async function openOrders(configId) {
  const { data, error } = await supabase.from("bot_orders").select("*").eq("config_id", configId).in("status", ["NEW", "PARTIALLY_FILLED"]);
  fail(error);
  return data;
}

export async function filledBuys(configId) {
  const { data, error } = await supabase.from("bot_orders").select("*").eq("config_id", configId).eq("side", "BUY").eq("status", "FILLED").is("pnl", null);
  fail(error);
  return data;
}

async function paginate(table, userId, pg, filters = {}) {
  let q = supabase.from(table).select("*", { count: "exact" }).eq("user_id", userId);
  for (const [k, v] of Object.entries(filters)) if (v) q = q.eq(k, v);
  const { data, count, error } = await q.order("created_at", { ascending: false }).range(pg.from, pg.to);
  fail(error);
  return pageResult(data, count ?? 0, pg);
}

export const pageOrders = (userId, pg, filters) => paginate("bot_orders", userId, pg, filters);
export const pageLogs = (userId, pg, filters) => paginate("bot_logs", userId, pg, filters);

export async function log(userId, configId, message, level = "info") {
  await supabase.from("bot_logs").insert({ user_id: userId, config_id: configId, level, message: String(message).slice(0, 500) });
}

export async function stats(userId) {
  const { data, error } = await supabase.from("bot_orders").select("pnl,status").eq("user_id", userId).not("pnl", "is", null).limit(5000);
  fail(error);
  const wins = data.filter((o) => o.pnl > 0).length;
  return { closedTrades: data.length, totalPnl: data.reduce((s, o) => s + Number(o.pnl), 0), winRate: data.length ? wins / data.length : 0 };
}
