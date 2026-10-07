import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { hubApi, errorMessage } from "../services/hubApi";
import { usePaged } from "../hooks/usePaged";
import SymbolPicker from "../../../components/SymbolPicker";

const TIMEFRAMES = ["M1", "M5", "M15", "M30", "H1", "H4", "D1"];
const TONE = { pending: "text-amber-400", approved: "text-sky-400", executed: "text-emerald-400", failed: "text-rose-400", rejected: "text-gray-500", none: "text-gray-500" };
const input = "mt-1 w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50";

function SignalsTable({ onDecide }) {
  const s = usePaged(hubApi.mt5Signals);
  const decide = async (id, action) => {
    await onDecide(id, action);
    s.reload();
  };
  return (
    <div className="rounded-2xl border border-white/5 bg-[#111418] p-4">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="text-[10px] uppercase tracking-widest text-gray-500">
            <tr>{["Time", "Symbol", "TF", "Action", "Entry", "SL", "TP", "Status", ""].map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {s.data.map((x) => (
              <tr key={x.id}>
                <td className="px-3 py-2 text-xs text-gray-500">{new Date(x.created_at).toLocaleString()}</td>
                <td className="px-3 py-2 font-semibold text-gray-200">{x.symbol}</td>
                <td className="px-3 py-2 text-xs">{x.timeframe}</td>
                <td className={`px-3 py-2 font-bold ${x.action === "BUY" ? "text-emerald-400" : x.action === "SELL" ? "text-rose-400" : "text-gray-500"}`}>{x.action}</td>
                <td className="px-3 py-2 tabular-nums">{x.entry ?? "-"}</td>
                <td className="px-3 py-2 tabular-nums">{x.sl ?? "-"}</td>
                <td className="px-3 py-2 tabular-nums">{x.tp ?? "-"}</td>
                <td className={`px-3 py-2 text-xs ${TONE[x.status] || ""}`} title={x.reason || ""}>{x.status}</td>
                <td className="px-3 py-2 text-xs">
                  {x.status === "pending" && (
                    <span className="flex gap-1">
                      <button onClick={() => decide(x.id, "approve")} className="rounded bg-emerald-500/10 px-2 py-1 text-emerald-400">Approve</button>
                      <button onClick={() => decide(x.id, "reject")} className="rounded bg-white/5 px-2 py-1 text-gray-400">Reject</button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!s.loading && !s.error && s.data.length === 0 && <p className="py-8 text-center text-sm text-gray-500">No signals yet.</p>}
        {s.error && <p className="py-4 text-center text-sm text-rose-400">{s.error}</p>}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3 text-xs text-gray-500">
        <span>{s.loading ? "Loading..." : `Page ${s.page} of ${s.totalPages} (${s.total} signals)`}</span>
        <div className="flex gap-1">
          <button disabled={s.page <= 1 || s.loading} onClick={() => s.setPage(s.page - 1)} className="rounded-md bg-white/5 px-3 py-1 disabled:opacity-40">Prev</button>
          <button disabled={s.page >= s.totalPages || s.loading} onClick={() => s.setPage(s.page + 1)} className="rounded-md bg-white/5 px-3 py-1 disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  );
}

export default function Mt5BotPage() {
  const [bridge, setBridge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState({ text: "", ok: false });

  const load = useCallback(async () => {
    try {
      const { bridge: b } = await hubApi.mt5Status();
      setBridge(b);
      if (b) setForm({ mode: b.mode, autoExecute: b.autoExecute, timeframe: b.timeframe, maxRiskPct: b.maxRiskPct, minRr: b.minRr, symbols: b.symbols.join(", ") });
    } catch (e) {
      setMessage({ text: errorMessage(e), ok: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 0);
    const poll = setInterval(load, 30000);
    return () => {
      clearTimeout(t);
      clearInterval(poll);
    };
  }, [load]);

  const run = async (fn, okText) => {
    try {
      await fn();
      setMessage({ text: okText, ok: true });
    } catch (e) {
      setMessage({ text: errorMessage(e), ok: false });
    }
    await load();
  };

  const generate = async () => {
    try {
      const r = await hubApi.mt5Token();
      setToken(r.token);
      setMessage({ text: "", ok: true });
    } catch (e) {
      setMessage({ text: errorMessage(e), ok: false });
    }
    await load();
  };

  const saveSettings = (e) => {
    e.preventDefault();
    const symbols = form.symbols.split(",").map((s) => s.trim()).filter(Boolean);
    return run(() => hubApi.mt5Settings({ ...form, symbols }), "Settings saved.");
  };

  const decide = (id, action) => run(() => hubApi.mt5Decide(id, action), action === "approve" ? "Signal approved. The bridge will execute it in live mode." : "Signal rejected.");

  if (loading) return <div className="p-8 text-center text-gray-500">Loading MT5 bot...</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">MT5 AI Bot</h1>
        <Link to="/bot-hub" className="text-xs text-gray-400 underline">Back to Bot Hub</Link>
      </div>

      <section className="space-y-3 rounded-2xl border border-white/5 bg-[#111418] p-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold text-gray-300">Bridge</h2>
            <p className="text-xs text-gray-500">
              {bridge ? (
                <>Token {bridge.tokenPrefix}… · <b className={bridge.online ? "text-emerald-400" : "text-gray-400"}>{bridge.online ? "online" : "offline"}</b>{bridge.lastSeenAt ? ` · last seen ${new Date(bridge.lastSeenAt).toLocaleString()}` : ""}</>
              ) : (
                "No bridge connected yet."
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={generate} className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-black">{bridge ? "Regenerate token" : "Generate token"}</button>
            {bridge && <button onClick={() => run(async () => { await hubApi.mt5Revoke(); setToken(""); setForm(null); }, "Bridge disconnected.")} className="rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs text-rose-400">Revoke</button>}
          </div>
        </div>
        {token && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="text-xs text-amber-300">Copy this token now. It is shown once and stored only as a hash.</p>
            <code className="mt-1 block break-all text-xs text-white">{token}</code>
          </div>
        )}
        <p className="text-xs text-gray-500">Run <code>mt5-bridge/bridge.py</code> next to your MetaTrader 5 terminal. It sends candle data to the AI and executes only approved signals in live mode.</p>
      </section>

      {bridge && form && (
        <form onSubmit={saveSettings} className="space-y-3 rounded-2xl border border-white/5 bg-[#111418] p-4">
          <h2 className="text-sm font-semibold text-gray-300">Settings</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-xs text-gray-400">Mode
              <select value={form.mode} onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value, autoExecute: e.target.value === "live" ? f.autoExecute : false }))} className={input}>
                <option value="paper">Paper (record only)</option>
                <option value="live">Live (send orders)</option>
              </select>
            </label>
            <label className="block text-xs text-gray-400">Timeframe
              <select value={form.timeframe} onChange={(e) => setForm((f) => ({ ...f, timeframe: e.target.value }))} className={input}>
                {TIMEFRAMES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label className="block text-xs text-gray-400">Symbols (comma separated)
              <input value={form.symbols} onChange={(e) => setForm((f) => ({ ...f, symbols: e.target.value }))} placeholder="EURUSD, XAUUSD" className={input} />
            </label>
            <SymbolPicker label="Add from list" target="mt5" value="" onChange={(symbol) => setForm((f) => ({ ...f, symbols: [...new Set([...f.symbols.split(",").map((x) => x.trim()).filter(Boolean), symbol])].join(", ") }))} />
            <label className="block text-xs text-gray-400">Risk per trade %
              <input type="number" step="0.1" min="0.1" max="5" value={form.maxRiskPct} onChange={(e) => setForm((f) => ({ ...f, maxRiskPct: e.target.value }))} className={input} />
            </label>
            <label className="block text-xs text-gray-400">Minimum reward:risk
              <input type="number" step="0.1" min="0.5" max="10" value={form.minRr} onChange={(e) => setForm((f) => ({ ...f, minRr: e.target.value }))} className={input} />
            </label>
            <label className="flex items-center gap-2 pt-5 text-xs text-gray-400">
              <input type="checkbox" disabled={form.mode !== "live"} checked={form.autoExecute} onChange={(e) => setForm((f) => ({ ...f, autoExecute: e.target.checked }))} />
              Auto-execute valid signals (live only)
            </label>
          </div>
          {form.autoExecute && <p className="text-xs text-rose-400">Auto-execute places real orders without asking you. Test in paper mode first.</p>}
          {message.text && <p className={`text-sm ${message.ok ? "text-emerald-400" : "text-rose-400"}`}>{message.text}</p>}
          <button type="submit" className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-black">Save settings</button>
        </form>
      )}
      {(!bridge || !form) && message.text && <p className={`text-sm ${message.ok ? "text-emerald-400" : "text-rose-400"}`}>{message.text}</p>}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-300">Signals</h2>
        <SignalsTable onDecide={decide} />
      </section>
    </div>
  );
}
