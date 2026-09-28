// frontend/src/layouts/MainLayout.jsx
import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  List,
  Calendar,
  Globe,
  Image as ImageIcon,
  BarChart2,
  Target,
  Settings,
  Headphones,
  Upload,
  Users,
  Activity,
  Menu,
  X,
} from "lucide-react";

export default function MainLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navSections = [
    {
      title: "TRADING",
      links: [
        { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
        { name: "Trade Log", icon: List, path: "/trades" },
        { name: "Calendar", icon: Calendar, path: "/calendar" },
        { name: "Economic Calendar", icon: Globe, path: "/news" },
        { name: "Gallery", icon: ImageIcon, path: "/gallery" },
      ],
    },
    {
      title: "ANALYSIS",
      links: [
        { name: "Analytics", icon: BarChart2, path: "/analytics" },
        { name: "Strategies", icon: Target, path: "/strategies" },
      ],
    },
    {
      title: "DATA",
      links: [
        { name: "Import", icon: Upload, path: "/import" },
        { name: "Accounts", icon: Users, path: "/accounts" },
      ],
    },
    {
      title: "APP",
      links: [
        { name: "Settings", icon: Settings, path: "/settings" },
        { name: "Support", icon: Headphones, path: "/support" },
      ],
    },
  ];

  const SidebarContent = () => (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 scrollbar-hide">
        {navSections.map((section, idx) => (
          <div key={idx}>
            <h2 className="text-[10px] font-bold text-gray-500 mb-3 tracking-widest pl-2">
              {section.title}
            </h2>
            <div className="space-y-1">
              {section.links.map((link, linkIdx) => (
                <NavLink
                  key={linkIdx}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-white/10 text-white shadow-sm"
                        : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                    }`
                  }
                >
                  <link.icon className="w-4 h-4" />
                  {link.name}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-white/5">
        <div className="bg-[#1a1d24] p-4 rounded-xl border border-white/5 text-center">
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
          <Activity className="w-6 h-6 text-[#6366f1]" />
          <h1 className="text-lg font-bold text-white tracking-tight">
            Forex Notes
          </h1>
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
      <aside className="hidden md:flex w-[260px] flex-col bg-[#121418] border-r border-white/5 sticky top-0 h-screen shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <div className="w-8 h-8 bg-[#6366f1] rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Forex Notes
          </h1>
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
            <button className="px-5 py-2.5 text-sm font-semibold border border-white/10 rounded-xl hover:bg-white/5 transition-colors">
              + Add account
            </button>
            <button className="px-5 py-2.5 text-sm font-semibold bg-white text-black rounded-xl hover:bg-gray-200 transition-colors shadow-lg">
              + Log Trade
            </button>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <div className="flex-1 md:overflow-y-auto p-4 md:p-8 bg-[#0a0a0a]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
