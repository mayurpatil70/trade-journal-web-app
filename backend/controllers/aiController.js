// backend/controllers/aiController.js
// ── All AI calls now go through NVIDIA NIM (OpenAI-compatible) ───────────────
import OpenAI from "openai";
import { supabase } from "../config/supabase.js";
import {
  extractSymbols,
  needsMarketData,
  resolveSymbol,
  getQuotes,
  getEconomicCalendar,
  upcomingEvents,
  formatQuotes,
  formatEvents,
} from "../utils/marketData.js";
import { computeStats, formatJournal, topAssets } from "../utils/tradeStats.js";

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

/**
 * Streaming completion. Yields { type: "reasoning" | "content", text }.
 * Reasoning deltas are surfaced only so the UI can show a "thinking" state.
 */
export async function* nimStream(messages, opts = {}, client = openai) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 120_000);
  opts.signal?.addEventListener("abort", () => controller.abort(), { once: true });

  try {
    const stream = await client.chat.completions.create(
      {
        model: NVIDIA_MODEL,
        messages,
        temperature: opts.temperature ?? 0.7,
        top_p: opts.top_p ?? 0.95,
        max_tokens: opts.max_tokens ?? 1024,
        stream: true,
      },
      { signal: controller.signal },
    );
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta;
      if (!delta) continue;
      if (delta.content) yield { type: "content", text: delta.content };
      else if (delta.reasoning_content || delta.reasoning) {
        yield { type: "reasoning", text: delta.reasoning_content ?? delta.reasoning };
      }
    }
  } finally {
    clearTimeout(timer);
  }
}

export const stripThinking = (text) =>
  text.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/^[\s\S]*?<\/think>/i, "").trim();

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

// ─── 3. Coach isLIVE — Trading Chatbot ───────────────────────────────────────
const MAX_MESSAGE_CHARS = 2000;
const MAX_HISTORY = 12;
const HISTORY_PAGE = 50;
const CHAT_OPTS = { max_tokens: 768, timeoutMs: 120_000 };

export function buildCoachSystemPrompt({ marketBlock, eventsBlock, journalBlock, now = new Date() }) {
  const sections = [
    `You are "Coach isLIVE" — a world-class Forex and crypto trading mentor who speaks like a trusted trader friend.
You have deep expertise in: technical analysis, price action, SMC/ICT concepts, risk management, prop firm rules, trading psychology, and market structure.
Always give genuine, specific, actionable answers.
For strategy questions: explain entry/exit criteria, risk:reward, and context.
For psychology questions: be empathetic but firm — help them avoid emotional trading.
For market questions: give real technical analysis insights grounded in the live data below when it is provided.
Keep responses clear and under 150 words. Use short markdown: **bold** for key points and "-" bullets when helpful.
Never refuse a trading question. Never say generic phrases like "consult a professional".
You only know prices, levels and events that appear in the data blocks below. Never invent prices, levels or news; if you need live data you were not given, say you don't have it right now.
Current time: ${now.toISOString()}.`,
  ];
  if (marketBlock) sections.push(`LIVE MARKET DATA (authoritative, timestamped):\n${marketBlock}`);
  if (eventsBlock) sections.push(`UPCOMING / RECENT HIGH-IMPACT NEWS (UTC):\n${eventsBlock}`);
  if (journalBlock) {
    sections.push(
      `THIS TRADER'S JOURNAL (their own data — reference it when relevant, call out patterns honestly):\n${journalBlock}`,
    );
  }
  return sections.join("\n\n");
}

async function fetchRecentTrades(userId, db = supabase) {
  const { data, error } = await db
    .from("trades")
    .select("date, asset, direction, session, setup, result, r_multiple, rule_break, emotion_before")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

/** Gathers journal + live market context. Each source fails independently. */
export async function buildChatContext({ userId, message }, deps = {}) {
  const { loadTrades = fetchRecentTrades, loadQuotes = getQuotes, loadCalendar = getEconomicCalendar } = deps;

  let trades = [];
  if (userId) {
    try {
      trades = await loadTrades(userId);
    } catch (err) {
      console.warn("[AI] journal context unavailable:", err.message);
    }
  }

  let instruments = extractSymbols(message);
  const mentioned = instruments.length > 0;
  if (!mentioned && needsMarketData(message, instruments)) {
    instruments = topAssets(trades, 2).map(resolveSymbol).filter(Boolean);
    if (!instruments.length) instruments = ["EURUSD", "XAUUSD"].map(resolveSymbol);
  }

  const wantsMarket = instruments.length > 0;
  const [quotes, calendar] = await Promise.all([
    wantsMarket ? loadQuotes(instruments).catch(() => []) : [],
    wantsMarket ? loadCalendar().catch(() => null) : null,
  ]);

  const events = calendar ? upcomingEvents(calendar.data) : [];
  const journalBlock = formatJournal(computeStats(trades));

  return {
    marketBlock: formatQuotes(quotes),
    eventsBlock: formatEvents(events),
    journalBlock,
    meta: {
      quotes: quotes.map((q) => ({ symbol: q.symbol, price: q.price, stale: q.stale, asOf: q.marketTime ?? q.fetchedAt })),
      news: events.length,
      journal: trades.length,
    },
  };
}

function parseChatRequest(body) {
  const { message, history = [], userId, regenerate = false } = body ?? {};
  if (typeof message !== "string" || !message.trim()) return { error: "Message is required." };
  if (message.length > MAX_MESSAGE_CHARS) {
    return { error: `Message is too long (max ${MAX_MESSAGE_CHARS} characters).` };
  }
  const safeHistory = (Array.isArray(history) ? history : [])
    .filter((m) => m && typeof m.text === "string" && m.text)
    .slice(-MAX_HISTORY)
    .map((m) => ({ sender: m.sender, text: m.text.slice(0, 4000) }));
  return { message: message.trim(), history: safeHistory, userId: userId || null, replace: regenerate === true };
}

async function dropLastExchange(userId, db) {
  const { data } = await db
    .from("chat_messages")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(2);
  if (data?.length) await db.from("chat_messages").delete().in("id", data.map((r) => r.id));
}

async function saveExchange(userId, userText, replyText, { replace = false, db = supabase } = {}) {
  if (!userId || !replyText) return;
  if (replace) await dropLastExchange(userId, db).catch(() => {});
  const { error } = await db.from("chat_messages").insert([
    { user_id: userId, role: "user", content: userText },
    { user_id: userId, role: "assistant", content: replyText },
  ]);
  if (error) console.warn("[AI] chat history save failed:", error.message);
}

export const chatWithCoach = async (req, res) => {
  const parsed = parseChatRequest(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });

  try {
    const ctx = await buildChatContext(parsed);
    const systemPrompt = buildCoachSystemPrompt(ctx);
    const messages = buildChatMessages(parsed.history, parsed.message, systemPrompt);
    const text = stripThinking(await nimComplete(messages, CHAT_OPTS));
    if (!text) throw new Error("The model returned an empty reply.");
    await saveExchange(parsed.userId, parsed.message, text, { replace: parsed.replace });
    res.status(200).json({ success: true, text, context: ctx.meta });
  } catch (error) {
    console.error("[AI] Coach Chat Error:", error.message);
    res.status(500).json({ success: false, error: `AI Error: ${error.message}` });
  }
};

/** Same as chatWithCoach but streams Server-Sent Events: context, thinking, delta, done, error. */
export const streamCoachChat = async (req, res) => {
  const parsed = parseChatRequest(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  const send = (event) => res.write(`data: ${JSON.stringify(event)}\n\n`);

  const abort = new AbortController();
  res.on("close", () => {
    if (!res.writableFinished) abort.abort();
  });

  try {
    const ctx = await buildChatContext(parsed);
    send({ type: "context", ...ctx.meta });

    const messages = buildChatMessages(parsed.history, parsed.message, buildCoachSystemPrompt(ctx));
    let reply = "";
    let thinking = false;
    for await (const part of nimStream(messages, { ...CHAT_OPTS, signal: abort.signal })) {
      if (part.type === "content") {
        reply += part.text;
        send({ type: "delta", text: part.text });
      } else if (!thinking) {
        thinking = true;
        send({ type: "thinking" });
      }
    }

    const text = stripThinking(reply);
    if (!text) throw new Error("The model returned an empty reply.");
    await saveExchange(parsed.userId, parsed.message, text, { replace: parsed.replace });
    send({ type: "done" });
  } catch (error) {
    if (!abort.signal.aborted) {
      console.error("[AI] Coach Stream Error:", error.message);
      send({ type: "error", error: `AI Error: ${error.message}` });
    }
  } finally {
    res.end();
  }
};

export const getChatHistory = async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(401).json({ error: "Unauthorized: Missing User ID" });
  try {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(HISTORY_PAGE);
    if (error) throw error;
    const messages = data.reverse().map((m) => ({
      id: m.id,
      sender: m.role === "assistant" ? "ai" : "user",
      text: m.content,
      createdAt: m.created_at,
    }));
    res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error("[AI] Chat History Error:", error.message);
    res.status(500).json({ success: false, error: "Failed to load chat history." });
  }
};

export const clearChatHistory = async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(401).json({ error: "Unauthorized: Missing User ID" });
  try {
    const { error } = await supabase.from("chat_messages").delete().eq("user_id", userId);
    if (error) throw error;
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("[AI] Clear History Error:", error.message);
    res.status(500).json({ success: false, error: "Failed to clear chat history." });
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
