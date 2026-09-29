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

// NEW: Vision API for Chart Images
export const analyzeChart = async (req, res) => {
  try {
    // 1. Verify Multer successfully caught the image file
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided." });
    }

    // 2. Extract buffer and mimeType for Gemini
    const base64Image = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype;

    // 3. Construct the Technical Analysis Prompt
    const prompt = `
      You are an expert institutional technical analyst. 
      Review this trading chart screenshot and provide a structured technical breakdown.
      Identify the following if visible:
      1. Overall Trend (Bullish, Bearish, or Ranging)
      2. Key Support/Resistance levels or Supply/Demand zones
      3. Notable Chart Patterns or Candlestick formations
      4. A brief, objective summary of what the price action suggests.
      
      Keep it highly professional, concise, and do not give direct financial advice. Format it beautifully with line breaks.
    `;

    // 4. Send to Gemini (gemini-2.5-flash natively supports vision/images)
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
      ],
    });

    // 5. Return the insight to the React frontend
    res.status(200).json({ success: true, insight: response.text });
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    res.status(500).json({ error: "Failed to analyze chart image." });
  }
};
