import express from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { rateLimit } from "../middlewares/rateLimit.js";
import { validateBotConfig, parsePagination } from "../trading-bot/config.js";
import { nimComplete, extractJSON, stripThinking } from "../controllers/aiController.js";
import { encryptionReady } from "./crypto.js";
import * as keys from "./keysStore.js";
import * as mt5 from "./mt5Store.js";
import { hubStore as store } from "./hubStore.js";
import * as engine from "./hubEngine.js";
import { getUserClient, invalidateUserClient } from "./clientCache.js";
import { validateConnectionInput } from "./connectionInput.js";
import { validateAnalyzeInput, validateSettings, generateSignal } from "./signals.js";

const router = express.Router();
const limited = rateLimit({ windowMs: 60_000, max: 30 });
const analyzeLimited = rateLimit({ windowMs: 60_000, max: 10 });

const wrap = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    console.error("[BotHub]", err.message);
    res.status(500).json({ error: "Request failed." });
  }
};

const user = [requireAuth, limited];

async function requireBridge(req, res, next) {
  try {
    const token = (req.headers.authorization || "").replace(/^Bearer /, "");
    const bridge = token.startsWith("tjb_") ? await mt5.findByToken(token) : null;
    if (!bridge) return res.status(401).json({ error: "Invalid bridge token." });
    req.userId = bridge.user_id;
    req.bridge = bridge;
    next();
  } catch (err) {
    console.error("[BotHub] bridge auth", err.message);
    res.status(500).json({ error: "Request failed." });
  }
}

router.get("/connections", ...user, wrap(async (req, res) => res.json({ encryptionReady: encryptionReady(), data: await keys.listKeys(req.userId) })));

router.put("/connections/:exchange", ...user, wrap(async (req, res) => {
  if (!encryptionReady()) return res.status(503).json({ error: "Secure key storage is not configured on the server." });
  const input = validateConnectionInput({ ...req.body, exchange: req.params.exchange });
  if (!input.ok) return res.status(400).json({ error: "Invalid connection", details: input.errors });
  const saved = await keys.saveKey(req.userId, input.value);
  invalidateUserClient(req.userId);
  res.status(201).json({ success: true, data: saved });
}));

router.delete("/connections/:exchange", ...user, wrap(async (req, res) => {
  await keys.deleteKey(req.userId, req.params.exchange);
  invalidateUserClient(req.userId);
  for (const c of (await store.listConfigs(req.userId)).filter((c) => c.is_active)) await store.updateConfig(c.id, { is_active: false });
  res.json({ success: true });
}));

router.post("/connections/:exchange/live", ...user, wrap(async (req, res) => {
  const enabled = Boolean(req.body?.enabled);
  if (enabled && req.body?.confirm !== "ENABLE LIVE") return res.status(400).json({ error: 'Type "ENABLE LIVE" to confirm.' });
  const updated = await keys.setLive(req.userId, req.params.exchange, enabled);
  if (!updated) return res.status(404).json({ error: "Connection not found." });
  invalidateUserClient(req.userId);
  for (const c of (await store.listConfigs(req.userId)).filter((c) => c.is_active)) await store.updateConfig(c.id, { is_active: false });
  res.json({ success: true, data: updated });
}));

router.post("/connections/:exchange/test", ...user, wrap(async (req, res) => {
  const entry = await getUserClient(req.userId);
  if (!entry) return res.status(404).json({ error: "Connection not found." });
  try {
    const acct = await entry.client.getAccount();
    res.json({ success: true, mode: entry.mode, canTrade: Boolean(acct.canTrade) });
  } catch (err) {
    res.status(400).json({ error: `Exchange rejected the keys: ${err.message}` });
  }
}));

router.get("/status", ...user, wrap(async (req, res) => {
  engine.ensureRunning();
  const [configs, connections] = await Promise.all([store.listConfigs(req.userId), keys.listKeys(req.userId)]);
  const conn = connections[0];
  res.json({
    encryptionReady: encryptionReady(),
    connected: Boolean(conn),
    mode: conn ? (conn.live ? "LIVE" : "TESTNET") : null,
    ...engine.engineState(),
    activeBots: configs.filter((c) => c.is_active).length,
    stats: await store.stats(req.userId),
  });
}));

router.get("/configs", ...user, wrap(async (req, res) => res.json({ data: await store.listConfigs(req.userId) })));

router.post("/setup", ...user, wrap(async (req, res) => {
  const result = validateBotConfig(req.body);
  if (!result.ok) return res.status(400).json({ error: "Invalid configuration", details: result.errors });
  res.status(201).json({ success: true, data: await store.createConfig(req.userId, result.value) });
}));

router.post("/configs/:id/toggle", ...user, wrap(async (req, res) => {
  const config = await store.getConfig(req.userId, req.params.id);
  if (!config) return res.status(404).json({ error: "Bot not found." });
  const active = Boolean(req.body?.active);
  let mode = null;
  if (active) {
    const entry = await getUserClient(req.userId);
    if (!entry) return res.status(400).json({ error: "Connect your exchange API keys first." });
    mode = entry.mode;
  }
  await store.updateConfig(config.id, { is_active: active, highest_price: 0 });
  await store.log(req.userId, config.id, active ? `Bot started (${mode})` : "Bot paused");
  if (active) engine.ensureRunning();
  res.json({ success: true, active });
}));

router.delete("/configs/:id", ...user, wrap(async (req, res) => {
  await store.deleteConfig(req.userId, req.params.id);
  res.json({ success: true });
}));

router.get("/orders", ...user, wrap(async (req, res) => {
  const { symbol, status } = req.query;
  res.json(await store.pageOrders(req.userId, parsePagination(req.query), { symbol: symbol && String(symbol).toUpperCase(), status }));
}));

router.get("/logs", ...user, wrap(async (req, res) => {
  res.json(await store.pageLogs(req.userId, parsePagination(req.query, { maxLimit: 200, defaultLimit: 50 })));
}));

router.get("/mt5/status", ...user, wrap(async (req, res) => res.json({ bridge: mt5.bridgePublic(await mt5.getBridge(req.userId)) })));

router.post("/mt5/token", ...user, wrap(async (req, res) => {
  const token = await mt5.issueToken(req.userId);
  res.status(201).json({ token, note: "Shown once. Store it in the bridge config." });
}));

router.delete("/mt5/token", ...user, wrap(async (req, res) => {
  await mt5.revokeToken(req.userId);
  res.json({ success: true });
}));

router.put("/mt5/settings", ...user, wrap(async (req, res) => {
  if (!(await mt5.getBridge(req.userId))) return res.status(404).json({ error: "Generate a bridge token first." });
  const result = validateSettings(req.body);
  if (!result.ok) return res.status(400).json({ error: "Invalid settings", details: result.errors });
  await mt5.updateSettings(req.userId, result.value);
  res.json({ success: true, bridge: mt5.bridgePublic(await mt5.getBridge(req.userId)) });
}));

router.get("/mt5/signals", ...user, wrap(async (req, res) => {
  res.json(await mt5.pageSignals(req.userId, parsePagination(req.query), req.query.status && String(req.query.status)));
}));

const decide = (from, to) => wrap(async (req, res) => {
  const signal = await mt5.getSignal(req.userId, req.params.id);
  if (!signal) return res.status(404).json({ error: "Signal not found." });
  if (signal.status !== from || signal.action === "NONE") return res.status(409).json({ error: `Signal is ${signal.status}.` });
  await mt5.updateSignal(req.userId, signal.id, { status: to });
  res.json({ success: true, status: to });
});
router.post("/mt5/signals/:id/approve", ...user, decide("pending", "approved"));
router.post("/mt5/signals/:id/reject", ...user, decide("pending", "rejected"));

router.get("/mt5/bridge/config", requireBridge, wrap(async (req, res) => {
  await mt5.touch(req.userId);
  const b = mt5.bridgePublic(req.bridge);
  const approved = b.mode === "live" ? await mt5.approvedSignals(req.userId) : [];
  res.json({
    mode: b.mode, autoExecute: b.autoExecute, symbols: b.symbols, timeframe: b.timeframe, maxRiskPct: b.maxRiskPct,
    approved: approved.map((s) => ({ id: s.id, symbol: s.symbol, action: s.action, entry: Number(s.entry), sl: Number(s.sl), tp: Number(s.tp) })),
  });
}));

router.post("/mt5/bridge/analyze", requireBridge, analyzeLimited, wrap(async (req, res) => {
  const input = validateAnalyzeInput(req.body);
  if (!input.ok) return res.status(400).json({ error: input.error });
  await mt5.touch(req.userId);
  const b = req.bridge;
  const result = await generateSignal(input, {
    complete: async (messages, opts) => stripThinking(await nimComplete(messages, opts)),
    extract: extractJSON,
    minRr: Number(b.min_rr),
  });
  const executeNow = result.action !== "NONE" && b.mode === "live" && b.auto_execute;
  const row = await mt5.insertSignal({
    user_id: req.userId, symbol: input.symbol, timeframe: input.timeframe, action: result.action,
    entry: result.entry ?? null, sl: result.sl ?? null, tp: result.tp ?? null,
    status: result.action === "NONE" ? "none" : executeNow ? "approved" : "pending", reason: result.reason ?? null,
  });
  res.json({ id: row.id, ...result, executeNow, riskPct: Number(b.max_risk_pct) });
}));

router.post("/mt5/bridge/signals/:id/result", requireBridge, wrap(async (req, res) => {
  const signal = await mt5.getSignal(req.userId, req.params.id);
  if (!signal) return res.status(404).json({ error: "Signal not found." });
  const ok = req.body?.status === "executed";
  await mt5.updateSignal(req.userId, signal.id, {
    status: ok ? "executed" : "failed", executed_at: new Date().toISOString(), reason: String(req.body?.message || "").slice(0, 200) || signal.reason,
  });
  res.json({ success: true });
}));

export default router;
