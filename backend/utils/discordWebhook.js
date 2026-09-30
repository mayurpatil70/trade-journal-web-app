// backend/utils/discordWebhook.js
import fetch from "node-fetch";

export const sendRevenueAlert = async ({
  type,
  userId,
  amount,
  chain,
  txHash, screenshot,
}) => {
  // Add this to your backend .env file:
  // DISCORD_REVENUE_WEBHOOK=https://discord.com/api/webhooks/your_webhook_url
  const webhookUrl = "https://discord.com/api/webhooks/1554842059666628700/MenXzVOt-lPGN9tWQg51eYvj1hNZaZSKr70dj4cgQK2WtBRWs52lZ3iFtCiFmykvGmiV";
  if (!webhookUrl) return;

  const isPropFirm = type === "Prop Firm Challenge";
  const color = isPropFirm ? 3066993 : 15105570; // Blue for Prop, Orange for Journal

  const payload = {
    embeds: [
      {
        title: isPropFirm
          ? "🎯 New Challenge Purchased!"
          : "🔓 Journal Access Unlocked!",
        color: color,
        fields: [
          { name: "User", value: `\`${userId}\``, inline: true },
          { name: "Amount", value: `**$${amount} USDT**`, inline: true },
          { name: "Network", value: chain, inline: true },
          {
            name: "Transaction Hash",
            value: `[View on Explorer](https://bscscan.com/tx/${txHash})`,
            inline: false,
          },
        ],
        image: screenshot ? { url: screenshot } : undefined,
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Failed to send Discord revenue alert:", error);
  }
};
