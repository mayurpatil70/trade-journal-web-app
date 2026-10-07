import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { hubApi, errorMessage } from "../services/hubApi";

const EMPTY = { apiKey: "", apiSecret: "", label: "" };

export default function ConnectionsPage() {
  const [state, setState] = useState({ loading: true, ready: true, data: [] });
  const [form, setForm] = useState(EMPTY);
  const [message, setMessage] = useState({ text: "", ok: false });
  const [busy, setBusy] = useState(false);
  const [liveText, setLiveText] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await hubApi.connections();
      setState({ loading: false, ready: r.encryptionReady, data: r.data });
    } catch (e) {
      setState((s) => ({ ...s, loading: false }));
      setMessage({ text: errorMessage(e), ok: false });
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  const run = async (fn, okText) => {
    setBusy(true);
    try {
      const r = await fn();
      setMessage({ text: okText(r), ok: true });
    } catch (e) {
      setMessage({ text: errorMessage(e), ok: false });
    } finally {
      setBusy(false);
      await load();
    }
  };

  const save = (e) => {
    e.preventDefault();
    const body = form;
    setForm(EMPTY);
    return run(() => hubApi.saveConnection("binance", body), () => "Keys saved securely. New connections start on testnet.");
  };

  const conn = state.data[0];
  const input = "mt-1 w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50";

  if (state.loading) return <div className="p-8 text-center text-gray-500">Loading connections...</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Exchange Connections</h1>
        <Link to="/bot-hub" className="text-xs text-gray-400 underline">Back to Bot Hub</Link>
      </div>

      {!state.ready && <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-300">Secure key storage is not configured on the server yet.</p>}

      {conn && (
        <section className="space-y-3 rounded-2xl border border-white/5 bg-[#111418] p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-white">Binance{conn.label ? ` · ${conn.label}` : ""}</p>
              <p className="font-mono text-xs text-gray-400">{conn.apiKeyMasked}</p>
            </div>
            <span className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${conn.live ? "bg-rose-500/10 text-rose-400" : "bg-sky-500/10 text-sky-400"}`}>{conn.live ? "Live" : "Testnet"}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button disabled={busy} onClick={() => run(() => hubApi.testConnection("binance"), (r) => `Keys accepted on ${r.mode}${r.canTrade ? "" : " (trading disabled on this key)"}.`)} className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-gray-300">Test</button>
            <button disabled={busy} onClick={() => run(() => hubApi.removeConnection("binance"), () => "Connection removed and bots stopped.")} className="rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs text-rose-400">Delete</button>
          </div>
          <div className="border-t border-white/5 pt-3">
            {conn.live ? (
              <button disabled={busy} onClick={() => run(() => hubApi.setLive("binance", false), () => "Switched back to testnet. Bots were stopped.")} className="rounded-lg bg-sky-500/10 px-3 py-1.5 text-xs text-sky-400">Switch to testnet</button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">Live trading uses real funds. Use live keys only, then type ENABLE LIVE to opt in. Active bots stop when the mode changes.</p>
                <div className="flex gap-2">
                  <input value={liveText} onChange={(e) => setLiveText(e.target.value)} placeholder="ENABLE LIVE" className="w-40 rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-1.5 text-xs text-white" />
                  <button disabled={busy || liveText !== "ENABLE LIVE"} onClick={() => run(() => hubApi.setLive("binance", true, liveText), () => "Live mode enabled.").then(() => setLiveText(""))} className="rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs text-rose-400 disabled:opacity-40">Enable live</button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <form onSubmit={save} autoComplete="off" className="space-y-3 rounded-2xl border border-white/5 bg-[#111418] p-4">
        <h2 className="text-sm font-semibold text-gray-300">{conn ? "Rotate keys" : "Connect Binance"}</h2>
        <label className="block text-xs text-gray-400">
          API key
          <input value={form.apiKey} onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))} autoComplete="off" spellCheck={false} className={input} />
        </label>
        <label className="block text-xs text-gray-400">
          API secret
          <input type="password" value={form.apiSecret} onChange={(e) => setForm((f) => ({ ...f, apiSecret: e.target.value }))} autoComplete="new-password" spellCheck={false} className={input} />
        </label>
        <label className="block text-xs text-gray-400">
          Label (optional)
          <input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} maxLength={40} className={input} />
        </label>
        <p className="text-xs text-gray-500">Create the key with trading enabled and withdrawals disabled. The secret is encrypted on the server and never shown again.</p>
        {message.text && <p className={`text-sm ${message.ok ? "text-emerald-400" : "text-rose-400"}`}>{message.text}</p>}
        <button type="submit" disabled={busy || !state.ready || !form.apiKey || !form.apiSecret} className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">{busy ? "Saving..." : "Save keys"}</button>
      </form>
    </div>
  );
}
