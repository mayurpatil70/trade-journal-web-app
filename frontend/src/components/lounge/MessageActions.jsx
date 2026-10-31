import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Ellipsis, Reply, Copy, Pencil, Trash2, Forward, Hash, Search, Check, Loader2, X } from "lucide-react";
import api from "../../api/axios";
import { emitWithAck } from "../../lib/socket";
import { Avatar } from "./LoungeUI";

const MENU_W = 196;

export function MessageMenu({ message, mine, canModerate, onReply, onEdit, onDelete, onForward, align = "left" }) {
  const btn = useRef(null);
  const [pos, setPos] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!pos) return undefined;
    const close = () => setPos(null);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [pos]);

  if (message.deletedAt) return null;

  const items = [
    { label: "Reply", icon: Reply, run: onReply },
    message.content && {
      label: copied ? "Copied" : "Copy",
      icon: copied ? Check : Copy,
      keepOpen: true,
      run: async () => {
        try {
          await navigator.clipboard.writeText(message.content);
        } catch {
          window.prompt("Copy message", message.content);
        }
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
          setPos(null);
        }, 700);
      },
    },
    { label: "Forward", icon: Forward, run: onForward },
    mine && message.content !== undefined && !message.isTradeShare && { label: "Edit", icon: Pencil, run: onEdit },
    (mine || canModerate) && { label: mine ? "Unsend" : "Delete", icon: Trash2, run: onDelete, danger: true },
  ].filter(Boolean);

  const open = () => {
    const r = btn.current.getBoundingClientRect();
    const height = items.length * 40 + 12;
    const left = Math.min(Math.max(8, align === "right" ? r.right - MENU_W : r.left), window.innerWidth - MENU_W - 8);
    const top = r.bottom + height + 8 > window.innerHeight ? Math.max(8, r.top - height - 4) : r.bottom + 4;
    setPos({ top, left });
  };

  return (
    <>
      <button
        ref={btn}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          pos ? setPos(null) : open();
        }}
        aria-label="Message options"
        className={`self-center shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-opacity ${
          pos ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus:opacity-100 pointer-coarse:opacity-60"
        }`}
      >
        <Ellipsis className="w-4 h-4" />
      </button>
      {pos &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[9590]" onClick={() => setPos(null)} />
            <div
              style={{ top: pos.top, left: pos.left, width: MENU_W }}
              className="fixed z-[9600] rounded-2xl bg-white/95 dark:bg-[#1b2030]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.1] shadow-[0_16px_48px_rgba(0,0,0,0.2)] p-1.5 animate-in fade-in zoom-in-95 duration-100"
            >
              {items.map(({ label, icon: Icon, run, danger, keepOpen }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    if (!keepOpen) setPos(null);
                    run();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium hover:bg-black/[0.04] dark:hover:bg-white/[0.06] ${
                    danger ? "text-red-500" : "text-neutral-800 dark:text-neutral-100"
                  }`}
                >
                  {label}
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </>,
          document.body,
        )}
    </>
  );
}

export function ReplyQuote({ reply, mine, onClick }) {
  if (!reply) return null;
  const text = reply.deleted ? "Message unsent" : reply.content || (reply.hasMedia ? "Photo or trade" : "");
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mb-1 max-w-full text-left rounded-2xl px-3 py-1.5 border-l-[3px] text-xs ${
        mine ? "bg-blue-500/10 border-blue-500 text-neutral-600 dark:text-neutral-300" : "bg-black/[0.04] dark:bg-white/[0.06] border-neutral-400 text-neutral-500"
      }`}
    >
      <span className="block font-semibold text-neutral-700 dark:text-neutral-200">{reply.senderName}</span>
      <span className={`block truncate max-w-[260px] ${reply.deleted ? "italic" : ""}`}>{text}</span>
    </button>
  );
}

const MENTION_AT_CARET = /(^|\s)@([a-zA-Z0-9_.]{0,30})$/;

export function useMentions({ text, setText, inputRef, localUsers, meId }) {
  const [query, setQuery] = useState(null);
  const [remote, setRemote] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!query || query.length < 2) return undefined;
    const t = setTimeout(() => {
      api
        .get("/api/social/search", { params: { q: query } })
        .then(({ data }) => setRemote(Array.isArray(data) ? data : []))
        .catch(() => setRemote([]));
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  const q = (query || "").toLowerCase();
  const seen = new Set([String(meId)]);
  const suggestions =
    query === null
      ? []
      : [...localUsers, ...(q.length >= 2 ? remote : [])]
          .filter((u) => u?.handle && !seen.has(String(u.id)) && seen.add(String(u.id)))
          .filter((u) => !q || u.handle.toLowerCase().startsWith(q) || (u.displayName || "").toLowerCase().includes(q))
          .slice(0, 6);

  const onChange = (value, caret) => {
    const m = value.slice(0, caret).match(MENTION_AT_CARET);
    setQuery(m ? m[2] : null);
    setIndex(0);
    if (!m || m[2].length < 2) setRemote([]);
  };

  const pick = (user) => {
    const el = inputRef.current;
    const caret = el?.selectionStart ?? text.length;
    const before = text.slice(0, caret).replace(/@([a-zA-Z0-9_.]{0,30})$/, `@${user.handle} `);
    const next = before + text.slice(caret);
    setText(next);
    setQuery(null);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(before.length, before.length);
    });
  };

  // Returns true when the key was used by the suggestion list.
  const onKeyDown = (e) => {
    if (!suggestions.length) return false;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => (i + (e.key === "ArrowDown" ? 1 : suggestions.length - 1)) % suggestions.length);
      return true;
    }
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      pick(suggestions[index] || suggestions[0]);
      return true;
    }
    if (e.key === "Escape") {
      setQuery(null);
      return true;
    }
    return false;
  };

  return { suggestions, index, pick, onChange, onKeyDown };
}

export function MentionList({ suggestions, index, onPick }) {
  if (!suggestions.length) return null;
  return (
    <div className="mx-3 mb-2 rounded-2xl bg-white/95 dark:bg-[#1b2030]/95 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.1] shadow-lg p-1.5">
      <p className="px-2 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">Mention a trader</p>
      {suggestions.map((u, i) => (
        <button
          key={u.id}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onPick(u);
          }}
          className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-xl text-left ${i === index ? "bg-blue-500/10" : "hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"}`}
        >
          <Avatar user={u} size={28} />
          <span className="min-w-0 text-sm">
            <span className="font-semibold text-neutral-900 dark:text-white">{u.displayName}</span>{" "}
            <span className="text-neutral-500">@{u.handle}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

export function ForwardSheet({ message, onClose }) {
  const [convos, setConvos] = useState(null);
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState([]);
  const [status, setStatus] = useState({});

  useEffect(() => {
    api
      .get("/api/social/conversations")
      .then(({ data }) => setConvos([...(data.direct || []), ...(data.channels || [])]))
      .catch(() => setConvos([]));
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) return undefined;
    const t = setTimeout(() => {
      api
        .get("/api/social/search", { params: { q: query } })
        .then(({ data }) => setPeople(Array.isArray(data) ? data : []))
        .catch(() => setPeople([]));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const forward = async (key, target) => {
    setStatus((s) => ({ ...s, [key]: "sending" }));
    const res = await emitWithAck("message:send", {
      ...target,
      content: message.content,
      chartUrl: message.mediaUrl,
      sharedTrade: message.isTradeShare ? message.sharedTrade : undefined,
      forwarded: true,
    });
    setStatus((s) => ({ ...s, [key]: res?.ok ? "sent" : "error" }));
  };

  const q = query.trim().toLowerCase();
  const shownConvos = (convos || []).filter((c) => !q || (c.peer?.displayName || c.title || "").toLowerCase().includes(q));
  const knownPeers = new Set((convos || []).map((c) => c.peer?.id).filter(Boolean));

  const row = (key, label, sub, avatar, target) => (
    <div key={key} className="flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-black/[0.03] dark:hover:bg-white/[0.04]">
      {avatar}
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold text-neutral-900 dark:text-white truncate">{label}</span>
        {sub && <span className="block text-xs text-neutral-500 truncate">{sub}</span>}
      </span>
      <button
        type="button"
        disabled={status[key] === "sending" || status[key] === "sent"}
        onClick={() => forward(key, target)}
        className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold ${
          status[key] === "sent" ? "bg-black/[0.05] dark:bg-white/[0.08] text-neutral-600 dark:text-neutral-300" : "bg-[#0066FF] text-white"
        } disabled:opacity-80`}
      >
        {status[key] === "sending" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : status[key] === "sent" ? "Sent" : status[key] === "error" ? "Retry" : "Send"}
      </button>
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 z-[9500] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full sm:max-w-sm max-h-[80vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#161a24] border border-black/[0.06] dark:border-white/[0.08] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <span className="text-base font-bold text-neutral-900 dark:text-white">Forward</span>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/[0.05] dark:hover:bg-white/[0.08]" aria-label="Close">
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              autoFocus
              className="w-full rounded-xl bg-black/[0.04] dark:bg-white/[0.06] pl-9 pr-3 py-2 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-[#0066FF]/30"
            />
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-4">
          {!convos ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
            </div>
          ) : (
            <>
              {shownConvos.map((c) =>
                row(
                  c.id,
                  c.peer?.displayName || c.title,
                  c.peer ? `@${c.peer.handle}` : c.description,
                  c.peer ? (
                    <Avatar user={c.peer} size={40} />
                  ) : (
                    <span className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0066FF] to-sky-400 text-white flex items-center justify-center shrink-0">
                      <Hash className="w-4 h-4" />
                    </span>
                  ),
                  { roomId: c.id },
                ),
              )}
              {q.length >= 2 &&
                people
                  .filter((u) => !knownPeers.has(u.id))
                  .map((u) => row(`u-${u.id}`, u.displayName, `@${u.handle}`, <Avatar user={u} size={40} />, { recipientId: u.id }))}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
