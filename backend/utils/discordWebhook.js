// backend/utils/discordWebhook.js
import fetch from "node-fetch";

export const sendRevenueAlert = async ({
  type,
  userId,
  amount,
  chain,
  txHash,
  screenshot,
}) => {
  // Add this to your backend .env file:
  // DISCORD_REVENUE_WEBHOOK=https://discord.com/api/webhooks/your_webhook_url
  const webhookUrl = "process.env.DISCORD_REVENUE_WEBHOOK";
  if (!webhookUrl) return;

  const isPropFirm = type === "Prop Firm Challenge";
  const color = isPropFirm ? 3066993 : 15105570; // Blue for Prop, Orange for Journal

  const embed = {
    title: isPropFirm
      ? "🎯 New Challenge Purchased!"
      : "🔓 Journal Access Unlocked!",
    color: color,
    fields: [
      { name: "User", value: `\`${userId}\``, inline: true },
      { name: "Amount", value: `**$${amount} USDT**`, inline: true },
      { name: "Network", value: chain, inline: true },
      { name: "TXID", value: `\`${txHash}\``, inline: false },
      {
        name: "Explorer Link",
        value: `[View on Explorer](https://bscscan.com/tx/${txHash})`,
        inline: false,
      },
    ],
    timestamp: new Date().toISOString(),
  };

  if (screenshot) {
    embed.image = { url: screenshot };
  }

  const payload = { embeds: [embed] };

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
