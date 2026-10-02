// frontend/src/layouts/MainLayout.jsx
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
  Calculator as CalculatorIcon,
} from "lucide-react";

// FIX: Extracted outside to prevent React Hook Error 310 (Black Screen Crash)
const NavItem = ({
  to,
  icon: Icon,
  label,
  currentPath,
  onClick,
  color = "blue",
}) => {
  const isActive = currentPath.includes(to);
  const colorMap = {
    blue: {
      bg: "bg-blue-500/10",
      text: "text-blue-400",
      border: "border-blue-500/20",
      iconBg: "bg-blue-500/10",
    },
    emerald: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      border: "border-emerald-500/20",
      iconBg: "bg-emerald-500/10",
    },
    violet: {
      bg: "bg-violet-500/10",
      text: "text-violet-400",
      border: "border-violet-500/20",
      iconBg: "bg-violet-500/10",
    },
    amber: {
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      border: "border-amber-500/20",
      iconBg: "bg-amber-500/10",
    },
    pink: {
      bg: "bg-pink-500/10",
      text: "text-pink-400",
      border: "border-pink-500/20",
      iconBg: "bg-pink-500/10",
    },
    cyan: {
      bg: "bg-cyan-500/10",
      text: "text-cyan-400",
      border: "border-cyan-500/20",
      iconBg: "bg-cyan-500/10",
    },
    orange: {
      bg: "bg-orange-500/10",
      text: "text-orange-400",
      border: "border-orange-500/20",
      iconBg: "bg-orange-500/10",
    },
    gray: {
      bg: "bg-gray-500/10",
      text: "text-gray-400",
      border: "border-gray-500/20",
      iconBg: "bg-gray-500/10",
    },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm ${
        isActive
          ? `${c.bg} ${c.text} border${c.border}`
          : "text-gray-500 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-white/[0.04] border border-transparent hover:text-gray-900 dark:hover:text-white"
      }`}
    >
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isActive ? c.iconBg : "bg-gray-100/80 dark:bg-white/[0.04]"}`}
      >
        <Icon
          className={`w-4 h-4 shrink-0 ${isActive ? c.text : "text-gray-500 dark:text-gray-400"}`}
        />
      </div>
      {label}
    </Link>
  );
};

export default function MainLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // FIX: Enforce Theme Globally on Mount & Route Change
  useEffect(() => {
    const theme = localStorage.getItem("theme") || "dark";
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
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
      label: "Trading",
      items: [
        {
          to: "/dashboard",
          icon: LayoutDashboard,
          label: "Dashboard",
          color: "blue",
        },
        {
          to: "/add-trade",
          icon: PlusCircle,
          label: "Add Trade",
          color: "emerald",
        },
        { to: "/trades", icon: List, label: "Past Trades", color: "violet" },
        {
          to: "/calendar",
          icon: CalendarIcon,
          label: "Calendar",
          color: "cyan",
        },
      ],
    },
    {
      label: "Analysis",
      items: [
        {
          to: "/news",
          icon: Globe,
          label: "Economic Calendar",
          color: "amber",
        },
        { to: "/accounts", icon: Users, label: "Accounts", color: "pink" },
        {
          to: "/import",
          icon: Upload,
          label: "Import Trades",
          color: "orange",
        },
        {
          to: "/calculator",
          icon: CalculatorIcon,
          label: "Calculators",
          color: "blue",
        },
      ],
    },
    {
      label: "App",
      items: [
        { to: "/settings", icon: Settings, label: "Settings", color: "gray" },
        { to: "/support", icon: Headphones, label: "Support", color: "amber" },
      ],
    },
  ];

  return (
    <div
      className="flex h-screen bg-gray-50 dark:bg-[#0a0a0a] transition-colors duration-200"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/90 dark:bg-[#121418]/90 border-b border-gray-200/80 dark:border-white/10 flex items-center justify-between px-4 z-40 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          <span className="font-black text-gray-900 dark:text-white text-lg tracking-tight">
            Forex Notes
          </span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-xl bg-gray-100/80 dark:bg-white/[0.04] border border-gray-200/80 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
        >
          {isMobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white/95 dark:bg-[#121418]/95 border-r border-gray-200/80 dark:border-white/10 transform transition-transform duration-300 ease-in-out flex flex-col backdrop-blur-xl ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-200/80 dark:border-white/10 shrink-0 hidden md:flex">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-black text-gray-900 dark:text-white text-lg tracking-tight block leading-none">
              Forex Notes
            </span>
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
              Trade Journal
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-6 scrollbar-hide mt-16 md:mt-0">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="px-3 text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavItem
                    key={item.to}
                    to={item.to}
                    icon={item.icon}
                    label={item.label}
                    color={item.color}
                    currentPath={location.pathname}
                    onClick={closeMenu}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* ADMIN BYPASS MENU - ONLY VISIBLE TO YOUR EMAIL */}
          { ["noballondesk@gmail.com", "akpatil51340@gmail.com"].includes(localStorage.getItem("userEmail")) && (
            <div className="pt-4 mt-4 border-t border-gray-200/80 dark:border-white/10">
              <p className="px-3 text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-2">
                Admin Area
              </p>
              <div className="space-y-0.5">
                <NavItem
                  to="/admin"
                  icon={ShieldCheck}
                  label="Command Center"
                  color="emerald"
                  currentPath={location.pathname}
                  onClick={closeMenu}
                />
              </div>
            </div>
          )}
        </nav>

        {/* User Card & Subscription at bottom */}
        <div className="p-3 border-t border-gray-200/80 dark:border-white/10 relative">
          {isProfileOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-white/95 dark:bg-[#1a1d24]/95 border border-gray-200/80 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 z-50 backdrop-blur-xl">
              <Link
                to="/profile"
                onClick={closeMenu}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                </div>
                Profile
              </Link>
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  setIsSubscriptionOpen(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors text-left border-t border-gray-100 dark:border-white/5"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                Subscription Plan
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left border-t border-gray-100 dark:border-white/5"
              >
                <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <LogOut className="w-3.5 h-3.5 text-red-400" />
                </div>
                Log out
              </button>
            </div>
          )}

          <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-blue-500/5 to-cyan-500/5 border border-blue-500/10 hover:border-blue-400/30 transition-colors cursor-pointer">
            <div
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 overflow-hidden flex-1"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md shadow-blue-500/20">
                {localStorage.getItem("userEmail")
                  ? localStorage.getItem("userEmail").charAt(0).toUpperCase()
                  : "U"}
              </div>
              <div className="overflow-hidden flex flex-col items-start">
                <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight truncate max-w-[100px]">
                  {localStorage.getItem("userEmail") || "User"}
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    alert("Pro Plan features are coming soon! Stay tuned.");
                  }}
                  className="relative z-10 px-2 py-0.5 mt-1 bg-emerald-500/10 text-[10px] text-emerald-500 font-bold uppercase tracking-widest rounded-[2px] hover:bg-emerald-500/20 transition-colors text-left"
                >
                  Subscription
                </button>
              </div>
            </div>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100/80 dark:hover:bg-white/[0.04]"
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform ${isProfileOpen ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative pt-16 md:pt-0">
        <Outlet />
      </main>

      {/* Subscription Modal */}
      {isSubscriptionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white/95 dark:bg-[#121418]/95 border border-gray-200/80 dark:border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 backdrop-blur-2xl">
            <button
              onClick={() => setIsSubscriptionOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-gray-100/80 dark:bg-white/[0.04] text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors border border-gray-200/80 dark:border-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <ShieldCheck className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Pro Membership
                </h3>
                <span className="inline-block mt-1 px-2.5 py-0.5 bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider rounded-full">
                  ✓ Active Plan
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-6 text-sm text-gray-700 dark:text-gray-300">
              <div className="p-4 bg-gradient-to-br from-emerald-500/5 to-green-500/5 rounded-2xl border border-emerald-500/10 space-y-3">
                {[
                  "Real-time AI Psychology Coach",
                  "Unlimited Trade Journaling & Cloud Storage",
                  "Trader Problems Analytics Suite",
                  "Advanced Performance & Economic Calendar",
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 px-1">
                <span>
                  Billing:{" "}
                  <strong className="text-gray-700 dark:text-gray-300">
                    Monthly
                  </strong>
                </span>
                <span>
                  Account:{" "}
                  <strong className="text-gray-700 dark:text-gray-300">
                    {localStorage.getItem("userEmail") || "User"}
                  </strong>
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsSubscriptionOpen(false)}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-emerald-500/25"
            >
              <Zap className="w-4 h-4 inline mr-2" />
              Manage Subscription
            </button>
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
