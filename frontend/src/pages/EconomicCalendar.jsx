// frontend/src/pages/EconomicCalendar.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import {
  Loader2,
  AlertTriangle,
  Sparkles,
  X,
  ArrowLeft,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";

export default function EconomicCalendar() {
  const navigate = useNavigate();
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

  // Requested Strict Impact Colors
  const getImpactStyle = (impact) => {
    const imp = impact?.toLowerCase() || "";
    if (imp.includes("high"))
      return { bg: "bg-red-500", text: "text-red-500", hex: "#EF4444" };
    if (imp.includes("medium"))
      return { bg: "bg-yellow-500", text: "text-yellow-500", hex: "#EAB308" };
    if (imp.includes("low"))
      return { bg: "bg-emerald-500", text: "text-emerald-500", hex: "#22C55E" };
    return { bg: "bg-gray-500", text: "text-gray-500", hex: "#6B7280" };
  };

  // Group events by Date string
  const groupedNews = news.reduce((groups, item) => {
    const date = new Date(item.date);
    const dateString = isNaN(date)
      ? item.date
      : date.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        });

    if (!groups[dateString]) groups[dateString] = [];
    groups[dateString].push(item);
    return groups;
  }, {});

  // Get upcoming high/medium events for the sidebar
  const marketMovers = news
    .filter(
      (item) =>
        item.impact?.toLowerCase().includes("high") ||
        item.impact?.toLowerCase().includes("medium"),
    )
    .slice(0, 5);

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

  return (
    <div
      className="w-full font-sans pb-10"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Top Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <CalendarIcon className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Economic Calendar
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Track market-moving events and plan your trades
            </p>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <button className="text-[11px] font-bold text-gray-300 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg border border-white/5 transition-colors">
            Today
          </button>
          <div className="flex items-center gap-2 text-gray-500">
            <button className="hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button className="hover:text-white transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <span className="text-sm font-bold text-white tracking-wide">
            Sep - Oct 2026
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#121418] rounded-lg p-1 border border-white/5">
            <button className="text-[10px] font-bold text-gray-500 px-4 py-1.5 rounded-md hover:text-gray-300 transition-colors">
              DAY
            </button>
            <button className="text-[10px] font-bold text-black bg-emerald-500 px-4 py-1.5 rounded-md shadow-sm">
              WEEK
            </button>
          </div>
          <button className="flex items-center gap-2 text-[11px] font-bold text-gray-300 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg border border-white/5 transition-colors">
            <Filter className="w-3.5 h-3.5 text-gray-400" /> Filters
          </button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        {/* Main Table Area */}
        <div className="flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-80 bg-[#0a0a0a] rounded-xl border border-white/5">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
              <p className="text-gray-400 text-sm font-medium">
                Syncing live market data...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-80 bg-[#0a0a0a] rounded-xl border border-white/5 text-red-400">
              <AlertTriangle className="w-8 h-8 mb-4 opacity-80" />
              <p className="font-medium">{error}</p>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-hide pb-10">
              <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
                <thead>
                  <tr className="text-[9px] text-gray-500 uppercase tracking-widest border-b border-white/5">
                    <th className="pb-4 px-2 font-bold w-24">Time</th>
                    <th className="pb-4 px-2 font-bold">Event</th>
                    <th className="pb-4 px-2 font-bold w-24">Impact</th>
                    <th className="pb-4 px-2 font-bold w-20 text-right">
                      Actual
                    </th>
                    <th className="pb-4 px-2 font-bold w-20 text-right">
                      Forecast
                    </th>
                    <th className="pb-4 px-2 font-bold w-20 text-right">
                      Previous
                    </th>
                    <th className="pb-4 px-2 font-bold w-16 text-right">
                      Curr
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {Object.entries(groupedNews).map(([dateString, events]) => (
                    <React.Fragment key={dateString}>
                      {/* Date Group Header */}
                      <tr className="bg-[#0a0a0a]">
                        <td colSpan={7} className="pt-8 pb-3 px-2">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-gray-200">
                              {dateString}
                            </span>
                            <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded uppercase tracking-widest border border-emerald-500/20">
                              Today
                            </span>
                            <span className="text-[9px] font-bold bg-white/5 text-gray-400 px-2 py-0.5 rounded uppercase tracking-widest border border-white/5">
                              {events.length} events
                            </span>
                          </div>
                        </td>
                      </tr>
                      {/* Event Rows */}
                      {events.map((item, idx) => (
                        <tr
                          key={idx}
                          onClick={() => handleOpenAiInsight(item)}
                          className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                        >
                          <td className="py-3.5 px-2 text-xs text-gray-400 font-medium">
                            {item.time}
                          </td>

                          <td className="py-3.5 px-2 flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <span className="w-4 h-4 bg-[#1a1d24] rounded-sm flex items-center justify-center text-[8px] font-bold text-gray-300 border border-white/5">
                                {item.country?.substring(0, 2).toUpperCase()}
                              </span>
                              <span className="text-[11px] font-bold text-gray-500">
                                {item.country}
                              </span>
                            </div>
                            <span className="text-xs text-gray-200 font-medium group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                              {item.title}
                              <Sparkles className="w-3 h-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </span>
                          </td>

                          <td className="py-3.5 px-2">
                            <div className="flex items-center gap-1.5">
                              <div
                                className={`w-0.5 h-3 rounded-full ${getImpactStyle(item.impact).bg}`}
                              ></div>
                              <span
                                className={`text-[10px] font-bold tracking-wide ${getImpactStyle(item.impact).text}`}
                              >
                                {item.impact}
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-2 text-xs text-right font-semibold text-gray-300">
                            {item.actual || "-"}
                          </td>
                          <td className="py-3.5 px-2 text-xs text-right text-gray-500">
                            {item.forecast || "-"}
                          </td>
                          <td className="py-3.5 px-2 text-xs text-right text-gray-500">
                            {item.previous || "-"}
                          </td>
                          <td className="py-3.5 px-2 text-[10px] font-bold text-right text-gray-500 uppercase tracking-widest">
                            {item.country}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-full xl:w-[320px] shrink-0 space-y-6">
          {/* Market Movers Card */}
          <div className="bg-[#121418] border border-white/5 rounded-xl p-5 shadow-lg">
            <h3 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-5">
              Upcoming Market Movers
            </h3>
            <div className="space-y-1">
              {marketMovers.length > 0 ? (
                marketMovers.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleOpenAiInsight(item)}
                    className="group flex flex-col justify-center cursor-pointer hover:bg-white/[0.03] p-3 -mx-3 rounded-xl transition-all border border-transparent hover:border-white/5"
                  >
                    <div className="flex items-center gap-2 text-[10px] mb-1.5">
                      <span className="text-gray-500 font-medium">
                        {item.time}
                      </span>
                      <span className="font-bold text-gray-300">
                        {item.country?.substring(0, 2).toUpperCase()}{" "}
                        {item.country}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider ${getImpactStyle(item.impact).text}`}
                      >
                        {item.impact}
                      </span>
                      <span className="text-xs text-gray-300 font-medium line-clamp-1 group-hover:text-emerald-400 transition-colors">
                        {item.title}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 py-2">
                  No major events remaining today.
                </p>
              )}
            </div>
          </div>

          {/* Calendar Overview Widget */}
          <div className="bg-[#121418] border border-white/5 rounded-xl p-5 shadow-lg">
            <h3 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-4">
              Calendar Overview
            </h3>
            <div className="text-sm font-bold text-white mb-4">
              September 2026
            </div>
            <div className="grid grid-cols-7 text-center gap-y-3 text-[10px] font-medium">
              <div className="text-gray-600">S</div>
              <div className="text-gray-600">M</div>
              <div className="text-gray-600">T</div>
              <div className="text-gray-600">W</div>
              <div className="text-gray-600">T</div>
              <div className="text-gray-600">F</div>
              <div className="text-gray-600">S</div>

              {/* Mock Dates for Visual Structure matching screenshot */}
              {[
                27, 28, 29, 30, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
                15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
              ].map((date, i) => (
                <div
                  key={i}
                  className={`flex flex-col items-center justify-center ${date === 28 ? "text-white" : "text-gray-500 hover:text-gray-300 cursor-pointer"}`}
                >
                  <span
                    className={`w-6 h-6 flex items-center justify-center rounded-full ${date === 28 ? "bg-white/10 border border-white/10" : ""}`}
                  >
                    {date}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex gap-4 text-[9px] font-bold text-gray-500 uppercase tracking-wider justify-center">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>{" "}
                High
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>{" "}
                Medium
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>{" "}
                Low
              </div>
            </div>
          </div>

          {/* Event Categories */}
          <div className="bg-[#121418] border border-white/5 rounded-xl p-5 shadow-lg">
            <h3 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-4">
              Event Categories
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                "Central Bank",
                "Employment",
                "Inflation",
                "GDP",
                "Retail Sales",
                "Other",
              ].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 bg-[#1a1d24] hover:bg-[#2a2e39] border border-white/5 rounded-lg text-[10px] font-bold text-gray-400 hover:text-white cursor-pointer transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Insight Modal (Unchanged Layout, Dynamic Hex Colors) */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedEvent(null)}
          ></div>

          <div className="relative w-full max-w-lg bg-[#121418] border border-white/10 rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-white/5 flex items-start justify-between bg-[#16181d]">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="px-2 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-widest shadow-sm"
                    style={{
                      backgroundColor: getImpactStyle(selectedEvent.impact).hex,
                    }}
                  >
                    {selectedEvent.country}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">
                    {selectedEvent.time}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white leading-tight">
                  {selectedEvent.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors border border-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 min-h-[200px]">
              {isAiLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-10">
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20 rounded-full animate-pulse"></div>
                    <Sparkles className="w-10 h-10 text-emerald-500 animate-bounce relative z-10" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      Analyzing Market Impact...
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Gemini is evaluating historical trends and directional
                      bias.
                    </p>
                  </div>
                </div>
              ) : aiError ? (
                <div className="text-center py-10">
                  <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                  <p className="text-red-400 font-medium text-sm">{aiError}</p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-5 shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50"></div>
                    <h3 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5" /> Gemini Analysis
                    </h3>
                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-medium">
                      {aiInsight}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-[#16181d] border border-white/5 rounded-xl p-3.5 text-center shadow-sm">
                      <span className="block text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-1.5">
                        Previous
                      </span>
                      <span className="text-sm font-bold text-gray-400">
                        {selectedEvent.previous || "--"}
                      </span>
                    </div>
                    <div className="bg-[#16181d] border border-white/5 rounded-xl p-3.5 text-center shadow-sm">
                      <span className="block text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-1.5">
                        Forecast
                      </span>
                      <span className="text-sm font-bold text-gray-400">
                        {selectedEvent.forecast || "--"}
                      </span>
                    </div>
                    <div className="bg-[#16181d] border border-emerald-500/20 rounded-xl p-3.5 text-center shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                      <span className="block text-[9px] text-emerald-500 uppercase font-bold tracking-widest mb-1.5">
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
