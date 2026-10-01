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
    await ai.getChatHistory({ query: {} }, res);
    expect(res.status).toHaveBeenCalledWith(401);
    await ai.clearChatHistory({ query: {} }, res);
    expect(res.status).toHaveBeenCalledTimes(2);
  });

  it("returns messages oldest-first with sender mapping", async () => {
    const rows = [
      { id: "2", role: "assistant", content: "b", created_at: "t2" },
      { id: "1", role: "user", content: "a", created_at: "t1" },
    ];
    supabase.from.mockReturnValue({ select: () => ({ eq: () => ({ order: () => ({ limit: async () => ({ data: rows, error: null }) }) }) }) });
    const res = makeRes();
    await ai.getChatHistory({ query: { userId: "u1" } }, res);
    const body = res.json.mock.calls[0][0];
    expect(body.messages.map((m) => [m.sender, m.text])).toEqual([["user", "a"], ["ai", "b"]]);
  });

  it("clears history for the user", async () => {
    const eq = jest.fn(async () => ({ error: null }));
    supabase.from.mockReturnValue({ delete: () => ({ eq }) });
    const res = makeRes();
    await ai.clearChatHistory({ query: { userId: "u1" } }, res);
    expect(supabase.from).toHaveBeenCalledWith("chat_messages");
    expect(eq).toHaveBeenCalledWith("user_id", "u1");
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });
});
