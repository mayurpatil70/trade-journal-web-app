// backend/routes/pushRoutes.js
import express from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { rateLimit } from "../middlewares/rateLimit.js";
import { getPublicKey, saveSubscription, removeSubscription, sendPushToUser } from "../services/pushService.js";

const router = express.Router();
const writeLimit = rateLimit({ windowMs: 60_000, max: 20 });

router.get("/public-key", (req, res) => {
  const publicKey = getPublicKey();
  if (!publicKey) return res.status(503).json({ error: "Push notifications are not configured." });
  res.json({ publicKey });
});

router.use(requireAuth);

router.post("/subscribe", writeLimit, async (req, res) => {
  try {
    await saveSubscription(req.userId, req.body?.subscription, req.headers["user-agent"]);
    res.json({ success: true });
  } catch (err) {
    if (err.message === "INVALID_SUBSCRIPTION") return res.status(400).json({ error: "Invalid subscription." });
    console.error("[Push] subscribe failed:", err.message);
    res.status(500).json({ error: "Failed to save subscription." });
  }
});

router.post("/unsubscribe", writeLimit, async (req, res) => {
  try {
    if (req.body?.endpoint) await removeSubscription(req.userId, req.body.endpoint);
    res.json({ success: true });
  } catch (err) {
    console.error("[Push] unsubscribe failed:", err.message);
    res.status(500).json({ error: "Failed to remove subscription." });
  }
});

router.post("/test", writeLimit, async (req, res) => {
  try {
    const sent = await sendPushToUser(req.userId, {
      title: "Forex Notes",
      body: "Notifications are working on this device.",
      url: "/dashboard",
      tag: "push-test",
    });
    res.json({ success: sent > 0, sent });
  } catch (err) {
    console.error("[Push] test failed:", err.message);
    res.status(500).json({ error: "Failed to send test notification." });
  }
});

export default router;
