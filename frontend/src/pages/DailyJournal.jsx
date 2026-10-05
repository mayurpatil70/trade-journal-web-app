import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { Sunrise, CheckCircle2, Activity, ImageIcon, Loader2 } from "lucide-react";

export default function DailyJournal() {
  const navigate = useNavigate();
  const [preMarketNote, setPreMarketNote] = useState("");
  const [postMarketNote, setPostMarketNote] = useState("");
  const [preMarketImage, setPreMarketImage] = useState(null);
  const [postMarketImage, setPostMarketImage] = useState(null);
  const [isPreMarketSaved, setIsPreMarketSaved] = useState(false);
  const [isPostMarketSaved, setIsPostMarketSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Use today's date string as a local storage key suffix so each day is distinct
  const todayKey = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const fetchJournalData = async () => {
      const userId = localStorage.getItem("userId") || localStorage.getItem("userEmail");
      if (!userId) return;

      try {
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
      } catch (error) {
        console.error(error);
      }
    };

    fetchJournalData();
  }, [todayKey]);

  const saveJournalToDB = async (type) => {
    const userId = localStorage.getItem("userId") || localStorage.getItem("userEmail");
    if (!userId) return;
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("date", todayKey);

      if (type === "pre") {
        formData.append("pre_market_note", preMarketNote);
        formData.append("post_market_note", postMarketNote); // Keep existing
        if (preMarketImage) formData.append("pre_market_image", preMarketImage);
      }
      
      if (type === "post") {
        formData.append("post_market_note", postMarketNote);
        formData.append("pre_market_note", preMarketNote); // Keep existing
        if (postMarketImage) formData.append("post_market_image", postMarketImage);
      }

      await api.post("/api/journals", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (type === "pre") setIsPreMarketSaved(true);
      if (type === "post") setIsPostMarketSaved(true);
    } catch (error) {
      console.error("Failed to save note:", error);
      alert("Failed to save journal");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto font-sans pb-24 px-4 md:px-8 mt-6">
      
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Today's Trading Review</h1>
        <p className="text-gray-500 text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
      </div>

      {/* VISUAL TIMELINE */}
      <div className="flex items-center justify-between relative mb-12 max-w-3xl mx-auto px-10">
        <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-[2px] bg-white/5 z-0"></div>
        <div className="absolute left-10 top-1/2 -translate-y-1/2 h-[2px] bg-cyan-500 z-0 transition-all" style={{ width: isPostMarketSaved ? '100%' : (isPreMarketSaved ? '50%' : '0%') }}></div>
        
        {/* Step 1 */}
        <div className="relative z-10 flex flex-col items-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-[#0A0B0D] ${isPreMarketSaved ? 'bg-cyan-500 text-white' : 'bg-[#15181D] text-gray-500 border-white/10'}`}>
            <Sunrise className="w-5 h-5" />
          </div>
          <p className={`mt-3 text-xs font-bold uppercase tracking-widest ${isPreMarketSaved ? 'text-cyan-400' : 'text-gray-500'}`}>Pre-Market</p>
        </div>

        {/* Step 2 */}
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
                
                {/* Pre Market Image Upload */}
                <div className="mb-6">
                  <label className="border-2 border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-white/5 hover:border-amber-500/50 transition-all cursor-pointer bg-[#15181D]">
                    {preMarketImage ? (
                      <>
                        <CheckCircle2 className="w-6 h-6 text-amber-400 mb-2" />
                        <p className="text-sm font-semibold text-amber-400 px-4">{preMarketImage.name}</p>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-6 h-6 text-gray-500 mb-2" />
                        <p className="text-[11px] text-gray-500 uppercase tracking-widest">Upload Pre-Market Chart (Required)</p>
                      </>
                    )}
                    <input type="file" accept="image/*" onChange={(e) => { if(e.target.files[0]) setPreMarketImage(e.target.files[0]) }} className="hidden" />
                  </label>
                </div>

                <button onClick={() => saveJournalToDB("pre")} disabled={isSaving || !preMarketNote || !preMarketImage} className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center gap-2">
                   {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
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

                {/* Post Market Image Upload */}
                <div className="mb-6">
                  <label className="border-2 border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-white/5 hover:border-emerald-500/50 transition-all cursor-pointer bg-[#15181D]">
                    {postMarketImage ? (
                      <>
                        <CheckCircle2 className="w-6 h-6 text-emerald-400 mb-2" />
                        <p className="text-sm font-semibold text-emerald-400 px-4">{postMarketImage.name}</p>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-6 h-6 text-gray-500 mb-2" />
                        <p className="text-[11px] text-gray-500 uppercase tracking-widest">Upload Post-Market Chart (Required)</p>
                      </>
                    )}
                    <input type="file" accept="image/*" onChange={(e) => { if(e.target.files[0]) setPostMarketImage(e.target.files[0]) }} className="hidden" />
                  </label>
                </div>

                <button onClick={() => saveJournalToDB("post")} disabled={isSaving || !postMarketNote || !postMarketImage} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center gap-2">
                   {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
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
