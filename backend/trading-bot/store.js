import { supabase } from "../config/supabase.js";
import { pageResult } from "./config.js";

const fail = (error) => {
  if (error) throw new Error(error.message);
};

export const DEFAULT_TABLES = { configs: "bot_configs", orders: "bot_orders", logs: "bot_logs" };

export function createStore(t = DEFAULT_TABLES) {
  async function paginate(table, userId, pg, filters = {}) {
    let q = supabase.from(table).select("*", { count: "exact" }).eq("user_id", userId);
    for (const [k, v] of Object.entries(filters)) if (v) q = q.eq(k, v);
    const { data, count, error } = await q.order("created_at", { ascending: false }).range(pg.from, pg.to);
    fail(error);
    return pageResult(data, count ?? 0, pg);
  }

  return {
    async listConfigs(userId) {
      const { data, error } = await supabase.from(t.configs).select("*").eq("user_id", userId).order("created_at", { ascending: false });
      fail(error);
      return data;
    },
    async listActiveConfigs() {
      const { data, error } = await supabase.from(t.configs).select("*").eq("is_active", true);
      fail(error);
      return data;
    },
    async getConfig(userId, id) {
      const { data, error } = await supabase.from(t.configs).select("*").eq("user_id", userId).eq("id", id).maybeSingle();
      fail(error);
      return data;
    },
    async createConfig(userId, v) {
      const { name, symbol, strategyType, ...params } = v;
      const { data, error } = await supabase
        .from(t.configs)
        .insert({ user_id: userId, name, symbol, strategy_type: strategyType, params })
        .select()
        .single();
      fail(error);
      return data;
    },
    async updateConfig(id, patch) {
      const { error } = await supabase.from(t.configs).update(patch).eq("id", id);
      fail(error);
    },
    async deleteConfig(userId, id) {
      const { error } = await supabase.from(t.configs).delete().eq("user_id", userId).eq("id", id);
      fail(error);
    },
    async insertOrder(row) {
      const { data, error } = await supabase.from(t.orders).insert(row).select().single();
      fail(error);
      return data;
    },
    async updateOrder(id, patch) {
      const { error } = await supabase.from(t.orders).update(patch).eq("id", id);
      fail(error);
    },
    async openOrders(configId) {
      const { data, error } = await supabase.from(t.orders).select("*").eq("config_id", configId).in("status", ["NEW", "PARTIALLY_FILLED"]);
      fail(error);
      return data;
    },
    async filledBuys(configId) {
      const { data, error } = await supabase.from(t.orders).select("*").eq("config_id", configId).eq("side", "BUY").eq("status", "FILLED").is("pnl", null);
      fail(error);
      return data;
    },
    pageOrders: (userId, pg, filters) => paginate(t.orders, userId, pg, filters),
    pageLogs: (userId, pg, filters) => paginate(t.logs, userId, pg, filters),
    async log(userId, configId, message, level = "info") {
      await supabase.from(t.logs).insert({ user_id: userId, config_id: configId, level, message: String(message).slice(0, 500) });
    },
    async stats(userId) {
      const { data, error } = await supabase.from(t.orders).select("pnl,status").eq("user_id", userId).not("pnl", "is", null).limit(5000);
      fail(error);
      const wins = data.filter((o) => o.pnl > 0).length;
      return { closedTrades: data.length, totalPnl: data.reduce((s, o) => s + Number(o.pnl), 0), winRate: data.length ? wins / data.length : 0 };
    },
  };
}

export const {
  listConfigs, listActiveConfigs, getConfig, createConfig, updateConfig, deleteConfig, insertOrder,
  updateOrder, openOrders, filledBuys, pageOrders, pageLogs, log, stats,
} = createStore();
