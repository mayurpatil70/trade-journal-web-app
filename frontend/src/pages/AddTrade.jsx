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

  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    }),
    asset: "XAUUSD",
    direction: "LONG",
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

      // Append all text data
      Object.keys(formData).forEach((key) => {
        submitData.append(key, formData[key]);
      });

      // Append images
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

  const inputClass =
    "w-full bg-[#1a1d24] border border-white/5 rounded-xl px-4 py-3 text-white focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] outline-none transition-all placeholder-gray-600 text-sm";
  const labelClass =
    "block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1";
  const imageLabels = ["Before Entry", "Entry", "Exit"];

  return (
    <div
      className="w-full max-w-6xl mx-auto font-sans pb-12"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2f8df4]/10 flex items-center justify-center border border-[#2f8df4]/20">
            <TrendingUp className="w-5 h-5 text-[#2f8df4]" />
          </div>
          Log New Trade
        </h1>
        <p className="text-sm text-gray-500 mt-2 ml-14">
          Record your setup, execution, psychology, and lessons.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Execution Details */}
        <div className="bg-[#121418] border border-white/5 rounded-2xl p-6 md:p-8 shadow-xl">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5">
            <Target className="w-5 h-5 text-[#6366f1]" />
            <h2 className="text-lg font-bold text-white">Execution Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className={labelClass}>Trade Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className={`${inputClass} pl-10`}
                  required
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Trade Time</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className={`${inputClass} pl-10`}
                  required
                />
              </div>
            </div>
            <div>
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

            <div>
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
            <div>
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
            <div>
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

            <div>
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
            <div>
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
            <div>
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

            <div>
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
            <div>
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
              </select>
            </div>
            <div>
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

            <div className="lg:col-span-3">
              <label className={labelClass}>Trade Reason / Analysis</label>
              <textarea
                name="reason"
                rows="3"
                placeholder="Why did I take this trade?"
                value={formData.reason}
                onChange={handleChange}
                className={inputClass}
              ></textarea>
            </div>
            <div className="lg:col-span-3">
              <label className={labelClass}>Lesson / Mistake</label>
              <textarea
                name="lesson"
                rows="2"
                placeholder="What will I do better next time?"
                value={formData.lesson}
                onChange={handleChange}
                className={inputClass}
              ></textarea>
            </div>
          </div>
        </div>

        {/* SECTION 2: Psychology */}
        <div className="bg-[#121418] border border-white/5 rounded-2xl p-6 md:p-8 shadow-xl bg-gradient-to-br from-[#121418] to-[#161922]">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-[#f472b6]" />
              <h2 className="text-lg font-bold text-white">
                Psychology Tracker
              </h2>
            </div>
            <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-1 rounded font-bold tracking-widest uppercase">
              Crucial
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
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
            <div>
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
          <div>
            <label className={labelClass}>Psychology Note</label>
            <textarea
              name="psychNote"
              rows="2"
              placeholder="What was going through my mind during the trade?"
              value={formData.psychNote}
              onChange={handleChange}
              className={inputClass}
            ></textarea>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <label className={labelClass + " !mb-0"}>
              Did you break any trading rules?
            </label>
            <select
              name="ruleBreak"
              value={formData.ruleBreak}
              onChange={handleChange}
              className="bg-[#1a1d24] border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm outline-none"
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
        </div>

        {/* SECTION 3: Chart Uploads */}
        <div className="bg-[#121418] border border-white/5 rounded-2xl p-6 md:p-8 shadow-xl">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#21d4a3]" />
              <h2 className="text-lg font-bold text-white">
                Chart Screenshots
              </h2>
            </div>
            <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-1 rounded font-bold tracking-widest uppercase">
              Optional
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {imageLabels.map((label, idx) => (
              <label
                key={idx}
                className="border-2 border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-white/[0.02] hover:border-white/20 transition-colors cursor-pointer group h-32"
              >
                {images[idx] ? (
                  <>
                    <CheckCircle className="w-8 h-8 text-[#21d4a3] mb-3" />
                    <p className="text-xs font-bold text-[#21d4a3] truncate w-full px-4">
                      {images[idx].name}
                    </p>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8 text-gray-600 group-hover:text-[#21d4a3] transition-colors mb-3" />
                    <p className="text-sm font-bold text-gray-300">{label}</p>
                    <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">
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
        <div className="flex items-center justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate("/trades")}
            className="px-6 py-3.5 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
            disabled={isSubmitting}
          >
            <X className="w-4 h-4" /> Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-[#2f8df4] to-[#6d54ff] hover:shadow-[0_0_20px_rgba(47,141,244,0.4)] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Trade
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
