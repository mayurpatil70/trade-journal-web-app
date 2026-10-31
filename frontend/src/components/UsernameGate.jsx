import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import api from "../api/axios";

const USERNAME_RE = /^[a-z0-9_.]{3,20}$/;

export default function UsernameGate() {
  const [needed, setNeeded] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("fn_username")) return undefined;
    let cancelled = false;
    api
      .get("/api/auth/profile")
      .then(({ data }) => {
        const name = data?.profile?.username;
        if (name) localStorage.setItem("fn_username", name);
        else if (!cancelled) setNeeded(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!needed) return null;

  const submit = async (e) => {
    e.preventDefault();
    const username = value.trim().toLowerCase();
    if (!USERNAME_RE.test(username)) {
      setError("3-20 characters: letters, numbers, dot or underscore.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.put("/api/auth/profile", { username });
      localStorage.setItem("fn_username", username);
      setNeeded(false);
    } catch (err) {
      setError(err.response?.data?.error || "Could not save your username.");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-white dark:bg-black p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Choose your username</h1>
        <p className="text-sm text-neutral-500">Traders will see you as @username across the dashboard, community and leaderboard.</p>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">@</span>
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))}
            maxLength={20}
            autoComplete="username"
            className="w-full pl-8 pr-3 py-3 rounded-xl bg-neutral-100 dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.1] text-sm font-semibold text-neutral-900 dark:text-white outline-none focus:border-blue-500"
          />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={saving || value.length < 3}
          className="w-full py-3 rounded-xl bg-[#007aff] text-white text-sm font-semibold disabled:opacity-50"
        >
          {saving ? "Saving…" : "Continue"}
        </button>
      </form>
    </div>,
    document.body,
  );
}
