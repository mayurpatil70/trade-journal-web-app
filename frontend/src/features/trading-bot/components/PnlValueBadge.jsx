import { memo } from "react";

function PnlValueBadge({ value, suffix = "", digits = 2 }) {
  if (value == null || Number.isNaN(Number(value))) return <span className="text-gray-500">-</span>;
  const n = Number(value);
  const tone = n > 0 ? "text-emerald-400 bg-emerald-500/10" : n < 0 ? "text-rose-400 bg-rose-500/10" : "text-gray-400 bg-white/5";
  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold tabular-nums ${tone}`}>
      {n > 0 ? "+" : ""}
      {n.toFixed(digits)}
      {suffix}
    </span>
  );
}

export default memo(PnlValueBadge);
