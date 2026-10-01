import { useState } from "react";
import { AlertTriangle, Check, Copy, RefreshCw } from "lucide-react";
import Markdown from "./Markdown";

const fmtPrice = (p) => (p >= 1000 ? p.toFixed(2) : p >= 100 ? p.toFixed(3) : p.toFixed(5));

function ContextChips({ context }) {
  if (!context) return null;
  const chips = [
    ...(context.quotes ?? []).map((q) => ({
      key: q.symbol,
      text: `${q.symbol} ${fmtPrice(q.price)}${q.stale ? " (delayed)" : ""}`,
      tone: q.stale ? "amber" : "green",
    })),
    context.news > 0 && { key: "news", text: `${context.news} news events`, tone: "blue" },
    context.journal > 0 && { key: "journal", text: `Journal · ${context.journal} trades`, tone: "blue" },
  ].filter(Boolean);
  if (!chips.length) return null;

  const tones = {
    green: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
    amber: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
    blue: "text-[#2f8df4] bg-[#2f8df4]/10",
  };
  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {chips.map((c) => (
        <span key={c.key} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${tones[c.tone]}`}>
          {c.tone === "green" && "● "}
          {c.text}
        </span>
      ))}
    </div>
  );
}

export default function MessageBubble({ message, isLast, canRegenerate, onRegenerate, isBusy }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.sender === "user";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable
    }
  };

  if (message.pending && !message.text) return null;

  return (
    <div className={`group flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[88%] ${isUser ? "" : "min-w-0"}`}>
        <div
          className={`px-4 py-3 rounded-3xl text-sm leading-relaxed shadow-sm ${
            isUser
              ? "bg-[#2f8df4] text-white whitespace-pre-wrap break-words"
              : "bg-white dark:bg-[#1a1d24] text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-white/5"
          }`}
        >
          {isUser ? (
            message.text
          ) : (
            <>
              <Markdown text={message.text} />
              {message.pending && (
                <span className="inline-block w-1.5 h-4 ml-0.5 align-middle bg-[#2f8df4] animate-pulse rounded-sm" />
              )}
            </>
          )}
          {message.error && (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-red-500">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{message.error}</span>
            </p>
          )}
          {message.stopped && <p className="mt-2 text-xs text-gray-400 italic">Stopped</p>}
        </div>

        {!isUser && <ContextChips context={message.context} />}

        {!isUser && !message.pending && message.text && message.id !== "welcome" && (
          <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <button
              onClick={copy}
              aria-label="Copy reply"
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            {isLast && canRegenerate && (
              <button
                onClick={onRegenerate}
                disabled={isBusy}
                aria-label="Regenerate reply"
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-40"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {!isUser && isLast && message.error && (
          <button
            onClick={onRegenerate}
            disabled={isBusy}
            className="mt-1.5 text-xs font-semibold text-[#2f8df4] hover:underline disabled:opacity-50"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
