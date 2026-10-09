// frontend/src/layouts/MainLayout.jsx
import NotificationBell from "../components/NotificationBell.jsx";
import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import PreTradeGate from "../components/PreTradeGate.jsx";
import PromoPopup from "../components/PromoPopup.jsx";
import {
  LayoutDashboard,
  PlusCircle,
  List,
  Calendar as CalendarIcon,
  Globe,
  Users,
  Upload,
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
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Zap,
  Lock,
  Calculator as CalculatorIcon,
} from "lucide-react";

// FIX: Extracted outside to prevent React Hook Error 310 (Black Screen Crash)
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
  const isActive = currentPath === to || currentPath.startsWith(to + "/");

  return (
    <Link
      to={(isDisabled || isLocked) ? "#" : to}
      onClick={(e) => {
        if (isDisabled) e.preventDefault();
        else if (isLocked) {
          e.preventDefault();
          if (onLockedClick) onLockedClick();
        } else if (onClick) onClick();
      }}
      className={`group flex items-center justify-between px-3 py-2.5 rounded-xl transition-all font-medium text-[13px] ${
        isDisabled
          ? "opacity-50 cursor-not-allowed text-gray-500"
          : isActive
            ? "bg-[#1B2027] text-white border border-white/5 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
            : "text-gray-400 hover:bg-[#15181D] hover:text-gray-200 border border-transparent"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon
          className={`w-[18px] h-[18px] transition-colors ${
            isActive
              ? "text-emerald-400"
              : "text-gray-500 group-hover:text-gray-300"
          }`}
          strokeWidth={isActive ? 2.5 : 2}
        />
        <span className="tracking-tight">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {isBeta && (
          <span className="text-[9px] uppercase tracking-wider font-bold bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-md">
            Beta
          </span>
        )}
        {isLocked && <Lock className="w-3.5 h-3.5 text-gray-500" />}
      </div>
    </Link>
  );
};

export default function MainLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showLockPopup, setShowLockPopup] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const userId = localStorage.getItem("userId") || localStorage.getItem("userEmail");
  const isAdmin = userId === "noballondesk@gmail.com" || userId === "akpatil51340@gmail.com";

  // FIX: Enforce Theme Globally on Mount & Route Change
  useEffect(() => {
    // We enforce a premium dark theme globally for the new design
    document.documentElement.classList.add("dark");
    document.body.style.backgroundColor = "#0A0B0D";
    document.body.style.color = "#FFFFFF";

    // Command Palette listener
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [location.pathname]);

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
        // { to: "/calculator/prop-firm", icon: CalculatorIcon, label: "Funded Guardian" },
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

  return (
    <div
      className="flex h-screen bg-[#0A0B0D] text-white transition-colors duration-200 overflow-hidden"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {showLockPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#101216] border border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm w-full relative text-center">
            <button onClick={() => setShowLockPopup(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Coming Soon</h3>
            <p className="text-gray-400 text-sm mb-6">
              This feature is currently in development and will be available in the upcoming Pro Plan. Stay tuned!
            </p>
            <button onClick={() => setShowLockPopup(false)} className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-colors">
              Got it
            </button>
          </div>
        </div>
      )}
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 glossy-bar flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2"><img src="/logo-256.webp" alt="ForexNotes" className="h-16 w-auto object-contain drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]" /></div>
        <div className="flex items-center gap-1">
        <NotificationBell />
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          {isMobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
        </div>
      </div>

      {/* Sidebar - Premium Trading Cockpit Style */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-[260px] glossy-side border-r border-white/5 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 shrink-0 hidden md:flex border-b border-white/5">
          <div className="flex items-center gap-2"><img src="/logo-256.webp" alt="ForexNotes" className="h-16 w-auto object-contain drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]" /></div>
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-1.5 text-gray-500 hover:text-gray-300 rounded-md hover:bg-white/5 transition-colors"
          >
            <span className="text-[10px] font-mono border border-gray-700 px-1 rounded">
              ⌘K
            </span>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-7 scrollbar-hide mt-14 md:mt-0">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="px-3 text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-2.5">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavItem
                    key={item.to}
                    to={item.to}
                    icon={item.icon}
                    label={item.label}
                    isBeta={item.isBeta}
                    isDisabled={item.isDisabled} isLocked={!isAdmin && item.requiresAdmin} onLockedClick={() => setShowLockPopup(true)}
                    currentPath={location.pathname}
                    onClick={closeMenu}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* ADMIN BYPASS MENU */}
          {["noballondesk@gmail.com", "akpatil51340@gmail.com"].includes(
            localStorage.getItem("userEmail"),
          ) && (
            <div className="pt-5 mt-5 border-t border-white/5">
              <p className="px-3 text-[10px] font-semibold text-emerald-500/70 uppercase tracking-widest mb-2.5">
                Admin
              </p>
              <div className="space-y-0.5">
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

        {/* User Card */}
        <div className="p-3 relative">
          {isProfileOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-[#1B2027] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 z-50">
              <Link
                to="/profile"
                onClick={closeMenu}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 hover:bg-[#232931] hover:text-white transition-colors"
              >
                <User className="w-4 h-4 text-emerald-400" />
                Profile
              </Link>
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  navigate('/paywall');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-emerald-400 hover:bg-emerald-400/10 transition-colors text-left border-t border-white/5"
              >
                <CreditCard className="w-4 h-4 text-emerald-400" />
                Subscription Plan
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-400/10 transition-colors text-left border-t border-white/5"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                Log out
              </button>
            </div>
          )}

          <div
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center justify-between p-3 rounded-xl bg-[#101216] border border-white/5 hover:border-white/10 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-500/20">
                {localStorage.getItem("userEmail")
                  ? localStorage.getItem("userEmail").charAt(0).toUpperCase()
                  : "U"}
              </div>
              <div className="overflow-hidden flex flex-col items-start">
                <p className="text-[13px] font-medium text-gray-200 leading-tight truncate max-w-[110px]">
                  {localStorage.getItem("userEmail") || "Trader"}
                </p>
                <span className="text-[10px] text-gray-500 mt-0.5 group-hover:text-gray-400 transition-colors">
                  Pro Workspace
                </span>
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-gray-500 transition-transform ${isProfileOpen ? "rotate-180 text-white" : "group-hover:text-gray-300"}`}
            />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative pt-14 md:pt-0 bg-[#0A0B0D]">
        <NotificationBell className="hidden md:block fixed top-3 right-5 z-40" />
        <Outlet />
      </main>

      {/* Command Palette Overlay (Mock) */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] p-4 bg-black/50 backdrop-blur-sm animate-in fade-in"
          onClick={() => setIsSearchOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-[#101216] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center px-4 py-3 border-b border-white/5">
              <Sparkles className="w-5 h-5 text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Search trades, analytics, or actions..."
                autoFocus
                className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 text-[15px]"
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="px-2 py-1 bg-white/5 text-gray-400 text-[10px] rounded hover:bg-white/10"
              >
                ESC
              </button>
            </div>
            <div className="p-2">
              <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Quick Actions
              </p>
              <button
                onClick={() => {
                  navigate("/add-trade");
                  setIsSearchOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 rounded-lg transition-colors text-left"
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" /> Log a new trade
              </button>
              <button
                onClick={() => {
                  navigate("/dashboard");
                  setIsSearchOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 rounded-lg transition-colors text-left"
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-400" /> Go to
                Command Center
              </button>
            </div>
          </div>
        </div>
      )}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden backdrop-blur-sm"
          onClick={closeMenu}
        />
      )}
      <PromoPopup />
      <PreTradeGate />
    </div>
  );
}
