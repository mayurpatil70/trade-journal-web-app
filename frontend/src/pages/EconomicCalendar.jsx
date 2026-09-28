// frontend/src/pages/EconomicCalendar.jsx
import { useEffect, useState } from "react";
import api from "../api/axios";
import {
  Loader2,
  AlertTriangle,
  Folder,
  BarChart2,
  Sparkles,
  X,
} from "lucide-react";

export default function EconomicCalendar() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // AI Modal State
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState("");
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await api.get("/api/news");
        setNews(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error("News fetch error:", err);
        setError("Failed to load economic calendar.");
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const getImpactColor = (impact) => {
    const imp = impact?.toLowerCase() || "";
    if (imp.includes("high")) return "#FF0B0B";
    if (imp.includes("medium")) return "#FF9800";
    if (imp.includes("low")) return "#FFD700";
    return "#808080";
  };

  const formatFFDate = (dateString) => {
    if (!dateString) return { dayOfWeek: "", fullDate: "" };
    const date = new Date(dateString);
    if (isNaN(date)) return { dayOfWeek: "", fullDate: dateString };
    const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "short" });
    const fullDate = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return { dayOfWeek, fullDate };
  };

  // --- NEW: Real API call to Gemini ---
  const handleOpenAiInsight = async (event) => {
    setSelectedEvent(event);
    setIsAiLoading(true);
    setAiInsight("");
    setAiError("");

    try {
      const response = await api.post("/api/ai/news-insight", { event });
      setAiInsight(response.data.insight);
    } catch (err) {
      console.error("AI Fetch Error:", err);
      setAiError("Failed to generate insight. Please try again.");
    } finally {
      setIsAiLoading(false);
    }
  };

  let lastDate = null;
  let lastTime = null;

  return (
    <div
      className="w-full max-w-7xl mx-auto font-sans"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4 border-b border-[#2a2e39] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1 flex items-center gap-2">
            Calendar{" "}
            <span className="text-[10px] bg-[#6366f1]/20 text-[#6366f1] px-2 py-0.5 rounded uppercase tracking-widest border border-[#6366f1]/30">
              Live
            </span>
          </h1>
          <p className="text-xs text-gray-400">
            Powered by Forex Factory & Gemini AI
          </p>
        </div>

        <div className="flex gap-4 text-[11px] font-semibold text-gray-300 bg-[#161922] px-4 py-2 rounded-lg border border-[#2a2e39]">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-[#FF0B0B]"></div> High
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-[#FF9800]"></div> Medium
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-[#FFD700]"></div> Low
          </div>
        </div>
      </div>

      <div className="bg-[#0f1115] border border-[#2a2e39] rounded-xl shadow-2xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-80">
            <Loader2 className="w-8 h-8 text-[#6366f1] animate-spin mb-4" />
            <p className="text-gray-400 text-sm font-medium">
              Syncing live market data...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-80 text-red-400">
            <AlertTriangle className="w-8 h-8 mb-4 opacity-80" />
            <p className="font-medium">{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-[#1a1d24] text-[11px] uppercase tracking-wider text-gray-400 font-bold border-b border-[#2a2e39]">
                  <th className="py-3 px-3 w-[110px]">Date</th>
                  <th className="py-3 px-3 w-[90px]">Time</th>
                  <th className="py-3 px-3 w-[50px]">Cur</th>
                  <th className="py-3 px-3 w-[50px]">Imp</th>
                  <th className="py-3 px-3">Event</th>
                  <th className="py-3 px-3 w-[70px] text-center">AI</th>
                  <th className="py-3 px-3 w-[90px] text-right">Actual</th>
                  <th className="py-3 px-3 w-[90px] text-right">Forecast</th>
                  <th className="py-3 px-3 w-[90px] text-right">Previous</th>
                  <th className="py-3 px-3 w-[50px] text-center">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e222b]">
                {news.map((item, index) => {
                  const { dayOfWeek, fullDate } = formatFFDate(item.date);
                  const isNewDate = fullDate !== lastDate;
                  const isNewTime = item.time !== lastTime || isNewDate;

                  lastDate = fullDate;
                  lastTime = item.time;

                  return (
                    <tr
                      key={index}
                      className="text-[13px] hover:bg-[#1a1d24] transition-colors group odd:bg-[#0f1115] even:bg-[#13151a]"
                    >
                      <td className="py-1.5 px-3 whitespace-nowrap">
                        {isNewDate && (
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-gray-300">
                              {dayOfWeek}
                            </span>
                            <span className="text-gray-500 font-medium">
                              {fullDate}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-1.5 px-3 text-gray-400 font-medium whitespace-nowrap">
                        {isNewTime ? item.time || "All Day" : ""}
                      </td>
                      <td className="py-1.5 px-3 font-bold text-gray-200">
                        {item.country}
                      </td>
                      <td className="py-1.5 px-3">
                        <div
                          className="w-3.5 h-3.5 rounded-sm mx-auto shadow-sm"
                          style={{
                            backgroundColor: getImpactColor(item.impact),
                          }}
                        ></div>
                      </td>
                      <td className="py-1.5 px-3 text-gray-200 font-medium truncate max-w-[300px]">
                        {item.title}
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        <button
                          onClick={() => handleOpenAiInsight(item)}
                          className="p-1.5 bg-[#6366f1]/10 text-[#6366f1] hover:bg-[#6366f1] hover:text-white rounded-md transition-all group-hover:scale-110 flex items-center justify-center mx-auto shadow-sm"
                          title="Generate AI Insight"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                      </td>
                      <td
                        className={`py-1.5 px-3 text-right font-bold ${
                          item.actual && item.actual !== item.forecast
                            ? parseFloat(item.actual) >
                              parseFloat(item.forecast)
                              ? "text-emerald-500"
                              : "text-red-500"
                            : "text-gray-300"
                        }`}
                      >
                        {item.actual || ""}
                      </td>
                      <td className="py-1.5 px-3 text-right text-gray-400 font-medium">
                        {item.forecast || ""}
                      </td>
                      <td className="py-1.5 px-3 text-right text-gray-500 font-medium">
                        {item.previous || ""}
                      </td>
                      <td className="py-1.5 px-3">
                        <div className="flex items-center justify-center gap-2">
                          <Folder className="w-3.5 h-3.5 text-gray-600 hover:text-gray-300 cursor-pointer transition-colors" />
                          <BarChart2 className="w-3.5 h-3.5 text-gray-600 hover:text-gray-300 cursor-pointer transition-colors" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* AI Insight Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedEvent(null)}
          ></div>

          <div className="relative w-full max-w-lg bg-[#121418] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-white/5 flex items-start justify-between bg-gradient-to-r from-[#121418] to-[#1a1d24]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider"
                    style={{
                      backgroundColor: getImpactColor(selectedEvent.impact),
                    }}
                  >
                    {selectedEvent.country}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">
                    {selectedEvent.time}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white">
                  {selectedEvent.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 min-h-[200px]">
              {isAiLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#6366f1] blur-xl opacity-20 rounded-full animate-pulse"></div>
                    <Sparkles className="w-10 h-10 text-[#6366f1] animate-bounce relative z-10" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      Analyzing Market Impact...
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Gemini is evaluating historical trends and directional
                      bias.
                    </p>
                  </div>
                </div>
              ) : aiError ? (
                <div className="text-center py-8">
                  <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                  <p className="text-red-400 font-medium">{aiError}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-[#1a1d24] border border-white/5 rounded-xl p-5 shadow-inner">
                    <h3 className="text-xs font-bold text-[#6366f1] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5" /> Gemini Analysis
                    </h3>
                    <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
                      {aiInsight}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-[#0f1115] border border-white/5 rounded-lg p-3 text-center">
                      <span className="block text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">
                        Previous
                      </span>
                      <span className="text-sm font-bold text-gray-400">
                        {selectedEvent.previous || "--"}
                      </span>
                    </div>
                    <div className="bg-[#0f1115] border border-white/5 rounded-lg p-3 text-center">
                      <span className="block text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">
                        Forecast
                      </span>
                      <span className="text-sm font-bold text-gray-400">
                        {selectedEvent.forecast || "--"}
                      </span>
                    </div>
                    <div className="bg-[#0f1115] border border-[#6366f1]/30 rounded-lg p-3 text-center shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                      <span className="block text-[10px] text-[#6366f1] uppercase font-bold tracking-wider mb-1">
                        Actual
                      </span>
                      <span className="text-sm font-bold text-white">
                        {selectedEvent.actual || "PENDING"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
