import { useEffect, useRef, useState } from "react";

const FLUSH_MS = 500;

export function useBinanceStream(symbols) {
  const [ticks, setTicks] = useState({});
  const buffer = useRef({});
  const key = symbols.join(",");

  useEffect(() => {
    if (!key) return undefined;
    const streams = key.split(",").map((s) => `${s.toLowerCase()}@miniTicker`).join("/");
    const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);

    ws.onmessage = (event) => {
      try {
        const d = JSON.parse(event.data).data;
        if (!d?.c) return;
        const open = Number(d.o);
        const price = Number(d.c);
        buffer.current[d.s] = { price, changePct: open ? ((price - open) / open) * 100 : 0 };
      } catch {
        /* ignore malformed frame */
      }
    };

    const timer = setInterval(() => {
      if (!Object.keys(buffer.current).length) return;
      const next = buffer.current;
      buffer.current = {};
      setTicks((prev) => ({ ...prev, ...next }));
    }, FLUSH_MS);

    return () => {
      clearInterval(timer);
      ws.close();
    };
  }, [key]);

  return ticks;
}
