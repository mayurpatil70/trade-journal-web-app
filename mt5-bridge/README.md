# MT5 Bridge

Runs next to your MetaTrader 5 terminal, sends OHLCV candles to the Trade Journal backend, and executes approved signals.

1. `pip install -r requirements.txt`
2. Open `/bot-hub/mt5` in the app, generate a bridge token, and choose symbols and timeframe.
3. Copy `config.example.json` to `config.json`, set `api_base` and `token`.
4. Keep MT5 open and logged in, then run `python bridge.py config.json`.

Default is paper mode: signals are only recorded. Orders are sent only when the mode is `live` and either auto execute is on or you approved the signal in the app.
Revoke the token in the app at any time to disconnect the bridge.
