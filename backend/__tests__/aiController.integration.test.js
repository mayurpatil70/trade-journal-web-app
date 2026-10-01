// backend/__tests__/aiController.integration.test.js
//
// REAL integration tests — these actually call the NVIDIA NIM API.
// They verify the full stack works end-to-end, NOT just the mocked unit logic.
//
// Requires NVIDIA_API_KEY to be set in .env
// Run: npm run test:integration
//
// NOTE: These tests make real network calls. They may take 30–90 seconds each
// because nemotron-3-ultra-550b-a55b is a 550B model.
// Jest timeout is set to 120s per test.

import "dotenv/config";
import { describe, it, expect } from "@jest/globals";
import OpenAI from "openai";
import { nimComplete, buildMessages, buildChatMessages, extractJSON, NVIDIA_MODEL, NVIDIA_BASE_URL } from "../controllers/aiController.js";

// Skip all integration tests if the key is missing (e.g. in CI without secrets)
const HAS_KEY = !!process.env.NVIDIA_API_KEY;

// Use a real client pointing at NVIDIA
const realClient = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: NVIDIA_BASE_URL,
});

// ── Helper ────────────────────────────────────────────────────────────────────
const skip = HAS_KEY ? it : it.skip;

// ─── Integration: nimComplete — real NVIDIA call ──────────────────────────────

describe("NVIDIA NIM — real API integration", () => {
  // 120s per test — the 550B model is slow
  const TIMEOUT = 120_000;

  skip(
    "nimComplete: returns a non-empty string reply",
    async () => {
      const msgs = buildMessages("Reply with exactly one word: hello", "You are a helpful assistant.");
      const reply = await nimComplete(msgs, { max_tokens: 10, timeoutMs: 110_000 }, realClient);

      expect(typeof reply).toBe("string");
      expect(reply.trim().length).toBeGreaterThan(0);
      console.log("[Integration] Raw reply:", reply);
    },
    TIMEOUT,
  );

  skip(
    "nimComplete: model field is accepted by NVIDIA (no 400/422 error)",
    async () => {
      // If the model name was wrong, NVIDIA would throw 400 INVALID_ARGUMENT.
      // Getting any reply confirms the model name is correct.
      const msgs = buildMessages("Say 'ok'", null);
      await expect(
        nimComplete(msgs, { max_tokens: 5, timeoutMs: 110_000 }, realClient),
      ).resolves.toBeTruthy();
    },
    TIMEOUT,
  );

  skip(
    "nimComplete: coach chat — real multi-turn conversation",
    async () => {
      const systemPrompt = `You are "Coach isLIVE" — a trading mentor. Keep responses under 50 words.`;
      const history = [{ sender: "ai", text: "Hey trader. What's your emotional state right now?" }];
      const msgs = buildChatMessages(history, "I feel calm and focused today.", systemPrompt);

      const reply = await nimComplete(msgs, { max_tokens: 128, timeoutMs: 110_000 }, realClient);

      expect(typeof reply).toBe("string");
      expect(reply.trim().length).toBeGreaterThan(0);
      console.log("[Integration] Coach reply:", reply);
    },
    TIMEOUT,
  );

  skip(
    "nimComplete: edge finder — reply contains parseable JSON with edges and leaks",
    async () => {
      // Use the EXACT same system prompt as production
      const systemPrompt = [
        "You are a quantitative trading analyst.",
        "Output ONLY a raw JSON object — no markdown, no code fences, no explanation, no preamble.",
        'Format: {"edges":["..."],"leaks":["..."]}',
      ].join(" ");

      const fakeTrades = Array.from({ length: 6 }, (_, i) => ({
        asset: "EURUSD",
        direction: i % 2 === 0 ? "long" : "short",
        session: "London",
        setup: "BOS",
        result: i % 3 === 0 ? "loss" : "win",
        r_multiple: i % 3 === 0 ? -1 : 2,
        rule_break: false,
        emotion_before: "calm",
      }));

      const userPrompt = `Analyze the trader's last ${fakeTrades.length} trades.
Find correlations across session, asset, direction, setup, rule breaking, emotions.
Identify up to 3 edges (where they profit) and 3 leaks (where they lose).
Trades: ${JSON.stringify(fakeTrades)}`;

      const raw = await nimComplete(
        buildMessages(userPrompt, systemPrompt),
        { max_tokens: 512, timeoutMs: 110_000 },
        realClient,
      );

      console.log("[Integration] Edge Finder raw reply:", raw);

      // extractJSON handles thinking-model preamble — same as production
      const parsed = extractJSON(raw);
      expect(Array.isArray(parsed.edges)).toBe(true);
      expect(Array.isArray(parsed.leaks)).toBe(true);
      expect(parsed.edges.length).toBeGreaterThan(0);
      expect(parsed.leaks.length).toBeGreaterThan(0);
      console.log("[Integration] edges:", parsed.edges);
      console.log("[Integration] leaks:", parsed.leaks);
    },
    TIMEOUT,
  );

  skip(
    "nimComplete: respects timeoutMs — aborts when timeout is tiny",
    async () => {
      const msgs = buildMessages("Write a 500 word essay about trading psychology.", null);
      // 1ms timeout — must always abort before the model responds
      await expect(
        nimComplete(msgs, { max_tokens: 1024, timeoutMs: 1 }, realClient),
      ).rejects.toThrow(); // AbortError or similar
    },
    TIMEOUT,
  );
});

// ─── Integration: API key & model availability check ─────────────────────────

describe("NVIDIA API key & model sanity", () => {
  skip(
    "API key is valid — models.list returns without 401",
    async () => {
      // openai SDK doesn't have .models.list(), but we can do a minimal chat call
      const msgs = [{ role: "user", content: "1+1=" }];
      const completion = await realClient.chat.completions.create({
        model: NVIDIA_MODEL,
        messages: msgs,
        max_tokens: 5,
        stream: false,
      });
      expect(completion.choices.length).toBeGreaterThan(0);
    },
    120_000,
  );
});
