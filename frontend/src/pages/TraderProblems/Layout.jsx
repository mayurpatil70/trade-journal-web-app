// frontend/src/pages/TraderProblems/Layout.jsx
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { Calculator, ShieldAlert } from "lucide-react";

export default function CalculatorLayout() {
  const location = useLocation();

  const tabs = [
    {
      id: "lot-size",
      label: "Lot Size & Pip Calculator",
      icon: Calculator,
      path: "/calculator/lot-size",
    },
    {
      id: "prop-firm",
      label: "Prop Firm Guardian",
      icon: ShieldAlert,
      path: "/calculator/prop-firm",
    },
  ];

  return (
    <div
      className="w-full max-w-7xl mx-auto font-sans pb-16 px-4 md:px-8 mt-6 md:mt-8 box-border"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="mb-8 md:mb-10 flex items-center gap-4">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-[2px] bg-[#2f8df4]/10 flex items-center justify-center border border-[#2f8df4]/20 shrink-0">
          <Calculator className="w-5 h-5 md:w-6 md:h-6 text-[#2f8df4]" />
        </div>
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-1">
            Calculators & Tools
          </h1>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
            Manage your risk and track prop firm limits.
          </p>
        </div>
      </div>

      <div className="flex overflow-x-auto scrollbar-hide mb-8 border-b border-gray-200 dark:border-white/5">
        {tabs.map((tab) => (
          <NavLink
            key={tab.id}
            to={tab.path}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
                isActive || location.pathname.includes(tab.path)
                  ? "border-[#2f8df4] text-[#2f8df4]"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`
            }
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </NavLink>
        ))}
      </div>

      <div className="w-full">
        <Outlet />
      </div>
    </div>
  );
}
