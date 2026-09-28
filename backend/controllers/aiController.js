// backend/controllers/aiController.js
import { GoogleGenAI } from "@google/genai";

// Initialize the SDK with your API key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateNewsInsight = async (req, res) => {
  try {
    const { event } = req.body;

    if (!event) {
      return res
        .status(400)
        .json({ success: false, error: "Event data is required." });
    }

    // Construct the prompt for Gemini
    const prompt = `
      You are an elite institutional forex trader and macroeconomic analyst. 
      Analyze the following economic calendar event and provide a short, punchy directional insight (max 3-4 sentences).
      
      If the 'Actual' data is available, explain how it missed or beat the 'Forecast' and what that means for the currency's strength/weakness.
      If the 'Actual' data is NOT released yet, explain what the market is anticipating and what traders should look out for.
      
      Event Details:
      - Title: ${event.title}
      - Currency: ${event.country}
      - Impact: ${event.impact}
      - Actual: ${event.actual || "Not released yet"}
      - Forecast: ${event.forecast || "N/A"}
      - Previous: ${event.previous || "N/A"}
      
      Keep the tone highly professional, objective, and data-driven. Do not give financial advice. Format the response nicely.
    `;

    // Call the gemini-2.5-flash model
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    res.status(200).json({ success: true, insight: response.text });
  } catch (error) {
    console.error("Gemini AI Error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to generate AI analysis." });
  }
};
