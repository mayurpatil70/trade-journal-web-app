// frontend/src/layouts/DashboardLayout.jsx
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  BarChart2,
  Bot,
  Settings,
  LifeBuoy,
} from "lucide-react";

export default function DashboardLayout() {
  const navClasses = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
      isActive
        ? "bg-gray-800 text-white"
        : "text-gray-400 hover:text-white hover:bg-gray-800/50"
    }`;

  return (
    <div className="flex h-screen bg-journalDark text-white overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 flex flex-col border-r border-gray-800 overflow-y-auto">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="text-white text-2xl">F</span>JOURNAL
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-6">
          {/* TRADING SECTION */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2 px-2 uppercase tracking-wider">
              Trading
            </p>
            <div className="space-y-1">
              <NavLink to="/dashboard" className={navClasses}>
                <LayoutDashboard size={18} /> Dashboard
              </NavLink>
              <NavLink to="/trades" className={navClasses}>
                <BookOpen size={18} /> Trade Log
              </NavLink>
              <NavLink to="/calendar" className={navClasses}>
                <Calendar size={18} /> Calendar
              </NavLink>
            </div>
          </div>

          {/* ANALYSIS SECTION */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2 px-2 uppercase tracking-wider">
              Analysis
            </p>
            <div className="space-y-1">
              <NavLink to="/analytics" className={navClasses}>
                <BarChart2 size={18} /> Analytics
              </NavLink>
              <NavLink to="/ai-journal" className={navClasses}>
                <Bot size={18} /> AI Journal
              </NavLink>
            </div>
          </div>

          {/* APP SECTION */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2 px-2 uppercase tracking-wider">
              App
            </p>
            <div className="space-y-1">
              <NavLink to="/settings" className={navClasses}>
                <Settings size={18} /> Settings
              </NavLink>
              <NavLink to="/support" className={navClasses}>
                <LifeBuoy size={18} /> Support
              </NavLink>
            </div>
          </div>
        </nav>

        {/* User Profile Snippet */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-journalEmerald flex items-center justify-center text-sm font-bold">
              MP
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Mayur Patil</span>{" "}
              {/*[cite: 20] */}
              <span className="text-xs text-gray-500">Free Plan</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-[#0a0a0a]">
        <Outlet />
      </main>
    </div>
  );
}
