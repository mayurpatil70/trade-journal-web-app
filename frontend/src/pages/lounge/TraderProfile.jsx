// frontend/src/pages/lounge/TraderProfile.jsx
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MessageCircle, Loader2, X, Users } from "lucide-react";
import api from "../../api/axios";
import { glass, pill, Avatar, TraderName, PropBadges, FollowButton, EmptyState, formatMoney } from "../../components/lounge/LoungeUI";
import PostCard from "../../components/lounge/PostCard";
import { openChatWith, useOnlineSet } from "../../lib/socket";
import { useMe, ThreadModal } from "./LoungeFeed";

function FollowListModal({ userId, kind, onClose }) {
  const [list, setList] = useState(null);
  useEffect(() => {
    api.get(`/api/social/traders/${userId}/${kind}`).then(({ data }) => setList(data)).catch(() => setList([]));
  }, [userId, kind]);

  return createPortal(
    <div className="fixed inset-0 z-[9000] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="w-full sm:max-w-sm max-h-[70vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#161a24] border border-black/[0.06] dark:border-white/[0.08] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between px-5 py-3 bg-white/80 dark:bg-[#161a24]/80 backdrop-blur-xl border-b border-black/[0.05] dark:border-white/[0.06]">
          <span className="text-sm font-bold capitalize text-neutral-900 dark:text-white">{kind}</span>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/[0.05] dark:hover:bg-white/[0.08]">
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>
        {!list ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
          </div>
        ) : list.length === 0 ? (
          <EmptyState icon={Users} title={`No ${kind} yet`} />
        ) : (
          <div className="p-2">
            {list.map((u) => (
              <Link key={u.id} to={`/lounge/trader/${u.id}`} onClick={onClose} className="flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-black/[0.03] dark:hover:bg-white/[0.04]">
                <Avatar user={u} size={38} online={u.isOnline} />
                <span className="min-w-0">
                  <TraderName user={u} link={false} />
                  <span className="block text-xs text-neutral-500">@{u.handle}</span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export default function TraderProfile() {
  const { id } = useParams();
  const me = useMe();
  const online = useOnlineSet();
  const [profile, setProfile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [listKind, setListKind] = useState(null);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    setProfile(null);
    api.get(`/api/social/traders/${id}`).then(({ data }) => setProfile(data)).catch(() => setProfile({ error: true }));
  }, [id]);

  const toggleFollow = async () => {
    setBusy(true);
    const next = !profile.isFollowing;
    try {
      const { data } = await api.post(`/api/social/${next ? "follow" : "unfollow"}`, { targetId: id });
      setProfile((p) => ({ ...p, isFollowing: next, isMutual: next && p.followsYou, followers: data.followers }));
    } finally {
      setBusy(false);
    }
  };

  if (!profile) {
    return (
      <div className="py-24 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );
  }
  if (profile.error) {
    return (
      <div className={glass}>
        <EmptyState icon={Users} title="Trader not found" action={<Link to="/lounge" className={`${pill} bg-[#0066FF] text-white`}>Back to lounge</Link>} />
      </div>
    );
  }

  const isMe = me?.id === id;
  const stats = profile.stats;
  const tiles = stats
    ? [
        { label: "Total PnL", value: formatMoney(stats.total_pnl), tone: Number(stats.total_pnl) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500" },
        { label: "Win rate", value: `${stats.win_rate ?? 0}%` },
        { label: "Profit factor", value: stats.profit_factor ?? "∞" },
        { label: "Consistency", value: `${stats.consistency_score ?? 0}%` },
        { label: "Discipline", value: `${stats.discipline_pct ?? 0}%` },
        { label: "Trades", value: stats.total_trades },
      ]
    : [];

  return (
    <div className="space-y-5">
      <Link to="/lounge" className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Leaderboard
      </Link>

      <div className={`${glass} overflow-hidden`}>
        <div className="h-28 bg-gradient-to-br from-[#0066FF] via-sky-500 to-emerald-400 opacity-90" />
        <div className="px-5 sm:px-6 pb-6 -mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <Avatar user={profile} size={96} online={online.has(id)} className="ring-4 ring-white dark:ring-[#12151e] rounded-full" />
            {!isMe && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openChatWith(profile)}
                  className={`${pill} px-4 py-2 text-sm border border-black/[0.08] dark:border-white/[0.1] text-neutral-800 dark:text-neutral-100 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]`}
                >
                  <MessageCircle className="w-4 h-4" /> Message
                </button>
                <FollowButton size="lg" following={profile.isFollowing} busy={busy} onClick={toggleFollow} />
              </div>
            )}
          </div>

          <div className="mt-3 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <TraderName user={profile} link={false} className="text-xl" />
              {profile.rank && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">Rank #{profile.rank}</span>
              )}
              {profile.followsYou && !profile.isMutual && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-black/[0.05] dark:bg-white/[0.08] text-neutral-500">Follows you</span>
              )}
              {profile.isMutual && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Mutual</span>
              )}
            </div>
            <p className="text-sm text-neutral-500">@{profile.handle}</p>
            {profile.bio && <p className="text-sm text-neutral-700 dark:text-neutral-300 pt-1 max-w-xl">{profile.bio}</p>}
            <div className="flex items-center gap-3 pt-1 flex-wrap">
              {profile.primaryStrategy && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-[#0066FF] dark:text-sky-400">{profile.primaryStrategy}</span>
              )}
              <PropBadges badges={profile.propBadges} />
            </div>
            <div className="flex gap-4 pt-2 text-sm">
              <button onClick={() => setListKind("followers")} className="hover:underline">
                <strong className="text-neutral-900 dark:text-white">{profile.followers}</strong> <span className="text-neutral-500">Followers</span>
              </button>
              <button onClick={() => setListKind("following")} className="hover:underline">
                <strong className="text-neutral-900 dark:text-white">{profile.following}</strong> <span className="text-neutral-500">Following</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {tiles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {tiles.map((t) => (
            <div key={t.label} className={`${glass} p-4`}>
              <div className={`text-lg font-bold font-mono ${t.tone || "text-neutral-900 dark:text-white"}`}>{t.value}</div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400 mt-0.5">{t.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className={`${glass} divide-y divide-black/[0.04] dark:divide-white/[0.05] overflow-hidden`}>
        {profile.posts.length === 0 ? (
          <EmptyState title="No thoughts posted yet" />
        ) : (
          profile.posts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              myId={me?.id}
              onChange={(np) => setProfile((pr) => ({ ...pr, posts: pr.posts.map((x) => (x.id === np.id ? np : x)) }))}
              onDelete={(pid) => setProfile((pr) => ({ ...pr, posts: pr.posts.filter((x) => x.id !== pid) }))}
              onOpen={(post) => setOpenId(post.id)}
            />
          ))
        )}
      </div>

      {listKind && <FollowListModal userId={id} kind={listKind} onClose={() => setListKind(null)} />}
      {openId && <ThreadModal postId={openId} me={me} onClose={() => setOpenId(null)} />}
    </div>
  );
}
