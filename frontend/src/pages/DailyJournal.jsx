import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { Sunrise, Target, CheckCircle2, ChevronRight, Activity, Zap } from "lucide-react";

export default function DailyJournal() {
  const navigate = useNavigate();
  const [todayTrades, setTodayTrades] = useState([]);
  const [preMarketNote, setPreMarketNote] = useState("");
  const [postMarketNote, setPostMarketNote] = useState("");
  const [isPreMarketSaved, setIsPreMarketSaved] = useState(false);
  const [isPostMarketSaved, setIsPostMarketSaved] = useState(false);

  // Use today's date string as a local storage key suffix so each day is distinct
  const todayKey = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const fetchJournalData = async () => {
      const userId = localStorage.getItem("userId") || localStorage.getItem("userEmail");
      if (!userId) return;

      try {
        // Fetch today's notes
        const journalRes = await api.get(`/api/journals?userId=${userId}&date=${todayKey}`);
        if (journalRes.data?.data && journalRes.data.data.length > 0) {
          const entry = journalRes.data.data[0];
          if (entry.pre_market_note) {
            setPreMarketNote(entry.pre_market_note);
            setIsPreMarketSaved(true);
          }
          if (entry.post_market_note) {
            setPostMarketNote(entry.post_market_note);
            setIsPostMarketSaved(true);
          }
        }

        // Fetch today's trades
        const tradesRes = await api.get(`/api/trades?userId=${userId}`);
        const allTrades = tradesRes.data?.data || [];
        const today = allTrades.filter(t => (t.date || "").slice(0, 10) === todayKey);
        setTodayTrades(today);
      } catch (error) {
        console.error(error);
      }
    };
    fetchJournalData();
  }, [todayKey]);

  const saveJournalToDB = async (type, note) => {
    const userId = localStorage.getItem("userId") || localStorage.getItem("userEmail");
    if (!userId) return;
    try {
      const payload = { userId, date: todayKey };
      if (type === "pre") payload.pre_market_note = note;
      if (type === "post") payload.post_market_note = note;
      
      // Keep existing data to not overwrite during upsert
      if (type === "pre") payload.post_market_note = postMarketNote;
      if (type === "post") payload.pre_market_note = preMarketNote;

      await api.post("/api/journals", payload);
    } catch (error) {
      console.error("Failed to save note:", error);
    }
  };

  const savePreMarket = () => {
    saveJournalToDB("pre", preMarketNote);
    setIsPreMarketSaved(true);
  };

  const savePostMarket = () => {
    saveJournalToDB("post", postMarketNote);
    setIsPostMarketSaved(true);
  };

  const netDayR = todayTrades.reduce((acc, t) => acc + parseFloat(t.r_multiple || 0), 0);
  const brokeRules = todayTrades.some(t => t.rule_break === 'yes');

  return (
    <div className="w-full max-w-5xl mx-auto font-sans pb-24 px-4 md:px-8 mt-6">
      
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Today's Trading Review</h1>
        <p className="text-gray-500 text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
      </div>

      {/* VISUAL TIMELINE */}
      <div className="flex items-center justify-between relative mb-12 max-w-3xl mx-auto">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-white/5 z-0"></div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-cyan-500 z-0 transition-all" style={{ width: isPostMarketSaved ? '100%' : (todayTrades.length > 0 ? '50%' : (isPreMarketSaved ? '10%' : '0%')) }}></div>
        
        {/* Step 1 */}
        <div className="relative z-10 flex flex-col items-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-[#0A0B0D] ${isPreMarketSaved ? 'bg-cyan-500 text-white' : 'bg-[#15181D] text-gray-500 border-white/10'}`}>
            <Sunrise className="w-5 h-5" />
          </div>
          <p className={`mt-3 text-xs font-bold uppercase tracking-widest ${isPreMarketSaved ? 'text-cyan-400' : 'text-gray-500'}`}>Pre-Market</p>
        </div>

        {/* Step 2 */}
        <div className="relative z-10 flex flex-col items-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-[#0A0B0D] ${todayTrades.length > 0 ? 'bg-cyan-500 text-white' : 'bg-[#15181D] text-gray-500 border-white/10'}`}>
            <Target className="w-5 h-5" />
          </div>
          <p className={`mt-3 text-xs font-bold uppercase tracking-widest ${todayTrades.length > 0 ? 'text-cyan-400' : 'text-gray-500'}`}>Execution</p>
        </div>

        {/* Step 3 */}
        <div className="relative z-10 flex flex-col items-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-[#0A0B0D] ${isPostMarketSaved ? 'bg-emerald-500 text-white' : 'bg-[#15181D] text-gray-500 border-white/10'}`}>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className={`mt-3 text-xs font-bold uppercase tracking-widest ${isPostMarketSaved ? 'text-emerald-400' : 'text-gray-500'}`}>Review</p>
        </div>
      </div>

      <div className="space-y-8">
        
        {/* PRE MARKET SECTION */}
        <div className="bg-[#101216] border border-white/5 rounded-2xl p-6 md:p-8 shadow-xl">
           <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-500/10 rounded-lg"><Sunrise className="w-5 h-5 text-amber-400" /></div>
              <h2 className="text-lg font-bold text-white">Before Trading</h2>
           </div>
           
           {!isPreMarketSaved ? (
             <div>
                <p className="text-sm text-gray-400 mb-4">Set your intentions, mark your levels, and identify your mental state before the market opens.</p>
                <textarea 
                  value={preMarketNote} 
                  onChange={(e) => setPreMarketNote(e.target.value)}
                  placeholder="What is your focus for today? What setups are you looking for?" 
                  className="w-full h-32 bg-[#15181D] border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:border-amber-500/50 outline-none resize-none mb-4" 
                />
                <button onClick={savePreMarket} disabled={!preMarketNote} className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-sm transition-colors disabled:opacity-50">
                   Start Pre-Market Journal
                </button>
             </div>
           ) : (
             <div>
                <div className="bg-[#15181D] border border-white/5 p-5 rounded-xl">
                   <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{preMarketNote}</p>
                </div>
                <button onClick={() => setIsPreMarketSaved(false)} className="mt-4 text-xs font-bold text-amber-400 hover:text-amber-300">Edit Notes</button>
             </div>
           )}
        </div>

        {/* EXECUTION SECTION */}
        <div className={`bg-[#101216] border ${todayTrades.length > 0 ? 'border-cyan-500/30 shadow-cyan-500/10' : 'border-white/5'} rounded-2xl p-6 md:p-8 shadow-xl transition-all`}>
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-cyan-500/10 rounded-lg"><Target className="w-5 h-5 text-cyan-400" /></div>
                 <h2 className="text-lg font-bold text-white">During Trading</h2>
              </div>
              <button onClick={() => navigate('/add-trade')} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition-colors text-xs">
                 Log Trade <ChevronRight className="w-3 h-3" />
              </button>
           </div>
           
           {todayTrades.length === 0 ? (
             <div className="text-center py-8 bg-[#15181D] rounded-xl border border-dashed border-white/10">
                <p className="text-sm text-gray-500">No trades logged today.</p>
             </div>
           ) : (
             <div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                   <div className="bg-[#15181D] border border-white/5 p-4 rounded-xl">
                     <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Trades</p>
                     <p className="text-xl font-bold text-white">{todayTrades.length}</p>
                   </div>
                   <div className="bg-[#15181D] border border-white/5 p-4 rounded-xl">
                     <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Net R</p>
                     <p className={`text-xl font-bold ${netDayR >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{netDayR >= 0 ? '+' : ''}{netDayR.toFixed(2)}R</p>
                   </div>
                   <div className="bg-[#15181D] border border-white/5 p-4 rounded-xl col-span-2 flex items-center justify-between">
                     <div>
                       <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Discipline</p>
                       <p className={`text-sm font-bold ${brokeRules ? 'text-amber-400' : 'text-emerald-400'}`}>{brokeRules ? 'Rule Broken' : 'Followed Plan'}</p>
                     </div>
                     {brokeRules && <Zap className="w-6 h-6 text-amber-400" />}
                   </div>
                </div>
             </div>
           )}
        </div>

        {/* POST MARKET SECTION */}
        <div className={`bg-[#101216] border ${isPostMarketSaved ? 'border-emerald-500/30' : 'border-white/5'} rounded-2xl p-6 md:p-8 shadow-xl transition-all`}>
           <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-500/10 rounded-lg"><Activity className="w-5 h-5 text-emerald-400" /></div>
              <h2 className="text-lg font-bold text-white">After Trading</h2>
           </div>
           
           {!isPostMarketSaved ? (
             <div>
                <p className="text-sm text-gray-400 mb-4">Reflect on your performance. Did you execute your pre-market plan? What are the key takeaways?</p>
                <textarea 
                  value={postMarketNote} 
                  onChange={(e) => setPostMarketNote(e.target.value)}
                  placeholder="Review your session here..." 
                  className="w-full h-32 bg-[#15181D] border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:border-emerald-500/50 outline-none resize-none mb-4" 
                />
                <button onClick={savePostMarket} disabled={!postMarketNote} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50">
                   Review Session
                </button>
             </div>
           ) : (
             <div>
                <div className="bg-[#15181D] border border-emerald-500/10 p-5 rounded-xl">
                   <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{postMarketNote}</p>
                </div>
                <button onClick={() => setIsPostMarketSaved(false)} className="mt-4 text-xs font-bold text-emerald-400 hover:text-emerald-300">Edit Review</button>
             </div>
           )}
        </div>

      </div>
    </div>
  );
}
