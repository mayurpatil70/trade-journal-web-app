const isBuy = (side) => side === 'Buy';
const dir = (side) => (isBuy(side) ? 1 : -1);

export function createReplay(balance) {
  return { initialBalance: balance, balance, position: null, pending: null, trades: [], nextId: 1 };
}

export function positionSize({ balance, riskPct, entry, sl }) {
  const risk = (balance * riskPct) / 100;
  const dist = Math.abs(entry - sl);
  if (!(risk > 0) || !(dist > 0)) return 0;
  return risk / dist;
}

export function validateOrder({ side, type, entry, sl, tp, price }) {
  if (!Number.isFinite(entry) || entry <= 0) return 'Enter a valid entry price.';
  if (!Number.isFinite(sl)) return 'Stop loss is required.';
  if (isBuy(side) ? sl >= entry : sl <= entry) return `Stop loss must be ${isBuy(side) ? 'below' : 'above'} entry.`;
  if (Number.isFinite(tp) && (isBuy(side) ? tp <= entry : tp >= entry)) {
    return `Take profit must be ${isBuy(side) ? 'above' : 'below'} entry.`;
  }
  if (type === 'Limit' && (isBuy(side) ? entry >= price : entry <= price)) {
    return `${side} limit must be ${isBuy(side) ? 'below' : 'above'} the current price.`;
  }
  if (type === 'Stop' && (isBuy(side) ? entry <= price : entry >= price)) {
    return `${side} stop must be ${isBuy(side) ? 'above' : 'below'} the current price.`;
  }
  return null;
}

export function pendingFillPrice(order, candle) {
  const buy = isBuy(order.side);
  if (order.type === 'Limit') {
    if (buy ? candle.low <= order.entry : candle.high >= order.entry) {
      return buy ? Math.min(candle.open, order.entry) : Math.max(candle.open, order.entry);
    }
  } else if (order.type === 'Stop') {
    if (buy ? candle.high >= order.entry : candle.low <= order.entry) {
      return buy ? Math.max(candle.open, order.entry) : Math.min(candle.open, order.entry);
    }
  }
  return null;
}

export function exitCheck(position, candle, gapAllowed = true) {
  const buy = isBuy(position.side);
  const hasTp = Number.isFinite(position.tp);
  if (gapAllowed) {
    if (buy ? candle.open <= position.sl : candle.open >= position.sl) return { price: candle.open, reason: 'SL' };
    if (hasTp && (buy ? candle.open >= position.tp : candle.open <= position.tp)) return { price: candle.open, reason: 'TP' };
  }
  if (buy ? candle.low <= position.sl : candle.high >= position.sl) return { price: position.sl, reason: 'SL' };
  if (hasTp && (buy ? candle.high >= position.tp : candle.low <= position.tp)) return { price: position.tp, reason: 'TP' };
  return null;
}

export function openPnl(position, price) {
  return (price - position.entry) * dir(position.side) * position.units;
}

function closeTrade(state, exit, time) {
  const { position } = state;
  const pnl = openPnl(position, exit.price);
  const risk = Math.abs(position.entry - position.initialSl) * position.units;
  const balance = state.balance + pnl;
  const trade = {
    id: position.id,
    side: position.side,
    entry: position.entry,
    sl: position.initialSl,
    tp: position.tp,
    units: position.units,
    entryTime: position.entryTime,
    exitTime: time,
    exitPrice: exit.price,
    exitReason: exit.reason,
    pnl,
    r: risk > 0 ? pnl / risk : 0,
    balanceAfter: balance,
  };
  return { ...state, balance, position: null, trades: [...state.trades, trade] };
}

export function fillPending(state, price, time) {
  const { pending } = state;
  const position = {
    id: pending.id,
    side: pending.side,
    entry: price,
    sl: pending.sl,
    initialSl: pending.sl,
    tp: pending.tp,
    units: pending.units,
    entryTime: time,
  };
  return { ...state, pending: null, position };
}

export function stepReplay(state, candle) {
  let next = state;
  if (next.pending) {
    const price = pendingFillPrice(next.pending, candle);
    if (price === null) return next;
    next = fillPending(next, price, candle.time);
    const exit = exitCheck(next.position, candle, false);
    return exit ? closeTrade(next, exit, candle.time) : next;
  }
  if (next.position) {
    const exit = exitCheck(next.position, candle);
    if (exit) return closeTrade(next, exit, candle.time);
  }
  return next;
}

export function placeOrder(state, order, candle) {
  if (state.position || state.pending) return state;
  const id = state.nextId;
  const base = { id, side: order.side, entry: order.entry, sl: order.sl, tp: order.tp, units: order.units };
  const next = { ...state, nextId: id + 1 };
  if (order.type === 'Market') {
    return fillPending({ ...next, pending: base }, candle.close, candle.time);
  }
  return { ...next, pending: { ...base, type: order.type, placedTime: candle.time } };
}

export function closePosition(state, price, time, reason = 'Manual') {
  if (!state.position) return state;
  return closeTrade(state, { price, reason }, time);
}

export function cancelPending(state) {
  return { ...state, pending: null };
}

export function modifyPosition(state, { sl, tp }) {
  if (!state.position) return state;
  const p = state.position;
  return { ...state, position: { ...p, sl: Number.isFinite(sl) ? sl : p.sl, tp: Number.isFinite(tp) ? tp : undefined } };
}

export function computeAnalytics(trades, initialBalance) {
  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl < 0);
  const sum = (arr, f) => arr.reduce((a, t) => a + f(t), 0);
  const n = trades.length;
  const grossWin = sum(wins, (t) => t.pnl);
  const grossLoss = Math.abs(sum(losses, (t) => t.pnl));
  const netPnl = sum(trades, (t) => t.pnl);

  let equity = initialBalance;
  let peak = initialBalance;
  let maxDrawdown = 0;
  let maxDrawdownPct = 0;
  const equityCurve = [{ time: trades[0]?.entryTime ?? 0, equity }];
  for (const t of trades) {
    equity += t.pnl;
    peak = Math.max(peak, equity);
    const dd = peak - equity;
    maxDrawdown = Math.max(maxDrawdown, dd);
    maxDrawdownPct = Math.max(maxDrawdownPct, peak > 0 ? (dd / peak) * 100 : 0);
    equityCurve.push({ time: t.exitTime, equity });
  }

  const avgWinR = wins.length ? sum(wins, (t) => t.r) / wins.length : 0;
  const avgLossR = losses.length ? sum(losses, (t) => t.r) / losses.length : 0;
  const winRate = n ? wins.length / n : 0;

  return {
    totalTrades: n,
    wins: wins.length,
    losses: losses.length,
    winRate,
    netPnl,
    returnPct: initialBalance ? (netPnl / initialBalance) * 100 : 0,
    avgWin: wins.length ? grossWin / wins.length : 0,
    avgLoss: losses.length ? -grossLoss / losses.length : 0,
    avgR: n ? sum(trades, (t) => t.r) / n : 0,
    totalR: sum(trades, (t) => t.r),
    avgWinR,
    avgLossR,
    expectancyR: winRate * avgWinR + (1 - winRate) * avgLossR,
    expectancy: n ? netPnl / n : 0,
    profitFactor: grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0,
    maxDrawdown,
    maxDrawdownPct,
    bestTrade: n ? Math.max(...trades.map((t) => t.pnl)) : 0,
    worstTrade: n ? Math.min(...trades.map((t) => t.pnl)) : 0,
    equityCurve,
  };
}

export function paginate(items, page, pageSize) {
  const pages = Math.max(Math.ceil(items.length / pageSize), 1);
  const current = Math.min(Math.max(page, 1), pages);
  return { items: items.slice((current - 1) * pageSize, current * pageSize), page: current, pages, total: items.length };
}
