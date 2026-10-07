import { describe, it, expect } from 'vitest';
import {
  createReplay, positionSize, validateOrder, pendingFillPrice, exitCheck, stepReplay,
  placeOrder, closePosition, computeAnalytics, paginate,
} from './backtestEngine';

const c = (time, open, high, low, close) => ({ time, open, high, low, close });
const buy = { side: 'Buy', type: 'Market', entry: 100, sl: 95, tp: 110, units: 2 };

describe('positionSize', () => {
  it('sizes units from risk percent and stop distance', () => {
    expect(positionSize({ balance: 10000, riskPct: 1, entry: 100, sl: 95 })).toBe(20);
  });
  it('returns 0 for zero stop distance or risk', () => {
    expect(positionSize({ balance: 10000, riskPct: 1, entry: 100, sl: 100 })).toBe(0);
    expect(positionSize({ balance: 10000, riskPct: 0, entry: 100, sl: 95 })).toBe(0);
  });
});

describe('validateOrder', () => {
  it('rejects wrong-side stop loss and take profit', () => {
    expect(validateOrder({ side: 'Buy', type: 'Market', entry: 100, sl: 105, price: 100 })).toMatch(/below/);
    expect(validateOrder({ side: 'Sell', type: 'Market', entry: 100, sl: 95, price: 100 })).toMatch(/above/);
    expect(validateOrder({ side: 'Buy', type: 'Market', entry: 100, sl: 95, tp: 90, price: 100 })).toMatch(/above/);
  });
  it('requires limit/stop on the correct side of price', () => {
    expect(validateOrder({ side: 'Buy', type: 'Limit', entry: 101, sl: 95, price: 100 })).toMatch(/below the current/);
    expect(validateOrder({ side: 'Buy', type: 'Stop', entry: 99, sl: 95, price: 100 })).toMatch(/above the current/);
    expect(validateOrder({ side: 'Buy', type: 'Limit', entry: 99, sl: 95, tp: 110, price: 100 })).toBeNull();
  });
});

describe('pending fills', () => {
  it('fills a buy limit at the limit price when touched intrabar', () => {
    expect(pendingFillPrice({ side: 'Buy', type: 'Limit', entry: 99 }, c(1, 100, 101, 98, 100))).toBe(99);
  });
  it('fills a buy limit at the open when the bar gaps below it', () => {
    expect(pendingFillPrice({ side: 'Buy', type: 'Limit', entry: 99 }, c(1, 97, 98, 96, 97))).toBe(97);
  });
  it('fills a buy stop at the open when the bar gaps above it', () => {
    expect(pendingFillPrice({ side: 'Buy', type: 'Stop', entry: 101 }, c(1, 103, 104, 102, 103))).toBe(103);
  });
  it('does not fill when price is never reached', () => {
    expect(pendingFillPrice({ side: 'Sell', type: 'Limit', entry: 105 }, c(1, 100, 103, 99, 101))).toBeNull();
  });
});

describe('exit simulation', () => {
  const pos = { side: 'Buy', entry: 100, sl: 95, tp: 110 };
  it('hits stop loss and take profit at their levels', () => {
    expect(exitCheck(pos, c(1, 100, 104, 94, 96))).toEqual({ price: 95, reason: 'SL' });
    expect(exitCheck(pos, c(1, 100, 111, 99, 108))).toEqual({ price: 110, reason: 'TP' });
  });
  it('assumes the stop first when one bar touches both', () => {
    expect(exitCheck(pos, c(1, 100, 115, 90, 100)).reason).toBe('SL');
  });
  it('fills at the open on a gap through the stop or target', () => {
    expect(exitCheck(pos, c(1, 90, 92, 88, 91))).toEqual({ price: 90, reason: 'SL' });
    expect(exitCheck(pos, c(1, 115, 118, 114, 116))).toEqual({ price: 115, reason: 'TP' });
  });
  it('handles sells symmetrically and works without a take profit', () => {
    const sell = { side: 'Sell', entry: 100, sl: 105, tp: 90 };
    expect(exitCheck(sell, c(1, 100, 106, 99, 101))).toEqual({ price: 105, reason: 'SL' });
    expect(exitCheck(sell, c(1, 100, 101, 89, 90))).toEqual({ price: 90, reason: 'TP' });
    expect(exitCheck({ ...sell, tp: undefined }, c(1, 100, 101, 50, 60))).toBeNull();
  });
});

describe('replay state', () => {
  it('opens a market order at the close and closes with pnl and R', () => {
    let s = placeOrder(createReplay(10000), buy, c(1, 99, 101, 98, 100));
    expect(s.position.entry).toBe(100);
    s = stepReplay(s, c(2, 100, 111, 100, 110));
    expect(s.position).toBeNull();
    expect(s.trades[0]).toMatchObject({ exitReason: 'TP', pnl: 20, r: 2 });
    expect(s.balance).toBe(10020);
  });
  it('records a gap stop-out as worse than 1R', () => {
    let s = placeOrder(createReplay(10000), buy, c(1, 99, 101, 98, 100));
    s = stepReplay(s, c(2, 90, 92, 88, 91));
    expect(s.trades[0].pnl).toBe(-20);
    expect(s.trades[0].r).toBe(-2);
  });
  it('keeps a pending order until filled, then manages exits', () => {
    let s = placeOrder(createReplay(10000), { ...buy, type: 'Limit', entry: 98, sl: 95, tp: 110 }, c(1, 100, 101, 99, 100));
    expect(s.pending).not.toBeNull();
    s = stepReplay(s, c(2, 100, 101, 99.5, 100));
    expect(s.pending).not.toBeNull();
    s = stepReplay(s, c(3, 99, 100, 97, 98));
    expect(s.position.entry).toBe(98);
    expect(s.pending).toBeNull();
  });
  it('ignores a second order while one is active and supports manual close', () => {
    let s = placeOrder(createReplay(10000), buy, c(1, 99, 101, 98, 100));
    expect(placeOrder(s, buy, c(1, 99, 101, 98, 100))).toBe(s);
    s = closePosition(s, 103, 5);
    expect(s.trades[0]).toMatchObject({ exitReason: 'Manual', pnl: 6 });
  });
});

describe('computeAnalytics', () => {
  const t = (pnl, r, exitTime) => ({ pnl, r, entryTime: exitTime - 1, exitTime });
  const trades = [t(200, 2, 10), t(-100, -1, 20), t(-100, -1, 30), t(300, 3, 40)];
  const a = computeAnalytics(trades, 10000);

  it('computes win rate, R and expectancy', () => {
    expect(a.totalTrades).toBe(4);
    expect(a.winRate).toBe(0.5);
    expect(a.totalR).toBe(3);
    expect(a.avgR).toBe(0.75);
    expect(a.expectancyR).toBeCloseTo(0.75);
    expect(a.expectancy).toBe(75);
    expect(a.profitFactor).toBe(2.5);
  });
  it('computes max drawdown and the equity curve', () => {
    expect(a.maxDrawdown).toBe(200);
    expect(a.maxDrawdownPct).toBeCloseTo((200 / 10200) * 100);
    expect(a.equityCurve.map((p) => p.equity)).toEqual([10000, 10200, 10100, 10000, 10300]);
  });
  it('handles no trades', () => {
    const e = computeAnalytics([], 10000);
    expect(e).toMatchObject({ totalTrades: 0, winRate: 0, profitFactor: 0, maxDrawdown: 0 });
  });
});

describe('paginate', () => {
  it('slices and clamps pages', () => {
    const items = Array.from({ length: 25 }, (_, i) => i);
    expect(paginate(items, 2, 10).items).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
    expect(paginate(items, 99, 10)).toMatchObject({ page: 3, pages: 3 });
    expect(paginate([], 1, 10)).toMatchObject({ page: 1, pages: 1, total: 0 });
  });
});
