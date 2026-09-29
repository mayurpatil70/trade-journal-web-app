import express from "express";

const router = express.Router();

router.post("/ticket", async (req, res) => {
  try {
    const { userId, message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    // IMPORTANT: Add your Discord Webhook URL to your .env file
    const webhookUrl = process.env.DISCORD_SUPPORT_WEBHOOK;

    if (!webhookUrl)
      return res.status(500).json({ error: "Discord webhook not configured" });

    const payload = {
      content: `🚨 **New Support Ticket** 🚨\n**User:** \`${userId}\`\n**Message:**\n> ${message}`,
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
