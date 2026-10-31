// frontend/src/pages/lounge/LoungeProfileSheet.jsx
import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Plus } from "lucide-react";
import api from "../../api/axios";
import { pill } from "../../components/lounge/LoungeUI";
import { LinksEditor, tidyLinks } from "../../components/lounge/ProfileLinks";

const BADGES = ["FTMO", "MFF", "Funded Engineer", "FundingPips", "The5ers", "Apex"];
const field =
  "w-full rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] px-3 py-2 text-sm text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-[#0066FF]/40";

export default function LoungeProfileSheet({ me, onClose, onSaved }) {
  const [form, setForm] = useState({
    bio: me?.bio || "",
    primaryStrategy: me?.primaryStrategy || "",
    propBadges: me?.propBadges || [],
    isPublic: Boolean(me?.isPublic),
    links: me?.links || [],
    brokers: me?.brokers || [],
  });
  const [customFirm, setCustomFirm] = useState("");
  const [broker, setBroker] = useState({ name: "", url: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const addFirm = () => {
    const name = customFirm.trim().slice(0, 30);
    if (name && !form.propBadges.some((b) => b.toLowerCase() === name.toLowerCase()) && form.propBadges.length < 6) set("propBadges", [...form.propBadges, name]);
    setCustomFirm("");
  };

  const addBroker = () => {
    const name = broker.name.trim();
    if (!name || form.brokers.length >= 10) return;
    set("brokers", [...form.brokers, { name, url: broker.url.trim() }]);
    setBroker({ name: "", url: "" });
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, links: tidyLinks(form.links) };
      await api.put("/api/social/me", payload);
      onSaved?.(payload);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9000] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#161a24] border border-black/[0.06] dark:border-white/[0.08] shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">Lounge profile</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/[0.05] dark:hover:bg-white/[0.08]">
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>

        <label className="flex items-center justify-between gap-3 rounded-2xl bg-blue-500/[0.06] border border-blue-500/15 p-3">
          <span>
            <span className="block text-sm font-semibold text-neutral-900 dark:text-white">Showcase on leaderboard</span>
            <span className="block text-xs text-neutral-500 dark:text-neutral-400">Shares win rate, PnL and profit factor. Trades stay private.</span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={form.isPublic}
            onClick={() => set("isPublic", !form.isPublic)}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${form.isPublic ? "bg-emerald-500" : "bg-neutral-300 dark:bg-neutral-600"}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.isPublic ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </label>

        <p className="text-xs text-neutral-500">
          Shown as <span className="font-semibold text-neutral-700 dark:text-neutral-200">@{me?.handle}</span>. Change your username in Profile settings.
        </p>
        <div className="space-y-1">
          <span className="text-xs font-semibold text-neutral-500">Bio</span>
          <textarea className={`${field} resize-none`} rows={3} maxLength={280} value={form.bio} onChange={(e) => set("bio", e.target.value)} />
        </div>
        <div className="space-y-1">
          <span className="text-xs font-semibold text-neutral-500">Primary strategy</span>
          <input
            className={field}
            placeholder="ICT, SMC, Breakout, Scalping…"
            maxLength={40}
            value={form.primaryStrategy}
            onChange={(e) => set("primaryStrategy", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-neutral-500">Links</span>
          <LinksEditor links={form.links} onChange={(links) => set("links", links)} />
        </div>
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-neutral-500">Funded with</span>
          <div className="flex flex-wrap gap-1.5">
            {[...BADGES, ...form.propBadges.filter((b) => !BADGES.includes(b))].map((b) => {
              const on = form.propBadges.includes(b);
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => set("propBadges", on ? form.propBadges.filter((x) => x !== b) : [...form.propBadges, b])}
                  className={`${pill} border ${
                    on ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400" : "border-black/[0.06] dark:border-white/[0.08] text-neutral-500"
                  }`}
                >
                  {b}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <input
              className={field}
              placeholder="Add another prop firm"
              maxLength={30}
              value={customFirm}
              onChange={(e) => setCustomFirm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFirm())}
            />
            <button type="button" onClick={addFirm} className={`${pill} shrink-0 bg-black/[0.05] dark:bg-white/[0.08] text-neutral-700 dark:text-neutral-200`} aria-label="Add prop firm">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-neutral-500">Brokers you trade with</span>
          <div className="flex flex-wrap gap-1.5">
            {form.brokers.map((b, i) => (
              <span key={`${b.name}-${i}`} className={`${pill} border border-blue-500/25 bg-blue-500/10 text-blue-600 dark:text-blue-400`}>
                {b.name}
                {b.url && <span className="opacity-70">· IB link</span>}
                <button type="button" onClick={() => set("brokers", form.brokers.filter((_, n) => n !== i))} aria-label={`Remove ${b.name}`}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <input className={field} placeholder="Broker name" maxLength={40} value={broker.name} onChange={(e) => setBroker((b) => ({ ...b, name: e.target.value }))} />
          <div className="flex gap-2">
            <input className={field} placeholder="IB / referral link (optional)" maxLength={300} value={broker.url} onChange={(e) => setBroker((b) => ({ ...b, url: e.target.value }))} />
            <button type="button" onClick={addBroker} className={`${pill} shrink-0 bg-black/[0.05] dark:bg-white/[0.08] text-neutral-700 dark:text-neutral-200`} aria-label="Add broker">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          onClick={save}
          disabled={saving}
          className="w-full rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-sm font-semibold py-2.5 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
      </div>
    </div>,
    document.body,
  );
}
