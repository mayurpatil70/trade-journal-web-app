// frontend/src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import {
  LayoutDashboard,
  TrendingUp,
  Target,
  PlusCircle,
  ChevronRight,
  Loader2,
  Globe,
  List,
  Activity,
  Zap,
  Award,
  BarChart2,
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrades = async () => {
      const userId =
        localStorage.getItem("userId") || localStorage.getItem("userEmail");
      if (!userId) {
        navigate("/login");
        return;
      }

      try {
        const response = await api.get(`/api/trades?userId=${userId}`);
        setTrades(response.data?.data || []);
      } catch (error) {
        console.error("Failed to fetch dashboard trades:", error);
        setTrades([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();
  }, [navigate]);

  const totalTrades = trades.length;
  const wins = trades.filter((t) => t.result?.toLowerCase() === "win").length;
  const losses = trades.filter(
    (t) => t.result?.toLowerCase() === "loss"
  ).length;
  const breakEvens = trades.filter(
    (t) => t.result?.toLowerCase() === "be"
  ).length;

  const netR = trades.reduce(
    (acc, t) => acc + parseFloat(t.r_multiple || 0),
    0
  );
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

  const getResultPill = (result) => {
    const res = result?.toLowerCase();
    if (res === "win")
      return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30";
    if (res === "loss")
      return "bg-red-500/15 text-red-400 border border-red-500/30";
    return "bg-amber-500/15 text-amber-400 border border-amber-500/30";
  };

  const statCards = [
    {
      label: "Total Trades",
      value: totalTrades,
      icon: <Activity className="w-5 h-5" />,
      color: "from-blue-500/20 to-cyan-500/20",
      iconColor: "text-blue-400",
      border: "border-blue-500/20",
      glow: "shadow-blue-500/10",
    },
    {
      label: "Net R-Multiple",
      value: `${netR >= 0 ? "+" : ""}${netR.toFixed(2)}R`,
      icon: <TrendingUp className="w-5 h-5" />,
      color: netR >= 0 ? "from-emerald-500/20 to-green-500/20" : "from-red-500/20 to-rose-500/20",
      iconColor: netR >= 0 ? "text-emerald-400" : "text-red-400",
      border: netR >= 0 ? "border-emerald-500/20" : "border-red-500/20",
      glow: netR >= 0 ? "shadow-emerald-500/10" : "shadow-red-500/10",
      valueColor: netR >= 0 ? "text-emerald-400" : "text-red-400",
    },
    {
      label: "Win Rate",
      value: `${winRate.toFixed(1)}%`,
      icon: <Award className="w-5 h-5" />,
      color: "from-purple-500/20 to-violet-500/20",
      iconColor: "text-purple-400",
      border: "border-purple-500/20",
      glow: "shadow-purple-500/10",
    },
    {
      label: "W / L / BE",
      value: `${wins} / ${losses} / ${breakEvens}`,
      icon: <BarChart2 className="w-5 h-5" />,
      color: "from-orange-500/20 to-amber-500/20",
      iconColor: "text-orange-400",
      border: "border-orange-500/20",
      glow: "shadow-orange-500/10",
    },
  ];

  return (
    <div
      className="w-full max-w-7xl mx-auto font-sans pb-16 px-4 md:px-8 mt-6 md:mt-8 box-border"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header */}
      <div className="mb-8 md:mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/10">
            <LayoutDashboard className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                Dashboard
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 border border-blue-500/30">
                Live
              </span>
            </div>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
              Overview of your trading performance and recent activity.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/add-trade")}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/25 text-sm flex items-center justify-center gap-2"
        >
          <PlusCircle className="w-4 h-4" /> Add Trade
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white/60 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 rounded-3xl backdrop-blur-xl">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            Loading statistics...
          </p>
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-8">
            {statCards.map((card, i) => (
              <div
                key={i}
                className={`relative bg-white/60 dark:bg-white/[0.03] border ${card.border} rounded-2xl p-5 md:p-6 shadow-xl ${card.glow} backdrop-blur-xl overflow-hidden group hover:scale-[1.02] transition-transform`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-60 rounded-2xl`} />
                <div className="relative z-10">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} border ${card.border} flex items-center justify-center ${card.iconColor} mb-3`}>
                    {card.icon}
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest block mb-1">
                    {card.label}
                  </span>
                  <span className={`text-2xl md:text-3xl font-black ${card.valueColor || "text-gray-900 dark:text-white"}`}>
                    {card.value}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Trades */}
            <div className="lg:col-span-2 bg-white/60 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200/80 dark:border-white/10">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-400" /> Recent Trades
                </h3>
                <button
                  onClick={() => navigate("/trades")}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                >
                  View All <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {trades.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-blue-400/50" />
                  </div>
                  <p className="text-gray-500 text-sm">
                    No trades recorded yet. Click <strong>"Add Trade"</strong> to start your journal!
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto scrollbar-hide">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-200/80 dark:border-white/10">
                        <th className="pb-3 px-3 font-bold">Date</th>
                        <th className="pb-3 px-3 font-bold">Asset</th>
                        <th className="pb-3 px-3 font-bold">Setup</th>
                        <th className="pb-3 px-3 font-bold">Result</th>
                        <th className="pb-3 px-3 font-bold text-right">R</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100/80 dark:divide-white/5">
                      {trades.slice(0, 5).map((t, i) => {
                        const r = parseFloat(t.r_multiple || 0);
                        return (
                          <tr
                            key={i}
                            onClick={() => navigate("/trades")}
                            className="hover:bg-white/40 dark:hover:bg-white/[0.03] cursor-pointer transition-colors rounded-xl"
                          >
                            <td className="py-3 px-3 text-xs text-gray-600 dark:text-gray-300 font-medium">
                              {t.date}
                            </td>
                            <td className="py-3 px-3 text-xs font-bold text-gray-900 dark:text-white">
                              {t.asset}
                            </td>
                            <td className="py-3 px-3 text-xs text-gray-600 dark:text-gray-300">
                              {t.setup}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-lg ${getResultPill(t.result)}`}
                              >
                                {t.result}
                              </span>
                            </td>
                            <td
                              className={`py-3 px-3 text-right text-xs font-bold ${r >= 0 ? "text-emerald-400" : "text-red-400"}`}
                            >
                              {r >= 0 ? "+" : ""}
                              {r.toFixed(2)}R
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white/60 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-xl">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-6 pb-4 border-b border-gray-200/80 dark:border-white/10 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" /> Quick Actions
              </h3>
              <div className="space-y-3">
                {[
                  {
                    label: "Record New Trade",
                    icon: <PlusCircle className="w-5 h-5 text-blue-400" />,
                    route: "/add-trade",
                    gradient: "from-blue-500/10 to-cyan-500/10",
                    border: "border-blue-500/20",
                    hover: "hover:border-blue-400/50",
                  },
                  {
                    label: "Economic Calendar",
                    icon: <Globe className="w-5 h-5 text-amber-400" />,
                    route: "/news",
                    gradient: "from-amber-500/10 to-orange-500/10",
                    border: "border-amber-500/20",
                    hover: "hover:border-amber-400/50",
                  },
                  {
                    label: "View Past Trades",
                    icon: <List className="w-5 h-5 text-emerald-400" />,
                    route: "/trades",
                    gradient: "from-emerald-500/10 to-green-500/10",
                    border: "border-emerald-500/20",
                    hover: "hover:border-emerald-400/50",
                  },
                ].map((action, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(action.route)}
                    className={`w-full p-4 rounded-2xl bg-gradient-to-r ${action.gradient} border ${action.border} ${action.hover} text-left font-bold text-sm text-gray-900 dark:text-white flex items-center justify-between transition-all hover:scale-[1.02] shadow-sm`}
                  >
                    <span className="flex items-center gap-3">
                      {action.icon}
                      {action.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
