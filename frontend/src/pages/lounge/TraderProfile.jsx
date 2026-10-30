// frontend/src/pages/lounge/TraderProfile.jsx
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MessageCircle, Loader2, X, Users, BadgeCheck, Pencil, Grid3x3, LineChart, Heart, Images } from "lucide-react";
import api from "../../api/axios";
import { glass, pill, Avatar, TraderName, PropBadges, FollowButton, EmptyState, SegmentedControl, formatMoney } from "../../components/lounge/LoungeUI";
import { openChatWith, useOnlineSet } from "../../lib/socket";
import { useMe, ThreadModal } from "./LoungeFeed";
import LoungeProfileSheet from "./LoungeProfileSheet";

const LIST_TABS = [
  { value: "followers", label: "Followers" },
  { value: "following", label: "Following" },
  { value: "mutuals", label: "Mutuals" },
];

function FollowListModal({ userId, kind, onClose, showMutuals }) {
  const [tab, setTab] = useState(kind);
  const [list, setList] = useState(null);
  useEffect(() => {
    setList(null);
    api.get(`/api/social/traders/${userId}/${tab}`).then(({ data }) => setList(data)).catch(() => setList([]));
  }, [userId, tab]);

  return createPortal(
    <div className="fixed inset-0 z-[9000] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="w-full sm:max-w-sm max-h-[70vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#161a24] border border-black/[0.06] dark:border-white/[0.08] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 px-4 pt-3 pb-2 bg-white/80 dark:bg-[#161a24]/80 backdrop-blur-xl border-b border-black/[0.05] dark:border-white/[0.06]">
          <div className="flex items-center justify-between">
            <SegmentedControl options={showMutuals ? LIST_TABS : LIST_TABS.slice(0, 2)} value={tab} onChange={setTab} />
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/[0.05] dark:hover:bg-white/[0.08]" aria-label="Close">
              <X className="w-4 h-4 text-neutral-500" />
            </button>
          </div>
        </div>
        {!list ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
          </div>
        ) : list.length === 0 ? (
          <EmptyState icon={Users} title={`No ${tab} yet`} />
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

function PostTile({ post, onOpen }) {
  const cover = post.mediaUrls?.[0];
  return (
    <button onClick={() => onOpen(post)} className="group relative aspect-square overflow-hidden bg-black/[0.04] dark:bg-white/[0.05] text-left">
      {cover ? (
        <img src={cover} alt="" loading="lazy" className="w-full h-full object-cover" />
      ) : (
        <span className="absolute inset-0 p-3 text-[12px] leading-snug text-neutral-700 dark:text-neutral-200 line-clamp-6">{post.content}</span>
      )}
      {post.mediaUrls?.length > 1 && <Images className="absolute top-2 right-2 w-4 h-4 text-white drop-shadow" />}
      <span className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white text-sm font-bold">
        <span className="inline-flex items-center gap-1"><Heart className="w-4 h-4 fill-white" /> {post.likesCount || 0}</span>
        <span className="inline-flex items-center gap-1"><MessageCircle className="w-4 h-4 fill-white" /> {post.repliesCount || 0}</span>
      </span>
    </button>
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
  const [tab, setTab] = useState("posts");
  const [editing, setEditing] = useState(false);

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
  const shownPosts = tab === "setups" ? profile.posts.filter((p) => p.isSetup) : profile.posts;
  const counts = [
    { key: "posts", label: "posts", value: profile.postsCount ?? profile.posts.length },
    { key: "followers", label: "followers", value: profile.followers },
    { key: "following", label: "following", value: profile.following },
  ];

  return (
    <div className="space-y-5">
      <Link to="/lounge" className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Leaderboard
      </Link>

      <div className={`${glass} p-5 sm:p-8`}>
        <div className="flex gap-5 sm:gap-10 items-start">
          <Avatar user={profile} size={88} online={online.has(id)} className="sm:hidden" />
          <Avatar user={profile} size={150} online={online.has(id)} className="hidden sm:inline-flex" />

          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-semibold text-neutral-900 dark:text-white truncate">{profile.handle}</h1>
              {profile.isVerified && <BadgeCheck className="w-5 h-5 text-[#0066FF] dark:text-sky-400" />}
              {isMe ? (
                <button onClick={() => setEditing(true)} className={`${pill} px-4 py-2 text-sm bg-black/[0.05] dark:bg-white/[0.08] text-neutral-800 dark:text-neutral-100 hover:bg-black/[0.08] dark:hover:bg-white/[0.12]`}>
                  <Pencil className="w-3.5 h-3.5" /> Edit profile
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <FollowButton size="lg" following={profile.isFollowing} busy={busy} onClick={toggleFollow} />
                  <button
                    onClick={() => openChatWith(profile)}
                    className={`${pill} px-4 py-2 text-sm bg-black/[0.05] dark:bg-white/[0.08] text-neutral-800 dark:text-neutral-100 hover:bg-black/[0.08] dark:hover:bg-white/[0.12]`}
                  >
                    <MessageCircle className="w-4 h-4" /> Message
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-6 sm:gap-10 text-sm sm:text-[15px]">
              {counts.map((c) =>
                c.key === "posts" ? (
                  <span key={c.key}>
                    <strong className="text-neutral-900 dark:text-white">{c.value}</strong> <span className="text-neutral-500">{c.label}</span>
                  </span>
                ) : (
                  <button key={c.key} onClick={() => setListKind(c.key)} className="hover:opacity-70">
                    <strong className="text-neutral-900 dark:text-white">{c.value}</strong> <span className="text-neutral-500">{c.label}</span>
                  </button>
                ),
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">{profile.displayName}</span>
                {profile.rank && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">Rank #{profile.rank}</span>
                )}
                {profile.isMutual ? (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">Mutual</span>
                ) : (
                  profile.followsYou && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-black/[0.05] dark:bg-white/[0.08] text-neutral-500">Follows you</span>
                  )
                )}
              </div>
              {profile.primaryStrategy && <p className="text-sm text-neutral-500">{profile.primaryStrategy}</p>}
              {profile.bio && <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-line max-w-xl">{profile.bio}</p>}
              <PropBadges badges={profile.propBadges} />
              {profile.followedBy?.length > 0 && (
                <button onClick={() => setListKind("mutuals")} className="flex items-center gap-2 pt-1 text-xs text-neutral-500 hover:opacity-80 text-left">
                  <span className="flex -space-x-2">
                    {profile.followedBy.map((u) => (
                      <Avatar key={u.id} user={u} size={20} className="ring-2 ring-white dark:ring-[#12151e] rounded-full" />
                    ))}
                  </span>
                  <span>
                    Followed by <strong className="text-neutral-700 dark:text-neutral-200">{profile.followedBy.map((u) => u.handle).join(", ")}</strong>
                    {profile.mutualsCount > profile.followedBy.length && ` and ${profile.mutualsCount - profile.followedBy.length} more`}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {tiles.length > 0 && (
          <div className="mt-6 grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
            {tiles.map((t) => (
              <div key={t.label} className="rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] px-3 py-2.5">
                <div className={`text-base font-bold font-mono ${t.tone || "text-neutral-900 dark:text-white"}`}>{t.value}</div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400 mt-0.5">{t.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`${glass} overflow-hidden`}>
        <div className="flex justify-center gap-10 border-b border-black/[0.05] dark:border-white/[0.06]">
          {[
            { value: "posts", label: "Posts", icon: Grid3x3 },
            { value: "setups", label: "Setups", icon: LineChart },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={`inline-flex items-center gap-1.5 py-3 text-xs font-bold uppercase tracking-widest border-t-2 -mt-px transition-colors ${
                tab === value ? "border-neutral-900 dark:border-white text-neutral-900 dark:text-white" : "border-transparent text-neutral-400 hover:text-neutral-600"
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
        {shownPosts.length === 0 ? (
          <EmptyState title={tab === "setups" ? "No setups shared yet" : "No posts yet"} />
        ) : (
          <div className="grid grid-cols-3 gap-0.5 sm:gap-1">
            {shownPosts.map((p) => (
              <PostTile key={p.id} post={p} onOpen={(post) => setOpenId(post.id)} />
            ))}
          </div>
        )}
      </div>

      {listKind && <FollowListModal userId={id} kind={listKind} showMutuals={!isMe} onClose={() => setListKind(null)} />}
      {openId && (
        <ThreadModal
          postId={openId}
          me={me}
          onClose={() => setOpenId(null)}
          onPostChange={(np) => setProfile((pr) => ({ ...pr, posts: pr.posts.map((x) => (x.id === np.id ? np : x)) }))}
        />
      )}
      {editing && (
        <LoungeProfileSheet
          me={{ ...me, ...profile }}
          onClose={() => setEditing(false)}
          onSaved={(saved) => setProfile((p) => ({ ...p, ...saved }))}
        />
      )}
    </div>
  );
}
