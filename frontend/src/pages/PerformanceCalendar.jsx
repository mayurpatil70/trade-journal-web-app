import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Target,
  X,
  TrendingUp,
  Brain,
  Zap,
} from "lucide-react";

export default function PerformanceCalendar() {
  const navigate = useNavigate();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayTrades, setSelectedDayTrades] = useState(null);

  useEffect(() => {
    const fetchTrades = async () => {
      const userId = localStorage.getItem("userId") || localStorage.getItem("userEmail");
      if (!userId) return navigate("/login");
      try {
        const response = await api.get(`/api/trades?userId=${userId}`);
        setTrades(response.data?.data || []);
      } catch (error) {
        console.error("Failed to fetch calendar trades:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrades();
  }, [navigate]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startingDayIndex = (firstDayOfMonth.getDay() + 6) % 7;

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <div className="w-full max-w-7xl mx-auto font-sans pb-24 px-4 md:px-8 mt-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-3">
            <CalendarIcon className="w-6 h-6 text-purple-400" />
            Performance Calendar
          </h1>
          <p className="text-gray-500 mt-1 text-[13px]">
            Visualize your daily P&L, trading frequency, and consistency.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-[#101216] border border-white/5 rounded-xl p-1.5 shadow-lg">
          <button onClick={handlePrevMonth} className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-white min-w-[120px] text-center">
            {monthNames[month]} {year}
          </span>
          <button onClick={handleNextMonth} className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-96 bg-[#101216] border border-white/5 rounded-3xl">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-3" />
          <p className="text-gray-500 text-sm">Loading performance data...</p>
        </div>
      ) : (
        <div className="bg-[#101216] border border-white/5 rounded-3xl p-6 shadow-2xl">
          <div className="grid grid-cols-7 gap-3 mb-3">
            {dayNames.map((d, i) => (
              <div key={i} className="text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-3">
            {Array.from({ length: startingDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[120px] bg-white/[0.01] border border-white/[0.02] rounded-2xl"></div>
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const dayTrades = trades.filter((t) => (t.date || "").slice(0, 10) === dateString);
              
              const netDayR = dayTrades.reduce((acc, t) => acc + parseFloat(t.r_multiple || 0), 0);
              const hasTrades = dayTrades.length > 0;
              const isPositive = netDayR >= 0;
              const brokeRules = dayTrades.some((t) => t.rule_break === "yes");

              return (
                <div
                  key={dayNum}
                  onClick={() => hasTrades && setSelectedDayTrades({ date: dateString, trades: dayTrades })}
                  className={`min-h-[120px] rounded-2xl p-3 flex flex-col transition-all relative overflow-hidden group ${
                    hasTrades 
                      ? "bg-[#15181D] border border-white/10 cursor-pointer hover:border-purple-500/50 hover:bg-[#1a1e24] shadow-sm"
                      : "bg-[#0c0e12] border border-white/[0.03]"
                  }`}
                >
                  <div className="flex items-start justify-between relative z-10">
                    <span className={`text-sm font-bold ${hasTrades ? "text-white" : "text-gray-600"}`}>
                      {dayNum}
                    </span>
                    {hasTrades && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        isPositive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}>
                        {isPositive ? "+" : ""}{netDayR.toFixed(2)}R
                      </span>
                    )}
                  </div>
                  
                  {hasTrades && (
                    <div className="mt-auto relative z-10">
                       <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] text-gray-500 font-medium">{dayTrades.length} trade{dayTrades.length > 1 ? 's' : ''}</span>
                          {brokeRules && <Zap className="w-3 h-3 text-amber-400" />}
                       </div>
                       <div className="flex gap-1 h-1.5 rounded-full overflow-hidden bg-white/5">
                          {dayTrades.map((t, idx) => (
                             <div key={idx} className={`flex-1 ${parseFloat(t.r_multiple) >= 0 ? "bg-emerald-500" : "bg-red-500"}`} />
                          ))}
                       </div>
                    </div>
                  )}
                  
                  {hasTrades && (
                    <div className={`absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t opacity-10 pointer-events-none ${isPositive ? "from-emerald-500 to-transparent" : "from-red-500 to-transparent"}`}></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DAILY REVIEW DRAWER / MODAL */}
      {selectedDayTrades && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedDayTrades(null)} />
          
          <div className="relative w-full max-w-3xl max-h-[85vh] bg-[#101216] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-[#0A0B0D]">
                <div>
                   <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5 text-purple-400" /> {selectedDayTrades.date}
                   </h2>
                   <p className="text-gray-500 text-xs mt-1">Daily execution breakdown</p>
                </div>
                <button onClick={() => setSelectedDayTrades(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#0A0B0D]">
               {selectedDayTrades.trades.map((t, idx) => {
                 const r = parseFloat(t.r_multiple || 0);
                 const isWin = r >= 0;
                 return (
                   <div key={idx} onClick={() => navigate("/trades", { state: { openTradeId: t.id } })} className="bg-[#15181D] border border-white/5 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-4">
                         <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs border ${t.direction === "LONG" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" : "bg-purple-500/10 text-purple-400 border-purple-500/20"}`}>
                           {t.direction === "LONG" ? "▲" : "▼"}
                         </div>
                         <div>
                           <h3 className="font-semibold text-white text-[15px]">{t.asset}</h3>
                           <p className="text-[11px] text-gray-500 mt-0.5">{t.setup} • {t.session}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-4 justify-between md:justify-end">
                         {t.rule_break === "yes" && <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-1 rounded border border-amber-500/20 uppercase tracking-widest font-bold">Rule Broken</span>}
                         <div className={`px-3 py-1.5 rounded-lg border text-sm font-bold ${isWin ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                           {isWin ? "+" : ""}{r.toFixed(2)}R
                         </div>
                      </div>
                   </div>
                 );
               })}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
