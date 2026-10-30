// frontend/src/layouts/MainLayout.jsx
import NotificationBell from "../components/NotificationBell.jsx";
import BrandLogo from "../components/BrandLogo";
import ThemeToggle from "../components/ThemeToggle.jsx";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { createPortal } from "react-dom";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import PreTradeGate from "../components/PreTradeGate.jsx";
import PromoPopup from "../components/PromoPopup.jsx";
import SystemAnnouncementBanner from "../components/SystemAnnouncementBanner.jsx";
import ProfilePhotoModal from "../components/ui/ProfilePhotoModal.jsx";
import SupportFeedbackModal from "../components/support/SupportFeedbackModal.jsx";
import FloatingMessenger from "../components/lounge/FloatingMessenger.jsx";
import InstallAppButton from "../components/InstallAppButton.jsx";
import { prefetchRoute, prefetchAllSecondaryRoutes } from "../utils/routePrefetch";
import api, { logoutSession } from "../api/axios";
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
  ArrowRight,
  BookOpen,
  Brain,
  AlertTriangle,
  Briefcase,
  Trophy,
  MessageSquareText,
  MessagesSquare,
  Gift,
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
  end = false,
  highlight = false,
}) => {
  const isActive = currentPath === to || (!end && to !== "/" && currentPath.startsWith(to + "/"));

  if (highlight) {
    return (
      <Link
        to={to}
        onMouseEnter={() => prefetchRoute(to)}
        onFocus={() => prefetchRoute(to)}
        onPointerDown={() => prefetchRoute(to)}
        onClick={onClick}
        className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[13px] font-semibold transition-all duration-300 border ${
          isActive
            ? "bg-[#0066FF] text-white border-[#0066FF] shadow-[0_4px_14px_rgba(0,102,255,0.35)]"
            : "bg-blue-500/[0.08] text-[#0066FF] dark:text-sky-400 border-blue-500/20 hover:bg-blue-500/[0.14]"
        }`}
      >
        <Icon className="w-[18px] h-[18px] ml-1" strokeWidth={2.3} />
        <span className="tracking-tight">{label}</span>
      </Link>
    );
  }

  return (
    <Link
      to={isDisabled || isLocked ? "#" : to}
      onMouseEnter={() => !isDisabled && !isLocked && prefetchRoute(to)}
      onFocus={() => !isDisabled && !isLocked && prefetchRoute(to)}
      onPointerDown={() => !isDisabled && !isLocked && prefetchRoute(to)}
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
          ? "bg-white dark:bg-white/[0.09] text-blue-800 dark:text-white font-semibold border border-black/[0.06] dark:border-white/[0.12] shadow-[0_4px_16px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
          : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/[0.035] dark:hover:bg-white/[0.06] border border-transparent"
      }`}
    >
      {/* Active Left Indicator Bar */}
      {isActive && (
        <span className="absolute left-1.5 top-2.5 bottom-2.5 w-1 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(0,122,255,0.8)]" />
      )}

      <div className="flex items-center gap-3 pl-1">
        <Icon
          className={`w-[18px] h-[18px] transition-all duration-300 ${
            isActive
              ? "text-blue-600 dark:text-blue-400 drop-shadow-[0_0_8px_rgba(0,122,255,0.5)]"
              : "text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-800 dark:group-hover:text-neutral-200"
          }`}
          strokeWidth={isActive ? 2.4 : 2}
        />
        <span className="tracking-tight">{label}</span>
      </div>

      <div className="flex items-center gap-2">
        {isBeta && (
          <span className="text-[9px] uppercase tracking-wider font-extrabold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
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
  const inSection = item.matchPrefixes.some((p) => currentPath.startsWith(p));
  const isChildActive = inSection;
  const [isOpen, setIsOpen] = useState(inSection);

  useEffect(() => {
    if (inSection) setIsOpen(true);
  }, [inSection]);

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
          aria-label={`Toggle ${item.label} menu`}
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
              currentPath === sub.to ||
              (!sub.end && currentPath.startsWith(sub.to + "/")) ||
              sub.alsoActive?.some((p) => currentPath.startsWith(p));
            const SubIcon = sub.icon;
            return (
              <Link
                key={sub.to}
                to={sub.to}
                onMouseEnter={() => prefetchRoute(sub.to)}
                onFocus={() => prefetchRoute(sub.to)}
                onPointerDown={() => prefetchRoute(sub.to)}
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileCoords, setProfileCoords] = useState({ bottom: 0, left: 0, width: 236 });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef(null);
  const listContainerRef = useRef(null);
  const [showLockPopup, setShowLockPopup] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportModalMode, setSupportModalMode] = useState("new");
  // TradeFXBook "Found a bug?" sidebar callout card: Resets on page refresh, on new sign up, and every 24h trading cycle
  const [showBugCallout, setShowBugCallout] = useState(true);

  useEffect(() => {
    // Prefetch all secondary routes during idle time for 0ms transitions
    prefetchAllSecondaryRoutes();

    // Clear legacy suppression so page refresh always restores the support card
    sessionStorage.removeItem("fn_hide_bug_callout");

    const check24hReset = () => {
      const dismissedAt = localStorage.getItem("fn_bug_callout_dismissed_at");
      if (dismissedAt) {
        const elapsed = Date.now() - parseInt(dismissedAt, 10);
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
        if (elapsed >= TWENTY_FOUR_HOURS) {
          setShowBugCallout(true);
          localStorage.removeItem("fn_bug_callout_dismissed_at");
        }
      }
    };

    check24hReset();
    const interval = setInterval(check24hReset, 60 * 1000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const handleDismissBugCallout = () => {
    setShowBugCallout(false);
    localStorage.setItem("fn_bug_callout_dismissed_at", Date.now().toString());
  };
  const userCardRef = useRef(null);
  const location = useLocation();
  const [pastDashboardTopBar, setPastDashboardTopBar] = useState(false);

  useEffect(() => {
    if (location.pathname !== "/dashboard") return;
    const onScroll = () => setPastDashboardTopBar(window.scrollY > 90);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [location.pathname]);
  const navigate = useNavigate();

  useEffect(() => {
    const pendingInvite = localStorage.getItem("pending_invite");
    if (!pendingInvite) return;
    localStorage.removeItem("pending_invite");
    navigate(pendingInvite, { replace: true });
  }, [navigate]);

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

  // Spotlight search focus & scroll synchronization
  useEffect(() => {
    if (isSearchOpen) {
      setSelectedIndex(0);
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 40);
      return () => clearTimeout(timer);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (isSearchOpen && listContainerRef.current) {
      const activeEl = listContainerRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      );
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex, isSearchOpen]);

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

  const handleLogout = async () => {
    try {
      await logoutSession();
    } catch {
      // handled in logoutSession
    } finally {
      navigate("/login");
    }
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
          matchPrefixes: ["/analysis"],
          children: [
            { to: "/analysis/performance", icon: TrendingUp, label: "Performance" },
            { to: "/analysis/trades", icon: FileText, label: "Trade Analysis" },
          ],
        },
      ],
    },
    {
      label: "Community",
      items: [
        { to: "/community", icon: MessagesSquare, label: "Traders Community", highlight: true },
        {
          label: "Traders Lounge",
          to: "/lounge",
          icon: Users,
          isExpandable: true,
          matchPrefixes: ["/lounge"],
          children: [
            { to: "/lounge", icon: Trophy, label: "Leaderboard", end: true, alsoActive: ["/lounge/trader"] },
            { to: "/lounge/feed", icon: MessageSquareText, label: "Thought Stream" },
            { to: "/lounge/deals", icon: Gift, label: "Partner Deals" },
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
    if (p.startsWith("/lounge/feed")) return "Thought Stream";
    if (p.startsWith("/lounge/deals")) return "Partner Deals";
    if (p.startsWith("/community") || p.startsWith("/messages")) return "Traders Community";
    if (p.startsWith("/lounge")) return "Traders Lounge";
    if (p.includes("dashboard")) return "Dashboard";
    if (p.includes("add-trade")) return "Add Trade";
    if (p.includes("trades")) return "Past Trades";
    if (p.includes("calendar")) return "Economic Calendar";
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

  const spotlightCategories = [
    {
      title: "BACKTESTING",
      items: [
        {
          to: "/sessions",
          label: "Backtesting",
          sub: "Open Backtesting backtesting sessions",
          icon: TrendingUp,
          keywords: ["backtest", "backtesting", "sessions", "replay", "bar", "history"],
        },
      ],
    },
    {
      title: "MAIN",
      items: [
        {
          to: "/dashboard",
          label: "Dashboard",
          sub: "View your trading overview and stats",
          icon: LayoutDashboard,
          keywords: ["dashboard", "home", "stats", "overview", "equity", "pnl", "main"],
        },
        {
          to: "/trades",
          label: "Trades",
          sub: "View and manage all your trades",
          icon: Briefcase,
          keywords: ["trades", "past", "history", "records", "orders", "journal"],
        },
        {
          to: "/add-trade",
          label: "Journal",
          sub: "Write and review your trade journal entries",
          icon: BookOpen,
          keywords: ["journal", "add", "trade", "log", "new", "entry"],
        },
        {
          to: "/accounts",
          label: "Trader POV",
          sub: "View trader POV dashboards or manage your access codes",
          icon: Users,
          keywords: ["trader", "pov", "prop", "firm", "accounts", "challenges"],
        },
        {
          to: "/news",
          label: "Economic Calendar",
          sub: "Economic Calendar of high-impact news & market events",
          icon: Globe,
          keywords: ["calendar", "news", "economic", "events", "forex factory", "schedule"],
        },
      ],
    },
    {
      title: "ANALYTICS",
      items: [
        {
          to: "/analysis/performance",
          label: "Performance",
          sub: "Analyze your win rate, profit factor and edge",
          icon: BarChart2,
          keywords: ["performance", "analytics", "win", "rate", "profit", "edge", "drawdown"],
        },
        {
          to: "/analysis/trades",
          label: "Trade Analysis",
          sub: "Detailed breakdown of your execution and setups",
          icon: FileText,
          keywords: ["trade", "analysis", "breakdown", "setups", "execution"],
        },
        {
          to: "/psychology",
          label: "Psychology Lab",
          sub: "Track mindset, discipline, and emotional triggers",
          icon: Brain,
          keywords: ["psychology", "discipline", "mindset", "fomo", "greed", "emotions"],
        },
        {
          to: "/mistakes",
          label: "Mistake Lab",
          sub: "Identify recurring errors and stop revenue leaks",
          icon: AlertTriangle,
          keywords: ["mistake", "error", "rules", "leak", "discipline"],
        },
      ],
    },
    {
      title: "TOOLS & CALCULATORS",
      items: [
        {
          to: "/tools",
          label: "Trading Tools Hub",
          sub: "Professional calculators, market hours, and utilities",
          icon: Wrench,
          keywords: ["tools", "tool", "calculator", "position", "size", "prop", "firm", "utility"],
        },
        {
          to: "/calculator/lot-size",
          label: "Lot Size Calculator",
          sub: "Calculate exact standard lot sizes for your risk",
          icon: CalculatorIcon,
          keywords: ["lot", "size", "calculator", "calc", "pip", "risk", "position"],
        },
        {
          to: "/calculator/prop-firm",
          label: "Prop Firm Challenge Calculator",
          sub: "Simulate drawdown limits and pass evaluations safely",
          icon: ShieldAlert,
          keywords: ["prop", "firm", "drawdown", "ftmo", "calculator", "evaluation", "funding"],
        },
        {
          to: "/market-hours",
          label: "Forex Market Hours",
          sub: "Track London, New York, Asian, Sydney sessions & ICT killzones",
          icon: Clock,
          keywords: ["market", "hours", "forex", "session", "london", "new york", "killzone", "sydney", "tokyo", "asian", "clock"],
        },
        {
          to: "/charts",
          label: "Live Charts",
          sub: "TradingView real-time technical analysis & charting",
          icon: Activity,
          keywords: ["chart", "live", "charts", "tradingview", "technical", "candle", "crypto", "forex"],
        },
        {
          to: "/news",
          label: "Economic Calendar",
          sub: "Upcoming high-impact macroeconomic events and CPI",
          icon: Globe,
          keywords: ["news", "calendar", "economic", "cpi", "fomc", "nfp", "events"],
        },
      ],
    },
    {
      title: "COMMUNITY",
      items: [
        {
          to: "/affiliate",
          label: "Lounges & Affiliate",
          sub: "Connect with elite traders and earn partner rewards",
          icon: Wallet,
          keywords: ["community", "affiliate", "partner", "lounges", "referral", "reward"],
        },
      ],
    },
    {
      title: "SETTINGS",
      items: [
        {
          to: "/profile",
          label: "Profile",
          sub: "Manage your trader profile, rules, and preferences",
          icon: User,
          keywords: ["profile", "account", "user", "avatar", "rules", "preferences"],
        },
        {
          to: "/settings",
          label: "Settings",
          sub: "Workspace configuration and account settings",
          icon: Settings,
          keywords: ["settings", "preferences", "config", "workspace", "account"],
        },
        {
          to: "/paywall",
          label: "Subscription & Billing",
          sub: "Manage your Pro Trader subscription and billing tier",
          icon: CreditCard,
          keywords: ["billing", "subscription", "plan", "pro", "pricing", "paywall", "tier"],
        },
        {
          to: "/support",
          label: "Help & Support",
          sub: "Report an issue, send feedback, or reach developer support",
          icon: HelpCircle,
          keywords: ["support", "help", "bug", "report", "feedback", "issue"],
        },
      ],
    },
  ];

  const searchQ = searchQuery.toLowerCase().trim();

  let globalCounter = 0;
  const filteredCategories = spotlightCategories
    .map((cat) => {
      const items = cat.items
        .filter((item) => {
          if (!searchQ) return true;
          return (
            item.label.toLowerCase().includes(searchQ) ||
            item.sub.toLowerCase().includes(searchQ) ||
            item.keywords.some((kw) => kw.includes(searchQ))
          );
        })
        .map((item) => ({
          ...item,
          globalIndex: globalCounter++,
        }));
      return {
        title: cat.title,
        items,
      };
    })
    .filter((cat) => cat.items.length > 0);

  const flatFilteredItems = filteredCategories.flatMap((cat) => cat.items);

  const handleSearchKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (flatFilteredItems.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % flatFilteredItems.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (flatFilteredItems.length > 0) {
        setSelectedIndex(
          (prev) => (prev - 1 + flatFilteredItems.length) % flatFilteredItems.length
        );
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatFilteredItems.length > 0 && flatFilteredItems[selectedIndex]) {
        navigate(flatFilteredItems[selectedIndex].to);
        setIsSearchOpen(false);
        setSearchQuery("");
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <div
      className="flex h-screen w-full bg-[#f8f9fc] dark:bg-[#0a0c10] text-neutral-900 dark:text-neutral-100 transition-colors duration-300 overflow-hidden font-sans relative"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {/* ── Ambient Background Canvas ── */}
      <div className="pointer-events-none absolute inset-0 z-0 select-none bg-gradient-to-br from-transparent via-transparent to-blue-500/[0.02]" />

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
              <div className="w-14 h-14 bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm shadow-blue-500/20">
                <Lock className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">Coming Soon</h3>
              <p className="text-neutral-600 dark:text-neutral-400 text-xs leading-relaxed mb-6">
                This feature is currently in active development for the upcoming Pro Plan release.
              </p>
              <button
                onClick={() => setShowLockPopup(false)}
                className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/25 active:scale-95"
              >
                Got it
              </button>
            </div>
          </div>,
          document.body
        )}

      {/* ── Desktop Top-Right Action Cluster (on /dashboard it appears once the top bar scrolls away) ── */}
      {(location.pathname !== "/dashboard" || pastDashboardTopBar) && (
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
          <BrandLogo />
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
            <BrandLogo />
          </div>
        </div>

        {/* Navigation Item Tree */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-6 scrollbar-hide mt-14 md:mt-0">
          {navSections.map((section) => (
            <div key={section.label}>
              {/* Found a bug? Callout card (Matches TradeFXBook Screenshot 3) placed above System */}
              {section.label === "System" && showBugCallout && (
                <div className="mb-4 p-3.5 rounded-2xl bg-[#F0F6FF] dark:bg-[#0D1527] border border-[#BFDBFE] dark:border-blue-500/25 shadow-xs relative overflow-hidden transition-all duration-200">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[13.5px] font-bold text-[#0F172A] dark:text-white tracking-tight">
                      Found a bug?
                    </span>
                    <button
                      type="button"
                      onClick={handleDismissBugCallout}
                      className="w-6 h-6 rounded-full bg-black/[0.05] dark:bg-white/[0.08] flex items-center justify-center text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/15 transition-colors cursor-pointer"
                      aria-label="Dismiss bug prompt"
                    >
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSupportModalMode("new");
                      setIsSupportModalOpen(true);
                    }}
                    style={{ backgroundColor: "#0066FF", color: "#ffffff" }} className="w-full py-2.5 px-3 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-[0_2px_8px_rgba(0,102,255,0.25)] active:scale-[0.98] transition-all cursor-pointer btn-primary-blue"
                  >
                    <span style={{ color: "#ffffff" }} className="text-white font-bold">Report an issue</span>
                    <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5] text-white" style={{ color: "#ffffff" }} />
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
                      end={item.end}
                      highlight={item.highlight}
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
              <p className="px-3.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">
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

        <div className="px-3 pt-2">
          <InstallAppButton />
        </div>

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
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/20 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-500/30 shadow-inner group-hover/avatar:ring-2 group-hover/avatar:ring-blue-500 transition-all overflow-hidden">
                  {userAvatar ? (
                    <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform" />
                  ) : (
                    (userName || userEmail).charAt(0).toUpperCase()
                  )}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 border-2 border-white dark:border-[#10131b] rounded-full" />
              </div>
              <div className="overflow-hidden flex flex-col items-start">
                <p className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-200 leading-tight truncate max-w-[110px]">
                  {userName || userEmail}
                </p>
                <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 mt-0.5">
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
                <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
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
                <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
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
        <SystemAnnouncementBanner announcement={announcement} />

        {/* Workspace Route Container */}
        <Suspense
          fallback={
            <div className="min-h-[70vh] flex flex-col items-center justify-center p-8">
              <div className="w-8 h-8 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin mb-3" />
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

      <FloatingMessenger />

      {/* ── REACT PORTAL: TradeFXBook Spotlight Command Palette ── */}
      {isSearchOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[10000] flex items-start justify-center pt-[10vh] sm:pt-[12vh] p-4 bg-black/50 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={() => {
              setIsSearchOpen(false);
              setSearchQuery("");
            }}
          >
            <div
              className="w-full max-w-xl bg-white dark:bg-[#121622] border border-neutral-200 dark:border-white/[0.12] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.25)] dark:shadow-[0_30px_70px_rgba(0,0,0,0.7)] overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Search Box with TradeFXBook blue focus border */}
              <div className="p-3 sm:p-3.5 border-b border-neutral-100 dark:border-white/[0.08] flex items-center gap-2.5">
                <Search className="w-5 h-5 text-neutral-400 dark:text-neutral-500 shrink-0 ml-1" />
                <div className="flex-1 flex items-center border border-blue-500 rounded-lg px-3 py-1.5 bg-white dark:bg-[#10131d] shadow-2xs focus-within:ring-2 focus-within:ring-blue-500/20">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedIndex(0);
                    }}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Search pages, trades, or symbols..."
                    autoFocus
                    className="w-full bg-transparent border-none outline-none text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm font-medium"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery("");
                  }}
                  className="px-2 py-1 text-[11px] font-mono text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-white/10 rounded-md border border-neutral-200 dark:border-white/10 hover:bg-neutral-200 dark:hover:bg-white/15 transition-colors cursor-pointer shrink-0"
                >
                  ESC
                </button>
              </div>

              {/* Categorized List of Routes with Active/Hover TradeFXBook Effect */}
              <div
                ref={listContainerRef}
                className="p-3 space-y-4 max-h-[460px] overflow-y-auto"
              >
                {flatFilteredItems.length === 0 ? (
                  <div className="px-4 py-12 text-center text-xs text-neutral-400 dark:text-neutral-500">
                    No matching pages or tools found for &ldquo;{searchQuery}&rdquo;.
                  </div>
                ) : (
                  filteredCategories.map((category) => (
                    <div key={category.title} className="space-y-1.5">
                      <p className="px-2 text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                        {category.title}
                      </p>
                      <div className="space-y-1">
                        {category.items.map((action) => {
                          const ActionIcon = action.icon;
                          const isSelected = selectedIndex === action.globalIndex;
                          return (
                            <button
                              key={action.to + action.label}
                              data-index={action.globalIndex}
                              type="button"
                              onClick={() => {
                                navigate(action.to);
                                setIsSearchOpen(false);
                                setSearchQuery("");
                              }}
                              onMouseEnter={() => setSelectedIndex(action.globalIndex)}
                              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer group ${
                                isSelected
                                  ? "border border-blue-500 bg-blue-50/70 dark:bg-blue-500/10 shadow-2xs"
                                  : "border border-transparent hover:border-blue-500 hover:bg-blue-50/70 dark:hover:bg-blue-500/10"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-white/[0.06] flex items-center justify-center shrink-0 text-neutral-600 dark:text-neutral-300 group-hover:scale-102 transition-transform">
                                  <ActionIcon className="w-5 h-5" />
                                </div>
                                <div className="truncate">
                                  <p className="font-semibold text-neutral-900 dark:text-white text-sm leading-tight">
                                    {action.label}
                                  </p>
                                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                                    {action.sub}
                                  </p>
                                </div>
                              </div>
                              {isSelected && (
                                <ArrowRight className="w-4 h-4 text-blue-500 shrink-0 ml-2 animate-in fade-in slide-in-from-left-1 duration-150" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* TradeFXBook Footer Keyboard Shortcuts Bar */}
              <div className="px-4 py-2.5 bg-neutral-50/90 dark:bg-[#0e1118]/90 border-t border-neutral-100 dark:border-white/[0.08] flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400 select-none">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-white dark:bg-white/10 border border-neutral-200 dark:border-white/15 text-[10px] font-mono shadow-2xs font-semibold text-neutral-600 dark:text-neutral-300">
                    ↑
                  </span>
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-white dark:bg-white/10 border border-neutral-200 dark:border-white/15 text-[10px] font-mono shadow-2xs font-semibold text-neutral-600 dark:text-neutral-300">
                    ↓
                  </span>
                  <span className="ml-0.5">Navigate</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded bg-white dark:bg-white/10 border border-neutral-200 dark:border-white/15 text-[10px] font-mono shadow-2xs font-semibold text-neutral-600 dark:text-neutral-300">
                    ↵
                  </span>
                  <span className="ml-0.5">Select</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center justify-center min-w-[26px] h-5 px-1 rounded bg-white dark:bg-white/10 border border-neutral-200 dark:border-white/15 text-[10px] font-mono shadow-2xs font-semibold text-neutral-600 dark:text-neutral-300">
                    Esc
                  </span>
                  <span className="ml-0.5">Close</span>
                </div>
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
    </div>
  );
}
