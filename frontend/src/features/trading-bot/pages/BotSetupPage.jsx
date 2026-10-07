import { lazy, Suspense, useState } from "react";
import { getSymbolInfo } from "../services/symbolInfoCache";
import { useBotConfig } from "../hooks/useBotConfig";
import SymbolPicker from "../../../components/SymbolPicker";

const BulkOrderDrawer = lazy(() => import("../components/BulkOrderDrawer"));

const INITIAL = {
  name: "",
  symbol: "BTCUSDT",
  strategyType: "GRID",
  allocatedCapital: 100,
  maxActiveOrders: 3,
  takeProfitPercentage: 2,
  stopLossPercentage: 5,
  gridSpacingPercentage: 1,
  trailingPercentage: 0,
};

const Field = ({ label, ...props }) => (
  <label className="block text-xs text-gray-400">
    {label}
    <input {...props} className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50" />
  </label>
);

export default function BotSetupPage() {
  const { status, loading, create } = useBotConfig();
  const [form, setForm] = useState(INITIAL);
  const [info, setInfo] = useState(null);
  const [message, setMessage] = useState({ text: "", ok: false });
  const [busy, setBusy] = useState(false);
  const [drawer, setDrawer] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const checkSymbol = async (symbol) => {
    try {
      setInfo(await getSymbolInfo(symbol.toUpperCase().trim()));
    } catch {
      setInfo(null);
      setMessage({ text: "Symbol not found on Binance.", ok: false });
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const err = await create(form);
    setBusy(false);
    setMessage(err ? { text: err, ok: false } : { text: "Bot saved. Start it from the Trading Bot page.", ok: true });
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading configuration...</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <h1 className="text-xl font-semibold text-white">Bot Setup</h1>

      <section className="rounded-2xl border border-white/5 bg-[#111418] p-4 text-sm">
        <h2 className="mb-2 font-semibold text-gray-300">Exchange connection</h2>
        <p className="text-gray-400">Mode: <b className={status?.mode === "LIVE" ? "text-rose-400" : "text-sky-400"}>{status?.mode}</b></p>
        <p className="text-gray-400">API keys: <b className={status?.keysConfigured ? "text-emerald-400" : "text-amber-400"}>{status?.keysConfigured ? "configured on server" : "not configured"}</b></p>
        <p className="mt-2 text-xs text-gray-500">Keys are never entered or stored in the browser. Set BINANCE_API_KEY and BINANCE_API_SECRET in the server environment. Orders go to the Binance testnet unless BOT_ENABLE_LIVE=true.</p>
      </section>

      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-white/5 bg-[#111418] p-4">
        <h2 className="text-sm font-semibold text-gray-300">Pair and risk parameters</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name (optional)" value={form.name} onChange={set("name")} />
          <SymbolPicker label="Symbol" target="binance" value={form.symbol} onChange={(symbol) => { setForm((f) => ({ ...f, symbol })); setMessage({ text: "", ok: false }); checkSymbol(symbol); }} />
          <label className="block text-xs text-gray-400">
            Strategy
            <select value={form.strategyType} onChange={set("strategyType")} className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white">
              <option value="GRID">Grid (trailing take-profit)</option>
            </select>
          </label>
          <Field label="Allocated capital (quote)" type="number" min="1" value={form.allocatedCapital} onChange={set("allocatedCapital")} />
          <Field label="Max open orders" type="number" min="1" max="20" value={form.maxActiveOrders} onChange={set("maxActiveOrders")} />
          <Field label="Grid spacing %" type="number" step="0.1" value={form.gridSpacingPercentage} onChange={set("gridSpacingPercentage")} />
          <Field label="Take profit %" type="number" step="0.1" value={form.takeProfitPercentage} onChange={set("takeProfitPercentage")} />
          <Field label="Stop loss %" type="number" step="0.1" value={form.stopLossPercentage} onChange={set("stopLossPercentage")} />
          <Field label="Trailing stop % (0 = off)" type="number" step="0.1" value={form.trailingPercentage} onChange={set("trailingPercentage")} />
        </div>
        {info && (
          <p className="text-xs text-gray-500">
            {info.baseAsset}/{info.quoteAsset} · tick {info.tickSize} · step {info.stepSize} · min notional {info.minNotional}
          </p>
        )}
        {message.text && <p className={`text-sm ${message.ok ? "text-emerald-400" : "text-rose-400"}`}>{message.text}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">{busy ? "Saving..." : "Save bot"}</button>
          <button type="button" onClick={() => setDrawer(true)} className="rounded-lg bg-white/5 px-4 py-2 text-sm text-gray-300">Bulk create</button>
        </div>
      </form>

      <Suspense fallback={null}>
        <BulkOrderDrawer open={drawer} onClose={() => setDrawer(false)} onCreate={create} />
      </Suspense>
    </div>
  );
}
