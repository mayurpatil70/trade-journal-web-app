// backend/controllers/aiController.js
import { GoogleGenAI } from "@google/genai";
import { supabase } from "../config/supabase.js";

// Initialize the SDK - reads GEMINI_API_KEY from environment
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = "gemini-1.5-flash";

// ─── 1. Economic Calendar News Insight ───────────────────────────────────────
export const generateNewsInsight = async (req, res) => {
  try {
    const { event } = req.body;
    if (!event) return res.status(400).json({ success: false, error: "Event data is required." });

    const prompt = `You are an elite institutional forex trader and macroeconomic analyst.
Analyze the following economic calendar event and provide a short, punchy directional insight (max 3-4 sentences).
If the 'Actual' data is available, explain how it missed or beat the 'Forecast' and what that means for the currency.
If NOT released yet, explain what traders should watch for.

Event: ${event.title} | Currency: ${event.country} | Impact: ${event.impact}
Actual: ${event.actual || "Not released"} | Forecast: ${event.forecast || "N/A"} | Previous: ${event.previous || "N/A"}

Keep it professional, data-driven. No financial advice.`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    res.status(200).json({ success: true, insight: response.text });
  } catch (error) {
    console.error("Gemini News Error:", error.message);
    res.status(500).json({ success: false, error: "Failed to generate AI analysis." });
  }
};

// ─── 2. Chart Analysis (Vision) ──────────────────────────────────────────────
export const analyzeChart = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image file provided." });

    const { asset } = req.body;
    const base64Image = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype;

    const prompt = `You are an expert institutional technical analyst. Analyze this trading chart for ${asset || "the asset shown"}.
Provide:
1. Overall Trend (Bullish / Bearish / Ranging)
2. Key Support & Resistance levels or Supply/Demand zones visible
3. Notable Chart Patterns or Candlestick formations
4. Probability estimate: Bullish %, Bearish %, Neutral %
5. Risk management suggestion (max risk %, SL placement idea)

Be concise, professional, and never give direct financial advice.`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { data: base64Image, mimeType } },
          ],
        },
      ],
    });

    res.status(200).json({ success: true, insight: response.text });
  } catch (error) {
    console.error("Gemini Vision Error:", error.message);
    res.status(500).json({ error: "Failed to analyze chart image." });
  }
};

// ─── 3. Coach isLIVE — Trading Psychology Chatbot ────────────────────────────
export const chatWithCoach = async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required." });

    const systemInstruction = `You are "Coach isLIVE" — a world-class Forex trading psychology coach and mentor.
You speak like a trusted trader friend: honest, direct, supportive, and highly knowledgeable.
You help traders with: emotional discipline, revenge trading, FOMO, risk management, trade setups, market analysis, prop firm rules, and mindset.
You answer ALL trading-related questions genuinely and accurately.
You give real, actionable advice — not generic platitudes.
If a trader asks about a chart pattern, session, strategy, or emotion, give them real guidance.
Keep responses concise but complete. Use bullet points for lists. Be encouraging but firm.
NEVER say "I cannot help with that" for any trading topic.`;

    // Build contents: system instruction as first user turn, then history, then new message
    const contents = [
      { role: "user", parts: [{ text: systemInstruction }] },
      { role: "model", parts: [{ text: "Understood. I'm Coach isLIVE — your trading mentor. Ask me anything." }] },
      // Map history (skip the first AI welcome message to avoid duplication)
      ...history.slice(1).map((msg) => ({
        role: msg.sender === "ai" ? "model" : "user",
        parts: [{ text: msg.text }],
      })),
      { role: "user", parts: [{ text: message }] },
    ];

    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
    });

    res.status(200).json({ success: true, text: response.text });
  } catch (error) {
    console.error("Coach Chat Error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── 4. Edge Finder — Trade Data Analytics ───────────────────────────────────
export const getEdgeInsights = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(401).json({ error: "Unauthorized: Missing User ID" });

    const { data: trades, error } = await supabase
      .from("trades")
      .select("asset, direction, session, setup, result, r_multiple, rule_break, emotion_before")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(100);

    if (error) throw error;

    if (!trades || trades.length < 5) {
      return res.status(200).json({
        success: true,
        insights: {
          edges: ["Keep journaling! We need at least 5 trades to find your edge."],
          leaks: ["Log more trades to uncover your behavioral leaks."],
        },
      });
    }

    const prompt = `You are an expert quantitative trading analyst. Analyze this trader's last ${trades.length} trades.
Find specific correlations. Look at win rates by session, asset, direction, setup, rule breaking, emotions.

Identify up to 3 "edges" (where they make money consistently) and up to 3 "leaks" (where they lose).

Respond ONLY in valid JSON, no markdown, no extra text:
{"edges":["insight 1","insight 2"],"leaks":["leak 1","leak 2"]}

Trade Data: ${JSON.stringify(trades)}`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    let jsonText = response.text.replace(/```json/g, "").replace(/```/g, "").trim();
    const insights = JSON.parse(jsonText);

    res.status(200).json({ success: true, insights });
  } catch (error) {
    console.error("Edge Finder Error:", error.message);
    res.status(500).json({ error: "Failed to generate Edge Insights." });
  }
};
