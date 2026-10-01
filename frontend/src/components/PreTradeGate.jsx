// frontend/src/components/PreTradeGate.jsx
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  X,
  Send,
  ChevronRight,
  Maximize2,
  Minimize2,
  Square,
  Trash2,
} from "lucide-react";
import { useCoachChat } from "./coach/useCoachChat";
import MessageBubble from "./coach/MessageBubble";

const ROBOT_AVATAR =
  "https://img.magnific.com/premium-photo/robot-head-with-goggles-smile-it_7023-571826.jpg";

const MAX_CHARS = 2000;

const QUICK_PROMPTS = [
  "Review my recent trades",
  "What's my biggest leak?",
  "How's EURUSD looking right now?",
  "Any high-impact news today?",
  "I just took a loss — help me reset",
];

const STATUS_LABEL = {
  waiting: "Pulling live data…",
  thinking: "Thinking…",
};

const hiddenRoutes = ["/", "/login", "/verify", "/paywall", "/discord-gate", "/discord-callback", "/add-trade", "/register"];

export default function PreTradeGate() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, status, isBusy, send, stop, regenerate, clear } = useCoachChat(isOpen);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const stickToBottom = useRef(true);

  const onScroll = () => {
    const el = scrollRef.current;
    if (el) stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottom.current) el.scrollTo({ top: el.scrollHeight });
  }, [messages, status, isOpen, isFullscreen]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen, isFullscreen]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input, isOpen, isFullscreen]);

  useEffect(() => {
    if (!isOpen || !isFullscreen) return;
    const onKey = (e) => e.key === "Escape" && setIsFullscreen(false);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, isFullscreen]);

  const close = useCallback(() => {
    setIsOpen(false);
    setIsFullscreen(false);
  }, []);

  // All hooks must run before this early return (React error #300 otherwise).
  if (hiddenRoutes.includes(location.pathname)) return null;

  const submit = (text = input) => {
    if (!text.trim() || isBusy) return;
    stickToBottom.current = true;
    send(text);
    setInput("");
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const lastIdx = messages.length - 1;
  const showQuickPrompts = messages.length <= 1 && !isBusy;
  const column = `w-full mx-auto ${isFullscreen ? "max-w-3xl" : ""}`;

  const panelClass = isFullscreen
    ? "fixed inset-0 z-[60] bg-white/95 dark:bg-[#0d0e12]/95 backdrop-blur-xl flex flex-col animate-in fade-in"
    : "mb-4 w-[calc(100vw-2rem)] sm:w-[400px] h-[min(600px,calc(100dvh-8rem))] bg-white/80 dark:bg-[#121418]/80 backdrop-blur-xl border border-gray-200 dark:border-white/20 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5";

  const iconBtn =
    "p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors";

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {isOpen && (
        <div className={panelClass} role="dialog" aria-label="Coach isLIVE chat">
          <div className="bg-[#2f8df4] shrink-0">
            <div className={`${column} p-4 flex items-center justify-between`}>
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={ROBOT_AVATAR}
                  alt=""
                  className="w-9 h-9 rounded-full border border-white/30 object-cover"
                />
                <div className="min-w-0">
                  <h3 className="text-white font-bold text-sm truncate">Coach isLIVE</h3>
                  <p className="text-white/80 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                    Live market · Your journal
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <button onClick={clear} disabled={isBusy} className={`${iconBtn} disabled:opacity-40`} aria-label="New chat" title="New chat">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsFullscreen((v) => !v)}
                  className={iconBtn}
                  aria-label={isFullscreen ? "Exit full screen" : "Full screen"}
                  title={isFullscreen ? "Exit full screen (Esc)" : "Full screen"}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button onClick={close} className={iconBtn} aria-label="Close chat" title="Close">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div
            ref={scrollRef}
            onScroll={onScroll}
            role="log"
            aria-live="polite"
            className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#0d0e12]"
          >
            <div className={`${column} p-4 space-y-4`}>
              {messages.map((msg, idx) => (
                <MessageBubble
                  key={msg.id ?? idx}
                  message={msg}
                  isLast={idx === lastIdx}
                  canRegenerate={idx === lastIdx && messages.some((m) => m.sender === "user")}
                  onRegenerate={regenerate}
                  isBusy={isBusy}
                />
              ))}

              {STATUS_LABEL[status] && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-[#1a1d24] px-4 py-3 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex gap-1">
                      {[0, 150, 300].map((d) => (
                        <span key={d} className="w-1.5 h-1.5 rounded-full bg-[#2f8df4] animate-bounce" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </span>
                    {STATUS_LABEL[status]}
                  </div>
                </div>
              )}

              {showQuickPrompts && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {QUICK_PROMPTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => submit(p)}
                      className="text-xs px-3 py-1.5 rounded-full border border-[#2f8df4]/40 text-[#2f8df4] hover:bg-[#2f8df4]/10 transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-[#121418] border-t border-gray-200 dark:border-white/5 shrink-0">
            <div className={`${column} p-4`}>
              <div className="flex gap-2 items-end mb-2">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  maxLength={MAX_CHARS}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Ask about a pair, your trades, or how you're feeling…"
                  aria-label="Message"
                  className="flex-1 resize-none bg-gray-100 dark:bg-[#1a1d24] text-sm text-gray-900 dark:text-white border-none rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#2f8df4]"
                />
                {isBusy ? (
                  <button
                    onClick={stop}
                    aria-label="Stop generating"
                    title="Stop"
                    className="bg-gray-800 dark:bg-white/15 hover:bg-gray-700 text-white p-2.5 rounded-full transition-colors shrink-0"
                  >
                    <Square className="w-4 h-4 fill-current" />
                  </button>
                ) : (
                  <button
                    onClick={() => submit()}
                    disabled={!input.trim()}
                    aria-label="Send message"
                    className="bg-[#2f8df4] hover:bg-[#2376e8] disabled:bg-[#2f8df4]/50 text-white p-2.5 rounded-full transition-colors shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-gray-400 mb-3 flex justify-between">
                <span>AI can make mistakes. Not financial advice.</span>
                {input.length > MAX_CHARS * 0.8 && <span>{input.length}/{MAX_CHARS}</span>}
              </p>

              <button
                onClick={() => {
                  close();
                  navigate("/add-trade");
                }}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-full transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                I'm ready to trade, Thanks <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {!isOpen && (
        <button
          type="button"
          className="relative flex flex-col items-center cursor-pointer group"
          onClick={() => setIsOpen(true)}
          aria-label="Open Coach isLIVE chat"
        >
          <div className="absolute -top-12 bg-white dark:bg-[#1a1d24] text-gray-900 dark:text-white text-xs font-bold px-4 py-2 rounded-3xl shadow-lg border border-gray-100 dark:border-white/10 whitespace-nowrap transform transition-transform group-hover:-translate-y-1">
            Coach isLIVE
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white dark:border-t-[#1a1d24]"></div>
          </div>

          <div className="w-16 h-16 rounded-full overflow-hidden shadow-2xl border-[3px] border-[#2f8df4] bg-[#121418] transform transition-transform group-hover:scale-105">
            <img src={ROBOT_AVATAR} alt="" className="w-full h-full object-cover" />
          </div>
        </button>
      )}
    </div>
  );
}
