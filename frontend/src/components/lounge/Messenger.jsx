// frontend/src/components/lounge/Messenger.jsx
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, Hash, Send, Search, CheckCheck, Check, Loader2, LineChart, X } from "lucide-react";
import api from "../../api/axios";
import { getSocket, useSocketEvent, useOnlineSet, emitWithAck } from "../../lib/socket";
import { Avatar, TraderName, RichText, timeAgo, formatMoney } from "./LoungeUI";

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
        activeId === c.id ? "bg-[#0066FF]/10" : "hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
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
        <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">Channels</p>
        {channels.map((c) =>
          row(
            c,
            <span className="w-[42px] h-[42px] rounded-full bg-gradient-to-br from-[#0066FF] to-sky-400 text-white flex items-center justify-center shrink-0">
              <Hash className="w-5 h-5" />
            </span>,
          ),
        )}
        <p className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">Direct messages</p>
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

export function ChatThread({ conversation, me, onBack, pendingTrade, onTradeSent, onRead }) {
  const [messages, setMessages] = useState([]);
  const [readState, setReadState] = useState({});
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [text, setText] = useState("");
  const [typers, setTypers] = useState({});
  const [sending, setSending] = useState(false);
  const online = useOnlineSet();
  const scroller = useRef(null);
  const stickToBottom = useRef(true);
  const lastTypingEmit = useRef(0);
  const convId = conversation.id;
  const isChannel = conversation.is_public;

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
        setMessages(data.messages);
        setReadState(data.readState || {});
        setHasMore(data.hasMore);
        stickToBottom.current = true;
        if (data.messages.length) markRead(data.messages[data.messages.length - 1].id);
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

  const send = async (sharedTrade) => {
    const content = text.trim();
    if ((!content && !sharedTrade) || sending) return;
    setSending(true);
    stickToBottom.current = true;
    const res = await emitWithAck("message:send", { roomId: convId, content, sharedTrade });
    setSending(false);
    if (res?.ok) {
      setText("");
      setMessages((list) => (list.some((m) => m.id === res.message.id) ? list : [...list, res.message]));
      getSocket()?.emit("message:typing", { targetId: convId, isRoom: true, isTyping: false });
      if (sharedTrade) onTradeSent?.();
    }
  };

  const peer = conversation.peer;
  const peerReadAt = peer ? readState[peer.id] : null;
  const lastMineId = [...messages].reverse().find((m) => m.senderId === me?.id)?.id;
  const typingNames = Object.entries(typers)
    .filter(([, v]) => v)
    .map(([id]) => (isChannel ? messages.find((m) => m.senderId === id)?.sender?.displayName || "Someone" : peer?.displayName));

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-3 px-3 py-2.5 border-b border-black/[0.05] dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.02] backdrop-blur-xl">
        {onBack && (
          <button onClick={onBack} className="p-1.5 rounded-full hover:bg-black/[0.05] dark:hover:bg-white/[0.08]" aria-label="Back">
            <ArrowLeft className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
          </button>
        )}
        {isChannel ? (
          <span className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0066FF] to-sky-400 text-white flex items-center justify-center">
            <Hash className="w-4 h-4" />
          </span>
        ) : (
          <Avatar user={peer} size={36} online={peer ? online.has(peer.id) : undefined} />
        )}
        <div className="min-w-0">
          {isChannel ? (
            <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{conversation.title}</p>
          ) : (
            <TraderName user={peer} className="text-sm" />
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
          const grouped = prev && prev.senderId === m.senderId && new Date(m.createdAt) - new Date(prev.createdAt) < 120000;
          return (
            <div key={m.id} className={`flex gap-2 ${mine ? "justify-end" : "justify-start"} ${grouped ? "" : "pt-2"}`}>
              {!mine && isChannel && (grouped ? <span className="w-7 shrink-0" /> : <Avatar user={m.sender} size={28} />)}
              <div className={`max-w-[78%] flex flex-col ${mine ? "items-end" : "items-start"}`}>
                {!mine && isChannel && !grouped && (
                  <span className="text-[11px] font-semibold text-neutral-500 mb-0.5 ml-1">{m.sender?.displayName}</span>
                )}
                <div
                  className={`px-3.5 py-2 text-[14px] leading-snug rounded-[20px] ${
                    mine ? "bg-[#0066FF] text-white rounded-br-md" : "bg-black/[0.05] dark:bg-white/[0.08] text-neutral-900 dark:text-neutral-100 rounded-bl-md"
                  }`}
                >
                  {m.content && <RichText text={m.content} className={mine ? "[&_a]:text-white [&_span]:text-white" : ""} />}
                  {m.isTradeShare && <TradeShareCard trade={m.sharedTrade} mine={mine} />}
                  {m.mediaUrl && <img src={m.mediaUrl} alt="" className="mt-1 rounded-xl max-h-60" />}
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

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-center gap-2 p-3 border-t border-black/[0.05] dark:border-white/[0.06]"
      >
        <input
          value={text}
          onChange={(e) => onType(e.target.value)}
          placeholder={isChannel ? `Message ${conversation.title}` : "Message…"}
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
    </div>
  );
}

export async function openDirect(userId) {
  const { data } = await api.post("/api/social/conversations/direct", { userId });
  return data;
}
