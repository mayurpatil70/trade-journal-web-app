export const ASSET_CLASSES = ["crypto", "forex", "indices", "futures"];

const FOREX_PAIRS = [
  "EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "USDCAD", "NZDUSD",
  "EURGBP", "EURJPY", "EURCHF", "EURAUD", "EURCAD", "EURNZD",
  "GBPJPY", "GBPCHF", "GBPAUD", "GBPCAD", "GBPNZD",
  "AUDJPY", "AUDCAD", "AUDCHF", "AUDNZD", "CADJPY", "CADCHF", "CHFJPY", "NZDJPY", "NZDCAD", "NZDCHF",
  "USDMXN", "USDZAR", "USDSGD", "USDNOK", "USDSEK", "USDTRY", "USDINR",
];

const INDICES = [
  ["US30", "Dow Jones 30", "^DJI"],
  ["NAS100", "Nasdaq 100", "^NDX"],
  ["SPX500", "S&P 500", "^GSPC"],
  ["US2000", "Russell 2000", "^RUT"],
  ["GER40", "DAX 40", "^GDAXI"],
  ["UK100", "FTSE 100", "^FTSE"],
  ["FRA40", "CAC 40", "^FCHI"],
  ["EU50", "Euro Stoxx 50", "^STOXX50E"],
  ["JP225", "Nikkei 225", "^N225"],
  ["HK50", "Hang Seng", "^HSI"],
  ["AUS200", "ASX 200", "^AXJO"],
  ["INDIA50", "Nifty 50", "^NSEI"],
  ["SENSEX", "BSE Sensex", "^BSESN"],
  ["BANKNIFTY", "Nifty Bank", "^NSEBANK"],
  ["VIX", "Volatility Index", "^VIX"],
  ["DXY", "US Dollar Index", "DX-Y.NYB"],
];

const FUTURES = [
  ["XAUUSD", "Gold", "GC=F"],
  ["XAGUSD", "Silver", "SI=F"],
  ["XPTUSD", "Platinum", "PL=F"],
  ["XCUUSD", "Copper", "HG=F"],
  ["USOIL", "WTI Crude Oil", "CL=F"],
  ["UKOIL", "Brent Crude Oil", "BZ=F"],
  ["NATGAS", "Natural Gas", "NG=F"],
  ["ES", "E-mini S&P 500", "ES=F"],
  ["NQ", "E-mini Nasdaq 100", "NQ=F"],
  ["YM", "E-mini Dow", "YM=F"],
  ["RTY", "E-mini Russell 2000", "RTY=F"],
  ["ZB", "US 30Y T-Bond", "ZB=F"],
  ["ZN", "US 10Y T-Note", "ZN=F"],
  ["ZC", "Corn", "ZC=F"],
  ["ZW", "Wheat", "ZW=F"],
  ["ZS", "Soybeans", "ZS=F"],
  ["KC", "Coffee", "KC=F"],
  ["SB", "Sugar", "SB=F"],
  ["CC", "Cocoa", "CC=F"],
  ["6E", "Euro FX Futures", "6E=F"],
  ["6B", "British Pound Futures", "6B=F"],
  ["6J", "Japanese Yen Futures", "6J=F"],
];

const NOT_BINANCE = "Binance bots trade crypto spot pairs only. Use the MT5 bot for this market.";

function nonCrypto(symbol, name, assetClass, yahoo) {
  return {
    symbol,
    name,
    assetClass,
    yahoo,
    chart: true,
    executable: { binance: false, mt5: true },
    reason: NOT_BINANCE,
  };
}

export const STATIC_CATALOG = [
  ...FOREX_PAIRS.map((p) => nonCrypto(p, `${p.slice(0, 3)}/${p.slice(3)}`, "forex", `${p}=X`)),
  ...INDICES.map(([s, n, y]) => nonCrypto(s, n, "indices", y)),
  ...FUTURES.map(([s, n, y]) => nonCrypto(s, n, "futures", y)),
];

const QUOTES = ["USDT", "USDC", "BTC", "ETH", "BNB"];
const QUOTE_RANK = Object.fromEntries(QUOTES.map((q, i) => [q, i]));

export function buildCryptoEntries(exchangeInfo) {
  const symbols = exchangeInfo?.symbols ?? [];
  return symbols
    .filter((s) => s.status === "TRADING" && s.isSpotTradingAllowed !== false && QUOTE_RANK[s.quoteAsset] !== undefined)
    .map((s) => ({
      symbol: s.symbol,
      name: `${s.baseAsset}/${s.quoteAsset}`,
      assetClass: "crypto",
      baseAsset: s.baseAsset,
      quoteAsset: s.quoteAsset,
      chart: true,
      executable: { binance: true, mt5: false },
    }))
    .sort((a, b) => QUOTE_RANK[a.quoteAsset] - QUOTE_RANK[b.quoteAsset] || a.symbol.localeCompare(b.symbol));
}

const norm = (v) => String(v ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");

export function searchSymbols(list, { assetClass, q, page = 1, limit = 50 } = {}) {
  const query = norm(q);
  const pageSize = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const filtered = list.filter(
    (e) =>
      (!assetClass || e.assetClass === assetClass) &&
      (!query || norm(e.symbol).includes(query) || norm(e.name).includes(query)),
  );
  if (query) {
    const rank = (e) => (norm(e.symbol) === query ? 0 : norm(e.symbol).startsWith(query) ? 1 : 2);
    filtered.sort((a, b) => rank(a) - rank(b));
  }
  const pageNo = Math.max(Number(page) || 1, 1);
  const start = (pageNo - 1) * pageSize;
  return {
    data: filtered.slice(start, start + pageSize),
    page: pageNo,
    limit: pageSize,
    total: filtered.length,
    hasMore: start + pageSize < filtered.length,
  };
}

export function findSymbol(list, symbol) {
  const key = norm(symbol);
  return list.find((e) => norm(e.symbol) === key) ?? null;
}
