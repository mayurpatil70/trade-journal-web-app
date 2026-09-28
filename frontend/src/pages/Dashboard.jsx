// frontend/src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import {
  LayoutDashboard,
  TrendingUp,
  Target,
  Calendar,
  PlusCircle,
  ChevronRight,
  Loader2,
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrades = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        navigate("/login");
        return;
      }

      try {
        const response = await api.get(`/api/trades?userId=${userId}`);
        setTrades(response.data.data || []);
      } catch (error) {
        console.error("Failed to fetch dashboard trades:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();
  }, [navigate]);

  // Calculations
  const totalTrades = trades.length;
  const wins = trades.filter((t) => t.result?.toLowerCase() === "win").length;
  const losses = trades.filter(
    (t) => t.result?.toLowerCase() === "loss",
  ).length;
  const breakEvens = trades.filter(
    (t) => t.result?.toLowerCase() === "be",
  ).length;

  const netR = trades.reduce(
    (acc, t) => acc + parseFloat(t.r_multiple || 0),
    0,
  );
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

  const getResultPill = (result) => {
    const res = result?.toLowerCase();
    if (res === "win")
      return "bg-[#e6f4ea] dark:bg-[#0d3429] text-[#137333] dark:text-[#36d99d] border-[#137333]/30 dark:border-[#36d99d]/30";
    if (res === "loss")
      return "bg-[#fce8e6] dark:bg-[#35151c] text-[#c5221f] dark:text-[#ff7c89] border-[#c5221f]/30 dark:border-[#ff7c89]/30";
    return "bg-[#fef7e0] dark:bg-[#34280e] text-[#b06000] dark:text-[#f5c65d] border-[#b06000]/30 dark:border-[#f5c65d]/30";
  };

  return (
    <div
      className="w-full max-w-7xl mx-auto font-sans pb-16 px-4 md:px-8 mt-6 md:mt-8 box-border"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header */}
      <div className="mb-8 md:mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-[2px] bg-[#2f8df4]/10 flex items-center justify-center border border-[#2f8df4]/20 shrink-0">
            <LayoutDashboard className="w-5 h-5 md:w-6 md:h-6 text-[#2f8df4]" />
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-1">
              Dashboard
            </h1>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
              Overview of your trading performance and recent activity.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/add-trade")}
          className="px-6 py-3 bg-[#2f8df4] hover:bg-[#2376e8] text-white font-bold rounded-[2px] transition-all shadow-md text-sm flex items-center justify-center gap-2"
        >
          <PlusCircle className="w-4 h-4" /> Add Trade
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px]">
          <Loader2 className="w-8 h-8 text-[#2f8df4] animate-spin mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            Loading statistics...
          </p>
        </div>
      ) : (
        <>
          {/* Stat Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            <div className="bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-5 md:p-6 shadow-sm">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">
                Total Trades
              </span>
              <span className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                {totalTrades}
              </span>
            </div>

            <div className="bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-5 md:p-6 shadow-sm">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">
                Net R-Multiple
              </span>
              <span
                className={`text-2xl md:text-3xl font-bold ${netR >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-red-600 dark:text-red-500"}`}
              >
                {netR >= 0 ? "+" : ""}
                {netR.toFixed(2)}R
              </span>
            </div>

            <div className="bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-5 md:p-6 shadow-sm">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">
                Win Rate
              </span>
              <span className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                {winRate.toFixed(1)}%
              </span>
            </div>

            <div className="bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-5 md:p-6 shadow-sm">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">
                W / L / BE
              </span>
              <span className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                {wins} / {losses} / {breakEvens}
              </span>
            </div>
          </div>

          {/* Recent Trades & Quick Actions Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Trades Table (Takes 2 columns) */}
            <div className="lg:col-span-2 bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-white/5">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#2f8df4]" /> Recent Trades
                </h3>
                <button
                  onClick={() => navigate("/trades")}
                  className="text-xs font-bold text-[#2f8df4] hover:underline flex items-center gap-1"
                >
                  View All <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {trades.length === 0 ? (
                <div className="py-12 text-center text-gray-500 text-sm">
                  No trades recorded yet. Click "Add Trade" to start your
                  journal!
                </div>
              ) : (
                <div className="overflow-x-auto scrollbar-hide">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="text-[10px] text-gray-500 uppercase tracking-widest border-b border-gray-200 dark:border-white/5">
                        <th className="pb-3 px-3 font-bold">Date</th>
                        <th className="pb-3 px-3 font-bold">Asset</th>
                        <th className="pb-3 px-3 font-bold">Setup</th>
                        <th className="pb-3 px-3 font-bold">Result</th>
                        <th className="pb-3 px-3 font-bold text-right">R</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                      {trades.slice(0, 5).map((t, i) => {
                        const r = parseFloat(t.r_multiple || 0);
                        return (
                          <tr
                            key={i}
                            onClick={() => navigate("/trades")}
                            className="hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors"
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
                                className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-[2px] border ${getResultPill(t.result)}`}
                              >
                                {t.result}
                              </span>
                            </td>
                            <td
                              className={`py-3 px-3 text-right text-xs font-bold ${r >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-red-600 dark:text-red-500"}`}
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

            {/* Quick Actions Panel */}
            <div className="bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-6 pb-4 border-b border-gray-200 dark:border-white/5">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate("/add-trade")}
                    className="w-full p-4 rounded-[2px] bg-gray-50 dark:bg-[#1a1d24] hover:bg-gray-100 dark:hover:bg-white/5 border border-gray-200 dark:border-white/5 text-left font-bold text-sm text-gray-900 dark:text-white flex items-center justify-between transition-colors shadow-sm"
                  >
                    <span>＋ Record New Trade</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => navigate("/news")}
                    className="w-full p-4 rounded-[2px] bg-gray-50 dark:bg-[#1a1d24] hover:bg-gray-100 dark:hover:bg-white/5 border border-gray-200 dark:border-white/5 text-left font-bold text-sm text-gray-900 dark:text-white flex items-center justify-between transition-colors shadow-sm"
                  >
                    <span>🌐 Economic Calendar</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => navigate("/trades")}
                    className="w-full p-4 rounded-[2px] bg-gray-50 dark:bg-[#1a1d24] hover:bg-gray-100 dark:hover:bg-white/5 border border-gray-200 dark:border-white/5 text-left font-bold text-sm text-gray-900 dark:text-white flex items-center justify-between transition-colors shadow-sm"
                  >
                    <span>📋 View Past Trades</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="mt-8 p-4 bg-gray-50 dark:bg-[#1a1d24] border border-gray-200 dark:border-white/5 rounded-[2px]">
                <p className="text-[10px] font-bold text-[#2f8df4] uppercase tracking-widest mb-1">
                  Pro Tip
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Consistent journaling with psychology tracking leads to
                  sustainable edge. Log your emotional state every time!
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
