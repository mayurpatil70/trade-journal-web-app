import { jest, describe, it, expect, beforeAll, beforeEach } from "@jest/globals";

jest.unstable_mockModule("openai", () => ({ default: jest.fn().mockImplementation(() => ({ chat: { completions: { create: jest.fn() } } })) }));
jest.unstable_mockModule("../config/supabase.js", () => ({ supabase: { from: jest.fn() } }));

let ai, supabase;
beforeAll(async () => {
  ai = await import("../controllers/aiController.js");
  supabase = (await import("../config/supabase.js")).supabase;
});

const quote = (symbol, price = 1.1) => ({ symbol, name: symbol, price, changePct: 0.1, hourChangePct: 0.05, marketTime: "t", stale: false });
const trade = (o = {}) => ({ date: "2026-01-01", asset: "GBPUSD", session: "London", setup: "BOS", result: "win", r_multiple: 1, rule_break: "no", emotion_before: "calm", ...o });

function makeRes() {
  const res = { chunks: [], writableFinished: false, listeners: {} };
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.writeHead = jest.fn();
  res.write = jest.fn((c) => res.chunks.push(c));
  res.end = jest.fn(() => { res.writableFinished = true; });
  res.on = jest.fn((ev, fn) => { res.listeners[ev] = fn; });
  res.events = () => res.chunks.map((c) => JSON.parse(c.replace(/^data: /, "")));
  return res;
}

describe("buildChatContext", () => {
  it("fetches quotes for symbols mentioned in the message", async () => {
    const loadQuotes = jest.fn(async (i) => i.map((x) => quote(x.symbol)));
    const ctx = await ai.buildChatContext(
      { userId: "u1", message: "thoughts on eur/usd and gold?" },
      { loadTrades: async () => [trade()], loadQuotes, loadCalendar: async () => ({ data: [] }) },
    );
    expect(loadQuotes.mock.calls[0][0].map((i) => i.symbol)).toEqual(["EURUSD", "XAUUSD"]);
    expect(ctx.marketBlock).toContain("EURUSD");
    expect(ctx.meta.quotes).toHaveLength(2);
    expect(ctx.journalBlock).toContain("Last 1 trades");
  });

  it("falls back to the user's most traded assets for generic market questions", async () => {
    const loadQuotes = jest.fn(async (i) => i.map((x) => quote(x.symbol)));
    await ai.buildChatContext(
      { userId: "u1", message: "what's the market doing now?" },
      { loadTrades: async () => [trade(), trade(), trade({ asset: "XAUUSD" })], loadQuotes, loadCalendar: async () => ({ data: [] }) },
    );
    expect(loadQuotes.mock.calls[0][0].map((i) => i.symbol)).toEqual(["GBPUSD", "XAUUSD"]);
  });

  it("skips market data for purely psychological messages", async () => {
    const loadQuotes = jest.fn();
    const ctx = await ai.buildChatContext(
      { userId: null, message: "I feel scared" },
      { loadQuotes, loadCalendar: jest.fn() },
    );
    expect(loadQuotes).not.toHaveBeenCalled();
    expect(ctx.marketBlock).toBe("");
  });

  it("degrades gracefully when every source fails", async () => {
    const ctx = await ai.buildChatContext(
      { userId: "u1", message: "EURUSD now?" },
      {
        loadTrades: async () => { throw new Error("db down"); },
        loadQuotes: async () => { throw new Error("yahoo down"); },
        loadCalendar: async () => { throw new Error("cal down"); },
      },
    );
    expect(ctx).toMatchObject({ marketBlock: "", eventsBlock: "", journalBlock: "" });
  });
});

describe("buildCoachSystemPrompt", () => {
  it("includes only the sections that have data", () => {
    const bare = ai.buildCoachSystemPrompt({ marketBlock: "", eventsBlock: "", journalBlock: "" });
    expect(bare).toContain("Coach isLIVE");
    expect(bare).not.toContain("LIVE MARKET DATA");
    const full = ai.buildCoachSystemPrompt({ marketBlock: "- EURUSD: 1.1", eventsBlock: "- NFP", journalBlock: "Last 5 trades" });
    expect(full).toContain("LIVE MARKET DATA");
    expect(full).toContain("HIGH-IMPACT NEWS");
    expect(full).toContain("JOURNAL");
  });
});

describe("stripThinking", () => {
  it("removes think blocks and orphan closing tags", () => {
    expect(ai.stripThinking("<think>plan</think>Answer")).toBe("Answer");
    expect(ai.stripThinking("plan...</think>Answer")).toBe("Answer");
    expect(ai.stripThinking("Plain")).toBe("Plain");
  });
});

describe("nimStream", () => {
  it("yields content and reasoning deltas separately", async () => {
    const chunks = [{ choices: [{ delta: { reasoning_content: "hm" } }] }, { choices: [{ delta: { content: "Hi" } }] }, { choices: [{ delta: {} }] }];
    const client = { chat: { completions: { create: jest.fn(async () => (async function* () { yield* chunks; })()) } } };
    const out = [];
    for await (const p of ai.nimStream([{ role: "user", content: "x" }], {}, client)) out.push(p);
    expect(out).toEqual([{ type: "reasoning", text: "hm" }, { type: "content", text: "Hi" }]);
    expect(client.chat.completions.create.mock.calls[0][0].stream).toBe(true);
  });
});

describe("chat request validation", () => {
  it.each([[{}], [{ message: "   " }], [{ message: "x".repeat(2001) }]])("chatWithCoach rejects %#", async (body) => {
    const res = makeRes();
    await ai.chatWithCoach({ body }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("streamCoachChat rejects before opening the stream", async () => {
    const res = makeRes();
    await ai.streamCoachChat({ body: {} }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.writeHead).not.toHaveBeenCalled();
  });
});

describe("chat history endpoints", () => {
  beforeEach(() => jest.clearAllMocks());

  it("requires a user id", async () => {
    const res = makeRes();
    await ai.getChatHistory({}, res);
    expect(res.status).toHaveBeenCalledWith(401);
    await ai.clearChatHistory({}, res);
    expect(res.status).toHaveBeenCalledTimes(2);
  });

  it("returns messages oldest-first with sender mapping", async () => {
    const rows = [
      { id: "2", role: "assistant", content: "b", created_at: "t2" },
      { id: "1", role: "user", content: "a", created_at: "t1" },
    ];
    supabase.from.mockReturnValue({ select: () => ({ eq: () => ({ order: () => ({ limit: async () => ({ data: rows, error: null }) }) }) }) });
    const res = makeRes();
    await ai.getChatHistory({ userId: "u1" }, res);
    const body = res.json.mock.calls[0][0];
    expect(body.messages.map((m) => [m.sender, m.text])).toEqual([["user", "a"], ["ai", "b"]]);
  });

  it("clears history for the user", async () => {
    const eq = jest.fn(async () => ({ error: null }));
    supabase.from.mockReturnValue({ delete: () => ({ eq }) });
    const res = makeRes();
    await ai.clearChatHistory({ userId: "u1" }, res);
    expect(supabase.from).toHaveBeenCalledWith("chat_messages");
    expect(eq).toHaveBeenCalledWith("user_id", "u1");
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });
});

describe("model fallback", () => {
  const overloaded = () => Object.assign(new Error("Service temporarily overloaded"), { status: 503 });
  const ok = (content) => ({ choices: [{ message: { content } }] });
  const msgs = [{ role: "user", content: "x" }];
  const fast = { retryDelayMs: 0, models: ["a", "b", "c"] };
  const clientWith = (create) => ({ chat: { completions: { create: jest.fn(create) } } });
  const modelsTried = (client) => client.chat.completions.create.mock.calls.map((c) => c[0].model);

  it("moves to the next model when the first is overloaded", async () => {
    const client = clientWith(async (p) => {
      if (p.model === "a") throw overloaded();
      return ok(p.model);
    });
    expect(await ai.nimComplete(msgs, fast, client)).toBe("b");
    expect(modelsTried(client)).toEqual(["a", "b"]);
  });

  it("tries every model then throws the last error", async () => {
    const client = clientWith(async () => { throw overloaded(); });
    await expect(ai.nimComplete(msgs, fast, client)).rejects.toThrow(/overloaded/);
    expect(modelsTried(client)).toEqual(["a", "b", "c"]);
  });

  it.each([[400], [401], [404]])("does not fall back on HTTP %s", async (status) => {
    const client = clientWith(async () => { throw Object.assign(new Error("bad"), { status }); });
    await expect(ai.nimComplete(msgs, fast, client)).rejects.toThrow("bad");
    expect(client.chat.completions.create).toHaveBeenCalledTimes(1);
  });

  it("falls back on 429 and on overload wording without a status", async () => {
    const errors = [Object.assign(new Error("slow down"), { status: 429 }), new Error("Service temporarily overloaded")];
    for (const err of errors) {
      const client = clientWith(async (p) => {
        if (p.model === "a") throw err;
        return ok("fine");
      });
      expect(await ai.nimComplete(msgs, fast, client)).toBe("fine");
    }
  });

  it("stream falls back if the first model fails before sending anything", async () => {
    const client = clientWith(async (p) => {
      if (p.model === "a") throw overloaded();
      return (async function* () { yield { choices: [{ delta: { content: "hi" } }] }; })();
    });
    const out = [];
    for await (const p of ai.nimStream(msgs, fast, client)) out.push(p);
    expect(out).toEqual([{ type: "content", text: "hi" }]);
    expect(modelsTried(client)).toEqual(["a", "b"]);
  });

  it("stream falls back when the error arrives on the first read", async () => {
    const client = clientWith(async (p) =>
      p.model === "a"
        ? (async function* () { throw overloaded(); })()
        : (async function* () { yield { choices: [{ delta: { content: "ok" } }] }; })(),
    );
    const out = [];
    for await (const p of ai.nimStream(msgs, fast, client)) out.push(p);
    expect(out).toEqual([{ type: "content", text: "ok" }]);
  });

  it("stream does not restart once text has been sent", async () => {
    const client = clientWith(async () =>
      (async function* () {
        yield { choices: [{ delta: { content: "partial" } }] };
        throw overloaded();
      })(),
    );
    const out = [];
    await expect(
      (async () => { for await (const p of ai.nimStream(msgs, fast, client)) out.push(p); })(),
    ).rejects.toThrow(/overloaded/);
    expect(out).toEqual([{ type: "content", text: "partial" }]);
    expect(client.chat.completions.create).toHaveBeenCalledTimes(1);
  });

  it("stream does not fall back after the client aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    const client = clientWith(async () => { throw overloaded(); });
    await expect(
      (async () => { for await (const _ of ai.nimStream(msgs, { ...fast, signal: controller.signal }, client)); })(),
    ).rejects.toThrow();
    expect(client.chat.completions.create).toHaveBeenCalledTimes(1);
  });
});

describe("modelChain and error messages", () => {
  it("puts the primary first, dedupes, and reads NIM_FALLBACK_MODELS", () => {
    expect(ai.modelChain(`${ai.NVIDIA_MODEL}, x/one ,,x/two`)).toEqual([ai.NVIDIA_MODEL, "x/one", "x/two"]);
    expect(ai.modelChain("")).toEqual([ai.NVIDIA_MODEL]);
    expect(ai.modelChain(undefined)[0]).toBe(ai.NVIDIA_MODEL);
    expect(ai.modelChain(undefined).length).toBeGreaterThan(1);
  });

  it("shows a friendly message for overload and the raw one otherwise", () => {
    expect(ai.friendlyAiError(Object.assign(new Error("x"), { status: 503 }))).toMatch(/busy right now/);
    expect(ai.friendlyAiError(new Error("boom"))).toBe("AI Error: boom");
  });
});

describe("image and edge-case handling", () => {
  const png = { mimetype: "image/png", buffer: Buffer.from("fake") };
  const multimodalErr = () => Object.assign(new Error("400 ValueError: Received multimodal data but multimodal processing is not enabled."), { status: 400 });
  const openaiClient = async () => (await import("../controllers/aiController.js")).openai;

  it("friendlyAiError maps multimodal, too-large, timeout and empty replies", () => {
    expect(ai.friendlyAiError(multimodalErr())).toMatch(/can't read images/);
    expect(ai.friendlyAiError(Object.assign(new Error("x"), { status: 413 }))).toMatch(/too large/);
    expect(ai.friendlyAiError(Object.assign(new Error("Request aborted"), { name: "AbortError" }))).toMatch(/too long/);
    expect(ai.friendlyAiError(new Error("The model returned an empty reply."))).toMatch(/empty reply/);
  });

  it("withoutImages flattens image parts into text with a note", () => {
    const out = ai.withoutImages([{ role: "user", content: [{ type: "text", text: "hi" }, { type: "image_url", image_url: { url: "data:x" } }] }, { role: "user", content: "plain" }]);
    expect(out[0].content).toContain("hi");
    expect(out[0].content).toContain(ai.IMAGE_UNAVAILABLE_NOTE);
    expect(JSON.stringify(out)).not.toContain("data:x");
    expect(out[1].content).toBe("plain");
  });

  it("chatWithCoach retries text-only when the model rejects images", async () => {
    const client = await openaiClient();
    client.chat.completions.create.mockReset()
      .mockRejectedValueOnce(multimodalErr())
      .mockResolvedValueOnce({ choices: [{ message: { content: "Describe it to me." } }] });
    const res = makeRes();
    await ai.chatWithCoach({ body: { message: "see chart" }, file: png }, res);
    expect(client.chat.completions.create).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(client.chat.completions.create.mock.calls[1][0].messages)).not.toContain("image_url");
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("chatWithCoach returns a friendly 500 for an empty model reply", async () => {
    const client = await openaiClient();
    client.chat.completions.create.mockReset().mockResolvedValue({ choices: [{ message: { content: "<think>x</think>" } }] });
    const res = makeRes();
    await ai.chatWithCoach({ body: { message: "hi" } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].error).toMatch(/empty reply/);
  });

  it("streamCoachChat falls back to text-only on a multimodal error", async () => {
    const client = await openaiClient();
    const stream = (async function* () { yield { choices: [{ delta: { content: "ok" } }] }; })();
    client.chat.completions.create.mockReset().mockRejectedValueOnce(multimodalErr()).mockResolvedValueOnce(stream);
    const res = makeRes();
    await ai.streamCoachChat({ body: { message: "see chart" }, file: png }, res);
    expect(res.events().map((e) => e.type)).toEqual(expect.arrayContaining(["delta", "done"]));
    expect(res.events().some((e) => e.type === "error")).toBe(false);
  });

  it("streamCoachChat emits a friendly error for provider failures", async () => {
    const client = await openaiClient();
    client.chat.completions.create.mockReset().mockRejectedValue(Object.assign(new Error("bad"), { status: 400 }));
    const res = makeRes();
    await ai.streamCoachChat({ body: { message: "hi" } }, res);
    expect(res.events().at(-1)).toEqual({ type: "error", error: "AI Error: bad" });
  });

  it("strips base64 images from history, drops malformed entries and caps length", async () => {
    const client = await openaiClient();
    client.chat.completions.create.mockReset().mockResolvedValue({ choices: [{ message: { content: "fine" } }] });
    const history = [
      null, 5, { sender: "user" }, { sender: "user", text: "   " },
      { sender: "user", text: `look data:image/png;base64,${"A".repeat(50000)} here` },
      ...Array.from({ length: 30 }, (_, i) => ({ sender: i % 2 ? "ai" : "user", text: `m${i}` })),
    ];
    const res = makeRes();
    await ai.chatWithCoach({ body: { message: "hi", history } }, res);
    const sent = client.chat.completions.create.mock.calls[0][0].messages;
    expect(JSON.stringify(sent)).not.toContain("AAAA");
    expect(sent.length).toBeLessThanOrEqual(14);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("accepts history sent as a JSON string, malformed JSON, and a missing body", async () => {
    const client = await openaiClient();
    client.chat.completions.create.mockReset().mockResolvedValue({ choices: [{ message: { content: "fine" } }] });
    for (const body of [{ message: "hi", history: JSON.stringify([{ sender: "ai", text: "yo" }]) }, { message: "hi", history: "{oops" }]) {
      const res = makeRes();
      await ai.chatWithCoach({ body }, res);
      expect(res.status).toHaveBeenCalledWith(200);
    }
    const res = makeRes();
    await ai.chatWithCoach({}, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("accepts a message of exactly the max length and trims whitespace", async () => {
    const client = await openaiClient();
    client.chat.completions.create.mockReset().mockResolvedValue({ choices: [{ message: { content: "fine" } }] });
    const res = makeRes();
    await ai.chatWithCoach({ body: { message: `  ${"x".repeat(2000)}  ` } }, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("does not report an error when the client aborts mid-stream", async () => {
    const client = await openaiClient();
    client.chat.completions.create.mockReset().mockImplementation(async () => {
      throw Object.assign(new Error("aborted"), { name: "AbortError" });
    });
    const res = makeRes();
    const p = ai.streamCoachChat({ body: { message: "hi" } }, res);
    res.listeners.close?.();
    await p;
    expect(res.events().some((e) => e.type === "error")).toBe(false);
  });
});
