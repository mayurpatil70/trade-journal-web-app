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
} from "lucide-react";

export default function AddTrade() {
  const navigate = useNavigate();
  const location = useLocation(); // CRITICAL FIX: Added useLocation to handle AI Coach redirect
  const [isSubmitting, setIsSubmitting] = useState(false);

  const assets = [
    "XAUUSD",
    "NAS100",
    "GER40",
    "US30",
    "EURUSD",
    "GBPUSD",
    "USDJPY",
    "AUDUSD",
    "USDCAD",
    "EURJPY",
    "BTCUSD",
    "ETHUSD",
    "SILVER",
    "USOIL",
  ];
  const setups = [
    "FVG",
    "SMT",
    "Liquidity Sweep",
    "Order Block",
    "Breakout",
    "Pullback",
    "Other",
  ];
  const emotions = [
    "Calm",
    "Confident",
    "Focused",
    "Neutral",
    "Excited",
    "FOMO",
    "Anxious",
    "Fearful",
    "Revenge",
    "Impatient",
    "Greedy",
    "Tired",
    "Frustrated",
    "Overconfident",
  ];

  // CRITICAL FIX: Safe optional chaining on location.state prevents Black Screen Crash
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    }),
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
      Object.keys(formData).forEach((key) =>
        submitData.append(key, formData[key]),
      );
      images.forEach((img) => {
        if (img) submitData.append("images", img);
      });

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

  const cardClass =
    "w-full bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-5 sm:p-8 md:p-10 shadow-xl mb-8 box-border";
  const inputContainerClass = "flex flex-col gap-2 w-full box-border";
  const labelClass =
    "text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest";
  const inputClass =
    "appearance-none w-full min-h-[52px] bg-gray-50 dark:bg-[#0b131d] border border-gray-300 dark:border-[#1f2c3b] rounded-[2px] px-4 py-3 !text-[#2f8df4] [-webkit-text-fill-color:#2f8df4] font-bold focus:border-[#2f8df4] outline-none text-sm text-center [text-align-last:center]";
  const textareaClass =
    "appearance-none w-full min-h-[100px] bg-gray-50 dark:bg-[#0b131d] border border-gray-300 dark:border-[#1f2c3b] rounded-[2px] px-4 py-3 !text-[#2f8df4] [-webkit-text-fill-color:#2f8df4] font-bold focus:border-[#2f8df4] outline-none text-sm text-left resize-y";
  const optionClass =
    "bg-white !text-[#2f8df4] [-webkit-text-fill-color:#2f8df4] dark:bg-[#0b131d] font-bold text-center";

  return (
    <div
      className="w-full max-w-6xl mx-auto font-sans pb-16 px-4 md:px-8 mt-6 md:mt-8 overflow-visible box-border"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="mb-8 md:mb-12 flex items-center gap-4">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-[2px] bg-[#2f8df4]/10 flex items-center justify-center border border-[#2f8df4]/20 shrink-0">
          <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-[#2f8df4]" />
        </div>
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-1">
            Log New Trade
          </h1>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
            Record your setup, execution, psychology, and lessons.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 md:space-y-10 w-full">
        {/* SECTION 1: Execution Details */}
        <div className={cardClass}>
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-white/5">
            <Target className="w-5 h-5 text-[#2f8df4]" />
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
                <select
                  name="asset"
                  value={formData.asset}
                  onChange={handleChange}
                  className={`${inputClass} pr-10`}
                >
                  {assets.map((a) => (
                    <option key={a} value={a} className={optionClass}>
                      {a}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2f8df4] pointer-events-none" />
              </div>
            </div>
            <div className={inputContainerClass}>
              <label className={labelClass}>Direction</label>
              <div className="relative w-full">
                <select
                  name="direction"
                  value={formData.direction}
                  onChange={handleChange}
                  className={`${inputClass} pr-10`}
                >
                  <option value="LONG" className={optionClass}>
                    LONG
                  </option>
                  <option value="SHORT" className={optionClass}>
                    SHORT
                  </option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2f8df4] pointer-events-none" />
              </div>
            </div>
            <div className={inputContainerClass}>
              <label className={labelClass}>Session</label>
              <div className="relative w-full">
                <select
                  name="session"
                  value={formData.session}
                  onChange={handleChange}
                  className={`${inputClass} pr-10`}
                >
                  <option value="London" className={optionClass}>
                    London
                  </option>
                  <option value="New York" className={optionClass}>
                    New York
                  </option>
                  <option value="Asian" className={optionClass}>
                    Asian
                  </option>
                  <option value="Other" className={optionClass}>
                    Other
                  </option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2f8df4] pointer-events-none" />
              </div>
            </div>
            <div className={inputContainerClass}>
              <label className={labelClass}>Setup Type</label>
              <div className="relative w-full">
                <select
                  name="setup"
                  value={formData.setup}
                  onChange={handleChange}
                  className={`${inputClass} pr-10`}
                >
                  {setups.map((s) => (
                    <option key={s} value={s} className={optionClass}>
                      {s}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2f8df4] pointer-events-none" />
              </div>
            </div>
            <div className={inputContainerClass}>
              <label className={labelClass}>Entry Price</label>
              <input
                type="number"
                step="any"
                name="entry"
                placeholder="0.0000"
                value={formData.entry}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div className={inputContainerClass}>
              <label className={labelClass}>Stop Loss</label>
              <input
                type="number"
                step="any"
                name="sl"
                placeholder="0.0000"
                value={formData.sl}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div className={inputContainerClass}>
              <label className={labelClass}>Take Profit</label>
              <input
                type="number"
                step="any"
                name="tp"
                placeholder="0.0000"
                value={formData.tp}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div className={inputContainerClass}>
              <label className={labelClass}>Risk %</label>
              <input
                type="number"
                step="0.1"
                name="risk"
                placeholder="0.5"
                value={formData.risk}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div className={inputContainerClass}>
              <label className={labelClass}>Trade Result</label>
              <div className="relative w-full">
                <select
                  name="result"
                  value={formData.result}
                  onChange={handleChange}
                  className={`${inputClass} pr-10`}
                >
                  <option value="win" className={optionClass}>
                    WIN
                  </option>
                  <option value="loss" className={optionClass}>
                    LOSS
                  </option>
                  <option value="be" className={optionClass}>
                    BREAK-EVEN
                  </option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2f8df4] pointer-events-none" />
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
              ></textarea>
            </div>
            <div className={`lg:col-span-3 ${inputContainerClass}`}>
              <label className={labelClass}>Lesson / Mistake</label>
              <textarea
                name="lesson"
                placeholder="What will I do better next time?"
                value={formData.lesson}
                onChange={handleChange}
                className={textareaClass}
              ></textarea>
            </div>
          </div>
        </div>

        {/* SECTION 2: Psychology */}
        <div className={cardClass}>
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-white/5">
            <Brain className="w-5 h-5 text-[#f472b6]" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Psychology Tracker
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className={inputContainerClass}>
              <label className={labelClass}>Emotion Before Trade</label>
              <div className="relative w-full">
                <select
                  name="emotionBefore"
                  value={formData.emotionBefore}
                  onChange={handleChange}
                  className={`${inputClass} pr-10`}
                >
                  <option value="" className={optionClass}>
                    Select emotion...
                  </option>
                  {emotions.map((e) => (
                    <option key={e} value={e} className={optionClass}>
                      {e}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2f8df4] pointer-events-none" />
              </div>
            </div>
            <div className={inputContainerClass}>
              <label className={labelClass}>Emotion After Trade</label>
              <div className="relative w-full">
                <select
                  name="emotionAfter"
                  value={formData.emotionAfter}
                  onChange={handleChange}
                  className={`${inputClass} pr-10`}
                >
                  <option value="" className={optionClass}>
                    Select emotion...
                  </option>
                  {emotions.map((e) => (
                    <option key={e} value={e} className={optionClass}>
                      {e}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2f8df4] pointer-events-none" />
              </div>
            </div>
          </div>
          <div className={inputContainerClass}>
            <label className={labelClass}>Psychology Note</label>
            <textarea
              name="psychNote"
              placeholder="What was going through my mind during the trade?"
              value={formData.psychNote}
              onChange={handleChange}
              className={textareaClass}
            ></textarea>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-white/5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <label className={labelClass}>
              Did you break any trading rules?
            </label>
            <div className="relative w-full sm:w-auto">
              <select
                name="ruleBreak"
                value={formData.ruleBreak}
                onChange={handleChange}
                className={`${inputClass} sm:min-w-[150px] pr-10`}
              >
                <option value="no" className={optionClass}>
                  No
                </option>
                <option value="yes" className={optionClass}>
                  Yes
                </option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2f8df4] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* SECTION 3: Chart Uploads */}
        <div className={cardClass}>
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-white/5">
            <ImageIcon className="w-5 h-5 text-[#21d4a3]" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Chart Screenshots
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {imageLabels.map((label, idx) => (
              <label
                key={idx}
                className="border-2 border-dashed border-gray-300 dark:border-[#1f2c3b] rounded-[2px] p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-all cursor-pointer group min-h-[140px]"
              >
                {images[idx] ? (
                  <>
                    <CheckCircle className="w-8 h-8 text-[#21d4a3] mb-3" />
                    <p className="text-xs font-bold text-[#21d4a3] truncate w-full px-2">
                      {images[idx].name}
                    </p>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8 text-[#2f8df4] opacity-70 group-hover:opacity-100 transition-opacity mb-3" />
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
            className="w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-[#121418] border border-[#2f8df4]/30 text-[#2f8df4] font-bold rounded-[2px] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" /> Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-10 py-3.5 bg-[#2f8df4] hover:bg-[#2376e8] text-white font-bold rounded-[2px] shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
