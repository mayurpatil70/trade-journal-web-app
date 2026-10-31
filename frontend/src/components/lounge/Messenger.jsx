// frontend/src/components/lounge/Messenger.jsx
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Hash, Send, Search, CheckCheck, Check, Loader2, LineChart, X, ImagePlus, Reply, Pencil, Forward } from "lucide-react";
import api from "../../api/axios";
import { getSocket, useSocketEvent, useOnlineSet, emitWithAck } from "../../lib/socket";
import { Avatar, TraderName, RichText, timeAgo, formatMoney } from "./LoungeUI";
import UserHover from "./UserHoverCard";
import EmojiPicker from "./EmojiPicker";
import { MessageMenu, ReplyQuote, useMentions, MentionList, ForwardSheet } from "./MessageActions";

export const channelTitle = (c) => (c?.title?.startsWith("#") || !c?.server_id ? c?.title : `# ${c.title}`);

export function useConversations() {
  const [data, setData] = useState({ direct: [], channels: [] });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data: res } = await api.get("/api/social/conversations");
      setData(res);
    } catch {
      /* keep previous list */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useSocketEvent("message:received", (msg) => {
    setData((d) => {
      const bump = (list) =>
        list.map((c) =>
          c.id === msg.conversationId
            ? { ...c, lastMessage: { content: msg.content, sender_id: msg.senderId, created_at: msg.createdAt, is_trade_share: msg.isTradeShare } }
            : c,
        );
      const known = d.direct.some((c) => c.id === msg.conversationId) || d.channels.some((c) => c.id === msg.conversationId);
      if (!known) refresh();
      return { direct: bump(d.direct), channels: bump(d.channels) };
    });
  });

  const markUnread = useCallback((conversationId, unread) => {
    setData((d) => ({ ...d, direct: d.direct.map((c) => (c.id === conversationId ? { ...c, unread } : c)) }));
  }, []);

  return { ...data, loading, refresh, setData, markUnread };
}

export function TradeShareCard({ trade, mine }) {
  if (!trade) return null;
  const win = (trade.result || "").toUpperCase() === "WIN" || Number(trade.pnl) > 0;
  return (
    <div className={`mt-1 rounded-2xl p-3 min-w-[200px] border ${mine ? "bg-white/15 border-white/20" : "bg-white dark:bg-white/[0.04] border-black/[0.06] dark:border-white/[0.08]"}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold">
          <LineChart className="w-3.5 h-3.5" /> {trade.asset || "Trade"} · {(trade.direction || "").toUpperCase()}
        </span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${win ? "bg-emerald-500/20 text-emerald-500" : "bg-red-500/20 text-red-400"}`}>
          {(trade.result || (win ? "WIN" : "LOSS")).toUpperCase()}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-sm font-bold font-mono">{trade.pnl !== undefined && trade.pnl !== null ? formatMoney(trade.pnl) : "—"}</div>
          <div className="text-[9px] uppercase opacity-60">PnL</div>
        </div>
        <div>
          <div className="text-sm font-bold font-mono">{trade.rMultiple ?? "—"}R</div>
          <div className="text-[9px] uppercase opacity-60">R</div>
        </div>
        <div>
          <div className="text-sm font-bold font-mono truncate">{trade.setup || "—"}</div>
          <div className="text-[9px] uppercase opacity-60">Setup</div>
        </div>
      </div>
      {trade.date && <div className="mt-1.5 text-[10px] opacity-60">{trade.date}</div>}
    </div>
  );
}

export function ConversationList({ direct, channels, activeId, onSelect, onStartWith, loading, me }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const online = useOnlineSet();

  useEffect(() => {
    if (query.trim().length < 2) return setResults([]);
    const t = setTimeout(() => {
      api.get("/api/social/search", { params: { q: query } }).then(({ data }) => setResults(data)).catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const preview = (c) => {
    if (!c.lastMessage) return c.description || "Say hello 👋";
    const who = c.lastMessage.sender_id === me?.id ? "You: " : "";
    return who + (c.lastMessage.is_trade_share ? "📈 Shared a trade" : c.lastMessage.content);
  };

  const row = (c, icon) => (
    <button
      key={c.id}
      onClick={() => onSelect(c)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-colors ${
        activeId === c.id ? "bg-blue-500/10" : "hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
      }`}
    >
      {icon || <Avatar user={c.peer} size={42} online={c.peer ? online.has(c.peer.id) : undefined} />}
      <span className="flex-1 min-w-0">
        <span className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{c.peer?.displayName || c.title}</span>
          {c.lastMessage && <span className="text-[10px] text-neutral-400 shrink-0">{timeAgo(c.lastMessage.created_at)}</span>}
        </span>
        <span className="flex items-center justify-between gap-2">
          <span className={`text-xs truncate ${c.unread ? "text-neutral-900 dark:text-white font-semibold" : "text-neutral-500 dark:text-neutral-400"}`}>
            {preview(c)}
          </span>
          {c.unread > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#0066FF] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
              {c.unread > 99 ? "99+" : c.unread}
            </span>
          )}
        </span>
      </span>
    </button>
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="p-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search traders"
            className="w-full rounded-xl bg-black/[0.04] dark:bg-white/[0.06] pl-9 pr-3 py-2 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-[#0066FF]/30"
          />
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-3 space-y-0.5">
        {results.length > 0 && (
          <>
            <p className="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">Traders</p>
            {results.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  setQuery("");
                  onStartWith(u);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-black/[0.03] dark:hover:bg-white/[0.04] text-left"
              >
                <Avatar user={u} size={36} online={online.has(u.id)} />
                <span className="min-w-0">
                  <TraderName user={u} link={false} />
                  <span className="block text-xs text-neutral-500">@{u.handle}</span>
                </span>
              </button>
            ))}
          </>
        )}
        {channels.length > 0 && (
          <>
            <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">Channels</p>
            {channels.map((c) =>
              row(
                c,
                <span className="w-[42px] h-[42px] rounded-full bg-gradient-to-br from-[#0066FF] to-sky-400 text-white flex items-center justify-center shrink-0">
                  <Hash className="w-5 h-5" />
                </span>,
              ),
            )}
          </>
        )}
        <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">Direct messages</p>
        {loading ? (
          <div className="py-6 flex justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
          </div>
        ) : direct.length === 0 ? (
          <p className="px-3 py-2 text-xs text-neutral-500">Search a trader or tap Message on their profile to start chatting.</p>
        ) : (
          direct.map((c) => row(c))
        )}
      </div>
    </div>
  );
}

export function ChatThread({ conversation, me, onBack, backMobileOnly = false, canModerate = false, pendingTrade, onTradeSent, onRead }) {
  const [messages, setMessages] = useState([]);
  const [readState, setReadState] = useState({});
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [text, setText] = useState("");
  const [typers, setTypers] = useState({});
  const [sending, setSending] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const online = useOnlineSet();
  const scroller = useRef(null);
  const fileRef = useRef(null);
  const inputRef = useRef(null);
  const [replyTo, setReplyTo] = useState(null);
  const [editing, setEditing] = useState(null);
  const [forwarding, setForwarding] = useState(null);
  const [actionError, setActionError] = useState("");
  const stickToBottom = useRef(true);
  const lastTypingEmit = useRef(0);
  const convId = conversation.id;
  const isChannel = Boolean(conversation.is_public || conversation.is_group);

  const onReadRef = useRef(onRead);
  useLayoutEffect(() => {
    onReadRef.current = onRead;
  });

  const markRead = useCallback(
    (messageId) => {
      getSocket()?.emit("message:read", { conversationId: convId, messageId });
      onReadRef.current?.(convId);
    },
    [convId],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setMessages([]);
    const s = getSocket();
    s?.emit("room:join", convId);
    api
      .get(`/api/social/conversations/${convId}/messages`)
      .then(({ data }) => {
        if (cancelled) return;
        const list = Array.isArray(data?.messages) ? data.messages : [];
        setMessages(list);
        setReadState(data?.readState || {});
        setHasMore(Boolean(data?.hasMore));
        stickToBottom.current = true;
        if (list.length) markRead(list[list.length - 1].id);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));

    const rejoin = () => s?.emit("room:join", convId);
    s?.on("connect", rejoin);
    return () => {
      cancelled = true;
      s?.off("connect", rejoin);
      s?.emit("room:leave", convId);
    };
  }, [convId, markRead]);

  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages, typers]);

  useSocketEvent("message:received", (msg) => {
    if (msg.conversationId !== convId) return;
    setMessages((list) => (list.some((m) => m.id === msg.id) ? list : [...list, msg]));
    setTypers((t) => ({ ...t, [msg.senderId]: false }));
    if (msg.senderId !== me?.id) markRead(msg.id);
  });

  useSocketEvent("message:updated", (msg) => {
    if (msg.conversationId !== convId) return;
    setMessages((list) =>
      list.map((m) => {
        if (m.id === msg.id) return { ...msg, sender: msg.sender || m.sender };
        if (m.replyTo?.id === msg.id) {
          return { ...m, replyTo: { ...m.replyTo, content: msg.content.slice(0, 140), deleted: Boolean(msg.deletedAt) } };
        }
        return m;
      }),
    );
  });

  useSocketEvent("message:typing_status", ({ userId, conversationId, isTyping }) => {
    if (conversationId !== convId || userId === me?.id) return;
    setTypers((t) => ({ ...t, [userId]: isTyping }));
    if (isTyping) setTimeout(() => setTypers((t) => ({ ...t, [userId]: false })), 4000);
  });

  useSocketEvent("message:read_receipt", ({ conversationId, readBy, timestamp }) => {
    if (conversationId === convId) setReadState((r) => ({ ...r, [readBy]: timestamp }));
  });

  const loadOlder = async () => {
    if (!messages.length) return;
    const el = scroller.current;
    const prevHeight = el?.scrollHeight || 0;
    const { data } = await api.get(`/api/social/conversations/${convId}/messages`, { params: { before: messages[0].createdAt } });
    stickToBottom.current = false;
    setMessages((list) => [...data.messages, ...list]);
    setHasMore(data.hasMore);
    requestAnimationFrame(() => el && (el.scrollTop = el.scrollHeight - prevHeight));
  };

  const onType = (value) => {
    setText(value);
    const now = Date.now();
    if (now - lastTypingEmit.current > 2000) {
      lastTypingEmit.current = now;
      getSocket()?.emit("message:typing", { targetId: convId, isRoom: true, isTyping: true });
    }
  };

  const applyUpdate = (msg) => setMessages((list) => list.map((m) => (m.id === msg.id ? { ...msg, sender: msg.sender || m.sender } : m)));

  const saveEdit = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    const res = await emitWithAck("message:edit", { messageId: editing.id, content });
    setSending(false);
    if (res?.ok) {
      applyUpdate(res.message);
      setEditing(null);
      setText("");
    } else setActionError("Could not edit the message.");
  };

  const unsend = async (m) => {
    if (!window.confirm(m.senderId === me?.id ? "Unsend this message for everyone?" : "Delete this message for everyone?")) return;
    const res = await emitWithAck("message:delete", { messageId: m.id });
    if (res?.ok) applyUpdate(res.message);
    else setActionError("Could not delete the message.");
  };

  const startEdit = (m) => {
    setReplyTo(null);
    setEditing(m);
    setText(m.content || "");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const startReply = (m) => {
    setEditing(null);
    setReplyTo(m);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const cancelCompose = () => {
    if (editing) setText("");
    setEditing(null);
    setReplyTo(null);
  };

  const send = async (sharedTrade, chartUrl) => {
    if (editing && !sharedTrade && !chartUrl) return saveEdit();
    const content = text.trim();
    if ((!content && !sharedTrade && !chartUrl) || sending) return;
    setSending(true);
    setActionError("");
    stickToBottom.current = true;
    const res = await emitWithAck("message:send", { roomId: convId, content, sharedTrade, chartUrl, replyToId: replyTo?.id });
    setSending(false);
    if (res?.ok) {
      setText("");
      setReplyTo(null);
      setMessages((list) => (list.some((m) => m.id === res.message.id) ? list : [...list, res.message]));
      getSocket()?.emit("message:typing", { targetId: convId, isRoom: true, isTyping: false });
      if (sharedTrade) onTradeSent?.();
    }
  };

  const sendImage = async (file) => {
    if (!file) return;
    setUploadError("");
    setSending(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const { data } = await api.post("/api/social/uploads", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setSending(false);
      await send(undefined, data.url);
    } catch (err) {
      setSending(false);
      setUploadError(err.response?.data?.error || "Could not upload the photo.");
    }
  };

  const peer = conversation.peer;
  const mentionPool = useMemo(() => {
    const byId = new Map();
    if (peer) byId.set(peer.id, peer);
    for (const m of messages) if (m.sender?.id) byId.set(m.sender.id, m.sender);
    return [...byId.values()].reverse();
  }, [messages, peer]);
  const mentions = useMentions({ text, setText, inputRef, localUsers: mentionPool, meId: me?.id });
  const peerReadAt = peer ? readState[peer.id] : null;
  const lastMineId = [...messages].reverse().find((m) => m.senderId === me?.id)?.id;
  const typingNames = Object.entries(typers)
    .filter(([, v]) => v)
    .map(([id]) => (isChannel ? messages.find((m) => m.senderId === id)?.sender?.displayName || "Someone" : peer?.displayName));

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-3 px-3 py-2.5 border-b border-black/[0.05] dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.02] backdrop-blur-xl">
        {onBack && (
          <button onClick={onBack} className={`p-1.5 rounded-full hover:bg-black/[0.05] dark:hover:bg-white/[0.08] ${backMobileOnly ? "md:hidden" : ""}`} aria-label="Back">
            <ArrowLeft className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
          </button>
        )}
        {isChannel ? (
          <span className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0066FF] to-sky-400 text-white flex items-center justify-center">
            <Hash className="w-4 h-4" />
          </span>
        ) : (
          <UserHover user={peer}>
            <Avatar user={peer} size={36} online={peer ? online.has(peer.id) : undefined} />
          </UserHover>
        )}
        <div className="min-w-0">
          {isChannel ? (
            <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{channelTitle(conversation)}</p>
          ) : (
            <UserHover user={peer}>
              <TraderName user={peer} link={false} className="text-sm hover:underline" />
            </UserHover>
          )}
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
            {isChannel ? conversation.description : peer && online.has(peer.id) ? "Active now" : "Offline"}
          </p>
        </div>
      </div>

      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-1.5"
      >
        {hasMore && (
          <button onClick={loadOlder} className="mx-auto block text-xs font-semibold text-[#0066FF] py-1">
            Load earlier messages
          </button>
        )}
        {loading && (
          <div className="py-10 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
          </div>
        )}
        {messages.map((m, i) => {
          const mine = m.senderId === me?.id;
          const prev = messages[i - 1];
          const grouped =
            prev && prev.senderId === m.senderId && !m.replyTo && new Date(m.createdAt) - new Date(prev.createdAt) < 120000;
          const mentionsMe = !mine && m.mentions?.some((x) => x.id === me?.id);
          const menu = (
            <MessageMenu
              message={m}
              mine={mine}
              canModerate={canModerate}
              align={mine ? "right" : "left"}
              onReply={() => startReply(m)}
              onEdit={() => startEdit(m)}
              onDelete={() => unsend(m)}
              onForward={() => setForwarding(m)}
            />
          );
          return (
            <div key={m.id} id={`msg-${m.id}`} className={`group flex gap-2 ${mine ? "justify-end" : "justify-start"} ${grouped ? "" : "pt-2"}`}>
              {!mine &&
                (grouped ? (
                  <span className="w-8 shrink-0" />
                ) : (
                  <UserHover user={m.sender || { id: m.senderId }} className="shrink-0 self-start">
                    <Avatar user={m.sender} size={32} className="hover:opacity-85 transition-opacity" />
                  </UserHover>
                ))}
              <div className={`max-w-[78%] flex flex-col ${mine ? "items-end" : "items-start"}`}>
                {!mine && isChannel && !grouped && (
                  <UserHover user={m.sender || { id: m.senderId }} className="mb-0.5 ml-1">
                    <span className="text-[12px] font-semibold text-neutral-700 dark:text-neutral-200 hover:underline">{m.sender?.displayName}</span>
                    <span className="ml-1.5 text-[10px] text-neutral-400">{timeAgo(m.createdAt)}</span>
                  </UserHover>
                )}
                <ReplyQuote
                  reply={m.replyTo}
                  mine={mine}
                  onClick={() => document.getElementById(`msg-${m.replyTo?.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
                />
                <div className={`flex items-center gap-1 max-w-full ${mine ? "flex-row" : "flex-row-reverse"}`}>
                  {menu}
                  {m.deletedAt ? (
                    <div className="px-3.5 py-2 text-[13px] italic rounded-[20px] border border-black/[0.08] dark:border-white/[0.1] text-neutral-400">
                      {mine ? "You unsent a message" : "This message was deleted"}
                    </div>
                  ) : (
                    <div
                      className={`min-w-0 px-3.5 py-2 text-[14px] leading-snug rounded-[20px] ${
                        mine
                          ? "bg-[#0066FF] text-white rounded-br-md"
                          : mentionsMe
                            ? "bg-amber-400/15 ring-1 ring-amber-400/40 text-neutral-900 dark:text-neutral-100 rounded-bl-md"
                            : "bg-black/[0.05] dark:bg-white/[0.08] text-neutral-900 dark:text-neutral-100 rounded-bl-md"
                      }`}
                    >
                      {m.isForwarded && (
                        <span className={`flex items-center gap-1 text-[11px] italic mb-0.5 ${mine ? "text-white/75" : "text-neutral-500"}`}>
                          <Forward className="w-3 h-3" /> Forwarded
                        </span>
                      )}
                      {m.content && <RichText text={m.content} mentions={m.mentions} className={mine ? "[&_a]:text-white [&_span]:text-white" : ""} />}
                      {m.isTradeShare && <TradeShareCard trade={m.sharedTrade} mine={mine} />}
                      {m.mediaUrl && <img src={m.mediaUrl} alt="" className="mt-1 rounded-xl max-h-60" />}
                      {m.editedAt && <span className={`block text-[10px] mt-0.5 ${mine ? "text-white/70 text-right" : "text-neutral-400"}`}>edited</span>}
                    </div>
                  )}
                </div>
                {mine && m.id === lastMineId && !isChannel && (
                  <span className="text-[10px] text-neutral-400 mt-0.5 mr-1 inline-flex items-center gap-1">
                    {peerReadAt && new Date(peerReadAt) >= new Date(m.createdAt) ? (
                      <>
                        <CheckCheck className="w-3 h-3 text-[#0066FF]" /> Read
                      </>
                    ) : (
                      <>
                        <Check className="w-3 h-3" /> Delivered
                      </>
                    )}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {typingNames.length > 0 && (
          <div className="flex items-center gap-2 pt-2">
            <span className="inline-flex gap-1 px-3 py-2.5 rounded-[20px] rounded-bl-md bg-black/[0.05] dark:bg-white/[0.08]">
              {[0, 1, 2].map((d) => (
                <span key={d} className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: `${d * 120}ms` }} />
              ))}
            </span>
            {isChannel && <span className="text-[11px] text-neutral-400">{typingNames.join(", ")} typing…</span>}
          </div>
        )}
      </div>

      {pendingTrade && (
        <div className="mx-3 mb-2 p-2 rounded-2xl bg-blue-500/[0.06] border border-blue-500/15 flex items-center gap-2">
          <div className="flex-1 min-w-0 text-neutral-900 dark:text-white">
            <TradeShareCard trade={pendingTrade} />
          </div>
          <div className="flex flex-col gap-1">
            <button onClick={() => send(pendingTrade)} className="rounded-full bg-[#0066FF] text-white text-xs font-semibold px-3 py-1.5">
              Share
            </button>
            <button onClick={onTradeSent} className="rounded-full text-xs text-neutral-500 px-3 py-1 inline-flex items-center gap-1">
              <X className="w-3 h-3" /> Cancel
            </button>
          </div>
        </div>
      )}

      {(replyTo || editing) && (
        <div className="mx-3 mb-2 flex items-center gap-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.05] dark:border-white/[0.06] px-3 py-2">
          {editing ? <Pencil className="w-4 h-4 text-[#0066FF] shrink-0" /> : <Reply className="w-4 h-4 text-[#0066FF] shrink-0" />}
          <span className="flex-1 min-w-0 text-xs">
            <span className="block font-semibold text-neutral-800 dark:text-neutral-100">
              {editing ? "Editing message" : `Replying to ${replyTo.senderId === me?.id ? "yourself" : replyTo.sender?.displayName || "Trader"}`}
            </span>
            <span className="block truncate text-neutral-500">{(editing || replyTo).content || "Photo or trade"}</span>
          </span>
          <button type="button" onClick={cancelCompose} className="p-1 rounded-full hover:bg-black/[0.05] dark:hover:bg-white/[0.08]" aria-label="Cancel">
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>
      )}

      <MentionList suggestions={mentions.suggestions} index={mentions.index} onPick={mentions.pick} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-center gap-2 p-3 border-t border-black/[0.05] dark:border-white/[0.06]"
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            sendImage(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={sending || Boolean(editing)}
          className="w-9 h-9 shrink-0 rounded-full text-[#0066FF] hover:bg-blue-500/10 flex items-center justify-center disabled:opacity-40"
          aria-label="Send a photo"
          title="Send a photo"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
        </button>
        <EmojiPicker
          disabled={sending}
          onPick={(emoji) => {
            const el = inputRef.current;
            const start = el?.selectionStart ?? text.length;
            const end = el?.selectionEnd ?? text.length;
            const next = text.slice(0, start) + emoji + text.slice(end);
            onType(next);
            requestAnimationFrame(() => {
              el?.focus();
              el?.setSelectionRange(start + emoji.length, start + emoji.length);
            });
          }}
        />
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => {
            onType(e.target.value);
            mentions.onChange(e.target.value, e.target.selectionStart ?? e.target.value.length);
          }}
          onKeyDown={(e) => {
            if (mentions.onKeyDown(e)) return;
            if (e.key === "Escape" && (editing || replyTo)) cancelCompose();
          }}
          placeholder={isChannel ? `Message ${channelTitle(conversation)}` : "Message…"}
          maxLength={4000}
          className="flex-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] px-4 py-2 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-[#0066FF]/30"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="w-9 h-9 rounded-full bg-[#0066FF] text-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform"
          aria-label="Send"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
      {(uploadError || actionError) && <p className="px-4 pb-2 -mt-1 text-xs text-red-500">{uploadError || actionError}</p>}
      {forwarding && <ForwardSheet message={forwarding} onClose={() => setForwarding(null)} />}
    </div>
  );
}

export async function openDirect(userId) {
  const { data } = await api.post("/api/social/conversations/direct", { userId });
  return data;
}
