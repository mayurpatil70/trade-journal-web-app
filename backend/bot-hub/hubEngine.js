import { tickConfig } from "../trading-bot/engine.js";
import { hubStore } from "./hubStore.js";
import { getUserClient } from "./clientCache.js";

const TICK_MS = 15000;
let timer = null;
let running = false;
let lastTickAt = null;

export async function tick() {
  if (running) return;
  running = true;
  try {
    for (const row of await hubStore.listActiveConfigs()) {
      try {
        const entry = await getUserClient(row.user_id);
        if (!entry) {
          await hubStore.updateConfig(row.id, { is_active: false });
          await hubStore.log(row.user_id, row.id, "No exchange connection found, bot stopped", "warn");
          continue;
        }
        await tickConfig(row, { binance: entry.client, store: hubStore });
      } catch (err) {
        await hubStore.log(row.user_id, row.id, `Tick failed: ${err.message}`, "error").catch(() => {});
      }
    }
    lastTickAt = new Date().toISOString();
  } finally {
    running = false;
  }
}

export function ensureRunning() {
  if (timer) return;
  timer = setInterval(() => tick().catch(() => {}), TICK_MS);
  timer.unref?.();
}

export const engineState = () => ({ loopRunning: Boolean(timer), lastTickAt });
