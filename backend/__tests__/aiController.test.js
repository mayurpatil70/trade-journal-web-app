// backend/__tests__/aiController.test.js
//
// Unit tests for the NVIDIA NIM-powered aiController.
// No real network calls are made — the OpenAI client is injected/mocked.
//
// Run: npm test

import { jest, describe, it, expect, beforeAll, beforeEach } from "@jest/globals";

// ── Mock external deps BEFORE importing the module ────────────────────────────
jest.unstable_mockModule("openai", () => {
  const OpenAI = jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  }));
  return { default: OpenAI };
});

jest.unstable_mockModule("../config/supabase.js", () => ({
  supabase: { from: jest.fn() },
}));

// ── Dynamic import AFTER mocks ─────────────────────────────────────────────────
let nimComplete, buildMessages, buildChatMessages, extractJSON, NVIDIA_MODEL, NVIDIA_BASE_URL;

beforeAll(async () => {
  const mod = await import("../controllers/aiController.js");
  nimComplete       = mod.nimComplete;
  buildMessages     = mod.buildMessages;
  buildChatMessages = mod.buildChatMessages;
  extractJSON       = mod.extractJSON;
  NVIDIA_MODEL      = mod.NVIDIA_MODEL;
  NVIDIA_BASE_URL   = mod.NVIDIA_BASE_URL;
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a fake OpenAI client that returns `replyText` from completions */
function makeFakeClient(replyText = "mocked reply", throwError = null) {
  return {
    chat: {
      completions: {
        create: jest.fn(async () => {
          if (throwError) throw throwError;
          return {
            choices: [{ message: { content: replyText } }],
          };
        }),
      },
    },
  };
}

/** Build a minimal Express res mock */
function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
}

// ─── Constants ────────────────────────────────────────────────────────────────

describe("NVIDIA constants", () => {
  it("NVIDIA_BASE_URL points to NVIDIA NIM", () => {
    expect(NVIDIA_BASE_URL).toBe("https://integrate.api.nvidia.com/v1");
  });

  it("NVIDIA_MODEL is the nemotron model", () => {
    expect(NVIDIA_MODEL).toMatch(/nemotron/);
  });
});

// ─── buildMessages ────────────────────────────────────────────────────────────

describe("buildMessages", () => {
  it("returns [user] when no systemPrompt", () => {
    const msgs = buildMessages("hello");
    expect(msgs).toEqual([{ role: "user", content: "hello" }]);
  });

  it("prepends system message when systemPrompt provided", () => {
    const msgs = buildMessages("hello", "you are a bot");
    expect(msgs[0]).toEqual({ role: "system", content: "you are a bot" });
    expect(msgs[1]).toEqual({ role: "user", content: "hello" });
  });

  it("length is 2 with system prompt, 1 without", () => {
    expect(buildMessages("hi", "sys").length).toBe(2);
    expect(buildMessages("hi").length).toBe(1);
  });
});

// ─── buildChatMessages ────────────────────────────────────────────────────────

describe("buildChatMessages", () => {
  it("always starts with a system message", () => {
    const msgs = buildChatMessages([], "hi", "sys");
    expect(msgs[0]).toEqual({ role: "system", content: "sys" });
  });

  it("maps sender=ai → role=assistant", () => {
    const history = [{ sender: "ai", text: "I am the coach" }];
    const msgs = buildChatMessages(history, "new msg", "sys");
    expect(msgs[1]).toEqual({ role: "assistant", content: "I am the coach" });
  });

  it("maps sender=user → role=user", () => {
    const history = [{ sender: "user", text: "help me" }];
    const msgs = buildChatMessages(history, "new msg", "sys");
    expect(msgs[1]).toEqual({ role: "user", content: "help me" });
  });

  it("appends the new user message at the end", () => {
    const msgs = buildChatMessages([], "final question", "sys");
    expect(msgs[msgs.length - 1]).toEqual({ role: "user", content: "final question" });
  });

  it("preserves full history order", () => {
    const history = [
      { sender: "user", text: "q1" },
      { sender: "ai",   text: "a1" },
      { sender: "user", text: "q2" },
    ];
    const msgs = buildChatMessages(history, "q3", "sys");
    expect(msgs.map((m) => m.content)).toEqual(["sys", "q1", "a1", "q2", "q3"]);
  });

  it("handles null/undefined history gracefully", () => {
    expect(() => buildChatMessages(null, "hi", "sys")).not.toThrow();
    expect(() => buildChatMessages(undefined, "hi", "sys")).not.toThrow();
  });
});

// ─── extractJSON ─────────────────────────────────────────────────────────────

describe("extractJSON", () => {
  it("parses clean JSON directly", () => {
    const result = extractJSON('{"edges":["a"],"leaks":["b"]}');
    expect(result).toEqual({ edges: ["a"], leaks: ["b"] });
  });

  it("strips markdown code fences", () => {
    const result = extractJSON('```json\n{"edges":["a"],"leaks":["b"]}\n```');
    expect(result).toEqual({ edges: ["a"], leaks: ["b"] });
  });

  it("extracts JSON after thinking-model preamble text", () => {
    const raw = 'The user wants me to analyze trades...\n\nLet me think...\n\n{"edges":["London session wins"],"leaks":["revenge trades"]}';
    const result = extractJSON(raw);
    expect(result.edges).toEqual(["London session wins"]);
    expect(result.leaks).toEqual(["revenge trades"]);
  });

  it("handles JSON with nested objects inside arrays", () => {
    const raw = '{"edges":["BOS setup 67% WR"],"leaks":["short trades lose"]}\nSome trailing text';
    const result = extractJSON(raw);
    expect(Array.isArray(result.edges)).toBe(true);
  });

  it("returns last JSON block when multiple {} appear in text", () => {
    // The last valid {...} is the actual answer, earlier ones are in the preamble
    const raw = 'Based on {6} trades I will output: {"edges":["correct"],"leaks":["correct"]}';
    const result = extractJSON(raw);
    expect(result.edges).toEqual(["correct"]);
  });

  it("throws SyntaxError when no JSON object is found", () => {
    expect(() => extractJSON("The model just talked without JSON")).toThrow(SyntaxError);
  });

  it("throws SyntaxError when JSON is malformed", () => {
    expect(() => extractJSON("{bad json}")).toThrow();
  });
});

// ─── nimComplete ─────────────────────────────────────────────────────────────

describe("nimComplete", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns assistant reply text", async () => {
    const client = makeFakeClient("Great insight!");
    const result = await nimComplete([{ role: "user", content: "analyze EUR/USD" }], {}, client);
    expect(result).toBe("Great insight!");
  });

  it("calls completions.create with correct model", async () => {
    const client = makeFakeClient("ok");
    await nimComplete([{ role: "user", content: "test" }], {}, client);
    const call = client.chat.completions.create.mock.calls[0][0];
    expect(call.model).toBe(NVIDIA_MODEL);
  });

  it("sets stream: false", async () => {
    const client = makeFakeClient("ok");
    await nimComplete([{ role: "user", content: "test" }], {}, client);
    const call = client.chat.completions.create.mock.calls[0][0];
    expect(call.stream).toBe(false);
  });

  it("uses default temperature 0.7 when not overridden", async () => {
    const client = makeFakeClient("ok");
    await nimComplete([{ role: "user", content: "test" }], {}, client);
    const call = client.chat.completions.create.mock.calls[0][0];
    expect(call.temperature).toBe(0.7);
  });

  it("respects opts overrides (temperature, max_tokens)", async () => {
    const client = makeFakeClient("ok");
    await nimComplete([{ role: "user", content: "test" }], { temperature: 0.2, max_tokens: 256 }, client);
    const call = client.chat.completions.create.mock.calls[0][0];
    expect(call.temperature).toBe(0.2);
    expect(call.max_tokens).toBe(256);
  });

  it("passes an AbortSignal as second argument to create()", async () => {
    const client = makeFakeClient("ok");
    await nimComplete([{ role: "user", content: "test" }], {}, client);
    // The second argument to create() should be { signal: AbortSignal }
    const secondArg = client.chat.completions.create.mock.calls[0][1];
    expect(secondArg).toBeDefined();
    expect(secondArg.signal).toBeInstanceOf(AbortSignal);
  });

  it("returns empty string when content is null", async () => {
    const client = {
      chat: {
        completions: {
          create: jest.fn(async () => ({ choices: [{ message: { content: null } }] })),
        },
      },
    };
    const result = await nimComplete([{ role: "user", content: "test" }], {}, client);
    expect(result).toBe("");
  });

  it("returns empty string when choices array is empty", async () => {
    const client = {
      chat: {
        completions: {
          create: jest.fn(async () => ({ choices: [] })),
        },
      },
    };
    const result = await nimComplete([{ role: "user", content: "test" }], {}, client);
    expect(result).toBe("");
  });

  it("bubbles up API errors", async () => {
    const err = new Error("API timeout");
    err.status = 503;
    const client = makeFakeClient(null, err);
    await expect(nimComplete([{ role: "user", content: "test" }], {}, client)).rejects.toThrow(
      "API timeout",
    );
  });

  it("passes the full messages array through unchanged", async () => {
    const client = makeFakeClient("ok");
    const msgs = [
      { role: "system",    content: "you are a bot" },
      { role: "user",      content: "question" },
      { role: "assistant", content: "answer" },
      { role: "user",      content: "follow-up" },
    ];
    await nimComplete(msgs, {}, client);
    const call = client.chat.completions.create.mock.calls[0][0];
    expect(call.messages).toEqual(msgs);
  });

  it("aborts after timeoutMs — rejects with abort error", async () => {
    const client = {
      chat: {
        completions: {
          create: jest.fn(
            (_params, { signal }) =>
              new Promise((_resolve, reject) => {
                signal.addEventListener("abort", () =>
                  reject(new DOMException("The operation was aborted.", "AbortError")),
                );
              }),
          ),
        },
      },
    };
    await expect(
      nimComplete([{ role: "user", content: "test" }], { timeoutMs: 10 }, client),
    ).rejects.toThrow(/abort/i);
  });
});
