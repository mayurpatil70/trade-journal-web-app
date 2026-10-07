import { describe, it, expect } from "@jest/globals";
import crypto from "crypto";
import { encryptSecret, decryptSecret, maskKey, getEncryptionKey, hashToken, generateBridgeToken } from "../bot-hub/crypto.js";
import { validateConnectionInput, toPublic } from "../bot-hub/connectionInput.js";
import { getUserClient, clearClientCache, invalidateUserClient } from "../bot-hub/clientCache.js";
import { validateSignal, validateAnalyzeInput, validateSettings, generateSignal, parseSignalText } from "../bot-hub/signals.js";
import { bridgePublic } from "../bot-hub/mt5Store.js";
import { extractJSON } from "../controllers/aiController.js";

const key = crypto.randomBytes(32);

describe("encryption", () => {
  it("round-trips a secret and uses a fresh iv each time", () => {
    const a = encryptSecret("super-secret-value", key);
    const b = encryptSecret("super-secret-value", key);
    expect(a.enc).not.toContain("super-secret");
    expect(a.iv).not.toBe(b.iv);
    expect(decryptSecret(a, key)).toBe("super-secret-value");
  });

  it("fails on tampered ciphertext, tag, or wrong key", () => {
    const a = encryptSecret("super-secret-value", key);
    const flipped = Buffer.from(a.enc, "base64");
    flipped[0] ^= 1;
    expect(() => decryptSecret({ ...a, enc: flipped.toString("base64") }, key)).toThrow();
    const tag = Buffer.from(a.tag, "base64");
    tag[0] ^= 1;
    expect(() => decryptSecret({ ...a, tag: tag.toString("base64") }, key)).toThrow();
    expect(() => decryptSecret(a, crypto.randomBytes(32))).toThrow();
  });

  it("fails closed without a valid ENCRYPTION_KEY", () => {
    expect(() => getEncryptionKey(undefined)).toThrow(/not configured/);
    expect(() => getEncryptionKey("short")).toThrow(/32 bytes/);
    expect(getEncryptionKey(key.toString("hex"))).toHaveLength(32);
  });

  it("hashes bridge tokens deterministically", () => {
    const t = generateBridgeToken();
    expect(t.startsWith("tjb_")).toBe(true);
    expect(hashToken(t)).toBe(hashToken(t));
    expect(hashToken(t)).not.toContain(t);
  });
});

describe("key masking and public shape", () => {
  it("masks keys", () => {
    expect(maskKey("ABCDEFGHIJKLMNOP")).toBe("ABCD…MNOP");
    expect(maskKey("short")).toBe("****");
  });

  it("never exposes secret fields", () => {
    const pub = toPublic({ id: "1", exchange: "binance", api_key: "ABCDEFGHIJKLMNOP", api_secret_enc: "x", api_secret_iv: "y", api_secret_tag: "z", live_enabled: false });
    expect(JSON.stringify(pub)).not.toMatch(/secret|"x"|"y"|"z"|ABCDEFGHIJKLMNOP/);
    expect(pub.apiKeyMasked).toBe("ABCD…MNOP");
  });

  it("validates connection input", () => {
    const good = { exchange: "binance", apiKey: "a".repeat(64), apiSecret: "b".repeat(64) };
    expect(validateConnectionInput(good).ok).toBe(true);
    expect(validateConnectionInput({ ...good, exchange: "ftx" }).ok).toBe(false);
    expect(validateConnectionInput({ ...good, apiKey: "bad key!" }).ok).toBe(false);
  });
});

describe("per-user client scoping", () => {
  it("loads credentials per user, caches briefly, and keeps users separate", async () => {
    clearClientCache();
    let t = 0;
    const calls = [];
    const load = async (id) => (calls.push(id), id === "ghost" ? null : { apiKey: `k-${id}`, apiSecret: `s-${id}`, live: id === "u2" });
    const opts = { load, now: () => t };
    const a = await getUserClient("u1", opts);
    const b = await getUserClient("u2", opts);
    expect(a.mode).toBe("TESTNET");
    expect(b.mode).toBe("LIVE");
    expect(a.client).not.toBe(b.client);
    expect(await getUserClient("u1", opts)).toBe(a);
    expect(calls).toEqual(["u1", "u2"]);
    t = 61_000;
    expect(await getUserClient("u1", opts)).not.toBe(a);
    invalidateUserClient("u2");
    await getUserClient("u2", opts);
    expect(calls.filter((c) => c === "u2")).toHaveLength(2);
    expect(await getUserClient("ghost", opts)).toBeNull();
  });
});

const candles = Array.from({ length: 30 }, (_, i) => [1700000000 + i * 3600, 1.05, 1.06, 1.04, 1.05, 100]);

describe("signal validation", () => {
  const ctx = { lastClose: 1.05, minRr: 1.5 };
  it("accepts a coherent BUY and SELL", () => {
    expect(validateSignal({ action: "buy", entry: 1.05, sl: 1.045, tp: 1.06 }, ctx)).toMatchObject({ action: "BUY", rr: 2 });
    expect(validateSignal({ action: "SELL", entry: 1.05, sl: 1.055, tp: 1.04 }, ctx)).toMatchObject({ action: "SELL", rr: 2 });
  });

  it("returns NONE for bad shapes, sides, distances and ratios", () => {
    expect(validateSignal(null, ctx).action).toBe("NONE");
    expect(validateSignal({ action: "HOLD" }, ctx).action).toBe("NONE");
    expect(validateSignal({ action: "BUY", entry: "x", sl: 1, tp: 2 }, ctx).action).toBe("NONE");
    expect(validateSignal({ action: "BUY", entry: 1.05, sl: 1.06, tp: 1.07 }, ctx).action).toBe("NONE");
    expect(validateSignal({ action: "SELL", entry: 1.05, sl: 1.045, tp: 1.06 }, ctx).action).toBe("NONE");
    expect(validateSignal({ action: "BUY", entry: 1.2, sl: 1.19, tp: 1.25 }, ctx).action).toBe("NONE");
    expect(validateSignal({ action: "BUY", entry: 1.05, sl: 1.04, tp: 1.055 }, ctx).action).toBe("NONE");
    expect(validateSignal({ action: "BUY", entry: 1.05, sl: 0.5, tp: 2 }, { ...ctx, lastClose: 1.05, maxEntryDeviationPct: 5 }).action).toBe("NONE");
  });

  it("falls back to NONE on unparseable or failing AI output", async () => {
    expect(parseSignalText("no json here", extractJSON)).toBeNull();
    const input = { symbol: "EURUSD", timeframe: "H1", candles };
    const bad = await generateSignal(input, { complete: async () => "I think buy", extract: extractJSON, minRr: 1 });
    expect(bad.action).toBe("NONE");
    const down = await generateSignal(input, { complete: async () => { throw new Error("boom"); }, extract: extractJSON, minRr: 1 });
    expect(down.action).toBe("NONE");
    const ok = await generateSignal(input, { complete: async () => 'Sure: {"action":"BUY","entry":1.05,"sl":1.045,"tp":1.06}', extract: extractJSON, minRr: 1 });
    expect(ok.action).toBe("BUY");
  });

  it("validates analyze input and settings", () => {
    expect(validateAnalyzeInput({ symbol: "EURUSD", timeframe: "h1", candles }).ok).toBe(true);
    expect(validateAnalyzeInput({ symbol: "EURUSD", timeframe: "H1", candles: candles.slice(0, 5) }).ok).toBe(false);
    expect(validateAnalyzeInput({ symbol: "EUR USD!", timeframe: "H1", candles }).ok).toBe(false);
    expect(validateAnalyzeInput({ symbol: "EURUSD", timeframe: "H1", candles: [...candles.slice(1), [1, "x", 1, 1, 1]] }).ok).toBe(false);
    expect(validateSettings({}).value).toMatchObject({ mode: "paper", auto_execute: false });
    expect(validateSettings({ mode: "paper", autoExecute: true }).ok).toBe(false);
    expect(validateSettings({ mode: "live", autoExecute: true, maxRiskPct: 10 }).ok).toBe(false);
  });

  it("reports bridge online state without exposing the token hash", () => {
    const row = { token_hash: "h", token_prefix: "tjb_abcd", mode: "paper", auto_execute: false, symbols: [], timeframe: "H1", max_risk_pct: "1", min_rr: "1", last_seen_at: new Date(1000).toISOString() };
    expect(bridgePublic(row, 2000).online).toBe(true);
    expect(bridgePublic(row, 1000 + 4 * 60_000).online).toBe(false);
    expect(JSON.stringify(bridgePublic(row))).not.toContain("token_hash");
  });
});
