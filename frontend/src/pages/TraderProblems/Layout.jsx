// frontend/src/pages/TraderProblems/Layout.jsx
import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  BrainCircuit,
  ShieldAlert,
  SlidersHorizontal,
  Calculator,
} from "lucide-react";

export default function TraderProblemsLayout() {
  const location = useLocation();

  const tabs = [
    {
      name: "Edge Finder",
      path: "/problems/edge",
      icon: <BrainCircuit className="w-4 h-4" />,
    },
    {
      name: "Prop Firm Guardian",
      path: "/problems/prop-firm",
      icon: <ShieldAlert className="w-4 h-4" />,
    },
    {
      name: "Hindsight Slider",
      path: "/problems/hindsight",
      icon: <SlidersHorizontal className="w-4 h-4" />,
    },
    {
      name: "Partials Calculator",
      path: "/problems/partials",
      icon: <Calculator className="w-4 h-4" />,
    },
  ];

  return (
    <div
      className="w-full max-w-6xl mx-auto font-sans pb-16 px-4 md:px-8 mt-6 md:mt-8"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-[2px] bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
          <BrainCircuit className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-1">
            Trader Problems
          </h1>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
            Advanced tools to conquer emotional trading, manage risk, and find
            your statistical edge.
          </p>
        </div>
      </div>

      {/* Tabbed Navigation */}
      <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200 dark:border-white/10 mb-6">
        <div className="flex space-x-6 min-w-max px-1">
          {tabs.map((tab) => {
            const isActive = location.pathname.includes(tab.path);
            return (
              <NavLink
                key={tab.name}
                to={tab.path}
                className={`pb-3 text-sm font-bold flex items-center gap-2 transition-colors border-b-2 ${
                  isActive
                    ? "border-[#2f8df4] text-[#2f8df4]"
                    : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {tab.icon}
                {tab.name}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Renders the specific tool selected from the tabs */}
      <div className="animate-in fade-in duration-300">
        <Outlet />
      </div>
    </div>
  );
}
