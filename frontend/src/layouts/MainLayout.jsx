// frontend/src/layouts/MainLayout.jsx
import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
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
  BrainCircuit,
  User,
  CreditCard,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

// FIX: Extracted outside to prevent React Hook Error 310 (Black Screen Crash)
const NavItem = ({ to, icon: Icon, label, currentPath, onClick }) => {
  const isActive = currentPath.includes(to);
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-[2px] transition-colors font-medium text-sm ${
        isActive
          ? "bg-[#2f8df4]/10 text-[#2f8df4] border border-[#2f8df4]/20"
          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent"
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
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

  return (
    <div
      className="flex h-screen bg-gray-50 dark:bg-[#0a0a0a] transition-colors duration-200"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-[#121418] border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          <Activity className="w-6 h-6 text-[#2f8df4]" />
          <span className="font-bold text-gray-900 dark:text-white text-lg">
            Forex Notes
          </span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-gray-600 dark:text-gray-300"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-[#121418] border-r border-gray-200 dark:border-white/5 transform transition-transform duration-300 ease-in-out flex flex-col ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0`}
      >
        <div className="h-16 flex items-center gap-3 px-6 border-b border-gray-200 dark:border-white/5 shrink-0 hidden md:flex">
          <Activity className="w-6 h-6 text-[#2f8df4]" />
          <span className="font-bold text-gray-900 dark:text-white text-xl tracking-tight">
            Forex Notes
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-hide mt-16 md:mt-0">
          <div>
            <p className="px-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
              Trading
            </p>
            <div className="space-y-1">
              <NavItem
                to="/dashboard"
                icon={LayoutDashboard}
                label="Dashboard"
                currentPath={location.pathname}
                onClick={closeMenu}
              />
              <NavItem
                to="/add-trade"
                icon={PlusCircle}
                label="Add Trade"
                currentPath={location.pathname}
                onClick={closeMenu}
              />
              <NavItem
                to="/trades"
                icon={List}
                label="Past Trades"
                currentPath={location.pathname}
                onClick={closeMenu}
              />
              <NavItem
                to="/calendar"
                icon={CalendarIcon}
                label="Calendar"
                currentPath={location.pathname}
                onClick={closeMenu}
              />
            </div>
          </div>

          <div>
            <p className="px-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
              Analysis
            </p>
            <div className="space-y-1">
              <NavItem
                to="/news"
                icon={Globe}
                label="Economic Calendar"
                currentPath={location.pathname}
                onClick={closeMenu}
              />
              <NavItem
                to="/accounts"
                icon={Users}
                label="Accounts"
                currentPath={location.pathname}
                onClick={closeMenu}
              />
              <NavItem
                to="/import"
                icon={Upload}
                label="Import Trades"
                currentPath={location.pathname}
                onClick={closeMenu}
              />
              <NavItem
                to="/problems"
                icon={BrainCircuit}
                label="Trader Problems"
                currentPath={location.pathname}
                onClick={closeMenu}
              />
            </div>
          </div>

          <div>
            <p className="px-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
              App
            </p>
            <div className="space-y-1">
              <NavItem
                to="/settings"
                icon={Settings}
                label="Settings"
                currentPath={location.pathname}
                onClick={closeMenu}
              />
              <NavItem
                to="/support"
                icon={Headphones}
                label="Support"
                currentPath={location.pathname}
                onClick={closeMenu}
              />
            </div>
          </div>
        </nav>

        {/* User Card & Subscription at bottom */}
        <div className="p-4 border-t border-gray-200 dark:border-white/5 relative">
          {isProfileOpen && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white dark:bg-[#1a1d24] border border-gray-200 dark:border-white/10 rounded-[2px] shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 z-50">
              <Link
                to="/profile"
                onClick={closeMenu}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <User className="w-4 h-4" /> Profile
              </Link>
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  setIsSubscriptionOpen(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors text-left border-t border-gray-100 dark:border-white/5"
              >
                <CreditCard className="w-4 h-4" /> Subscription Plan
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left border-t border-gray-100 dark:border-white/5"
              >
                <LogOut className="w-4 h-4" /> Log out
              </button>
            </div>
          )}

          <div className="flex items-center justify-between p-3 rounded-[2px] bg-gray-50 dark:bg-[#0b131d] border border-gray-200 dark:border-[#1f2c3b] hover:border-[#2f8df4] transition-colors">
            <div
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 overflow-hidden cursor-pointer flex-1"
            >
              <div className="w-8 h-8 rounded-full bg-[#2f8df4] text-white flex items-center justify-center font-bold text-xs shrink-0">
                {localStorage.getItem("userEmail")
                  ? localStorage.getItem("userEmail").charAt(0).toUpperCase()
                  : "U"}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight truncate max-w-[100px]">
                  {localStorage.getItem("userEmail") || "User"}
                </p>
                {/* Clickable subscription badge */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSubscriptionOpen(true);
                  }}
                  className="text-[10px] text-emerald-500 hover:text-emerald-400 font-bold uppercase tracking-widest text-left hover:underline flex items-center gap-1 mt-0.5"
                >
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                  Subscription
                </button>
              </div>
            </div>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="p-1 text-gray-400 hover:text-gray-200"
            >
              <ChevronDown className="w-4 h-4" />
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
          <div className="relative w-full max-w-md bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/10 rounded-[4px] shadow-2xl p-6 sm:p-8">
            <button
              onClick={() => setIsSubscriptionOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Pro Membership
                </h3>
                <span className="inline-block mt-0.5 px-2.5 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider rounded-[2px]">
                  Active Plan
                </span>
              </div>
            </div>

            <div className="space-y-4 mb-6 text-sm text-gray-700 dark:text-gray-300">
              <div className="p-4 bg-gray-50 dark:bg-[#1a1d24] rounded-[2px] border border-gray-200 dark:border-white/5 space-y-2.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Real-time AI Psychology Coach</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Unlimited Trade Journaling & Cloud Storage</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Trader Problems Analytics Suite (Edge, Guardian)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Advanced Performance & Economic Calendar</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 px-1">
                <span>Billing Period: <strong>Monthly</strong></span>
                <span>Account: <strong>{localStorage.getItem("userEmail") || "User"}</strong></span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsSubscriptionOpen(false)}
                className="flex-1 py-3 bg-[#2f8df4] hover:bg-[#2376e8] text-white font-bold rounded-[2px] text-sm transition-colors text-center shadow-md"
              >
                Close Details
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
    </div>
  );
}
