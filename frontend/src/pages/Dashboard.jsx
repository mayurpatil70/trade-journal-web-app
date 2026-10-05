import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  Activity,
  AlertCircle,
  PlusCircle,
  Clock,
  ArrowRight,
  ShieldAlert,
  List,
} from "lucide-react";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

// Mini SVG Equity Curve
const EquityCurve = ({ data }) => {
  if (!data || data.length < 2) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
        <Activity className="w-8 h-8 mb-2 opacity-20" />
        <p className="text-xs">Log more trades to generate equity curve</p>
      </div>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const width = 800;
  const height = 200;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d - min) / range) * height;
    return `${x},${y}`;
  });

  const isProfitable = data[data.length - 1] >= data[0];
  const strokeColor = isProfitable ? "#34d399" : "#f87171"; // emerald-400 or red-400
  const fillColor = isProfitable ? "url(#emeraldGradient)" : "url(#redGradient)";

  return (
    <svg viewBox={`0 -10 ${width} ${height + 20}`} className="w-full h-full overflow-visible preserve-3d">
      <defs>
        <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f87171" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#f87171" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points.join(" ")}
        className="drop-shadow-lg"
      />
      <polygon
        fill={fillColor}
        points={`${0},${height} ${points.join(" ")} ${width},${height}`}
      />
    </svg>
  );
};

export default function Dashboard() {
  const [trades, setTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      const userId = localStorage.getItem("userId") || localStorage.getItem("userEmail");
      if (!userId) return navigate("/login");
      const res = await api.get(`/api/trades?userId=${userId}`);
      
      const tradeList = res.data?.data || [];
      // Sort trades oldest to newest for correct equity curve logic
      const sorted = [...tradeList].sort((a, b) => new Date(a.date) - new Date(b.date));
      setTrades(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- STAT CALCULATIONS ---
  const stats = useMemo(() => {
    let totalPnl = 0;
    let wins = 0;
    let totalR = 0;
    let grossProfit = 0;
    let grossLoss = 0;
    
    // Equity tracking starting at 0
    let currentEquity = 0;
    const equityData = [0]; 

    trades.forEach((t) => {
      const r = parseFloat(t.r_multiple) || 0;
      totalR += r;
      if (t.result === "win" || r > 0) {
        wins++;
        grossProfit += r; 
      } else if (t.result === "loss" || r < 0) {
        grossLoss += Math.abs(r);
      }
      
      currentEquity += r;
      equityData.push(currentEquity);
    });

    const winRate = trades.length ? (wins / trades.length) * 100 : 0;
    const avgR = trades.length ? (totalR / trades.length) : 0;
    const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss) : (grossProfit > 0 ? 99 : 0);
    
    // Simple drawdown approx (Max peak - current)
    let maxPeak = 0;
    let maxDD = 0;
    equityData.forEach(eq => {
      if (eq > maxPeak) maxPeak = eq;
      const dd = maxPeak - eq;
      if (dd > maxDD) maxDD = dd;
    });

    return {
      totalR: totalR.toFixed(2),
      winRate: winRate.toFixed(1),
      avgR: avgR.toFixed(2),
      profitFactor: profitFactor.toFixed(2),
      maxDrawdown: maxDD.toFixed(2),
      totalTrades: trades.length,
      equityData
    };
  }, [trades]);

  if (isLoading) {
    return (
      <div className="p-8 h-full flex flex-col gap-6">
        <div className="h-20 bg-white/5 rounded-2xl animate-pulse"></div>
        <div className="grid grid-cols-5 gap-4">
          {[1,2,3,4,5].map(i => <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse"></div>)}
        </div>
        <div className="h-64 bg-white/5 rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  // AI-like Insights Generator
  const generateInsight = () => {
    if (trades.length < 5) return { text: "Log more trades to unlock behavioral insights.", type: "neutral" };
    if (parseFloat(stats.profitFactor) < 1.0) return { text: "Your profit factor has dropped below 1.0. Review your recent losing trades to plug the leak.", type: "warning" };
    if (parseFloat(stats.winRate) > 60 && parseFloat(stats.avgR) > 0) return { text: "Strong performance pattern detected. Your edge is currently playing out well.", type: "success" };
    return { text: "Your average R-multiple is stable, but consistency could improve.", type: "neutral" };
  };
  const insight = generateInsight();

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 pb-20">
      
      {/* 1. HERO HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-200">
            {getGreeting()}, <span className="text-white font-bold">{localStorage.getItem("userEmail")?.split('@')[0] || "Trader"}</span>
          </h1>
          <p className="text-gray-500 mt-1 text-[13px]">Your trading performance at a glance.</p>
        </div>
        <button
          onClick={() => navigate("/add-trade")}
          className="flex items-center gap-2 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition-colors text-[13px] shadow-lg shadow-cyan-500/20"
        >
          <PlusCircle className="w-4 h-4" /> Log Trade
        </button>
      </div>

      {/* 2. KPI ROW */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Net R-Multiple", value: `${stats.totalR >= 0 ? "+" : ""}${stats.totalR}R`, color: stats.totalR >= 0 ? "text-emerald-400" : "text-red-400" },
          { label: "Win Rate", value: `${stats.winRate}%`, color: "text-white" },
          { label: "Profit Factor", value: stats.profitFactor, color: "text-white" },
          { label: "Average R", value: `${stats.avgR >= 0 ? "+" : ""}${stats.avgR}R`, color: "text-gray-300" },
          { label: "Max Drawdown", value: `-${stats.maxDrawdown}R`, color: "text-red-400" },
        ].map((kpi, i) => (
          <div key={i} className="bg-[#101216] border border-white/5 rounded-2xl p-5 hover:bg-[#15181D] transition-colors">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2">{kpi.label}</p>
            <p className={`text-2xl font-bold tracking-tight ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* 3. MAIN PERFORMANCE AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equity Curve */}
        <div className="lg:col-span-2 bg-[#101216] border border-white/5 rounded-2xl p-6 flex flex-col shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[15px] font-semibold text-white">Equity Progression (R)</h2>
              <p className="text-[12px] text-gray-500 mt-1">Cumulative R-Multiple across all trades</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400" /> New Highs</span>
            </div>
          </div>
          <div className="flex-1 min-h-[250px] relative">
            <EquityCurve data={stats.equityData} />
          </div>
        </div>

        {/* AI Insight & Trading Health */}
        <div className="flex flex-col gap-6">
          {/* Economic Calendar & Promotion Card */}
          <div className="bg-gradient-to-br from-[#102a3a] to-[#0A0B0D] border border-cyan-500/20 rounded-2xl p-6 relative overflow-hidden group flex flex-col justify-between h-full">
            <div>
              <h3 className="text-[11px] font-semibold text-cyan-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                Economic Calendar
              </h3>
              <p className="text-gray-200 text-[13px] leading-relaxed mb-4 relative z-10">
                Stay ahead of the markets. Track upcoming high-impact economic events before you execute your trades.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center relative z-10">
              <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Get 10% Off with Affiliate
              </span>
              <button 
                onClick={() => navigate("/news")}
                className="text-[12px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              >
                View Calendar <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Quick Stats / Trading Health */}
          <div className="bg-[#101216] border border-white/5 rounded-2xl p-6 flex-1">
            <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-5">
              Trading Health
            </h3>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-400">Execution Discipline</span>
                  <span className="text-emerald-400 font-semibold">92%</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5">
                  <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-400">Rule Following</span>
                  <span className="text-cyan-400 font-semibold">85%</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5">
                  <div className="bg-cyan-400 h-1.5 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
              <div className="pt-4 mt-2 border-t border-white/5">
                 <div className="flex items-center gap-3 text-sm">
                   <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400">
                     <ShieldAlert className="w-4 h-4" />
                   </div>
                   <div>
                     <p className="text-gray-300 font-medium text-[13px]">1 Trade needs review</p>
                     <p className="text-[11px] text-gray-500">Missing psychology tags</p>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. RECENT TRADES (Visual Preview Format) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-semibold text-white">Recent Executions</h2>
          <button
            onClick={() => navigate("/trades")}
            className="text-[12px] font-semibold text-gray-400 hover:text-white transition-colors"
          >
            View All History
          </button>
        </div>
        
        {trades.length === 0 ? (
          <div className="bg-[#101216] border border-white/5 rounded-2xl p-10 text-center">
            <List className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <h3 className="text-gray-300 font-medium mb-1">Your trading history starts here.</h3>
            <p className="text-xs text-gray-500 mb-5">Log your first trade to begin discovering your performance patterns.</p>
            <button
              onClick={() => navigate("/add-trade")}
              className="px-5 py-2 bg-white/10 hover:bg-white/15 text-white text-[13px] font-medium rounded-lg transition-colors"
            >
              Add First Trade
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Show last 3 trades by sorting descending */}
            {[...trades].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3).map((t, i) => {
              const r = parseFloat(t.r_multiple || 0);
              const isWin = r >= 0;
              return (
                <div key={i} onClick={() => navigate("/trades")} className="bg-[#101216] border border-white/5 rounded-2xl p-5 hover:bg-[#15181D] hover:border-white/10 transition-all cursor-pointer group">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${t.direction === "LONG" ? "bg-cyan-400" : "bg-purple-400"}`} />
                        <h4 className="font-semibold text-[14px] text-gray-100">{t.asset}</h4>
                        <span className="text-[9px] uppercase font-bold text-gray-400 px-1.5 py-0.5 bg-white/5 rounded">{t.direction}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" /> {t.date}
                      </p>
                    </div>
                    <div className={`px-2 py-0.5 rounded-md border text-[11px] font-bold ${isWin ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                      {isWin ? "+" : ""}{r.toFixed(2)}R
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-[11px] text-gray-400 border-t border-white/5 pt-3">
                    <span className="truncate max-w-[120px]">{t.setup || "No setup logged"}</span>
                    <span className="group-hover:text-white transition-colors">Details &rarr;</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

// Re-using Sparkles inside Dashboard since it's removed from Paywall
const Sparkles = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
  </svg>
);
