// frontend/src/pages/Profile.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPortal } from "react-dom";
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
  Download,
  AlertTriangle,
  BookOpen,
  Calendar,
  ArrowUp,
  ArrowDown,
  FileText,
  Table,
  FileType,
  Eye,
  Brain,
  Target,
  ArrowRight,
  Image as ImageIcon,
  CheckCircle2,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import AppleSelect from "../components/ui/AppleSelect";
import api from "../api/axios";

const DEFAULT_CHECKLIST = [
  { id: "1", text: "Checked higher timeframe", checked: true, order: 1 },
  { id: "2", text: "Risk within limits", checked: true, order: 2 },
  { id: "3", text: "Fits my trading plan", checked: true, order: 3 },
  { id: "4", text: "Key levels identified", checked: true, order: 4 },
  { id: "5", text: "Economic calendar checked", checked: true, order: 5 },
];

const CURRENCY_OPTIONS = [
  { code: "USD", symbol: "$", label: "USD - US Dollar ($)" },
  { code: "EUR", symbol: "€", label: "EUR - Euro (€)" },
  { code: "GBP", symbol: "£", label: "GBP - British Pound (£)" },
  { code: "JPY", symbol: "¥", label: "JPY - Japanese Yen (¥)" },
  { code: "AUD", symbol: "A$", label: "AUD - Australian Dollar (A$)" },
  { code: "CAD", symbol: "C$", label: "CAD - Canadian Dollar (C$)" },
  { code: "CHF", symbol: "Fr", label: "CHF - Swiss Franc (Fr)" },
  { code: "INR", symbol: "₹", label: "INR - Indian Rupee (₹)" },
];

const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "America/New York (EST/EDT, UTC-5 / -4)" },
  { value: "America/Chicago", label: "America/Chicago (CST/CDT, UTC-6 / -5)" },
  { value: "America/Los_Angeles", label: "America/Los Angeles (PST/PDT, UTC-8 / -7)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST, UTC+0 / +1)" },
  { value: "Europe/Berlin", label: "Europe/Berlin (CET/CEST, UTC+1 / +2)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST, UTC+4)" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST, UTC+5:30)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT, UTC+8)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (JST, UTC+9)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (AEST/AEDT, UTC+10 / +11)" },
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

const normalizeTradeR = (t) => {
  if (!t) return 0;
  const isLoss = (t.result || "").toLowerCase() === "loss";
  const isBe = (t.result || "").toLowerCase() === "be";
  const num = Number(t.r_multiple ?? t.rMultiple ?? 0);
  if (isLoss) {
    if (num > 0) return -num;
    if (num === 0) return -1;
    return num;
  }
  if (isBe) return 0;
  return num;
};

export default function Profile({ defaultTab }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const avatarInputRef = useRef(null);

  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    tabParam === "settings" || tabParam === "billing" ? tabParam : defaultTab || "profile"
  );

  useEffect(() => {
    const current = searchParams.get("tab");
    if (current === "settings" || current === "billing") {
      setActiveTab(current);
    } else if (!current && defaultTab) {
      setActiveTab(defaultTab);
    } else if (!current) {
      setActiveTab("profile");
    }
  }, [searchParams, defaultTab]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    if (newTab === "profile") {
      searchParams.delete("tab");
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ tab: newTab }, { replace: true });
    }
  };

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

  const [prefSaveNotice, setPrefSaveNotice] = useState("");

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

  // ── SETTINGS TAB DATA & STATES ──
  const [exporting, setExporting] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [historyTrades, setHistoryTrades] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedTrade, setSelectedTrade] = useState(null);

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

  // ── 3. FETCH HISTORY TRADES WHEN SETTINGS TAB IS ACTIVE ──
  useEffect(() => {
    if (activeTab !== "settings") return;
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const response = await api.get(`/api/trades?userId=${encodeURIComponent(userId)}`);
        if (response.data.success) {
          setHistoryTrades(response.data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch journal history:", error);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [activeTab, userId]);

  // Sync preference updates immediately to state, localStorage & backend
  const handleUpdatePreference = async (key, value) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    localStorage.setItem(`trader_preferences_${userId}`, JSON.stringify(updated));
    if (key === "currency") localStorage.setItem("display_currency", value);
    if (key === "timezone") localStorage.setItem("timezone", value);

    setPrefSaveNotice("Preferences saved");
    setTimeout(() => setPrefSaveNotice(""), 2500);

    try {
      await api.put("/api/auth/profile", {
        userId,
        [key]: value,
      });
    } catch (err) {
      console.warn("[Profile] Preference save warning:", err.message);
    }
  };

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

  // Reset checklist (uncheck all items for a fresh trading day)
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

  // ── EXPORT JOURNAL DATA ──
  const handleExport = async (format, tradeId = null) => {
    if (!userId) return alert("User session not found.");
    const exportKey = tradeId ? `${format}-${tradeId}` : format;
    setExporting(exportKey);
    try {
      const urlQuery = tradeId
        ? `/api/trades/export?userId=${encodeURIComponent(userId)}&format=${format}&tradeId=${tradeId}`
        : `/api/trades/export?userId=${encodeURIComponent(userId)}&format=${format}`;

      const response = await api.get(urlQuery, {
        responseType: "blob",
        timeout: 120000,
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const ext = { excel: "xlsx", doc: "docx" }[format] || format;
      const downloadName = tradeId && selectedTrade
        ? `trade_${selectedTrade.asset || "detail"}_${selectedTrade.date || "export"}.${ext}`
        : `trade_journal.${ext}`;
      link.setAttribute("download", downloadName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(error);
      alert(`Failed to export as ${format.toUpperCase()}.`);
    } finally {
      setExporting("");
    }
  };

  // ── DELETE TRADE ──
  const handleDeleteTrade = async (tradeId) => {
    if (!window.confirm("Are you sure you want to delete this trade?")) return;
    try {
      await api.delete(`/api/trades/${tradeId}`);
      setHistoryTrades((prev) => prev.filter((t) => t.id !== tradeId));
      if (selectedTrade?.id === tradeId) setSelectedTrade(null);
    } catch (error) {
      console.error("Delete Trade Error:", error);
      alert("Failed to delete trade.");
    }
  };

  // ── DELETE ALL TRADES (DANGER ZONE) ──
  const handleDeleteAllTrades = async () => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete all your trades? This action cannot be undone."
      )
    )
      return;

    setDeleting(true);
    try {
      await api.delete(`/api/trades/all?userId=${encodeURIComponent(userId)}`);
      setHistoryTrades([]);
      setSelectedTrade(null);
      alert("All trades have been wiped successfully.");
    } catch (error) {
      console.error(error);
      alert("Failed to delete trades.");
    } finally {
      setDeleting(false);
    }
  };

  const safeChecklist = safeArray(checklist, DEFAULT_CHECKLIST);
  const checkedCount = safeChecklist.filter((item) => item?.checked).length;
  const initialLetter = (profile.displayName || userEmail || "T").charAt(0).toUpperCase();

  const exportFormats = [
    { fmt: "csv", label: "CSV", icon: Table, color: "from-emerald-500/20 to-green-500/20", border: "border-emerald-500/20", text: "text-emerald-500 dark:text-emerald-400" },
    { fmt: "excel", label: "Excel", icon: Table, color: "from-emerald-500/20 to-teal-500/20", border: "border-emerald-500/20", text: "text-emerald-500 dark:text-emerald-400" },
    { fmt: "doc", label: "Word (1 Trade / Page)", icon: FileText, color: "from-blue-500/10 to-indigo-500/10", border: "border-blue-500/20", text: "text-blue-500 dark:text-blue-400" },
    { fmt: "pdf", label: "PDF (1 Trade / Page)", icon: FileType, color: "from-rose-500/15 to-red-500/15", border: "border-rose-500/25", text: "text-rose-500 dark:text-rose-400" },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24">
      {/* ── 1. USER PROFILE HEADER CARD (macOS / iOS Bento Style) ── */}
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
              onChange={handleAvatarUpload}
              accept="image/*"
              className="hidden"
            />

            {/* Camera / Pencil overlay button */}
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-md transition-transform hover:scale-110 active:scale-95 cursor-pointer disabled:opacity-50"
              title="Change avatar photo"
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

      {/* ── 2. TABS BAR: Profile, Settings, Billing ── */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-neutral-100 dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] w-fit shadow-xs">
        <button
          type="button"
          onClick={() => handleTabChange("profile")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === "profile"
              ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Profile</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("settings")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === "settings"
              ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
          }`}
        >
          <SettingsIcon className="w-3.5 h-3.5" />
          <span>Settings</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("billing")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === "billing"
              ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Billing</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TAB 1: PROFILE OVERVIEW
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          {/* ── TRADING RULES SECTION (5 Bento Cards + Edit Rules) ── */}
          <div className="rounded-3xl p-6 bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center">
                  <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
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
                className="px-4 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm shadow-emerald-500/25 active:scale-95 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Rules</span>
              </button>
            </div>

            {/* 5 Rules Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
              <div className="rounded-2xl p-4 bg-neutral-50/70 dark:bg-white/[0.025] border border-black/[0.06] dark:border-white/[0.07]">
                <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  MAX RISK / TRADE
                </div>
                <p className="text-xl sm:text-2xl font-black font-mono text-neutral-900 dark:text-white mt-1.5">
                  {disciplineRules.maxRiskPerTrade || "2%"}
                </p>
              </div>

              <div className="rounded-2xl p-4 bg-neutral-50/70 dark:bg-white/[0.025] border border-black/[0.06] dark:border-white/[0.07]">
                <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  MAX TRADES / DAY
                </div>
                <p className="text-xl sm:text-2xl font-black font-mono text-neutral-900 dark:text-white mt-1.5">
                  {disciplineRules.maxTradesPerDay || "5"}
                </p>
              </div>

              <div className="rounded-2xl p-4 bg-neutral-50/70 dark:bg-white/[0.025] border border-black/[0.06] dark:border-white/[0.07]">
                <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  MAX DAILY LOSS
                </div>
                <p className="text-xl sm:text-2xl font-black font-mono text-neutral-900 dark:text-white mt-1.5">
                  {disciplineRules.dailyLossCap || "5%"}
                </p>
              </div>

              <div className="rounded-2xl p-4 bg-neutral-50/70 dark:bg-white/[0.025] border border-black/[0.06] dark:border-white/[0.07]">
                <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  LOSING STREAK
                </div>
                <p className="text-lg sm:text-xl font-black font-mono text-neutral-900 dark:text-white mt-2 truncate">
                  {formatLossStreak(disciplineRules.lossStreakBreak)}
                </p>
              </div>

              <div className="rounded-2xl p-4 bg-neutral-50/70 dark:bg-white/[0.025] border border-black/[0.06] dark:border-white/[0.07] col-span-2 sm:col-span-1">
                <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  RISK / REWARD
                </div>
                <p className="text-xl sm:text-2xl font-black font-mono text-neutral-900 dark:text-white mt-1.5">
                  {disciplineRules.targetRR || "1:2"}
                </p>
              </div>
            </div>
          </div>

          {/* ── TRADING PREFERENCES & DISPLAY ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Trading Preferences */}
            <div className="rounded-3xl p-6 bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col justify-between space-y-5">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center">
                    <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
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

                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-emerald-500" /> SESSIONS
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {safeArray(disciplineRules.preferredSessions, ["London", "New York"]).map((session) => (
                        <span
                          key={session}
                          className="px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 flex items-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {session}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">
                      FAVORITE PAIRS
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {safeArray(disciplineRules.favoritePairs, ["EUR/USD", "GBP/USD", "XAU/USD"]).map((pair) => (
                        <span
                          key={pair}
                          className="px-3 py-1 rounded-xl text-xs font-bold font-mono bg-neutral-100 dark:bg-white/[0.05] text-neutral-800 dark:text-neutral-200 border border-black/[0.06] dark:border-white/[0.08]"
                        >
                          {pair}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Display Bento Card */}
            <div className="rounded-3xl p-6 bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center">
                    <Monitor className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
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

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-2xl p-3.5 bg-neutral-50/70 dark:bg-white/[0.025] border border-black/[0.06] dark:border-white/[0.07]">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                      CURRENCY
                    </p>
                    <p className="text-base font-extrabold font-mono text-neutral-900 dark:text-white mt-1">
                      {preferences.currency}
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

              {/* Navigation button switching directly to Settings tab */}
              <div className="flex items-center justify-between pt-3 border-t border-black/[0.05] dark:border-white/[0.06]">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  Configure currency & data
                </span>
                <button
                  type="button"
                  onClick={() => handleTabChange("settings")}
                  className="px-3 py-1.5 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-neutral-50 dark:bg-white/[0.04] hover:bg-neutral-100 dark:hover:bg-white/[0.08] text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-2xs"
                >
                  <SettingsIcon className="w-3 h-3" />
                  <span>Open Settings</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── PRE-TRADE CHECKLIST ── */}
          <div className="rounded-3xl p-6 bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center">
                  <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                    Pre-Trade Checklist
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    5-point routine before pulling the trigger
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetChecklist}
                  className="px-3 py-1.5 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-neutral-50 dark:bg-white/[0.04] hover:bg-neutral-100 dark:hover:bg-white/[0.08] text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  title="Uncheck all items for today's new trading session"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Routine</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddingChecklistItem(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Step</span>
                </button>
              </div>
            </div>

            {/* Checklist items list */}
            <div className="space-y-2 pt-1">
              {safeChecklist.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50/60 dark:bg-white/[0.025] border border-black/[0.05] dark:border-white/[0.06] hover:border-emerald-500/30 transition-colors group"
                >
                  <div
                    onClick={() => handleToggleChecklist(item.id)}
                    className="flex items-center gap-3.5 cursor-pointer flex-1"
                  >
                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                        item.checked
                          ? "bg-emerald-500 border-emerald-500 text-white shadow-xs"
                          : "border-black/20 dark:border-white/20 hover:border-emerald-500"
                      }`}
                    >
                      {item.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <span
                      className={`text-xs font-semibold transition-all select-none ${
                        item.checked
                          ? "text-neutral-900 dark:text-white"
                          : "text-neutral-400 dark:text-neutral-500 line-through"
                      }`}
                    >
                      {item.text}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveChecklist(idx, "up")}
                      className="p-1 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.08] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 disabled:opacity-30 cursor-pointer"
                      title="Move Up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === safeChecklist.length - 1}
                      onClick={() => handleMoveChecklist(idx, "down")}
                      className="p-1 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.08] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 disabled:opacity-30 cursor-pointer"
                      title="Move Down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteChecklistItem(item.id)}
                      className="p-1 rounded-lg hover:bg-rose-500/10 text-neutral-400 hover:text-rose-500 transition-colors cursor-pointer"
                      title="Delete step"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Inline Add Item Form */}
              {isAddingChecklistItem && (
                <form
                  onSubmit={handleAddChecklistItem}
                  className="flex items-center gap-2 p-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.02]"
                >
                  <input
                    type="text"
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    placeholder="Enter pre-trade execution step..."
                    autoFocus
                    className="flex-1 bg-transparent px-3 py-1.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 outline-none font-medium"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingChecklistItem(false);
                      setNewChecklistText("");
                    }}
                    className="p-1.5 rounded-xl hover:bg-black/[0.05] dark:hover:bg-white/[0.08] text-neutral-400 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>

            {/* Checklist Footer Progress */}
            <div className="flex items-center justify-between pt-2 border-t border-black/[0.05] dark:border-white/[0.06] text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              <span>
                {checkedCount} of {safeChecklist.length} steps completed
              </span>
              <div className="w-32 h-1.5 rounded-full bg-neutral-200 dark:bg-white/[0.08] overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${safeChecklist.length > 0 ? (checkedCount / safeChecklist.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 2: SETTINGS & JOURNAL EXPORT & TRADE LOGS
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          {/* ── 1. REGIONAL & DISPLAY PREFERENCES ── */}
          <div className="rounded-3xl p-6 bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-black/[0.05] dark:border-white/10 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center">
                  <Monitor className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                    Display & Regional Preferences
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Calibrate your base currency and time reference for charts and journals
                  </p>
                </div>
              </div>

              {prefSaveNotice && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {prefSaveNotice}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Currency Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
                  Account Currency
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CURRENCY_OPTIONS.map((c) => {
                    const isSelected = preferences.currency === c.code;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => handleUpdatePreference("currency", c.code)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-xs ring-1 ring-emerald-500/30"
                            : "bg-neutral-50 dark:bg-white/[0.03] border-black/[0.06] dark:border-white/[0.08] hover:border-neutral-300 dark:hover:border-white/20 text-neutral-700 dark:text-neutral-300"
                        }`}
                      >
                        <span className="text-lg font-black font-mono">{c.symbol}</span>
                        <span className="text-xs font-bold mt-1">{c.code}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Timezone Selection (Apple macOS / iOS Frosted Custom Dropdown) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
                  Trading Timezone
                </label>
                <AppleSelect
                  value={preferences.timezone}
                  onChange={(e) => handleUpdatePreference("timezone", e.target.value)}
                  options={TIMEZONE_OPTIONS}
                  placeholder="Select trading timezone"
                />
                <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-2">
                  Session timings, economic announcements, and execution timestamps align to this timezone.
                </p>
              </div>
            </div>
          </div>

          {/* ── 2. EXPORT JOURNAL DATA ── */}
          <div className="rounded-3xl p-6 bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-black/[0.05] dark:border-white/10">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center">
                <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                  Export Journal Data
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Download a pristine copy of your complete trading journal. PDF and Word exports format each trade on its own dedicated page with execution charts.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
              {exportFormats.map(({ fmt, label, icon: Icon, color, border, text }) => (
                <button
                  key={fmt}
                  onClick={() => handleExport(fmt)}
                  disabled={exporting === fmt}
                  className={`relative p-5 border ${border} rounded-2xl hover:scale-[1.02] transition-all duration-300 flex flex-col items-center justify-center text-center gap-3 bg-gradient-to-br ${color} backdrop-blur-xl shadow-xs hover:shadow-md disabled:opacity-60 active:scale-95 cursor-pointer group`}
                >
                  <div className={`${text} group-hover:scale-110 transition-transform`}>
                    {exporting === fmt ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`text-xs font-bold ${text} uppercase tracking-wider`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── 3. JOURNAL HISTORY LOGS ── */}
          <div className="rounded-3xl p-6 bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-black/[0.05] dark:border-white/10 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                    Journal History Logs
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Click any trade row below to inspect its architecture, psychology, and screenshots
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 bg-black/[0.04] dark:bg-white/5 px-3 py-1 rounded-full border border-black/[0.05] dark:border-white/10">
                {historyTrades.length} {historyTrades.length === 1 ? "Trade" : "Trades"}
              </span>
            </div>

            <div className="w-full overflow-x-auto">
              {loadingHistory ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 text-emerald-500 dark:text-emerald-400 animate-spin" />
                </div>
              ) : historyTrades.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-black/[0.08] dark:border-white/10 rounded-2xl">
                  <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                    No trades logged yet
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    Log trades via the Add Trade menu to build your edge and export your logs.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-black/[0.05] dark:border-white/10">
                      {["Date", "Asset", "Direction", "Setup", "Net R", ""].map((h, i) => (
                        <th
                          key={i}
                          className={`pb-3 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest ${
                            i === 4 ? "text-right" : i === 5 ? "text-right w-24" : ""
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historyTrades.map((trade) => {
                      const normR = normalizeTradeR(trade);
                      const isLoss = (trade.result || "").toLowerCase() === "loss" || normR < 0;
                      return (
                        <tr
                          key={trade.id}
                          onClick={() => setSelectedTrade(trade)}
                          className="border-b border-black/[0.03] dark:border-white/5 hover:bg-emerald-500/[0.04] dark:hover:bg-white/[0.03] transition-colors cursor-pointer group"
                        >
                          <td className="py-4 text-xs font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-neutral-400" /> {trade.date}
                          </td>
                          <td className="py-4 text-xs font-bold text-neutral-900 dark:text-white font-mono">
                            {trade.asset}
                          </td>
                          <td className="py-4 text-xs font-bold">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                trade.direction === "LONG"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                  : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                              }`}
                            >
                              {trade.direction === "LONG" ? (
                                <ArrowUp className="w-2.5 h-2.5 text-emerald-500" />
                              ) : (
                                <ArrowDown className="w-2.5 h-2.5 text-red-500" />
                              )}
                              {trade.direction}
                            </span>
                          </td>
                          <td className="py-4 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                            {trade.setup || "—"}
                          </td>
                          <td className="py-4 text-xs font-black text-right font-mono">
                            <span className={isLoss ? "text-rose-500 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>
                              {normR >= 0 ? "+" : ""}
                              {normR.toFixed(2)}R
                            </span>
                          </td>
                          <td className="py-4 text-xs text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTrade(trade);
                              }}
                              className="p-1.5 rounded-xl bg-black/[0.04] dark:bg-white/5 hover:bg-emerald-500/15 text-neutral-700 dark:text-neutral-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1 text-xs font-semibold px-2.5 cursor-pointer"
                              title="View Trade Detail"
                            >
                              <Eye className="w-3.5 h-3.5" /> View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* ── 4. DANGER ZONE ── */}
          <div className="rounded-3xl p-6 bg-rose-500/[0.03] dark:bg-rose-500/[0.05] border border-rose-500/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <h2 className="text-base font-bold text-rose-600 dark:text-rose-400">Danger Zone</h2>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Permanently delete all your trade logs from the database. This action cannot be reversed.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleDeleteAllTrades}
                disabled={deleting}
                className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold rounded-2xl text-xs transition-all shadow-md shadow-rose-500/25 flex items-center gap-2 active:scale-95 cursor-pointer disabled:opacity-60"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Wipe All Trades
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 3: BILLING & SUBSCRIPTIONS
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === "billing" && (
        <div className="space-y-6">
          <div className="rounded-3xl p-6 bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-black/[0.05] dark:border-white/10 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                    Membership & Billing
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Manage your subscription and premium edge tools
                  </p>
                </div>
              </div>

              <span className="text-xs font-extrabold uppercase px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {profile.plan} PLAN ACTIVE
              </span>
            </div>

            <div className="rounded-2xl p-5 bg-neutral-50 dark:bg-white/[0.025] border border-black/[0.06] dark:border-white/[0.07] flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" /> Professional Trading Suite
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-xl">
                  Full access to unlimited trade journaling, multi-timeframe TradingView sync, automated discipline rules, psychology tracking, and multi-format document exports.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/paywall")}
                className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-500/25 active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <span>Manage Plan / Upgrade</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          REACT PORTAL: TRADE DETAIL INSPECTION MODAL
      ══════════════════════════════════════════════════════════════ */}
      {selectedTrade &&
        createPortal(
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
            <div
              className="absolute inset-0"
              onClick={() => setSelectedTrade(null)}
            />

            <div className="relative w-full max-w-4xl max-h-[90vh] bg-white/95 dark:bg-[#121622]/95 border border-black/[0.08] dark:border-white/[0.12] rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.2)] dark:shadow-[0_30px_80px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden backdrop-blur-2xl animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                      selectedTrade.direction === "LONG"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                    }`}
                  >
                    {selectedTrade.direction === "LONG" ? (
                      <ArrowUp className="w-2.5 h-2.5 text-emerald-500" />
                    ) : (
                      <ArrowDown className="w-2.5 h-2.5 text-red-500" />
                    )}
                    {selectedTrade.direction}
                  </span>
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white font-mono">
                    {selectedTrade.asset}
                  </h2>
                  <span className="text-neutral-500 dark:text-neutral-400 text-xs">
                    • {selectedTrade.date}{selectedTrade.time ? ` • ${selectedTrade.time}` : ""}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleExport("pdf", selectedTrade.id)}
                    disabled={exporting === `pdf-${selectedTrade.id}`}
                    className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-rose-500/20 cursor-pointer"
                    title="Export this trade as PDF"
                  >
                    {exporting === `pdf-${selectedTrade.id}` ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileType className="w-3.5 h-3.5" />
                    )}
                    PDF
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExport("doc", selectedTrade.id)}
                    disabled={exporting === `doc-${selectedTrade.id}`}
                    className="px-2.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-blue-500/20 cursor-pointer"
                    title="Export this trade as Word Document"
                  >
                    {exporting === `doc-${selectedTrade.id}` ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileText className="w-3.5 h-3.5" />
                    )}
                    Word
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate(`/add-trade?edit=${selectedTrade.id}`)}
                    className="p-2 bg-black/[0.04] dark:bg-white/5 hover:bg-emerald-500/15 rounded-xl text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                    title="Edit Trade"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteTrade(selectedTrade.id)}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500 rounded-xl text-rose-500 hover:text-white transition-all cursor-pointer"
                    title="Delete Trade"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTrade(null)}
                    className="p-2 bg-black/[0.04] dark:bg-white/5 hover:bg-black/[0.08] dark:hover:bg-white/10 rounded-xl text-neutral-500 dark:text-neutral-400 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Stats Grid */}
                {(() => {
                  const selR = normalizeTradeR(selectedTrade);
                  const selIsLoss = (selectedTrade.result || "").toLowerCase() === "loss" || selR < 0;
                  const selLot = selectedTrade.lot_size ?? selectedTrade.executions?.[0]?.lot_size;
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: "Net R", value: `${selR >= 0 ? "+" : ""}${selR.toFixed(2)}R`, isNet: true, isLoss: selIsLoss },
                        { label: "Result", value: selectedTrade.result?.toUpperCase() || "—", isResult: true, isLoss: selIsLoss },
                        { label: "Setup", value: selectedTrade.setup || "—" },
                        { label: "Session", value: selectedTrade.session || "—" },
                        { label: "Entry", value: selectedTrade.entry ?? "—" },
                        { label: "Stop Loss", value: selectedTrade.sl ?? "—" },
                        { label: "Take Profit", value: selectedTrade.tp ?? "—" },
                        {
                          label: selLot ? `Risk % (${selLot}L)` : "Risk %",
                          value: selectedTrade.risk
                            ? `${Number(selectedTrade.risk).toFixed(2)}%`
                            : selLot
                            ? `${selLot} Lots`
                            : "—",
                        },
                      ].map((s, i) => (
                        <div
                          key={i}
                          className="bg-black/[0.025] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.08] p-3.5 rounded-2xl"
                        >
                          <p className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-1">
                            {s.label}
                          </p>
                          <p
                            className={`text-sm font-bold font-mono ${
                              s.isNet || s.isResult
                                ? s.isLoss
                                  ? "text-rose-500 dark:text-rose-400"
                                  : "text-emerald-600 dark:text-emerald-400"
                                : "text-neutral-900 dark:text-white"
                            }`}
                          >
                            {s.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* Analysis Notes & Psychology */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Target className="w-3.5 h-3.5" /> Analysis & Reason
                      </h3>
                      <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed bg-black/[0.025] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.08] p-4 rounded-2xl min-h-[90px] whitespace-pre-wrap font-medium">
                        {selectedTrade.reason || "No analysis recorded."}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5" /> Key Lesson
                      </h3>
                      <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed bg-black/[0.025] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.08] p-4 rounded-2xl min-h-[90px] whitespace-pre-wrap font-medium">
                        {selectedTrade.lesson || "No lesson recorded."}
                      </p>
                    </div>
                  </div>

                  <div className="bg-black/[0.025] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.08] p-5 rounded-2xl flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Brain className="w-3.5 h-3.5" /> Psychology & Discipline
                      </h3>
                      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-black/[0.05] dark:border-white/[0.06]">
                        <div className="flex-1">
                          <p className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase mb-1">
                            Emotion Before
                          </p>
                          <p className="text-xs font-bold text-neutral-900 dark:text-white">
                            {selectedTrade.emotion_before || "—"}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-neutral-400 dark:text-neutral-600" />
                        <div className="flex-1">
                          <p className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase mb-1">
                            Emotion After
                          </p>
                          <p className="text-xs font-bold text-neutral-900 dark:text-white">
                            {selectedTrade.emotion_after || "—"}
                          </p>
                        </div>
                      </div>
                      <p className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase mb-1.5">
                        Psychological Notes
                      </p>
                      <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap font-medium">
                        {selectedTrade.psych_note || "No emotional notes recorded."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Screenshots */}
                {selectedTrade.images && selectedTrade.images.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <ImageIcon className="w-3.5 h-3.5" /> Execution Evidence Charts
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedTrade.images.map((img, i) => (
                        <div
                          key={i}
                          onClick={() => window.open(img, "_blank")}
                          className="relative aspect-video rounded-2xl overflow-hidden border border-black/[0.08] dark:border-white/10 group cursor-pointer shadow-xs hover:shadow-md transition-all"
                        >
                          <img
                            src={img}
                            alt="Trade Chart"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="bg-black/80 text-white text-xs px-3 py-1.5 rounded-xl border border-white/20">
                              View Full Size
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ══════════════════════════════════════════════════════════════
          REACT PORTAL: EDIT PROFILE MODAL
      ══════════════════════════════════════════════════════════════ */}
      {isEditProfileOpen &&
        createPortal(
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={() => setIsEditProfileOpen(false)} />
            <form
              onSubmit={handleSaveProfile}
              className="relative w-full max-w-lg bg-white/95 dark:bg-[#121622]/95 border border-black/[0.08] dark:border-white/[0.12] rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.2)] dark:shadow-[0_30px_80px_rgba(0,0,0,0.7)] p-6 space-y-4 backdrop-blur-2xl animate-in zoom-in-95 duration-200"
            >
              <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Edit Profile Identity
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-black/[0.05] dark:hover:bg-white/[0.08] text-neutral-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editProfileForm.displayName}
                    onChange={(e) =>
                      setEditProfileForm({ ...editProfileForm, displayName: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] text-xs font-semibold text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                    Trader Handle (@username)
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs text-neutral-400 font-bold">@</span>
                    <input
                      type="text"
                      value={editProfileForm.username}
                      onChange={(e) =>
                        setEditProfileForm({
                          ...editProfileForm,
                          username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                        })
                      }
                      className="w-full pl-7 pr-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] text-xs font-semibold text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                    Trader Bio & Philosophy
                  </label>
                  <textarea
                    rows={3}
                    value={editProfileForm.bio}
                    onChange={(e) =>
                      setEditProfileForm({ ...editProfileForm, bio: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-500/20 active:scale-95"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}

      {/* ══════════════════════════════════════════════════════════════
          REACT PORTAL: EDIT TRADING RULES MODAL
      ══════════════════════════════════════════════════════════════ */}
      {isEditRulesOpen &&
        createPortal(
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={() => setIsEditRulesOpen(false)} />
            <form
              onSubmit={handleSaveRules}
              className="relative w-full max-w-lg bg-white/95 dark:bg-[#121622]/95 border border-black/[0.08] dark:border-white/[0.12] rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.2)] dark:shadow-[0_30px_80px_rgba(0,0,0,0.7)] p-6 space-y-4 backdrop-blur-2xl animate-in zoom-in-95 duration-200"
            >
              <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Edit Trading Guardrails
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditRulesOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-black/[0.05] dark:hover:bg-white/[0.08] text-neutral-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                    Max Risk / Trade
                  </label>
                  <input
                    type="text"
                    value={editRulesForm.maxRiskPerTrade}
                    onChange={(e) =>
                      setEditRulesForm({ ...editRulesForm, maxRiskPerTrade: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] text-xs font-semibold text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. 1% or 2%"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                    Max Trades / Day
                  </label>
                  <input
                    type="text"
                    value={editRulesForm.maxTradesPerDay}
                    onChange={(e) =>
                      setEditRulesForm({ ...editRulesForm, maxTradesPerDay: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] text-xs font-semibold text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. 3 or 5"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                    Daily Loss Cap
                  </label>
                  <input
                    type="text"
                    value={editRulesForm.dailyLossCap}
                    onChange={(e) =>
                      setEditRulesForm({ ...editRulesForm, dailyLossCap: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] text-xs font-semibold text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. 3% or 5%"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                    Loss Streak Break
                  </label>
                  <input
                    type="text"
                    value={editRulesForm.lossStreakBreak}
                    onChange={(e) =>
                      setEditRulesForm({ ...editRulesForm, lossStreakBreak: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] text-xs font-semibold text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. 3 in a row"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                    Target Risk / Reward
                  </label>
                  <input
                    type="text"
                    value={editRulesForm.targetRR}
                    onChange={(e) =>
                      setEditRulesForm({ ...editRulesForm, targetRR: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] text-xs font-semibold text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. 1:2 or 1:3"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsEditRulesOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-500/20 active:scale-95"
                >
                  Save Rules
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}
    </div>
  );
}
