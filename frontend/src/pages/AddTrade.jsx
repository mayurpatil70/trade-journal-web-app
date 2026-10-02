import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";
import {
  Save,
  X,
  Brain,
  Image as ImageIcon,
  Target,
  TrendingUp,
  Loader2,
  CheckCircle,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  Activity,
  Check,
  UploadCloud
} from "lucide-react";

export default function AddTrade() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  const assets = ["XAUUSD", "BTCUSD", "ETHUSD", "XAGUSD", "Other"];
  const setups = ["FVG", "SMT", "Liquidity Sweep", "Order Block", "Breakout", "Pullback", "Other"];
  const emotions = [
    "Calm", "Confident", "Focused", "Neutral", "Excited",
    "FOMO", "Anxious", "Fearful", "Revenge", "Impatient",
    "Greedy", "Tired", "Frustrated", "Overconfident", "Other",
  ];

  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }),
    asset: location?.state?.asset || "XAUUSD",
    direction: location?.state?.direction || "LONG",
    session: "London",
    setup: "FVG",
    entry: "",
    sl: "",
    tp: "",
    risk: "",
    result: "win",
    rMultiple: "",
    ruleBreak: "no",
    reason: "",
    lesson: "",
    emotionBefore: "",
    emotionAfter: "",
    psychNote: "",
  });

  const [customFields, setCustomFields] = useState({});
  const [images, setImages] = useState([null, null]);

  // Real-time R:R Calculations
  const [calcRR, setCalcRR] = useState(0);
  
  useEffect(() => {
    if (formData.entry && formData.sl && formData.tp) {
      const entry = parseFloat(formData.entry);
      const sl = parseFloat(formData.sl);
      const tp = parseFloat(formData.tp);
      
      const risk = Math.abs(entry - sl);
      const reward = Math.abs(tp - entry);
      
      if (risk > 0) {
        setCalcRR((reward / risk).toFixed(2));
      } else {
        setCalcRR(0);
      }
    }
  }, [formData.entry, formData.sl, formData.tp]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleCustomChange = (e) => setCustomFields({ ...customFields, [e.target.name]: e.target.value });

  const handleImageChange = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const newImages = [...images];
      newImages[index] = file;
      setImages(newImages);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const userId = localStorage.getItem("userId") || localStorage.getItem("userEmail");
    if (!userId) {
      alert("Session expired. Please log in again.");
      setIsSubmitting(false);
      return navigate("/login");
    }

    try {
      const submitData = new FormData();
      submitData.append("userId", userId);
      Object.keys(formData).forEach((key) => {
        const val = formData[key] === "Other" && customFields[key] ? customFields[key] : formData[key];
        submitData.append(key, val);
      });
      images.forEach((img) => { if (img) submitData.append("images", img); });

      await api.post("/api/trades", submitData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate("/trades");
    } catch (error) {
      console.error("Upload Error:", error);
      alert("Failed to save trade. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 6));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const steps = [
    { num: 1, title: "Market" },
    { num: 2, title: "Execution" },
    { num: 3, title: "Setup" },
    { num: 4, title: "Psychology" },
    { num: 5, title: "Review" },
    { num: 6, title: "Evidence" },
  ];

  const inputClass = "w-full bg-[#15181D] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-[15px] transition-all";
  const selectClass = "appearance-none w-full bg-[#15181D] border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-[15px] transition-all pr-10 cursor-pointer";
  const textareaClass = "w-full min-h-[120px] bg-[#15181D] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-[15px] resize-y transition-all";
  const labelClass = "text-[12px] font-semibold text-gray-400 mb-2 block uppercase tracking-wider";

  return (
    <div className="w-full max-w-4xl mx-auto font-sans pb-24 px-4 md:px-8 mt-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-cyan-400" /> Log Trade
          </h1>
          <p className="text-sm text-gray-500 mt-1">Capture your edge efficiently.</p>
        </div>
        <button onClick={() => navigate("/dashboard")} className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* PROGRESS BAR */}
      <div className="flex items-center justify-between mb-10 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-white/5 z-0"></div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-cyan-500 z-0 transition-all duration-300" style={{ width: `${((step - 1) / 5) * 100}%` }}></div>
        
        {steps.map(s => (
          <div key={s.num} className="relative z-10 flex flex-col items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 ${step >= s.num ? 'bg-cyan-500 text-white' : 'bg-[#15181D] border border-white/10 text-gray-500'}`}>
              {step > s.num ? <Check className="w-4 h-4" /> : s.num}
            </div>
            <span className={`text-[10px] uppercase tracking-widest absolute -bottom-6 whitespace-nowrap font-semibold ${step >= s.num ? 'text-cyan-400' : 'text-gray-600'}`}>{s.title}</span>
          </div>
        ))}
      </div>

      {/* FORM CONTAINER */}
      <div className="bg-[#101216] border border-white/5 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden min-h-[400px]">
        <form onSubmit={handleSubmit} className="relative z-10">
          
          {/* STEP 1: MARKET */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-semibold text-white mb-6">Market Context</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Asset / Pair</label>
                  <div className="relative">
                    <select name="asset" value={formData.asset} onChange={handleChange} className={selectClass}>
                      {assets.map(a => <option key={a} value={a} className="bg-[#15181D] text-white">{a}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                  {formData.asset === "Other" && (
                    <input type="text" name="asset" placeholder="Custom asset" value={customFields.asset || ""} onChange={handleCustomChange} className={`${inputClass} mt-3`} />
                  )}
                </div>
                <div>
                  <label className={labelClass}>Direction</label>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setFormData({...formData, direction: "LONG"})} className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-colors border ${formData.direction === "LONG" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-[#15181D] border-white/10 text-gray-500 hover:text-white"}`}>LONG ▲</button>
                    <button type="button" onClick={() => setFormData({...formData, direction: "SHORT"})} className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-colors border ${formData.direction === "SHORT" ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-[#15181D] border-white/10 text-gray-500 hover:text-white"}`}>SHORT ▼</button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Session</label>
                  <div className="relative">
                    <select name="session" value={formData.session} onChange={handleChange} className={selectClass}>
                      {["London", "New York", "Asian", "Sydney", "Other"].map(s => <option key={s} value={s} className="bg-[#15181D] text-white">{s}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Date</label>
                    <input type="date" name="date" value={formData.date} onChange={handleChange} className={`${inputClass} [color-scheme:dark]`} required />
                  </div>
                  <div>
                    <label className={labelClass}>Time</label>
                    <input type="time" name="time" value={formData.time} onChange={handleChange} className={`${inputClass} [color-scheme:dark]`} required />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: EXECUTION & VISUALIZATION */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-semibold text-white mb-6">Execution Parameters</h2>
              
              {/* Real-time Visualization */}
              <div className="bg-[#15181D] border border-white/5 rounded-2xl p-6 mb-6">
                 <div className="flex justify-between items-end mb-4">
                    <span className="text-xs text-gray-500 font-semibold uppercase tracking-widest">Trade Architecture</span>
                    {calcRR > 0 && <span className="text-sm font-bold text-cyan-400">1 : {calcRR} R:R</span>}
                 </div>
                 
                 <div className="relative h-20 flex flex-col justify-center">
                    {/* Simplified Visualizer */}
                    <div className="w-full flex items-center">
                       {formData.direction === "LONG" ? (
                         <>
                           <div className="w-1/4 flex flex-col items-center">
                              <span className="text-[10px] text-red-400 mb-1 block">STOP LOSS</span>
                              <div className="w-full h-1 bg-red-500/50 rounded-l-full relative"><div className="w-2 h-2 rounded-full bg-red-400 absolute right-0 top-1/2 -translate-y-1/2"></div></div>
                              <span className="text-xs text-gray-300 mt-1">{formData.sl || "---"}</span>
                           </div>
                           <div className="flex-1 flex flex-col items-center border-l-2 border-white/20">
                              <span className="text-[10px] text-gray-400 mb-1 block">ENTRY</span>
                              <div className="w-full h-1 bg-white/20"></div>
                              <span className="text-xs text-white mt-1 font-bold">{formData.entry || "---"}</span>
                           </div>
                           <div className="w-1/2 flex flex-col items-center">
                              <span className="text-[10px] text-emerald-400 mb-1 block">TAKE PROFIT</span>
                              <div className="w-full h-1 bg-emerald-500/50 rounded-r-full relative"><div className="w-2 h-2 rounded-full bg-emerald-400 absolute left-0 top-1/2 -translate-y-1/2"></div></div>
                              <span className="text-xs text-gray-300 mt-1">{formData.tp || "---"}</span>
                           </div>
                         </>
                       ) : (
                         <>
                           <div className="w-1/2 flex flex-col items-center">
                              <span className="text-[10px] text-emerald-400 mb-1 block">TAKE PROFIT</span>
                              <div className="w-full h-1 bg-emerald-500/50 rounded-l-full relative"><div className="w-2 h-2 rounded-full bg-emerald-400 absolute right-0 top-1/2 -translate-y-1/2"></div></div>
                              <span className="text-xs text-gray-300 mt-1">{formData.tp || "---"}</span>
                           </div>
                           <div className="flex-1 flex flex-col items-center border-r-2 border-white/20">
                              <span className="text-[10px] text-gray-400 mb-1 block">ENTRY</span>
                              <div className="w-full h-1 bg-white/20"></div>
                              <span className="text-xs text-white mt-1 font-bold">{formData.entry || "---"}</span>
                           </div>
                           <div className="w-1/4 flex flex-col items-center">
                              <span className="text-[10px] text-red-400 mb-1 block">STOP LOSS</span>
                              <div className="w-full h-1 bg-red-500/50 rounded-r-full relative"><div className="w-2 h-2 rounded-full bg-red-400 absolute left-0 top-1/2 -translate-y-1/2"></div></div>
                              <span className="text-xs text-gray-300 mt-1">{formData.sl || "---"}</span>
                           </div>
                         </>
                       )}
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className={labelClass}>Entry Price</label>
                  <input type="number" step="any" name="entry" value={formData.entry} onChange={handleChange} className={inputClass} placeholder="0.00" />
                </div>
                <div>
                  <label className={labelClass}>Stop Loss</label>
                  <input type="number" step="any" name="sl" value={formData.sl} onChange={handleChange} className={inputClass} placeholder="0.00" />
                </div>
                <div>
                  <label className={labelClass}>Take Profit</label>
                  <input type="number" step="any" name="tp" value={formData.tp} onChange={handleChange} className={inputClass} placeholder="0.00" />
                </div>
                <div>
                  <label className={labelClass}>Risk %</label>
                  <input type="number" step="any" name="risk" value={formData.risk} onChange={handleChange} className={inputClass} placeholder="1.0" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SETUP & OUTCOME */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-semibold text-white mb-6">Setup & Outcome</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Strategy / Setup</label>
                  <div className="relative">
                    <select name="setup" value={formData.setup} onChange={handleChange} className={selectClass}>
                      {setups.map(s => <option key={s} value={s} className="bg-[#15181D] text-white">{s}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                  {formData.setup === "Other" && (
                    <input type="text" name="setup" placeholder="Custom setup" value={customFields.setup || ""} onChange={handleCustomChange} className={`${inputClass} mt-3`} />
                  )}
                </div>
                <div>
                  <label className={labelClass}>Trade Result</label>
                  <div className="flex gap-2">
                     <button type="button" onClick={() => setFormData({...formData, result: "win"})} className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-colors border ${formData.result === "win" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-[#15181D] border-white/10 text-gray-500 hover:text-white"}`}>WIN ✓</button>
                     <button type="button" onClick={() => setFormData({...formData, result: "loss"})} className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-colors border ${formData.result === "loss" ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-[#15181D] border-white/10 text-gray-500 hover:text-white"}`}>LOSS ✗</button>
                     <button type="button" onClick={() => setFormData({...formData, result: "be"})} className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-colors border ${formData.result === "be" ? "bg-gray-500/20 border-gray-500/50 text-gray-300" : "bg-[#15181D] border-white/10 text-gray-500 hover:text-white"}`}>BE —</button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Net R-Multiple</label>
                  <input type="number" step="0.1" name="rMultiple" value={formData.rMultiple} onChange={handleChange} className={inputClass} placeholder="e.g. 2.5 or -1.0" />
                </div>
                <div>
                  <label className={labelClass}>Rule Broken?</label>
                  <div className="flex gap-2">
                     <button type="button" onClick={() => setFormData({...formData, ruleBreak: "no"})} className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-colors border ${formData.ruleBreak === "no" ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" : "bg-[#15181D] border-white/10 text-gray-500 hover:text-white"}`}>Followed Plan</button>
                     <button type="button" onClick={() => setFormData({...formData, ruleBreak: "yes"})} className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-colors border ${formData.ruleBreak === "yes" ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-[#15181D] border-white/10 text-gray-500 hover:text-white"}`}>Broke Rule</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PSYCHOLOGY */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
               <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-500/10 rounded-lg"><Brain className="w-5 h-5 text-purple-400" /></div>
                  <h2 className="text-xl font-semibold text-white">Psychology Tracker</h2>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {["emotionBefore", "emotionAfter"].map((field, idx) => (
                    <div key={field}>
                      <label className={labelClass}>{idx === 0 ? "Emotion Before Trade" : "Emotion After Trade"}</label>
                      <div className="relative">
                        <select name={field} value={formData[field]} onChange={handleChange} className={selectClass}>
                          <option value="" className="bg-[#15181D] text-white">Select emotion...</option>
                          {emotions.map(e => <option key={e} value={e} className="bg-[#15181D] text-white">{e}</option>)}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                      </div>
                      {formData[field] === "Other" && <input type="text" name={field} placeholder="Custom emotion" value={customFields[field] || ""} onChange={handleCustomChange} className={`${inputClass} mt-3`} />}
                    </div>
                  ))}
               </div>
               
               <div>
                  <label className={labelClass}>Psychological State / Notes</label>
                  <textarea name="psychNote" placeholder="What were you feeling during execution? Did you hesitate? Did you move your stop loss early?" value={formData.psychNote} onChange={handleChange} className={textareaClass} />
               </div>
            </div>
          )}

          {/* STEP 5: REVIEW */}
          {step === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
               <h2 className="text-xl font-semibold text-white mb-6">Trade Review</h2>
               <div>
                  <label className={labelClass}>Why did I take this trade? (Confluence)</label>
                  <textarea name="reason" placeholder="e.g., 15m order block + structural shift on 1m..." value={formData.reason} onChange={handleChange} className={textareaClass} />
               </div>
               <div>
                  <label className={labelClass}>Lessons & Mistakes</label>
                  <textarea name="lesson" placeholder="What went right? What went wrong? What will I do differently?" value={formData.lesson} onChange={handleChange} className={textareaClass} />
               </div>
            </div>
          )}

          {/* STEP 6: VISUAL EVIDENCE */}
          {step === 6 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
               <h2 className="text-xl font-semibold text-white mb-6">Visual Evidence</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {["Before (Entry Chart)", "After (Exit Chart)"].map((label, idx) => (
                    <label key={idx} className="border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-white/5 hover:border-cyan-500/50 transition-all cursor-pointer group min-h-[200px] bg-[#15181D]">
                      {images[idx] ? (
                        <>
                          <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 border border-emerald-500/20">
                            <CheckCircle className="w-6 h-6 text-emerald-400" />
                          </div>
                          <p className="text-sm font-semibold text-emerald-400 truncate w-full px-4">{images[idx].name}</p>
                          <p className="text-xs text-gray-500 mt-2">Click to replace</p>
                        </>
                      ) : (
                        <>
                          <div className="w-14 h-14 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <UploadCloud className="w-6 h-6 text-cyan-400" />
                          </div>
                          <p className="text-sm font-semibold text-gray-300 mb-1">{label}</p>
                          <p className="text-[11px] text-gray-500 uppercase tracking-widest">Click to upload</p>
                        </>
                      )}
                      <input type="file" accept="image/*" onChange={(e) => handleImageChange(idx, e)} className="hidden" />
                    </label>
                  ))}
               </div>
            </div>
          )}
          
          {/* NAVIGATION FOOTER */}
          <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between">
             <button type="button" onClick={prevStep} disabled={step === 1} className="px-6 py-3 rounded-xl font-semibold text-sm text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-0 transition-all flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
             </button>
             
             {step < 6 ? (
               <button type="button" onClick={nextStep} className="px-8 py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-gray-200 transition-all flex items-center gap-2">
                  Continue <ArrowRight className="w-4 h-4" />
               </button>
             ) : (
               <button type="submit" disabled={isSubmitting} className="px-8 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-sm transition-all shadow-lg shadow-cyan-500/30 flex items-center gap-2 disabled:opacity-50">
                  {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Trade</>}
               </button>
             )}
          </div>

        </form>
      </div>
    </div>
  );
}
