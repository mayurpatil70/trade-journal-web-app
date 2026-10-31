import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { X, Camera, Loader2, Copy, Check, Share2, RefreshCw, Globe, Lock, Hash } from "lucide-react";
import api from "../../api/axios";
import { SegmentedControl } from "../lounge/LoungeUI";

export const field =
  "w-full rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] px-3 py-2.5 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-[#0066FF]/40";
const primaryBtn =
  "w-full rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-sm font-semibold py-2.5 disabled:opacity-50 active:scale-[0.99] transition";

export const inviteUrl = (code) => `${window.location.origin}/community/invite/${code}`;
export const errorText = (err, fallback) => err?.response?.data?.error || fallback;

export function ServerIcon({ server, size = 48, rounded = "rounded-[16px]", className = "" }) {
  const initials = (server?.name || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
  return server?.iconUrl ? (
    <img src={server.iconUrl} alt={server.name} className={`object-cover shrink-0 ${rounded} ${className}`} style={{ width: size, height: size }} />
  ) : (
    <span
      className={`shrink-0 bg-gradient-to-br from-[#0066FF] to-sky-400 text-white font-bold flex items-center justify-center ${rounded} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.34 }}
    >
      {initials}
    </span>
  );
}

export function Sheet({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[9500] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#161a24] border border-black/[0.06] dark:border-white/[0.08] shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden flex justify-center pt-2">
          <span className="w-10 h-1 rounded-full bg-black/15 dark:bg-white/20" />
        </div>
        <div className="flex items-center justify-between px-5 pt-3 sm:pt-5">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/[0.05] dark:hover:bg-white/[0.08]" aria-label="Close">
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>
        <div className="p-5 space-y-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

function IconPicker({ server, iconUrl, onChange }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("image", file);
      const { data } = await api.post("/api/social/uploads", fd, { headers: { "Content-Type": "multipart/form-data" } });
      onChange(data.url);
    } catch (err) {
      setError(errorText(err, "Could not upload the icon."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="relative w-20 h-20 rounded-full border-2 border-dashed border-[#0066FF]/40 flex items-center justify-center overflow-hidden hover:bg-blue-500/[0.05]"
        aria-label="Upload server icon"
      >
        {iconUrl ? (
          <ServerIcon server={{ ...server, iconUrl }} size={80} rounded="rounded-full" />
        ) : (
          <Camera className="w-6 h-6 text-[#0066FF]" />
        )}
        {busy && (
          <span className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          </span>
        )}
      </button>
      <span className="text-[11px] text-neutral-500">{iconUrl ? "Tap to change icon" : "Upload an icon"}</span>
      {error && <span className="text-xs text-red-500">{error}</span>}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          upload(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function VisibilityPicker({ isPublic, onChange }) {
  return (
    <div className="space-y-1.5">
      <SegmentedControl
        className="w-full [&>button]:flex-1"
        options={[
          { value: "public", label: "Public" },
          { value: "private", label: "Private" },
        ]}
        value={isPublic ? "public" : "private"}
        onChange={(v) => onChange(v === "public")}
      />
      <p className="text-xs text-neutral-500 flex items-start gap-1.5">
        {isPublic ? <Globe className="w-3.5 h-3.5 mt-px shrink-0" /> : <Lock className="w-3.5 h-3.5 mt-px shrink-0" />}
        {isPublic ? "Anyone can find it in Discover and join." : "Hidden from Discover. People join only with your invite link."}
      </p>
    </div>
  );
}

const parseInvite = (value) => {
  const v = value.trim();
  const m = v.match(/\/community\/invite\/([A-Za-z0-9_-]+)/);
  return m ? m[1] : v.replace(/[^A-Za-z0-9_-]/g, "");
};

export function CreateServerDialog({ onClose, onCreated }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", description: "", iconUrl: "", isPublic: true });
  const [invite, setInvite] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const create = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { data } = await api.post("/api/social/servers", form);
      onCreated?.(data.server);
      onClose();
      navigate(`/community/s/${data.server.id}/${data.channels[0].id}`);
    } catch (err) {
      setError(errorText(err, "Could not create the server."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet title="Create a server" onClose={onClose}>
      <form onSubmit={create} className="space-y-4">
        <p className="text-sm text-neutral-500 -mt-2">A home for your trading group: channels, chat and invite links.</p>
        <IconPicker server={form} iconUrl={form.iconUrl} onChange={(url) => set("iconUrl", url)} />
        <input className={field} placeholder="Server name" maxLength={60} value={form.name} onChange={(e) => set("name", e.target.value)} required />
        <textarea
          className={`${field} resize-none`}
          rows={2}
          placeholder="What is it about? (optional)"
          maxLength={300}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />
        <VisibilityPicker isPublic={form.isPublic} onChange={(v) => set("isPublic", v)} />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button type="submit" disabled={saving || form.name.trim().length < 2} className={primaryBtn}>
          {saving ? "Creating…" : "Create server"}
        </button>
      </form>

      <div className="pt-2 border-t border-black/[0.05] dark:border-white/[0.06] space-y-2">
        <p className="text-xs font-semibold text-neutral-500">Have an invite already?</p>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const code = parseInvite(invite);
            if (!code) return;
            onClose();
            navigate(`/community/invite/${code}`);
          }}
        >
          <input className={field} placeholder="Paste an invite link" value={invite} onChange={(e) => setInvite(e.target.value)} />
          <button type="submit" disabled={!invite.trim()} className="shrink-0 px-4 rounded-xl bg-black/[0.05] dark:bg-white/[0.08] text-sm font-semibold text-neutral-800 dark:text-white disabled:opacity-50">
            Join
          </button>
        </form>
      </div>
    </Sheet>
  );
}

export function InviteDialog({ server, canManage, onClose, onReset }) {
  const [code, setCode] = useState(server.inviteCode);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const link = inviteUrl(code);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this invite link", link);
    }
  };

  const reset = async () => {
    if (!window.confirm("Reset the invite link? The old link will stop working.")) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/api/social/servers/${server.id}/invite/reset`);
      setCode(data.inviteCode);
      onReset?.(data.inviteCode);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet title={`Invite friends to ${server.name}`} onClose={onClose}>
      <div className="flex items-center gap-3">
        <ServerIcon server={server} size={44} />
        <p className="text-sm text-neutral-500">
          Share this link. Anyone with it can join{server.isPublic ? "" : " this private server"}.
        </p>
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] p-1.5 pl-3">
        <span className="flex-1 min-w-0 truncate text-sm font-mono text-neutral-800 dark:text-neutral-200">{link}</span>
        <button onClick={copy} className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-[#0066FF] text-white text-xs font-semibold px-3 py-2">
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {navigator.share && (
          <button
            onClick={() => navigator.share({ title: server.name, text: `Join ${server.name} on Forex Notes`, url: link }).catch(() => {})}
            className="inline-flex items-center gap-1.5 rounded-xl bg-black/[0.05] dark:bg-white/[0.08] px-3 py-2 text-xs font-semibold text-neutral-800 dark:text-white"
          >
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
        )}
        {canManage && (
          <button
            onClick={reset}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-xl bg-black/[0.05] dark:bg-white/[0.08] px-3 py-2 text-xs font-semibold text-neutral-800 dark:text-white disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${busy ? "animate-spin" : ""}`} /> Reset link
          </button>
        )}
      </div>
    </Sheet>
  );
}

export function CreateChannelDialog({ server, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const slug = name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9_-]/g, "");

  const create = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { data } = await api.post(`/api/social/servers/${server.id}/channels`, { name: slug, description });
      onCreated(data);
      onClose();
    } catch (err) {
      setError(errorText(err, "Could not create the channel."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet title="Create channel" onClose={onClose}>
      <form onSubmit={create} className="space-y-4">
        <div className="relative">
          <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input className={`${field} pl-9`} placeholder="new-channel" maxLength={30} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <input className={field} placeholder="Topic (optional)" maxLength={200} value={description} onChange={(e) => setDescription(e.target.value)} />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button type="submit" disabled={saving || slug.length < 2} className={primaryBtn}>
          {saving ? "Creating…" : "Create channel"}
        </button>
      </form>
    </Sheet>
  );
}

export function ServerSettingsDialog({ server, isOwner, onClose, onSaved, onDeleted }) {
  const [form, setForm] = useState({
    name: server.name,
    description: server.description || "",
    iconUrl: server.iconUrl || "",
    isPublic: server.isPublic,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { data } = await api.patch(`/api/social/servers/${server.id}`, form);
      onSaved(data);
      onClose();
    } catch (err) {
      setError(errorText(err, "Could not save changes."));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete ${server.name}? All channels and messages will be removed for everyone.`)) return;
    try {
      await api.delete(`/api/social/servers/${server.id}`);
      onClose();
      onDeleted();
    } catch (err) {
      setError(errorText(err, "Could not delete the server."));
    }
  };

  return (
    <Sheet title="Server settings" onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <IconPicker server={form} iconUrl={form.iconUrl} onChange={(url) => set("iconUrl", url)} />
        <input className={field} placeholder="Server name" maxLength={60} value={form.name} onChange={(e) => set("name", e.target.value)} required />
        <textarea
          className={`${field} resize-none`}
          rows={2}
          placeholder="Description"
          maxLength={300}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />
        <VisibilityPicker isPublic={form.isPublic} onChange={(v) => set("isPublic", v)} />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button type="submit" disabled={saving} className={primaryBtn}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
      {isOwner && (
        <button onClick={remove} className="w-full rounded-xl text-red-500 bg-red-500/[0.08] hover:bg-red-500/[0.14] text-sm font-semibold py-2.5">
          Delete server
        </button>
      )}
    </Sheet>
  );
}
