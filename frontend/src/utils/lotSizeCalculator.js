// frontend/src/utils/lotSizeCalculator.js

export const ASSET_SPECS = {
  // Commodities - Metals & Energy
  XAUUSD: {
    symbol: "XAUUSD",
    name: "Gold (XAU/USD)",
    multiplier: 100, // $1 move on 1.0 lot = $100 (100 oz)
    type: "commodity",
    pipSize: 0.1,
  },
  GOLD: {
    symbol: "GOLD",
    name: "Gold Spot",
    multiplier: 100,
    type: "commodity",
    pipSize: 0.1,
  },
  XAU: {
    symbol: "XAU",
    name: "Gold",
    multiplier: 100,
    type: "commodity",
    pipSize: 0.1,
  },
  XAGUSD: {
    symbol: "XAGUSD",
    name: "Silver (XAG/USD)",
    multiplier: 5000, // $1 move on 1.0 lot = $5,000 (5,000 oz)
    type: "commodity",
    pipSize: 0.01,
  },
  SILVER: {
    symbol: "SILVER",
    name: "Silver Spot",
    multiplier: 5000,
    type: "commodity",
    pipSize: 0.01,
  },
  XAG: {
    symbol: "XAG",
    name: "Silver",
    multiplier: 5000,
    type: "commodity",
    pipSize: 0.01,
  },
  USOIL: {
    symbol: "USOIL",
    name: "WTI Crude Oil",
    multiplier: 100, // $1 move on 1.0 lot = $100 (100 bbl)
    type: "commodity",
    pipSize: 0.01,
  },
  UKOIL: {
    symbol: "UKOIL",
    name: "Brent Crude Oil",
    multiplier: 100,
    type: "commodity",
    pipSize: 0.01,
  },
  WTI: {
    symbol: "WTI",
    name: "Crude Oil WTI",
    multiplier: 100,
    type: "commodity",
    pipSize: 0.01,
  },
  OIL: {
    symbol: "OIL",
    name: "Crude Oil",
    multiplier: 100,
    type: "commodity",
    pipSize: 0.01,
  },

  // Forex - Major Pairs (1.0 std lot = 100,000 units => 1.00 move = $100,000, 1 pip = 0.0001 = $10)
  EURUSD: { symbol: "EURUSD", name: "EUR / USD", multiplier: 100000, type: "forex", pipSize: 0.0001 },
  GBPUSD: { symbol: "GBPUSD", name: "GBP / USD", multiplier: 100000, type: "forex", pipSize: 0.0001 },
  AUDUSD: { symbol: "AUDUSD", name: "AUD / USD", multiplier: 100000, type: "forex", pipSize: 0.0001 },
  NZDUSD: { symbol: "NZDUSD", name: "NZD / USD", multiplier: 100000, type: "forex", pipSize: 0.0001 },
  USDCAD: { symbol: "USDCAD", name: "USD / CAD", multiplier: 100000, type: "forex", pipSize: 0.0001 },
  USDCHF: { symbol: "USDCHF", name: "USD / CHF", multiplier: 100000, type: "forex", pipSize: 0.0001 },
  EURGBP: { symbol: "EURGBP", name: "EUR / GBP", multiplier: 100000, type: "forex", pipSize: 0.0001 },
  EURAUD: { symbol: "EURAUD", name: "EUR / AUD", multiplier: 100000, type: "forex", pipSize: 0.0001 },
  GBPAUD: { symbol: "GBPAUD", name: "GBP / AUD", multiplier: 100000, type: "forex", pipSize: 0.0001 },

  // Forex - JPY Pairs (1.0 std lot = 100,000 units => 1.00 move = $1,000, 1 pip = 0.01 = $10)
  USDJPY: { symbol: "USDJPY", name: "USD / JPY", multiplier: 1000, type: "forex", pipSize: 0.01 },
  EURJPY: { symbol: "EURJPY", name: "EUR / JPY", multiplier: 1000, type: "forex", pipSize: 0.01 },
  GBPJPY: { symbol: "GBPJPY", name: "GBP / JPY", multiplier: 1000, type: "forex", pipSize: 0.01 },
  AUDJPY: { symbol: "AUDJPY", name: "AUD / JPY", multiplier: 1000, type: "forex", pipSize: 0.01 },
  CADJPY: { symbol: "CADJPY", name: "CAD / JPY", multiplier: 1000, type: "forex", pipSize: 0.01 },
  CHFJPY: { symbol: "CHFJPY", name: "CHF / JPY", multiplier: 1000, type: "forex", pipSize: 0.01 },
  NZDJPY: { symbol: "NZDJPY", name: "NZD / JPY", multiplier: 1000, type: "forex", pipSize: 0.01 },

  // Indices ($1 move = $1 profit/loss per 1.0 standard CFD lot)
  US30: { symbol: "US30", name: "Dow Jones 30", multiplier: 1, type: "index", pipSize: 1.0 },
  NAS100: { symbol: "NAS100", name: "Nasdaq 100", multiplier: 1, type: "index", pipSize: 1.0 },
  SPX500: { symbol: "SPX500", name: "S&P 500", multiplier: 1, type: "index", pipSize: 1.0 },
  GER40: { symbol: "GER40", name: "DAX 40", multiplier: 1, type: "index", pipSize: 1.0 },
  UK100: { symbol: "UK100", name: "FTSE 100", multiplier: 1, type: "index", pipSize: 1.0 },

  // Crypto ($1 move = $1 per 1.0 coin)
  BTCUSD: { symbol: "BTCUSD", name: "Bitcoin (BTC/USD)", multiplier: 1, type: "crypto", pipSize: 1.0 },
  BTC: { symbol: "BTC", name: "Bitcoin", multiplier: 1, type: "crypto", pipSize: 1.0 },
  ETHUSD: { symbol: "ETHUSD", name: "Ethereum (ETH/USD)", multiplier: 1, type: "crypto", pipSize: 0.1 },
  ETH: { symbol: "ETH", name: "Ethereum", multiplier: 1, type: "crypto", pipSize: 0.1 },
  SOLUSD: { symbol: "SOLUSD", name: "Solana", multiplier: 1, type: "crypto", pipSize: 0.01 },
};

export const MULTIPLIER_PRESETS = [
  { label: "Gold", multiplier: 100, hint: "$100/pt per lot (100 oz standard)" },
  { label: "Forex", multiplier: 100000, hint: "$100,000/pt per lot ($10/pip on majors)" },
  { label: "Forex JPY", multiplier: 1000, hint: "$1,000/pt per lot ($10/pip on JPY pairs)" },
  { label: "Crypto / Index", multiplier: 1, hint: "$1/pt per lot (US30, NAS100, BTC)" },
  { label: "Silver", multiplier: 5000, hint: "$5,000/pt per lot (5,000 oz standard)" },
];

export const DEFAULT_ACCOUNT_BALANCE = 50000;
export const BALANCE_PRESETS = [5000, 10000, 25000, 50000, 100000, 200000];
export const LOT_PRESETS = [0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.0];
export const RISK_PERCENT_PRESETS = [0.25, 0.5, 1.0, 1.5, 2.0];

/**
 * Returns the contract multiplier for an asset.
 * Multiplier = $ profit/loss per 1 point (1.00) move on a 1.0 standard lot.
 * @param {string} asset - Instrument symbol or name (e.g. "XAUUSD", "GOLD", "EURUSD", "Other")
 * @param {number|string} [entryPrice] - Trade entry price for price-based heuristics
 * @param {number} [overrideMultiplier] - Explicit user-defined or preset multiplier override
 * @returns {number} Multiplier ($ per 1.00 price move per 1.0 lot)
 */
export function getAssetMultiplier(asset, entryPrice, overrideMultiplier) {
  // If user or caller specified an explicit positive multiplier override, honor it directly
  const override = Number(overrideMultiplier);
  if (Number.isFinite(override) && override > 0) {
    return override;
  }

  const raw = (asset || "").trim().toUpperCase();
  const clean = raw.replace(/[^A-Z0-9]/g, "");

  // 1. Exact match in ASSET_SPECS dictionary
  if (ASSET_SPECS[clean]) {
    return ASSET_SPECS[clean].multiplier;
  }
  if (ASSET_SPECS[raw]) {
    return ASSET_SPECS[raw].multiplier;
  }

  // 2. Instrument pattern matching for common variations and aliases
  if (/XAU|GOLD/.test(clean)) {
    return 100;
  }
  if (/XAG|SILVER/.test(clean)) {
    return 5000;
  }
  if (/OIL|WTI|BRENT|CRUDE/.test(clean)) {
    return 100;
  }
  if (/JPY$/.test(clean) || clean.includes("JPY")) {
    return 1000;
  }

  // Major Forex pair: 6 uppercase characters matching standard currency codes
  const fxCurrencies = "EUR|GBP|USD|AUD|NZD|CAD|CHF";
  const fxPairRegex = new RegExp(`^(${fxCurrencies})(${fxCurrencies})$`);
  if (fxPairRegex.test(clean)) {
    return 100000;
  }

  // Common index & crypto shortcuts
  if (/^(US30|DJI|DOW|NAS100|USTEC|NASDAQ|NDX|SPX500|SPX|US500|GER40|DAX|BTC|ETH|SOL)/.test(clean)) {
    return 1;
  }

  // 3. Price-based heuristics fallback
  const p = Number(entryPrice);
  if (Number.isFinite(p) && p > 0) {
    // Gold spot price heuristic: typically $1,200 - $4,500/oz
    if (p >= 1200 && p <= 4500) {
      return 100;
    }
    // Major Forex exchange rates (EURUSD ~ 1.08, GBPUSD ~ 1.25, AUDUSD ~ 0.65)
    if (p < 10) {
      return 100000;
    }
    // JPY crosses (USDJPY ~ 155, EURJPY ~ 165)
    if (p >= 10 && p < 500) {
      return 1000;
    }
  }

  // Default fallback for CFDs, indices, crypto or custom assets
  return 1;
}

/**
 * Calculates stop loss distance in points.
 */
export function calculateStopDistance(entry, sl) {
  const e = Number(entry);
  const s = Number(sl);
  if (!Number.isFinite(e) || !Number.isFinite(s) || e <= 0 || s <= 0) return 0;
  return Math.abs(e - s);
}

/**
 * Calculates cash/dollar risk from SL distance, lot size, and asset.
 * Cash Risk = SL distance (pts) * multiplier ($/pt/lot) * lot size
 */
export function calculateCashRisk({ asset, entry, sl, lotSize, multiplier }) {
  const dist = calculateStopDistance(entry, sl);
  const lots = Number(lotSize);
  if (dist <= 0 || !Number.isFinite(lots) || lots <= 0) return 0;
  const mult = getAssetMultiplier(asset, entry, multiplier);
  return dist * mult * lots;
}

/**
 * Calculates risk % given SL, lot size, asset, and account balance.
 */
export function calculateRiskPercent({ asset, entry, sl, lotSize, balance, multiplier }) {
  const cashRisk = calculateCashRisk({ asset, entry, sl, lotSize, multiplier });
  const bal = Number(balance);
  if (cashRisk <= 0 || !Number.isFinite(bal) || bal <= 0) return null;
  const pct = (cashRisk / bal) * 100;
  return Number.isFinite(pct) ? Math.max(0.01, Number(pct.toFixed(2))) : null;
}

/**
 * Calculates lot size given SL, risk %, asset, and account balance.
 */
export function calculateLotSize({ asset, entry, sl, riskPercent, balance, multiplier }) {
  const dist = calculateStopDistance(entry, sl);
  const riskPct = Number(riskPercent);
  const bal = Number(balance);
  if (
    dist <= 0 ||
    !Number.isFinite(riskPct) ||
    riskPct <= 0 ||
    !Number.isFinite(bal) ||
    bal <= 0
  ) {
    return null;
  }
  const mult = getAssetMultiplier(asset, entry, multiplier);
  if (mult <= 0) return null;
  const dollarRisk = (bal * riskPct) / 100;
  const rawLots = dollarRisk / (dist * mult);
  if (!Number.isFinite(rawLots) || rawLots <= 0) return null;
  // Standard micro-lot precision: 0.01, min 0.01
  return Math.max(0.01, Math.round(rawLots * 100) / 100);
}
