import { useState } from "react";
import { Link } from "react-router-dom";
import BotMetricsCard from "../../trading-bot/components/BotMetricsCard";
import OrderHistoryTable from "../../trading-bot/components/OrderHistoryTable";
import PnlValueBadge from "../../trading-bot/components/PnlValueBadge";
import { useHubBots } from "../hooks/useHubBots";
import { usePaged } from "../hooks/usePaged";
import { hubApi } from "../services/hubApi";
import SymbolPicker from "../../../components/SymbolPicker";

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
    <input {...props} className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50" />
  </label>
);

export default function BotHubPage() {
  const { configs, status, loading, error, create, toggle, remove } = useHubBots();
  const orders = usePaged(hubApi.orders);
  const [form, setForm] = useState(INITIAL);
  const [message, setMessage] = useState({ text: "", ok: false });
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const act = async (fn) => {
    const err = await fn();
    setMessage({ text: err, ok: false });
    orders.reload();
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const err = await create(form);
    setBusy(false);
    setMessage(err ? { text: err, ok: false } : { text: "Bot saved.", ok: true });
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Bot Hub...</div>;
  if (error) return <div className="p-8 text-center text-rose-400">{error}</div>;

  const live = status?.mode === "LIVE";
  const stats = status?.stats;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-white">Bot Hub</h1>
        <div className="flex items-center gap-2 text-xs">
          <Link to="/bot-hub/connections" className="rounded-lg bg-white/5 px-3 py-1.5 text-gray-300">Connections</Link>
          <Link to="/bot-hub/mt5" className="rounded-lg bg-white/5 px-3 py-1.5 text-gray-300">MT5 AI Bot</Link>
          {status?.mode && (
            <span className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${live ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"}`}>{status.mode}</span>
          )}
        </div>
      </div>

      {!status?.connected && (
        <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-300">
          No exchange connected. Add your Binance API keys in <Link to="/bot-hub/connections" className="underline">Connections</Link> to start bots.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <BotMetricsCard label="Active bots" value={status?.activeBots ?? 0} hint={`${configs.length} configured`} />
        <BotMetricsCard label="Closed trades" value={stats?.closedTrades ?? 0} />
        <BotMetricsCard label="Win rate" value={`${((stats?.winRate ?? 0) * 100).toFixed(0)}%`} />
        <BotMetricsCard label="Total PnL" value={<PnlValueBadge value={stats?.totalPnl ?? 0} />} />
      </div>

      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-white/5 bg-[#111418] p-4">
        <h2 className="text-sm font-semibold text-gray-300">New bot</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Name (optional)" value={form.name} onChange={set("name")} />
          <SymbolPicker label="Symbol" target="binance" value={form.symbol} onChange={(symbol) => setForm((f) => ({ ...f, symbol }))} />
          <Field label="Allocated capital (quote)" type="number" min="1" value={form.allocatedCapital} onChange={set("allocatedCapital")} />
          <Field label="Max open orders" type="number" min="1" max="20" value={form.maxActiveOrders} onChange={set("maxActiveOrders")} />
          <Field label="Grid spacing %" type="number" step="0.1" value={form.gridSpacingPercentage} onChange={set("gridSpacingPercentage")} />
          <Field label="Take profit %" type="number" step="0.1" value={form.takeProfitPercentage} onChange={set("takeProfitPercentage")} />
          <Field label="Stop loss %" type="number" step="0.1" value={form.stopLossPercentage} onChange={set("stopLossPercentage")} />
          <Field label="Trailing stop % (0 = off)" type="number" step="0.1" value={form.trailingPercentage} onChange={set("trailingPercentage")} />
        </div>
        {message.text && <p className={`text-sm ${message.ok ? "text-emerald-400" : "text-rose-400"}`}>{message.text}</p>}
        <button type="submit" disabled={busy} className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">{busy ? "Saving..." : "Save bot"}</button>
      </form>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-300">Your bots</h2>
        {configs.length === 0 && <p className="text-sm text-gray-500">No bots yet.</p>}
        {configs.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/5 bg-[#111418] p-4">
            <div>
              <p className="font-semibold text-white">{c.name}</p>
              <p className="text-xs text-gray-500">
                {c.symbol} · {c.strategy_type} · TP {c.params.takeProfitPercentage}% · SL {c.params.stopLossPercentage}% · {c.params.maxActiveOrders} orders
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => act(() => toggle(c.id, !c.is_active))} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${c.is_active ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                {c.is_active ? "Pause" : "Start"}
              </button>
              <button disabled={c.is_active} onClick={() => act(() => remove(c.id))} className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-gray-400 disabled:opacity-40">Delete</button>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-300">Order history</h2>
        <OrderHistoryTable {...orders} onPageChange={orders.setPage} />
      </section>
    </div>
  );
}
