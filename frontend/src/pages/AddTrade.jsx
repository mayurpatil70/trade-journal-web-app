// frontend/src/pages/AddTrade.jsx
import { useState } from "react";
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
  Sparkles,
} from "lucide-react";

export default function AddTrade() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const assets = [
    "XAUUSD", "NAS100", "GER40", "US30", "EURUSD", "GBPUSD",
    "USDJPY", "AUDUSD", "USDCAD", "EURJPY", "BTCUSD", "ETHUSD",
    "SILVER", "USOIL",
  ];
  const setups = ["FVG", "SMT", "Liquidity Sweep", "Order Block", "Breakout", "Pullback", "Other"];
  const emotions = [
    "Calm", "Confident", "Focused", "Neutral", "Excited",
    "FOMO", "Anxious", "Fearful", "Revenge", "Impatient",
    "Greedy", "Tired", "Frustrated", "Overconfident",
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
    risk: "0.5",
    result: "win",
    rMultiple: "",
    ruleBreak: "no",
    reason: "",
    lesson: "",
    emotionBefore: "",
    emotionAfter: "",
    psychNote: "",
  });

  const [images, setImages] = useState([null, null]);
  const imageLabels = ["Before (Entry Chart)", "After (Exit Chart)"];

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

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

    const userId =
      localStorage.getItem("userId") || localStorage.getItem("userEmail");
    if (!userId) {
      alert("Session expired. Please log in again.");
      setIsSubmitting(false);
      return navigate("/login");
    }

    try {
      const submitData = new FormData();
      submitData.append("userId", userId);
      Object.keys(formData).forEach((key) => submitData.append(key, formData[key]));
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

  const inputClass =
    "appearance-none w-full min-h-[52px] bg-white/40 dark:bg-white/[0.04] border border-gray-300/80 dark:border-white/10 rounded-xl px-4 py-3 text-blue-600 dark:text-blue-400 font-bold focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm text-center [text-align-last:center] backdrop-blur-sm transition-all";
  const textareaClass =
    "appearance-none w-full min-h-[100px] bg-white/40 dark:bg-white/[0.04] border border-gray-300/80 dark:border-white/10 rounded-xl px-4 py-3 text-blue-600 dark:text-blue-400 font-bold focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm text-left resize-y backdrop-blur-sm transition-all";
  const optionClass = "bg-white dark:bg-[#0b131d] text-blue-600 dark:!text-blue-400 font-bold text-center";
  const labelClass = "text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest";
  const inputContainerClass = "flex flex-col gap-2 w-full box-border";

  const cardClass =
    "w-full bg-white/60 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 rounded-2xl p-5 sm:p-8 shadow-xl backdrop-blur-xl mb-6 box-border";

  return (
    <div
      className="w-full max-w-6xl mx-auto font-sans pb-16 px-4 md:px-8 mt-6 md:mt-8 overflow-visible box-border"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header */}
      <div className="mb-8 md:mb-10 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/10">
          <TrendingUp className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              Log New Trade
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 border border-blue-500/30">
              Journal
            </span>
          </div>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
            Record your setup, execution, psychology, and lessons.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 w-full">
        {/* SECTION 1: Execution Details */}
        <div className={cardClass}>
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200/80 dark:border-white/10">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center">
              <Target className="w-4 h-4 text-blue-400" />
            </div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
              Execution Details
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            <div className={inputContainerClass}>
              <label className={labelClass}>Trade Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className={`${inputClass} dark:[color-scheme:dark]`}
                required
              />
            </div>
            <div className={inputContainerClass}>
              <label className={labelClass}>Trade Time</label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                className={`${inputClass} dark:[color-scheme:dark]`}
                required
              />
            </div>
            <div className={inputContainerClass}>
              <label className={labelClass}>Asset / Pair</label>
              <div className="relative w-full">
                <select name="asset" value={formData.asset} onChange={handleChange} className={`${inputClass} pr-10`}>
                  {assets.map((a) => (<option key={a} value={a} className={optionClass}>{a}</option>))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
              </div>
            </div>
            <div className={inputContainerClass}>
              <label className={labelClass}>Direction</label>
              <div className="relative w-full">
                <select name="direction" value={formData.direction} onChange={handleChange} className={`${inputClass} pr-10`}>
                  <option value="LONG" className={optionClass}>LONG ▲</option>
                  <option value="SHORT" className={optionClass}>SHORT ▼</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
              </div>
            </div>
            <div className={inputContainerClass}>
              <label className={labelClass}>Session</label>
              <div className="relative w-full">
                <select name="session" value={formData.session} onChange={handleChange} className={`${inputClass} pr-10`}>
                  {["London", "New York", "Asian", "Other"].map(s => (
                    <option key={s} value={s} className={optionClass}>{s}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
              </div>
            </div>
            <div className={inputContainerClass}>
              <label className={labelClass}>Setup Type</label>
              <div className="relative w-full">
                <select name="setup" value={formData.setup} onChange={handleChange} className={`${inputClass} pr-10`}>
                  {setups.map((s) => (<option key={s} value={s} className={optionClass}>{s}</option>))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
              </div>
            </div>
            {[
              { label: "Entry Price", name: "entry", placeholder: "0.0000" },
              { label: "Stop Loss", name: "sl", placeholder: "0.0000" },
              { label: "Take Profit", name: "tp", placeholder: "0.0000" },
              { label: "Risk %", name: "risk", placeholder: "0.5" },
            ].map((field) => (
              <div key={field.name} className={inputContainerClass}>
                <label className={labelClass}>{field.label}</label>
                <input
                  type="number"
                  step="any"
                  name={field.name}
                  placeholder={field.placeholder}
                  value={formData[field.name]}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            ))}
            <div className={inputContainerClass}>
              <label className={labelClass}>Trade Result</label>
              <div className="relative w-full">
                <select name="result" value={formData.result} onChange={handleChange} className={`${inputClass} pr-10`}>
                  <option value="win" className={optionClass}>WIN ✓</option>
                  <option value="loss" className={optionClass}>LOSS ✗</option>
                  <option value="be" className={optionClass}>BREAK-EVEN</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
              </div>
            </div>
            <div className={inputContainerClass}>
              <label className={labelClass}>Net R Multiple</label>
              <input
                type="number"
                step="0.1"
                name="rMultiple"
                placeholder="e.g. 2.5"
                value={formData.rMultiple}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div className={`lg:col-span-3 ${inputContainerClass}`}>
              <label className={labelClass}>Trade Reason / Analysis</label>
              <textarea
                name="reason"
                placeholder="Why did I take this trade?"
                value={formData.reason}
                onChange={handleChange}
                className={textareaClass}
              />
            </div>
            <div className={`lg:col-span-3 ${inputContainerClass}`}>
              <label className={labelClass}>Lesson / Mistake</label>
              <textarea
                name="lesson"
                placeholder="What will I do better next time?"
                value={formData.lesson}
                onChange={handleChange}
                className={textareaClass}
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Psychology */}
        <div className={cardClass.replace("from-blue-500/20 to-cyan-500/20", "from-pink-500/20 to-purple-500/20")}>
          <div className="w-full bg-white/60 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 rounded-2xl p-5 sm:p-8 shadow-xl backdrop-blur-xl box-border">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200/80 dark:border-white/10">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/20 flex items-center justify-center">
                <Brain className="w-4 h-4 text-pink-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Psychology Tracker
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {["emotionBefore", "emotionAfter"].map((field, idx) => (
                <div key={field} className={inputContainerClass}>
                  <label className={labelClass}>{idx === 0 ? "Emotion Before Trade" : "Emotion After Trade"}</label>
                  <div className="relative w-full">
                    <select name={field} value={formData[field]} onChange={handleChange} className={`${inputClass} pr-10`}>
                      <option value="" className={optionClass}>Select emotion...</option>
                      {emotions.map((e) => (<option key={e} value={e} className={optionClass}>{e}</option>))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
                  </div>
                </div>
              ))}
            </div>
            <div className={inputContainerClass}>
              <label className={labelClass}>Psychology Note</label>
              <textarea
                name="psychNote"
                placeholder="What was going through my mind during the trade?"
                value={formData.psychNote}
                onChange={handleChange}
                className={textareaClass}
              />
            </div>
            <div className="mt-8 pt-6 border-t border-gray-200/80 dark:border-white/10 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <label className={labelClass}>Did you break any trading rules?</label>
              <div className="relative w-full sm:w-auto">
                <select name="ruleBreak" value={formData.ruleBreak} onChange={handleChange} className={`${inputClass} sm:min-w-[150px] pr-10`}>
                  <option value="no" className={optionClass}>No ✓</option>
                  <option value="yes" className={optionClass}>Yes ✗</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Chart Uploads */}
        <div className="w-full bg-white/60 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 rounded-2xl p-5 sm:p-8 shadow-xl backdrop-blur-xl mb-6 box-border">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200/80 dark:border-white/10">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Chart Screenshots
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {imageLabels.map((label, idx) => (
              <label
                key={idx}
                className="border-2 border-dashed border-gray-300/80 dark:border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-emerald-500/5 hover:border-emerald-400/50 transition-all cursor-pointer group min-h-[140px] backdrop-blur-sm"
              >
                {images[idx] ? (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
                      <CheckCircle className="w-6 h-6 text-emerald-400" />
                    </div>
                    <p className="text-xs font-bold text-emerald-400 truncate w-full px-2">
                      {images[idx].name}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <ImageIcon className="w-6 h-6 text-blue-400" />
                    </div>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                      {label}
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                      Click to upload
                    </p>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(idx, e)}
                  className="hidden"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate("/trades")}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3.5 bg-white/60 dark:bg-white/[0.04] border border-gray-300/80 dark:border-white/10 text-gray-700 dark:text-gray-300 font-bold rounded-2xl hover:bg-white dark:hover:bg-white/10 transition-all flex items-center justify-center gap-2 backdrop-blur-sm"
          >
            <X className="w-5 h-5" /> Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-10 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Uploading...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" /> Save Trade
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
