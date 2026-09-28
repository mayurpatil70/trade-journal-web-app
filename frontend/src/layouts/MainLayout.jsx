// frontend/src/layouts/MainLayout.jsx
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
} from "lucide-react";

export default function MainLayout() {
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

  return (
    <div className="min-h-screen bg-[#0d0f11] text-gray-300 font-sans flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#121418] border-r border-white/5 flex flex-col hidden md:flex h-screen sticky top-0">
        <div className="p-6 flex items-center gap-3">
          <Activity className="w-6 h-6 text-white" />
          <h1 className="text-xl font-bold text-white tracking-tight">
            Forex Notes
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-6 scrollbar-hide">
          {navSections.map((section, idx) => (
            <div key={idx}>
              <h2 className="text-[10px] font-bold text-gray-500 mb-2 tracking-widest pl-2">
                {section.title}
              </h2>
              <div className="space-y-1">
                {section.links.map((link, linkIdx) => (
                  <NavLink
                    key={linkIdx}
                    to={link.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-white/10 text-white"
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
          <div className="bg-[#1a1d24] p-3 rounded-lg border border-white/5">
            <p className="text-[10px] font-bold text-emerald-500 mb-1 tracking-wider">
              DISCIPLINE TODAY.
            </p>
            <p className="text-[10px] font-bold text-emerald-500 tracking-wider">
              FREEDOM TOMORROW.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 border-b border-white/5 bg-[#121418] flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center bg-white/5 rounded-md px-3 py-1.5 w-64 border border-white/10">
            <span className="text-xs text-gray-500">
              Search trades, accounts...
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-1.5 text-xs font-semibold border border-white/10 rounded-md hover:bg-white/5">
              + Add account
            </button>
            <button className="px-4 py-1.5 text-xs font-semibold bg-white text-black rounded-md hover:bg-gray-200">
              + Log Trade
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0d0f11]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
