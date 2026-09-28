// frontend/src/layouts/MainLayout.jsx
import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  PlusCircle,
  Globe,
  List,
  Calendar,
  BookOpen,
  Upload,
  Users,
  Settings,
  Palette,
  Headphones,
  Menu,
  X,
} from "lucide-react";

// Moved outside the component to prevent memory recreation on every render
const navLinks = [
  {
    name: "Dashboard",
    // icon: LayoutDashboard,
    path: "/dashboard",
    iconColor: "text-[#5b8cff]",
  },
  {
    name: "Add Trade",
    // icon: PlusCircle,
    path: "/add-trade",
    iconColor: "text-[#21d4a3]",
  },
  {
    name: "Economic Calendar",
    // icon: Globe,
    path: "/news",
    iconColor: "text-[#ffb84d]",
  },
  {
    name: "Past Trades",
    // icon: List,
    path: "/trades",
    iconColor: "text-[#a78bfa]",
  },
  {
    name: "Calendar",
    // icon: Calendar,
    path: "/calendar",
    iconColor: "text-[#22d3ee]",
  },
  {
    name: "Journal History",
    // icon: BookOpen,
    path: "/history",
    iconColor: "text-[#f472b6]",
  },
  {
    name: "Import Trades",
    // icon: Upload,
    path: "/import",
    iconColor: "text-[#fb7185]",
  },
  {
    name: "Accounts",
    // icon: Users,
    path: "/accounts",
    iconColor: "text-[#94a3b8]",
  },
  {
    name: "Settings",
    // icon: Settings,
    path: "/settings",
    iconColor: "text-[#6366f1]",
  },
  {
    name: "Customize",
    // icon: Palette,
    path: "/customize",
    iconColor: "text-[#10b981]",
  },
  {
    name: "Support",
    // icon: Headphones,
    path: "/support",
    iconColor: "text-[#f59e0b]",
  },
];

export default function MainLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Helper function to render links safely
  const renderSidebarLinks = () => (
    <>
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-hide">
        {navLinks.map((link, idx) => {
          // CRITICAL FIX: Capitalizing the variable name and adding a fallback prevents React Error 130
          const Icon = link.icon || Globe;

          return (
            <NavLink
              key={idx}
              to={link.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-[2px] text-sm font-medium transition-all group relative ${
                  isActive
                    ? "bg-gray-100 dark:bg-[#1a1d24] text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div
                      className={`absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-[2px] bg-current opacity-100 ${link.iconColor}`}
                    ></div>
                  )}
                  <div
                    className={`w-7 h-7 rounded-[2px] flex items-center justify-center transition-all bg-white dark:bg-white/5 shadow-sm group-hover:shadow-md ${isActive ? "bg-white dark:bg-white/10" : ""}`}
                  >
                    {/* Render using the safe Capitalized variable */}
                    <Icon className={`w-4 h-4 ${link.iconColor}`} />
                  </div>
                  <span className="truncate">{link.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-white/5">
        <div className="bg-gray-50 dark:bg-[#1a1d24] p-4 rounded-[2px] border border-gray-200 dark:border-white/5 text-center shadow-inner">
          <p className="text-[9px] font-bold text-[#2f8df4] mb-1 tracking-widest uppercase">
            Discipline Today.
          </p>
          <p className="text-[9px] font-bold text-[#2f8df4] tracking-widest uppercase">
            Freedom Tomorrow.
          </p>
        </div>
      </div>
    </>
  );

  return (
    <div
      className="min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-200 flex flex-col md:flex-row transition-colors duration-200"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* MOBILE TOP NAVBAR */}
      <header className="md:hidden sticky top-0 z-50 bg-white dark:bg-[#121418] border-b border-gray-200 dark:border-white/10 px-4 py-3 flex items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 -ml-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-[2px] transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-[#2f8df4] to-[#6d54ff] rounded-[2px] flex items-center justify-center font-bold text-white shadow-md">
              💸💲🧠
            </div>
            <h1 className="text-base font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
              Forex Notes
            </h1>
          </div>
        </div>
      </header>

      {/* MOBILE DROPDOWN MENU */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="relative w-[280px] max-w-[80%] h-full bg-white dark:bg-[#091019] border-r border-gray-200 dark:border-[#1f2c3b] flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-[#2f8df4] to-[#6d54ff] rounded-[2px] flex items-center justify-center font-black text-white shadow-md text-xs">
                  💸💲🧠
                </div>
                <h1 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">
                  Trade Journey
                </h1>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-[2px] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {renderSidebarLinks()}
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-[260px] flex-col bg-white dark:bg-[#091019] border-r border-gray-200 dark:border-[#1f2c3b] sticky top-0 h-screen shrink-0 transition-colors duration-200">
        <div className="p-6 flex items-center gap-3 border-b border-gray-200 dark:border-white/5">
          <div className="w-9 h-9 bg-gradient-to-br from-[#2f8df4] to-[#6d54ff] rounded-[2px] flex items-center justify-center font-black text-white shadow-lg text-sm">
            TJ
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
              Forex Notes
            </h1>
            <p className="text-[9px] text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-0.5">
              AI Integrated Trade Journal - By Trader, For Traders.
            </p>
          </div>
        </div>
        {renderSidebarLinks()}
      </aside>

      {/* MAIN DASHBOARD CONTENT AREA */}
      <main className="flex-1 flex flex-col min-h-[calc(100vh-56px)] md:h-screen md:overflow-hidden bg-gray-50 dark:bg-[#0a0a0a]">
        <header className="hidden md:flex h-20 border-b border-gray-200 dark:border-white/5 bg-white dark:bg-[#0a0a0a] items-center justify-between px-8 shrink-0 transition-colors duration-200">
          <div className="flex items-center bg-gray-50 dark:bg-[#121418] rounded-[2px] px-4 py-2.5 w-72 border border-gray-200 dark:border-white/10 focus-within:border-[#2f8df4] transition-colors shadow-sm">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Search trades, accounts...
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/add-trade")}
              className="px-5 py-2.5 text-sm font-semibold border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111b27] text-gray-900 dark:text-white rounded-[2px] hover:bg-gray-50 dark:hover:bg-white/10 transition-colors shadow-sm flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-[#21d4a3]" /> Quick Add
            </button>
            <button
              onClick={() => navigate("/add-trade")}
              className="px-5 py-2.5 text-sm font-bold bg-[#2f8df4] text-white rounded-[2px] hover:bg-[#2376e8] transition-colors shadow-md"
            >
              ＋ Add Trade
            </button>
            <div className="w-10 h-10 rounded-[2px] border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-[#111b27] flex items-center justify-center font-bold text-gray-600 dark:text-gray-300 shadow-sm cursor-pointer hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
              MP
            </div>
          </div>
        </header>

        <div className="flex-1 md:overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
