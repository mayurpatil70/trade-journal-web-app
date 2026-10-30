import { useState } from "react";
import { createPortal } from "react-dom";
import { Link2, Plus, Trash2, X, GripVertical } from "lucide-react";

const PLATFORMS = [
  { re: /(^|\.)instagram\.com$/, name: "Instagram", color: "#E1306C" },
  { re: /(^|\.)(x|twitter)\.com$/, name: "X", color: "#111111" },
  { re: /(^|\.)(youtube\.com|youtu\.be)$/, name: "YouTube", color: "#FF0000" },
  { re: /(^|\.)tradingview\.com$/, name: "TradingView", color: "#2962FF" },
  { re: /(^|\.)(t\.me|telegram\.me)$/, name: "Telegram", color: "#229ED9" },
  { re: /(^|\.)(discord\.gg|discord\.com)$/, name: "Discord", color: "#5865F2" },
  { re: /(^|\.)linkedin\.com$/, name: "LinkedIn", color: "#0A66C2" },
  { re: /(^|\.)tiktok\.com$/, name: "TikTok", color: "#111111" },
  { re: /(^|\.)github\.com$/, name: "GitHub", color: "#24292F" },
  { re: /(^|\.)facebook\.com$/, name: "Facebook", color: "#1877F2" },
  { re: /(^|\.)threads\.net$/, name: "Threads", color: "#111111" },
  { re: /(^|\.)myfxbook\.com$/, name: "Myfxbook", color: "#1F8A4C" },
];

const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

export function describeLink(link) {
  const host = hostOf(link.url);
  const platform = PLATFORMS.find((p) => p.re.test(host));
  const path = (() => {
    try {
      return new URL(link.url).pathname.replace(/\/$/, "");
    } catch {
      return "";
    }
  })();
  return {
    host,
    label: link.title || platform?.name || host,
    display: `${host}${path}`.slice(0, 48),
    color: platform?.color || "#0066FF",
    initial: (platform?.name || host).charAt(0).toUpperCase(),
  };
}

function LinkBadge({ link, size = 32 }) {
  const d = describeLink(link);
  return (
    <span
      className="rounded-full text-white font-bold flex items-center justify-center shrink-0"
      style={{ width: size, height: size, background: d.color, fontSize: size * 0.42 }}
    >
      {d.initial}
    </span>
  );
}

export function LinksSheet({ links, title = "Links", onClose }) {
  return createPortal(
    <div className="fixed inset-0 z-[9500] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="w-full sm:max-w-sm max-h-[75vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#161a24] border border-black/[0.06] dark:border-white/[0.08] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between px-4 py-3 bg-white/85 dark:bg-[#161a24]/85 backdrop-blur-xl border-b border-black/[0.05] dark:border-white/[0.06]">
          <span className="w-7" />
          <span className="text-sm font-bold text-neutral-900 dark:text-white">{title}</span>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/[0.05] dark:hover:bg-white/[0.08]" aria-label="Close">
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>
        <div className="p-2">
          {links.map((l, i) => {
            const d = describeLink(l);
            return (
              <a
                key={`${l.url}-${i}`}
                href={l.url}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
              >
                <LinkBadge link={l} size={36} />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-neutral-900 dark:text-white truncate">{d.label}</span>
                  <span className="block text-xs text-neutral-500 truncate">{d.display}</span>
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}

// Instagram-style: first link inline, "and N more" opens the full list.
export function ProfileLinks({ links = [], className = "" }) {
  const [open, setOpen] = useState(false);
  if (!links.length) return null;
  const first = describeLink(links[0]);
  return (
    <>
      <div className={`flex items-center gap-1.5 text-sm min-w-0 ${className}`}>
        <Link2 className="w-4 h-4 text-[#0066FF] dark:text-sky-400 shrink-0 -rotate-45" />
        <a
          href={links[0].url}
          target="_blank"
          rel="noreferrer noopener"
          onClick={(e) => {
            if (links.length > 1) {
              e.preventDefault();
              setOpen(true);
            }
          }}
          className="font-semibold text-[#00376B] dark:text-sky-300 hover:underline truncate"
        >
          {first.display}
          {links.length > 1 && ` and ${links.length - 1} more`}
        </a>
      </div>
      {open && <LinksSheet links={links} onClose={() => setOpen(false)} />}
    </>
  );
}

export function LinkChips({ links = [], max = 4 }) {
  const [open, setOpen] = useState(false);
  if (!links.length) return null;
  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {links.slice(0, max).map((l, i) => {
          const d = describeLink(l);
          return (
            <a
              key={`${l.url}-${i}`}
              href={l.url}
              target="_blank"
              rel="noreferrer noopener"
              title={l.url}
              className="inline-flex items-center gap-1.5 max-w-[150px] pl-1 pr-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.07] hover:bg-black/[0.07] dark:hover:bg-white/[0.1] text-xs font-semibold text-neutral-700 dark:text-neutral-200"
            >
              <LinkBadge link={l} size={18} />
              <span className="truncate">{d.label}</span>
            </a>
          );
        })}
        {links.length > max && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.07] text-xs font-semibold text-[#0066FF] dark:text-sky-400"
          >
            +{links.length - max} more
          </button>
        )}
      </div>
      {open && <LinksSheet links={links} onClose={() => setOpen(false)} />}
    </>
  );
}

const field =
  "w-full rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] px-3 py-2 text-sm text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-[#0066FF]/40";

export function LinksEditor({ links = [], onChange }) {
  const update = (i, patch) => onChange(links.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const move = (from, to) => {
    if (to < 0 || to >= links.length) return;
    const next = [...links];
    next.splice(to, 0, next.splice(from, 1)[0]);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {links.map((l, i) => (
        <div key={i} className="flex items-start gap-2 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.06] p-2">
          <button
            type="button"
            onClick={() => move(i, i - 1)}
            className="mt-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 disabled:opacity-30"
            disabled={i === 0}
            aria-label="Move link up"
            title="Move up"
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0 space-y-1.5">
            <input className={field} placeholder="Title (optional), e.g. My YouTube" maxLength={40} value={l.title || ""} onChange={(e) => update(i, { title: e.target.value })} />
            <input className={field} placeholder="https://" inputMode="url" maxLength={300} value={l.url || ""} onChange={(e) => update(i, { url: e.target.value })} />
          </div>
          <button
            type="button"
            onClick={() => onChange(links.filter((_, j) => j !== i))}
            className="mt-2 p-1 rounded-full text-neutral-400 hover:text-red-500 hover:bg-red-500/10"
            aria-label="Remove link"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...links, { title: "", url: "" }])}
        className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#0066FF]/40 text-[#0066FF] dark:text-sky-400 text-sm font-semibold py-2 hover:bg-blue-500/[0.06]"
      >
        <Plus className="w-4 h-4" /> Add link
      </button>
    </div>
  );
}

export const tidyLinks = (links = []) =>
  links
    .map((l) => ({ title: String(l.title || "").trim(), url: String(l.url || "").trim() }))
    .filter((l) => l.url)
    .map((l) => ({ ...l, url: /^https?:\/\//i.test(l.url) ? l.url : `https://${l.url}` }));
