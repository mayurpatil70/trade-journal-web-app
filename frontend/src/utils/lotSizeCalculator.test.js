import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getAssetMultiplier,
  calculateStopDistance,
  calculateCashRisk,
  calculateRiskPercent,
  calculateLotSize,
} from "./lotSizeCalculator.js";

describe("lotSizeCalculator", () => {
  it("calculates stop distance accurately", () => {
    assert.equal(calculateStopDistance(4170, 4160), 10);
    assert.equal(calculateStopDistance(4160, 4170), 10);
    assert.equal(calculateStopDistance(83050, 83300), 250);
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
    assert.equal(cash, 500);

    const riskPct = calculateRiskPercent({
      asset: "XAUUSD",
      entry: 4170,
      sl: 4160,
      lotSize: 0.5,
      balance: 50000,
    });
    assert.equal(riskPct, 1.0);
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
    assert.equal(lots, 0.5);
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
    assert.equal(cash, 250);

    const riskPct = calculateRiskPercent({
      asset: "BTCUSD",
      entry: 83050,
      sl: 83300,
      lotSize: 1.0,
      balance: 50000,
    });
    assert.equal(riskPct, 0.5);
  });
});
