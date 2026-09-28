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
} from "lucide-react";

export default function PastTrades() {
  const navigate = useNavigate();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState("");

  useEffect(() => {
    const fetchTrades = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        navigate("/login");
        return;
      }

      try {
        const response = await api.get(`/api/trades?userId=${userId}`);
        setTrades(response.data.data);
      } catch (error) {
        console.error("Failed to fetch trades:", error);
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
    if (res === "win") return "bg-[#0d3429] text-[#36d99d] border-[#36d99d]/30";
    if (res === "loss")
      return "bg-[#35151c] text-[#ff7c89] border-[#ff7c89]/30";
    return "bg-[#34280e] text-[#f5c65d] border-[#f5c65d]/30";
  };

  return (
    <div
      className="w-full max-w-7xl mx-auto font-sans pb-12"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-[#a78bfa]/10 flex items-center justify-center border border-[#a78bfa]/20">
              <Target className="w-5 h-5 text-[#a78bfa]" />
            </div>
            Past Trades
          </h1>
          <p className="text-sm text-gray-500 ml-14">
            You have {trades.length} saved trades in your journal.
          </p>
        </div>
        <button
          onClick={() => navigate("/add-trade")}
          className="px-6 py-2.5 bg-[#2f8df4] hover:bg-[#2376e8] text-white font-bold rounded-xl transition-all shadow-lg text-sm flex items-center gap-2"
        >
          ＋ Add Trade
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search asset, setup, or session..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#121418] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:border-[#6366f1] outline-none"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="appearance-none bg-[#121418] border border-white/10 rounded-xl py-3 pl-10 pr-10 text-white text-sm focus:border-[#6366f1] outline-none min-w-[160px]"
          >
            <option value="">All Results</option>
            <option value="win">Win</option>
            <option value="loss">Loss</option>
            <option value="be">Break-Even</option>
          </select>
        </div>
      </div>

      {/* Trades Table */}
      <div className="bg-[#121418] border border-white/5 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-[#a78bfa] animate-spin mb-4" />
            <p className="text-gray-400 text-sm">Loading your journal...</p>
          </div>
        ) : filteredTrades.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Target className="w-12 h-12 text-gray-700 mb-4" />
            <h3 className="text-lg font-bold text-gray-300">No trades found</h3>
            <p className="text-gray-500 text-sm mt-1">
              Adjust your filters or record a new trade.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[900px]">
              <thead>
                <tr className="bg-[#1a1d24] text-[10px] text-gray-500 uppercase tracking-widest border-b border-white/5">
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
              <tbody className="divide-y divide-white/5">
                {filteredTrades.map((t, idx) => {
                  const rMultiple = parseFloat(t.r_multiple || 0);
                  const hasImages = t.images && t.images.length > 0;

                  return (
                    <tr
                      key={idx}
                      className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                    >
                      <td className="py-3 px-6">
                        <div className="text-sm font-bold text-gray-200">
                          {t.date}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {t.time}
                        </div>
                      </td>
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 bg-[#1a1d24] rounded flex items-center justify-center text-[9px] font-bold text-gray-300 border border-white/5">
                            {t.asset?.substring(0, 2).toUpperCase()}
                          </span>
                          <span className="text-sm font-bold text-white">
                            {t.asset}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-6">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-widest ${t.direction === "LONG" ? "text-emerald-500" : "text-red-500"}`}
                        >
                          {t.direction}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-300 font-medium">
                        {t.setup}
                      </td>
                      <td className="py-3 px-6">
                        <span
                          className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest rounded-md border ${getResultPill(t.result)}`}
                        >
                          {t.result}
                        </span>
                      </td>
                      <td
                        className={`py-3 px-6 text-right text-sm font-bold ${rMultiple >= 0 ? "text-emerald-500" : "text-red-500"}`}
                      >
                        {rMultiple >= 0 ? "+" : ""}
                        {rMultiple.toFixed(2)}R
                      </td>
                      <td className="py-3 px-6 text-center">
                        {hasImages ? (
                          <div className="flex items-center justify-center gap-1 text-gray-400 group-hover:text-[#a78bfa] transition-colors">
                            <ImageIcon className="w-4 h-4" />
                            <span className="text-xs font-bold">
                              {t.images.length}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-6 text-right">
                        <button className="text-gray-500 group-hover:text-white transition-colors">
                          <ChevronRight className="w-5 h-5 inline" />
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
    </div>
  );
}
