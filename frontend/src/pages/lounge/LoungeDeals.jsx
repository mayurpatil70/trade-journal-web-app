// frontend/src/pages/lounge/LoungeDeals.jsx
import { useCallback, useEffect, useState } from "react";
import { Gift, Copy, Check, Lock, ExternalLink, Sparkles, Plus, Trash2 } from "lucide-react";
import api from "../../api/axios";
import { glass, pill, EmptyState } from "../../components/lounge/LoungeUI";
import { useSocketEvent } from "../../lib/socket";

const ADMIN_EMAILS = ["noballondesk@gmail.com", "akpatil51340@gmail.com"];
const field =
  "w-full rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] px-3 py-2 text-sm text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-[#0066FF]/40";

function DealCard({ deal, featured }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(deal.promo_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className={`${glass} relative overflow-hidden p-5 flex flex-col ${featured ? "md:col-span-2 md:row-span-2" : ""}`}>
      {featured && <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-[#0066FF]/25 to-emerald-400/20 blur-3xl pointer-events-none" />}
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img src={deal.logo_url} alt={deal.partner_name} className="w-11 h-11 rounded-2xl object-contain bg-white border border-black/[0.06] p-1" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">{deal.partner_name}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              {deal.partner_type === "PROP_FIRM" ? "Prop firm" : "Regulated broker"}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 inline-flex items-center gap-1 shrink-0">
          <Sparkles className="w-3 h-3" /> {featured ? "Featured sponsor" : "Sponsor"}
        </span>
      </div>

      <h3 className={`relative mt-4 font-bold text-neutral-900 dark:text-white tracking-tight ${featured ? "text-2xl" : "text-base"}`}>{deal.headline}</h3>
      <p className="relative mt-1.5 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{deal.reward_description}</p>

      <div className="relative mt-auto pt-5 flex flex-wrap items-center gap-2">
        {deal.locked ? (
          <span className={`${pill} bg-black/[0.05] dark:bg-white/[0.06] text-neutral-500`}>
            <Lock className="w-3.5 h-3.5" /> Top {deal.min_rank_required} traders only
          </span>
        ) : (
          <>
            {deal.promo_code && (
              <button onClick={copy} className={`${pill} border border-dashed border-[#0066FF]/40 bg-blue-500/[0.06] text-[#0066FF] dark:text-sky-400 font-mono`}>
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : deal.promo_code}
              </button>
            )}
            <a href={deal.affiliate_url} target="_blank" rel="noreferrer noopener sponsored" className={`${pill} bg-[#0066FF] text-white hover:bg-[#0052CC]`}>
              Claim deal <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </>
        )}
        {deal.expires_at && (
          <span className="text-[11px] text-neutral-400 ml-auto">Ends {new Date(deal.expires_at).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
}

const EMPTY_DEAL = {
  partner_name: "",
  partner_type: "PROP_FIRM",
  logo_url: "",
  headline: "",
  reward_description: "",
  promo_code: "",
  affiliate_url: "",
  min_rank_required: 0,
  expires_at: "",
  is_featured: false,
};

function DealsAdmin({ onChanged }) {
  const [deals, setDeals] = useState([]);
  const [form, setForm] = useState(EMPTY_DEAL);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const load = useCallback(() => api.get("/api/social/admin/deals").then(({ data }) => setDeals(data)).catch(() => {}), []);
  useEffect(() => {
    load();
  }, [load]);

  const create = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/api/social/admin/deals", { ...form, min_rank_required: Number(form.min_rank_required) || 0 });
      setForm(EMPTY_DEAL);
      load();
      onChanged();
    } catch (err) {
      setError(err.response?.data?.error || "Could not create the deal.");
    }
  };

  const patch = async (id, body) => {
    await api.patch(`/api/social/admin/deals/${id}`, body).catch(() => {});
    load();
    onChanged();
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this campaign?")) return;
    await api.delete(`/api/social/admin/deals/${id}`).catch(() => {});
    load();
    onChanged();
  };

  return (
    <div className={`${glass} p-5 space-y-4`}>
      <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Manage partner campaigns</h3>
      <form onSubmit={create} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input className={field} required placeholder="Partner name" value={form.partner_name} onChange={(e) => set("partner_name", e.target.value)} />
        <select className={field} value={form.partner_type} onChange={(e) => set("partner_type", e.target.value)}>
          <option value="PROP_FIRM">Prop firm</option>
          <option value="REGULATED_BROKER">Regulated broker</option>
        </select>
        <input className={field} required placeholder="Logo URL" value={form.logo_url} onChange={(e) => set("logo_url", e.target.value)} />
        <input className={field} required placeholder="Affiliate URL" value={form.affiliate_url} onChange={(e) => set("affiliate_url", e.target.value)} />
        <input className={`${field} sm:col-span-2`} required placeholder="Headline" value={form.headline} onChange={(e) => set("headline", e.target.value)} />
        <textarea
          className={`${field} sm:col-span-2 resize-none`}
          required
          rows={2}
          placeholder="Reward, e.g. 15% off 100K account + 115% refund on first payout"
          value={form.reward_description}
          onChange={(e) => set("reward_description", e.target.value)}
        />
        <input className={field} placeholder="Promo code" value={form.promo_code} onChange={(e) => set("promo_code", e.target.value)} />
        <input className={field} type="number" min={0} placeholder="Min rank (0 = everyone)" value={form.min_rank_required} onChange={(e) => set("min_rank_required", e.target.value)} />
        <input className={field} type="date" value={form.expires_at} onChange={(e) => set("expires_at", e.target.value)} />
        <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
          <input type="checkbox" checked={form.is_featured} onChange={(e) => set("is_featured", e.target.checked)} /> Featured
        </label>
        {error && <p className="text-xs text-red-500 sm:col-span-2">{error}</p>}
        <button className={`${pill} bg-[#0066FF] text-white justify-center sm:col-span-2 py-2`}>
          <Plus className="w-4 h-4" /> Publish campaign
        </button>
      </form>

      {deals.length > 0 && (
        <div className="divide-y divide-black/[0.04] dark:divide-white/[0.05]">
          {deals.map((d) => (
            <div key={d.id} className="flex items-center gap-3 py-2.5 text-sm">
              <span className="flex-1 min-w-0 truncate text-neutral-800 dark:text-neutral-200">
                <strong>{d.partner_name}</strong> · {d.headline}
              </span>
              <button onClick={() => patch(d.id, { is_active: !d.is_active })} className={`${pill} border border-black/[0.06] dark:border-white/[0.08] text-neutral-600 dark:text-neutral-300`}>
                {d.is_active ? "Pause" : "Activate"}
              </button>
              <button onClick={() => remove(d.id)} className="p-1.5 rounded-full text-neutral-400 hover:text-red-500 hover:bg-red-500/10" aria-label="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LoungeDeals() {
  const [state, setState] = useState({ deals: [], myRank: null });
  const [loading, setLoading] = useState(true);
  const email = (localStorage.getItem("userEmail") || localStorage.getItem("userId") || "").toLowerCase().trim();
  const isAdmin = ADMIN_EMAILS.includes(email);

  const load = useCallback(() => {
    api
      .get("/api/social/deals")
      .then(({ data }) => setState(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useSocketEvent("deal:broadcast", load);

  const featured = state.deals.filter((d) => d.is_featured);
  const regular = state.deals.filter((d) => !d.is_featured);

  return (
    <div className="space-y-5">
      <div className={`${glass} p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
        <div>
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">Partner deals</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Evaluation discounts, zero-spread accounts and payout bonuses. Higher leaderboard ranks unlock VIP perks.
          </p>
        </div>
        <span className="self-start sm:self-auto text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-500/10 text-[#0066FF] dark:text-sky-400 border border-blue-500/20">
          {state.myRank ? `Your rank: #${state.myRank}` : "Unranked"}
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`${glass} h-48 animate-pulse`} />
          ))}
        </div>
      ) : state.deals.length === 0 ? (
        <div className={glass}>
          <EmptyState icon={Gift} title="No live deals right now" body="New prop firm and broker offers land here in real time." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-[minmax(200px,auto)] gap-4">
          {featured.map((d) => (
            <DealCard key={d.id} deal={d} featured />
          ))}
          {regular.map((d) => (
            <DealCard key={d.id} deal={d} />
          ))}
        </div>
      )}

      {isAdmin && <DealsAdmin onChanged={load} />}
    </div>
  );
}
