// frontend/src/pages/AddTrade.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import {
  Save,
  X,
  Brain,
  Image as ImageIcon,
  Target,
  TrendingUp,
  Calendar,
  Clock,
  Loader2,
  CheckCircle,
} from "lucide-react";

export default function AddTrade() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const assets = [
    "XAUUSD",
    "BTCUSD",
    "ETHUSD",
    "US30",
    "EURUSD",
    "GBPUSD",
    "USDJPY",
    "AUDUSD",
    "USDCAD",
    "EURJPY",
    "NAS100",
    "GER40",
    "SILVER",
    "USOIL",
  ];
  const setups = [
    "FVG",
    "SMC",
    "ICT",
    "Liquidity Sweep",
    "Order Block",
    "Breakout",
    "Pullback",
    "Trend Continuation",
    "Reversal",
    "buy-side Liquidity",
    "sell-side Liquidity",
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

  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    }),
    asset: "XAUUSD",
    direction: "",
    session: "",
    setup: "",
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

  const [images, setImages] = useState([null, null, null]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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

    const userId = localStorage.getItem("userId");
    if (!userId) {
      alert("Session expired. Please log in again.");
      setIsSubmitting(false);
      return navigate("/login");
    }

    try {
      const submitData = new FormData();
      submitData.append("userId", userId);

      Object.keys(formData).forEach((key) => {
        submitData.append(key, formData[key]);
      });

      images.forEach((img) => {
        if (img) submitData.append("images", img);
      });

      await api.post("/api/trades", submitData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Trade Saved Successfully!");
      navigate("/trades");
    } catch (error) {
      console.error("Upload Error:", error);
      alert("Failed to save trade. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Highly specific classes implementing 2px radius, large padding, and Light/Dark mode compatibility
  const cardClass =
    "bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-8 md:p-10 shadow-xl mb-10";
  const inputContainerClass = "flex flex-col gap-2";
  const labelClass =
    "text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest";
  const inputClass =
    "w-full bg-gray-50 dark:bg-[#1a1d24] border border-gray-300 dark:border-gray-700 rounded-[2px] px-5 py-4 text-gray-900 dark:text-white focus:border-[#2f8df4] dark:focus:border-[#2f8df4] focus:ring-1 focus:ring-[#2f8df4] outline-none transition-all placeholder-gray-400 dark:placeholder-gray-600 text-sm shadow-sm";
  const headerIconClass =
    "w-12 h-12 rounded-[2px] bg-[#2f8df4]/10 flex items-center justify-center border border-[#2f8df4]/20 shrink-0";
  const imageLabels = ["Before Entry", "Entry", "Exit"];

  return (
    <div
      className="w-full max-w-6xl mx-auto font-sans pb-16 px-4 md:px-8 mt-8"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Page Header */}
      <div className="mb-12 flex items-center gap-4">
        <div className={headerIconClass}>
          <TrendingUp className="w-6 h-6 text-[#2f8df4]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
            Log New Trade
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Record your setup, execution, psychology, and lessons in detail.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* SECTION 1: Execution Details */}
        <div className={cardClass}>
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-200 dark:border-white/5">
            <Target className="w-6 h-6 text-[#2f8df4]" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Execution Details
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className={inputContainerClass}>
              <label className={labelClass}>Trade Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className={`${inputClass} pl-11`}
                  required
                />
              </div>
            </div>

            <div className={inputContainerClass}>
              <label className={labelClass}>Trade Time</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className={`${inputClass} pl-11`}
                  required
                />
              </div>
            </div>

            <div className={inputContainerClass}>
              <label className={labelClass}>Asset / Pair</label>
              <select
                name="asset"
                value={formData.asset}
                onChange={handleChange}
                className={inputClass}
              >
                {assets.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div className={inputContainerClass}>
              <label className={labelClass}>Direction</label>
              <select
                name="direction"
                value={formData.direction}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="LONG">LONG</option>
                <option value="SHORT">SHORT</option>
              </select>
            </div>

            <div className={inputContainerClass}>
              <label className={labelClass}>Session</label>
              <select
                name="session"
                value={formData.session}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="London">London</option>
                <option value="New York">New York</option>
                <option value="Asian">Asian</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className={inputContainerClass}>
              <label className={labelClass}>Setup Type</label>
              <select
                name="setup"
                value={formData.setup}
                onChange={handleChange}
                className={inputClass}
              >
                {setups.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
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
              <select
                name="result"
                value={formData.result}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="win">WIN</option>
                <option value="loss">LOSS</option>
                <option value="be">BREAK-EVEN</option>
                <option value="ctc">CTC</option>
                <option value="trail">Trail-sl-CTC</option>
              </select>
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
                rows="4"
                placeholder="Why did I take this trade?"
                value={formData.reason}
                onChange={handleChange}
                className={inputClass}
              ></textarea>
            </div>

            <div className={`lg:col-span-3 ${inputContainerClass}`}>
              <label className={labelClass}>Lesson / Mistake</label>
              <textarea
                name="lesson"
                rows="3"
                placeholder="What will I do better next time?"
                value={formData.lesson}
                onChange={handleChange}
                className={inputClass}
              ></textarea>
            </div>
          </div>
        </div>

        {/* SECTION 2: Psychology */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200 dark:border-white/5">
            <div className="flex items-center gap-3">
              <Brain className="w-6 h-6 text-[#f472b6]" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Psychology Tracker
              </h2>
            </div>
            <span className="text-[10px] bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 px-3 py-1.5 rounded-[2px] font-bold tracking-widest uppercase border border-gray-200 dark:border-white/5">
              Crucial
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className={inputContainerClass}>
              <label className={labelClass}>Emotion Before Trade</label>
              <select
                name="emotionBefore"
                value={formData.emotionBefore}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select emotion...</option>
                {emotions.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
            <div className={inputContainerClass}>
              <label className={labelClass}>Emotion After Trade</label>
              <select
                name="emotionAfter"
                value={formData.emotionAfter}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select emotion...</option>
                {emotions.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={inputContainerClass}>
            <label className={labelClass}>Psychology Note</label>
            <textarea
              name="psychNote"
              rows="3"
              placeholder="What was going through my mind during the trade?"
              value={formData.psychNote}
              onChange={handleChange}
              className={inputClass}
            ></textarea>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <label className={labelClass}>
              Did you break any trading rules?
            </label>
            <select
              name="ruleBreak"
              value={formData.ruleBreak}
              onChange={handleChange}
              className="bg-gray-50 dark:bg-[#1a1d24] border border-gray-300 dark:border-gray-700 rounded-[2px] px-5 py-3 text-gray-900 dark:text-white text-sm outline-none shadow-sm min-w-[150px]"
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
        </div>

        {/* SECTION 3: Chart Uploads */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200 dark:border-white/5">
            <div className="flex items-center gap-3">
              <ImageIcon className="w-6 h-6 text-[#21d4a3]" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Chart Screenshots
              </h2>
            </div>
            <span className="text-[10px] bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 px-3 py-1.5 rounded-[2px] font-bold tracking-widest uppercase border border-gray-200 dark:border-white/5">
              Optional
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {imageLabels.map((label, idx) => (
              <label
                key={idx}
                className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-[2px] p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-white/[0.02] hover:border-gray-400 dark:hover:border-white/20 transition-all cursor-pointer group min-h-[160px]"
              >
                {images[idx] ? (
                  <>
                    <CheckCircle className="w-10 h-10 text-[#21d4a3] mb-4" />
                    <p className="text-sm font-bold text-[#21d4a3] truncate w-full px-4">
                      {images[idx].name}
                    </p>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-10 h-10 text-gray-400 dark:text-gray-600 group-hover:text-[#21d4a3] transition-colors mb-4" />
                    <p className="text-base font-bold text-gray-700 dark:text-gray-300 mb-1">
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
        <div className="flex flex-col sm:flex-row items-center justify-end gap-5 pt-6">
          <button
            type="button"
            onClick={() => navigate("/trades")}
            className="w-full sm:w-auto px-8 py-4 rounded-[2px] font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-2 border border-transparent dark:border-transparent"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" /> Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-10 py-4 rounded-[2px] font-bold text-white bg-[#2f8df4] hover:bg-[#2376e8] shadow-lg hover:shadow-[0_0_20px_rgba(47,141,244,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Uploading Data...
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
