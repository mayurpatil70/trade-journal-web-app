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
  User,
  CreditCard,
  ShieldCheck,
  Zap,
  Lock,
  Calculator as CalculatorIcon,
  Search,
  Sparkles,
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

export default function MainLayout() {
  const { theme, isDark } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileCoords, setProfileCoords] = useState({ bottom: 0, left: 0, width: 236 });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showLockPopup, setShowLockPopup] = useState(false);
  const userCardRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const userId = localStorage.getItem("userId") || localStorage.getItem("userEmail");
  const userEmail = localStorage.getItem("userEmail") || "Trader";
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

  // Command palette shortcut (⌘K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === "Escape") {
        setIsSearchOpen(false);
        setIsProfileOpen(false);
        setShowLockPopup(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
        { to: "/analytics", icon: Activity, label: "Strategy Analytics" },
        { to: "/psychology", icon: User, label: "Psychology Lab" },
        { to: "/mistakes", icon: ShieldCheck, label: "Mistake Lab" },
      ],
    },
    {
      label: "Tools",
      items: [
        { to: "/charts", icon: Activity, label: "Live Charts" },
        { to: "/sessions", icon: Zap, label: "Setup Backtesting" },
        { to: "/news", icon: Globe, label: "Economic Calendar" },
        { to: "/bot-hub", icon: Activity, label: "Bot Hub", isBeta: true, requiresAdmin: true },
        { to: "/bot-hub/connections", icon: ShieldCheck, label: "Exchange Keys", requiresAdmin: true },
        { to: "/bot-hub/mt5", icon: Zap, label: "MT5 AI Bot", isBeta: true, requiresAdmin: true },
        {
          to: "/calculator/lot-size",
          icon: CalculatorIcon,
          label: "Calculators",
        },
      ],
    },
    {
      label: "System",
      items: [
        { to: "/accounts", icon: Users, label: "Prop firm" },
        { to: "/settings", icon: Settings, label: "Settings" },
        { to: "/support", icon: Headphones, label: "Support" },
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
    if (p.includes("analytics")) return "Strategy Analytics";
    if (p.includes("psychology")) return "Psychology Lab";
    if (p.includes("mistakes")) return "Mistake Lab";
    if (p.includes("charts")) return "Live Charts";
    if (p.includes("sessions")) return "Setup Backtesting";
    if (p.includes("news")) return "Economic Calendar";
    if (p.includes("calculator")) return "Lot Size Calculator";
    if (p.includes("accounts")) return "Prop Firm Accounts";
    if (p.includes("settings")) return "Settings";
    if (p.includes("profile")) return "Profile";
    if (p.includes("support")) return "Support";
    if (p.includes("affiliate")) return "Affiliate";
    if (p.includes("admin")) return "Command Center";
    return "Forex Notes";
  })();

  return (
    <div
      className="flex h-screen w-full bg-[#f8f9fc] dark:bg-[#0a0c10] text-neutral-900 dark:text-neutral-100 transition-colors duration-300 overflow-hidden font-sans relative"
      style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* ── macOS Spatial Ambient Canvas Mesh ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0 select-none">
        {/* Top-left emerald mesh */}
        <div className="absolute -top-[20%] -left-[10%] w-[55vw] h-[55vw] max-w-[800px] max-h-[800px] rounded-full bg-emerald-400/10 dark:bg-emerald-500/[0.07] blur-[120px] transition-colors duration-500" />
        {/* Top-right indigo/violet mesh */}
        <div className="absolute -top-[15%] right-[5%] w-[45vw] h-[45vw] max-w-[700px] max-h-[700px] rounded-full bg-indigo-400/[0.08] dark:bg-indigo-500/[0.06] blur-[130px] transition-colors duration-500" />
        {/* Bottom-center subtle sapphire mesh */}
        <div className="absolute -bottom-[20%] left-[25%] w-[50vw] h-[50vw] max-w-[750px] max-h-[750px] rounded-full bg-cyan-400/[0.06] dark:bg-cyan-500/[0.04] blur-[140px] transition-colors duration-500" />
      </div>

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

      {/* ── Mobile iOS Header ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white/75 dark:bg-[#0c0e15]/75 backdrop-blur-2xl border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between px-4 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <BrandLogo className="h-10 w-auto object-contain" />
        </div>
        <div className="flex items-center gap-2">
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
        <div className="h-16 flex items-center justify-between px-5 shrink-0 hidden md:flex border-b border-black/[0.05] dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            {/* Apple Window Traffic Light Dots */}
            <div className="flex items-center gap-1.5 mr-1 group/traffic cursor-default">
              <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] shadow-sm inline-block group-hover/traffic:brightness-95 transition-all" />
              <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] shadow-sm inline-block group-hover/traffic:brightness-95 transition-all" />
              <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29] shadow-sm inline-block group-hover/traffic:brightness-95 transition-all" />
            </div>
            <BrandLogo className="h-8 w-auto object-contain" />
          </div>

          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-neutral-500 dark:text-neutral-400 transition-colors border border-black/[0.04] dark:border-white/[0.06]"
            title="Spotlight Search (⌘K)"
          >
            <span className="font-mono text-[10px]">⌘K</span>
          </button>
        </div>

        {/* Navigation Item Tree */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-6 scrollbar-hide mt-14 md:mt-0">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="px-3.5 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-2">
                {section.label}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => (
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
                ))}
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
              <div className="relative">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-500/30 shadow-inner">
                  {userEmail.charAt(0).toUpperCase()}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-[#10131b] rounded-full" />
              </div>
              <div className="overflow-hidden flex flex-col items-start">
                <p className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-200 leading-tight truncate max-w-[110px]">
                  {userEmail}
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
                  navigate("/paywall");
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors text-left"
              >
                <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
                Subscription Plan
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

        {/* ── Desktop Floating macOS Top Navigation Bar ── */}
        <header className="hidden md:flex sticky top-0 z-30 h-16 px-6 items-center justify-between border-b border-black/[0.05] dark:border-white/[0.06] bg-white/60 dark:bg-[#0c0e15]/60 backdrop-blur-xl">
          {/* Left: Dynamic Breadcrumb / Workspace Badge */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-neutral-400 dark:text-neutral-500">Forex Notes</span>
            <span className="text-neutral-300 dark:text-neutral-700">/</span>
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white tracking-tight">{pathTitle}</h2>
            <div className="ml-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Markets Active
            </div>
          </div>

          {/* Center: Apple Spotlight Search Trigger Pill */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-black/[0.035] dark:bg-white/[0.05] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border border-black/[0.05] dark:border-white/[0.08] text-xs text-neutral-500 dark:text-neutral-400 transition-all duration-200 cursor-pointer shadow-sm hover:shadow"
          >
            <Search className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-neutral-500 dark:text-neutral-400">Search trades, news, tools...</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-neutral-300">
              ⌘K
            </span>
          </button>

          {/* Right: Apple Control Center (Notification & Theme Toggle) */}
          <div className="flex items-center gap-2">
            <NotificationBell />
            <ThemeToggle />
          </div>
        </header>

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
            className="fixed inset-0 z-[10000] flex items-start justify-center pt-[14vh] p-4 bg-black/35 dark:bg-black/65 backdrop-blur-md animate-in fade-in duration-150"
            onClick={() => setIsSearchOpen(false)}
          >
            <div
              className="w-full max-w-xl bg-white/90 dark:bg-[#121622]/90 border border-black/[0.08] dark:border-white/[0.12] rounded-3xl shadow-[0_30px_70px_rgba(0,0,0,0.2)] dark:shadow-[0_35px_80px_rgba(0,0,0,0.7)] backdrop-blur-2xl overflow-hidden animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center px-4 py-3.5 border-b border-black/[0.06] dark:border-white/[0.08]">
                <Search className="w-5 h-5 text-emerald-500 mr-3 shrink-0" />
                <input
                  type="text"
                  placeholder="Search trades, analytics, calculators, or actions..."
                  autoFocus
                  className="flex-1 bg-transparent border-none outline-none text-neutral-900 dark:text-white placeholder-neutral-400 text-sm font-medium"
                />
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="px-2 py-0.5 bg-black/[0.05] dark:bg-white/10 text-neutral-500 dark:text-neutral-400 text-[11px] font-mono rounded-md hover:bg-black/10 dark:hover:bg-white/15"
                >
                  ESC
                </button>
              </div>

              <div className="p-2 space-y-1">
                <p className="px-3 py-1.5 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                  Quick Actions
                </p>
                <button
                  onClick={() => {
                    navigate("/add-trade");
                    setIsSearchOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-xl transition-colors text-left group"
                >
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <PlusCircle className="w-4 h-4" />
                  </div>
                  Log a new trade
                </button>
                <button
                  onClick={() => {
                    navigate("/dashboard");
                    setIsSearchOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-xl transition-colors text-left group"
                >
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <LayoutDashboard className="w-4 h-4" />
                  </div>
                  Go to Dashboard
                </button>
                <button
                  onClick={() => {
                    navigate("/analytics");
                    setIsSearchOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-xl transition-colors text-left group"
                >
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Activity className="w-4 h-4" />
                  </div>
                  Strategy Analytics
                </button>
                <button
                  onClick={() => {
                    navigate("/news");
                    setIsSearchOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-xl transition-colors text-left group"
                >
                  <div className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Globe className="w-4 h-4" />
                  </div>
                  Economic Calendar
                </button>
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
    </div>
  );
}
