import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BotMetricsCard from "../components/BotMetricsCard";
import MarketDataTape from "../components/MarketDataTape";
import OrderHistoryTable from "../components/OrderHistoryTable";
import PnlValueBadge from "../components/PnlValueBadge";
import { useBotConfig } from "../hooks/useBotConfig";
import { usePaginatedOrders } from "../hooks/usePaginatedOrders";

export default function TradingBotDashboard() {
  const { configs, status, loading, error, toggle, remove } = useBotConfig();
  const [symbolFilter, setSymbolFilter] = useState("");
  const [actionError, setActionError] = useState("");
  const filters = useMemo(() => (symbolFilter ? { symbol: symbolFilter } : {}), [symbolFilter]);
  const orders = usePaginatedOrders({ pageSize: 10, filters });
  const symbols = useMemo(() => [...new Set(configs.map((c) => c.symbol))].slice(0, 10), [configs]);

  const act = async (fn) => setActionError(await fn());

  if (loading) return <div className="p-8 text-center text-gray-500">Loading bot dashboard...</div>;
  if (error) return <div className="p-8 text-center text-rose-400">{error}</div>;

  const stats = status?.stats;
  const live = status?.mode === "LIVE";

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-white">Trading Bot</h1>
        <span className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${live ? "bg-rose-500/10 text-rose-400" : "bg-sky-500/10 text-sky-400"}`}>{status?.mode}</span>
      </div>

      {!status?.keysConfigured && (
        <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-300">
          Binance API keys are not configured on the server. See <Link to="/setup" className="underline">Bot Setup</Link>.
        </p>
      )}
      {actionError && <p className="text-sm text-rose-400">{actionError}</p>}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <BotMetricsCard label="Active bots" value={status?.activeBots ?? 0} hint={`${configs.length} configured`} />
        <BotMetricsCard label="Closed trades" value={stats?.closedTrades ?? 0} />
        <BotMetricsCard label="Win rate" value={`${((stats?.winRate ?? 0) * 100).toFixed(0)}%`} />
        <BotMetricsCard label="Total PnL" value={<PnlValueBadge value={stats?.totalPnl ?? 0} />} />
      </div>

      <MarketDataTape symbols={symbols} />

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-300">Bots</h2>
        {configs.length === 0 && <p className="text-sm text-gray-500">No bots yet. Create one in <Link to="/setup" className="underline">Bot Setup</Link>.</p>}
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
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-300">Order history</h2>
          <select value={symbolFilter} onChange={(e) => setSymbolFilter(e.target.value)} className="rounded-lg border border-white/10 bg-[#0a0a0a] px-2 py-1 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-cyan-500/50">
            <option className="bg-[#0a0a0a] text-gray-300" value="">All symbols</option>
            {symbols.map((s) => <option className="bg-[#0a0a0a] text-gray-300" key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <OrderHistoryTable {...orders} onPageChange={orders.setPage} />
      </section>
    </div>
  );
}
