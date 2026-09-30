// frontend/src/pages/TraderProblems/Hindsight.jsx
import { useState, useEffect } from "react";
import {
  SlidersHorizontal,
  Info,
  Loader2,
  Calendar,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import api from "../../api/axios";

export default function Hindsight() {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [loading, setLoading] = useState(true);
  const [trades, setTrades] = useState([]);
  const [selectedTrade, setSelectedTrade] = useState(null);

  useEffect(() => {
    const fetchTrades = async () => {
      const userId =
        localStorage.getItem("userId") || localStorage.getItem("userEmail");
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(`/api/trades?userId=${userId}`);
        if (response.data.success) {
          // Filter for trades that explicitly have both images
          // Checks both the new schema columns and the old array fallback
          const validTrades = response.data.data.filter(
            (t) =>
              (t.before_image && t.after_image) ||
              (t.images && t.images.length >= 2),
          );
          setTrades(validTrades);
          if (validTrades.length > 0) {
            setSelectedTrade(validTrades[0]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch trades for Hindsight:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();
  }, []);

  const handleSliderChange = (e) => {
    setSliderPosition(e.target.value);
  };

  // Helper to extract the correct image URLs
  const getBeforeImg = (trade) => trade.before_image || trade.images?.[0];
  const getAfterImg = (trade) => trade.after_image || trade.images?.[1];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[4px] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
              <SlidersHorizontal className="w-5 h-5 text-[#2f8df4]" /> Hindsight
              Bias Eliminator
            </h2>
            <p className="text-sm text-gray-500 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#2f8df4]" />
              Compare what the chart looked like at the exact moment you
              entered, versus how it played out.
            </p>
          </div>

          {/* Trade Selector Dropdown */}
          {!loading && trades.length > 0 && (
            <div className="shrink-0">
              <select
                value={selectedTrade?.id || ""}
                onChange={(e) => {
                  const trade = trades.find(
                    (t) =>
                      t.id === parseInt(e.target.value) ||
                      t.id === e.target.value,
                  );
                  setSelectedTrade(trade);
                  setSliderPosition(50); // Reset slider on trade change
                }}
                className="bg-gray-50 dark:bg-[#1a1d24] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm rounded-[2px] focus:ring-[#2f8df4] focus:border-[#2f8df4] block w-full p-2.5 outline-none font-medium"
              >
                {trades.map((trade) => (
                  <option key={trade.id} value={trade.id}>
                    {trade.date} • {trade.asset} ({trade.direction})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#2f8df4] animate-spin mb-3" />
            <p className="text-sm text-gray-500 font-medium">
              Loading your chart history...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!loading && trades.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 bg-gray-50 dark:bg-white/[0.02] border border-dashed border-gray-200 dark:border-white/10 rounded-[4px]">
            <SlidersHorizontal className="w-10 h-10 text-gray-400 mb-3" />
            <p className="text-sm text-gray-900 dark:text-white font-bold mb-1">
              No Before/After Charts Found
            </p>
            <p className="text-xs text-gray-500 text-center max-w-md">
              To use this tool, make sure you upload exactly TWO images (Entry
              Chart & Exit Chart) when logging a new trade in the Add Trade
              screen.
            </p>
          </div>
        )}

        {/* Interactive Slider */}
        {!loading && selectedTrade && (
          <div className="space-y-4">
            {/* Trade Context Bar */}
            <div className="flex flex-wrap items-center gap-4 p-3 bg-gray-50 dark:bg-[#1a1d24] rounded-[2px] border border-gray-200 dark:border-white/5 text-sm">
              <span className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white">
                <Calendar className="w-4 h-4 text-gray-500" />{" "}
                {selectedTrade.date}
              </span>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {selectedTrade.asset}
              </span>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span
                className={`font-bold flex items-center gap-1 ${selectedTrade.direction === "Long" ? "text-emerald-500" : "text-red-500"}`}
              >
                {selectedTrade.direction === "Long" ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {selectedTrade.direction}
              </span>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span className="font-bold text-gray-500">
                Setup:{" "}
                <span className="text-gray-900 dark:text-white">
                  {selectedTrade.setup || "N/A"}
                </span>
              </span>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span
                className={`font-bold ${selectedTrade.r_multiple >= 0 ? "text-emerald-500" : "text-red-500"}`}
              >
                Result: {selectedTrade.r_multiple > 0 ? "+" : ""}
                {selectedTrade.r_multiple}R
              </span>
            </div>

            {/* The Image Slider Component */}
            <div className="relative w-full max-w-5xl mx-auto aspect-video rounded-[2px] overflow-hidden border border-gray-200 dark:border-white/10 select-none bg-gray-900">
              {/* Base Image (After) */}
              <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                <img
                  src={getAfterImg(selectedTrade)}
                  alt="After Trade"
                  className="w-full h-full object-contain"
                  crossOrigin="anonymous"
                />
                <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-[2px] text-xs font-bold tracking-widest uppercase z-0 border border-white/10 shadow-lg">
                  After (Exit)
                </div>
              </div>

              {/* Overlay Image (Before) */}
              <div
                className="absolute inset-0 h-full border-r-2 border-[#2f8df4] shadow-[5px_0_20px_rgba(0,0,0,0.8)] z-10 overflow-hidden bg-gray-900"
                style={{ width: `${sliderPosition}%` }}
              >
                <div className="absolute inset-0 w-[100vw] max-w-[1024px] h-full flex items-center justify-start">
                  <img
                    src={getBeforeImg(selectedTrade)}
                    alt="Before Trade"
                    className="h-full object-contain"
                    style={{ width: "100%", maxWidth: "1024px" }}
                    crossOrigin="anonymous"
                  />
                </div>
                <div className="absolute bottom-4 left-4 bg-[#2f8df4] text-white px-3 py-1.5 rounded-[2px] text-xs font-bold tracking-widest uppercase shadow-lg">
                  Before (Entry)
                </div>
              </div>

              {/* Invisible Range Slider for Control */}
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={handleSliderChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
              />

              {/* Center Drag Handle Indicator */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-8 h-8 bg-white border-2 border-[#2f8df4] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10 pointer-events-none transition-transform"
                style={{ left: `calc(${sliderPosition}% - 16px)` }}
              >
                <div className="flex gap-0.5">
                  <div className="w-0.5 h-3 bg-gray-400 rounded-full"></div>
                  <div className="w-0.5 h-3 bg-gray-400 rounded-full"></div>
                  <div className="w-0.5 h-3 bg-gray-400 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
