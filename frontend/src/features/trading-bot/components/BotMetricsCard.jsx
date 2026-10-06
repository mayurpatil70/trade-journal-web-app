import { memo } from "react";

function BotMetricsCard({ label, value, hint, tone = "text-white" }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#111418] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tabular-nums ${tone}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

export default memo(BotMetricsCard);
