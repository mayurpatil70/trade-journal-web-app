// frontend/src/layouts/MainLayout.jsx
import { useState } from "react";
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
} from "lucide-react";

export default function MainLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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

  const NavItem = ({ to, icon: Icon, label }) => {
    const isActive = location.pathname.includes(to);
    return (
      <Link
        to={to}
        onClick={closeMenu}
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
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-[#121418] border-r border-gray-200 dark:border-white/5 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0`}
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
              />
              <NavItem to="/add-trade" icon={PlusCircle} label="Add Trade" />
              <NavItem to="/trades" icon={List} label="Past Trades" />
              <NavItem to="/calendar" icon={CalendarIcon} label="Calendar" />
            </div>
          </div>

          <div>
            <p className="px-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
              Analysis
            </p>
            <div className="space-y-1">
              <NavItem to="/news" icon={Globe} label="Economic Calendar" />
              <NavItem to="/accounts" icon={Users} label="Accounts" />
              <NavItem to="/import" icon={Upload} label="Import Trades" />
              <NavItem
                to="/problems"
                icon={BrainCircuit}
                label="Trader Problems"
              />
            </div>
          </div>

          <div>
            <p className="px-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
              App
            </p>
            <div className="space-y-1">
              <NavItem to="/settings" icon={Settings} label="Settings" />
              <NavItem to="/support" icon={Headphones} label="Support" />
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-white/5 relative">
          {isProfileOpen && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white dark:bg-[#1a1d24] border border-gray-200 dark:border-white/10 rounded-[2px] shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
              <Link
                to="/profile"
                onClick={closeMenu}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <Settings className="w-4 h-4" /> Account Settings
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left border-t border-gray-100 dark:border-white/5"
              >
                <LogOut className="w-4 h-4" /> Log out
              </button>
            </div>
          )}

          <div
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center justify-between p-3 rounded-[2px] bg-gray-50 dark:bg-[#0b131d] border border-gray-200 dark:border-[#1f2c3b] cursor-pointer hover:border-[#2f8df4] transition-colors"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[#2f8df4] text-white flex items-center justify-center font-bold text-xs shrink-0">
                {localStorage.getItem("userEmail")
                  ? localStorage.getItem("userEmail").charAt(0).toUpperCase()
                  : "U"}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight truncate max-w-[120px]">
                  {localStorage.getItem("userEmail") || "User"}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    alert("Pro Plan features are coming soon! Stay tuned.");
                  }}
                  className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest hover:text-emerald-400 transition-colors text-left"
                >
                  Subscription
                </button>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative pt-16 md:pt-0">
        <Outlet />
      </main>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden backdrop-blur-sm"
          onClick={closeMenu}
        />
      )}
    </div>
  );
}
