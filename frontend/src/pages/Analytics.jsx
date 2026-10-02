import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { Loader2, Activity, Target, Zap, BarChart3, TrendingUp, Clock, Compass } from "lucide-react";

export default function Analytics() {
  const navigate = useNavigate();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

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
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  // Analytics Engine
  const totalTrades = trades.length;
  const wins = trades.filter((t) => (t.result || "").toLowerCase() === "win");
  const winRate = totalTrades ? (wins.length / totalTrades) * 100 : 0;
  
  // Setup Performance
  const setups = {};
  trades.forEach(t => {
     if (!t.setup) return;
     if (!setups[t.setup]) setups[t.setup] = { total: 0, wins: 0, r: 0 };
     setups[t.setup].total++;
     if (t.result === 'win') setups[t.setup].wins++;
     setups[t.setup].r += parseFloat(t.r_multiple || 0);
  });
  const setupArray = Object.entries(setups).map(([name, data]) => ({
     name, 
     winRate: (data.wins / data.total) * 100, 
     netR: data.r,
     total: data.total 
  })).sort((a,b) => b.netR - a.netR);

  // Session Performance
  const sessions = {};
  trades.forEach(t => {
     if (!t.session) return;
     if (!sessions[t.session]) sessions[t.session] = { total: 0, wins: 0, r: 0 };
     sessions[t.session].total++;
     if (t.result === 'win') sessions[t.session].wins++;
     sessions[t.session].r += parseFloat(t.r_multiple || 0);
  });
  const sessionArray = Object.entries(sessions).map(([name, data]) => ({
     name, winRate: (data.wins / data.total) * 100, netR: data.r, total: data.total
  })).sort((a,b) => b.netR - a.netR);

  return (
    <div className="w-full max-w-7xl mx-auto font-sans pb-24 px-4 md:px-8 mt-6">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-white flex items-center gap-3">
          <Activity className="w-6 h-6 text-cyan-400" /> Strategy Analytics
        </h1>
        <p className="text-gray-500 mt-1 text-[13px]">
          Discover your statistical edge based on actual execution data.
        </p>
      </div>

      {totalTrades === 0 ? (
         <div className="bg-[#101216] border border-white/5 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
            <BarChart3 className="w-12 h-12 text-gray-600 mb-4" />
            <h2 className="text-lg font-bold text-white mb-2">Not enough data</h2>
            <p className="text-gray-500 text-sm">Log some trades to start analyzing your statistical edge.</p>
         </div>
      ) : (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-[#101216] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10"><Target className="w-16 h-16 text-cyan-400" /></div>
                <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">Global Win Rate</h3>
                <p className="text-3xl font-bold text-white">{winRate.toFixed(1)}%</p>
                <p className="text-xs text-cyan-400 mt-2 font-semibold">Over {totalTrades} executions</p>
             </div>
             <div className="bg-[#101216] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10"><Zap className="w-16 h-16 text-emerald-400" /></div>
                <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">Best Setup (by R)</h3>
                <p className="text-xl font-bold text-white mt-1 truncate">{setupArray[0]?.name || "N/A"}</p>
                <p className="text-xs text-emerald-400 mt-2 font-semibold">{setupArray[0] ? `+${setupArray[0].netR.toFixed(2)}R` : "0R"}</p>
             </div>
             <div className="bg-[#101216] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10"><Clock className="w-16 h-16 text-purple-400" /></div>
                <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">Best Session</h3>
                <p className="text-xl font-bold text-white mt-1 truncate">{sessionArray[0]?.name || "N/A"}</p>
                <p className="text-xs text-purple-400 mt-2 font-semibold">{sessionArray[0] ? `+${sessionArray[0].netR.toFixed(2)}R` : "0R"}</p>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* Setups Table */}
             <div className="bg-[#101216] border border-white/5 rounded-2xl shadow-xl overflow-hidden">
                <div className="p-5 border-b border-white/5 bg-[#0A0B0D]">
                   <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Zap className="w-4 h-4 text-cyan-400" /> Edge by Setup</h2>
                </div>
                <div className="p-5">
                   {setupArray.length === 0 ? <p className="text-sm text-gray-500">No setups logged.</p> : (
                      <div className="space-y-4">
                         {setupArray.map((s, i) => (
                           <div key={i} className="flex items-center justify-between">
                              <div>
                                 <p className="text-[13px] font-bold text-white">{s.name}</p>
                                 <p className="text-[10px] text-gray-500">{s.total} trades</p>
                              </div>
                              <div className="text-right">
                                 <p className={`text-[13px] font-bold ${s.netR >= 0 ? "text-emerald-400" : "text-red-400"}`}>{s.netR >= 0 ? "+" : ""}{s.netR.toFixed(2)}R</p>
                                 <p className="text-[10px] text-gray-400">{s.winRate.toFixed(1)}% WR</p>
                              </div>
                           </div>
                         ))}
                      </div>
                   )}
                </div>
             </div>

             {/* Sessions Table */}
             <div className="bg-[#101216] border border-white/5 rounded-2xl shadow-xl overflow-hidden">
                <div className="p-5 border-b border-white/5 bg-[#0A0B0D]">
                   <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Compass className="w-4 h-4 text-purple-400" /> Edge by Session</h2>
                </div>
                <div className="p-5">
                   {sessionArray.length === 0 ? <p className="text-sm text-gray-500">No sessions logged.</p> : (
                      <div className="space-y-4">
                         {sessionArray.map((s, i) => (
                           <div key={i} className="flex items-center justify-between">
                              <div>
                                 <p className="text-[13px] font-bold text-white">{s.name}</p>
                                 <p className="text-[10px] text-gray-500">{s.total} trades</p>
                              </div>
                              <div className="text-right">
                                 <p className={`text-[13px] font-bold ${s.netR >= 0 ? "text-emerald-400" : "text-red-400"}`}>{s.netR >= 0 ? "+" : ""}{s.netR.toFixed(2)}R</p>
                                 <p className="text-[10px] text-gray-400">{s.winRate.toFixed(1)}% WR</p>
                              </div>
                           </div>
                         ))}
                      </div>
                   )}
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
