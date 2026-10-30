// frontend/src/pages/lounge/LoungeFeed.jsx
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MessageSquareText, X, Loader2 } from "lucide-react";
import api from "../../api/axios";
import { glass, SegmentedControl, EmptyState } from "../../components/lounge/LoungeUI";
import PostCard, { Composer } from "../../components/lounge/PostCard";

const TABS = [
  { value: "trending", label: "Trending" },
  { value: "following", label: "Following" },
  { value: "setups", label: "Setups" },
  { value: "bookmarks", label: "Saved" },
];

export function useMe() {
  const [me, setMe] = useState(null);
  useEffect(() => {
    api.get("/api/social/me").then(({ data }) => setMe(data)).catch(() => {});
  }, []);
  return me;
}

export function ThreadModal({ postId, me, onClose, onPostChange }) {
  const [thread, setThread] = useState(null);
  const closeRef = useRef(onClose);
  useLayoutEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    api.get(`/api/social/posts/${postId}`).then(({ data }) => setThread(data)).catch(() => closeRef.current());
  }, [postId]);

  const update = (p) => {
    setThread((t) => (t.id === p.id ? { ...t, ...p } : { ...t, replies: t.replies.map((r) => (r.id === p.id ? p : r)) }));
    onPostChange?.(p);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9000] bg-black/40 backdrop-blur-sm flex items-end sm:items-start justify-center sm:pt-[8vh]" onClick={onClose}>
      <div
        className="w-full sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#161a24] border border-black/[0.06] dark:border-white/[0.08] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3 bg-white/80 dark:bg-[#161a24]/80 backdrop-blur-xl border-b border-black/[0.05] dark:border-white/[0.06]">
          <span className="text-sm font-bold text-neutral-900 dark:text-white">Thread</span>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/[0.05] dark:hover:bg-white/[0.08]">
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>
        {!thread ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
          </div>
        ) : (
          <>
            <PostCard post={thread} myId={me?.id} onChange={update} onDelete={onClose} />
            <div className="px-5 pb-4 border-b border-black/[0.05] dark:border-white/[0.06]">
              <Composer
                me={me}
                parentId={thread.id}
                autoFocus
                placeholder={`Reply to @${thread.author?.handle}…`}
                onPosted={(r) => {
                  setThread((t) => ({ ...t, replies: [...t.replies, r], repliesCount: t.repliesCount + 1 }));
                  onPostChange?.({ ...thread, repliesCount: thread.repliesCount + 1 });
                }}
              />
            </div>
            <div className="px-5 divide-y divide-black/[0.04] dark:divide-white/[0.05]">
              {thread.replies.map((r) => (
                <PostCard key={r.id} post={r} compact myId={me?.id} onChange={update} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

export default function LoungeFeed() {
  const me = useMe();
  const [tab, setTab] = useState("trending");
  const [posts, setPosts] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const sentinel = useRef(null);
  const reqId = useRef(0);

  const load = useCallback(
    async (reset) => {
      const id = ++reqId.current;
      setLoading(true);
      try {
        const { data } = await api.get("/api/social/feed", { params: { tab, cursor: reset ? undefined : cursor } });
        if (id !== reqId.current) return;
        setPosts((p) => (reset ? data.posts : [...p, ...data.posts]));
        setCursor(data.nextCursor);
      } catch {
        if (id === reqId.current && reset) setPosts([]);
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    },
    [tab, cursor],
  );

  useEffect(() => {
    setPosts([]);
    setCursor(null);
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !cursor) return undefined;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && !loading && load(false), { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, [cursor, loading, load]);

  const replace = (p) => setPosts((list) => list.map((x) => (x.id === p.id ? { ...x, ...p } : x)));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-5 items-start">
      <div className="space-y-4 min-w-0">
        <div className={`${glass} p-4 sm:p-5`}>
          <Composer me={me} onPosted={(p) => setPosts((list) => [p, ...list])} />
        </div>

        <SegmentedControl options={TABS} value={tab} onChange={setTab} />

        <div className={`${glass} divide-y divide-black/[0.04] dark:divide-white/[0.05] overflow-hidden`}>
          {posts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              myId={me?.id}
              onChange={replace}
              onDelete={(id) => setPosts((list) => list.filter((x) => x.id !== id))}
              onOpen={(post) => setOpenId(post.id)}
            />
          ))}
          {!loading && posts.length === 0 && (
            <EmptyState
              icon={MessageSquareText}
              title={tab === "following" ? "Follow traders to fill this stream" : "Nothing here yet"}
              body="Post your first idea with a $cashtag and a before/after chart."
            />
          )}
          {loading && (
            <div className="py-8 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
            </div>
          )}
          <div ref={sentinel} />
        </div>
      </div>

      <aside className="hidden lg:block space-y-4 sticky top-20">
        <div className={`${glass} p-5`}>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Posting tips</h3>
          <ul className="mt-3 space-y-2 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            <li>Tag pairs with cashtags like <span className="text-[#0066FF] font-semibold">$XAUUSD</span>.</li>
            <li>Mention traders with <span className="text-[#0066FF] font-semibold">@handle</span>.</li>
            <li>Attach two charts to get an interactive before/after preview.</li>
            <li>Mark it as a Setup so it shows in the Setups tab.</li>
            <li>Use <strong>**bold**</strong> for key levels.</li>
          </ul>
        </div>
      </aside>

      {openId && <ThreadModal postId={openId} me={me} onClose={() => setOpenId(null)} onPostChange={replace} />}
    </div>
  );
}
