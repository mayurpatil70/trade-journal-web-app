const STRATEGIES = ["GRID", "DCA", "SMC_MOMENTUM"];
const SYMBOL_RE = /^[A-Z0-9]{5,20}$/;

export function validateBotConfig(input = {}) {
  const errors = [];
  const num = (key) => (input[key] === "" || input[key] == null ? NaN : Number(input[key]));

  const symbol = String(input.symbol || "").toUpperCase().trim();
  if (!SYMBOL_RE.test(symbol)) errors.push("symbol must look like BTCUSDT");

  const strategyType = input.strategyType || "GRID";
  if (!STRATEGIES.includes(strategyType)) errors.push(`strategyType must be one of ${STRATEGIES.join(", ")}`);

  const allocatedCapital = num("allocatedCapital");
  if (!(allocatedCapital > 0) || allocatedCapital > 1_000_000) errors.push("allocatedCapital must be between 0 and 1,000,000");

  const stopLossPercentage = num("stopLossPercentage");
  if (!(stopLossPercentage > 0 && stopLossPercentage <= 50)) errors.push("stopLossPercentage must be between 0 and 50");

  const takeProfitPercentage = num("takeProfitPercentage");
  if (!(takeProfitPercentage > 0 && takeProfitPercentage <= 100)) errors.push("takeProfitPercentage must be between 0 and 100");

  const maxActiveOrders = num("maxActiveOrders");
  if (!Number.isInteger(maxActiveOrders) || maxActiveOrders < 1 || maxActiveOrders > 20) errors.push("maxActiveOrders must be an integer from 1 to 20");

  const gridSpacingPercentage = input.gridSpacingPercentage == null || input.gridSpacingPercentage === "" ? 1 : Number(input.gridSpacingPercentage);
  if (!(gridSpacingPercentage >= 0.1 && gridSpacingPercentage <= 20)) errors.push("gridSpacingPercentage must be between 0.1 and 20");

  const trailingPercentage = input.trailingPercentage == null || input.trailingPercentage === "" ? 0 : Number(input.trailingPercentage);
  if (!(trailingPercentage >= 0 && trailingPercentage <= 10)) errors.push("trailingPercentage must be between 0 and 10");

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      name: String(input.name || `${symbol} ${strategyType}`).slice(0, 60),
      symbol,
      strategyType,
      allocatedCapital,
      stopLossPercentage,
      takeProfitPercentage,
      maxActiveOrders,
      gridSpacingPercentage,
      trailingPercentage,
    },
  };
}

export function parsePagination(query = {}, { maxLimit = 100, defaultLimit = 20 } = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, from: (page - 1) * limit, to: page * limit - 1 };
}

export function pageResult(data, total, { page, limit }) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)), data };
}
