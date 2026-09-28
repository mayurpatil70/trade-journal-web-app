// frontend/src/pages/Imports.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import {
  Upload,
  Sparkles,
  Loader2,
  Target,
  Brain,
  AlertTriangle,
} from "lucide-react";

export default function Imports() {
  const navigate = useNavigate();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTradeId, setSelectedTradeId] = useState("");

  // AI State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTrades = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        navigate("/login");
        return;
      }

      try {
        const response = await api.get(`/api/trades?userId=${userId}`);
        const fetchedTrades = response.data.data || [];
        setTrades(fetchedTrades);
        if (fetchedTrades.length > 0) {
          setSelectedTradeId(fetchedTrades[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch trades for import insights:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();
  }, [navigate]);

  const handleGenerateAudit = async () => {
    if (!selectedTradeId) return;
    const tradeToAnalyze = trades.find((t) => t.id === selectedTradeId);
    if (!tradeToAnalyze) return;

    setAiLoading(true);
    setAiInsight("");
    setError("");

    try {
      // Reusing your powerful Gemini endpoint to audit the selected trade execution
      const response = await api.post("/api/ai/news-insight", {
        event: {
          title: `Trade Audit: ${tradeToAnalyze.asset} (${tradeToAnalyze.direction}) - Setup: ${tradeToAnalyze.setup}`,
          country: tradeToAnalyze.asset,
          impact: tradeToAnalyze.result === "win" ? "High Win" : "High Loss",
          actual: `${tradeToAnalyze.r_multiple || 0}R`,
          forecast: "1.5R Target",
          previous: `Risk: ${tradeToAnalyze.risk}%`,
        },
      });
      setAiInsight(response.data.insight);
    } catch (err) {
      console.error("AI Audit Error:", err);
      setError("Failed to generate AI trade audit. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const optionClass =
    "bg-white !text-gray-900 dark:bg-[#0b131d] dark:!text-white font-medium text-center";

  return (
    <div
      className="w-full max-w-7xl mx-auto font-sans pb-16 px-4 md:px-8 mt-6 md:mt-8 box-border"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header */}
      <div className="mb-8 md:mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-[2px] bg-[#fb7185]/10 flex items-center justify-center border border-[#fb7185]/20 shrink-0">
            <Upload className="w-5 h-5 md:w-6 md:h-6 text-[#fb7185]" />
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-1">
              AI Imports & Insights
            </h1>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
              Get deep AI-driven execution audits on your uploaded trades and
              charts.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-80 bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px]">
          <Loader2 className="w-8 h-8 text-[#fb7185] animate-spin mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            Loading trade records...
          </p>
        </div>
      ) : trades.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-80 bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] text-center p-6">
          <Target className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            No Trades Available for Audit
          </h3>
          <p className="text-sm text-gray-500">
            Record a trade with screenshots first to run AI import analysis.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Selection Control Card */}
          <div className="bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-6 md:p-8 shadow-xl">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-[#2f8df4]" /> Select a Trade for
              Gemini AI Review
            </h2>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-full sm:max-w-md">
                <select
                  value={selectedTradeId}
                  onChange={(e) => setSelectedTradeId(e.target.value)}
                  className="appearance-none box-border w-full min-h-[50px] bg-gray-50 dark:bg-[#0b131d] border border-gray-300 dark:border-[#1f2c3b] rounded-[2px] px-4 py-3 !text-[#2f8df4] font-bold outline-none text-sm text-center [text-align-last:center]"
                >
                  {trades.map((t) => (
                    <option key={t.id} value={t.id} className={optionClass}>
                      {t.date} — {t.asset} ({t.direction}) [
                      {t.result?.toUpperCase()}]
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleGenerateAudit}
                disabled={aiLoading}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#2f8df4] hover:bg-[#2376e8] text-white font-bold rounded-[2px] transition-all shadow-md text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Analyzing
                    Execution...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Generate AI Audit
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Output Box */}
          {(aiLoading || aiInsight || error) && (
            <div className="bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-6 md:p-8 shadow-xl animate-in fade-in duration-200">
              <h3 className="text-xs font-bold text-[#2f8df4] uppercase tracking-widest mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Gemini Execution Breakdown
              </h3>

              {aiLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <Loader2 className="w-8 h-8 text-[#2f8df4] animate-spin" />
                  <p className="text-xs text-gray-400 font-medium">
                    Evaluating entry precision, risk parameters, and setup
                    quality...
                  </p>
                </div>
              ) : error ? (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-[2px] text-red-500">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-[#0b131d] border border-gray-200 dark:border-[#1f2c3b] rounded-[2px] p-6">
                  <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap font-medium">
                    {aiInsight}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
