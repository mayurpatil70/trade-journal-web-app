// frontend/src/utils/guardrailValidator.js

/**
 * Extracts a numeric value from string representations like "2%", "3 in a row", "1:2", etc.
 */
export function parseRuleNumber(val, fallback = 0) {
  if (val === undefined || val === null || val === "") return fallback;
  if (typeof val === "number") return val;
  const str = String(val).trim();

  // Handle ratio e.g. "1:2" or "1:2.5" -> returns 2.5
  if (str.includes(":")) {
    const parts = str.split(":");
    const reward = parseFloat(parts[1]);
    return !isNaN(reward) ? reward : fallback;
  }

  // Handle percentage or number in string e.g. "2%" or "3 in a row"
  const match = str.match(/[\d.]+/);
  if (match) {
    const num = parseFloat(match[0]);
    return !isNaN(num) ? num : fallback;
  }

  return fallback;
}

/**
 * Gets trades executed within the last 24-hour trading timeline or today
 */
export function getTradesInLast24Hours(trades = []) {
  if (!Array.isArray(trades)) return [];
  const now = Date.now();
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  return trades.filter((t) => {
    // Try timestamp first, then created_at, then date + time
    let tradeTime = 0;
    if (t.created_at) {
      tradeTime = new Date(t.created_at).getTime();
    } else if (t.date) {
      const timeStr = t.time || "00:00";
      tradeTime = new Date(`${t.date}T${timeStr}`).getTime();
    }
    if (!tradeTime || isNaN(tradeTime)) return false;
    return now - tradeTime <= TWENTY_FOUR_HOURS;
  });
}

/**
 * Calculates current consecutive losing streak from most recent trades backwards
 */
export function calculateCurrentLosingStreak(trades = []) {
  if (!Array.isArray(trades) || trades.length === 0) return 0;

  // Sort trades newest first
  const sorted = [...trades].sort((a, b) => {
    const timeA = new Date(a.created_at || a.date || 0).getTime();
    const timeB = new Date(b.created_at || b.date || 0).getTime();
    return timeB - timeA;
  });

  let streak = 0;
  for (const t of sorted) {
    const res = (t.result || "").toLowerCase();
    const r = Number(t.r_multiple ?? t.rMultiple ?? 0);
    const pnl = Number(t.pnl ?? t.netPnl ?? 0);

    const isLoss = res === "loss" || r < 0 || pnl < 0;
    const isWin = res === "win" || r > 0 || pnl > 0;
    const isBe = res === "be" || (r === 0 && pnl === 0);

    if (isLoss) {
      streak++;
    } else if (isWin) {
      break; // Streak broken by win
    } else if (isBe) {
      // Breakeven usually doesn't break loss streak, or continues
      continue;
    }
  }

  return streak;
}

/**
 * Calculates total loss percentage/R-multiple suffered today
 */
export function calculateTodayLoss(tradesToday = []) {
  let totalLoss = 0;
  for (const t of tradesToday) {
    const res = (t.result || "").toLowerCase();
    const r = Number(t.r_multiple ?? t.rMultiple ?? 0);
    const risk = Number(t.risk || t.riskPercent || 1);

    if (res === "loss" || r < 0) {
      // If R-multiple is negative, use that as risk percentage multiplier
      totalLoss += Math.abs(r > 0 ? -r * risk : r * risk || risk);
    }
  }
  return totalLoss;
}

/**
 * Validates an incoming trade (while entering or submitting) against the user's 5 Guardrails:
 * 1. Max Risk / Trade
 * 2. Max Trades / Day (24-hour trading timeline)
 * 3. Daily Loss Cap
 * 4. Losing Streak Break
 * 5. Target Risk / Reward
 *
 * @param {Object} params
 * @param {Object} params.trade - The trade being logged (risk, entry, sl, tp, rr, etc.)
 * @param {Object} params.rules - The user's disciplineRules
 * @param {Array} params.allTrades - All user past trades
 * @returns {Object} validation result
 */
export function validateTradeAgainstRules({
  trade = {},
  rules = {},
  allTrades = [],
}) {
  if (!rules || Object.keys(rules).length === 0) {
    return { isBreached: false, breaches: [], primaryBreach: null };
  }

  const breaches = [];
  const tradesToday = getTradesInLast24Hours(allTrades);

  // ── 1. MAX RISK / TRADE ──
  const ruleMaxRisk = parseRuleNumber(rules.maxRiskPerTrade, 2.0);
  const enteredRisk = parseRuleNumber(trade.risk || trade.riskPercent, 0);

  if (enteredRisk > 0 && enteredRisk > ruleMaxRisk) {
    breaches.push({
      ruleKey: "maxRiskPerTrade",
      ruleTitle: "Max Risk / Trade",
      enteredValue: `${enteredRisk.toFixed(2)}%`,
      limitValue: `${ruleMaxRisk}%`,
      message: `You entered ${enteredRisk.toFixed(2)}% risk per trade, but your locked ceiling is ${ruleMaxRisk}%.`,
    });
  }

  // ── 2. MAX TRADES / DAY (24-Hour Timeline) ──
  const ruleMaxTrades = parseRuleNumber(rules.maxTradesPerDay, 5);
  // Current count of trades in 24h + this new trade being added
  const currentCount = tradesToday.length;
  if (ruleMaxTrades > 0 && currentCount >= ruleMaxTrades) {
    breaches.push({
      ruleKey: "maxTradesPerDay",
      ruleTitle: "Max Trades / Day",
      enteredValue: `Trade #${currentCount + 1}`,
      limitValue: `${ruleMaxTrades} trades/day`,
      message: `You are attempting to log Trade #${currentCount + 1} today. Your 24-hour limit is ${ruleMaxTrades} trades.`,
    });
  }

  // ── 3. MAX DAILY LOSS CAP ──
  const ruleDailyLoss = parseRuleNumber(rules.dailyLossCap, 5.0);
  const currentTodayLoss = calculateTodayLoss(tradesToday);
  if (ruleDailyLoss > 0 && currentTodayLoss >= ruleDailyLoss) {
    breaches.push({
      ruleKey: "dailyLossCap",
      ruleTitle: "Daily Loss Cap",
      enteredValue: `-${currentTodayLoss.toFixed(1)}%`,
      limitValue: `${ruleDailyLoss}%`,
      message: `You have reached -${currentTodayLoss.toFixed(1)}% daily loss today. Your daily loss ceiling is ${ruleDailyLoss}%. Stop trading for today!`,
    });
  }

  // ── 4. LOSING STREAK BREAK ──
  const ruleStreak = parseRuleNumber(rules.lossStreakBreak, 3);
  const currentStreak = calculateCurrentLosingStreak(allTrades);
  if (ruleStreak > 0 && currentStreak >= ruleStreak) {
    breaches.push({
      ruleKey: "lossStreakBreak",
      ruleTitle: "Losing Streak Break",
      enteredValue: `${currentStreak} losses`,
      limitValue: `${ruleStreak} in a row`,
      message: `You are on a ${currentStreak}-trade losing streak (limit is ${ruleStreak}). Take a step back and cool down before trading again!`,
    });
  }

  // ── 5. TARGET RISK / REWARD RATIO ──
  const ruleTargetRR = parseRuleNumber(rules.targetRR, 2.0);
  let enteredRR = parseRuleNumber(
    trade.targetRR || trade.rr || trade.calcRR,
    0,
  );

  // If entry, sl, tp are provided, calculate RR dynamically
  if (enteredRR === 0 && trade.entry && trade.sl && trade.tp) {
    const entry = Number(trade.entry);
    const sl = Number(trade.sl);
    const tp = Number(trade.tp);
    const riskDist = Math.abs(entry - sl);
    const rewardDist = Math.abs(tp - entry);
    if (riskDist > 0) {
      enteredRR = +(rewardDist / riskDist).toFixed(2);
    }
  }

  if (enteredRR > 0 && ruleTargetRR > 0 && enteredRR < ruleTargetRR) {
    breaches.push({
      ruleKey: "targetRR",
      ruleTitle: "Risk / Reward Ratio",
      enteredValue: `1:${enteredRR}`,
      limitValue: `1:${ruleTargetRR}`,
      message: `Setup offers 1:${enteredRR} R:R, but your rules mandate at least 1:${ruleTargetRR}. Low-asymmetry setups ruin long-term profitability.`,
    });
  }

  return {
    isBreached: breaches.length > 0,
    breaches,
    primaryBreach: breaches[0] || null,
  };
}
