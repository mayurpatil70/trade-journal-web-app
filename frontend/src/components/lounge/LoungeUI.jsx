// frontend/src/components/lounge/LoungeUI.jsx
import { Fragment } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck } from "lucide-react";

export const glass =
  "rounded-3xl bg-white/80 dark:bg-[#12151e]/85 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]";

export const pill =
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors active:scale-[0.97]";

const GRADIENTS = [
  "from-sky-400 to-blue-600",
  "from-emerald-400 to-green-600",
  "from-amber-400 to-orange-600",
  "from-fuchsia-400 to-purple-600",
  "from-rose-400 to-red-600",
  "from-teal-400 to-cyan-600",
];

export function Avatar({ user, size = 40, online, className = "" }) {
  const name = user?.displayName || "T";
  const gradient = GRADIENTS[(user?.id || name).split("").reduce((a, c) => a + c.charCodeAt(0), 0) % GRADIENTS.length];
  return (
    <span className={`relative inline-flex shrink-0 ${className}`} style={{ width: size, height: size }}>
      {user?.avatarUrl ? (
        <img src={user.avatarUrl} alt={name} className="w-full h-full rounded-full object-cover" loading="lazy" />
      ) : (
        <span
          className={`w-full h-full rounded-full bg-gradient-to-br ${gradient} text-white font-bold flex items-center justify-center`}
          style={{ fontSize: size * 0.4 }}
        >
          {name.charAt(0).toUpperCase()}
        </span>
      )}
      {online !== undefined && (
        <span
          className={`absolute bottom-0 right-0 rounded-full ring-2 ring-white dark:ring-[#12151e] ${online ? "bg-emerald-500" : "bg-neutral-400"}`}
          style={{ width: Math.max(8, size * 0.26), height: Math.max(8, size * 0.26) }}
        />
      )}
    </span>
  );
}

export function TraderName({ user, link = true, className = "" }) {
  const body = (
    <span className={`inline-flex items-center gap-1 min-w-0 ${className}`}>
      <span className="font-semibold text-neutral-900 dark:text-white truncate">{user?.displayName || "Trader"}</span>
      {user?.isVerified && <BadgeCheck className="w-4 h-4 text-[#0066FF] dark:text-sky-400 shrink-0" />}
    </span>
  );
  return link && user?.id ? (
    <Link to={`/lounge/trader/${user.id}`} className="hover:underline min-w-0">
      {body}
    </Link>
  ) : (
    body
  );
}

export function PropBadges({ badges = [] }) {
  if (!badges.length) return null;
  return (
    <span className="inline-flex flex-wrap gap-1">
      {badges.map((b) => (
        <span
          key={b}
          className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
        >
          {b}
        </span>
      ))}
    </span>
  );
}

export function timeAgo(iso) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export const formatMoney = (n) =>
  `${n < 0 ? "-" : "+"}$${Math.abs(Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

const TOKEN_RE = /(@[a-zA-Z0-9_]{2,30}|\$[A-Za-z]{3,10}|\*\*[^*]+\*\*|https?:\/\/\S+)/g;

export function RichText({ text = "", className = "", mentions }) {
  const mentionIds = Object.fromEntries((mentions || []).map((m) => [m.handle.toLowerCase(), m.id]));
  return (
    <p className={`whitespace-pre-wrap break-words ${className}`}>
      {text.split(TOKEN_RE).map((part, i) => {
        if (!part) return null;
        const mentionId = part.startsWith("@") && mentionIds[part.slice(1).toLowerCase()];
        if (mentionId) {
          return (
            <Link
              key={i}
              to={`/lounge/trader/${mentionId}`}
              className="font-semibold rounded px-0.5 bg-blue-500/10 text-[#0066FF] dark:text-sky-400 hover:underline"
            >
              {part}
            </Link>
          );
        }
        if (part.startsWith("@") || part.startsWith("$")) {
          return (
            <span key={i} className="text-[#0066FF] dark:text-sky-400 font-semibold">
              {part}
            </span>
          );
        }
        if (part.startsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (part.startsWith("http")) {
          return (
            <a key={i} href={part} target="_blank" rel="noreferrer noopener" className="text-[#0066FF] dark:text-sky-400 underline break-all">
              {part}
            </a>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </p>
  );
}

export function SegmentedControl({ options, value, onChange, className = "" }) {
  return (
    <div className={`inline-flex p-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] ${className}`}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-3 sm:px-3.5 py-1.5 rounded-[9px] text-xs font-semibold transition-all whitespace-nowrap ${
            value === o.value
              ? "bg-white dark:bg-white/[0.12] text-neutral-900 dark:text-white shadow-sm"
              : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-[#0066FF] dark:text-sky-400 flex items-center justify-center mb-3">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <p className="text-sm font-semibold text-neutral-900 dark:text-white">{title}</p>
      {body && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-xs">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function FollowButton({ following, onClick, busy, size = "sm" }) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className={`${pill} ${size === "lg" ? "px-5 py-2 text-sm" : ""} ${
        following
          ? "bg-black/[0.05] dark:bg-white/[0.08] text-neutral-700 dark:text-neutral-200 hover:bg-red-500/10 hover:text-red-500"
          : "bg-[#0066FF] text-white hover:bg-[#0052CC] shadow-sm shadow-blue-500/30"
      } disabled:opacity-60`}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
