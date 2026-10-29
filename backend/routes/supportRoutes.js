import express from "express";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = express.Router();

router.use(requireAuth);

router.post("/ticket", async (req, res) => {
  try {
    const userId = req.userId;
    const {
      subject = "Support Ticket",
      category = "Bug / technical issue",
      message = "",
      screenshots = [],
      userEmail,
    } = req.body || {};

    const cleanSubject = String(subject).trim().slice(0, 150) || "Support Ticket";
    const cleanCategory = String(category).trim().slice(0, 50) || "Other";
    const cleanMessage = String(message).trim().slice(0, 3000);
    const reporter = userEmail || userId || "Anonymous Trader";
    const ticketId = `FN-${Date.now().toString(36).toUpperCase()}`;

    if (!cleanMessage) {
      return res.status(400).json({ error: "Message details are required." });
    }

    const webhookUrl = process.env.DISCORD_SUPPORT_WEBHOOK;

    if (webhookUrl) {
      const categoryColors = {
        "Bug / technical issue": 15158332, // Red #E74C3C
        "Idea / feedback": 10181046,       // Purple #9B59B6
        "Billing": 3066993,                // Green #2ECC71
        "Account": 3447003,                // Blue #3498DB
        "Other": 9807270,                  // Gray #95A5A6
      };

      const embed = {
        title: `🚨 [${cleanCategory}] ${cleanSubject}`,
        description: cleanMessage,
        color: categoryColors[cleanCategory] || 3447003,
        fields: [
          { name: "👤 User Account", value: `\`${reporter}\``, inline: true },
          { name: "🏷️ Category", value: cleanCategory, inline: true },
          { name: "🆔 Ticket Reference", value: `\`${ticketId}\``, inline: true },
        ],
        footer: { text: "ForexNotes Support Hub • Realtime Helpdesk" },
        timestamp: new Date().toISOString(),
      };

      // If screenshot URLs or base64 previews were supplied
      if (Array.isArray(screenshots) && screenshots.length > 0) {
        const validUrls = screenshots.filter(
          (s) => typeof s === "string" && s.startsWith("http")
        );
        if (validUrls.length > 0) {
          embed.image = { url: validUrls[0] };
          embed.fields.push({
            name: "📷 Screenshots Attached",
            value: validUrls.slice(0, 3).join("\n"),
            inline: false,
          });
        } else {
          embed.fields.push({
            name: "📷 Screenshots Attached",
            value: `${screenshots.length} screenshot(s) attached by user.`,
            inline: false,
          });
        }
      }

      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: `📬 **New Support Ticket submitted on ForexNotes**`,
            embeds: [embed],
          }),
        });
      } catch (webhookErr) {
        console.error("Failed to forward support ticket to Discord Webhook:", webhookErr);
      }
    } else {
      console.warn("DISCORD_SUPPORT_WEBHOOK not set. Ticket logged to console:", {
        ticketId,
        user: reporter,
        subject: cleanSubject,
        category: cleanCategory,
      });
    }

    res.status(200).json({
      success: true,
      message: "Report sent successfully.",
      ticket: {
        id: ticketId,
        subject: cleanSubject,
        category: cleanCategory,
        message: cleanMessage,
        status: "Open",
        created_at: new Date().toISOString(),
        screenshotsCount: Array.isArray(screenshots) ? screenshots.length : 0,
      },
    });
  } catch (error) {
    console.error("Support Ticket Error:", error);
    res.status(500).json({ error: "Failed to send report. Please try again." });
  }
});

export default router;
