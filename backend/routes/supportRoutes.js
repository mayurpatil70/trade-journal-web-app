import express from "express";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = express.Router();

router.use(requireAuth);

router.post("/ticket", async (req, res) => {
  try {
    const userId = req.userId;
    const { message } = req.body || {};
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    const cleanMessage = message.trim().slice(0, 1800);

    // IMPORTANT: Add your Discord Webhook URL to your .env file
    const webhookUrl = process.env.DISCORD_SUPPORT_WEBHOOK;

    if (!webhookUrl) {
      console.warn("DISCORD_SUPPORT_WEBHOOK not set. Logging support ticket to console:", { userId, message: cleanMessage });
      return res.status(200).json({ success: true, message: "Ticket received." });
    }

    const payload = {
      content: `🚨 **New Support Ticket** 🚨\n**User:** \`${userId}\`\n**Message:**\n> ${cleanMessage.replace(/\n/g, "\n> ")}`,
    };

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    res.status(200).json({ success: true, message: "Ticket sent." });
  } catch (error) {
    console.error("Support Webhook Error:", error);
    res.status(500).json({ error: "Failed to send message." });
  }
});

export default router;
