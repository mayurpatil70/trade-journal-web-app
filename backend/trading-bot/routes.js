import express from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import { validateBotConfig, parsePagination } from "./config.js";
import * as store from "./store.js";
import * as engine from "./engine.js";
import { getMode, keysConfigured, isLiveEnabled } from "./binanceClient.js";

const router = express.Router();
router.use(requireAuth, requireAdmin);

const wrap = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    console.error("[Bot]", err.message);
    res.status(500).json({ error: "Trading bot request failed." });
  }
};

router.get("/status", wrap(async (req, res) => {
  const configs = await store.listConfigs(req.userId);
  res.json({
    mode: getMode(),
    keysConfigured: keysConfigured(),
    liveEnabled: isLiveEnabled(),
    ...engine.engineState(),
    activeBots: configs.filter((c) => c.is_active).length,
    stats: await store.stats(req.userId),
  });
}));

router.get("/configs", wrap(async (req, res) => res.json({ data: await store.listConfigs(req.userId) })));

router.post("/setup", wrap(async (req, res) => {
  const result = validateBotConfig(req.body);
  if (!result.ok) return res.status(400).json({ error: "Invalid configuration", details: result.errors });
  res.status(201).json({ success: true, data: await store.createConfig(req.userId, result.value) });
}));

router.post("/configs/:id/toggle", wrap(async (req, res) => {
  const config = await store.getConfig(req.userId, req.params.id);
  if (!config) return res.status(404).json({ error: "Bot not found." });
  const active = Boolean(req.body?.active);
  if (active && !keysConfigured()) return res.status(400).json({ error: "Binance API keys are not configured on the server." });
  await store.updateConfig(config.id, { is_active: active, highest_price: 0 });
  await store.log(req.userId, config.id, active ? `Bot started (${getMode()})` : "Bot paused");
  if (active) engine.ensureRunning();
  res.json({ success: true, active });
}));

router.delete("/configs/:id", wrap(async (req, res) => {
  await store.deleteConfig(req.userId, req.params.id);
  res.json({ success: true });
}));

router.get("/orders", wrap(async (req, res) => {
  const { symbol, status } = req.query;
  res.json(await store.pageOrders(req.userId, parsePagination(req.query), { symbol: symbol && String(symbol).toUpperCase(), status }));
}));

router.get("/logs", wrap(async (req, res) => {
  res.json(await store.pageLogs(req.userId, parsePagination(req.query, { maxLimit: 200, defaultLimit: 50 })));
}));

export default router;
