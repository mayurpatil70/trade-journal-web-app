import { describe, it, expect } from "vitest";
import {
  getAssetMultiplier,
  calculateStopDistance,
  calculateCashRisk,
  calculateRiskPercent,
  calculateLotSize,
} from "./lotSizeCalculator.js";

describe("lotSizeCalculator", () => {
  it("calculates stop distance accurately", () => {
    expect(calculateStopDistance(4170, 4160)).toBe(10);
    expect(calculateStopDistance(4160, 4170)).toBe(10);
    expect(calculateStopDistance(83050, 83300)).toBe(250);
  });

  it("calculates Gold (XAUUSD) dollar risk and risk %", () => {
    // 10 pt stop on Gold, 0.5 lots, $50k account
    // 10 * 100 * 0.5 = $500 (1.00% of $50,000)
    const cash = calculateCashRisk({
      asset: "XAUUSD",
      entry: 4170,
      sl: 4160,
      lotSize: 0.5,
    });
    expect(cash).toBe(500);

    const riskPct = calculateRiskPercent({
      asset: "XAUUSD",
      entry: 4170,
      sl: 4160,
      lotSize: 0.5,
      balance: 50000,
    });
    expect(riskPct).toBe(1.0);
  });

  it("calculates lot size from target risk % for Gold", () => {
    // 1.0% risk on $50,000 = $500 risk
    // 10 pt stop * 100 = $1,000 per lot => 0.50 lots
    const lots = calculateLotSize({
      asset: "XAUUSD",
      entry: 4170,
      sl: 4160,
      riskPercent: 1.0,
      balance: 50000,
    });
    expect(lots).toBe(0.5);
  });

  it("calculates BTCUSD dollar risk and risk %", () => {
    // 250 pt stop on BTC, 1.0 lot, $50,000 account
    // 250 * 1 * 1.0 = $250 (0.50% of $50,000)
    const cash = calculateCashRisk({
      asset: "BTCUSD",
      entry: 83050,
      sl: 83300,
      lotSize: 1.0,
    });
    expect(cash).toBe(250);

    const riskPct = calculateRiskPercent({
      asset: "BTCUSD",
      entry: 83050,
      sl: 83300,
      lotSize: 1.0,
      balance: 50000,
    });
    expect(riskPct).toBe(0.5);
  });
});
