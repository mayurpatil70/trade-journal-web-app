import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Loader2 } from "lucide-react";
import api from "../../api/axios";
import { Avatar, TraderName, FollowButton } from "./LoungeUI";

export default function TraderSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const boxRef = useRef(null);

  useEffect(() => {
    const q = query.trim().replace(/^@/, "");
    if (q.length < 2) {
      setResults(null);
      return;
    }
    setResults("loading");
    const t = setTimeout(() => {
      api.get("/api/social/search", { params: { q } }).then(({ data }) => setResults(data)).catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const close = (e) => !boxRef.current?.contains(e.target) && setQuery("");
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const toggleFollow = async (user) => {
    setBusyId(user.id);
    try {
      await api.post(`/api/social/${user.isFollowing ? "unfollow" : "follow"}`, { targetId: user.id });
      setResults((list) => list.map((u) => (u.id === user.id ? { ...u, isFollowing: !u.isFollowing } : u)));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div ref={boxRef} className="relative w-full md:w-72">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search traders by @username"
        className="w-full rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] pl-9 pr-3 py-2 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-[#0066FF]/30"
      />
      {results && (
        <div className="absolute z-50 mt-2 w-full max-h-80 overflow-y-auto rounded-2xl bg-white dark:bg-[#161a24] border border-black/[0.06] dark:border-white/[0.08] shadow-2xl p-1.5">
          {results === "loading" ? (
            <div className="py-6 flex justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
            </div>
          ) : results.length === 0 ? (
            <p className="py-5 text-center text-sm text-neutral-500">No traders found</p>
          ) : (
            results.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-black/[0.03] dark:hover:bg-white/[0.04]">
                <Link to={`/lounge/trader/${u.id}`} onClick={() => setQuery("")} className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar user={u} size={36} online={u.isOnline} />
                  <span className="min-w-0">
                    <TraderName user={u} link={false} />
                    <span className="block text-xs text-neutral-500 truncate">@{u.handle}</span>
                  </span>
                </Link>
                <FollowButton following={u.isFollowing} busy={busyId === u.id} onClick={() => toggleFollow(u)} />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
