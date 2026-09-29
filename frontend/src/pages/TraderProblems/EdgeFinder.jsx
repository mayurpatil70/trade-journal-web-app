// frontend/src/pages/TraderProblems/EdgeFinder.jsx
import { useState, useEffect } from "react";
import {
  BrainCircuit,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import api from "../../api/axios";

export default function EdgeFinder() {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState({ edges: [], leaks: [] });

  useEffect(() => {
    const fetchEdgeInsights = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      try {
        const response = await api.get(`/api/ai/edge?userId=${userId}`);
        if (response.data.success) {
          setInsights(response.data.insights);
        }
      } catch (error) {
        console.error("Failed to fetch edge insights:", error);
        setInsights({
          edges: ["Unable to load edge analytics at this time."],
          leaks: ["Unable to load trading leaks at this time."],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEdgeInsights();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[4px] p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
          <BrainCircuit className="w-5 h-5 text-[#2f8df4]" /> The Edge Finder
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Our AI analyzes your entire journal history to find hidden
          correlations in your trading behavior.
        </p>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#2f8df4] animate-spin mb-3" />
            <p className="text-sm text-gray-500 font-medium">
              Crunching your trade data with Gemini AI...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* The Leaks (Negative Insights) */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
                <TrendingDown className="w-4 h-4" /> Your Trading Leaks
              </h3>
              <div className="space-y-3">
                {insights.leaks.map((leak, i) => (
                  <div
                    key={i}
                    className="p-4 bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10 rounded-[2px] flex items-start gap-3"
                  >
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                      {leak}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* The Edge (Positive Insights) */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Your Winning Edge
              </h3>
              <div className="space-y-3">
                {insights.edges.map((edge, i) => (
                  <div
                    key={i}
                    className="p-4 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 rounded-[2px] flex items-start gap-3"
                  >
                    <BrainCircuit className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                      {edge}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
