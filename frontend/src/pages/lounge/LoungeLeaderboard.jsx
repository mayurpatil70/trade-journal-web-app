// frontend/src/pages/lounge/LoungeLeaderboard.jsx
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, Crown, Medal, ShieldCheck, Eye } from "lucide-react";
import api from "../../api/axios";
import {
  glass,
  pill,
  Avatar,
  TraderName,
  PropBadges,
  SegmentedControl,
  EmptyState,
  FollowButton,
  formatMoney,
} from "../../components/lounge/LoungeUI";
import { useOnlineSet } from "../../lib/socket";
import LoungeProfileSheet from "./LoungeProfileSheet";

const PODIUM = [
  { ring: "from-amber-300 via-yellow-400 to-amber-600", tint: "bg-amber-400/10", icon: Crown, label: "Gold" },
  { ring: "from-slate-200 via-slate-300 to-slate-500", tint: "bg-slate-400/10", icon: Medal, label: "Silver" },
  { ring: "from-orange-300 via-amber-600 to-orange-800", tint: "bg-orange-500/10", icon: Medal, label: "Bronze" },
];

function useFollowToggle(setRows) {
  const [busyId, setBusyId] = useState(null);
  const toggle = async (row) => {
    setBusyId(row.trader.id);
    const next = !row.isFollowing;
    setRows((rows) => rows.map((r) => (r.trader.id === row.trader.id ? { ...r, isFollowing: next } : r)));
    try {
      await api.post(`/api/social/${next ? "follow" : "unfollow"}`, { targetId: row.trader.id });
    } catch {
      setRows((rows) => rows.map((r) => (r.trader.id === row.trader.id ? { ...r, isFollowing: !next } : r)));
    } finally {
      setBusyId(null);
    }
  };
  return { busyId, toggle };
}

function PodiumCard({ row, place, onFollow, busy, online }) {
  const style = PODIUM[place];
  const Icon = style.icon;
  return (
    <div className={`${glass} relative overflow-hidden p-5 flex flex-col items-center text-center ${place === 0 ? "sm:-translate-y-3" : ""}`}>
      <div className={`absolute inset-0 ${style.tint} pointer-events-none`} />
      <div className={`absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-32 rounded-full bg-gradient-to-b ${style.ring} opacity-20 blur-2xl`} />
      <span className="relative inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
        <Icon className="w-3.5 h-3.5" /> #{place + 1} {style.label}
      </span>
      <div className={`relative mt-3 p-[3px] rounded-full bg-gradient-to-br ${style.ring}`}>
        <Avatar user={row.trader} size={place === 0 ? 76 : 64} online={online} className="ring-2 ring-white dark:ring-[#12151e] rounded-full" />
      </div>
      <div className="relative mt-3 flex flex-col items-center gap-1 min-w-0 w-full">
        <TraderName user={row.trader} className="justify-center max-w-full" />
        <span className="text-xs text-neutral-500 dark:text-neutral-400">@{row.trader.handle}</span>
        <PropBadges badges={row.trader.propBadges} />
      </div>
      <div className="relative mt-4 grid grid-cols-3 gap-2 w-full">
        <Stat label="PnL" value={formatMoney(row.totalPnl)} tone={row.totalPnl >= 0 ? "pos" : "neg"} />
        <Stat label="Win" value={`${row.winRate}%`} />
        <Stat label="PF" value={row.profitFactor ?? "∞"} />
      </div>
      {!row.isMe && (
        <div className="relative mt-4">
          <FollowButton following={row.isFollowing} busy={busy} onClick={() => onFollow(row)} />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className="rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] px-2 py-2">
      <div
        className={`text-sm font-bold font-mono ${
          tone === "pos" ? "text-emerald-600 dark:text-emerald-400" : tone === "neg" ? "text-red-500" : "text-neutral-900 dark:text-white"
        }`}
      >
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400">{label}</div>
    </div>
  );
}

export default function LoungeLeaderboard() {
  const [period, setPeriod] = useState("all");
  const [sort, setSort] = useState("pnl");
  const [funded, setFunded] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const online = useOnlineSet();
  const { busyId, toggle } = useFollowToggle(setRows);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/social/leaderboard", { params: { period, sort, funded: funded ? 1 : 0 } });
      setRows(data || []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [period, sort, funded]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api.get("/api/social/me").then(({ data }) => setMe(data)).catch(() => {});
  }, []);

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <div className="space-y-5">
      {me && !me.isPublic && (
        <div className={`${glass} p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between`}>
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-[#0066FF] dark:text-sky-400 shrink-0" />
            <p className="text-sm text-neutral-700 dark:text-neutral-300">
              Your journal stays private. Showcase it to rank on the leaderboard and unlock partner deals.
            </p>
          </div>
          <button onClick={() => setProfileOpen(true)} className={`${pill} bg-[#0066FF] text-white hover:bg-[#0052CC] self-start sm:self-auto`}>
            Join the leaderboard
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          value={period}
          onChange={setPeriod}
          options={[
            { value: "all", label: "All Time" },
            { value: "month", label: "This Month" },
          ]}
        />
        <SegmentedControl
          value={sort}
          onChange={setSort}
          options={[
            { value: "pnl", label: "Sort by PnL" },
            { value: "winrate", label: "Sort by Win Rate" },
          ]}
        />
        <button
          type="button"
          onClick={() => setFunded((f) => !f)}
          className={`${pill} border ${
            funded
              ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
              : "border-black/[0.06] dark:border-white/[0.08] text-neutral-600 dark:text-neutral-300"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" /> Funded Only
        </button>
        {me && (
          <button
            onClick={() => setProfileOpen(true)}
            className={`${pill} ml-auto border border-black/[0.06] dark:border-white/[0.08] text-neutral-600 dark:text-neutral-300`}
          >
            Edit lounge profile
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`${glass} h-64 animate-pulse`} />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className={glass}>
          <EmptyState icon={Trophy} title="No ranked traders yet" body="Be the first to showcase your journal and claim the gold podium." />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:pt-3">
            {[1, 0, 2].map((place) =>
              podium[place] ? (
                <div key={place} className={place === 0 ? "order-first sm:order-none" : ""}>
                  <PodiumCard
                    row={podium[place]}
                    place={place}
                    onFollow={toggle}
                    busy={busyId === podium[place].trader.id}
                    online={online.has(podium[place].trader.id)}
                  />
                </div>
              ) : (
                <div key={place} />
              ),
            )}
          </div>

          {rest.length > 0 && (
            <div className={`${glass} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[720px]">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-neutral-400 border-b border-black/[0.05] dark:border-white/[0.06]">
                      <th className="text-left font-semibold px-5 py-3 w-14">#</th>
                      <th className="text-left font-semibold py-3">Trader</th>
                      <th className="text-left font-semibold py-3">Strategy</th>
                      <th className="text-left font-semibold py-3 w-44">Win rate</th>
                      <th className="text-right font-semibold py-3">PnL</th>
                      <th className="text-right font-semibold py-3">PF</th>
                      <th className="text-right font-semibold py-3">Discipline</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {rest.map((row) => (
                      <tr
                        key={row.trader.id}
                        className="border-b last:border-0 border-black/[0.04] dark:border-white/[0.04] hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-5 py-3 font-mono font-bold text-neutral-400">{row.rank}</td>
                        <td className="py-3">
                          <Link to={`/lounge/trader/${row.trader.id}`} className="flex items-center gap-3 min-w-0">
                            <Avatar user={row.trader} size={36} online={online.has(row.trader.id)} />
                            <div className="min-w-0">
                              <TraderName user={row.trader} link={false} />
                              <div className="text-xs text-neutral-500 dark:text-neutral-400">@{row.trader.handle}</div>
                            </div>
                          </Link>
                        </td>
                        <td className="py-3">
                          {row.trader.primaryStrategy ? (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-[#0066FF] dark:text-sky-400">
                              {row.trader.primaryStrategy}
                            </span>
                          ) : (
                            <span className="text-neutral-400">—</span>
                          )}
                        </td>
                        <td className="py-3 pr-6">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-[#0066FF] to-sky-400" style={{ width: `${Math.min(row.winRate, 100)}%` }} />
                            </div>
                            <span className="text-xs font-mono font-semibold text-neutral-700 dark:text-neutral-300 w-12 text-right">{row.winRate}%</span>
                          </div>
                        </td>
                        <td className={`py-3 text-right font-mono font-semibold ${row.totalPnl >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                          {formatMoney(row.totalPnl)}
                        </td>
                        <td className="py-3 text-right font-mono text-neutral-700 dark:text-neutral-300">{row.profitFactor ?? "∞"}</td>
                        <td className="py-3 text-right font-mono text-neutral-700 dark:text-neutral-300">{row.disciplinePct}%</td>
                        <td className="px-5 py-3 text-right">
                          {!row.isMe && <FollowButton following={row.isFollowing} busy={busyId === row.trader.id} onClick={() => toggle(row)} />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {profileOpen && (
        <LoungeProfileSheet
          me={me}
          onClose={() => setProfileOpen(false)}
          onSaved={(saved) => {
            setMe((m) => ({ ...m, ...saved }));
            load();
          }}
        />
      )}
    </div>
  );
}
