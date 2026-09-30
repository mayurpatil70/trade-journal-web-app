// backend/controllers/aiController.js
import { GoogleGenAI } from "@google/genai";
import { supabase } from "../config/supabase.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-2.0-flash"; // Current free-tier model

// Helper — always wrap content in proper array format
function makeContents(text) {
  return [{ role: "user", parts: [{ text }] }];
}

function makeChat(history, newMessage, systemPrompt) {
  const contents = [
    { role: "user", parts: [{ text: systemPrompt }] },
    { role: "model", parts: [{ text: "Understood. I'm ready to help." }] },
  ];

  // Add prior history (skip first AI greeting to avoid duplication)
  const prev = (history || []).slice(1);
  for (const msg of prev) {
    contents.push({
      role: msg.sender === "ai" ? "model" : "user",
      parts: [{ text: msg.text }],
    });
  }

  // Add the new user message
  contents.push({ role: "user", parts: [{ text: newMessage }] });
  return contents;
}

// Log the key prefix so we can confirm which key is loaded (never log the full key)
console.log(
  "[AI] Using Gemini key prefix:",
  GEMINI_API_KEY ? GEMINI_API_KEY.substring(0, 8) + "..." : "⚠️ MISSING KEY"
);

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// ─── 1. Economic Calendar News Insight ───────────────────────────────────────
export const generateNewsInsight = async (req, res) => {
  try {
    const { event } = req.body;
    if (!event) return res.status(400).json({ success: false, error: "Event data is required." });

    const prompt = `You are an elite forex trader and macroeconomic analyst.
Analyze this economic event and give a concise directional insight (3-4 sentences).
Event: ${event.title} | Currency: ${event.country} | Impact: ${event.impact}
Actual: ${event.actual || "Not released"} | Forecast: ${event.forecast || "N/A"} | Previous: ${event.previous || "N/A"}
Keep it professional and data-driven.`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: makeContents(prompt),
    });

    res.status(200).json({ success: true, insight: response.text });
  } catch (error) {
    console.error("[AI] News Insight Error:", error.message, error.status);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── 2. Chart Analysis (Vision) ──────────────────────────────────────────────
export const analyzeChart = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image file provided." });

    const { asset } = req.body;
    const base64Image = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype;

    const prompt = `You are an expert institutional technical analyst.
Analyze this ${asset || "trading"} chart screenshot and provide:
1. Overall Trend: Bullish / Bearish / Ranging
2. Key Support & Resistance levels visible
3. Notable Chart Patterns or Candlestick formations
4. Market direction probability: Bullish X%, Bearish Y%, Neutral Z%
5. Risk management advice (max risk %, SL placement)
Be concise and professional.`;

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
    console.error("[AI] Chart Analysis Error:", error.message, error.status);
    res.status(500).json({ error: error.message });
  }
};

// ─── 3. Coach isLIVE — Trading Psychology Chatbot ────────────────────────────
export const chatWithCoach = async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: "Message is required." });

    const systemPrompt = `You are "Coach isLIVE" — a world-class Forex and crypto trading mentor who speaks like a trusted trader friend.
You have deep expertise in: technical analysis, price action, SMC/ICT concepts, risk management, prop firm rules, trading psychology, and market structure.
Always give genuine, specific, actionable answers.
For strategy questions: explain entry/exit criteria, risk:reward, and context.
For psychology questions: be empathetic but firm — help them avoid emotional trading.
For market questions: give real technical analysis insights.
Keep responses clear, structured with bullet points when helpful, and under 150 words.
Never refuse a trading question. Never say generic phrases like "consult a professional".`;

    const contents = makeChat(history, message, systemPrompt);

    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
    });

    res.status(200).json({ success: true, text: response.text });
  } catch (error) {
    console.error("[AI] Coach Chat Error:", error.message, error.status);
    // Return the actual error so the frontend can display it
    res.status(500).json({ success: false, error: `AI Error: ${error.message}` });
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

    const prompt = `You are a quantitative trading analyst. Analyze the trader's last ${trades.length} trades.
Find correlations across session, asset, direction, setup, rule breaking, emotions.
Identify up to 3 "edges" (where they profit) and 3 "leaks" (where they lose).
Respond ONLY in valid JSON, no markdown:
{"edges":["insight 1","insight 2"],"leaks":["leak 1","leak 2"]}
Trades: ${JSON.stringify(trades)}`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: makeContents(prompt),
    });

    let jsonText = response.text.replace(/```json/g, "").replace(/```/g, "").trim();
    const insights = JSON.parse(jsonText);

    res.status(200).json({ success: true, insights });
  } catch (error) {
    console.error("[AI] Edge Finder Error:", error.message, error.status);
    res.status(500).json({ error: error.message });
  }
};
