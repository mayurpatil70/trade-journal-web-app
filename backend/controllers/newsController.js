// backend/controllers/newsController.js
import axios from "axios";

export const getEconomicNews = async (req, res) => {
  try {
    // 1. Target the official JSON endpoint instead of XML
    const targetUrl = "https://nfs.faireconomy.media/ff_calendar_thisweek.json";

    // 2. Wrap it in a reliable proxy to bypass Render/Cloudflare IP blocks
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;

    const response = await axios.get(proxyUrl, {
      timeout: 15000,
      headers: {
        Accept: "application/json",
      },
    });

    // The JSON endpoint natively returns an array of events, making it much safer
    const events = Array.isArray(response.data) ? response.data : [];

    res.status(200).json({ success: true, data: events });
  } catch (error) {
    console.error("Forex Factory fetch error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to connect to Forex Factory data feed.",
    });
  }
};
