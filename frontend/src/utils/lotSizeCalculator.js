// frontend/src/utils/lotSizeCalculator.js

export const ASSET_SPECS = {
  XAUUSD: {
    symbol: "XAUUSD",
    name: "Gold (XAU/USD)",
    multiplier: 100, // $1 move on 1.0 lot = $100
    type: "commodity",
    pipSize: 0.1,
  },
  BTCUSD: {
    symbol: "BTCUSD",
    name: "Bitcoin (BTC/USD)",
    multiplier: 1, // $1 move on 1.0 lot = $1
    type: "crypto",
    pipSize: 1.0,
  },
  ETHUSD: {
    symbol: "ETHUSD",
    name: "Ethereum (ETH/USD)",
    multiplier: 1, // $1 move on 1.0 lot = $1
    type: "crypto",
    pipSize: 0.1,
  },
  XAGUSD: {
    symbol: "XAGUSD",
    name: "Silver (XAG/USD)",
    multiplier: 5000, // $1 move on 1.0 lot = $5,000
    type: "commodity",
    pipSize: 0.01,
  },
};

export const DEFAULT_ACCOUNT_BALANCE = 50000;
export const BALANCE_PRESETS = [5000, 10000, 25000, 50000, 100000, 200000];
export const LOT_PRESETS = [0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.0];
export const RISK_PERCENT_PRESETS = [0.25, 0.5, 1.0, 1.5, 2.0];

/**
 * Returns the contract multiplier for an asset.
 * Multiplier = $ profit/loss per 1 point (1.00) move on a 1.0 standard lot.
 */
export function getAssetMultiplier(asset, entryPrice) {
  const norm = (asset || "").toUpperCase().trim();
  if (ASSET_SPECS[norm]) {
    return ASSET_SPECS[norm].multiplier;
  }
  // Custom / Forex heuristics
  const p = Number(entryPrice);
  if (p > 0 && p < 10) {
    // Typical major Forex (EURUSD ~ 1.08, GBPUSD ~ 1.25)
    // 1 pip = 0.0001, pip value per std lot = $10 => $1 move = $100,000
    return 100000;
  }
  if (p >= 10 && p < 500) {
    // JPY pairs (USDJPY ~ 150)
    // 1 pip = 0.01, pip value per std lot ≈ $10 => $1 move = $1,000
    return 1000;
  }
  // Indices or general CFDs (US30, NAS100, etc.)
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
 */
export function calculateCashRisk({ asset, entry, sl, lotSize }) {
  const dist = calculateStopDistance(entry, sl);
  const lots = Number(lotSize);
  if (dist <= 0 || !Number.isFinite(lots) || lots <= 0) return 0;
  const mult = getAssetMultiplier(asset, entry);
  return dist * mult * lots;
}

/**
 * Calculates risk % given SL, lot size, asset, and account balance.
 */
export function calculateRiskPercent({ asset, entry, sl, lotSize, balance }) {
  const cashRisk = calculateCashRisk({ asset, entry, sl, lotSize });
  const bal = Number(balance);
  if (cashRisk <= 0 || !Number.isFinite(bal) || bal <= 0) return null;
  const pct = (cashRisk / bal) * 100;
  return Number.isFinite(pct) ? Math.max(0.01, Number(pct.toFixed(2))) : null;
}

/**
 * Calculates lot size given SL, risk %, asset, and account balance.
 */
export function calculateLotSize({ asset, entry, sl, riskPercent, balance }) {
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
  const mult = getAssetMultiplier(asset, entry);
  if (mult <= 0) return null;
  const dollarRisk = (bal * riskPct) / 100;
  const rawLots = dollarRisk / (dist * mult);
  if (!Number.isFinite(rawLots) || rawLots <= 0) return null;
  // Standard micro-lot precision: 0.01, min 0.01
  return Math.max(0.01, Math.round(rawLots * 100) / 100);
}
