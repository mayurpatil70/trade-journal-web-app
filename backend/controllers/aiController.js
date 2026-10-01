// backend/controllers/aiController.js
// ── All AI calls now go through NVIDIA NIM (OpenAI-compatible) ───────────────
import OpenAI from "openai";
import { supabase } from "../config/supabase.js";

// ── Client ────────────────────────────────────────────────────────────────────
export const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
export const NVIDIA_MODEL    = "nvidia/nemotron-3-ultra-550b-a55b";

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

console.log(
  "[AI] Using NVIDIA key prefix:",
  NVIDIA_API_KEY ? NVIDIA_API_KEY.substring(0, 12) + "..." : "⚠️ MISSING KEY",
);
console.log("[AI] Model:", NVIDIA_MODEL);

export const openai = new OpenAI({
  apiKey: NVIDIA_API_KEY,
  baseURL: NVIDIA_BASE_URL,
});

// ── Shared call helper ────────────────────────────────────────────────────────
/**
 * Single-shot (non-streaming) completion via NVIDIA NIM.
 * @param {Array}  messages          OpenAI-format messages array
 * @param {Object} [opts]            Optional overrides (temperature, max_tokens, timeoutMs)
 * @param {OpenAI} [client]          Injected client — for unit testing
 * @returns {string}                 The assistant reply text
 */
export async function nimComplete(messages, opts = {}, client = openai) {
  const timeoutMs = opts.timeoutMs ?? 90_000; // 90s default — 550B model is slow
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const completion = await client.chat.completions.create(
      {
        model: NVIDIA_MODEL,
        messages,
        temperature: opts.temperature ?? 0.7,
        top_p: opts.top_p ?? 0.95,
        max_tokens: opts.max_tokens ?? 1024,
        stream: false,
      },
      { signal: controller.signal },
    );
    return completion.choices[0]?.message?.content ?? "";
  } finally {
    clearTimeout(timer);
  }
}

// ── JSON extraction ──────────────────────────────────────────────────────────
/**
 * Pulls the LAST valid JSON object out of a model reply.
 * Handles thinking models that write reasoning text before the JSON.
 * e.g. "Let me analyze...\n{\"edges\":[...]}" → {edges: [...]}
 */
export function extractJSON(raw) {
  // Try the whole string first (fast path for well-behaved responses)
  const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (_) {
    // Fall back: find ALL {...} blocks and try from last to first.
    // Thinking models write preamble like "Based on {6} trades I will output: {...}"
    // — the last *validly parseable* object is the real answer.
    const matches = cleaned.match(/\{[^]*?\}/g) ?? [];
    for (let i = matches.length - 1; i >= 0; i--) {
      try {
        return JSON.parse(matches[i]);
      } catch (_) {
        // not valid JSON — keep trying earlier matches
      }
    }
    throw new SyntaxError(`No JSON object found in model reply: ${cleaned.slice(0, 200)}`);
  }
}

// ── Message builders ──────────────────────────────────────────────────────────

/** Single user prompt → messages array */
export function buildMessages(userPrompt, systemPrompt = null) {
  const msgs = [];
  if (systemPrompt) msgs.push({ role: "system", content: systemPrompt });
  msgs.push({ role: "user", content: userPrompt });
  return msgs;
}

/**
 * Convert the stored chat history + new message into OpenAI messages format.
 * history entries have shape: { sender: "user"|"ai", text: string }
 */
export function buildChatMessages(history, newMessage, systemPrompt) {
  const msgs = [{ role: "system", content: systemPrompt }];
  for (const msg of history || []) {
    msgs.push({
      role: msg.sender === "ai" ? "assistant" : "user",
      content: msg.text,
    });
  }
  msgs.push({ role: "user", content: newMessage });
  return msgs;
}

// ─── 1. Economic Calendar News Insight ───────────────────────────────────────
export const generateNewsInsight = async (req, res) => {
  try {
    const { event } = req.body;
    if (!event)
      return res.status(400).json({ success: false, error: "Event data is required." });

    const systemPrompt =
      "You are an elite forex trader and macroeconomic analyst. Be concise, professional, and data-driven.";

    const userPrompt = `Analyze this economic event and give a concise directional insight (3-4 sentences).
Event: ${event.title} | Currency: ${event.country} | Impact: ${event.impact}
Actual: ${event.actual || "Not released"} | Forecast: ${event.forecast || "N/A"} | Previous: ${event.previous || "N/A"}`;

    const text = await nimComplete(buildMessages(userPrompt, systemPrompt));
    res.status(200).json({ success: true, insight: text });
  } catch (error) {
    console.error("[AI] News Insight Error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── 2. Chart Analysis (Vision) ──────────────────────────────────────────────
// NVIDIA nemotron model is text-only; we describe the image via base64 URI
// using the OpenAI vision format (url: data URI).
export const analyzeChart = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: "No image file provided." });

    const { asset } = req.body;
    const base64Image = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype;
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    const systemPrompt =
      "You are an expert institutional technical analyst. Be concise and professional.";

    const messages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this ${asset || "trading"} chart screenshot and provide:
1. Overall Trend: Bullish / Bearish / Ranging
2. Key Support & Resistance levels visible
3. Notable Chart Patterns or Candlestick formations
4. Market direction probability: Bullish X%, Bearish Y%, Neutral Z%
5. Risk management advice (max risk %, SL placement)`,
          },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ];

    const text = await nimComplete(messages, { max_tokens: 512, timeoutMs: 90_000 });
    res.status(200).json({ success: true, insight: text });
  } catch (error) {
    console.error("[AI] Chart Analysis Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// ─── 3. Coach isLIVE — Trading Psychology Chatbot ────────────────────────────
export const chatWithCoach = async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message?.trim())
      return res.status(400).json({ error: "Message is required." });

    const systemPrompt = `You are "Coach isLIVE" — a world-class Forex and crypto trading mentor who speaks like a trusted trader friend.
You have deep expertise in: technical analysis, price action, SMC/ICT concepts, risk management, prop firm rules, trading psychology, and market structure.
Always give genuine, specific, actionable answers.
For strategy questions: explain entry/exit criteria, risk:reward, and context.
For psychology questions: be empathetic but firm — help them avoid emotional trading.
For market questions: give real technical analysis insights.
Keep responses clear, structured with bullet points when helpful, and under 150 words.
Never refuse a trading question. Never say generic phrases like "consult a professional".`;

    const messages = buildChatMessages(history, message, systemPrompt);
    const text = await nimComplete(messages, { max_tokens: 512, timeoutMs: 90_000 });
    res.status(200).json({ success: true, text });
  } catch (error) {
    console.error("[AI] Coach Chat Error:", error.message);
    res.status(500).json({ success: false, error: `AI Error: ${error.message}` });
  }
};

// ─── 4. Edge Finder — Trade Data Analytics ───────────────────────────────────
export const getEdgeInsights = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId)
      return res.status(401).json({ error: "Unauthorized: Missing User ID" });

    const { data: trades, error } = await supabase
      .from("trades")
      .select(
        "asset, direction, session, setup, result, r_multiple, rule_break, emotion_before",
      )
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

    const systemPrompt = [
      "You are a quantitative trading analyst.",
      "Output ONLY a raw JSON object — no markdown, no code fences, no explanation, no preamble.",
      "Format: {\"edges\":[\"...\"],\"leaks\":[\"...\"]}",
    ].join(" ");

    const userPrompt = `Analyze the trader's last ${trades.length} trades.
Find correlations across session, asset, direction, setup, rule breaking, emotions.
Identify up to 3 edges (where they profit) and 3 leaks (where they lose).
Trades: ${JSON.stringify(trades)}`;

    const raw = await nimComplete(buildMessages(userPrompt, systemPrompt), { max_tokens: 1024, timeoutMs: 90_000 });

    const insights = extractJSON(raw);
    if (!Array.isArray(insights.edges) || !Array.isArray(insights.leaks)) {
      throw new Error("Model returned JSON but missing edges/leaks arrays");
    }

    res.status(200).json({ success: true, insights });
  } catch (error) {
    console.error("[AI] Edge Finder Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};
