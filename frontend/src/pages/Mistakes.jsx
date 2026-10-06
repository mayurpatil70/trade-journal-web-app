import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { Loader2, ShieldCheck, AlertTriangle, Crosshair, ChevronRight } from "lucide-react";

export default function Mistakes() {
  const navigate = useNavigate();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchTrades = async () => {
      const userId = localStorage.getItem("userId") || localStorage.getItem("userEmail");
      if (!userId) return navigate("/login");
      try {
        const response = await api.get(`/api/trades?userId=${userId}`);
        setTrades(response.data?.data || []);
      } catch (error) {
        console.error("Failed to fetch trades:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrades();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  // Identify unforced errors (Losses where rules were broken)
  const unforcedErrors = trades.filter(t => t.result === 'loss' && t.rule_break === 'yes');
  const costOfMistakes = unforcedErrors.reduce((acc, t) => acc + parseFloat(t.r_multiple || 0), 0);
  
  // Setups that are losing money
  const setups = {};
  trades.forEach(t => {
     if (!t.setup) return;
     if (!setups[t.setup]) setups[t.setup] = { total: 0, r: 0 };
     setups[t.setup].total++;
     setups[t.setup].r += parseFloat(t.r_multiple || 0);
  });
  
  const losingSetups = Object.entries(setups)
     .map(([name, data]) => ({ name, ...data }))
     .filter(s => s.r < 0)
     .sort((a,b) => a.r - b.r);

  return (
    <div className="w-full max-w-7xl mx-auto font-sans pb-24 px-4 md:px-8 mt-6">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-white flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-amber-400" /> Mistake Lab
        </h1>
        <p className="text-gray-500 mt-1 text-[13px]">
          Identify what is draining your account and costing you R.
        </p>
      </div>

      {trades.length === 0 ? (
         <div className="bg-[#101216] border border-white/5 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
            <AlertTriangle className="w-12 h-12 text-gray-600 mb-4" />
            <h2 className="text-lg font-bold text-white mb-2">No data yet</h2>
            <p className="text-gray-500 text-sm">Log some trades to identify your mistakes.</p>
         </div>
      ) : (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Unforced Errors */}
             <div className="bg-[#101216] border border-white/5 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
                <div>
                   <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-amber-400" /> Unforced Errors</h2>
                   <p className="text-[11px] text-gray-400 mb-6">Losses where you explicitly broke your rules.</p>
                </div>
                <div>
                   <p className="text-4xl font-bold text-white mb-1">{unforcedErrors.length} <span className="text-sm text-gray-500 font-medium">trades</span></p>
                   <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider mt-4">Total Cost: {costOfMistakes.toFixed(2)}R</p>
                </div>
                <div className="absolute top-0 right-0 p-6 opacity-5"><AlertTriangle className="w-24 h-24 text-amber-400" /></div>
             </div>

             {/* Losing Setups */}
             <div className="bg-[#101216] border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                   <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-2"><Crosshair className="w-4 h-4 text-red-400" /> Negative Expectancy Setups</h2>
                   <p className="text-[11px] text-gray-400 mb-4">Setups that are currently draining your account.</p>
                </div>
                <div className="flex-1 overflow-y-auto max-h-[160px] space-y-3">
                   {losingSetups.length === 0 ? <p className="text-xs text-gray-500 mt-4">Great! No setups have a negative R.</p> : (
                      losingSetups.map((s, i) => (
                         <div key={i} className="flex items-center justify-between bg-[#15181D] border border-white/5 p-3 rounded-lg">
                            <span className="text-xs font-bold text-white">{s.name} <span className="text-[10px] text-gray-500 font-normal ml-2">({s.total} trades)</span></span>
                            <span className="text-xs font-bold text-red-400">{s.r.toFixed(2)}R</span>
                         </div>
                      ))
                   )}
                </div>
             </div>
          </div>
          
          {/* Mistake Log */}
          <div className="bg-[#101216] border border-white/5 rounded-2xl shadow-xl overflow-hidden mt-6">
             <div className="p-5 border-b border-white/5 bg-[#0A0B0D]">
                <h2 className="text-sm font-semibold text-white">Rule Break Log</h2>
             </div>
             <div className="p-5">
               {unforcedErrors.length === 0 ? <p className="text-sm text-gray-500">No unforced errors logged.</p> : (
                   <div className="space-y-3">
                      {unforcedErrors.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((t, i) => (
                        <div key={i} className="bg-[#15181D] border border-red-500/10 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                           <div>
                              <div className="flex items-center gap-2 mb-1">
                                 <span className="text-xs font-bold text-white">{t.asset}</span>
                                 <span className="text-[10px] text-gray-500">{t.date}</span>
                                 <span className="bg-red-500/10 text-red-400 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold border border-red-500/20">Rule Broken</span>
                              </div>
                              <p className="text-xs text-gray-400">Lesson: {t.lesson || "No lesson recorded"}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-sm font-bold text-red-400">{parseFloat(t.r_multiple || 0).toFixed(2)}R</p>
                              <button onClick={() => navigate('/trades')} className="text-[10px] text-gray-500 hover:text-white mt-1 flex items-center justify-end gap-1">View Trade <ChevronRight className="w-3 h-3" /></button>
                           </div>
                        </div>
                      ))}
                      
                      {/* Pagination Controls */}
                      {Math.ceil(unforcedErrors.length / itemsPerPage) > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-6 pt-4 border-t border-white/5">
                          <button 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            className="px-3 py-1.5 bg-[#101216] border border-white/5 rounded-lg text-xs text-gray-300 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Prev
                          </button>
                          <span className="text-xs text-gray-400">
                            Page <strong className="text-white">{currentPage}</strong> of {Math.ceil(unforcedErrors.length / itemsPerPage)}
                          </span>
                          <button 
                            disabled={currentPage === Math.ceil(unforcedErrors.length / itemsPerPage)}
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(unforcedErrors.length / itemsPerPage)))}
                            className="px-3 py-1.5 bg-[#101216] border border-white/5 rounded-lg text-xs text-gray-300 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Next
                          </button>
                        </div>
                      )}
                   </div>
                )}
             </div>
          </div>

        </div>
      )}
    </div>
  );
}
