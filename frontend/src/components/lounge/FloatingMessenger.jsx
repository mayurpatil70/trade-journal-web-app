// frontend/src/components/lounge/FloatingMessenger.jsx
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { MessageCircle, X, Maximize2 } from "lucide-react";
import api from "../../api/axios";
import { ChatThread, ConversationList, useConversations, openDirect } from "./Messenger";
import { useSocketEvent } from "../../lib/socket";

const HIDDEN_ON = ["/lounge/chat", "/messages"];

export default function FloatingMessenger() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(null);
  const [pendingTrade, setPendingTrade] = useState(null);
  const [me, setMe] = useState(null);
  const convos = useConversations();
  const { refresh } = convos;
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/api/social/me").then(({ data }) => setMe(data)).catch(() => {});
  }, []);

  useEffect(() => {
    const onOpenChat = async (e) => {
      setOpen(true);
      try {
        setActive(await openDirect(e.detail.peer.id));
        refresh();
      } catch {
        setActive(null);
      }
    };
    const onShareTrade = (e) => {
      setPendingTrade(e.detail.trade);
      setActive(null);
      setOpen(true);
    };
    window.addEventListener("lounge:open-chat", onOpenChat);
    window.addEventListener("lounge:share-trade", onShareTrade);
    return () => {
      window.removeEventListener("lounge:open-chat", onOpenChat);
      window.removeEventListener("lounge:share-trade", onShareTrade);
    };
  }, [refresh]);

  useSocketEvent("message:received", (msg) => {
    if (msg.senderId === me?.id || msg.conversationId === active?.id) return;
    convos.setData((d) => ({
      ...d,
      direct: d.direct.map((c) => (c.id === msg.conversationId ? { ...c, unread: (c.unread || 0) + 1 } : c)),
    }));
  });

  const unread = convos.direct.reduce((n, c) => n + (c.unread || 0), 0);
  if (HIDDEN_ON.some((p) => location.pathname.startsWith(p))) return null;

  const startWith = async (user) => {
    setActive(await openDirect(user.id));
    convos.refresh();
  };

  return createPortal(
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed z-[60] bottom-20 right-4 sm:bottom-6 sm:right-6 inline-flex items-center gap-2 pl-3.5 pr-4 py-2.5 rounded-full bg-white/80 dark:bg-[#161a24]/85 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.1] shadow-[0_12px_40px_rgba(0,0,0,0.15)] text-sm font-semibold text-neutral-900 dark:text-white hover:scale-[1.03] active:scale-95 transition-transform"
        >
          <span className="relative">
            <MessageCircle className="w-5 h-5 text-[#0066FF]" />
            {unread > 0 && (
              <span className="absolute -top-2 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#161a24]">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </span>
          Messages
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[9400] sm:inset-auto sm:top-4 sm:bottom-4 sm:right-4 sm:w-[390px] flex">
          <div className="absolute inset-0 bg-black/30 sm:hidden" onClick={() => setOpen(false)} />
          <div className="relative ml-auto w-full h-full flex flex-col rounded-none sm:rounded-3xl overflow-hidden bg-white/90 dark:bg-[#12151e]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.1] shadow-[0_24px_80px_rgba(0,0,0,0.25)] animate-in slide-in-from-right-8 fade-in duration-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.05] dark:border-white/[0.06]">
              <span className="text-sm font-bold text-neutral-900 dark:text-white">{pendingTrade && !active ? "Share trade with…" : "Messages"}</span>
              <span className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setOpen(false);
                    navigate(active && !active.is_public && active.peer ? `/messages?with=${active.peer.id}` : "/messages");
                  }}
                  className="p-1.5 rounded-full hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
                  aria-label="Open full screen"
                >
                  <Maximize2 className="w-4 h-4 text-neutral-500" />
                </button>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-full hover:bg-black/[0.05] dark:hover:bg-white/[0.08]" aria-label="Close">
                  <X className="w-4 h-4 text-neutral-500" />
                </button>
              </span>
            </div>
            <div className="flex-1 min-h-0">
              {active ? (
                <ChatThread
                  key={active.id}
                  conversation={active}
                  me={me}
                  pendingTrade={pendingTrade}
                  onTradeSent={() => setPendingTrade(null)}
                  onBack={() => setActive(null)}
                  onRead={(id) => convos.markUnread(id, 0)}
                />
              ) : (
                <ConversationList {...convos} me={me} onSelect={setActive} onStartWith={startWith} />
              )}
            </div>
          </div>
        </div>
      )}
    </>,
    document.body,
  );
}
