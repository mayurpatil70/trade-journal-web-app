import { describe, it, expect } from "@jest/globals";
import { computeStats, formatJournal, topAssets } from "../utils/tradeStats.js";

const t = (o) => ({ date: "2026-01-01", asset: "EURUSD", session: "London", setup: "BOS", result: "win", r_multiple: 1, rule_break: "no", emotion_before: "calm", ...o });

describe("computeStats", () => {
  const trades = [
    t({ result: "loss", r_multiple: -1, rule_break: "yes", emotion_before: "angry" }),
    t({ result: "loss", r_multiple: -1, rule_break: "yes", emotion_before: "angry" }),
    t({ result: "win", r_multiple: 2 }),
    t({ result: "win", r_multiple: 3 }),
    t({ result: "be", r_multiple: 0 }),
    t({ result: "win", r_multiple: 1, session: "NY" }),
  ];
  const s = computeStats(trades);

  it("counts outcomes and win rate (break-evens excluded from rate)", () => {
    expect(s).toMatchObject({ total: 6, wins: 3, losses: 2, breakeven: 1, winRate: 60, totalR: 4 });
  });

  it("detects the current streak, skipping break-evens", () => {
    expect(s.streak).toEqual({ kind: "loss", count: 2 });
  });

  it("separates rule-break performance", () => {
    expect(s.ruleBreaks).toEqual({ count: 2, avgR: -1, followedAvgR: 1.5 });
  });

  it("finds the top loss emotion", () => {
    expect(s.topLossEmotion).toEqual({ emotion: "angry", count: 2 });
  });

  it("only reports groups with at least 3 trades", () => {
    expect(s.bySession.map((g) => g.name)).toEqual(["London"]);
  });

  it("handles empty / invalid input", () => {
    expect(computeStats([]).total).toBe(0);
    expect(computeStats(null).winRate).toBeNull();
    expect(formatJournal(computeStats([]))).toBe("");
  });
});

describe("formatJournal / topAssets", () => {
  it("renders a readable summary", () => {
    const out = formatJournal(computeStats([t({}), t({}), t({})]));
    expect(out).toContain("3W/0L/0BE");
    expect(out).toContain("Sessions (best to worst by R): London (3 trades, 100% win, 3R)");
    expect(out).toContain("Most recent trades:");
  });

  it("ranks assets by frequency", () => {
    expect(topAssets([t({ asset: "GBPUSD" }), t({}), t({}), t({ asset: "XAUUSD" })], 2)).toEqual(["EURUSD", "GBPUSD"]);
  });
});
