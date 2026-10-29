// frontend/src/utils/performanceMetrics.js
// Institutional-grade Trading Performance & Analytics Computation Engine

export const normalizeTradeR = (t) => {
  if (!t) return 0;
  const res = (t.result || "").toLowerCase().trim();
  let r = parseFloat(t.r_multiple);
  if (Number.isNaN(r)) r = 0;
  if (res === "loss") return r !== 0 ? -Math.abs(r) : -1.0;
  if (res === "be") return 0;
  if (res === "win") return r !== 0 ? Math.abs(r) : 1.0;
  return r;
};

export const getTradePnL = (t) => {
  if (!t) return 0;

  // 1. If explicit non-zero pnl is recorded, use it directly
  if (
    t.pnl !== null &&
    t.pnl !== undefined &&
    t.pnl !== "" &&
    Number(t.pnl) !== 0 &&
    !Number.isNaN(Number(t.pnl))
  ) {
    return Number(t.pnl);
  }

  // 2. If trade was marked as breakeven, it is 0
  const res = (t.result || "").toLowerCase().trim();
  const r = normalizeTradeR(t);
  if (res === "be" || r === 0) {
    return 0;
  }

  // 3. Derive dollar PnL from R-Multiple and Risk
  // Default benchmark: 1R = $100 (or dollar risk if specified)
  const rawRisk = Number(t.risk);
  let dollarRisk = 100;
  if (!Number.isNaN(rawRisk) && rawRisk > 0) {
    dollarRisk = rawRisk >= 10 ? rawRisk : rawRisk * 100;
  }

  return r * dollarRisk;
};

export const isTradeWin = (t) => {
  if (!t) return false;
  const res = (t.result || "").toLowerCase().trim();
  if (res === "win") return true;
  if (res === "loss" || res === "be") return false;
  return normalizeTradeR(t) > 0 || getTradePnL(t) > 0;
};

export const isTradeLoss = (t) => {
  if (!t) return false;
  const res = (t.result || "").toLowerCase().trim();
  if (res === "loss") return true;
  if (res === "win" || res === "be") return false;
  return normalizeTradeR(t) < 0 || getTradePnL(t) < 0;
};

export const isTradeBE = (t) => {
  if (!t) return false;
  const res = (t.result || "").toLowerCase().trim();
  if (res === "be") return true;
  if (isTradeWin(t) || isTradeLoss(t)) return false;
  return normalizeTradeR(t) === 0 || getTradePnL(t) === 0;
};

export const formatCurrency = (val, currency = "$", showSign = true) => {
  const num = Number(val) || 0;
  const abs = Math.abs(num).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (num > 0) return showSign ? `+${currency}${abs}` : `${currency}${abs}`;
  if (num < 0) return `-${currency}${abs}`;
  return `${currency}0.00`;
};

export const formatHoldDuration = (minutes) => {
  if (!minutes || Number.isNaN(minutes) || minutes <= 0) return "—";
  const m = Math.round(minutes);
  if (m < 60) return `${m}m`;
  const hours = Math.floor(m / 60);
  const remMinutes = m % 60;
  if (hours < 24) {
    return remMinutes > 0 ? `${hours}h ${remMinutes}m` : `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
};

// Filter trades by time period
export const filterTradesByTimePeriod = (trades, period) => {
  if (!Array.isArray(trades) || trades.length === 0) return [];
  if (period === "All Time" || !period) return trades;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  return trades.filter((t) => {
    const tradeDateStr = t.date || t.entry_date;
    if (!tradeDateStr) return true;
    const tradeTime = new Date(tradeDateStr).getTime();

    if (period === "Today") {
      return tradeTime >= startOfDay;
    }
    if (period === "7 Days") {
      const cutoff = now.getTime() - 7 * 24 * 60 * 60 * 1000;
      return tradeTime >= cutoff;
    }
    if (period === "30 Days") {
      const cutoff = now.getTime() - 30 * 24 * 60 * 60 * 1000;
      return tradeTime >= cutoff;
    }
    if (period === "3 Months") {
      const cutoff = now.getTime() - 90 * 24 * 60 * 60 * 1000;
      return tradeTime >= cutoff;
    }
    if (period === "1 Year") {
      const cutoff = now.getTime() - 365 * 24 * 60 * 60 * 1000;
      return tradeTime >= cutoff;
    }
    return true;
  });
};

// Filter trades by outcome filter ("All Trades", "Winners", "Losers")
export const filterTradesByOutcome = (trades, outcome) => {
  if (!Array.isArray(trades)) return [];
  if (outcome === "Winners") {
    return trades.filter((t) => isTradeWin(t));
  }
  if (outcome === "Losers") {
    return trades.filter((t) => isTradeLoss(t));
  }
  return trades;
};

// Main Institutional Performance Engine
export const calculatePerformanceMetrics = (rawTrades, currency = "$") => {
  const all = Array.isArray(rawTrades) ? rawTrades : [];
  const closedTrades = all.filter((t) => (t.status || "").toLowerCase() !== "open");
  const openTrades = all.filter((t) => (t.status || "").toLowerCase() === "open");

  const totalClosed = closedTrades.length;
  const wins = closedTrades.filter(isTradeWin);
  const losses = closedTrades.filter(isTradeLoss);
  const beTrades = closedTrades.filter(isTradeBE);

  const winCount = wins.length;
  const lossCount = losses.length;
  const beCount = beTrades.length;

  const winRate = totalClosed > 0 ? (winCount / totalClosed) * 100 : 0;

  // Realized PnL collections
  let totalPnL = 0;
  let totalNetR = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let totalCommissions = 0;
  let totalSwap = 0;
  let totalLots = 0;

  let largestProfit = 0;
  let largestLoss = 0;

  let totalHoldTimeAll = 0;
  let holdCountAll = 0;
  let totalHoldTimeWins = 0;
  let holdCountWins = 0;
  let totalHoldTimeLosses = 0;
  let holdCountLosses = 0;

  closedTrades.forEach((t) => {
    const pnl = getTradePnL(t);
    const r = normalizeTradeR(t);
    totalPnL += pnl;
    totalNetR += r;

    if (pnl > 0) {
      grossProfit += pnl;
      if (pnl > largestProfit) largestProfit = pnl;
    } else if (pnl < 0) {
      grossLoss += pnl; // will be negative
      if (pnl < largestLoss) largestLoss = pnl;
    }

    if (t.commissions) totalCommissions += Number(t.commissions) || 0;
    if (t.swap) totalSwap += Number(t.swap) || 0;

    const lots = Number(t.lot_size) || (Array.isArray(t.executions) && t.executions[0]?.lot_size ? Number(t.executions[0].lot_size) : 0);
    if (lots > 0) totalLots += lots;

    // Hold duration in minutes
    let dur = Number(t.hold_duration_minutes);
    if ((dur === undefined || dur === null || Number.isNaN(dur) || dur <= 0) && t.entry_date && t.exit_date) {
      const start = new Date(`${t.entry_date}T${t.entry_time || "00:00:00"}`).getTime();
      const end = new Date(`${t.exit_date}T${t.exit_time || "00:00:00"}`).getTime();
      if (!Number.isNaN(start) && !Number.isNaN(end) && end >= start) {
        dur = (end - start) / 60000;
      }
    }

    if (dur > 0) {
      totalHoldTimeAll += dur;
      holdCountAll++;
      if (pnl > 0) {
        totalHoldTimeWins += dur;
        holdCountWins++;
      } else if (pnl < 0) {
        totalHoldTimeLosses += dur;
        holdCountLosses++;
      }
    }
  });

  const netResult = grossProfit + grossLoss; // grossLoss is already negative
  const profitFactor = Math.abs(grossLoss) > 0 ? grossProfit / Math.abs(grossLoss) : grossProfit > 0 ? 99.99 : 0;

  const avgWinner = winCount > 0 ? grossProfit / winCount : 0;
  const avgLoser = lossCount > 0 ? grossLoss / lossCount : 0; // negative

  // Expectancy = netResult / totalTrades
  const expectancy = totalClosed > 0 ? netResult / totalClosed : 0;

  // Risk Reward Ratio
  const riskReward = Math.abs(avgLoser) > 0 ? (avgWinner / Math.abs(avgLoser)).toFixed(2) : avgWinner > 0 ? "1:∞" : "0.00";

  // Streaks calculation (sorted chronologically by date/time)
  const sortedChronological = [...closedTrades].sort((a, b) => {
    const da = new Date(`${a.date || a.entry_date || "2000-01-01"}T${a.time || a.entry_time || "00:00:00"}`).getTime();
    const db = new Date(`${b.date || b.entry_date || "2000-01-01"}T${b.time || b.entry_time || "00:00:00"}`).getTime();
    return da - db;
  });

  let maxWinStreak = 0;
  let maxLossStreak = 0;
  let currentWinStreak = 0;
  let currentLossStreak = 0;

  sortedChronological.forEach((t) => {
    if (isTradeWin(t)) {
      currentWinStreak++;
      currentLossStreak = 0;
      if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
    } else if (isTradeLoss(t)) {
      currentLossStreak++;
      currentWinStreak = 0;
      if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
    } else {
      currentWinStreak = 0;
      currentLossStreak = 0;
    }
  });

  // Daily statistics aggregation
  const dailyPnLMap = {};
  sortedChronological.forEach((t) => {
    const d = (t.date || t.entry_date || "").split("T")[0];
    if (!d) return;
    if (!dailyPnLMap[d]) {
      dailyPnLMap[d] = { pnl: 0, count: 0, trades: [] };
    }
    const p = getTradePnL(t);
    dailyPnLMap[d].pnl += p;
    dailyPnLMap[d].count++;
    dailyPnLMap[d].trades.push(t);
  });

  const dailyDates = Object.keys(dailyPnLMap).sort();
  const totalTradingDays = dailyDates.length;

  let winningDaysCount = 0;
  let losingDaysCount = 0;
  let breakevenDaysCount = 0;
  let winningDaysPnLSum = 0;
  let losingDaysPnLSum = 0;
  let largestProfitableDay = 0;
  let largestLosingDay = 0;

  let maxConsecutiveWinningDays = 0;
  let maxConsecutiveLosingDays = 0;
  let curWinDays = 0;
  let curLossDays = 0;

  dailyDates.forEach((dateStr) => {
    const day = dailyPnLMap[dateStr];
    const pnl = day.pnl;

    if (pnl > 0) {
      winningDaysCount++;
      winningDaysPnLSum += pnl;
      if (pnl > largestProfitableDay) largestProfitableDay = pnl;
      curWinDays++;
      curLossDays = 0;
      if (curWinDays > maxConsecutiveWinningDays) maxConsecutiveWinningDays = curWinDays;
    } else if (pnl < 0) {
      losingDaysCount++;
      losingDaysPnLSum += pnl;
      if (pnl < largestLosingDay) largestLosingDay = pnl;
      curLossDays++;
      curWinDays = 0;
      if (curLossDays > maxConsecutiveLosingDays) maxConsecutiveLosingDays = curLossDays;
    } else {
      breakevenDaysCount++;
      curWinDays = 0;
      curLossDays = 0;
    }
  });

  const avgDailyPnL = totalTradingDays > 0 ? totalPnL / totalTradingDays : 0;
  const avgWinningDayPnL = winningDaysCount > 0 ? winningDaysPnLSum / winningDaysCount : 0;
  const avgLosingDayPnL = losingDaysCount > 0 ? losingDaysPnLSum / losingDaysCount : 0;
  const averageDailyVolume = totalTradingDays > 0 ? totalLots / totalTradingDays : totalLots;

  // Monthly stats
  const monthlyPnLMap = {};
  sortedChronological.forEach((t) => {
    const d = (t.date || t.entry_date || "").split("T")[0];
    if (!d) return;
    const monthKey = d.substring(0, 7);
    if (!monthlyPnLMap[monthKey]) monthlyPnLMap[monthKey] = 0;
    monthlyPnLMap[monthKey] += getTradePnL(t);
  });

  const monthKeys = Object.keys(monthlyPnLMap);
  let bestMonth = null;
  let worstMonth = null;
  let bestMonthPnL = -Infinity;
  let worstMonthPnL = Infinity;
  let totalMonthlyPnL = 0;

  monthKeys.forEach((k) => {
    const val = monthlyPnLMap[k];
    totalMonthlyPnL += val;
    if (val > bestMonthPnL) {
      bestMonthPnL = val;
      bestMonth = k;
    }
    if (val < worstMonthPnL) {
      worstMonthPnL = val;
      worstMonth = k;
    }
  });

  const formatMonthName = (key) => {
    if (!key) return null;
    const [y, m] = key.split("-");
    const d = new Date(Number(y), Number(m) - 1, 1);
    return d.toLocaleString("en-US", { month: "long", year: "numeric" });
  };

  const avgPerMonth = monthKeys.length > 0 ? totalMonthlyPnL / monthKeys.length : 0;

  // Equity Curve & Maximum Drawdown Computation
  let runningEquity = 0;
  let peakEquity = 0;
  let maxDrawdown = 0;
  let maxDrawdownPct = 0;

  const equityPoints = [
    {
      index: 0,
      date: sortedChronological[0]?.date || "Start",
      equity: 0,
      drawdown: 0,
      drawdownPct: 0,
      trade: null,
    },
  ];

  sortedChronological.forEach((t, idx) => {
    const pnl = getTradePnL(t);
    runningEquity += pnl;

    if (runningEquity > peakEquity) {
      peakEquity = runningEquity;
    }

    const dd = peakEquity - runningEquity;
    if (dd > maxDrawdown) {
      maxDrawdown = dd;
    }

    const ddPct = peakEquity > 0 ? (dd / peakEquity) * 100 : 0;
    if (ddPct > maxDrawdownPct) {
      maxDrawdownPct = ddPct;
    }

    equityPoints.push({
      index: idx + 1,
      date: t.date || t.entry_date || `Trade #${idx + 1}`,
      equity: runningEquity,
      drawdown: -dd,
      drawdownPct: ddPct,
      pnl,
      trade: t,
    });
  });

  // Long vs Short Distribution
  const longTrades = closedTrades.filter((t) => (t.direction || "").toUpperCase() === "LONG");
  const shortTrades = closedTrades.filter((t) => (t.direction || "").toUpperCase() === "SHORT");

  const longPnL = longTrades.reduce((acc, t) => acc + getTradePnL(t), 0);
  const shortPnL = shortTrades.reduce((acc, t) => acc + getTradePnL(t), 0);
  const longPct = totalClosed > 0 ? (longTrades.length / totalClosed) * 100 : 0;
  const shortPct = totalClosed > 0 ? (shortTrades.length / totalClosed) * 100 : 0;

  // Day Performance (Mon-Sun)
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dayPerformanceMap = {
    Mon: { count: 0, pnl: 0, wins: 0 },
    Tue: { count: 0, pnl: 0, wins: 0 },
    Wed: { count: 0, pnl: 0, wins: 0 },
    Thu: { count: 0, pnl: 0, wins: 0 },
    Fri: { count: 0, pnl: 0, wins: 0 },
    Sat: { count: 0, pnl: 0, wins: 0 },
    Sun: { count: 0, pnl: 0, wins: 0 },
  };

  closedTrades.forEach((t) => {
    const dateStr = t.date || t.entry_date;
    if (!dateStr) return;
    const d = new Date(dateStr);
    const dayIdx = d.getDay();
    const dayMap = [6, 0, 1, 2, 3, 4, 5];
    const key = weekdays[dayMap[dayIdx]];
    if (key && dayPerformanceMap[key]) {
      const p = getTradePnL(t);
      dayPerformanceMap[key].count++;
      dayPerformanceMap[key].pnl += p;
      if (isTradeWin(t)) dayPerformanceMap[key].wins++;
    }
  });

  const dayPerformance = weekdays.map((day) => {
    const data = dayPerformanceMap[day];
    return {
      day,
      count: data.count,
      pnl: data.pnl,
      winRate: data.count > 0 ? (data.wins / data.count) * 100 : 0,
    };
  });

  // Top Symbols
  const symbolMap = {};
  closedTrades.forEach((t) => {
    const sym = (t.asset || "UNKNOWN").toUpperCase().trim();
    if (!symbolMap[sym]) {
      symbolMap[sym] = { symbol: sym, count: 0, wins: 0, pnl: 0, totalLots: 0 };
    }
    symbolMap[sym].count++;
    if (isTradeWin(t)) symbolMap[sym].wins++;
    symbolMap[sym].pnl += getTradePnL(t);
    const lots = Number(t.lot_size) || 0;
    symbolMap[sym].totalLots += lots;
  });

  const topSymbols = Object.values(symbolMap)
    .sort((a, b) => b.pnl - a.pnl)
    .map((s) => ({
      ...s,
      winRate: s.count > 0 ? (s.wins / s.count) * 100 : 0,
    }));

  // ── STRATEGY ANALYTICS (Collected from user setup records) ──
  const setupsMap = {};
  closedTrades.forEach((t) => {
    const s = t.setup || "Discretionary";
    if (!setupsMap[s]) {
      setupsMap[s] = { name: s, count: 0, wins: 0, losses: 0, pnl: 0, r: 0 };
    }
    setupsMap[s].count++;
    if (isTradeWin(t)) setupsMap[s].wins++;
    else if (isTradeLoss(t)) setupsMap[s].losses++;
    setupsMap[s].pnl += getTradePnL(t);
    setupsMap[s].r += normalizeTradeR(t);
  });
  const setupInsights = Object.values(setupsMap)
    .sort((a, b) => b.pnl - a.pnl)
    .map((s) => ({
      ...s,
      winRate: s.count > 0 ? (s.wins / s.count) * 100 : 0,
      avgR: s.count > 0 ? s.r / s.count : 0,
    }));

  // Sessions breakdown (Asian, London, New York)
  const sessionMap = {};
  closedTrades.forEach((t) => {
    const sess = t.session || "Unspecified";
    if (!sessionMap[sess]) {
      sessionMap[sess] = { name: sess, count: 0, wins: 0, pnl: 0, r: 0 };
    }
    sessionMap[sess].count++;
    if (isTradeWin(t)) sessionMap[sess].wins++;
    sessionMap[sess].pnl += getTradePnL(t);
    sessionMap[sess].r += normalizeTradeR(t);
  });
  const sessionInsights = Object.values(sessionMap)
    .sort((a, b) => b.pnl - a.pnl)
    .map((s) => ({
      ...s,
      winRate: s.count > 0 ? (s.wins / s.count) * 100 : 0,
    }));

  // ── PSYCHOLOGY LAB (Collected from emotional & mental state records) ──
  const emotionsMap = {};
  closedTrades.forEach((t) => {
    const emo = t.emotion_before || "Neutral";
    if (!emotionsMap[emo]) {
      emotionsMap[emo] = { name: emo, count: 0, wins: 0, pnl: 0, r: 0 };
    }
    emotionsMap[emo].count++;
    if (isTradeWin(t)) emotionsMap[emo].wins++;
    emotionsMap[emo].pnl += getTradePnL(t);
    emotionsMap[emo].r += normalizeTradeR(t);
  });
  const emotionInsights = Object.values(emotionsMap)
    .sort((a, b) => b.pnl - a.pnl)
    .map((e) => ({
      ...e,
      winRate: e.count > 0 ? (e.wins / e.count) * 100 : 0,
    }));

  // Rule Followed vs Rule Broken comparison
  const rulesFollowedTrades = closedTrades.filter(
    (t) => (t.rule_break || "").toLowerCase() !== "yes"
  );
  const rulesBrokenTrades = closedTrades.filter(
    (t) => (t.rule_break || "").toLowerCase() === "yes"
  );

  const rulesFollowed = {
    count: rulesFollowedTrades.length,
    wins: rulesFollowedTrades.filter(isTradeWin).length,
    winRate:
      rulesFollowedTrades.length > 0
        ? (rulesFollowedTrades.filter(isTradeWin).length / rulesFollowedTrades.length) * 100
        : 0,
    pnl: rulesFollowedTrades.reduce((acc, t) => acc + getTradePnL(t), 0),
    r: rulesFollowedTrades.reduce((acc, t) => acc + normalizeTradeR(t), 0),
  };

  const rulesBroken = {
    count: rulesBrokenTrades.length,
    wins: rulesBrokenTrades.filter(isTradeWin).length,
    winRate:
      rulesBrokenTrades.length > 0
        ? (rulesBrokenTrades.filter(isTradeWin).length / rulesBrokenTrades.length) * 100
        : 0,
    pnl: rulesBrokenTrades.reduce((acc, t) => acc + getTradePnL(t), 0),
    r: rulesBrokenTrades.reduce((acc, t) => acc + normalizeTradeR(t), 0),
  };

  // ── MISTAKE LAB (Collected from rule violation & unforced error records) ──
  const unforcedErrors = closedTrades
    .filter(
      (t) => isTradeLoss(t) && (t.rule_break || "").toLowerCase() === "yes"
    )
    .map((t) => ({
      ...t,
      pnl: getTradePnL(t),
      r: normalizeTradeR(t),
    }));
  const costOfMistakes = unforcedErrors.reduce((acc, t) => acc + Math.abs(getTradePnL(t)), 0);
  const costOfMistakesR = unforcedErrors.reduce((acc, t) => acc + Math.abs(normalizeTradeR(t)), 0);
  const ruleAdherenceRate = totalClosed > 0 ? (rulesFollowed.count / totalClosed) * 100 : 100;

  return {
    totalPnL,
    totalNetR,
    closedTradesCount: totalClosed,
    openTradesCount: openTrades.length,
    winCount,
    lossCount,
    beCount,
    winRate,
    grossProfit,
    grossLoss,
    netResult,
    profitFactor,
    expectancy,
    avgWinner,
    avgLoser,
    bestTrade: largestProfit,
    worstTrade: largestLoss,
    maxWinStreak,
    maxLossStreak,
    riskRewardRatio: riskReward,
    totalCommissions,
    totalSwap,
    largestProfit,
    largestLoss,
    avgHoldTimeAll: holdCountAll > 0 ? totalHoldTimeAll / holdCountAll : 0,
    avgHoldTimeWins: holdCountWins > 0 ? totalHoldTimeWins / holdCountWins : 0,
    avgHoldTimeLosses: holdCountLosses > 0 ? totalHoldTimeLosses / holdCountLosses : 0,
    totalTradingDays,
    winningDaysCount,
    losingDaysCount,
    breakevenDaysCount,
    maxConsecutiveWinningDays,
    maxConsecutiveLosingDays,
    avgDailyPnL,
    avgWinningDayPnL,
    avgLosingDayPnL,
    largestProfitableDay,
    largestLosingDay,
    averageDailyVolume,
    maxDrawdown,
    maxDrawdownPct,
    bestMonth: bestMonth ? `${formatMonthName(bestMonth)} (${formatCurrency(bestMonthPnL, currency)})` : null,
    worstMonth: worstMonth ? `${formatMonthName(worstMonth)} (${formatCurrency(worstMonthPnL, currency)})` : null,
    avgPerMonth,
    equityPoints,
    dailyPnLMap,
    longTrades: {
      count: longTrades.length,
      winRate: longTrades.length > 0 ? (longTrades.filter(isTradeWin).length / longTrades.length) * 100 : 0,
      pnl: longPnL,
      percent: longPct,
    },
    shortTrades: {
      count: shortTrades.length,
      winRate: shortTrades.length > 0 ? (shortTrades.filter(isTradeWin).length / shortTrades.length) * 100 : 0,
      pnl: shortPnL,
      percent: shortPct,
    },
    dayPerformance,
    topSymbols,
    setupInsights,
    sessionInsights,
    emotionInsights,
    rulesFollowed,
    rulesBroken,
    mistakes: {
      unforcedErrorsCount: unforcedErrors.length,
      costOfMistakes,
      costOfMistakesR,
      ruleAdherenceRate,
      unforcedErrors,
    },
  };
};
