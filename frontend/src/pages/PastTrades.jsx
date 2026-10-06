import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  MoreHorizontal,
  Clock,
  ArrowRight,
  Brain,
  Pencil
} from "lucide-react";

export default function PastTrades() {
  const navigate = useNavigate();
  const location = useLocation();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState("");
  const [selectedTrade, setSelectedTrade] = useState(null);

  useEffect(() => {
    const fetchTrades = async () => {
      const userId = localStorage.getItem("userId") || localStorage.getItem("userEmail");
      if (!userId) return navigate("/login");
      try {
        const response = await api.get(`/api/trades?userId=${userId}`);
        const allTrades = response.data?.data || [];
        setTrades(allTrades);
        
        // Auto open trade if requested via navigation
        if (location.state?.openTradeId) {
          const t = allTrades.find(x => x.id === location.state.openTradeId);
          if (t) setSelectedTrade(t);
        }
      } catch (error) {
        console.error("Failed to fetch trades:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrades();
  }, [navigate, location.state]);

  const filteredTrades = trades.filter((t) => {
    const matchesSearch =
      !search ||
      `${t.asset} ${t.setup} ${t.session}`
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchesResult = !resultFilter || t.result === resultFilter;
    return matchesSearch && matchesResult;
  });

  // Pagination logic
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, resultFilter]);

  const indexOfLastTrade = currentPage * itemsPerPage;
  const indexOfFirstTrade = indexOfLastTrade - itemsPerPage;
  const currentTrades = filteredTrades.slice(indexOfFirstTrade, indexOfLastTrade);
  const totalPages = Math.ceil(filteredTrades.length / itemsPerPage);

  return (
    <div className="w-full max-w-7xl mx-auto font-sans pb-24 px-4 md:px-8 mt-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-3">
            <List className="w-6 h-6 text-emerald-400" />
            Trade Journal
            <span className="px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
              {filteredTrades.length} Logs
            </span>
          </h1>
          <p className="text-gray-500 mt-1 text-[13px]">
            Your central execution workspace. Filter, search, and review past data.
          </p>
        </div>
        <button
          onClick={() => navigate("/add-trade")}
          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors text-[13px] shadow-lg shadow-emerald-500/20"
        >
          <PlusCircle className="w-4 h-4" /> Log Trade
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search symbol, setup, or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#101216] border border-white/5 rounded-xl py-3 pl-11 pr-4 text-white text-[13px] focus:border-emerald-500/50 outline-none transition-all placeholder-gray-600"
          />
        </div>
        
        <div className="flex gap-2">
           <select
             value={resultFilter}
             onChange={(e) => setResultFilter(e.target.value)}
             className="appearance-none bg-[#101216] border border-white/5 rounded-xl py-3 pl-4 pr-10 text-white text-[13px] focus:border-emerald-500/50 outline-none min-w-[140px]"
           >
             <option value="" className="bg-[#101216] text-white">All Results</option>
             <option value="win" className="bg-[#101216] text-white">Win ✓</option>
             <option value="loss" className="bg-[#101216] text-white">Loss ✗</option>
             <option value="be" className="bg-[#101216] text-white">Break-Even</option>
           </select>
           <button className="px-4 py-3 bg-[#101216] border border-white/5 rounded-xl text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-[13px]">
             <Filter className="w-4 h-4" /> More Filters
           </button>
        </div>
      </div>

      {/* TRADE LIST */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 bg-[#101216] border border-white/5 rounded-2xl">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
            <p className="text-gray-500 text-sm">Loading execution history...</p>
          </div>
        ) : filteredTrades.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-[#101216] border border-white/5 rounded-2xl text-center px-4">
            <Target className="w-10 h-10 text-gray-600 mb-4" />
            <h3 className="text-base font-semibold text-gray-300 mb-1">No trades match criteria</h3>
            <p className="text-gray-500 text-sm">Adjust your filters or log a new trade.</p>
          </div>
        ) : (
          <>
            {currentTrades.map((t, idx) => {
              const r = parseFloat(t.r_multiple || 0);
              const isWin = r >= 0;
              const hasImages = t.images && t.images.length > 0;
              
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedTrade(t)}
                  className="bg-[#101216] border border-white/5 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-white/10 hover:bg-[#15181D] transition-all cursor-pointer group"
                >
                  {/* Left: Asset & Time */}
                  <div className="flex items-center gap-4 md:w-[25%]">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs border ${t.direction === "LONG" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" : "bg-purple-500/10 text-purple-400 border-purple-500/20"}`}>
                      {t.direction === "LONG" ? "▲" : "▼"}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-[15px]">{t.asset}</h3>
                      <p className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3 h-3" /> {t.date} {t.time && `• ${t.time}`}
                      </p>
                    </div>
                  </div>

                  {/* Middle: Setup & Session */}
                  <div className="flex-1 grid grid-cols-2 gap-4 border-t md:border-t-0 md:border-l border-white/5 pt-3 md:pt-0 md:pl-6">
                     <div>
                       <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Setup</p>
                       <p className="text-[13px] text-gray-300 font-medium">{t.setup || "—"}</p>
                     </div>
                     <div>
                       <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Session</p>
                       <p className="text-[13px] text-gray-300 font-medium">{t.session || "—"}</p>
                     </div>
                  </div>
                  
                  {/* Right: R-Multiple & Media */}
                  <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 md:border-l border-white/5 pt-3 md:pt-0 md:pl-6 md:w-[25%]">
                     <div className="flex items-center gap-2">
                        {hasImages && <ImageIcon className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 transition-colors" />}
                     </div>
                     <div className={`px-3 py-1.5 rounded-lg border text-sm font-bold ${isWin ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                       {isWin ? "+" : ""}{r.toFixed(2)}R
                     </div>
                     <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors hidden md:block" />
                  </div>
                </div>
              );
            })}
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8 pt-4">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-4 py-2 bg-[#101216] border border-white/5 rounded-lg text-sm text-gray-300 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-400">
                  Page <strong className="text-white">{currentPage}</strong> of {totalPages}
                </span>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="px-4 py-2 bg-[#101216] border border-white/5 rounded-lg text-sm text-gray-300 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* TRADE DETAIL MODAL / DRAWER */}
      {selectedTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedTrade(null)} />
          
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#101216] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
             
             {/* Header */}
             <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-[#0A0B0D]">
                <div className="flex items-center gap-3">
                   <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${selectedTrade.direction === "LONG" ? "bg-cyan-500/10 text-cyan-400" : "bg-purple-500/10 text-purple-400"}`}>{selectedTrade.direction}</span>
                   <h2 className="text-xl font-bold text-white">{selectedTrade.asset}</h2>
                   <span className="text-gray-500 text-sm">• {selectedTrade.date}</span>
                </div>
                <div className="flex items-center gap-2"><button onClick={() => navigate(`/add-trade?edit=${selectedTrade.id}`)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-emerald-400 transition-colors" title="Edit Trade"><Pencil className="w-4 h-4" /></button><button onClick={() => setSelectedTrade(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 transition-colors"><X className="w-4 h-4" /></button></div>
             </div>
             
             {/* Body */}
             <div className="flex-1 overflow-y-auto p-6 space-y-8">
                
                {/* Top Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   {[
                     { label: "Net R", value: `${parseFloat(selectedTrade.r_multiple || 0).toFixed(2)}R`, isNet: true },
                     { label: "Result", value: selectedTrade.result?.toUpperCase() },
                     { label: "Setup", value: selectedTrade.setup },
                     { label: "Session", value: selectedTrade.session },
                     { label: "Entry", value: selectedTrade.entry || "—" },
                     { label: "Stop Loss", value: selectedTrade.sl || "—" },
                     { label: "Take Profit", value: selectedTrade.tp || "—" },
                     { label: "Risk %", value: selectedTrade.risk ? `${selectedTrade.risk}%` : "—" },
                   ].map((s, i) => (
                     <div key={i} className="bg-[#15181D] border border-white/5 p-4 rounded-xl">
                       <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{s.label}</p>
                       <p className={`text-[15px] font-bold ${s.isNet ? (parseFloat(selectedTrade.r_multiple)>=0 ? 'text-emerald-400' : 'text-red-400') : 'text-white'}`}>{s.value}</p>
                     </div>
                   ))}
                </div>
                
                {/* Notes & Psychology */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                      <div>
                        <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Target className="w-3 h-3" /> Analysis</h3>
                        <p className="text-sm text-gray-300 leading-relaxed bg-[#15181D] border border-white/5 p-4 rounded-xl min-h-[100px] whitespace-pre-wrap">{selectedTrade.reason || "No analysis recorded."}</p>
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2"><TrendingUp className="w-3 h-3" /> Lesson</h3>
                        <p className="text-sm text-gray-300 leading-relaxed bg-[#15181D] border border-white/5 p-4 rounded-xl min-h-[100px] whitespace-pre-wrap">{selectedTrade.lesson || "No lesson recorded."}</p>
                      </div>
                   </div>
                   
                   <div className="bg-[#15181D] border border-white/5 p-5 rounded-xl flex flex-col">
                      <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Brain className="w-3 h-3" /> Psychology</h3>
                      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/5">
                        <div className="flex-1">
                           <p className="text-[10px] text-gray-500 uppercase mb-1">Emotion Before</p>
                           <p className="text-sm font-semibold text-white">{selectedTrade.emotion_before || "—"}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-600" />
                        <div className="flex-1">
                           <p className="text-[10px] text-gray-500 uppercase mb-1">Emotion After</p>
                           <p className="text-sm font-semibold text-white">{selectedTrade.emotion_after || "—"}</p>
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-500 uppercase mb-2">Psychological Notes</p>
                      <p className="text-sm text-gray-300 leading-relaxed flex-1 whitespace-pre-wrap">{selectedTrade.psych_note || "No notes recorded."}</p>
                   </div>
                </div>
                
                {/* Images */}
                {selectedTrade.images && selectedTrade.images.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><ImageIcon className="w-3 h-3" /> Execution Evidence</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedTrade.images.map((img, i) => (
                        <div key={i} onClick={() => window.open(img, '_blank')} className="relative aspect-video rounded-xl overflow-hidden border border-white/10 group cursor-pointer">
                          <img src={img} alt="Trade Chart" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="bg-black/80 text-white text-xs px-3 py-1.5 rounded-lg border border-white/20">View Full Size</span>
                          </div>
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

// Temporary inline component
const List = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="8" y1="6" x2="21" y2="6"></line>
    <line x1="8" y1="12" x2="21" y2="12"></line>
    <line x1="8" y1="18" x2="21" y2="18"></line>
    <line x1="3" y1="6" x2="3.01" y2="6"></line>
    <line x1="3" y1="12" x2="3.01" y2="12"></line>
    <line x1="3" y1="18" x2="3.01" y2="18"></line>
  </svg>
);

