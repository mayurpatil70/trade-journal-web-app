// frontend/src/pages/Profile.jsx
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Pencil,
  Scale,
  Globe,
  Clock,
  Monitor,
  CheckSquare,
  Square,
  Check,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Camera,
  X,
  CreditCard,
  Settings as SettingsIcon,
  TrendingUp,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import api from "../api/axios";

const DEFAULT_CHECKLIST = [
  { id: "1", text: "Checked higher timeframe", checked: true, order: 1 },
  { id: "2", text: "Risk within limits", checked: true, order: 2 },
  { id: "3", text: "Fits my trading plan", checked: true, order: 3 },
  { id: "4", text: "Key levels identified", checked: true, order: 4 },
  { id: "5", text: "Economic calendar checked", checked: true, order: 5 },
];

function formatLossStreak(val) {
  if (val === undefined || val === null || val === "") return "3 in a row";
  const s = String(val).trim();
  return s.toLowerCase().includes("row") ? s : `${s} in a row`;
}

function safeArray(val, fallback = []) {
  if (Array.isArray(val)) return val;
  if (typeof val === "string" && val.trim()) {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return val.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return fallback;
}

export default function Profile() {
  const navigate = useNavigate();
  const avatarInputRef = useRef(null);

  const userId = localStorage.getItem("userId") || localStorage.getItem("userEmail") || "trader";
  const userEmail = localStorage.getItem("userEmail") || "";

  // ── 1. HYDRATE INITIAL STATE FROM LOCALSTORAGE (Instant zero-flicker render) ──
  const [profile, setProfile] = useState(() => {
    let cached = {};
    try {
      cached = JSON.parse(localStorage.getItem(`trader_profile_${userId}`) || "{}");
    } catch (e) {
      cached = {};
    }
    return {
      displayName: cached.displayName || localStorage.getItem("userName") || (userEmail ? userEmail.split("@")[0] : "Trader"),
      username: cached.username || (userEmail ? userEmail.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "") : "trader"),
      bio: cached.bio || "Forex & Commodities trend trader. Focused on high-probability setups and disciplined risk.",
      avatarUrl: cached.avatarUrl || localStorage.getItem(`user_avatar_${userId}`) || localStorage.getItem("userAvatar") || "",
      plan: cached.plan || "FREE",
      joinedYear: cached.joinedYear || "2026",
    };
  });

  const [disciplineRules, setDisciplineRules] = useState(() => {
    let cached = {};
    try {
      cached = JSON.parse(localStorage.getItem(`trader_discipline_${userId}`) || "{}");
    } catch (e) {
      cached = {};
    }
    return {
      maxRiskPerTrade: cached.maxRiskPerTrade || "2%",
      maxTradesPerDay: cached.maxTradesPerDay || "5",
      dailyLossCap: cached.dailyLossCap || "5%",
      lossStreakBreak: cached.lossStreakBreak || "3 in a row",
      targetRR: cached.targetRR || "1:2",
      preferredSessions: cached.preferredSessions || ["London", "New York"],
      favoritePairs: cached.favoritePairs || ["EUR/USD", "GBP/USD", "XAU/USD"],
    };
  });

  const [preferences, setPreferences] = useState(() => {
    let cached = {};
    try {
      cached = JSON.parse(localStorage.getItem(`trader_preferences_${userId}`) || "{}");
    } catch (e) {
      cached = {};
    }
    return {
      currency: cached.currency || localStorage.getItem("display_currency") || "USD",
      timezone: cached.timezone || localStorage.getItem("timezone") || "UTC",
    };
  });

  const [checklist, setChecklist] = useState(() => {
    try {
      const saved = localStorage.getItem(`trader_checklist_${userId}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_CHECKLIST;
  });

  // Modal States
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isEditRulesOpen, setIsEditRulesOpen] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [newChecklistText, setNewChecklistText] = useState("");
  const [isAddingChecklistItem, setIsAddingChecklistItem] = useState(false);

  // Edit form staging
  const [editProfileForm, setEditProfileForm] = useState(profile);
  const [editRulesForm, setEditRulesForm] = useState(disciplineRules);

  // ── 2. FETCH LATEST PROFILE FROM SUPABASE BACKEND ──
  useEffect(() => {
    const fetchLatestProfile = async () => {
      try {
        const res = await api.get(`/api/auth/profile?userId=${encodeURIComponent(userId)}&email=${encodeURIComponent(userEmail)}`);
        if (res.data?.success && res.data.profile) {
          const p = res.data.profile;
          if (p.display_name || p.username || p.avatar_url) {
            setProfile((prev) => {
              const updated = {
                ...prev,
                displayName: p.display_name || prev.displayName,
                username: p.username || prev.username,
                bio: p.bio !== undefined ? p.bio : prev.bio,
                avatarUrl: p.avatar_url || prev.avatarUrl,
                plan: (p.current_plan || prev.plan).toUpperCase(),
                joinedYear: p.created_at ? new Date(p.created_at).getFullYear() : prev.joinedYear,
              };
              localStorage.setItem(`trader_profile_${userId}`, JSON.stringify(updated));
              return updated;
            });
          }

          if (p.discipline_rules) {
            setDisciplineRules((prev) => {
              const rules = {
                maxRiskPerTrade: p.discipline_rules.maxRiskPerTrade || prev.maxRiskPerTrade,
                maxTradesPerDay: String(p.discipline_rules.maxTradesPerDay || prev.maxTradesPerDay),
                dailyLossCap: p.discipline_rules.dailyLossCap || prev.dailyLossCap,
                lossStreakBreak: String(p.discipline_rules.lossStreakBreak || prev.lossStreakBreak),
                targetRR: p.discipline_rules.targetRR || prev.targetRR,
                preferredSessions: p.discipline_rules.preferredSessions || prev.preferredSessions,
                favoritePairs: p.discipline_rules.favoritePairs || prev.favoritePairs,
              };
              localStorage.setItem(`trader_discipline_${userId}`, JSON.stringify(rules));
              return rules;
            });
          }

          if (p.currency || p.timezone) {
            setPreferences((prev) => {
              const pref = {
                currency: p.currency || prev.currency,
                timezone: p.timezone || prev.timezone,
              };
              localStorage.setItem(`trader_preferences_${userId}`, JSON.stringify(pref));
              return pref;
            });
          }

          if (Array.isArray(p.pre_trade_checklist) && p.pre_trade_checklist.length > 0) {
            setChecklist(p.pre_trade_checklist);
            localStorage.setItem(`trader_checklist_${userId}`, JSON.stringify(p.pre_trade_checklist));
          }
        }
      } catch (err) {
        console.warn("[Profile] Backend profile fetch note:", err.message);
      }
    };

    fetchLatestProfile();
  }, [userId, userEmail]);

  // Sync checklist changes to local storage & backend
  const persistChecklist = async (updated) => {
    setChecklist(updated);
    localStorage.setItem(`trader_checklist_${userId}`, JSON.stringify(updated));
    try {
      await api.post("/api/auth/checklist", {
        userId,
        checklist: updated,
      });
    } catch (e) {
      console.warn("[Profile] Checklist sync notice:", e.message);
    }
  };

  // Toggle checklist item
  const handleToggleChecklist = (id) => {
    const updated = checklist.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    persistChecklist(updated);
  };

  // Move item up / down
  const handleMoveChecklist = (index, direction) => {
    const newIdx = direction === "up" ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= checklist.length) return;
    const updated = [...checklist];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;
    persistChecklist(updated);
  };

  // Delete checklist item
  const handleDeleteChecklistItem = (id) => {
    const updated = checklist.filter((item) => item.id !== id);
    persistChecklist(updated);
  };

  // Add new checklist item
  const handleAddChecklistItem = (e) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    const newItem = {
      id: String(Date.now()),
      text: newChecklistText.trim(),
      checked: true,
      order: checklist.length + 1,
    };
    const updated = [...checklist, newItem];
    persistChecklist(updated);
    setNewChecklistText("");
    setIsAddingChecklistItem(false);
  };

  // Reset checklist (check all items)
  const handleResetChecklist = () => {
    const updated = checklist.map((item) => ({ ...item, checked: false }));
    persistChecklist(updated);
  };

  // Instant Cloudinary Avatar Upload
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);
    formData.append("userId", userId);
    formData.append("email", userEmail);

    setIsUploadingAvatar(true);
    try {
      const res = await api.post("/api/auth/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.success && res.data.avatarUrl) {
        const newUrl = res.data.avatarUrl;
        setProfile((prev) => {
          const updated = { ...prev, avatarUrl: newUrl };
          localStorage.setItem(`trader_profile_${userId}`, JSON.stringify(updated));
          localStorage.setItem(`user_avatar_${userId}`, newUrl);
          localStorage.setItem("userAvatar", newUrl);
          return updated;
        });
      }
    } catch (err) {
      console.error("[Profile] Avatar upload error:", err);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Save Edit Profile Modal
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfile(editProfileForm);
    localStorage.setItem(`trader_profile_${userId}`, JSON.stringify(editProfileForm));
    if (editProfileForm.displayName) {
      localStorage.setItem("userName", editProfileForm.displayName);
    }
    setIsEditProfileOpen(false);

    try {
      await api.put("/api/auth/profile", {
        userId,
        email: userEmail,
        displayName: editProfileForm.displayName,
        username: editProfileForm.username,
        bio: editProfileForm.bio,
        avatarUrl: editProfileForm.avatarUrl,
      });
    } catch (err) {
      console.warn("[Profile] Profile save notice:", err.message);
    }
  };

  // Save Edit Rules Modal
  const handleSaveRules = async (e) => {
    e.preventDefault();
    setDisciplineRules(editRulesForm);
    localStorage.setItem(`trader_discipline_${userId}`, JSON.stringify(editRulesForm));
    setIsEditRulesOpen(false);

    try {
      await api.put("/api/auth/profile", {
        userId,
        disciplineRules: editRulesForm,
      });
    } catch (err) {
      console.warn("[Profile] Rules save notice:", err.message);
    }
  };

  const safeChecklist = safeArray(checklist, DEFAULT_CHECKLIST);
  const checkedCount = safeChecklist.filter((item) => item?.checked).length;
  const initialLetter = (profile.displayName || userEmail || "T").charAt(0).toUpperCase();

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24">
      {/* ── 1. USER PROFILE HEADER CARD (Screenshot 1) ── */}
      <div className="rounded-3xl p-6 bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-5">
          {/* Avatar with edit pencil overlay */}
          <div className="relative group">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-emerald-500/20 shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center font-black text-2xl shadow-md">
                {initialLetter}
              </div>
            )}

            {/* Hidden file input */}
            <input
              type="file"
              ref={avatarInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />

            {/* Instant upload badge button */}
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center border-2 border-white dark:border-[#121622] shadow-sm transition-transform active:scale-90 cursor-pointer"
              title="Upload new profile picture"
            >
              {isUploadingAvatar ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Pencil className="w-3 h-3" />
              )}
            </button>
          </div>

          {/* User Details */}
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                {profile.displayName}
              </h1>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-white/[0.08] text-neutral-600 dark:text-neutral-300 border border-black/[0.06] dark:border-white/[0.08] tracking-wider">
                {profile.plan}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              <span className="text-emerald-600 dark:text-emerald-400">@{profile.username}</span>
              <span>·</span>
              <span>Joined {profile.joinedYear}</span>
            </div>
          </div>
        </div>

        {/* Edit Profile Button */}
        <button
          type="button"
          onClick={() => {
            setEditProfileForm(profile);
            setIsEditProfileOpen(true);
          }}
          className="px-4 py-2 rounded-2xl border border-black/[0.08] dark:border-white/[0.1] bg-neutral-50 dark:bg-white/[0.04] hover:bg-neutral-100 dark:hover:bg-white/[0.08] text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>Edit Profile</span>
        </button>
      </div>

      {/* ── 2. TABS BAR (Screenshot 3: Profile, Settings, Billing; EXCLUDES MT5/Security as requested) ── */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-neutral-100 dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] w-fit shadow-xs">
        <button
          type="button"
          className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-white shadow-sm shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
        >
          <User className="w-3.5 h-3.5" />
          <span>Profile</span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/settings")}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.05] flex items-center gap-2 transition-colors cursor-pointer"
        >
          <SettingsIcon className="w-3.5 h-3.5" />
          <span>Settings</span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/paywall")}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.05] flex items-center gap-2 transition-colors cursor-pointer"
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Billing</span>
        </button>
      </div>

      {/* ── 3. TRADING RULES SECTION (Screenshot 2: 5 Cards with Edit Rules) ── */}
      <div className="rounded-3xl p-6 bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] space-y-4">
        {/* Section Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                Trading Rules
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Your personal risk ceiling · locked after onboarding
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditRulesForm(disciplineRules);
              setIsEditRulesOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-neutral-50 dark:bg-white/[0.04] hover:bg-neutral-100 dark:hover:bg-white/[0.08] text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Pencil className="w-3 h-3" />
            <span>Edit Rules</span>
          </button>
        </div>

        {/* 5 KPI Rules Cards (Screenshot 2) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* 1. MAX RISK / TRADE */}
          <div className="rounded-2xl p-4 bg-neutral-50/70 dark:bg-white/[0.025] border border-black/[0.06] dark:border-white/[0.07] hover:border-emerald-500/40 hover:bg-emerald-500/[0.02] hover:shadow-md transition-all">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                MAX RISK / TRADE
              </p>
            </div>
            <p className="text-xl font-extrabold font-mono text-neutral-900 dark:text-white mt-1.5">
              {disciplineRules.maxRiskPerTrade}
            </p>
          </div>

          {/* 2. MAX TRADES / DAY */}
          <div className="rounded-2xl p-4 bg-neutral-50/70 dark:bg-white/[0.025] border border-black/[0.06] dark:border-white/[0.07] hover:border-emerald-500/40 hover:bg-emerald-500/[0.02] hover:shadow-md transition-all">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                MAX TRADES / DAY
              </p>
            </div>
            <p className="text-xl font-extrabold font-mono text-neutral-900 dark:text-white mt-1.5">
              {disciplineRules.maxTradesPerDay}
            </p>
          </div>

          {/* 3. MAX DAILY LOSS */}
          <div className="rounded-2xl p-4 bg-neutral-50/70 dark:bg-white/[0.025] border border-black/[0.06] dark:border-white/[0.07] hover:border-emerald-500/40 hover:bg-emerald-500/[0.02] hover:shadow-md transition-all">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                MAX DAILY LOSS
              </p>
            </div>
            <p className="text-xl font-extrabold font-mono text-neutral-900 dark:text-white mt-1.5">
              {disciplineRules.dailyLossCap}
            </p>
          </div>

          {/* 4. LOSING STREAK */}
          <div className="rounded-2xl p-4 bg-neutral-50/70 dark:bg-white/[0.025] border border-black/[0.06] dark:border-white/[0.07] hover:border-emerald-500/40 hover:bg-emerald-500/[0.02] hover:shadow-md transition-all">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                LOSING STREAK
              </p>
            </div>
            <p className="text-xl font-extrabold font-mono text-neutral-900 dark:text-white mt-1.5">
              {formatLossStreak(disciplineRules.lossStreakBreak)}
            </p>
          </div>

          {/* 5. RISK / REWARD */}
          <div className="rounded-2xl p-4 bg-neutral-50/70 dark:bg-white/[0.025] border border-black/[0.06] dark:border-white/[0.07] hover:border-emerald-500/40 hover:bg-emerald-500/[0.02] hover:shadow-md transition-all">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                RISK / REWARD
              </p>
            </div>
            <p className="text-xl font-extrabold font-mono text-neutral-900 dark:text-white mt-1.5">
              {disciplineRules.targetRR}
            </p>
          </div>
        </div>
      </div>

      {/* ── 4. TWO COLUMNS: TRADING PREFERENCES & DISPLAY (Screenshot 1) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Trading Preferences */}
        <div className="lg:col-span-7 rounded-3xl p-6 bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Trading Preferences
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Sessions and pairs you focus on
                </p>
              </div>
            </div>

            {/* Sessions */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                <Clock className="w-3 h-3 text-emerald-500" />
                <span>SESSIONS</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {safeArray(disciplineRules.preferredSessions, ["London", "New York"]).map((s) => (
                  <span
                    key={s}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 shadow-2xs"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{s}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Favorite Pairs */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <span>FAVORITE PAIRS</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {safeArray(disciplineRules.favoritePairs, ["EUR/USD", "GBP/USD", "XAU/USD"]).map((pair) => (
                  <span
                    key={pair}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold border border-black/[0.06] dark:border-white/[0.08] bg-neutral-50 dark:bg-white/[0.03] text-neutral-800 dark:text-neutral-200"
                  >
                    {pair}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Display */}
        <div className="lg:col-span-5 rounded-3xl p-6 bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <Monitor className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Display
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  How values render across the app
                </p>
              </div>
            </div>

            {/* Currency & Timezone Cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-2xl p-3.5 bg-neutral-50/70 dark:bg-white/[0.025] border border-black/[0.06] dark:border-white/[0.07]">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  CURRENCY
                </p>
                <p className="text-base font-extrabold font-mono text-neutral-900 dark:text-white mt-1">
                  $ {preferences.currency}
                </p>
              </div>

              <div className="rounded-2xl p-3.5 bg-neutral-50/70 dark:bg-white/[0.025] border border-black/[0.06] dark:border-white/[0.07]">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  TIMEZONE
                </p>
                <p className="text-sm font-extrabold font-mono text-neutral-900 dark:text-white mt-1 truncate">
                  {preferences.timezone}
                </p>
              </div>
            </div>
          </div>

          {/* Footer Navigation Link to Settings */}
          <div className="flex items-center justify-between pt-3 border-t border-black/[0.05] dark:border-white/[0.06]">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Edit in the Settings tab
            </span>
            <button
              type="button"
              onClick={() => navigate("/settings")}
              className="px-3 py-1.5 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-neutral-50 dark:bg-white/[0.04] hover:bg-neutral-100 dark:hover:bg-white/[0.08] text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-2xs"
            >
              <SettingsIcon className="w-3 h-3" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 5. PRE-TRADE CHECKLIST (Screenshot 4: Interactive, Reorderable, User-Addable Items) ── */}
      <div className="rounded-3xl p-6 bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] space-y-4">
        {/* Section Header */}
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                Pre-Trade Checklist
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Applied to every new trade and daily session check-in
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-neutral-100 dark:bg-white/[0.06] text-neutral-700 dark:text-neutral-300">
              {checkedCount}/{safeChecklist.length} items
            </span>
            <button
              type="button"
              onClick={handleResetChecklist}
              className="px-3 py-1.5 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-neutral-50 dark:bg-white/[0.04] hover:bg-neutral-100 dark:hover:bg-white/[0.08] text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-2xs"
              title="Reset checklist"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Checklist Rows */}
        <div className="space-y-2">
          {safeChecklist.map((item, idx) => (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl bg-neutral-50/70 dark:bg-white/[0.025] border border-black/[0.06] dark:border-white/[0.07] hover:border-emerald-500/30 flex items-center justify-between gap-3 transition-all group"
            >
              {/* Checkbox + Text */}
              <div
                onClick={() => handleToggleChecklist(item.id)}
                className="flex items-center gap-3 flex-1 cursor-pointer select-none"
              >
                <div
                  className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                    item.checked
                      ? "bg-emerald-500 border-emerald-500 text-white shadow-xs"
                      : "border-black/20 dark:border-white/20 bg-white dark:bg-white/[0.04]"
                  }`}
                >
                  {item.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <span
                  className={`text-xs font-bold transition-colors ${
                    item.checked
                      ? "text-neutral-900 dark:text-white"
                      : "text-neutral-500 dark:text-neutral-400 line-through opacity-75"
                  }`}
                >
                  {item.text}
                </span>
              </div>

              {/* Action Buttons: Up, Down, Delete */}
              <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => handleMoveChecklist(idx, "up")}
                  disabled={idx === 0}
                  className="p-1 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-white/[0.08] disabled:opacity-20 text-neutral-500 dark:text-neutral-400 transition-colors cursor-pointer"
                  title="Move Up"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveChecklist(idx, "down")}
                  disabled={idx === checklist.length - 1}
                  className="p-1 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-white/[0.08] disabled:opacity-20 text-neutral-500 dark:text-neutral-400 transition-colors cursor-pointer"
                  title="Move Down"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteChecklistItem(item.id)}
                  className="p-1 rounded-lg hover:bg-rose-500/10 text-neutral-400 hover:text-rose-500 transition-colors cursor-pointer ml-1"
                  title="Delete Item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Item Trigger / Form */}
        {isAddingChecklistItem ? (
          <form onSubmit={handleAddChecklistItem} className="pt-2 flex items-center gap-2">
            <input
              type="text"
              autoFocus
              value={newChecklistText}
              onChange={(e) => setNewChecklistText(e.target.value)}
              placeholder="e.g. Check for news high impact events..."
              className="flex-1 px-4 py-2.5 rounded-2xl bg-neutral-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs font-semibold text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/15 transition-all"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingChecklistItem(false);
                setNewChecklistText("");
              }}
              className="px-3 py-2.5 rounded-2xl bg-neutral-100 dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-300 text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsAddingChecklistItem(true)}
            className="w-full py-3 rounded-2xl border border-dashed border-black/15 dark:border-white/15 text-xs font-bold text-neutral-500 dark:text-neutral-400 hover:border-emerald-500/50 hover:text-emerald-500 dark:hover:text-emerald-400 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        )}
      </div>

      {/* ── EDIT PROFILE MODAL ── */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#121622] border border-black/[0.08] dark:border-white/[0.12] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/[0.08]">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Edit Profile
              </h3>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.08] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editProfileForm.displayName}
                  onChange={(e) => setEditProfileForm({ ...editProfileForm, displayName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs font-semibold text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1">
                  Username Handle
                </label>
                <input
                  type="text"
                  value={editProfileForm.username}
                  onChange={(e) => setEditProfileForm({ ...editProfileForm, username: e.target.value.replace(/^@/, "") })}
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs font-semibold text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1">
                  Trader Bio
                </label>
                <textarea
                  rows="3"
                  value={editProfileForm.bio}
                  onChange={(e) => setEditProfileForm({ ...editProfileForm, bio: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs font-semibold text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-white/[0.06] text-neutral-700 dark:text-neutral-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT RULES MODAL ── */}
      {isEditRulesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#121622] border border-black/[0.08] dark:border-white/[0.12] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/[0.08]">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Edit Trading Rules
              </h3>
              <button
                type="button"
                onClick={() => setIsEditRulesOpen(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.08] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRules} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1">
                  Max Risk / Trade
                </label>
                <input
                  type="text"
                  value={editRulesForm.maxRiskPerTrade}
                  onChange={(e) => setEditRulesForm({ ...editRulesForm, maxRiskPerTrade: e.target.value })}
                  placeholder="e.g. 2%"
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs font-semibold text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1">
                  Max Trades / Day
                </label>
                <input
                  type="text"
                  value={editRulesForm.maxTradesPerDay}
                  onChange={(e) => setEditRulesForm({ ...editRulesForm, maxTradesPerDay: e.target.value })}
                  placeholder="e.g. 5"
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs font-semibold text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1">
                  Max Daily Loss
                </label>
                <input
                  type="text"
                  value={editRulesForm.dailyLossCap}
                  onChange={(e) => setEditRulesForm({ ...editRulesForm, dailyLossCap: e.target.value })}
                  placeholder="e.g. 5%"
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs font-semibold text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1">
                  Losing Streak
                </label>
                <input
                  type="text"
                  value={editRulesForm.lossStreakBreak}
                  onChange={(e) => setEditRulesForm({ ...editRulesForm, lossStreakBreak: e.target.value })}
                  placeholder="e.g. 3 in a row"
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs font-semibold text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1">
                  Risk / Reward Ratio
                </label>
                <input
                  type="text"
                  value={editRulesForm.targetRR}
                  onChange={(e) => setEditRulesForm({ ...editRulesForm, targetRR: e.target.value })}
                  placeholder="e.g. 1:2"
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs font-semibold text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditRulesOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-white/[0.06] text-neutral-700 dark:text-neutral-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-sm"
                >
                  Save Rules
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
