import json
import sys
import time

import MetaTrader5 as mt5
import requests

TF = {
    "M1": mt5.TIMEFRAME_M1, "M5": mt5.TIMEFRAME_M5, "M15": mt5.TIMEFRAME_M15, "M30": mt5.TIMEFRAME_M30,
    "H1": mt5.TIMEFRAME_H1, "H4": mt5.TIMEFRAME_H4, "D1": mt5.TIMEFRAME_D1,
}


def load_config(path):
    with open(path) as f:
        return json.load(f)


class Api:
    def __init__(self, base, token):
        self.base = base.rstrip("/")
        self.session = requests.Session()
        self.session.headers["Authorization"] = f"Bearer {token}"

    def get(self, path):
        r = self.session.get(f"{self.base}{path}", timeout=30)
        r.raise_for_status()
        return r.json()

    def post(self, path, body):
        r = self.session.post(f"{self.base}{path}", json=body, timeout=120)
        r.raise_for_status()
        return r.json()


def fetch_candles(symbol, timeframe, count):
    rates = mt5.copy_rates_from_pos(symbol, TF[timeframe], 0, count)
    if rates is None or len(rates) == 0:
        return None
    return [[int(r["time"]), float(r["open"]), float(r["high"]), float(r["low"]), float(r["close"]), float(r["tick_volume"])] for r in rates]


def lot_size(symbol, entry, sl, risk_pct):
    info = mt5.symbol_info(symbol)
    account = mt5.account_info()
    if info is None or account is None or info.trade_tick_size == 0:
        return None
    risk_money = account.balance * risk_pct / 100
    ticks = abs(entry - sl) / info.trade_tick_size
    loss_per_lot = ticks * info.trade_tick_value
    if loss_per_lot <= 0:
        return None
    step = info.volume_step
    lots = int(risk_money / loss_per_lot / step) * step
    return round(max(info.volume_min, min(lots, info.volume_max)), 2)


def execute(signal, cfg, risk_pct):
    symbol = signal["symbol"]
    mt5.symbol_select(symbol, True)
    tick = mt5.symbol_info_tick(symbol)
    if tick is None:
        return False, "no tick data"
    is_buy = signal["action"] == "BUY"
    volume = lot_size(symbol, signal["entry"], signal["sl"], risk_pct)
    if not volume:
        return False, "could not size position"
    request = {
        "action": mt5.TRADE_ACTION_DEAL,
        "symbol": symbol,
        "volume": volume,
        "type": mt5.ORDER_TYPE_BUY if is_buy else mt5.ORDER_TYPE_SELL,
        "price": tick.ask if is_buy else tick.bid,
        "sl": signal["sl"],
        "tp": signal["tp"],
        "deviation": cfg.get("deviation", 20),
        "magic": cfg.get("magic", 7001),
        "comment": "tj-bridge",
        "type_time": mt5.ORDER_TIME_GTC,
        "type_filling": mt5.ORDER_FILLING_IOC,
    }
    result = mt5.order_send(request)
    if result is None or result.retcode != mt5.TRADE_RETCODE_DONE:
        return False, f"order_send failed: {getattr(result, 'retcode', 'none')} {getattr(result, 'comment', '')}"
    return True, f"ticket {result.order}"


def report(api, signal_id, ok, message):
    api.post(f"/mt5/bridge/signals/{signal_id}/result", {"status": "executed" if ok else "failed", "message": message})


def cycle(api, cfg):
    remote = api.get("/mt5/bridge/config")
    live = remote["mode"] == "live"
    risk = remote["maxRiskPct"]

    for signal in remote["approved"]:
        ok, msg = execute(signal, cfg, risk)
        report(api, signal["id"], ok, msg)
        print(f"approved {signal['symbol']} {signal['action']}: {msg}")

    for symbol in remote["symbols"]:
        candles = fetch_candles(symbol, remote["timeframe"], cfg.get("candles", 200))
        if not candles:
            print(f"{symbol}: no candles")
            continue
        signal = api.post("/mt5/bridge/analyze", {"symbol": symbol, "timeframe": remote["timeframe"], "candles": candles})
        print(f"{symbol}: {signal['action']} {signal.get('reason', '')}")
        if signal["action"] != "NONE" and signal["executeNow"] and live:
            signal["symbol"] = symbol
            ok, msg = execute(signal, cfg, risk)
            report(api, signal["id"], ok, msg)
            print(f"  executed: {msg}")


def main():
    cfg = load_config(sys.argv[1] if len(sys.argv) > 1 else "config.json")
    if not mt5.initialize():
        sys.exit(f"MT5 initialize failed: {mt5.last_error()}")
    api = Api(cfg["api_base"], cfg["token"])
    try:
        while True:
            try:
                cycle(api, cfg)
            except Exception as err:
                print(f"cycle failed: {err}")
            time.sleep(cfg.get("poll_seconds", 60))
    finally:
        mt5.shutdown()


if __name__ == "__main__":
    main()
