import { memo } from "react";
import { useBinanceStream } from "../hooks/useBinanceStream";
import PnlValueBadge from "./PnlValueBadge";

const Row = memo(function Row({ symbol, tick }) {
  return (
    <div className="flex min-w-[150px] items-center justify-between gap-3 rounded-xl border border-white/5 bg-[#111418] px-3 py-2">
      <span className="text-xs font-semibold text-gray-300">{symbol}</span>
      <span className="text-right">
        <span className="block text-sm tabular-nums text-white">{tick ? tick.price.toLocaleString(undefined, { maximumFractionDigits: 6 }) : "..."}</span>
        {tick && <PnlValueBadge value={tick.changePct} suffix="%" />}
      </span>
    </div>
  );
});

function MarketDataTape({ symbols }) {
  const ticks = useBinanceStream(symbols);
  if (!symbols.length) return null;
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {symbols.map((s) => (
        <Row key={s} symbol={s} tick={ticks[s]} />
      ))}
    </div>
  );
}

export default memo(MarketDataTape);
