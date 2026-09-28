// frontend/src/layouts/MainLayout.jsx
import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
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
  Activity,
  Menu,
  X,
} from "lucide-react";

export default function MainLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Your exact requested structure with CSS-inspired icon colors
  const navLinks = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
      iconColor: "text-[#5b8cff]",
    },
    {
      name: "Add Trade",
      icon: PlusCircle,
      path: "/add-trade",
      iconColor: "text-[#21d4a3]",
    },
    {
      name: "Economic Calendar",
      icon: Globe,
      path: "/news",
      iconColor: "text-[#ffb84d]",
    },
    {
      name: "Past Trades",
      icon: List,
      path: "/trades",
      iconColor: "text-[#a78bfa]",
    },
    {
      name: "Calendar",
      icon: Calendar,
      path: "/calendar",
      iconColor: "text-[#22d3ee]",
    },
    {
      name: "Journal History",
      icon: BookOpen,
      path: "/history",
      iconColor: "text-[#f472b6]",
    },
    {
      name: "Imports",
      icon: Upload,
      path: "/import",
      iconColor: "text-[#fb7185]",
    },
    {
      name: "Accounts",
      icon: Users,
      path: "/accounts",
      iconColor: "text-[#94a3b8]",
    },
    {
      name: "Profile & Settings",
      icon: Settings,
      path: "/settings",
      iconColor: "text-[#6366f1]",
    },
    {
      name: "Customize",
      icon: Palette,
      path: "/customize",
      iconColor: "text-[#10b981]",
    },
    {
      name: "Support",
      icon: Headphones,
      path: "/support",
      iconColor: "text-[#f59e0b]",
    },
  ];

  const SidebarContent = () => (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 scrollbar-hide">
        {navLinks.map((link, idx) => (
          <NavLink
            key={idx}
            to={link.path}
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                isActive
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/5 hover:translate-x-1"
              }`
            }
          >
            {/* Active Indicator Line (From your CSS) */}
            {({ isActive }) => (
              <>
                {isActive && (
                  <div
                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-md bg-current opacity-90 ${link.iconColor}`}
                  ></div>
                )}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all bg-white/5 shadow-inner group-hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] ${isActive ? "bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.15)]" : ""}`}
                >
                  <link.icon className={`w-4 h-4 ${link.iconColor}`} />
                </div>
                <span>{link.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Footer Caption */}
      <div className="p-4 border-t border-white/5">
        <div className="bg-[#1a1d24] p-4 rounded-xl border border-white/5 text-center shadow-inner">
          <p className="text-[9px] font-bold text-[#6366f1] mb-1 tracking-widest uppercase">
            Discipline Today.
          </p>
          <p className="text-[9px] font-bold text-[#6366f1] tracking-widest uppercase">
            Freedom Tomorrow.
          </p>
        </div>
      </div>
    </>
  );

  return (
    <div
      className="min-h-screen bg-[#0a0a0a] text-gray-200 flex flex-col md:flex-row"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* MOBILE TOP NAVBAR (Sticky) */}
      <header className="md:hidden sticky top-0 z-50 bg-[#121418] border-b border-white/10 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-[#2f8df4] to-[#6d54ff] rounded-lg flex items-center justify-center font-bold text-white shadow-lg">
            TJ
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight leading-tight">
              Trade Journey
            </h1>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest">
              Private Journal
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-lg"
        >
          {isMobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </header>

      {/* MOBILE DROPDOWN MENU */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[73px] z-40 bg-[#121418] flex flex-col border-t border-white/5">
          <SidebarContent />
        </div>
      )}

      {/* DESKTOP SIDEBAR (Vertical Left) */}
      <aside className="hidden md:flex w-[260px] flex-col bg-[#091019] border-r border-[#1f2c3b] sticky top-0 h-screen shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <div className="w-9 h-9 bg-gradient-to-br from-[#2f8df4] to-[#6d54ff] rounded-xl flex items-center justify-center font-black text-white shadow-lg text-sm">
            TJ
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight leading-tight">
              Trade Journey
            </h1>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest">
              Private Journal
            </p>
          </div>
        </div>
        <SidebarContent />
      </aside>

      {/* MAIN DASHBOARD CONTENT AREA */}
      <main className="flex-1 flex flex-col min-h-[calc(100vh-73px)] md:h-screen md:overflow-hidden">
        {/* Top Header Actions (Desktop only) */}
        <header className="hidden md:flex h-20 border-b border-white/5 bg-[#0a0a0a] items-center justify-between px-8 shrink-0">
          <div className="flex items-center bg-[#121418] rounded-xl px-4 py-2.5 w-72 border border-white/10 focus-within:border-[#6366f1] transition-colors">
            <span className="text-sm text-gray-500">
              Search trades, accounts...
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-5 py-2.5 text-sm font-semibold border border-white/10 bg-[#111b27] text-white rounded-xl hover:bg-white/10 transition-colors">
              ⚡ Quick Add
            </button>
            <button className="px-5 py-2.5 text-sm font-semibold bg-[#2f8df4] text-white rounded-xl hover:bg-[#2376e8] transition-colors shadow-lg">
              ＋ Add Trade
            </button>
            <div className="w-10 h-10 rounded-xl border border-white/10 bg-[#111b27] flex items-center justify-center font-bold text-gray-300">
              MP
            </div>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <div className="flex-1 md:overflow-y-auto bg-[#0a0a0a]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
