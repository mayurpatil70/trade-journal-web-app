// backend/controllers/newsController.js
import axios from "axios";
import { XMLParser } from "fast-xml-parser";

export const getEconomicNews = async (req, res) => {
  try {
    // Add standard browser headers to bypass Cloudflare protection
    const response = await axios.get(
      "https://nfs.faireconomy.media/ff_calendar_thisweek.xml",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/xml, text/xml, */*; q=0.01",
          "Accept-Language": "en-US,en;q=0.9",
        },
        timeout: 10000,
      },
    );

    const parser = new XMLParser();
    const jObj = parser.parse(response.data);

    let events = jObj.weeklyevents?.event || [];

    // fast-xml-parser returns a single object instead of an array if there's only 1 event. Normalize it:
    if (!Array.isArray(events)) {
      events = [events];
    }

    res.status(200).json({ success: true, data: events });
  } catch (error) {
    console.error("Forex Factory fetch error:", error.message);
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to fetch calendar data from provider.",
      });
  }
};
