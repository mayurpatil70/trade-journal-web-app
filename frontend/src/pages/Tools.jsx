// frontend/src/pages/Tools.jsx
// Institutional Trading Tools Hub (Matches TradeFXBook Tools arrangement & styling)

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIsAdmin } from "../hooks/useIsAdmin";
import {
  Wrench,
  Calculator,
  ShieldAlert,
  Clock,
  Activity,
  Globe,
  Cpu,
  Key,
  Zap,
  ArrowRight,
  Lock,
  X,
} from "lucide-react";

export default function Tools() {
  const navigate = useNavigate();
  const [lockedModalItem, setLockedModalItem] = useState(null);

  const isAdmin = useIsAdmin() === true;

  // Institutional Tools matching TradeFXBook Tools arrangement
  const tools = [
    {
      id: "lot-size",
      title: "Position Size Calculator",
      description:
        "Calculate optimal lot size based on your risk tolerance, account balance, and stop-loss distance.",
      icon: Calculator,
      badge: "POPULAR",
      isAvailable: true,
      path: "/calculator/lot-size",
      category: "calculator",
    },
    {
      id: "prop-firm",
      title: "Prop Firm Challenge Calculator",
      description:
        "Simulate drawdown constraints, daily loss limits, and target risk-to-reward to pass evaluations safely.",
      icon: ShieldAlert,
      badge: "LIVE",
      isAvailable: true,
      path: "/calculator/prop-firm",
      category: "calculator",
    },
    {
      id: "market-hours",
      title: "Forex Market Hours",
      description:
        "Track real-time trading sessions (London, New York, Asian, Sydney) and identify high-volatility killzones.",
      icon: Clock,
      badge: "LIVE",
      isAvailable: true,
      path: "/market-hours",
      category: "utility",
    },
    {
      id: "backtest-sessions",
      title: "Setup Backtesting",
      description:
        "Replay historical market sessions, test setup execution, and practice bar-by-bar backtesting.",
      icon: Zap,
      badge: "LIVE",
      isAvailable: true,
      path: "/sessions",
      category: "utility",
    },
    {
      id: "live-charts",
      title: "Live Trading Charts",
      description:
        "Institutional TradingView charting engine with multi-timeframe analysis, indicators, and market data.",
      icon: Activity,
      badge: "LIVE",
      isAvailable: true,
      path: "/charts",
      category: "charting",
    },
    {
      id: "economic-calendar",
      title: "Economic News Calendar",
      description:
        "Live macroeconomic events with high-impact volatility forecasts, previous vs actual consensus values.",
      icon: Globe,
      badge: "LIVE",
      isAvailable: true,
      path: "/news",
      category: "news",
    },
    {
      id: "bot-hub",
      title: "Bot Hub",
      description:
        "Automated trading bot management, webhook signal routing, and multi-asset algorithmic execution.",
      icon: Cpu,
      badge: "BETA",
      isLocked: true,
      requiresAdmin: true,
      path: "/bot-hub",
      category: "bot",
    },
    {
      id: "exchange-keys",
      title: "Exchange Keys",
      description:
        "Securely manage and encrypt your live API keys for Binance, Bybit, and MetaTrader brokerage terminals.",
      icon: Key,
      badge: "LOCKED",
      isLocked: true,
      requiresAdmin: true,
      path: "/bot-hub/connections",
      category: "bot",
    },
    {
      id: "mt5-bot",
      title: "MT5 AI Bot",
      description:
        "Connect MetaTrader 5 terminal with AI deep learning models and automated rule-based order execution.",
      icon: Zap,
      badge: "BETA",
      isLocked: true,
      requiresAdmin: true,
      path: "/bot-hub/mt5",
      category: "bot",
    },
  ];

  const availableCount = tools.filter((t) => t.isAvailable).length;
  const lockedCount = tools.filter((t) => t.isLocked).length;

  const handleToolClick = (tool) => {
    if (tool.isLocked) {
      if (isAdmin) {
        navigate(tool.path);
      } else {
        setLockedModalItem(tool);
      }
      return;
    }

    if (tool.path) {
      navigate(tool.path);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24">
      {/* ── TOP HERO HEADER (TradeFXBook White Squircle Style) ── */}
      <div className="rounded-3xl bg-white dark:bg-[#12151e]/85 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-[#0066FF] dark:text-[#38bdf8] border border-blue-500/20 flex items-center justify-center font-bold shadow-xs">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
                Trading Tools
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                Professional calculators and utilities to enhance your trading workflow
              </p>
            </div>
          </div>

          {/* Top Right Counter Badges */}
          <div className="flex items-center gap-3">
            <div className="px-5 py-2.5 rounded-2xl bg-white/70 dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.06] text-center min-w-[90px]">
              <span className="block text-xl font-extrabold text-[#0066FF] dark:text-blue-400 font-mono">
                {availableCount}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Available
              </span>
            </div>
            <div className="px-5 py-2.5 rounded-2xl bg-white/70 dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.06] text-center min-w-[90px]">
              <span className="block text-xl font-extrabold text-neutral-700 dark:text-neutral-300 font-mono">
                {lockedCount}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Beta Access
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── UNIFORM WHITE & LIGHT-BLUE CARDS (Matches TradeFXBook Tools) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <div
              key={tool.id}
              onClick={() => handleToolClick(tool)}
              className="rounded-3xl bg-white dark:bg-[#12151e]/85 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] p-6 flex flex-col justify-between transition-all duration-300 group cursor-pointer hover:border-blue-500/30 hover:shadow-[0_8px_30px_rgba(0,102,255,0.08)] dark:hover:shadow-[0_8px_35px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 select-none"
            >
              <div>
                {/* Header: Uniform Light Blue Squircle Container & Clean Pill Tag */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-[#0066FF] dark:text-[#38bdf8] border border-blue-500/15 flex items-center justify-center font-bold shadow-xs">
                    <Icon className="w-5 h-5" />
                  </div>

                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                      tool.isLocked
                        ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700"
                        : "bg-blue-50 dark:bg-blue-500/10 text-[#0066FF] dark:text-blue-400 border-blue-500/20"
                    }`}
                  >
                    {tool.isLocked && <Lock className="w-3 h-3" />}
                    {tool.badge}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="text-[15px] font-bold text-neutral-900 dark:text-white group-hover:text-[#0066FF] dark:group-hover:text-blue-400 transition-colors">
                  {tool.title}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mt-1.5 min-h-[36px]">
                  {tool.description}
                </p>
              </div>

              {/* Footer Action */}
              <div className="mt-5 pt-3.5 border-t border-black/[0.04] dark:border-white/[0.05]">
                {tool.isLocked ? (
                  <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 dark:text-neutral-400 group-hover:text-blue-500 transition-colors">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-neutral-400 group-hover:text-blue-500" />
                      Locked (Beta Access)
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs font-semibold text-[#0066FF] dark:text-blue-400 group-hover:text-[#0052CC] dark:group-hover:text-blue-300 transition-colors">
                    <span>Open Tool</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── LOCKED FEATURE POPUP MODAL ── */}
      {lockedModalItem && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 dark:bg-black/70 backdrop-blur-md px-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-[#131622] rounded-3xl p-6 border border-black/[0.08] dark:border-white/[0.12] shadow-2xl space-y-4">
            <button
              onClick={() => setLockedModalItem(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 dark:hover:text-white p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-[#0066FF] dark:text-[#38bdf8] flex items-center justify-center font-bold">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  {lockedModalItem.title} is Locked
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  Beta
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
                Automated algorithmic trading bots and exchange API connectivity
                are currently available for Pro Workspace members and authorized
                beta testers.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  setLockedModalItem(null);
                  navigate("/paywall");
                }}
                className="w-full py-2.5 bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold rounded-xl text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer btn-primary-blue"
              >
                <span>Upgrade to Pro Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setLockedModalItem(null)}
                className="w-full py-2.5 bg-neutral-100 dark:bg-white/[0.05] hover:bg-neutral-200 dark:hover:bg-white/[0.1] text-neutral-700 dark:text-neutral-300 font-semibold rounded-xl text-xs transition-all active:scale-95 cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
