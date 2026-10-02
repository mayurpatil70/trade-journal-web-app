import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { Loader2, Brain, Activity, TrendingDown, Target } from "lucide-react";

export default function Psychology() {
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
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  const totalTrades = trades.length;
  
  // Group by Emotion Before
  const emotions = {};
  trades.forEach(t => {
     if (!t.emotion_before) return;
     const e = t.emotion_before;
     if (!emotions[e]) emotions[e] = { total: 0, wins: 0, r: 0 };
     emotions[e].total++;
     if (t.result === 'win') emotions[e].wins++;
     emotions[e].r += parseFloat(t.r_multiple || 0);
  });
  
  const emotionArray = Object.entries(emotions).map(([name, data]) => ({
     name, 
     winRate: (data.wins / data.total) * 100, 
     netR: data.r,
     total: data.total 
  })).sort((a,b) => b.netR - a.netR);

  // Group by Rule Breaking
  const rulesFollowed = trades.filter(t => t.rule_break === 'no' || !t.rule_break);
  const rulesBroken = trades.filter(t => t.rule_break === 'yes');
  
  const rFollowed = rulesFollowed.reduce((acc, t) => acc + parseFloat(t.r_multiple || 0), 0);
  const rBroken = rulesBroken.reduce((acc, t) => acc + parseFloat(t.r_multiple || 0), 0);

  return (
    <div className="w-full max-w-7xl mx-auto font-sans pb-24 px-4 md:px-8 mt-6">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-white flex items-center gap-3">
          <Brain className="w-6 h-6 text-purple-400" /> Psychology Lab
        </h1>
        <p className="text-gray-500 mt-1 text-[13px]">
          Understand how your emotional state affects your profitability.
        </p>
      </div>

      {totalTrades === 0 ? (
         <div className="bg-[#101216] border border-white/5 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
            <Brain className="w-12 h-12 text-gray-600 mb-4" />
            <h2 className="text-lg font-bold text-white mb-2">No psychology data</h2>
            <p className="text-gray-500 text-sm">Log some trades and track your emotions.</p>
         </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             
             {/* Discipline Impact */}
             <div className="bg-[#101216] border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                   <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-4"><Target className="w-4 h-4 text-cyan-400" /> Discipline Impact</h2>
                   <p className="text-xs text-gray-400 mb-6">How breaking your rules affects your P&L.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-[#15181D] border border-white/5 p-4 rounded-xl">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Followed Plan</p>
                      <p className={`text-xl font-bold ${rFollowed >= 0 ? "text-emerald-400" : "text-red-400"}`}>{rFollowed >= 0 ? "+" : ""}{rFollowed.toFixed(2)}R</p>
                      <p className="text-[10px] text-gray-500 mt-1">{rulesFollowed.length} trades</p>
                   </div>
                   <div className="bg-[#15181D] border border-white/5 p-4 rounded-xl">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Broke Rules</p>
                      <p className={`text-xl font-bold ${rBroken >= 0 ? "text-emerald-400" : "text-red-400"}`}>{rBroken >= 0 ? "+" : ""}{rBroken.toFixed(2)}R</p>
                      <p className="text-[10px] text-gray-500 mt-1">{rulesBroken.length} trades</p>
                   </div>
                </div>
             </div>

             {/* Emotion Performance Table */}
             <div className="bg-[#101216] border border-white/5 rounded-2xl shadow-xl overflow-hidden flex flex-col">
                <div className="p-5 border-b border-white/5 bg-[#0A0B0D]">
                   <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Activity className="w-4 h-4 text-purple-400" /> P&L by Emotional State</h2>
                </div>
                <div className="p-5 flex-1 overflow-y-auto">
                   {emotionArray.length === 0 ? <p className="text-sm text-gray-500">No emotional data logged.</p> : (
                      <div className="space-y-4">
                         {emotionArray.map((e, i) => (
                           <div key={i} className="flex items-center justify-between">
                              <div>
                                 <p className="text-[13px] font-bold text-white">{e.name}</p>
                                 <p className="text-[10px] text-gray-500">{e.total} trades</p>
                              </div>
                              <div className="text-right">
                                 <p className={`text-[13px] font-bold ${e.netR >= 0 ? "text-emerald-400" : "text-red-400"}`}>{e.netR >= 0 ? "+" : ""}{e.netR.toFixed(2)}R</p>
                                 <p className="text-[10px] text-gray-400">{e.winRate.toFixed(1)}% WR</p>
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
