import { createStore } from "../trading-bot/store.js";

export const hubStore = createStore({ configs: "hub_bot_configs", orders: "hub_bot_orders", logs: "hub_bot_logs" });
