// frontend/src/pages/EconomicCalendar.jsx
import { useEffect, useState } from "react";
import api from "../api/axios";
import { Loader2, AlertTriangle, Folder, BarChart } from "lucide-react";

export default function EconomicCalendar() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    if (imp.includes("high")) return "bg-[#ff0000]"; // FF Red
    if (imp.includes("medium")) return "bg-[#ff8c00]"; // FF Orange
    if (imp.includes("low")) return "bg-[#ffd700]"; // FF Yellow
    return "bg-gray-400"; // FF Non-Economic
  };

  const formatFFDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // Tracking grouping variables just like Forex Factory
  let lastDate = null;
  let lastTime = null;

  return (
    <div
      className="max-w-6xl mx-auto w-full"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header matching FF style */}
      <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Calendar
          </h1>
          <p className="text-sm text-gray-400">Live feed via Forex Factory</p>
        </div>
        <div className="flex gap-4 text-xs font-medium text-gray-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#ff0000] inline-block"></span> High
            Impact
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#ff8c00] inline-block"></span>{" "}
            Medium Impact
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#ffd700] inline-block"></span> Low
            Impact
          </div>
        </div>
      </div>

      <div className="bg-[#121418] border border-white/10 rounded-lg overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-[#6366f1] animate-spin mb-4" />
            <p className="text-gray-400 text-sm">Fetching live data...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-red-400">
            <AlertTriangle className="w-8 h-8 mb-4 opacity-80" />
            <p>{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-[#1a1d24] text-[11px] uppercase tracking-wider text-gray-400 font-semibold border-b border-white/10">
                  <th className="py-2.5 px-4 w-[120px]">Date</th>
                  <th className="py-2.5 px-4 w-[100px]">Time</th>
                  <th className="py-2.5 px-4 w-[60px]">Cur</th>
                  <th className="py-2.5 px-4 w-[60px]">Imp</th>
                  <th className="py-2.5 px-4">Event</th>
                  <th className="py-2.5 px-4 w-[40px]">Detail</th>
                  <th className="py-2.5 px-4 w-[80px] text-right">Actual</th>
                  <th className="py-2.5 px-4 w-[80px] text-right">Forecast</th>
                  <th className="py-2.5 px-4 w-[80px] text-right">Previous</th>
                  <th className="py-2.5 px-4 w-[40px]">Graph</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {news.map((item, index) => {
                  const formattedDate = formatFFDate(item.date);
                  const showDate = formattedDate !== lastDate;
                  const showTime = item.time !== lastTime || showDate;

                  lastDate = formattedDate;
                  lastTime = item.time;

                  return (
                    <tr
                      key={index}
                      className="hover:bg-white/[0.02] text-[13px] text-gray-300 transition-colors group"
                    >
                      {/* Date Column (Grouped) */}
                      <td className="py-2 px-4 font-semibold text-gray-200">
                        {showDate ? formattedDate : ""}
                      </td>

                      {/* Time Column (Grouped) */}
                      <td className="py-2 px-4 text-gray-400">
                        {showTime ? item.time || "All Day" : ""}
                      </td>

                      {/* Currency */}
                      <td className="py-2 px-4 font-bold text-gray-200">
                        {item.country}
                      </td>

                      {/* Impact Block */}
                      <td className="py-2 px-4">
                        <div
                          className={`w-4 h-4 rounded-sm flex items-center justify-center ${getImpactColor(item.impact)}`}
                        ></div>
                      </td>

                      {/* Event Name */}
                      <td className="py-2 px-4 font-medium text-white">
                        {item.title}
                      </td>

                      {/* Detail Icon */}
                      <td className="py-2 px-4">
                        <Folder className="w-4 h-4 text-gray-500 cursor-pointer hover:text-gray-300" />
                      </td>

                      {/* Actual */}
                      <td className="py-2 px-4 text-right font-semibold">
                        {item.actual || ""}
                      </td>

                      {/* Forecast */}
                      <td className="py-2 px-4 text-right text-gray-400">
                        {item.forecast || ""}
                      </td>

                      {/* Previous */}
                      <td className="py-2 px-4 text-right text-gray-500">
                        {item.previous || ""}
                      </td>

                      {/* Graph Icon */}
                      <td className="py-2 px-4">
                        <BarChart className="w-4 h-4 text-gray-600 cursor-pointer hover:text-gray-400" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
