// frontend/src/pages/EconomicCalendar.jsx
import { useEffect, useState } from "react";
import api from "../api/axios";
import { Globe, AlertTriangle, Loader2, Calendar } from "lucide-react";

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
    switch (impact?.toLowerCase()) {
      case "high":
        return "bg-red-500/20 text-red-500 border-red-500/30";
      case "medium":
        return "bg-orange-500/20 text-orange-500 border-orange-500/30";
      case "low":
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="max-w-6xl mx-auto font-sans">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center shadow-inner">
          <Globe className="w-5 h-5 text-gray-300" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Economic Calendar
          </h1>
          <p className="text-sm text-gray-400">
            Live high-impact events and monetary policy updates.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-[#121418] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
            <p className="text-gray-400 text-sm">
              Syncing with Forex Factory...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-red-400">
            <AlertTriangle className="w-8 h-8 mb-4 opacity-80" />
            <p>{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5 text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                  <th className="p-4 pl-6 font-semibold">Date & Time</th>
                  <th className="p-4 font-semibold">Currency</th>
                  <th className="p-4 font-semibold">Impact</th>
                  <th className="p-4 font-semibold">Event</th>
                  <th className="p-4 font-semibold text-right">Actual</th>
                  <th className="p-4 font-semibold text-right">Forecast</th>
                  <th className="p-4 pr-6 font-semibold text-right">
                    Previous
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {news.map((item, index) => (
                  <tr
                    key={index}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="p-4 pl-6 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors" />
                        <div>
                          <p className="text-sm font-medium text-gray-200">
                            {item.date}
                          </p>
                          <p className="text-xs text-gray-500">{item.time}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-gray-300">
                        {item.country}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getImpactColor(item.impact)}`}
                      >
                        {item.impact}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-gray-200">
                        {item.title}
                      </p>
                    </td>
                    <td className="p-4 text-right text-sm font-medium text-emerald-400">
                      {item.actual || "-"}
                    </td>
                    <td className="p-4 text-right text-sm text-gray-400">
                      {item.forecast || "-"}
                    </td>
                    <td className="p-4 pr-6 text-right text-sm text-gray-500">
                      {item.previous || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
