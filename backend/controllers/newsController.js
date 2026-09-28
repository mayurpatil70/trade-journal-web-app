// backend/controllers/newsController.js
import axios from "axios";
import { XMLParser } from "fast-xml-parser";

export const getEconomicNews = async (req, res) => {
  try {
    // Forex Factory's official free XML feed
    const response = await axios.get(
      "https://nfs.faireconomy.media/ff_calendar_thisweek.xml",
    );

    const parser = new XMLParser();
    const jObj = parser.parse(response.data);

    // The feed returns an object with a 'weeklyevents' root containing an array of 'event'
    let events = jObj.weeklyevents?.event || [];

    // Filter out weekend bank holidays or empty data if necessary, and sort by date/time
    res.status(200).json({ success: true, data: events });
  } catch (error) {
    console.error("Error fetching Forex Factory data:", error.message);
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to fetch economic calendar data",
      });
  }
};
