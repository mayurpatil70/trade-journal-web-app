import { describe, it, expect } from "vitest";
import {
  getAssetMultiplier,
  calculateStopDistance,
  calculateCashRisk,
  calculateRiskPercent,
  calculateLotSize,
  MULTIPLIER_PRESETS,
} from "./lotSizeCalculator.js";

describe("lotSizeCalculator", () => {
  it("calculates stop distance accurately", () => {
    expect(calculateStopDistance(4170, 4160)).toBe(10);
    expect(calculateStopDistance(4160, 4170)).toBe(10);
    expect(calculateStopDistance(83050, 83300)).toBe(250);
    expect(calculateStopDistance(1.085, 1.083)).toBeCloseTo(0.002, 6);
  });

  describe("getAssetMultiplier", () => {
    it("recognizes Gold and all its variations", () => {
      expect(getAssetMultiplier("XAUUSD")).toBe(100);
      expect(getAssetMultiplier("GOLD")).toBe(100);
      expect(getAssetMultiplier("XAU")).toBe(100);
      expect(getAssetMultiplier("XAU/USD")).toBe(100);
      expect(getAssetMultiplier("gold_spot")).toBe(100);
    });

    it("uses Gold price heuristic when asset is 'Other' or unknown but price is ~2000-2700", () => {
      expect(getAssetMultiplier("Other", 2650)).toBe(100);
      expect(getAssetMultiplier("CustomAsset", 2700)).toBe(100);
    });

    it("recognizes Silver and its variations", () => {
      expect(getAssetMultiplier("XAGUSD")).toBe(5000);
      expect(getAssetMultiplier("SILVER")).toBe(5000);
      expect(getAssetMultiplier("XAG")).toBe(5000);
    });

    it("recognizes Crude Oil variations", () => {
      expect(getAssetMultiplier("USOIL")).toBe(100);
      expect(getAssetMultiplier("WTI")).toBe(100);
      expect(getAssetMultiplier("CRUDE")).toBe(100);
    });

    it("recognizes Major Forex pairs (100,000 multiplier)", () => {
      expect(getAssetMultiplier("EURUSD")).toBe(100000);
      expect(getAssetMultiplier("GBPUSD")).toBe(100000);
      expect(getAssetMultiplier("AUDUSD")).toBe(100000);
      expect(getAssetMultiplier("EUR/USD")).toBe(100000);
      // Heuristic fallback for Forex price < 10
      expect(getAssetMultiplier("Other", 1.085)).toBe(100000);
    });

    it("recognizes JPY pairs (1,000 multiplier)", () => {
      expect(getAssetMultiplier("USDJPY")).toBe(1000);
      expect(getAssetMultiplier("GBPJPY")).toBe(1000);
      expect(getAssetMultiplier("EURJPY")).toBe(1000);
      // Heuristic fallback for JPY price 10-500
      expect(getAssetMultiplier("Other", 155.5)).toBe(1000);
    });

    it("recognizes Indices and Crypto (1 multiplier)", () => {
      expect(getAssetMultiplier("US30")).toBe(1);
      expect(getAssetMultiplier("NAS100")).toBe(1);
      expect(getAssetMultiplier("SPX500")).toBe(1);
      expect(getAssetMultiplier("BTCUSD")).toBe(1);
      expect(getAssetMultiplier("ETHUSD")).toBe(1);
    });

    it("respects explicit override multiplier", () => {
      expect(getAssetMultiplier("EURUSD", 1.08, 100)).toBe(100);
      expect(getAssetMultiplier("Other", null, 5000)).toBe(5000);
    });
  });

  describe("calculateCashRisk and calculateRiskPercent", () => {
    it("calculates Gold (XAUUSD) dollar risk correctly for 20 pt SL and 0.1 lots", () => {
      // 20 pt stop on Gold (e.g. 2720 to 2700), 0.1 lots
      // 20 * 100 * 0.1 = $200
      const cash = calculateCashRisk({
        asset: "XAUUSD",
        entry: 2720,
        sl: 2700,
        lotSize: 0.1,
      });
      expect(cash).toBe(200);

      // On a $10,000 equity account, $200 risk is exactly 2.00%
      const riskPct = calculateRiskPercent({
        asset: "XAUUSD",
        entry: 2720,
        sl: 2700,
        lotSize: 0.1,
        balance: 10000,
      });
      expect(riskPct).toBe(2.0);
    });

    it("calculates Gold correctly even if asset was selected as 'Other' with entry price 2720", () => {
      const cash = calculateCashRisk({
        asset: "Other",
        entry: 2720,
        sl: 2700,
        lotSize: 0.1,
      });
      expect(cash).toBe(200);
    });

    it("calculates Forex EURUSD dollar risk correctly", () => {
      // 20 pip SL = 0.0020, 0.1 lots on EURUSD
      // 0.0020 * 100,000 * 0.1 = $20.00
      const cash = calculateCashRisk({
        asset: "EURUSD",
        entry: 1.085,
        sl: 1.083,
        lotSize: 0.1,
      });
      expect(cash).toBeCloseTo(20.0, 2);

      const riskPct = calculateRiskPercent({
        asset: "EURUSD",
        entry: 1.085,
        sl: 1.083,
        lotSize: 0.1,
        balance: 10000,
      });
      expect(riskPct).toBe(0.2);
    });

    it("calculates USDJPY dollar risk correctly", () => {
      // 20 pip SL = 0.20 on USDJPY, 0.1 lots
      // 0.20 * 1,000 * 0.1 = $20.00
      const cash = calculateCashRisk({
        asset: "USDJPY",
        entry: 155.2,
        sl: 155.0,
        lotSize: 0.1,
      });
      expect(cash).toBeCloseTo(20.0, 2);
    });

    it("calculates BTCUSD dollar risk correctly", () => {
      // 250 pt stop on BTC, 1.0 lot, $50,000 account
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

  describe("calculateLotSize", () => {
    it("calculates target lot size for Gold given 2.0% risk on $10,000", () => {
      // 2.0% risk on $10,000 = $200 risk
      // 20 pt stop * 100 = $2,000 per lot => 0.10 lots
      const lots = calculateLotSize({
        asset: "XAUUSD",
        entry: 2720,
        sl: 2700,
        riskPercent: 2.0,
        balance: 10000,
      });
      expect(lots).toBe(0.1);
    });

    it("respects multiplier override in lot size calculation", () => {
      const lots = calculateLotSize({
        asset: "Other",
        entry: 100,
        sl: 90,
        riskPercent: 1.0,
        balance: 10000,
        multiplier: 100, // $100 risk per pt per lot -> 10 pts * 100 = $1,000 per lot. $100 risk / $1000 = 0.10 lots
      });
      expect(lots).toBe(0.1);
    });
  });
});
