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
        // CRITICAL FIX: Fallback to empty array to prevent fatal crashes
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
      return "bg-[#e6f4ea] dark:bg-[#0d3429] text-[#137333] dark:text-[#36d99d] border-[#137333]/30 dark:border-[#36d99d]/30";
    if (res === "loss")
      return "bg-[#fce8e6] dark:bg-[#35151c] text-[#c5221f] dark:text-[#ff7c89] border-[#c5221f]/30 dark:border-[#ff7c89]/30";
    return "bg-[#fef7e0] dark:bg-[#34280e] text-[#b06000] dark:text-[#f5c65d] border-[#b06000]/30 dark:border-[#f5c65d]/30";
  };

  return (
    <div
      className="w-full max-w-7xl mx-auto font-sans pb-16 px-4 md:px-8 mt-8"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[2px] bg-[#a78bfa]/10 flex items-center justify-center border border-[#a78bfa]/20 shrink-0">
            <Target className="w-6 h-6 text-[#a78bfa]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
              Past Trades
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You have {trades.length} saved trades in your journal.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/add-trade")}
          className="px-8 py-3.5 bg-[#2f8df4] hover:bg-[#2376e8] text-white font-bold rounded-[2px] transition-all shadow-lg text-sm flex items-center justify-center gap-2"
        >
          ＋ Add Trade
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search asset, setup, or session..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/10 rounded-[2px] py-4 pl-12 pr-4 text-gray-900 dark:text-white text-sm focus:border-[#2f8df4] outline-none shadow-sm"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="appearance-none bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/10 rounded-[2px] py-4 pl-12 pr-12 text-gray-900 dark:text-white text-sm focus:border-[#2f8df4] outline-none shadow-sm min-w-[200px]"
          >
            <option value="">All Results</option>
            <option value="win">Win</option>
            <option value="loss">Loss</option>
            <option value="be">Break-Even</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-80">
            <Loader2 className="w-10 h-10 text-[#a78bfa] animate-spin mb-4" />
            <p className="text-gray-500 text-sm font-medium">
              Loading your journal...
            </p>
          </div>
        ) : filteredTrades.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-center px-4">
            <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-[2px] flex items-center justify-center mb-6">
              <Target className="w-8 h-8 text-gray-400" />
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
                <tr className="bg-gray-50 dark:bg-[#1a1d24] text-[11px] text-gray-500 uppercase tracking-widest border-b border-gray-200 dark:border-white/5">
                  <th className="py-5 px-8 font-bold">Date & Time</th>
                  <th className="py-5 px-8 font-bold">Market</th>
                  <th className="py-5 px-8 font-bold">Direction</th>
                  <th className="py-5 px-8 font-bold">Setup</th>
                  <th className="py-5 px-8 font-bold">Result</th>
                  <th className="py-5 px-8 font-bold text-right">Net R</th>
                  <th className="py-5 px-8 font-bold text-center">Media</th>
                  <th className="py-5 px-8 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {filteredTrades.map((t, idx) => {
                  const rMultiple = parseFloat(t.r_multiple || 0);
                  const hasImages = t.images && t.images.length > 0;
                  return (
                    <tr
                      key={idx}
                      onClick={() => setSelectedTrade(t)}
                      className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group cursor-pointer"
                    >
                      <td className="py-5 px-8">
                        <div className="text-sm font-bold text-gray-900 dark:text-gray-200 mb-1">
                          {t.date}
                        </div>
                        <div className="text-xs text-gray-500">{t.time}</div>
                      </td>
                      <td className="py-5 px-8">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-gray-100 dark:bg-[#1a1d24] rounded-[2px] flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/5 shadow-sm">
                            {t.asset?.substring(0, 2).toUpperCase()}
                          </span>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {t.asset}
                          </span>
                        </div>
                      </td>
                      <td className="py-5 px-8">
                        <span
                          className={`text-xs font-bold uppercase tracking-widest ${t.direction === "LONG" ? "text-emerald-600 dark:text-emerald-500" : "text-red-600 dark:text-red-500"}`}
                        >
                          {t.direction}
                        </span>
                      </td>
                      <td className="py-5 px-8 text-sm text-gray-700 dark:text-gray-300 font-medium">
                        {t.setup}
                      </td>
                      <td className="py-5 px-8">
                        <span
                          className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-[2px] border shadow-sm ${getResultPill(t.result)}`}
                        >
                          {t.result}
                        </span>
                      </td>
                      <td
                        className={`py-5 px-8 text-right text-base font-bold ${rMultiple >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-red-600 dark:text-red-500"}`}
                      >
                        {rMultiple >= 0 ? "+" : ""}
                        {rMultiple.toFixed(2)}R
                      </td>
                      <td className="py-5 px-8 text-center">
                        {hasImages ? (
                          <div className="flex items-center justify-center gap-1.5 text-gray-500 group-hover:text-[#2f8df4] transition-colors">
                            <ImageIcon className="w-5 h-5" />
                            <span className="text-xs font-bold">
                              {t.images.length}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-5 px-8 text-right">
                        <button className="text-gray-400 group-hover:text-[#2f8df4] transition-colors">
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

      {selectedTrade && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedTrade(null)}
          ></div>
          <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-[2px] shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col scrollbar-hide">
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 md:p-8 bg-white dark:bg-[#121418] border-b border-gray-200 dark:border-white/5">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-[2px] bg-gray-100 dark:bg-[#1a1d24] border border-gray-200 dark:border-white/5 flex items-center justify-center shadow-sm">
                  <TrendingUp className="w-7 h-7 text-[#2f8df4]" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedTrade.asset}
                    </h2>
                    <span
                      className={`text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-[2px] border ${selectedTrade.direction === "LONG" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20" : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20"}`}
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
                className="p-2.5 bg-gray-50 dark:bg-[#1a1d24] hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-[2px] transition-colors border border-gray-200 dark:border-white/5 shadow-sm"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-8 bg-gray-50 dark:bg-[#0a0a0a]">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[
                  { label: "Setup", value: selectedTrade.setup },
                  {
                    label: "Result",
                    value: selectedTrade.result?.toUpperCase(),
                    isPill: true,
                  },
                  {
                    label: "Net R",
                    value: `${parseFloat(selectedTrade.r_multiple || 0).toFixed(2)}R`,
                    color:
                      parseFloat(selectedTrade.r_multiple) >= 0
                        ? "text-emerald-600 dark:text-emerald-500"
                        : "text-red-600 dark:text-red-500",
                  },
                  { label: "Entry", value: selectedTrade.entry || "—" },
                  { label: "Stop Loss", value: selectedTrade.sl || "—" },
                  { label: "Take Profit", value: selectedTrade.tp || "—" },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-5 flex flex-col justify-center shadow-sm"
                  >
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                      {stat.label}
                    </span>
                    {stat.isPill ? (
                      <div className="flex">
                        <span
                          className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-[2px] border ${getResultPill(selectedTrade.result)}`}
                        >
                          {stat.value}
                        </span>
                      </div>
                    ) : (
                      <span
                        className={`text-lg font-bold text-gray-900 dark:text-white ${stat.color || ""}`}
                      >
                        {stat.value}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-6 shadow-sm">
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#2f8df4]" /> Trade Analysis
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {selectedTrade.reason || "No analysis recorded."}
                  </p>
                </div>
                <div className="bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-6 shadow-sm">
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-3 flex items-center gap-2">
                    Key Lesson
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {selectedTrade.lesson || "No lesson recorded."}
                  </p>
                </div>
              </div>

              {selectedTrade.images && selectedTrade.images.length > 0 && (
                <div className="bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-6 shadow-sm">
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-5 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#a78bfa]" /> Execution
                    Charts
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {selectedTrade.images.map((img, i) => (
                      <div
                        key={i}
                        className="group relative rounded-[2px] overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-[#0a0a0a] shadow-sm"
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
