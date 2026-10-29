// frontend/src/pages/Tools.jsx
// Institutional Trading Tools Hub (Matches TradeFXBook Tools arrangement)

import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Brain,
  Sparkles,
  ArrowRight,
  Lock,
  X,
  Sparkle,
} from "lucide-react";

export default function Tools() {
  const navigate = useNavigate();
  const [lockedModalItem, setLockedModalItem] = useState(null);

  const userId = (
    localStorage.getItem("userId") ||
    localStorage.getItem("userEmail") ||
    ""
  )
    .toLowerCase()
    .trim();
  const isAdmin =
    userId === "noballondesk@gmail.com" || userId === "akpatil51340@gmail.com";

  const tools = [
    {
      id: "lot-size",
      title: "Position Size Calculator",
      description:
        "Calculate optimal lot size based on your risk tolerance, account balance, and stop-loss distance.",
      icon: Calculator,
      badge: "POPULAR",
      badgeColor: "blue",
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
      badgeColor: "emerald",
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
      badgeColor: "blue",
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
      badgeColor: "blue",
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
      badgeColor: "purple",
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
      badgeColor: "blue",
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
      badgeColor: "purple",
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
      badgeColor: "neutral",
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
      badgeColor: "purple",
      isLocked: true,
      requiresAdmin: true,
      path: "/bot-hub/mt5",
      category: "bot",
    },
    {
      id: "ai-analyser",
      title: "AI Trade Analyser",
      description:
        "Get AI-powered analysis, playbook categorization, and automated diagnostic reports on your performance.",
      icon: Brain,
      badge: "COMING SOON",
      badgeColor: "neutral",
      isComingSoon: true,
      category: "ai",
    },
    {
      id: "demo-trading",
      title: "Demo Trading",
      description:
        "Practice trading strategies risk-free with virtual funds and live tick execution before deploying capital.",
      icon: Sparkles,
      badge: "COMING SOON",
      badgeColor: "neutral",
      isComingSoon: true,
      category: "trading",
    },
  ];

  const availableCount = tools.filter((t) => t.isAvailable).length;
  const lockedCount = tools.filter((t) => t.isLocked || t.isComingSoon).length;

  const handleToolClick = (tool) => {
    if (tool.isComingSoon) return;

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

  const getBadgeStyle = (color) => {
    switch (color) {
      case "blue":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "emerald":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "purple":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
      case "amber":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      default:
        return "bg-black/[0.04] dark:bg-white/[0.06] text-neutral-500 dark:text-neutral-400 border-black/[0.06] dark:border-white/[0.08]";
    }
  };

  const getIconContainerStyle = (color) => {
    switch (color) {
      case "blue":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      case "emerald":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
      case "purple":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
      case "amber":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
      default:
        return "bg-neutral-100 dark:bg-white/[0.05] text-neutral-600 dark:text-neutral-300";
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24">
      {/* ── TOP HERO HEADER (Matches TradeFXBook Screenshot 2) ── */}
      <div className="rounded-3xl bg-white dark:bg-[#12151e]/85 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shadow-sm">
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

          {/* Top Right Counter Cards (Matches Screenshot 2) */}
          <div className="flex items-center gap-3">
            <div className="px-5 py-3 rounded-2xl bg-white/70 dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.06] text-center min-w-[90px]">
              <span className="block text-xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                {availableCount}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Available
              </span>
            </div>
            <div className="px-5 py-3 rounded-2xl bg-white/70 dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.06] text-center min-w-[90px]">
              <span className="block text-xl font-extrabold text-neutral-700 dark:text-neutral-300 font-mono">
                {lockedCount}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Coming Soon
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── CARD-WISE TOOL ARRANGEMENT (Matches TradeFXBook Screenshot 2) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <div
              key={tool.id}
              onClick={() => handleToolClick(tool)}
              className={`rounded-3xl bg-white dark:bg-[#12151e]/85 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] p-6 flex flex-col justify-between transition-all duration-300 group ${
                tool.isComingSoon
                  ? "opacity-60 cursor-default"
                  : "cursor-pointer hover:border-blue-500/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_8px_35px_rgba(0,0,0,0.4)] hover:-translate-y-0.5"
              }`}
            >
              <div>
                {/* Header: Icon & Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${getIconContainerStyle(
                      tool.badgeColor
                    )}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border flex items-center gap-1 ${getBadgeStyle(
                      tool.badgeColor
                    )}`}
                  >
                    {tool.isLocked && <Lock className="w-3 h-3" />}
                    {tool.badge}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="text-[15px] font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {tool.title}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mt-1.5 min-h-[36px]">
                  {tool.description}
                </p>
              </div>

              {/* Footer Action */}
              <div className="mt-5 pt-3.5 border-t border-black/[0.04] dark:border-white/[0.05]">
                {tool.isComingSoon ? (
                  <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                    In Development
                  </span>
                ) : tool.isLocked ? (
                  <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 dark:text-neutral-400 group-hover:text-blue-500 transition-colors">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-neutral-400 group-hover:text-blue-500" />
                      Locked (Beta Access)
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
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

            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
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
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
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
