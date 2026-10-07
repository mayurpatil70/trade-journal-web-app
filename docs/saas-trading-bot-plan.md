# Architecture Guide: SaaS Trading Bot & MT5 Vision Bot

This document outlines the high-level steps required to implement the two features requested: allowing multiple users to connect their own exchange accounts, and building an MT5 bot that uses AI to analyze charts.

## 1. Multi-User (SaaS) Trading Bot Architecture

Currently, the bot uses a single API key from the `.env` file. To let other users run the bot on their own Binance accounts, the system must become a Multi-Tenant System.

### Phase 1: Database Updates (Supabase)
Create a `user_api_keys` table linked to the user's ID.
- `id` (Primary Key)
- `user_id` (Foreign Key -> Users table)
- `exchange` (e.g. `'binance'`)
- `api_key` (Text)
- `api_secret` (Text - MUST BE ENCRYPTED)

### Phase 2: Security & Encryption (CRITICAL)
Never store API secrets in plain text. If the database is compromised, attackers could drain users' funds.
- Use the Node.js `crypto` module to encrypt the `api_secret` before saving it.
- Store a master `ENCRYPTION_KEY` in the backend `.env` to handle encryption/decryption.

### Phase 3: Frontend UI
- Create an "Exchange Connections" / "API Keys" page in the React frontend.
- Add a secure form where users input their Binance API Key and Secret.
- Send this data over HTTPS to the backend to be encrypted and stored.

### Phase 4: Backend Execution Logic
- **Dynamic key loading:** when a trade signal triggers for a user, the backend queries the database, decrypts that user's `api_secret`, and initializes a Binance client instance just for them.
- **Remove `.env` reliance:** `process.env.BINANCE_API_KEY` is no longer used for user trades. The `.env` keys are only used for a "master account" or testing.

## 2. MT5 AI Vision Trading Bot

A bot that "looks" at a chart and trades on the analysis combines trading APIs with large AI models.

1. **Set up Python & MetaTrader 5.** Install Python on the machine running MT5, `pip install MetaTrader5`, and connect with `mt5.initialize()`.
2. **Chart capture (the "eyes").** Take screenshots of the MT5 window, or pull raw OHLCV with `mt5.copy_rates_from_pos()` and (optionally) draw a chart image in memory.
3. **AI analysis (the "brain").** Send the chart to an AI API with a detailed prompt, e.g. an SMC (Smart Money Concepts) expert that identifies Order Blocks and Fair Value Gaps and replies ONLY with `{"action": "BUY", "entry": 1.050, "sl": 1.045, "tp": 1.060}` or `{"action": "NONE"}`.
4. **Trade execution (the "hands").** The Python script parses the JSON; for BUY/SELL it builds an order and calls `mt5.order_send()`.

### Should you implement these? (Market demand)
- **SaaS Binance bot:** high demand, but high liability since you are responsible for keeping users' keys safe.
- **MT5 vision bot:** cutting-edge but experimental. Vision models are not always accurate at reading exact price levels from an image. A safer, more reliable method is feeding the AI raw numerical data (JSON arrays of candlestick prices) rather than images.

---

## Implementation status

The existing `/setup` and `/trading-bot` routes and their `/api/bot` backend are unchanged in behavior. The plan is implemented on new routes so it can be tested side by side.

| Plan item | Where |
| --- | --- |
| Phase 1: `user_api_keys` (+ hub bot tables, MT5 tables) | `backend/migrations/003_bot_hub.sql` (not run automatically) |
| Phase 2: AES-256-GCM encryption with `ENCRYPTION_KEY` (64 hex chars or base64 of 32 bytes; fails closed if missing) | `backend/bot-hub/crypto.js` |
| Phase 3: Exchange Connections UI | `/bot-hub/connections` |
| Phase 4: per-user keys decrypted on demand, per-user Binance client (60s cache), per-user bots, orders and logs scoped by the auth token user and paginated | `backend/bot-hub/*`, API at `/api/bot-hub` |
| MT5 bot (numerical OHLCV, no images) | `mt5-bridge/` (Python) + `/api/bot-hub/mt5/*` + UI at `/bot-hub/mt5` |

Design choices:
- The existing engine is reused: `trading-bot/engine.js`, `store.js` and `binanceClient.js` now accept an injected client and tables; defaults keep the old behavior. Hub bots live in separate `hub_bot_*` tables so the original engine never trades them with `.env` keys.
- Any logged-in user can use their own bots. Secrets are never returned (only a masked key) and never logged.
- New connections are testnet. Live needs an explicit per-user opt-in (type `ENABLE LIVE`); switching mode or deleting the connection stops that user's bots.
- MT5 signals reuse the Coach NVIDIA NIM client and keys (`NVIDIA_API_KEY`). Replies are validated strictly (schema, SL/TP on the correct side, entry near market, stop width, minimum reward:risk); anything invalid or unparseable becomes `NONE`.
- The bridge authenticates with a generated token stored only as a SHA-256 hash. Default mode is paper (signals recorded only). Orders are sent only in live mode, either after you approve a signal in the UI or if auto-execute is enabled.
- Chart images are not sent; the guide recommends numerical data and the API body limit is small.

Setup: set `ENCRYPTION_KEY` (e.g. `openssl rand -hex 32`), run migration 003 in Supabase, then run the bridge as described in `mt5-bridge/README.md`.
