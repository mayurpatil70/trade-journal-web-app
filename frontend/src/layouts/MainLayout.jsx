// frontend/src/layouts/MainLayout.jsx
import NotificationBell from "../components/NotificationBell.jsx";
import BrandLogo from "../components/BrandLogo";
import ThemeToggle from "../components/ThemeToggle.jsx";
import { useTheme } from "../components/theme-provider";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { createPortal } from "react-dom";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import PreTradeGate from "../components/PreTradeGate.jsx";
import PromoPopup from "../components/PromoPopup.jsx";
import SystemAnnouncementBanner from "../components/SystemAnnouncementBanner.jsx";
import ProfilePhotoModal from "../components/ui/ProfilePhotoModal.jsx";
import SupportFeedbackModal from "../components/support/SupportFeedbackModal.jsx";
import SocialFollowPopup from "../components/support/SocialFollowPopup.jsx";
import api from "../api/axios";
import {
  LayoutDashboard,
  PlusCircle,
  List,
  Calendar as CalendarIcon,
  Globe,
  Users,
  Settings,
  Headphones,
  Wallet,
  Menu,
  X,
  LogOut,
  Activity,
  ChevronDown,
  ChevronUp,
  BarChart2,
  TrendingUp,
  FileText,
  User,
  CreditCard,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Zap,
  Lock,
  Calculator as CalculatorIcon,
  Search,
  Sparkles,
  Wrench,
  HelpCircle,
  PenSquare,
  ArrowUpRight,
} from "lucide-react";

// Nav Item with Apple Squircle Geometry & Glossy Interaction
const NavItem = ({
  to,
  icon: Icon,
  label,
  currentPath,
  onClick,
  isBeta = false,
  isDisabled = false,
  isLocked = false,
  onLockedClick,
}) => {
  const isActive = currentPath === to || (to !== "/" && currentPath.startsWith(to + "/"));

  return (
    <Link
      to={isDisabled || isLocked ? "#" : to}
      onClick={(e) => {
        if (isDisabled) e.preventDefault();
        else if (isLocked) {
          e.preventDefault();
          if (onLockedClick) onLockedClick();
        } else if (onClick) onClick();
      }}
      className={`group relative flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all duration-300 font-medium text-[13px] ${
        isDisabled
          ? "opacity-40 cursor-not-allowed text-neutral-400 dark:text-neutral-600"
          : isActive
          ? "bg-white dark:bg-white/[0.09] text-emerald-800 dark:text-white font-semibold border border-black/[0.06] dark:border-white/[0.12] shadow-[0_4px_16px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
          : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/[0.035] dark:hover:bg-white/[0.06] border border-transparent"
      }`}
    >
      {/* Active Left Indicator Bar */}
      {isActive && (
        <span className="absolute left-1.5 top-2.5 bottom-2.5 w-1 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
      )}

      <div className="flex items-center gap-3 pl-1">
        <Icon
          className={`w-[18px] h-[18px] transition-all duration-300 ${
            isActive
              ? "text-emerald-600 dark:text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
              : "text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-800 dark:group-hover:text-neutral-200"
          }`}
          strokeWidth={isActive ? 2.4 : 2}
        />
        <span className="tracking-tight">{label}</span>
      </div>

      <div className="flex items-center gap-2">
        {isBeta && (
          <span className="text-[9px] uppercase tracking-wider font-extrabold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            Beta
          </span>
        )}
        {isLocked && <Lock className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />}
      </div>
    </Link>
  );
};


// Expandable Nav Item for Nested Route Groups (Matches TradeFXBook Analysis Menu)
const ExpandableNavItem = ({ item, currentPath, closeMenu }) => {
  const isChildActive = item.children?.some(
    (c) => currentPath === c.to || currentPath.startsWith(c.to + "/")
  );
  const [isOpen, setIsOpen] = useState(
    isChildActive || currentPath.startsWith("/analysis")
  );

  useEffect(() => {
    if (isChildActive || currentPath.startsWith("/analysis")) {
      setIsOpen(true);
    }
  }, [currentPath, isChildActive]);

  const Icon = item.icon;

  return (
    <div className="space-y-1">
      {/* Parent Pill matching Screenshot 1 */}
      <div
        className={`group relative flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all duration-300 font-medium text-[13px] cursor-pointer ${
          isChildActive
            ? "bg-white dark:bg-white/[0.09] text-blue-600 dark:text-blue-400 font-bold border border-black/[0.06] dark:border-white/[0.12] shadow-sm"
            : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/[0.035] dark:hover:bg-white/[0.06] border border-transparent"
        }`}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div className="flex items-center gap-3 pl-1">
          <Icon
            className={`w-[18px] h-[18px] transition-all duration-300 ${
              isChildActive
                ? "text-blue-600 dark:text-blue-400"
                : "text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-800 dark:group-hover:text-neutral-200"
            }`}
            strokeWidth={isChildActive ? 2.4 : 2}
          />
          <span className="tracking-tight text-[13px]">{item.label}</span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          className="w-6 h-6 rounded-lg flex items-center justify-center bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-colors hover:bg-blue-500/20"
          aria-label="Toggle analysis menu"
        >
          {isOpen ? (
            <ChevronUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
          )}
        </button>
      </div>

      {/* Sub-items matching Screenshot 1 */}
      {isOpen && (
        <div className="pl-3 space-y-1 pt-0.5">
          {item.children.map((sub) => {
            const isSubActive =
              currentPath === sub.to || currentPath.startsWith(sub.to + "/");
            const SubIcon = sub.icon;
            return (
              <Link
                key={sub.to}
                to={sub.to}
                onClick={closeMenu}
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-[12.5px] font-semibold transition-all ${
                  isSubActive
                    ? "bg-white dark:bg-white/[0.09] text-neutral-900 dark:text-white font-bold border border-black/[0.05] dark:border-white/[0.1] shadow-sm"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                }`}
              >
                <SubIcon
                  className={`w-4 h-4 ${
                    isSubActive
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-neutral-400 dark:text-neutral-500"
                  }`}
                  strokeWidth={isSubActive ? 2.4 : 2}
                />
                <span>{sub.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default function MainLayout() {
  const { theme, isDark } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileCoords, setProfileCoords] = useState({ bottom: 0, left: 0, width: 236 });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLockPopup, setShowLockPopup] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportModalMode, setSupportModalMode] = useState("new");
  const [showBugCallout, setShowBugCallout] = useState(
    () => sessionStorage.getItem("fn_hide_bug_callout") !== "true"
  );
  const userCardRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Support / feedback event listeners & query param sync
  useEffect(() => {
    const handleOpenSupport = (e) => {
      setIsSupportModalOpen(true);
      if (e?.detail?.mode) setSupportModalMode(e.detail.mode);
    };
    window.addEventListener("open-support-modal", handleOpenSupport);

    const params = new URLSearchParams(location.search);
    if (params.get("supportOpen") === "1" || params.get("support") === "new") {
      setIsSupportModalOpen(true);
      if (params.get("support") === "new") setSupportModalMode("new");
    }

    return () => {
      window.removeEventListener("open-support-modal", handleOpenSupport);
    };
  }, [location.search]);

  const userId = localStorage.getItem("userId") || localStorage.getItem("userEmail");
  const userEmail = localStorage.getItem("userEmail") || "Trader";

  const getStoredUserName = () => {
    const custom =
      localStorage.getItem("userName") ||
      localStorage.getItem("userDisplayName");
    if (custom && custom.trim() && custom !== "undefined" && custom !== "null") {
      return custom.trim();
    }
    const uid = localStorage.getItem("userId") || localStorage.getItem("userEmail") || "";
    try {
      const cached = JSON.parse(localStorage.getItem(`trader_profile_${uid}`) || "{}");
      if (cached.displayName && cached.displayName.trim()) {
        return cached.displayName.trim();
      }
    } catch (e) {}
    if (userEmail && userEmail.includes("@")) {
      return userEmail.split("@")[0];
    }
    return userEmail || "Trader";
  };

  const [userName, setUserName] = useState(getStoredUserName);
  const [userAvatar, setUserAvatar] = useState(() => {
    const uid = localStorage.getItem("userId") || localStorage.getItem("userEmail");
    return localStorage.getItem("userAvatar") || localStorage.getItem(`user_avatar_${uid}`) || "";
  });
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  useEffect(() => {
    const handleProfileSync = (e) => {
      const uid = localStorage.getItem("userId") || localStorage.getItem("userEmail");
      if (e?.detail?.displayName) {
        setUserName(e.detail.displayName);
      } else {
        setUserName(getStoredUserName());
      }
      if (e?.detail?.avatarUrl) {
        setUserAvatar(e.detail.avatarUrl);
      } else {
        setUserAvatar(localStorage.getItem("userAvatar") || localStorage.getItem(`user_avatar_${uid}`) || "");
      }
    };
    window.addEventListener("user_profile_updated", handleProfileSync);
    window.addEventListener("storage", handleProfileSync);
    return () => {
      window.removeEventListener("user_profile_updated", handleProfileSync);
      window.removeEventListener("storage", handleProfileSync);
    };
  }, []);

  const isAdmin = userId === "noballondesk@gmail.com" || userId === "akpatil51340@gmail.com";

  // System broadcast announcement
  const [announcement, setAnnouncement] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchAnn = () => {
      api
        .get("/api/admin/public/announcement")
        .then((res) => {
          if (!cancelled && res.data?.success) {
            if (res.data.announcement?.active && res.data.announcement?.message) {
              setAnnouncement(res.data.announcement);
            } else {
              setAnnouncement(null);
            }
          }
        })
        .catch(() => {});
    };
    fetchAnn();
    const interval = setInterval(fetchAnn, 5 * 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Command palette shortcut (⌘K or Ctrl+K or custom event)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsSearchOpen(false);
        setIsProfileOpen(false);
        setShowLockPopup(false);
      }
    };
    const handleOpenSearch = () => {
      setIsSearchOpen(true);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-spotlight-search", handleOpenSearch);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-spotlight-search", handleOpenSearch);
    };
  }, []);

  // Update position of user profile dropdown popover
  const updateProfileCoords = useCallback(() => {
    if (!userCardRef.current) return;
    const rect = userCardRef.current.getBoundingClientRect();
    setProfileCoords({
      bottom: window.innerHeight - rect.top + 8,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  const toggleProfile = () => {
    if (!isProfileOpen) updateProfileCoords();
    setIsProfileOpen((p) => !p);
  };

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    navigate("/login");
  };

  const closeMenu = () => {
    setIsMobileMenuOpen(false);
    setIsProfileOpen(false);
  };

  const navSections = [
    {
      label: "Trade",
      items: [
        { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { to: "/add-trade", icon: PlusCircle, label: "Add Trade" },
        { to: "/trades", icon: List, label: "Past Trades" },
        { to: "/calendar", icon: CalendarIcon, label: "Calendar" },
      ],
    },
    {
      label: "Analyze",
      items: [
        {
          label: "Analysis",
          to: "/analysis/performance",
          icon: BarChart2,
          isExpandable: true,
          children: [
            { to: "/analysis/performance", icon: TrendingUp, label: "Performance" },
            { to: "/analysis/trades", icon: FileText, label: "Trade Analysis" },
          ],
        },
      ],
    },
    {
      label: "Tools",
      items: [
        { to: "/tools", icon: Wrench, label: "Tools" },
        { to: "/charts", icon: Activity, label: "Live Charts" },
        { to: "/sessions", icon: Zap, label: "Setup Backtesting" },
        { to: "/news", icon: Globe, label: "Economic Calendar" },
      ],
    },
    {
      label: "System",
      items: [
        { to: "/accounts", icon: Users, label: "Prop firm" },
        { to: "/support", icon: HelpCircle, label: "Help & Support" },
        { to: "/affiliate", icon: Wallet, label: "Affiliate" },
      ],
    },
  ];

  // Route title formatting for dynamic Apple topbar
  const pathTitle = (() => {
    const p = location.pathname;
    if (p.includes("dashboard")) return "Dashboard";
    if (p.includes("add-trade")) return "Add Trade";
    if (p.includes("trades")) return "Past Trades";
    if (p.includes("calendar")) return "Calendar";
    if (p.includes("analysis/performance")) return "Performance Analytics";
    if (p.includes("analysis/trades")) return "Trade Analysis";
    if (p.includes("analysis")) return "Performance Analytics";
    if (p.includes("analytics")) return "Strategy Analytics";
    if (p.includes("psychology")) return "Psychology Lab";
    if (p.includes("mistakes")) return "Mistake Lab";
    if (p.includes("tools")) return "Trading Tools";
    if (p.includes("market-hours")) return "Forex Market Hours";
    if (p.includes("charts")) return "Live Charts";
    if (p.includes("sessions")) return "Setup Backtesting";
    if (p.includes("news")) return "Economic Calendar";
    if (p.includes("calculator")) return "Calculators";
    if (p.includes("accounts")) return "Prop Firm Accounts";
    if (p.includes("settings")) return "Settings";
    if (p.includes("profile")) return "Profile";
    if (p.includes("support")) return "Support";
    if (p.includes("affiliate")) return "Affiliate";
    if (p.includes("admin")) return "Command Center";
    return "Forex Notes";
  })();

  const spotlightActions = [
    {
      to: "/add-trade",
      label: "Log a new trade",
      sub: "Enter entry, exit, PnL and trade setup",
      icon: PlusCircle,
      iconColor: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      keywords: ["add", "trade", "log", "new", "entry", "pnl", "manual"],
    },
    {
      to: "/tools",
      label: "Trading Tools Hub",
      sub: "Professional calculators, market hours, and utilities",
      icon: Wrench,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-500/10",
      keywords: ["tools", "tool", "calculator", "position", "size", "prop", "firm", "utility"],
    },
    {
      to: "/calculator/lot-size",
      label: "Lot Size Calculator",
      sub: "Calculate exact standard lot sizes for your risk",
      icon: CalculatorIcon,
      iconColor: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      keywords: ["lot", "size", "calculator", "calc", "pip", "risk", "position"],
    },
    {
      to: "/calculator/prop-firm",
      label: "Prop Firm Challenge Calculator",
      sub: "Simulate drawdown limits and pass evaluations safely",
      icon: ShieldAlert,
      iconColor: "text-rose-500",
      bgColor: "bg-rose-500/10",
      keywords: ["prop", "firm", "drawdown", "ftmo", "calculator", "evaluation", "funding"],
    },
    {
      to: "/market-hours",
      label: "Forex Market Hours",
      sub: "Track London, New York, Asian, Sydney sessions & ICT killzones",
      icon: Clock,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-500/10",
      keywords: ["market", "hours", "forex", "session", "london", "new york", "killzone", "sydney", "tokyo", "asian", "clock"],
    },
    {
      to: "/charts",
      label: "Live Charts",
      sub: "TradingView real-time technical analysis & charting",
      icon: Activity,
      iconColor: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
      keywords: ["chart", "live", "charts", "tradingview", "technical", "candle", "crypto", "forex"],
    },
    {
      to: "/sessions",
      label: "Setup Backtesting",
      sub: "Replay sessions, test setups & backtest execution",
      icon: Zap,
      iconColor: "text-amber-500",
      bgColor: "bg-amber-500/10",
      keywords: ["backtest", "backtesting", "setup", "session", "replay", "bar", "history"],
    },
    {
      to: "/analysis/performance",
      label: "Strategy Analytics",
      sub: "Win rate, profit factor, drawdown & edge metrics",
      icon: TrendingUp,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-500/10",
      keywords: ["analytics", "performance", "win", "rate", "profit", "drawdown", "edge"],
    },
    {
      to: "/trades",
      label: "Past Trades Journal",
      sub: "Search and inspect historical trade records",
      icon: List,
      iconColor: "text-purple-500",
      bgColor: "bg-purple-500/10",
      keywords: ["past", "trades", "journal", "history", "table", "records"],
    },
    {
      to: "/news",
      label: "Economic Calendar",
      sub: "Upcoming high-impact macroeconomic events",
      icon: Globe,
      iconColor: "text-rose-500",
      bgColor: "bg-rose-500/10",
      keywords: ["news", "calendar", "economic", "cpi", "fomc", "nfp", "events"],
    },
  ];

  const filteredSpotlightActions = spotlightActions.filter((action) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      action.label.toLowerCase().includes(q) ||
      action.sub.toLowerCase().includes(q) ||
      action.keywords.some((kw) => kw.includes(q))
    );
  });

  return (
    <div
      className="flex h-screen w-full bg-[#f8f9fc] dark:bg-[#0a0c10] text-neutral-900 dark:text-neutral-100 transition-colors duration-300 overflow-hidden font-sans relative"
      style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* ── Ambient Background Canvas ── */}
      <div className="pointer-events-none absolute inset-0 z-0 select-none bg-gradient-to-br from-transparent via-transparent to-emerald-500/[0.02]" />

      {/* ── REACT PORTAL: Feature Lock / Pro Popup ── */}
      {showLockPopup &&
        createPortal(
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 dark:bg-black/70 backdrop-blur-md px-4 animate-in fade-in duration-200">
            <div
              className="bg-white/90 dark:bg-[#121622]/90 border border-black/[0.08] dark:border-white/[0.12] p-7 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.7)] max-w-sm w-full relative text-center backdrop-blur-2xl animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowLockPopup(false)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 dark:hover:text-white p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-14 h-14 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm shadow-emerald-500/20">
                <Lock className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">Coming Soon</h3>
              <p className="text-neutral-600 dark:text-neutral-400 text-xs leading-relaxed mb-6">
                This feature is currently in active development for the upcoming Pro Plan release.
              </p>
              <button
                onClick={() => setShowLockPopup(false)}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/25 active:scale-95"
              >
                Got it
              </button>
            </div>
          </div>,
          document.body
        )}

      {/* ── Desktop Top-Right Action Cluster (Always Visible across pages, hidden on /dashboard to avoid duplicate overlap) ── */}
      {location.pathname !== "/dashboard" && (
        <div className="max-md:hidden flex fixed top-3.5 right-6 z-50 items-center gap-2 p-1 rounded-2xl bg-white/75 dark:bg-[#10131b]/75 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.12] shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all">
          <button
            type="button"
            onClick={() => {
              setSupportModalMode("new");
              setIsSupportModalOpen(true);
            }}
            title="Help & Feedback"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Send feedback"
          >
            <PenSquare className="w-4 h-4" />
          </button>
          <NotificationBell />
          <ThemeToggle />
        </div>
      )}

      {/* ── Mobile iOS Header ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white/75 dark:bg-[#0c0e15]/75 backdrop-blur-2xl border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between px-4 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <BrandLogo className="h-10 w-auto object-contain" />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSupportModalMode("new");
              setIsSupportModalOpen(true);
            }}
            title="Help & Feedback"
            className="p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Send feedback"
          >
            <PenSquare className="w-4 h-4" />
          </button>
          <ThemeToggle />
          <NotificationBell />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ── macOS Frosted Glass Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-[260px] bg-white/70 dark:bg-[#10131b]/70 backdrop-blur-2xl border-r border-black/[0.06] dark:border-white/[0.08] shadow-[2px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_40px_rgba(0,0,0,0.5)] transform transition-transform duration-300 ease-in-out flex flex-col ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0`}
      >
        {/* macOS Window Top Chrome */}
        <div className="h-16 flex items-center px-5 shrink-0 hidden md:flex border-b border-black/[0.05] dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            {/* Apple Window Traffic Light Dots */}
            <div className="flex items-center gap-1.5 mr-1 group/traffic cursor-default">
              <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] shadow-sm inline-block group-hover/traffic:brightness-95 transition-all" />
              <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] shadow-sm inline-block group-hover/traffic:brightness-95 transition-all" />
              <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29] shadow-sm inline-block group-hover/traffic:brightness-95 transition-all" />
            </div>
            <BrandLogo className="h-8 w-auto object-contain" />
          </div>
        </div>

        {/* Navigation Item Tree */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-6 scrollbar-hide mt-14 md:mt-0">
          {navSections.map((section) => (
            <div key={section.label}>
              {/* Found a bug? Callout card (Matches TradeFXBook Screenshot 2) placed above System */}
              {section.label === "System" && showBugCallout && (
                <div className="mb-4 p-3 rounded-2xl bg-white dark:bg-[#121622] border border-blue-500/20 dark:border-blue-400/20 shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.3)] relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] font-bold text-neutral-900 dark:text-white tracking-tight">
                      Found a bug?
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowBugCallout(false);
                        sessionStorage.setItem("fn_hide_bug_callout", "true");
                      }}
                      className="w-5 h-5 rounded-md flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      aria-label="Dismiss bug prompt"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSupportModalMode("new");
                      setIsSupportModalOpen(true);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/25 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <span>Report an issue</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              <p className="px-3.5 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-2">
                {section.label}
              </p>
              <div className="space-y-1">
                {section.items.map((item) =>
                  item.isExpandable ? (
                    <ExpandableNavItem
                      key={item.label}
                      item={item}
                      currentPath={location.pathname}
                      closeMenu={closeMenu}
                    />
                  ) : (
                    <NavItem
                      key={item.to}
                      to={item.to}
                      icon={item.icon}
                      label={item.label}
                      isBeta={item.isBeta}
                      isDisabled={item.isDisabled}
                      isLocked={!isAdmin && item.requiresAdmin}
                      onLockedClick={() => setShowLockPopup(true)}
                      currentPath={location.pathname}
                      onClick={closeMenu}
                    />
                  )
                )}
              </div>
            </div>
          ))}

          {/* ADMIN MENU (Conditionally Rendered) */}
          {["noballondesk@gmail.com", "akpatil51340@gmail.com"].includes(
            localStorage.getItem("userEmail")
          ) && (
            <div className="pt-4 mt-4 border-t border-black/[0.05] dark:border-white/[0.06]">
              <p className="px-3.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">
                Admin
              </p>
              <div className="space-y-1">
                <NavItem
                  to="/admin"
                  icon={ShieldCheck}
                  label="Command Center"
                  currentPath={location.pathname}
                  onClick={closeMenu}
                />
                <NavItem
                  to="/admin/setup"
                  icon={Settings}
                  label="Bot Setup"
                  currentPath={location.pathname}
                  onClick={closeMenu}
                />
                <NavItem
                  to="/admin/trading-bot"
                  icon={Activity}
                  label="Trading Bot"
                  currentPath={location.pathname}
                  onClick={closeMenu}
                />
              </div>
            </div>
          )}
        </nav>

        {/* User Card with Squircle Avatar */}
        <div className="p-3 relative">
          <div
            ref={userCardRef}
            onClick={toggleProfile}
            className="flex items-center justify-between p-2.5 rounded-2xl bg-white/70 dark:bg-white/[0.04] hover:bg-white/95 dark:hover:bg-white/[0.08] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_10px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div
                className="relative cursor-pointer group/avatar"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPhotoModalOpen(true);
                }}
                title="Click to view & update profile photo"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-500/30 shadow-inner group-hover/avatar:ring-2 group-hover/avatar:ring-emerald-500 transition-all overflow-hidden">
                  {userAvatar ? (
                    <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform" />
                  ) : (
                    (userName || userEmail).charAt(0).toUpperCase()
                  )}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-[#10131b] rounded-full" />
              </div>
              <div className="overflow-hidden flex flex-col items-start">
                <p className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-200 leading-tight truncate max-w-[110px]">
                  {userName || userEmail}
                </p>
                <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
                  Pro Workspace
                </span>
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-neutral-400 transition-transform duration-300 ${
                isProfileOpen ? "rotate-180 text-emerald-500" : "group-hover:text-neutral-700 dark:group-hover:text-neutral-200"
              }`}
            />
          </div>
        </div>
      </aside>

      {/* ── REACT PORTAL: User Profile Popover ── */}
      {isProfileOpen &&
        createPortal(
          <>
            {/* Click dismissal backdrop */}
            <div
              className="fixed inset-0 z-[9980] bg-transparent"
              onClick={() => setIsProfileOpen(false)}
            />
            <div
              style={{
                position: "fixed",
                bottom: profileCoords.bottom,
                left: profileCoords.left,
                width: profileCoords.width,
              }}
              className="z-[9985] bg-white/90 dark:bg-[#131622]/90 border border-black/[0.08] dark:border-white/[0.12] rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl p-1.5 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150 space-y-0.5"
            >
              <Link
                to="/profile"
                onClick={closeMenu}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-colors"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <User className="w-3.5 h-3.5" />
                </div>
                Profile Settings
              </Link>
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  navigate("/profile?tab=billing");
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-colors text-left cursor-pointer"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
                Membership & Billing
              </button>
              <div className="my-1 border-t border-black/[0.05] dark:border-white/[0.06]" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
              >
                <div className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <LogOut className="w-3.5 h-3.5" />
                </div>
                Log out
              </button>
            </div>
          </>,
          document.body
        )}

      {/* ── Main Viewport Area ── */}
      <main className="flex-1 overflow-y-auto relative pt-14 pb-16 md:pt-0 md:pb-0 z-10">
        {/* System Broadcast Announcement */}
        <SystemAnnouncementBanner announcement={announcement} isDark={isDark} />

        {/* Workspace Route Container */}
        <Suspense
          fallback={
            <div className="min-h-[70vh] flex flex-col items-center justify-center p-8">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin mb-3" />
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium tracking-wide">
                Loading workspace view...
              </p>
            </div>
          }
        >
          <div className="relative">
            <Outlet />
          </div>
        </Suspense>
      </main>

      {/* ── REACT PORTAL: macOS Spotlight Command Palette ── */}
      {isSearchOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[10000] flex items-start justify-center pt-[14vh] p-4 bg-black/40 dark:bg-black/70 backdrop-blur-md animate-in fade-in duration-150"
            onClick={() => {
              setIsSearchOpen(false);
              setSearchQuery("");
            }}
          >
            <div
              className="w-full max-w-xl bg-white/95 dark:bg-[#121622]/95 border border-black/[0.08] dark:border-white/[0.12] rounded-3xl shadow-[0_30px_70px_rgba(0,0,0,0.2)] dark:shadow-[0_35px_80px_rgba(0,0,0,0.7)] backdrop-blur-2xl overflow-hidden animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center px-4 py-3.5 border-b border-black/[0.06] dark:border-white/[0.08]">
                <Search className="w-5 h-5 text-emerald-500 mr-3 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && filteredSpotlightActions.length > 0) {
                      navigate(filteredSpotlightActions[0].to);
                      setIsSearchOpen(false);
                      setSearchQuery("");
                    }
                  }}
                  placeholder="Search tools, calculators, live charts, backtesting..."
                  autoFocus
                  className="flex-1 bg-transparent border-none outline-none text-neutral-900 dark:text-white placeholder-neutral-400 text-sm font-medium"
                />
                <button
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery("");
                  }}
                  className="px-2 py-0.5 bg-black/[0.05] dark:bg-white/10 text-neutral-500 dark:text-neutral-400 text-[11px] font-mono rounded-md hover:bg-black/10 dark:hover:bg-white/15 cursor-pointer"
                >
                  ESC
                </button>
              </div>

              <div className="p-2 space-y-1 max-h-[380px] overflow-y-auto scrollbar-hide">
                <p className="px-3 py-1.5 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                  {searchQuery.trim() ? "Search Results" : "Quick Actions"}
                </p>
                {filteredSpotlightActions.length === 0 ? (
                  <div className="px-4 py-8 text-center text-xs text-neutral-400">
                    No matching actions found for &ldquo;{searchQuery}&rdquo;.
                  </div>
                ) : (
                  filteredSpotlightActions.map((action) => {
                    const ActionIcon = action.icon;
                    return (
                      <button
                        key={action.to + action.label}
                        onClick={() => {
                          navigate(action.to);
                          setIsSearchOpen(false);
                          setSearchQuery("");
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-xl transition-colors text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-lg ${action.bgColor} ${action.iconColor} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}
                          >
                            <ActionIcon className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <p className="font-semibold text-neutral-900 dark:text-white leading-tight">
                              {action.label}
                            </p>
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                              {action.sub}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-medium text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                          Jump →
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden backdrop-blur-sm"
          onClick={closeMenu}
        />
      )}

      <PromoPopup />
      <PreTradeGate />
      <ProfilePhotoModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        avatarUrl={userAvatar}
        displayName={userName || userEmail}
        subText={userEmail}
        onAvatarUpdated={(newUrl) => setUserAvatar(newUrl)}
      />
      <SupportFeedbackModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        initialMode={supportModalMode}
      />
      <SocialFollowPopup />
    </div>
  );
}
