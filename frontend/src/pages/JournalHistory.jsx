// frontend/src/pages/JournalHistory.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import {
  BookOpen,
  Search,
  Loader2,
  Calendar,
  Target,
  Image as ImageIcon,
  ChevronRight,
  X,
  TrendingUp,
  Brain,
} from "lucide-react";

export default function JournalHistory() {
  const navigate = useNavigate();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTrade, setSelectedTrade] = useState(null);

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
        console.error("Failed to fetch journal history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();
  }, [navigate]);

  const filteredTrades = trades.filter((t) => {
    const query = search.toLowerCase();
    return (
      !search ||
      `${t.asset} ${t.setup} ${t.reason} ${t.lesson} ${t.session}`
        .toLowerCase()
        .includes(query)
    );
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
      className="w-full max-w-7xl mx-auto font-sans pb-16 px-4 md:px-8 mt-6 md:mt-8 box-border"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header */}
      <div className="mb-8 md:mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-[2px] bg-[#f472b6]/10 flex items-center justify-center border border-[#f472b6]/20 shrink-0">
            <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-[#f472b6]" />
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-1">
              Journal History
            </h1>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
              Complete text logs, analyses, and lessons from every trade.
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-8 max-w-xl">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search notes, assets, lessons, setups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/10 rounded-[2px] py-3.5 pl-11 pr-4 text-gray-900 dark:text-white text-sm focus:border-[#2f8df4] outline-none shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-80 bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px]">
          <Loader2 className="w-8 h-8 text-[#f472b6] animate-spin mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            Loading journal entries...
          </p>
        </div>
      ) : filteredTrades.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-80 bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] text-center p-6">
          <BookOpen className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            No Journal Entries Found
          </h3>
          <p className="text-sm text-gray-500">
            Try adjusting your search criteria or log a new trade.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTrades.map((t, idx) => {
            const r = parseFloat(t.r_multiple || 0);
            return (
              <div
                key={idx}
                onClick={() => setSelectedTrade(t)}
                className="bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-6 shadow-sm hover:border-[#2f8df4] transition-all cursor-pointer group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-100 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 bg-gray-50 dark:bg-[#1a1d24] border border-gray-200 dark:border-white/5 rounded-[2px] flex items-center justify-center text-xs font-bold text-gray-800 dark:text-white">
                      {t.asset?.substring(0, 2)}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">
                          {t.asset}
                        </h3>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${t.direction === "LONG" ? "text-emerald-500" : "text-red-500"}`}
                        >
                          {t.direction}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {t.date} · {t.session} Session
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-[2px] border ${getResultPill(t.result)}`}
                    >
                      {t.result}
                    </span>
                    <span
                      className={`text-sm font-bold ${r >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-red-600 dark:text-red-500"}`}
                    >
                      {r >= 0 ? "+" : ""}
                      {r.toFixed(2)}R
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-50 dark:bg-[#0b131d] p-4 rounded-[2px] border border-gray-200 dark:border-[#1f2c3b]">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                      Analysis / Reason
                    </span>
                    <p className="text-gray-700 dark:text-gray-300 line-clamp-2">
                      {t.reason || "No analysis provided."}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#0b131d] p-4 rounded-[2px] border border-gray-200 dark:border-[#1f2c3b]">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                      Lesson Learned
                    </span>
                    <p className="text-gray-700 dark:text-gray-300 line-clamp-2">
                      {t.lesson || "No lesson recorded."}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedTrade && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedTrade(null)}
          ></div>
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-[2px] shadow-2xl flex flex-col scrollbar-hide">
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-white dark:bg-[#121418] border-b border-gray-200 dark:border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[2px] bg-gray-100 dark:bg-[#1a1d24] border border-gray-200 dark:border-white/5 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-[#f472b6]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedTrade.asset} ({selectedTrade.direction})
                  </h2>
                  <p className="text-xs text-gray-500">
                    {selectedTrade.date} at {selectedTrade.time} ·{" "}
                    {selectedTrade.session} Session
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTrade(null)}
                className="p-2 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-white rounded-[2px]"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-6 bg-gray-50 dark:bg-[#0a0a0a]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#121418] p-4 rounded-[2px] border border-gray-200 dark:border-white/5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                    Setup
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {selectedTrade.setup}
                  </span>
                </div>
                <div className="bg-white dark:bg-[#121418] p-4 rounded-[2px] border border-gray-200 dark:border-white/5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                    Result
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-[2px] border ${getResultPill(selectedTrade.result)}`}
                  >
                    {selectedTrade.result}
                  </span>
                </div>
                <div className="bg-white dark:bg-[#121418] p-4 rounded-[2px] border border-gray-200 dark:border-white/5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                    Net R
                  </span>
                  <span
                    className={`text-sm font-bold ${parseFloat(selectedTrade.r_multiple) >= 0 ? "text-emerald-500" : "text-red-500"}`}
                  >
                    {parseFloat(selectedTrade.r_multiple || 0).toFixed(2)}R
                  </span>
                </div>
                <div className="bg-white dark:bg-[#121418] p-4 rounded-[2px] border border-gray-200 dark:border-white/5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                    Risk %
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {selectedTrade.risk}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-[#121418] p-5 rounded-[2px] border border-gray-200 dark:border-white/5">
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-2">
                    Analysis
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {selectedTrade.reason || "No analysis recorded."}
                  </p>
                </div>
                <div className="bg-white dark:bg-[#121418] p-5 rounded-[2px] border border-gray-200 dark:border-white/5">
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-2">
                    Lesson
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {selectedTrade.lesson || "No lesson recorded."}
                  </p>
                </div>
              </div>

              {selectedTrade.images && selectedTrade.images.length > 0 && (
                <div className="bg-white dark:bg-[#121418] p-5 rounded-[2px] border border-gray-200 dark:border-white/5">
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-4">
                    Charts
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {selectedTrade.images.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt="Trade Chart"
                        className="w-full h-40 object-cover rounded-[2px] border border-gray-200 dark:border-white/10"
                      />
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
