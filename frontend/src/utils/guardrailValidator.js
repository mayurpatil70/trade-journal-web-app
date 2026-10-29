// frontend/src/utils/guardrailValidator.js

/**
 * Extracts a numeric value from string representations like "2%", "3 in a row", "1:2", etc.
 * Properly recognizes "Disabled" as 0 (turned off).
 */
export function parseRuleNumber(val, fallback = 0) {
  if (val === undefined || val === null || val === "") return fallback;
  if (typeof val === "number") return val;
  const str = String(val).trim();

  // If user disabled this rule, return 0
  const lower = str.toLowerCase();
  if (lower.includes("disable") || lower === "off" || lower === "none") {
    return 0;
  }

  // Handle ratio e.g. "1:2" or "1:2.5" -> returns 2.5
  if (str.includes(":")) {
    const parts = str.split(":");
    const reward = parseFloat(parts[1]);
    return !isNaN(reward) ? reward : fallback;
  }

  // Handle percentage or number in string e.g. "2%" or "3 in a row" or "5 Trades / Day"
  const match = str.match(/[\d.]+/);
  if (match) {
    const num = parseFloat(match[0]);
    return !isNaN(num) ? num : fallback;
  }

  return fallback;
}

/**
 * Normalizes account name string for uniform matching
 */
export function normalizeAccountName(name) {
  if (!name || typeof name !== "string") return "Default Account";
  const trimmed = name.trim();
  return trimmed || "Default Account";
}

/**
 * Filters a trade array to only trades belonging to a specific account
 */
export function filterTradesByAccount(trades = [], targetAccount = null) {
  if (!Array.isArray(trades)) return [];
  if (!targetAccount || targetAccount === "All Accounts") return trades;
  const targetNorm = normalizeAccountName(targetAccount).toLowerCase();
  return trades.filter((t) => {
    const accNorm = normalizeAccountName(t.account_name || t.accountName).toLowerCase();
    return accNorm === targetNorm;
  });
}

/**
 * Groups trades by their respective account names
 */
export function groupTradesByAccount(trades = []) {
  if (!Array.isArray(trades)) return {};
  const groups = {};
  for (const t of trades) {
    const acc = normalizeAccountName(t.account_name || t.accountName);
    if (!groups[acc]) groups[acc] = [];
    groups[acc].push(t);
  }
  return groups;
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
      // Breakeven continues or neutral
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
      totalLoss += Math.abs(r > 0 ? -r * risk : r * risk || risk);
    }
  }
  return totalLoss;
}

/**
 * Internal helper to validate a single account's trades against rules
 */
function validateSingleAccountRules({
  accountName,
  accountTrades = [],
  rules = {},
  isLoggingTrade = false,
}) {
  const breaches = [];
  const tradesToday = getTradesInLast24Hours(accountTrades);

  // 1. MAX TRADES / DAY (Account-Wise)
  const ruleMaxTrades = parseRuleNumber(rules.maxTradesPerDay, 5);
  const currentCount = tradesToday.length;

  if (ruleMaxTrades > 0) {
    if (isLoggingTrade) {
      // User is attempting to add trade #(currentCount + 1) in this account
      if (currentCount >= ruleMaxTrades) {
        breaches.push({
          ruleKey: "maxTradesPerDay",
          ruleTitle: `Max Trades / Day (${accountName})`,
          accountName,
          enteredValue: `Trade #${currentCount + 1}`,
          limitValue: `${ruleMaxTrades} trades/day`,
          message: `You are attempting to log Trade #${currentCount + 1} today in account "${accountName}". Your limit is ${ruleMaxTrades} trades/day.`,
        });
      }
    } else {
      // Dashboard state check: has this specific account breached limit?
      if (currentCount > ruleMaxTrades) {
        breaches.push({
          ruleKey: "maxTradesPerDay",
          ruleTitle: `Max Trades / Day (${accountName})`,
          accountName,
          enteredValue: `${currentCount} trades`,
          limitValue: `${ruleMaxTrades} trades/day`,
          message: `You have logged ${currentCount} trades today in account "${accountName}". Your limit is ${ruleMaxTrades} trades/day.`,
        });
      }
    }
  }

  // 2. MAX DAILY LOSS CAP (Account-Wise)
  const ruleDailyLoss = parseRuleNumber(rules.dailyLossCap, 5.0);
  const currentTodayLoss = calculateTodayLoss(tradesToday);
  if (ruleDailyLoss > 0 && currentTodayLoss >= ruleDailyLoss) {
    breaches.push({
      ruleKey: "dailyLossCap",
      ruleTitle: `Daily Loss Cap (${accountName})`,
      accountName,
      enteredValue: `-${currentTodayLoss.toFixed(1)}%`,
      limitValue: `${ruleDailyLoss}%`,
      message: `Account "${accountName}" reached -${currentTodayLoss.toFixed(1)}% daily loss. Your ceiling is ${ruleDailyLoss}%. Cool down for today!`,
    });
  }

  // 3. LOSING STREAK BREAK (Account-Wise)
  const ruleStreak = parseRuleNumber(rules.lossStreakBreak, 3);
  if (ruleStreak > 0) {
    const currentStreak = calculateCurrentLosingStreak(accountTrades);
    if (currentStreak >= ruleStreak) {
      breaches.push({
        ruleKey: "lossStreakBreak",
        ruleTitle: `Losing Streak Break (${accountName})`,
        accountName,
        enteredValue: `${currentStreak} losses`,
        limitValue: `${ruleStreak} in a row`,
        message: `You are on a ${currentStreak}-trade losing streak in account "${accountName}" (limit is ${ruleStreak}). Take a step back and cool down before trading again!`,
      });
    }
  }

  return breaches;
}

/**
 * Validates an incoming trade or current dashboard state against user's 5 Guardrails ACCOUNT-WISE:
 * 1. Max Risk / Trade (Single trade parameter)
 * 2. Max Trades / Day (Account-Wise)
 * 3. Daily Loss Cap (Account-Wise)
 * 4. Losing Streak Break (Account-Wise)
 * 5. Target Risk / Reward (Single trade parameter)
 *
 * @param {Object} params
 * @param {Object} params.trade - The trade being logged (if any)
 * @param {Object} params.rules - The user's disciplineRules
 * @param {Array} params.allTrades - All user past trades
 * @param {string|null} params.accountName - The specific account name to evaluate
 * @returns {Object} { isBreached, breaches, primaryBreach }
 */
export function validateTradeAgainstRules({
  trade = {},
  rules = {},
  allTrades = [],
  accountName = null,
}) {
  if (!rules || Object.keys(rules).length === 0) {
    return { isBreached: false, breaches: [], primaryBreach: null };
  }

  const breaches = [];
  const isLoggingTrade = Boolean(
    trade.risk || trade.riskPercent || trade.entry || trade.sl || trade.tp
  );

  // Determine target account from trade or explicit accountName parameter
  const targetAccount =
    accountName || trade.accountName || trade.account_name || null;

  // ── 1. MAX RISK / TRADE (Evaluated on current trade if logging) ──
  const ruleMaxRisk = parseRuleNumber(rules.maxRiskPerTrade, 2.0);
  const enteredRisk = parseRuleNumber(trade.risk || trade.riskPercent, 0);
  if (enteredRisk > 0 && enteredRisk > ruleMaxRisk) {
    breaches.push({
      ruleKey: "maxRiskPerTrade",
      ruleTitle: "Max Risk / Trade",
      accountName: targetAccount || "Account",
      enteredValue: `${enteredRisk.toFixed(2)}%`,
      limitValue: `${ruleMaxRisk}%`,
      message: `You entered ${enteredRisk.toFixed(2)}% risk per trade, but your locked ceiling is ${ruleMaxRisk}%.`,
    });
  }

  // ── 2. TARGET RISK / REWARD RATIO (Evaluated on current trade if logging) ──
  const ruleTargetRR = parseRuleNumber(rules.targetRR, 2.0);
  let enteredRR = parseRuleNumber(trade.targetRR || trade.rr || trade.calcRR, 0);

  // If entry, sl, tp provided, compute RR dynamically
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
      accountName: targetAccount || "Account",
      enteredValue: `1:${enteredRR}`,
      limitValue: `1:${ruleTargetRR}`,
      message: `Setup offers 1:${enteredRR} R:R, but your rules mandate at least 1:${ruleTargetRR}. Low-asymmetry setups ruin long-term profitability.`,
    });
  }

  // ── 3. ACCOUNT-WISE EVALUATION (Max Trades / Day, Loss Cap, Losing Streak) ──
  if (targetAccount && targetAccount !== "All Accounts") {
    // Specific account selected or targeted
    const accountTrades = filterTradesByAccount(allTrades, targetAccount);
    const accountBreaches = validateSingleAccountRules({
      accountName: targetAccount,
      accountTrades,
      rules,
      isLoggingTrade,
    });
    breaches.push(...accountBreaches);
  } else {
    // "All Accounts" selected: Check EACH account INDEPENDENTLY.
    // Do NOT sum trades across accounts! If Account A has 2 trades and Account B has 2 trades,
    // neither has breached a 3-trade daily limit.
    const grouped = groupTradesByAccount(allTrades);
    for (const [acc, accTrades] of Object.entries(grouped)) {
      const accountBreaches = validateSingleAccountRules({
        accountName: acc,
        accountTrades: accTrades,
        rules,
        isLoggingTrade,
      });
      breaches.push(...accountBreaches);
    }
  }

  return {
    isBreached: breaches.length > 0,
    breaches,
    primaryBreach: breaches[0] || null,
  };
}
