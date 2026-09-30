// backend/controllers/aiController.js
import { GoogleGenAI } from "@google/genai";
import { supabase } from "../config/supabase.js"; // <-- ADD THIS

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
      model: "gemini-1.5-flash",
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

export const analyzeChart = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided." });
    }

    const { asset } = req.body;
    const base64Image = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype;

    const prompt = `
      You are an expert institutional technical analyst. 
      Review this trading chart screenshot for the asset ${asset || "provided"} and provide a structured technical breakdown.
      Identify the following if visible:
      1. Overall Trend (Bullish, Bearish, or Ranging)
      2. Key Support/Resistance levels or Supply/Demand zones
      3. Notable Chart Patterns or Candlestick formations
      4. A brief, objective summary of what the price action suggests.
      5. Risk management advice and market direction probabilities.
      
      Keep it highly professional, concise, and do not give direct financial advice. Format it beautifully with line breaks.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
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

    res.status(200).json({ success: true, insight: response.text });
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    res.status(500).json({ error: "Failed to analyze chart image." });
  }
};

// NEW: Pre-Trade Psychology Coach
export const chatWithCoach = async (req, res) => {
  try {
    const { message, history } = req.body;

    // Convert frontend history format to the official Gemini SDK format
    const formattedHistory = history.map((msg) => ({
      role: msg.sender === "ai" ? "model" : "user",
      parts: [{ text: msg.text }],
    }));

    // Initialize the chat session with strict coaching instructions
    const chat = ai.chats.create({
      model: "gemini-1.5-flash",
      config: {
        systemInstruction: `You are an elite, strict, but supportive Forex trading psychology coach. 
      Your goal is to prevent the user from making emotional, revenge, or impulsive trades. 
      If this is the beginning of the conversation, always ask them these 3 questions:
      1. What is your emotional state right now on a scale of 1-10?
      2. Is this specific trade setup explicitly in your playbook?
      3. Are you revenge trading from a previous loss?
      Wait for their answers. If they sound emotional, tell them to step away from the charts. Keep responses concise, punchy, and highly relevant to day trading.`,
      },
      history: formattedHistory,
    });

    // Send the user's new message to the active chat
    const response = await chat.sendMessage({ message: message });

    res.status(200).json({ success: true, text: response.text });
  } catch (error) {
    console.error("Gemini AI Chat Error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to communicate with AI Coach." });
  }
};

// NEW: Edge Finder Analytics Engine
export const getEdgeInsights = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: Missing User ID" });
    }

    // 1. Fetch the user's recent trades (Limit to 100 to save AI tokens and focus on recent data)
    const { data: trades, error } = await supabase
      .from("trades")
      .select(
        "asset, direction, session, setup, result, r_multiple, rule_break, emotion_before",
      )
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(100);

    if (error) throw error;

    // 2. Not enough data fallback
    if (!trades || trades.length < 5) {
      return res.status(200).json({
        success: true,
        insights: {
          edges: [
            "Keep journaling! We need at least 5 trades to find your edge.",
          ],
          leaks: ["Log more trades to uncover your behavioral leaks."],
        },
      });
    }

    // 3. Construct the prompt for Gemini
    const prompt = `
      You are an expert quantitative trading analyst. Analyze the following trade data (the user's last ${trades.length} trades).
      Find specific correlations and patterns. Look at win rates by session, asset, direction, setup, rule breaking, or emotions.
      
      Identify up to 3 "edges" (positive correlations where they make money, high win rates, or good R-multiples).
      Identify up to 3 "leaks" (negative correlations where they lose money, break rules, or struggle).
      
      Respond STRICTLY in valid JSON format matching this exact structure, with no markdown formatting or extra text:
      {
        "edges": ["insight 1", "insight 2", "insight 3"],
        "leaks": ["leak 1", "leak 2", "leak 3"]
      }

      Trade Data:
      ${JSON.stringify(trades)}
    `;

    // 4. Generate the insights
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
    });

    // 5. Clean the response (Gemini sometimes wraps JSON in markdown backticks)
    let jsonText = response.text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const insights = JSON.parse(jsonText);

    res.status(200).json({ success: true, insights });
  } catch (error) {
    console.error("Edge Finder Error:", error);
    res.status(500).json({ error: "Failed to generate Edge Insights." });
  }
};
