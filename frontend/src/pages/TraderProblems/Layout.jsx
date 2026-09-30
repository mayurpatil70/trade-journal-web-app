// frontend/src/pages/TraderProblems/Layout.jsx
import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  Calculator,
  ShieldAlert,
  Flame,
  TrendingUp,
  Sparkles,
} from "lucide-react";

export default function TraderProblemsLayout() {
  const location = useLocation();

  const tabs = [
    {
      name: "Lot Size & Risk",
      path: "/problems/calculator",
      icon: <Calculator className="w-4 h-4 text-emerald-400" />,
      tag: "Essential",
      color: "emerald",
    },
    {
      name: "Prop Firm Guardian",
      path: "/problems/prop-firm",
      icon: <ShieldAlert className="w-4 h-4 text-red-400" />,
      tag: "Drawdown",
      color: "red",
    },
    {
      name: "Tilt & Revenge Breaker",
      path: "/problems/tilt-breaker",
      icon: <Flame className="w-4 h-4 text-purple-400" />,
      tag: "Psychology",
      color: "purple",
    },
    {
      name: "Risk of Ruin & Monte Carlo",
      path: "/problems/risk-ruin",
      icon: <TrendingUp className="w-4 h-4 text-blue-400" />,
      tag: "Strategy",
      color: "blue",
    },
  ];

  return (
    <div
      className="w-full max-w-7xl mx-auto font-sans pb-16 px-4 md:px-8 mt-6 md:mt-8 space-y-6"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header Glassy Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200/80 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              Trader Survival Toolkit
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/30">
              Battle-Tested
            </span>
          </div>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
            Real-world mathematical and psychological problem solvers built to conquer emotional trading, avoid account wipeouts, and eliminate overleveraging.
          </p>
        </div>
      </div>

      {/* Glassy Pill Tabs */}
      <div className="flex overflow-x-auto scrollbar-hide py-1">
        <div className="flex gap-2 min-w-max p-1.5 rounded-2xl bg-gray-100/80 dark:bg-[#121418]/90 border border-gray-200/80 dark:border-white/10 backdrop-blur-xl shadow-inner">
          {tabs.map((tab) => {
            const isActive =
              location.pathname === tab.path ||
              (tab.path === "/problems/calculator" && location.pathname.includes("/problems/partials")) ||
              (tab.path === "/problems/tilt-breaker" && location.pathname.includes("/problems/edge")) ||
              (tab.path === "/problems/risk-ruin" && location.pathname.includes("/problems/hindsight"));

            return (
              <NavLink
                key={tab.name}
                to={tab.path}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all ${
                  isActive
                    ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-md border border-gray-200 dark:border-white/15 scale-[1.02]"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 border border-transparent"
                }`}
              >
                {tab.icon}
                <span>{tab.name}</span>
                <span
                  className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-extrabold ${
                    isActive
                      ? "bg-[#2f8df4]/20 text-[#2f8df4]"
                      : "bg-gray-200/50 dark:bg-white/5 text-gray-400"
                  }`}
                >
                  {tab.tag}
                </span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Active Tab View */}
      <div>
        <Outlet />
      </div>
    </div>
  );
}
