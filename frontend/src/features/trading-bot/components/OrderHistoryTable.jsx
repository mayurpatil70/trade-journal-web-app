import { memo } from "react";
import PnlValueBadge from "./PnlValueBadge";

const STATUS_TONE = {
  FILLED: "text-emerald-400",
  NEW: "text-sky-400",
  PARTIALLY_FILLED: "text-amber-400",
  CANCELED: "text-gray-500",
  REJECTED: "text-rose-400",
};

const Row = memo(function Row({ order }) {
  return (
    <tr className="hover:bg-white/[0.02]">
      <td className="px-3 py-2 text-xs text-gray-500">{new Date(order.created_at).toLocaleString()}</td>
      <td className="px-3 py-2 font-semibold text-gray-200">{order.symbol}</td>
      <td className={`px-3 py-2 font-bold ${order.side === "BUY" ? "text-emerald-400" : "text-rose-400"}`}>{order.side}</td>
      <td className="px-3 py-2 tabular-nums">{Number(order.price)}</td>
      <td className="px-3 py-2 tabular-nums">{Number(order.quantity)}</td>
      <td className="px-3 py-2"><PnlValueBadge value={order.pnl} /></td>
      <td className={`px-3 py-2 text-xs ${STATUS_TONE[order.status] || "text-gray-400"}`}>{order.status}</td>
    </tr>
  );
});

function OrderHistoryTable({ data, page, totalPages, total, loading, error, onPageChange }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#111418] p-4">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="text-[10px] uppercase tracking-widest text-gray-500">
            <tr>
              {["Time", "Symbol", "Side", "Price", "Qty", "PnL", "Status"].map((h) => (
                <th key={h} className="px-3 py-2 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.map((o) => (
              <Row key={o.id} order={o} />
            ))}
          </tbody>
        </table>
        {!loading && !error && data.length === 0 && <p className="py-8 text-center text-sm text-gray-500">No orders yet.</p>}
        {error && <p className="py-4 text-center text-sm text-rose-400">{error}</p>}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3 text-xs text-gray-500">
        <span>{loading ? "Loading..." : `Page ${page} of ${totalPages} (${total} orders)`}</span>
        <div className="flex gap-1">
          <button disabled={page <= 1 || loading} onClick={() => onPageChange(page - 1)} className="rounded-md bg-white/5 px-3 py-1 hover:bg-white/10 disabled:opacity-40">Prev</button>
          <button disabled={page >= totalPages || loading} onClick={() => onPageChange(page + 1)} className="rounded-md bg-white/5 px-3 py-1 hover:bg-white/10 disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  );
}

export default memo(OrderHistoryTable);
