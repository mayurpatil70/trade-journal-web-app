import { useState } from "react";
import { getSymbolInfo } from "../services/symbolInfoCache";

const EMPTY = { symbols: "", allocatedCapital: 100, takeProfitPercentage: 2, stopLossPercentage: 5, maxActiveOrders: 3, gridSpacingPercentage: 1 };

const Field = ({ label, ...props }) => (
  <label className="block text-xs text-gray-400">
    {label}
    <input {...props} className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50" />
  </label>
);

export default function BulkOrderDrawer({ open, onClose, onCreate }) {
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  if (!open) return null;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const symbols = [...new Set(form.symbols.split(/[\s,]+/).map((s) => s.toUpperCase()).filter(Boolean))].slice(0, 10);
    if (!symbols.length) return setMessage("Enter at least one symbol.");
    setBusy(true);
    const failures = [];
    for (const symbol of symbols) {
      try {
        await getSymbolInfo(symbol);
      } catch {
        failures.push(`${symbol}: not listed on Binance`);
        continue;
      }
      const err = await onCreate({ ...form, symbol, strategyType: "GRID" });
      if (err) failures.push(`${symbol}: ${err}`);
    }
    setBusy(false);
    setMessage(failures.length ? failures.join(" | ") : "");
    if (!failures.length) {
      setForm(EMPTY);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="h-full w-full max-w-md space-y-4 overflow-y-auto border-l border-white/10 bg-[#111418] p-6">
        <h2 className="text-lg font-semibold text-white">Bulk create grid bots</h2>
        <Field label="Symbols (comma separated, max 10)" value={form.symbols} onChange={set("symbols")} placeholder="BTCUSDT, ETHUSDT" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Capital per bot (quote)" type="number" min="1" value={form.allocatedCapital} onChange={set("allocatedCapital")} />
          <Field label="Max open orders" type="number" min="1" max="20" value={form.maxActiveOrders} onChange={set("maxActiveOrders")} />
          <Field label="Take profit %" type="number" step="0.1" value={form.takeProfitPercentage} onChange={set("takeProfitPercentage")} />
          <Field label="Stop loss %" type="number" step="0.1" value={form.stopLossPercentage} onChange={set("stopLossPercentage")} />
          <Field label="Grid spacing %" type="number" step="0.1" value={form.gridSpacingPercentage} onChange={set("gridSpacingPercentage")} />
        </div>
        {message && <p className="text-xs text-rose-400">{message}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="flex-1 rounded-lg bg-emerald-500 py-2 text-sm font-semibold text-black disabled:opacity-50">{busy ? "Creating..." : "Create bots"}</button>
          <button type="button" onClick={onClose} className="rounded-lg bg-white/5 px-4 py-2 text-sm text-gray-300">Cancel</button>
        </div>
      </form>
    </div>
  );
}
