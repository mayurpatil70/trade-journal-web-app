// frontend/src/pages/TraderProblems/Layout.jsx
import { Outlet, NavLink, useLocation, Link } from "react-router-dom";
import { Calculator, ShieldAlert, ArrowLeft } from "lucide-react";

export default function CalculatorLayout() {
  const location = useLocation();

  const tabs = [
    {
      id: "lot-size",
      label: "Position Size Calculator",
      icon: Calculator,
      path: "/calculator/lot-size",
    },
    {
      id: "prop-firm",
      label: "Prop Firm Challenge Calculator",
      icon: ShieldAlert,
      path: "/calculator/prop-firm",
    },
  ];

  return (
    <div
      className="w-full max-w-7xl mx-auto font-sans pb-16 px-4 md:px-8 mt-4 md:mt-6 box-border"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Back to Tools Button */}
      <div className="mb-4">
        <Link
          to="/tools"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors group px-3 py-1.5 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Tools</span>
        </Link>
      </div>

      <div className="mb-8 md:mb-10 flex items-center gap-4">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
          <Calculator className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white tracking-tight mb-1">
            Calculators
          </h1>
          <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400">
            Professional position sizing and prop firm risk management calculations.
          </p>
        </div>
      </div>

      <div className="flex overflow-x-auto scrollbar-hide mb-8 border-b border-black/[0.08] dark:border-white/5">
        {tabs.map((tab) => (
          <NavLink
            key={tab.id}
            to={tab.path}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
                isActive || location.pathname.includes(tab.path)
                  ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
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
