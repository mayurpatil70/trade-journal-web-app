// frontend/src/components/lounge/PostCard.jsx
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Heart, Repeat2, MessageCircle, Bookmark, Trash2, X, ImagePlus, TrendingUp, TrendingDown, Minus } from "lucide-react";
import api from "../../api/axios";
import { Avatar, TraderName, RichText, timeAgo, pill } from "./LoungeUI";

const RESULT_STYLES = {
  WIN: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  LOSS: "bg-red-500/10 text-red-500 border-red-500/20",
  BE: "bg-neutral-500/10 text-neutral-500 border-neutral-500/20",
};
const SENTIMENT = {
  BULLISH: { icon: TrendingUp, cls: "text-emerald-600 dark:text-emerald-400" },
  BEARISH: { icon: TrendingDown, cls: "text-red-500" },
  NEUTRAL: { icon: Minus, cls: "text-neutral-500" },
};

export function ChartPreviewModal({ urls, onClose }) {
  const [split, setSplit] = useState(50);
  const compare = urls.length >= 2;
  return createPortal(
    <div className="fixed inset-0 z-[9500] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <button className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white" onClick={onClose}>
        <X className="w-5 h-5" />
      </button>
      <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        {compare ? (
          <>
            <div className="relative rounded-2xl overflow-hidden select-none">
              <img src={urls[1]} alt="After" className="w-full max-h-[75vh] object-contain bg-black" />
              <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}>
                <img src={urls[0]} alt="Before" className="w-full max-h-[75vh] object-contain bg-black" />
              </div>
              <div className="absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: `${split}%` }} />
              <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-black/60 text-white">Before</span>
              <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-black/60 text-white">After</span>
            </div>
            <input type="range" min={0} max={100} value={split} onChange={(e) => setSplit(Number(e.target.value))} className="w-full mt-4 accent-[#0066FF]" />
          </>
        ) : (
          <img src={urls[0]} alt="Chart" className="w-full max-h-[85vh] object-contain rounded-2xl" />
        )}
      </div>
    </div>,
    document.body,
  );
}

export default function PostCard({ post, onChange, onDelete, onOpen, compact = false, myId }) {
  const [preview, setPreview] = useState(false);
  const [burst, setBurst] = useState(false);

  const react = async (kind) => {
    const field = { like: "liked", repost: "reposted", bookmark: "bookmarked" }[kind];
    const countField = { like: "likesCount", repost: "repostsCount" }[kind];
    const active = !post[field];
    if (kind === "like" && active) {
      setBurst(true);
      setTimeout(() => setBurst(false), 450);
    }
    onChange?.({ ...post, [field]: active, ...(countField && { [countField]: Math.max(0, post[countField] + (active ? 1 : -1)) }) });
    try {
      const { data } = await api.post(`/api/social/posts/${post.id}/${kind}`);
      onChange?.({ ...post, [field]: data.active, likesCount: data.likesCount, repostsCount: data.repostsCount });
    } catch {
      onChange?.(post);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this post?")) return;
    await api.delete(`/api/social/posts/${post.id}`).catch(() => {});
    onDelete?.(post.id);
  };

  const Sentiment = post.sentiment && SENTIMENT[post.sentiment];
  const action = "inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1.5 rounded-full transition-colors";

  return (
    <article className={`flex gap-3 ${compact ? "py-3" : "p-4 sm:p-5"}`}>
      <Avatar user={post.author} size={compact ? 34 : 42} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-sm min-w-0">
          <TraderName user={post.author} />
          <span className="text-neutral-400 truncate">@{post.author?.handle}</span>
          <span className="text-neutral-300 dark:text-neutral-600">·</span>
          <span className="text-neutral-400 shrink-0">{timeAgo(post.createdAt)}</span>
          {post.author?.id === myId && (
            <button onClick={remove} className="ml-auto p-1 rounded-full text-neutral-400 hover:text-red-500 hover:bg-red-500/10" aria-label="Delete">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {(post.assetTag || post.tradeResult || Sentiment || post.isSetup) && (
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {post.assetTag && (
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-[#0066FF] dark:text-sky-400">${post.assetTag}</span>
            )}
            {post.tradeResult && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${RESULT_STYLES[post.tradeResult]}`}>{post.tradeResult}</span>
            )}
            {Sentiment && (
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${Sentiment.cls}`}>
                <Sentiment.icon className="w-3 h-3" /> {post.sentiment}
              </span>
            )}
            {post.isSetup && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">SETUP</span>
            )}
          </div>
        )}

        <div onClick={() => onOpen?.(post)} className={onOpen ? "cursor-pointer" : ""}>
          <RichText text={post.content} className="mt-1.5 text-[14.5px] leading-relaxed text-neutral-800 dark:text-neutral-200" />
        </div>

        {post.mediaUrls?.length > 0 && (
          <button
            type="button"
            onClick={() => setPreview(true)}
            className={`mt-3 grid gap-1.5 w-full rounded-2xl overflow-hidden border border-black/[0.06] dark:border-white/[0.08] ${post.mediaUrls.length > 1 ? "grid-cols-2" : ""}`}
          >
            {post.mediaUrls.slice(0, 4).map((u, i) => (
              <span key={u} className="relative block">
                <img src={u} alt="" className="w-full h-full max-h-80 object-cover" loading="lazy" />
                {post.mediaUrls.length === 2 && (
                  <span className="absolute top-2 left-2 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-black/60 text-white">
                    {i === 0 ? "Before" : "After"}
                  </span>
                )}
              </span>
            ))}
          </button>
        )}

        {!compact && (
          <div className="flex items-center justify-between max-w-md mt-2 -ml-2">
            <button onClick={() => onOpen?.(post)} className={`${action} text-neutral-500 hover:text-[#0066FF] hover:bg-blue-500/10`}>
              <MessageCircle className="w-4 h-4" /> {post.repliesCount || ""}
            </button>
            <button
              onClick={() => react("repost")}
              title="Repost / share to your followers"
              className={`${action} ${post.reposted ? "text-emerald-500" : "text-neutral-500"} hover:text-emerald-500 hover:bg-emerald-500/10`}
            >
              <Repeat2 className="w-4 h-4" /> {post.repostsCount || ""}
            </button>
            <button
              onClick={() => react("like")}
              className={`${action} ${post.liked ? "text-pink-500" : "text-neutral-500"} hover:text-pink-500 hover:bg-pink-500/10`}
            >
              <Heart className={`w-4 h-4 transition-transform duration-300 ${post.liked ? "fill-current" : ""} ${burst ? "scale-150" : "scale-100"}`} />
              {post.likesCount || ""}
            </button>
            <button
              onClick={() => react("bookmark")}
              className={`${action} ${post.bookmarked ? "text-[#0066FF]" : "text-neutral-500"} hover:text-[#0066FF] hover:bg-blue-500/10`}
            >
              <Bookmark className={`w-4 h-4 ${post.bookmarked ? "fill-current" : ""}`} />
            </button>
          </div>
        )}
      </div>
      {preview && <ChartPreviewModal urls={post.mediaUrls} onClose={() => setPreview(false)} />}
    </article>
  );
}

export function Composer({ me, parentId, onPosted, placeholder = "Share a thought, setup or $XAUUSD idea…", autoFocus }) {
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);
  const [sentiment, setSentiment] = useState("");
  const [tradeResult, setTradeResult] = useState("");
  const [isSetup, setIsSetup] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const submit = async () => {
    if (!content.trim()) return;
    setPosting(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("content", content);
      if (parentId) fd.append("parentId", parentId);
      if (sentiment) fd.append("sentiment", sentiment);
      if (tradeResult) fd.append("tradeResult", tradeResult);
      fd.append("isSetup", String(isSetup));
      files.forEach((f) => fd.append("media", f));
      const { data } = await api.post("/api/social/posts", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setContent("");
      setFiles([]);
      setSentiment("");
      setTradeResult("");
      setIsSetup(false);
      onPosted?.(data);
    } catch (err) {
      setError(err.response?.data?.error || "Could not post. Try again.");
    } finally {
      setPosting(false);
    }
  };

  const chip = (active, cls) =>
    `${pill} !py-1 border ${active ? cls : "border-black/[0.06] dark:border-white/[0.08] text-neutral-500"}`;

  return (
    <div className="flex gap-3">
      <Avatar user={me} size={parentId ? 34 : 42} />
      <div className="flex-1 min-w-0">
        <textarea
          value={content}
          autoFocus={autoFocus}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === "Enter" && submit()}
          rows={parentId ? 2 : 3}
          maxLength={2000}
          placeholder={placeholder}
          className="w-full resize-none !bg-transparent !border-0 !shadow-none focus:!ring-0 p-0 text-[15px] text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none"
        />
        {files.length > 0 && (
          <div className="flex gap-2 mb-2">
            {files.map((f, i) => (
              <span key={i} className="relative">
                <img src={URL.createObjectURL(f)} alt="" className="w-16 h-16 object-cover rounded-xl" />
                <button
                  onClick={() => setFiles(files.filter((_, j) => j !== i))}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-black/[0.05] dark:border-white/[0.06]">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => setFiles([...files, ...Array.from(e.target.files || [])].slice(0, 4))}
          />
          <button type="button" onClick={() => fileRef.current?.click()} className="p-2 rounded-full text-[#0066FF] hover:bg-blue-500/10" title="Add chart (2 images = before/after)">
            <ImagePlus className="w-4 h-4" />
          </button>
          {!parentId && (
            <>
              {["BULLISH", "BEARISH"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSentiment(sentiment === s ? "" : s)}
                  className={chip(sentiment === s, s === "BULLISH" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600" : "bg-red-500/10 border-red-500/30 text-red-500")}
                >
                  {s === "BULLISH" ? "Bullish" : "Bearish"}
                </button>
              ))}
              {["WIN", "LOSS", "BE"].map((r) => (
                <button key={r} type="button" onClick={() => setTradeResult(tradeResult === r ? "" : r)} className={chip(tradeResult === r, RESULT_STYLES[r])}>
                  {r}
                </button>
              ))}
              <button type="button" onClick={() => setIsSetup(!isSetup)} className={chip(isSetup, "bg-purple-500/10 border-purple-500/30 text-purple-600")}>
                Setup
              </button>
            </>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={posting || !content.trim()}
            className="ml-auto rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white text-sm font-semibold px-4 py-1.5 disabled:opacity-50"
          >
            {posting ? "Posting…" : parentId ? "Reply" : "Post"}
          </button>
        </div>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    </div>
  );
}
