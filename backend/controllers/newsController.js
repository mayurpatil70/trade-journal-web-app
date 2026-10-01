// backend/controllers/newsController.js
import { getEconomicCalendar } from "../utils/marketData.js";

export const getEconomicNews = async (req, res) => {
  try {
    const { data } = await getEconomicCalendar();
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Forex Factory fetch error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to connect to Forex Factory data feed.",
    });
  }
};
