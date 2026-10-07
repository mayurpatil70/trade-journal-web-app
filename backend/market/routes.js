import express from "express";
import axios from "axios";
import { requireAuth } from "../middlewares/requireAuth.js";
import { ASSET_CLASSES, STATIC_CATALOG, buildCryptoEntries, searchSymbols, findSymbol } from "./symbolCatalog.js";
import { TIMEFRAMES, getCandles } from "./candles.js";

const router = express.Router();
router.use(requireAuth);

const CRYPTO_TTL_MS = 6 * 3600_000;
let cryptoCache = { entries: [], expires: 0 };
let cryptoInflight = null;

async function loadCrypto() {
  if (cryptoCache.expires > Date.now()) return cryptoCache.entries;
  cryptoInflight ??= (async () => {
    try {
      let data;
      for (const host of ["https://data-api.binance.vision", "https://api.binance.com"]) {
        try {
          ({ data } = await axios.get(`${host}/api/v3/exchangeInfo`, { timeout: 15000 }));
          break;
        } catch (err) {
          if (host.includes("api.binance.com")) throw err;
        }
      }
      cryptoCache = { entries: buildCryptoEntries(data), expires: Date.now() + CRYPTO_TTL_MS };
    } catch (err) {
      console.warn("[Market] crypto symbol list failed:", err.message);
      if (!cryptoCache.entries.length) throw err;
    } finally {
      cryptoInflight = null;
    }
    return cryptoCache.entries;
  })();
  return cryptoInflight;
}

async function fullCatalog() {
  return [...(await loadCrypto().catch(() => [])), ...STATIC_CATALOG];
}

router.get("/symbols", async (req, res) => {
  const assetClass = ASSET_CLASSES.includes(req.query.class) ? req.query.class : undefined;
  const list = assetClass === "crypto" ? await loadCrypto().catch(() => []) : assetClass ? STATIC_CATALOG : await fullCatalog();
  const result = searchSymbols(list, { assetClass, q: req.query.q, page: req.query.page, limit: req.query.limit });
  res.json({ ...result, assetClasses: ASSET_CLASSES, cryptoAvailable: cryptoCache.entries.length > 0 });
});

router.get("/candles", async (req, res) => {
  const tf = String(req.query.tf || "1h");
  if (!TIMEFRAMES.includes(tf)) return res.status(400).json({ error: `tf must be one of ${TIMEFRAMES.join(", ")}` });
  const symbol = String(req.query.symbol || "");
  const entry = findSymbol(await fullCatalog(), symbol);
  if (!entry) return res.status(404).json({ error: `Unknown symbol ${symbol}` });
  try {
    const candles = await getCandles(entry, tf, { limit: req.query.limit, to: req.query.to });
    if (!candles.length) return res.status(404).json({ error: "No candles available for this symbol and timeframe." });
    res.json({ symbol: entry.symbol, name: entry.name, assetClass: entry.assetClass, tf, candles });
  } catch (err) {
    console.error("[Market] candles failed:", err.message);
    res.status(502).json({ error: "Market data provider is unavailable. Try again shortly." });
  }
});

export default router;
