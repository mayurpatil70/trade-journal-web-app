// frontend/src/pages/PastTrades.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import {
  Loader2,
  Search,
  Target,
  Filter,
  ChevronRight,
  Image as ImageIcon,
  X,
  Calendar,
  TrendingUp,
  PlusCircle,
} from "lucide-react";

export default function PastTrades() {
  const navigate = useNavigate();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState("");
  const [selectedTrade, setSelectedTrade] = useState(null);

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
        console.error("Failed to fetch trades:", error);
        setTrades([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTrades();
  }, [navigate]);

  const filteredTrades = trades.filter((t) => {
    const matchesSearch =
      !search ||
      `${t.asset} ${t.setup} ${t.session}`
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchesResult = !resultFilter || t.result === resultFilter;
    return matchesSearch && matchesResult;
  });

  const getResultPill = (result) => {
    const res = result?.toLowerCase();
    if (res === "win")
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    if (res === "loss")
      return "bg-red-500/15 text-red-400 border-red-500/30";
    return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  };

  return (
    <div
      className="w-full max-w-7xl mx-auto font-sans pb-16 px-4 md:px-8 mt-6 md:mt-8"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/10">
            <Target className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                Past Trades
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-400 border border-violet-500/30">
                {trades.length} entries
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Review and analyze your complete trading journal.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/add-trade")}
          className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-violet-500/25 text-sm flex items-center justify-center gap-2"
        >
          <PlusCircle className="w-4 h-4" /> Add Trade
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search asset, setup, or session..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/60 dark:bg-white/[0.04] border border-gray-200/80 dark:border-white/10 rounded-2xl py-3 pl-11 pr-4 text-gray-900 dark:text-white text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 outline-none shadow-sm backdrop-blur-xl transition-all"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="appearance-none bg-white/60 dark:bg-white/[0.04] border border-gray-200/80 dark:border-white/10 rounded-2xl py-3 pl-11 pr-10 text-gray-900 dark:text-white text-sm focus:border-violet-400 outline-none shadow-sm backdrop-blur-xl min-w-[180px] transition-all"
          >
            <option value="">All Results</option>
            <option value="win">Win ✓</option>
            <option value="loss">Loss ✗</option>
            <option value="be">Break-Even</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/60 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden backdrop-blur-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-80">
            <Loader2 className="w-10 h-10 text-violet-400 animate-spin mb-4" />
            <p className="text-gray-500 text-sm font-medium">
              Loading your journal...
            </p>
          </div>
        ) : filteredTrades.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
              <Target className="w-8 h-8 text-violet-400/50" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-300 mb-2">
              No trades found
            </h3>
            <p className="text-gray-500 text-sm">
              Adjust filters or record a new trade.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1000px]">
              <thead>
                <tr className="bg-gray-50/80 dark:bg-white/[0.03] text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-200/80 dark:border-white/10">
                  <th className="py-4 px-6 font-bold">Date & Time</th>
                  <th className="py-4 px-6 font-bold">Market</th>
                  <th className="py-4 px-6 font-bold">Direction</th>
                  <th className="py-4 px-6 font-bold">Setup</th>
                  <th className="py-4 px-6 font-bold">Result</th>
                  <th className="py-4 px-6 font-bold text-right">Net R</th>
                  <th className="py-4 px-6 font-bold text-center">Media</th>
                  <th className="py-4 px-6 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/80 dark:divide-white/5">
                {filteredTrades.map((t, idx) => {
                  const rMultiple = parseFloat(t.r_multiple || 0);
                  const hasImages = t.images && t.images.length > 0;
                  return (
                    <tr
                      key={idx}
                      onClick={() => setSelectedTrade(t)}
                      className="hover:bg-white/40 dark:hover:bg-white/[0.03] transition-colors group cursor-pointer"
                    >
                      <td className="py-4 px-6">
                        <div className="text-sm font-bold text-gray-900 dark:text-gray-200 mb-0.5">
                          {t.date}
                        </div>
                        <div className="text-xs text-gray-500">{t.time}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-[10px] font-bold text-blue-400 shadow-sm">
                            {t.asset?.substring(0, 2).toUpperCase()}
                          </span>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {t.asset}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                            t.direction === "LONG"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}
                        >
                          {t.direction}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300 font-medium">
                        {t.setup}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-xl border ${getResultPill(t.result)}`}
                        >
                          {t.result}
                        </span>
                      </td>
                      <td
                        className={`py-4 px-6 text-right text-base font-bold ${rMultiple >= 0 ? "text-emerald-400" : "text-red-400"}`}
                      >
                        {rMultiple >= 0 ? "+" : ""}
                        {rMultiple.toFixed(2)}R
                      </td>
                      <td className="py-4 px-6 text-center">
                        {hasImages ? (
                          <div className="flex items-center justify-center gap-1.5 text-gray-500 group-hover:text-violet-400 transition-colors">
                            <ImageIcon className="w-5 h-5" />
                            <span className="text-xs font-bold">
                              {t.images.length}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button className="text-gray-400 group-hover:text-violet-400 transition-colors">
                          <ChevronRight className="w-6 h-6 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trade Detail Modal */}
      {selectedTrade && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedTrade(null)}
          />
          <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white/90 dark:bg-[#0a0a0a]/95 border border-gray-200/80 dark:border-white/10 rounded-3xl shadow-2xl flex flex-col scrollbar-hide backdrop-blur-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 md:p-8 bg-white/90 dark:bg-[#121418]/90 border-b border-gray-200/80 dark:border-white/10 backdrop-blur-xl rounded-t-3xl">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-7 h-7 text-violet-400" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedTrade.asset}
                    </h2>
                    <span
                      className={`text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-xl border ${selectedTrade.direction === "LONG" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}
                    >
                      {selectedTrade.direction}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {selectedTrade.date} at {selectedTrade.time}
                    </span>
                    <span className="px-2">•</span>
                    <span>{selectedTrade.session} Session</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedTrade(null)}
                className="p-2.5 bg-gray-100/80 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-xl transition-colors border border-gray-200/80 dark:border-white/10"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-6 bg-gray-50/80 dark:bg-[#0a0a0a]/80">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[
                  { label: "Setup", value: selectedTrade.setup },
                  { label: "Result", value: selectedTrade.result?.toUpperCase(), isPill: true },
                  {
                    label: "Net R",
                    value: `${parseFloat(selectedTrade.r_multiple || 0).toFixed(2)}R`,
                    color: parseFloat(selectedTrade.r_multiple) >= 0 ? "text-emerald-400" : "text-red-400",
                  },
                  { label: "Entry", value: selectedTrade.entry || "—" },
                  { label: "Stop Loss", value: selectedTrade.sl || "—" },
                  { label: "Take Profit", value: selectedTrade.tp || "—" },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="bg-white/80 dark:bg-white/[0.04] border border-gray-200/80 dark:border-white/10 rounded-2xl p-4 flex flex-col justify-center shadow-sm backdrop-blur-xl"
                  >
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                      {stat.label}
                    </span>
                    {stat.isPill ? (
                      <div className="flex">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border ${getResultPill(selectedTrade.result)}`}>
                          {stat.value}
                        </span>
                      </div>
                    ) : (
                      <span className={`text-lg font-bold text-gray-900 dark:text-white ${stat.color || ""}`}>
                        {stat.value}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Analysis & Lesson */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/80 dark:bg-white/[0.04] border border-gray-200/80 dark:border-white/10 rounded-2xl p-6 shadow-sm backdrop-blur-xl">
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-400" /> Trade Analysis
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {selectedTrade.reason || "No analysis recorded."}
                  </p>
                </div>
                <div className="bg-white/80 dark:bg-white/[0.04] border border-gray-200/80 dark:border-white/10 rounded-2xl p-6 shadow-sm backdrop-blur-xl">
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-3">
                    💡 Key Lesson
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {selectedTrade.lesson || "No lesson recorded."}
                  </p>
                </div>
              </div>

              {/* Chart Images */}
              {selectedTrade.images && selectedTrade.images.length > 0 && (
                <div className="bg-white/80 dark:bg-white/[0.04] border border-gray-200/80 dark:border-white/10 rounded-2xl p-6 shadow-sm backdrop-blur-xl">
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-5 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-violet-400" /> Execution Charts
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {selectedTrade.images.map((img, i) => (
                      <div
                        key={i}
                        className="group relative rounded-2xl overflow-hidden border border-gray-200/80 dark:border-white/10 bg-gray-100 dark:bg-white/5 shadow-sm"
                      >
                        <img
                          src={img}
                          alt="Chart"
                          className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
