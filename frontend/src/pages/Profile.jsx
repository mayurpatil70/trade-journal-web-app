// frontend/src/pages/Profile.jsx
import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { createPortal } from "react-dom";
import ApplePresetDropdown from "../components/ui/ApplePresetDropdown";
import ProfilePhotoModal from "../components/ui/ProfilePhotoModal";
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
  Minus,
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
  Shield,
  Smartphone,
  Laptop,
  LogOut,
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
} from "lucide-react";
import AppleSelect from "../components/ui/AppleSelect";
import AppNotificationsCard from "../components/AppNotificationsCard";
import { FollowListModal, ProfileStatTiles, ProfilePostsGrid, useTraderProfile } from "./lounge/TraderProfile";
import { ProfileLinks, LinksEditor, tidyLinks } from "../components/lounge/ProfileLinks";
import { useMe, ThreadModal } from "./lounge/LoungeFeed";
const PaywallPricingGrid = lazy(() => import("../components/paywall/PaywallPricingGrid"));
import { getPlanBadge } from "../utils/planBadge";
import api, { logoutSession, clearSession } from "../api/axios";

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

const RISK_PRESETS = [
  { value: "0.25%", label: "0.25% (Micro)" },
  { value: "0.5%", label: "0.5% (Conservative)" },
  { value: "1%", label: "1.0% (Standard)" },
  { value: "1.5%", label: "1.5% (Moderate)" },
  { value: "2%", label: "2.0% (Aggressive)" },
  { value: "2.5%", label: "2.5%" },
  { value: "3%", label: "3.0%" },
  { value: "5%", label: "5.0% (Prop Ceiling)" },
];

const TRADES_PRESETS = [
  { value: "1", label: "1 Trade / Day" },
  { value: "2", label: "2 Trades / Day" },
  { value: "3", label: "3 Trades / Day" },
  { value: "4", label: "4 Trades / Day" },
  { value: "5", label: "5 Trades / Day" },
  { value: "8", label: "8 Trades / Day" },
  { value: "10", label: "10 Trades / Day" },
  { value: "15", label: "15 Trades / Day" },
];

const LOSS_CAP_PRESETS = [
  { value: "1%", label: "1.0% (Tight)" },
  { value: "2%", label: "2.0%" },
  { value: "3%", label: "3.0%" },
  { value: "4%", label: "4.0%" },
  { value: "5%", label: "5.0% (Standard Prop)" },
  { value: "6%", label: "6.0%" },
  { value: "8%", label: "8.0%" },
  { value: "10%", label: "10.0% (Max)" },
];

const LOSS_STREAK_PRESETS = [
  { value: "2 in a row", label: "2 in a row" },
  { value: "3 in a row", label: "3 in a row" },
  { value: "4 in a row", label: "4 in a row" },
  { value: "5 in a row", label: "5 in a row" },
  { value: "Disabled", label: "Disabled" },
];

const RR_PRESETS = [
  { value: "1:1", label: "1:1.0 (Even Money)" },
  { value: "1:1.5", label: "1:1.5 (Quick Scalp)" },
  { value: "1:2", label: "1:2.0 (Standard Swing)" },
  { value: "1:2.5", label: "1:2.5 (Trend Follower)" },
  { value: "1:3", label: "1:3.0 (High Asymmetry)" },
  { value: "1:4", label: "1:4.0 (Runner)" },
  { value: "1:5", label: "1:5.0 (Institutional)" },
];

function formatLossStreak(val) {
  if (val === undefined || val === null || val === "") return "3 in a row";
  const s = String(val).trim();
  if (s.toLowerCase().includes("disable") || s.toLowerCase() === "off" || s.toLowerCase() === "none") {
    return "Disabled";
  }
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
  const [highlightRules, setHighlightRules] = useState(false);

  useEffect(() => {
    const current = searchParams.get("tab");
    const highlight = searchParams.get("highlight");
    if (highlight === "rules" || window.location.hash === "#trading-rules") {
      setActiveTab("profile");
      setHighlightRules(true);
      setTimeout(() => {
        const el = document.getElementById("trading-rules");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 150);
      const timer = setTimeout(() => setHighlightRules(false), 5000);
      return () => clearTimeout(timer);
    } else if (current === "settings" || current === "billing") {
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
      current_plan: cached.current_plan || "none",
      account_status: cached.account_status || "trial",
      trial_ends_at: cached.trial_ends_at || null,
      subscription_ends_at: cached.subscription_ends_at || null,
      createdAt: cached.createdAt || null,
      email: userEmail,
      isAdmin: cached.isAdmin || false,
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
  const planBadge = getPlanBadge(profile);

  const [checklist, setChecklist] = useState(() => {
    try {
      const saved = localStorage.getItem(`trader_checklist_${userId}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_CHECKLIST;
  });

  // Modal States
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isEditRulesOpen, setIsEditRulesOpen] = useState(false);
  const [isEditPreferencesOpen, setIsEditPreferencesOpen] = useState(false);
  const [editPreferencesForm, setEditPreferencesForm] = useState({
    preferredSessions: ["London", "New York"],
    favoritePairs: ["EUR/USD", "GBP/USD", "XAU/USD"],
  });
  const [newCustomPair, setNewCustomPair] = useState("");
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
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [revokingId, setRevokingId] = useState(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const me = useMe();
  const [social, setSocial, socialStats] = useTraderProfile(userId);
  const [listKind, setListKind] = useState(null);
  const [openPostId, setOpenPostId] = useState(null);

  // ── 2. FETCH LATEST PROFILE FROM SUPABASE BACKEND ──
  useEffect(() => {
    const fetchLatestProfile = async () => {
      try {
        const res = await api.get(`/api/auth/profile?userId=${encodeURIComponent(userId)}&email=${encodeURIComponent(userEmail)}`);
        if (res.data?.success && res.data.profile) {
          const p = res.data.profile;
          setProfile((prev) => {
            const updated = {
              ...prev,
              displayName: p.display_name || prev.displayName,
              username: p.username || prev.username,
              bio: p.bio !== undefined ? p.bio : prev.bio,
              avatarUrl: p.avatar_url || prev.avatarUrl,
              plan: (p.current_plan || prev.plan || "free").toUpperCase(),
              joinedYear: p.created_at ? new Date(p.created_at).getFullYear() : prev.joinedYear,
              current_plan: p.current_plan || prev.current_plan,
              account_status: p.account_status || prev.account_status,
              trial_ends_at: p.trial_ends_at || prev.trial_ends_at,
              subscription_ends_at: p.subscription_ends_at || prev.subscription_ends_at,
              createdAt: p.created_at || prev.createdAt,
              isAdmin: Boolean(p.isAdmin || prev.isAdmin),
              email: p.email || prev.email || userEmail,
            };
            localStorage.setItem(`trader_profile_${userId}`, JSON.stringify(updated));
            if (p.display_name) {
              localStorage.setItem("userName", p.display_name);
              localStorage.setItem("userDisplayName", p.display_name);
            }
            if (p.avatar_url) {
              localStorage.setItem("userAvatar", p.avatar_url);
              localStorage.setItem(`user_avatar_${userId}`, p.avatar_url);
            }
            window.dispatchEvent(
              new CustomEvent("user_profile_updated", {
                detail: {
                  displayName: p.display_name || updated.displayName,
                  avatarUrl: p.avatar_url || updated.avatarUrl,
                },
              })
            );
            return updated;
          });

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

  // ── 4. FETCH ACTIVE SESSIONS ON MOUNT / USERID ──
  useEffect(() => {
    if (!userId) return;
    const fetchSessions = async () => {
      setLoadingSessions(true);
      try {
        const response = await api.get("/api/auth/sessions");
        if (response.data?.success && Array.isArray(response.data.sessions)) {
          setSessions(response.data.sessions);
        }
      } catch (err) {
        console.warn("[Profile] Failed to fetch active devices:", err.message);
      } finally {
        setLoadingSessions(false);
      }
    };
    fetchSessions();
  }, [userId]);

  const handleRevokeSession = async (sessionId) => {
    setRevokingId(sessionId);
    try {
      await api.delete(`/api/auth/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      console.error("Failed to revoke device session:", err);
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeOtherSessions = async () => {
    setRevokingAll(true);
    try {
      await api.post("/api/auth/sessions/revoke-others");
      setSessions((prev) => prev.filter((s) => s.isCurrent));
    } catch (err) {
      console.error("Failed to revoke other device sessions:", err);
    } finally {
      setRevokingAll(false);
    }
  };

  const handleLogoutCurrentDevice = async () => {
    try {
      await logoutSession();
    } catch {
      clearSession();
    } finally {
      navigate("/login");
    }
  };

  const handleLogoutAllDevices = async () => {
    if (!window.confirm("Are you sure you want to log out of all active devices? You will be signed out everywhere.")) {
      return;
    }
    setRevokingAll(true);
    try {
      await api.post("/api/auth/sessions/revoke-all");
    } catch (err) {
      console.warn("[Profile] Revoke all sessions notice:", err.message);
    } finally {
      clearSession();
      navigate("/login");
    }
  };

  // ── ACTIVE DEVICES & SESSIONS COMPONENT (Rendered on Profile & Settings) ──
  const renderActiveDevicesCard = () => {
    const clientSessionId = typeof window !== "undefined" ? localStorage.getItem("sessionId") : null;
    const clientDeviceId = typeof window !== "undefined" ? localStorage.getItem("deviceId") : null;

    const fallbackDeviceName = typeof navigator !== "undefined"
      ? (/iPhone|iPad|iPod/.test(navigator.userAgent)
          ? "iPhone · Safari"
          : /Android/.test(navigator.userAgent)
            ? "Android Phone · Chrome"
            : /Macintosh|Mac OS X/.test(navigator.userAgent)
              ? "macOS · Safari"
              : /Windows/.test(navigator.userAgent)
                ? "Windows · Chrome"
                : "Web Browser")
      : "Current Browser";

    const hasOtherSessions = sessions.some(
      (s) => !s.isCurrent && s.id !== clientSessionId && s.deviceId !== clientDeviceId
    );

    return (
      <div className="rounded-3xl p-6 bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-black/[0.05] dark:border-white/10 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                Active Devices & Sessions
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Manage persistent browser sessions logged into your ForexNotes account across devices
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {hasOtherSessions && (
              <button
                type="button"
                onClick={handleRevokeOtherSessions}
                disabled={revokingAll}
                className="px-3.5 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 active:scale-95 shadow-2xs"
                title="Log out all other devices except this current device"
              >
                {revokingAll ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LogOut className="w-3.5 h-3.5" />
                )}
                <span>Log Out Other Devices</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleLogoutAllDevices}
              disabled={revokingAll}
              className="px-3.5 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 active:scale-95 shadow-2xs"
              title="Log out everywhere across all devices"
            >
              {revokingAll ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LogOut className="w-3.5 h-3.5" />
              )}
              <span>Log Out All Devices</span>
            </button>
          </div>
        </div>

        {loadingSessions ? (
          <div className="py-8 flex items-center justify-center text-neutral-400 text-xs gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            <span>Loading active devices...</span>
          </div>
        ) : sessions.length === 0 ? (
          <div className="space-y-3">
            <div className="p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 flex-wrap bg-blue-500/[0.04] dark:bg-blue-500/[0.06] border-blue-500/30 ring-1 ring-blue-500/20">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-neutral-900 dark:text-white">
                      {fallbackDeviceName}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                      This Device
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      Active now
                    </span>
                    <span>•</span>
                    <span>Current active session</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogoutCurrentDevice}
                className="px-3.5 py-2 rounded-xl border border-rose-500/25 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-95"
                title="Log out from this current device"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out This Device</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s, index) => {
              const isCurrent = Boolean(
                s.isCurrent ||
                (clientSessionId && s.id === clientSessionId) ||
                (clientDeviceId && s.deviceId === clientDeviceId) ||
                (sessions.length === 1) ||
                (index === 0 && !sessions.some((x) => x.isCurrent))
              );
              const isMobile = /iPhone|Android|iPad/i.test(s.deviceName);
              const DeviceIcon = isMobile ? Smartphone : Laptop;
              const formattedDate = s.lastActiveAt
                ? new Date(s.lastActiveAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Recently";

              return (
                <div
                  key={s.id || index}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 flex-wrap ${
                    isCurrent
                      ? "bg-blue-500/[0.04] dark:bg-blue-500/[0.06] border-blue-500/30 ring-1 ring-blue-500/20"
                      : "bg-neutral-50 dark:bg-white/[0.02] border-black/[0.06] dark:border-white/[0.06]"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isCurrent
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                          : "bg-black/[0.04] dark:bg-white/[0.04] text-neutral-600 dark:text-neutral-400 border border-black/[0.06] dark:border-white/[0.08]"
                      }`}
                    >
                      <DeviceIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-neutral-900 dark:text-white">
                          {s.deviceName || fallbackDeviceName}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                            This Device
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {isCurrent ? (
                          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            Active now
                          </span>
                        ) : (
                          <span>Last active: {formattedDate}</span>
                        )}
                        {s.ipAddress && <span>•</span>}
                        {s.ipAddress && <span>IP: {s.ipAddress}</span>}
                      </div>
                    </div>
                  </div>

                  {isCurrent ? (
                    <button
                      type="button"
                      onClick={handleLogoutCurrentDevice}
                      className="px-3.5 py-2 rounded-xl border border-rose-500/25 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-95"
                      title="Log out from this current device"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out This Device</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRevokeSession(s.id)}
                      disabled={revokingId === s.id}
                      className="px-3.5 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-white/[0.04] hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-500 text-xs font-semibold text-neutral-700 dark:text-neutral-300 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 shadow-2xs"
                      title="Revoke and log out this device remotely"
                    >
                      {revokingId === s.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <LogOut className="w-3.5 h-3.5" />
                      )}
                      <span>Revoke / Log out this device</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

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
          window.dispatchEvent(
            new CustomEvent("user_profile_updated", {
              detail: { avatarUrl: newUrl },
            })
          );
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
      localStorage.setItem("userDisplayName", editProfileForm.displayName);
    }
    window.dispatchEvent(
      new CustomEvent("user_profile_updated", {
        detail: {
          displayName: editProfileForm.displayName,
          avatarUrl: editProfileForm.avatarUrl,
        },
      })
    );
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

    const links = tidyLinks(editProfileForm.links);
    try {
      await api.put("/api/social/me", { bio: editProfileForm.bio, links });
      setSocial((sc) => (sc && !sc.error ? { ...sc, bio: editProfileForm.bio, links } : sc));
    } catch (err) {
      console.warn("[Profile] Social profile save notice:", err.message);
    }
  };

  // ── RULE ADJUSTMENT HELPERS (Stepper + Dropdowns) ──
  const adjustRisk = (delta) => {
    const current = parseFloat(String(editRulesForm.maxRiskPerTrade || "2").replace("%", "")) || 2;
    const next = Math.max(0.1, Math.min(20, +(current + delta).toFixed(2)));
    setEditRulesForm({ ...editRulesForm, maxRiskPerTrade: `${next}%` });
  };

  const adjustMaxTrades = (delta) => {
    const current = parseInt(String(editRulesForm.maxTradesPerDay || "5").replace(/\D/g, ""), 10) || 5;
    const next = Math.max(1, Math.min(50, current + delta));
    setEditRulesForm({ ...editRulesForm, maxTradesPerDay: String(next) });
  };

  const adjustLossCap = (delta) => {
    const current = parseFloat(String(editRulesForm.dailyLossCap || "5").replace("%", "")) || 5;
    const next = Math.max(0.5, Math.min(50, +(current + delta).toFixed(1)));
    setEditRulesForm({ ...editRulesForm, dailyLossCap: `${next}%` });
  };

  const adjustLossStreak = (delta) => {
    const current = parseInt(String(editRulesForm.lossStreakBreak || "3").replace(/\D/g, ""), 10) || 3;
    const next = Math.max(1, Math.min(10, current + delta));
    setEditRulesForm({ ...editRulesForm, lossStreakBreak: `${next} in a row` });
  };

  const adjustRR = (delta) => {
    const match = String(editRulesForm.targetRR || "1:2").match(/1:([\d.]+)/);
    const current = match ? parseFloat(match[1]) : 2;
    const next = Math.max(1, Math.min(20, +(current + delta).toFixed(1)));
    setEditRulesForm({ ...editRulesForm, targetRR: `1:${next}` });
  };

  // ── PREFERENCE ADJUSTMENT HELPERS ──
  const handleToggleSession = (session) => {
    const sessions = editPreferencesForm.preferredSessions || [];
    const exists = sessions.includes(session);
    const updated = exists ? sessions.filter((s) => s !== session) : [...sessions, session];
    setEditPreferencesForm({ ...editPreferencesForm, preferredSessions: updated });
  };

  const handleTogglePair = (pair) => {
    const pairs = editPreferencesForm.favoritePairs || [];
    const exists = pairs.includes(pair);
    const updated = exists ? pairs.filter((p) => p !== pair) : [...pairs, pair];
    setEditPreferencesForm({ ...editPreferencesForm, favoritePairs: updated });
  };

  const handleAddCustomPair = (e) => {
    if (e) e.preventDefault();
    const clean = (newCustomPair || "").trim().toUpperCase();
    if (!clean) return;
    const pairs = editPreferencesForm.favoritePairs || [];
    if (!pairs.includes(clean)) {
      setEditPreferencesForm({ ...editPreferencesForm, favoritePairs: [...pairs, clean] });
    }
    setNewCustomPair("");
  };

  const handleRemovePair = (pair) => {
    const pairs = editPreferencesForm.favoritePairs || [];
    setEditPreferencesForm({
      ...editPreferencesForm,
      favoritePairs: pairs.filter((p) => p !== pair),
    });
  };

  const handleSavePreferences = async (e) => {
    if (e) e.preventDefault();
    const updatedRules = {
      ...disciplineRules,
      preferredSessions: editPreferencesForm.preferredSessions,
      favoritePairs: editPreferencesForm.favoritePairs,
    };
    setDisciplineRules(updatedRules);
    localStorage.setItem(`trader_discipline_${userId}`, JSON.stringify(updatedRules));
    setIsEditPreferencesOpen(false);

    try {
      await api.put("/api/auth/profile", {
        userId,
        disciplineRules: updatedRules,
      });
    } catch (err) {
      console.warn("[Profile] Preferences save notice:", err.message);
    }
  };

  // Save Edit Rules Modal
  const handleSaveRules = async (e) => {
    e.preventDefault();
    setDisciplineRules(editRulesForm);
    localStorage.setItem(`trader_discipline_${userId}`, JSON.stringify(editRulesForm));
    localStorage.setItem(`rules_onboarded_${userId}`, "true");
    localStorage.setItem("rules_onboarded", "true");
    setIsEditRulesOpen(false);

    // Dispatch global event so Dashboard immediately updates rules and re-evaluates guardrails
    window.dispatchEvent(
      new CustomEvent("trading-rules-updated", { detail: editRulesForm })
    );

    try {
      await api.put("/api/auth/profile", {
        userId,
        disciplineRules: editRulesForm,
        rulesOnboarded: true,
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
    { fmt: "csv", label: "CSV", icon: Table, color: "from-blue-500/20 to-blue-500/20", border: "border-blue-500/20", text: "text-blue-500 dark:text-blue-400" },
    { fmt: "excel", label: "Excel", icon: Table, color: "from-emerald-500/20 to-teal-500/20", border: "border-emerald-500/20", text: "text-emerald-500 dark:text-emerald-400" },
    { fmt: "doc", label: "Word (1 Trade / Page)", icon: FileText, color: "from-blue-500/10 to-blue-500/10", border: "border-blue-500/20", text: "text-blue-500 dark:text-blue-400" },
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
                onClick={() => setIsPhotoModalOpen(true)}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-2 ring-blue-500/20 shadow-md cursor-pointer hover:ring-4 hover:ring-blue-500/40 hover:scale-105 transition-all"
                title="Click to view & update profile photo"
              />
            ) : (
              <div
                onClick={() => setIsPhotoModalOpen(true)}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-blue-500 to-blue-500 text-white flex items-center justify-center font-black text-2xl shadow-md cursor-pointer hover:ring-4 hover:ring-blue-500/40 hover:scale-105 transition-all"
                title="Click to view & update profile photo"
              >
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
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-lg border tracking-wider transition-all ${planBadge.badgeClass}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${planBadge.dotClass}`} />
                <span>{planBadge.label}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              <span className="text-blue-600 dark:text-blue-400">@{profile.username}</span>
              <span>·</span>
              <span>Joined {profile.joinedYear}</span>
            </div>
            <div className="flex gap-4 sm:gap-8 mt-3 text-sm">
              <span>
                <strong className="text-neutral-900 dark:text-white">{social?.posts ? social.postsCount ?? social.posts.length : "–"}</strong>{" "}
                <span className="text-neutral-500">posts</span>
              </span>
              {["followers", "following"].map((k) => (
                <button key={k} type="button" onClick={() => setListKind(k)} className="hover:opacity-70 cursor-pointer">
                  <strong className="text-neutral-900 dark:text-white">{social?.[k] ?? "–"}</strong> <span className="text-neutral-500">{k}</span>
                </button>
              ))}
            </div>
            {(social?.bio || profile.bio) && (
              <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-line max-w-xl">{social?.bio || profile.bio}</p>
            )}
            <ProfileLinks links={social?.links} className="mt-1" />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => {
            setEditProfileForm({ ...profile, bio: social?.bio || profile.bio, links: social?.links || [] });
            setIsEditProfileOpen(true);
          }}
          className="px-4 py-2 rounded-2xl border border-black/[0.08] dark:border-white/[0.1] bg-neutral-50 dark:bg-white/[0.04] hover:bg-neutral-100 dark:hover:bg-white/[0.08] text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>Edit Profile</span>
        </button>
        {userId && (
          <Link
            to={`/lounge/trader/${userId}`}
            className="px-4 py-2 rounded-2xl border border-black/[0.08] dark:border-white/[0.1] bg-neutral-50 dark:bg-white/[0.04] hover:bg-neutral-100 dark:hover:bg-white/[0.08] text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2 transition-all shadow-xs active:scale-95"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View public profile</span>
          </Link>
        )}
        </div>
        {socialStats?.stats && (
          <div className="w-full -mt-2">
            <ProfileStatTiles stats={socialStats.stats} />
          </div>
        )}
      </div>

      {/* ── 2. TABS BAR: Profile, Settings, Billing ── */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-neutral-100 dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] w-fit shadow-xs">
        <button
          type="button"
          onClick={() => handleTabChange("profile")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === "profile"
              ? "bg-blue-500 text-white shadow-sm shadow-blue-500/20"
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
              ? "bg-blue-500 text-white shadow-sm shadow-blue-500/20"
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
              ? "bg-blue-500 text-white shadow-sm shadow-blue-500/20"
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
          {social?.posts ? (
            <ProfilePostsGrid posts={social.posts} onOpen={(post) => setOpenPostId(post.id)} />
          ) : (
            <div className="rounded-3xl bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] overflow-hidden">
              <div className="h-11 border-b border-black/[0.05] dark:border-white/[0.06]" />
              <div className="grid grid-cols-3 gap-0.5 sm:gap-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-black/[0.04] dark:bg-white/[0.05] animate-pulse" />
                ))}
              </div>
            </div>
          )}
          {/* ── TRADING RULES SECTION (5 Bento Cards + Edit Rules) ── */}
          <div
            id="trading-rules"
            className={`rounded-3xl p-6 bg-white dark:bg-[#121622] border transition-all duration-500 ${
              highlightRules
                ? "ring-4 ring-rose-500/70 dark:ring-rose-400/80 border-rose-500 shadow-[0_0_50px_rgba(244,63,94,0.35)] scale-[1.01]"
                : "border-black/[0.06] dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
            } space-y-4`}
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 flex items-center justify-center">
                  <Scale className="w-4 h-4 text-blue-600 dark:text-blue-400" />
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
                className="px-4 py-2 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm shadow-blue-500/25 active:scale-95 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Rules</span>
              </button>
            </div>

            {/* 5 Rules Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
              <div className="rounded-2xl p-4 bg-neutral-50/70 dark:bg-white/[0.025] border border-black/[0.06] dark:border-white/[0.07]">
                <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  MAX RISK / TRADE
                </div>
                <p className="text-xl sm:text-2xl font-black font-mono text-neutral-900 dark:text-white mt-1.5">
                  {disciplineRules.maxRiskPerTrade || "2%"}
                </p>
              </div>

              <div className="rounded-2xl p-4 bg-neutral-50/70 dark:bg-white/[0.025] border border-black/[0.06] dark:border-white/[0.07]">
                <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
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
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
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
                <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 flex items-center justify-center">
                      <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
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

                  <button
                    type="button"
                    onClick={() => {
                      setEditPreferencesForm({
                        preferredSessions: safeArray(disciplineRules.preferredSessions, ["London", "New York"]),
                        favoritePairs: safeArray(disciplineRules.favoritePairs, ["EUR/USD", "GBP/USD", "XAU/USD"]),
                      });
                      setIsEditPreferencesOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-neutral-50 dark:bg-white/[0.04] hover:bg-neutral-100 dark:hover:bg-white/[0.08] text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-blue-500" /> SESSIONS
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {safeArray(disciplineRules.preferredSessions, ["London", "New York"]).map((session) => (
                        <span
                          key={session}
                          className="px-3 py-1 rounded-xl text-xs font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 flex items-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
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
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 flex items-center justify-center">
                    <Monitor className="w-4 h-4 text-blue-600 dark:text-blue-400" />
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
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 flex items-center justify-center">
                  <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
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
                  className="px-3 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
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
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50/60 dark:bg-white/[0.025] border border-black/[0.05] dark:border-white/[0.06] hover:border-blue-500/30 transition-colors group"
                >
                  <div
                    onClick={() => handleToggleChecklist(item.id)}
                    className="flex items-center gap-3.5 cursor-pointer flex-1"
                  >
                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                        item.checked
                          ? "bg-blue-500 border-blue-500 text-white shadow-xs"
                          : "border-black/20 dark:border-white/20 hover:border-blue-500"
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
                  className="flex items-center gap-2 p-2 rounded-2xl border border-blue-500/30 bg-blue-500/[0.02]"
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
                    className="px-3 py-1.5 rounded-xl bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 transition-colors cursor-pointer"
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

          {/* ── ACTIVE DEVICES & SESSIONS (Prominently displayed in Profile) ── */}
          {renderActiveDevicesCard()}

        </div>
      )}

      {listKind && <FollowListModal userId={userId} kind={listKind} showMutuals={false} onClose={() => setListKind(null)} />}
      {openPostId && (
        <ThreadModal
          postId={openPostId}
          me={me}
          onClose={() => setOpenPostId(null)}
          onPostChange={(np) => setSocial((sc) => ({ ...sc, posts: sc.posts.map((x) => (x.id === np.id ? np : x)) }))}
        />
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
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 flex items-center justify-center">
                  <Monitor className="w-4 h-4 text-blue-600 dark:text-blue-400" />
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
                <span className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 animate-in fade-in">
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
                            ? "bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 shadow-xs ring-1 ring-blue-500/30"
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

          <AppNotificationsCard />

          {/* ── 2. EXPORT JOURNAL DATA ── */}
          <div className="rounded-3xl p-6 bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-black/[0.05] dark:border-white/10">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 flex items-center justify-center">
                <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
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
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
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
                  <Loader2 className="w-6 h-6 text-blue-500 dark:text-blue-400 animate-spin" />
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
                          className="border-b border-black/[0.03] dark:border-white/5 hover:bg-blue-500/[0.04] dark:hover:bg-white/[0.03] transition-colors cursor-pointer group"
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
                              className="p-1.5 rounded-xl bg-black/[0.04] dark:bg-white/5 hover:bg-blue-500/15 text-neutral-700 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center gap-1 text-xs font-semibold px-2.5 cursor-pointer"
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

          {/* ── 3. ACTIVE DEVICES & SESSIONS ── */}
          {renderActiveDevicesCard()}

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
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
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

              {/* Dynamic User Plan Badge from Supabase (24 Hour Trial, 7 Days Trial, 1 Month Pro Plan, 1 Year Pro Plan) */}
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black tracking-wide uppercase transition-all ${planBadge.badgeClass}`}>
                  <span className={`w-2 h-2 rounded-full ${planBadge.dotClass}`} />
                  <span>{planBadge.label}</span>
                </span>
              </div>
            </div>

            {/* Reusable Paywall Cards: Monthly/Yearly toggle, Beginner Trial, Pro Trader & Web3 WalletConnect */}
            <div className="pt-2">
              <Suspense
                fallback={
                  <div className="py-12 flex flex-col items-center justify-center min-h-[300px]">
                    <div className="w-8 h-8 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin mb-3" />
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium tracking-wide">
                      Loading membership & billing options...
                    </p>
                  </div>
                }
              >
                <PaywallPricingGrid isEmbedded={true} />
              </Suspense>
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
                    className="p-2 bg-black/[0.04] dark:bg-white/5 hover:bg-blue-500/15 rounded-xl text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
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
                      <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Target className="w-3.5 h-3.5" /> Analysis & Reason
                      </h3>
                      <p className="text-xs text-neutral-900 dark:text-neutral-100 leading-relaxed bg-neutral-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 p-4 rounded-2xl min-h-[90px] whitespace-pre-wrap font-medium shadow-xs">
                        {selectedTrade.reason || "No analysis recorded."}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5" /> Key Lesson
                      </h3>
                      <p className="text-xs text-neutral-900 dark:text-neutral-100 leading-relaxed bg-neutral-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 p-4 rounded-2xl min-h-[90px] whitespace-pre-wrap font-medium shadow-xs">
                        {selectedTrade.lesson || "No lesson recorded."}
                      </p>
                    </div>
                  </div>

                  <div className="bg-black/[0.025] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.08] p-5 rounded-2xl flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
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
              className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-[#121622]/95 border border-black/[0.08] dark:border-white/[0.12] rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.2)] dark:shadow-[0_30px_80px_rgba(0,0,0,0.7)] p-6 space-y-4 backdrop-blur-2xl animate-in zoom-in-95 duration-200"
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
                    className="w-full px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] text-xs font-semibold text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
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
                      className="w-full pl-7 pr-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] text-xs font-semibold text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
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
                    className="w-full px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                    Links
                  </label>
                  <LinksEditor
                    links={editProfileForm.links || []}
                    onChange={(links) => setEditProfileForm({ ...editProfileForm, links })}
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
                  className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-sm shadow-blue-500/20 active:scale-95"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}

            {/* ══════════════════════════════════════════════════════════════
          REACT PORTAL: EDIT TRADING RULES MODAL (DROPDOWNS + STEPPERS + TYPE)
      ══════════════════════════════════════════════════════════════ */}
      {isEditRulesOpen &&
        createPortal(
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={() => setIsEditRulesOpen(false)} />
            <form
              onSubmit={handleSaveRules}
              className="relative w-full max-w-lg bg-white/95 dark:bg-[#121622]/95 border border-black/[0.08] dark:border-white/[0.12] rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.2)] dark:shadow-[0_30px_80px_rgba(0,0,0,0.7)] p-6 space-y-5 backdrop-blur-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                    Edit Trading Guardrails
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Select standard presets, use up/down steppers, or type custom values
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditRulesOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-black/[0.05] dark:hover:bg-white/[0.08] text-neutral-400 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Psychological Warning Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-amber-500/15 border-2 border-amber-500/35 dark:border-amber-400/35 space-y-1.5 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/30">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-black tracking-wider text-amber-700 dark:text-amber-300 uppercase">
                    &quot;DISCIPLINE TODAY, FREEDOM TOMORROW&quot;
                  </span>
                </div>
                <p className="text-[11px] font-medium text-neutral-600 dark:text-neutral-300 leading-relaxed pl-8">
                  Changing guardrails in an emotional state ruins long-term edge. Only update risk ceilings during calm market reviews, never during active drawdowns or revenge trading.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. Max Risk / Trade */}
                <div className="p-3.5 rounded-2xl bg-neutral-50/80 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] hover:border-black/15 dark:hover:border-white/15 transition-all shadow-2xs space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                      Max Risk / Trade
                    </label>
                    <ApplePresetDropdown
                      value={editRulesForm.maxRiskPerTrade}
                      onChange={(val) => setEditRulesForm({ ...editRulesForm, maxRiskPerTrade: val })}
                      options={RISK_PRESETS}
                      placeholder="Preset"
                    />
                  </div>

                  <div className="flex items-center rounded-xl bg-white dark:bg-[#161b26] border border-black/[0.08] dark:border-white/[0.1] p-1 shadow-2xs focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all">
                    <button
                      type="button"
                      onClick={() => adjustRisk(-0.25)}
                      className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.15] text-neutral-700 dark:text-neutral-200 flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-2xs"
                      title="Decrease risk"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="text"
                      value={editRulesForm.maxRiskPerTrade || "2%"}
                      onChange={(e) =>
                        setEditRulesForm({ ...editRulesForm, maxRiskPerTrade: e.target.value })
                      }
                      className="w-full text-center text-xs font-bold font-mono text-neutral-900 dark:text-white bg-transparent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => adjustRisk(+0.25)}
                      className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.15] text-neutral-700 dark:text-neutral-200 flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-2xs"
                      title="Increase risk"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 2. Max Trades / Day */}
                <div className="p-3.5 rounded-2xl bg-neutral-50/80 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] hover:border-black/15 dark:hover:border-white/15 transition-all shadow-2xs space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                      Max Trades / Day
                    </label>
                    <ApplePresetDropdown
                      value={String(editRulesForm.maxTradesPerDay)}
                      onChange={(val) => setEditRulesForm({ ...editRulesForm, maxTradesPerDay: val })}
                      options={TRADES_PRESETS}
                      placeholder="Preset"
                    />
                  </div>

                  <div className="flex items-center rounded-xl bg-white dark:bg-[#161b26] border border-black/[0.08] dark:border-white/[0.1] p-1 shadow-2xs focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all">
                    <button
                      type="button"
                      onClick={() => adjustMaxTrades(-1)}
                      className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.15] text-neutral-700 dark:text-neutral-200 flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-2xs"
                      title="Decrease trades"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={editRulesForm.maxTradesPerDay || "5"}
                      onChange={(e) =>
                        setEditRulesForm({ ...editRulesForm, maxTradesPerDay: e.target.value })
                      }
                      className="w-full text-center text-xs font-bold font-mono text-neutral-900 dark:text-white bg-transparent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => adjustMaxTrades(+1)}
                      className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.15] text-neutral-700 dark:text-neutral-200 flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-2xs"
                      title="Increase trades"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 3. Daily Loss Cap */}
                <div className="p-3.5 rounded-2xl bg-neutral-50/80 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] hover:border-black/15 dark:hover:border-white/15 transition-all shadow-2xs space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      Daily Loss Cap
                    </label>
                    <ApplePresetDropdown
                      value={editRulesForm.dailyLossCap}
                      onChange={(val) => setEditRulesForm({ ...editRulesForm, dailyLossCap: val })}
                      options={LOSS_CAP_PRESETS}
                      placeholder="Preset"
                    />
                  </div>

                  <div className="flex items-center rounded-xl bg-white dark:bg-[#161b26] border border-black/[0.08] dark:border-white/[0.1] p-1 shadow-2xs focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all">
                    <button
                      type="button"
                      onClick={() => adjustLossCap(-0.5)}
                      className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.15] text-neutral-700 dark:text-neutral-200 flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-2xs"
                      title="Decrease loss cap"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="text"
                      value={editRulesForm.dailyLossCap || "5%"}
                      onChange={(e) =>
                        setEditRulesForm({ ...editRulesForm, dailyLossCap: e.target.value })
                      }
                      className="w-full text-center text-xs font-bold font-mono text-neutral-900 dark:text-white bg-transparent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => adjustLossCap(+0.5)}
                      className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.15] text-neutral-700 dark:text-neutral-200 flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-2xs"
                      title="Increase loss cap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 4. Loss Streak Break */}
                <div className="p-3.5 rounded-2xl bg-neutral-50/80 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] hover:border-black/15 dark:hover:border-white/15 transition-all shadow-2xs space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      Loss Streak Break
                    </label>
                    <ApplePresetDropdown
                      value={editRulesForm.lossStreakBreak}
                      onChange={(val) => setEditRulesForm({ ...editRulesForm, lossStreakBreak: val })}
                      options={LOSS_STREAK_PRESETS}
                      placeholder="Preset"
                    />
                  </div>

                  <div className="flex items-center rounded-xl bg-white dark:bg-[#161b26] border border-black/[0.08] dark:border-white/[0.1] p-1 shadow-2xs focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all">
                    <button
                      type="button"
                      onClick={() => adjustLossStreak(-1)}
                      className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.15] text-neutral-700 dark:text-neutral-200 flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-2xs"
                      title="Decrease streak break"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="text"
                      value={editRulesForm.lossStreakBreak || "3 in a row"}
                      onChange={(e) =>
                        setEditRulesForm({ ...editRulesForm, lossStreakBreak: e.target.value })
                      }
                      className="w-full text-center text-xs font-bold font-mono text-neutral-900 dark:text-white bg-transparent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => adjustLossStreak(+1)}
                      className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.15] text-neutral-700 dark:text-neutral-200 flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-2xs"
                      title="Increase streak break"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 5. Target Risk / Reward (Full width) */}
                <div className="col-span-1 sm:col-span-2 p-3.5 rounded-2xl bg-neutral-50/80 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] hover:border-black/15 dark:hover:border-white/15 transition-all shadow-2xs space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      Target Risk / Reward Ratio
                    </label>
                    <ApplePresetDropdown
                      value={editRulesForm.targetRR}
                      onChange={(val) => setEditRulesForm({ ...editRulesForm, targetRR: val })}
                      options={RR_PRESETS}
                      placeholder="Preset"
                    />
                  </div>

                  <div className="flex items-center rounded-xl bg-white dark:bg-[#161b26] border border-black/[0.08] dark:border-white/[0.1] p-1 shadow-2xs focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all">
                    <button
                      type="button"
                      onClick={() => adjustRR(-0.5)}
                      className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.15] text-neutral-700 dark:text-neutral-200 flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-2xs"
                      title="Decrease RR"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="text"
                      value={editRulesForm.targetRR || "1:2"}
                      onChange={(e) =>
                        setEditRulesForm({ ...editRulesForm, targetRR: e.target.value })
                      }
                      className="w-full text-center text-xs font-bold font-mono text-neutral-900 dark:text-white bg-transparent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => adjustRR(+0.5)}
                      className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.15] text-neutral-700 dark:text-neutral-200 flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-2xs"
                      title="Increase RR"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsEditRulesOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-sm shadow-blue-500/25 active:scale-95 cursor-pointer"
                >
                  Save Rules
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}

      {/* ══════════════════════════════════════════════════════════════
          REACT PORTAL: EDIT TRADING PREFERENCES MODAL (SESSIONS & PAIRS)
      ══════════════════════════════════════════════════════════════ */}
      {isEditPreferencesOpen &&
        createPortal(
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={() => setIsEditPreferencesOpen(false)} />
            <form
              onSubmit={handleSavePreferences}
              className="relative w-full max-w-xl bg-white/95 dark:bg-[#121622]/95 border border-black/[0.08] dark:border-white/[0.12] rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.2)] dark:shadow-[0_30px_80px_rgba(0,0,0,0.7)] p-6 space-y-5 backdrop-blur-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 flex items-center justify-center">
                    <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                      Edit Trading Preferences
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Configure your active sessions and favorite watchlisted pairs
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditPreferencesOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-black/[0.05] dark:hover:bg-white/[0.08] text-neutral-400 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 1. Active Trading Sessions */}
              <div className="space-y-2">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  ACTIVE TRADING SESSIONS
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "London", name: "London Session", hours: "08:00 - 16:30 GMT" },
                    { id: "New York", name: "New York Session", hours: "13:00 - 21:00 GMT" },
                    { id: "Tokyo", name: "Tokyo / Asian", hours: "00:00 - 09:00 GMT" },
                    { id: "Sydney", name: "Sydney Session", hours: "22:00 - 07:00 GMT" },
                  ].map((sess) => {
                    const isSelected = (editPreferencesForm.preferredSessions || []).includes(sess.id);
                    return (
                      <button
                        key={sess.id}
                        type="button"
                        onClick={() => handleToggleSession(sess.id)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "bg-blue-500/15 border-blue-500/40 text-blue-700 dark:text-blue-300 shadow-xs shadow-blue-500/10"
                            : "bg-neutral-100/70 dark:bg-white/[0.03] border-black/[0.06] dark:border-white/[0.08] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/[0.06]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{sess.name}</span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isSelected ? "bg-blue-500 shadow-[0_0_8px_rgba(0,122,255,0.8)]" : "bg-neutral-300 dark:bg-white/20"
                            }`}
                          />
                        </div>
                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                          {sess.hours}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Favorite Pairs */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    FAVORITE PAIRS WATCHLIST
                  </p>
                  <span className="text-[10px] font-semibold text-neutral-400">
                    {(editPreferencesForm.favoritePairs || []).length} active
                  </span>
                </div>

                {/* Selected Pairs Cloud */}
                <div className="flex flex-wrap gap-2 p-3 rounded-2xl bg-neutral-100/60 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] min-h-[50px] items-center">
                  {(editPreferencesForm.favoritePairs || []).length === 0 ? (
                    <span className="text-xs text-neutral-400 italic">No favorite pairs selected yet. Pick from below or add custom.</span>
                  ) : (
                    (editPreferencesForm.favoritePairs || []).map((pair) => (
                      <span
                        key={pair}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold font-mono bg-white dark:bg-white/[0.09] text-neutral-900 dark:text-white border border-black/[0.08] dark:border-white/[0.12] shadow-xs group"
                      >
                        <span>{pair}</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePair(pair)}
                          className="w-4 h-4 rounded-full hover:bg-rose-500/10 hover:text-rose-500 text-neutral-400 flex items-center justify-center transition-colors cursor-pointer"
                          title="Remove pair"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Add Custom Symbol */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newCustomPair}
                    onChange={(e) => setNewCustomPair(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomPair();
                      }
                    }}
                    placeholder="Enter symbol (e.g. BTC/USD, GBPNZD, US500)..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] text-xs font-mono font-bold text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomPair}
                    className="px-4 py-2 rounded-xl bg-neutral-200 dark:bg-white/[0.08] hover:bg-blue-500 hover:text-white text-neutral-800 dark:text-neutral-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                {/* Quick Add Popular Preset Assets */}
                <div className="space-y-1.5 pt-1">
                  <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500">
                    Quick Add Popular Markets:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "EUR/USD",
                      "GBP/USD",
                      "USD/JPY",
                      "AUD/USD",
                      "USD/CAD",
                      "GBP/JPY",
                      "XAU/USD",
                      "XAG/USD",
                      "USOIL",
                      "NAS100",
                      "US30",
                      "SPX500",
                      "BTC/USD",
                      "ETH/USD",
                    ].map((sym) => {
                      const isAdded = (editPreferencesForm.favoritePairs || []).includes(sym);
                      return (
                        <button
                          key={sym}
                          type="button"
                          onClick={() => handleTogglePair(sym)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                            isAdded
                              ? "bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/35"
                              : "bg-neutral-100 dark:bg-white/[0.04] text-neutral-600 dark:text-neutral-400 border border-black/[0.05] dark:border-white/[0.06] hover:bg-neutral-200 dark:hover:bg-white/[0.08]"
                          }`}
                        >
                          {isAdded ? "✓ " : "+ "}
                          {sym}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsEditPreferencesOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-sm shadow-blue-500/25 active:scale-95 cursor-pointer"
                >
                  Save Preferences
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}

      {/* Profile Photo Lightbox Modal */}
      <ProfilePhotoModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        avatarUrl={profile.avatarUrl}
        displayName={profile.displayName}
        subText={`@${profile.username}`}
        onAvatarUpdated={(newUrl) => {
          setProfile((prev) => ({ ...prev, avatarUrl: newUrl }));
        }}
      />
    </div>
  );
}
