// frontend/src/pages/Settings.jsx
import { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Trash2,
  Download,
  Moon,
  Sun,
  AlertTriangle,
  Loader2,
  BookOpen,
  Calendar,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import api from "../api/axios";

export default function Settings() {
  const [exporting, setExporting] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  const [historyTrades, setHistoryTrades] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const userId =
        localStorage.getItem("userId") || localStorage.getItem("userEmail");
      if (!userId) return;
      try {
        const response = await api.get(`/api/trades?userId=${userId}`);
        if (response.data.success) {
          setHistoryTrades(response.data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch journal history:", error);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, []);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleExport = async (format) => {
    const userId =
      localStorage.getItem("userId") || localStorage.getItem("userEmail");
    if (!userId) return alert("User session not found.");

    setExporting(format);
    try {
      const response = await api.get(
        `/api/trades/export?userId=${userId}&format=${format}`,
        {
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `trade_journal.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(error);
      alert(`Failed to export your journal as ${format.toUpperCase()}.`);
    } finally {
      setExporting("");
    }
  };

  const handleDeleteAllTrades = async () => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete all your trades? This cannot be undone.",
      )
    )
      return;

    const userId =
      localStorage.getItem("userId") || localStorage.getItem("userEmail");
    setDeleting(true);
    try {
      await api.delete(`/api/trades/all?userId=${userId}`);
      setHistoryTrades([]);
      alert("All trades have been wiped successfully.");
    } catch (error) {
      console.error(error);
      alert("Failed to delete trades.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="w-full max-w-5xl mx-auto font-sans pb-16 px-4 md:px-8 mt-6 md:mt-8"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="mb-8 md:mb-10 flex items-center gap-4">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-[2px] bg-[#2f8df4]/10 flex items-center justify-center border border-[#2f8df4]/20 shrink-0">
          <SettingsIcon className="w-5 h-5 md:w-6 md:h-6 text-[#2f8df4]" />
        </div>
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-1">
            Settings & History
          </h1>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
            Manage appearance, exports, and review your journal logs.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Appearance */}
        <div className="bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-6 md:p-8 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
            Appearance
          </h2>
          <p className="text-xs text-gray-500 mb-6">
            Choose how Trade Journey looks. Your preference is saved locally.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => handleThemeChange("dark")}
              className={`p-4 border rounded-[2px] cursor-pointer flex items-center justify-between transition-all ${
                theme === "dark"
                  ? "border-[#2f8df4] bg-[#2f8df4]/5"
                  : "border-gray-200 dark:border-white/5 opacity-60 hover:opacity-100"
              }`}
            >
              <span className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Moon
                  className={`w-4 h-4 ${theme === "dark" ? "text-[#2f8df4]" : ""}`}
                />{" "}
                Dark Mode
              </span>
              {theme === "dark" && (
                <span className="text-xs text-[#2f8df4] font-bold">Active</span>
              )}
            </div>

            <div
              onClick={() => handleThemeChange("light")}
              className={`p-4 border rounded-[2px] cursor-pointer flex items-center justify-between transition-all ${
                theme === "light"
                  ? "border-[#2f8df4] bg-[#2f8df4]/5"
                  : "border-gray-200 dark:border-white/5 opacity-60 hover:opacity-100"
              }`}
            >
              <span className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sun
                  className={`w-4 h-4 ${theme === "light" ? "text-[#2f8df4]" : ""}`}
                />{" "}
                Light Mode
              </span>
              {theme === "light" && (
                <span className="text-xs text-[#2f8df4] font-bold">Active</span>
              )}
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white dark:bg-[#121418] border border-red-500/20 rounded-[2px] p-6 md:p-8 shadow-sm">
          <h2 className="text-base font-bold text-red-500 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Danger Zone
          </h2>
          <p className="text-xs text-gray-500 mb-6">
            Permanently wipe all your trade logs from the database. This cannot
            be reversed.
          </p>
          <button
            onClick={handleDeleteAllTrades}
            disabled={deleting}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-[2px] text-sm transition-colors flex items-center gap-2"
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}{" "}
            Delete All Trades
          </button>
        </div>

        {/* INTEGRATED: Journal History Logs */}
        <div className="bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-6 md:p-8 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#2f8df4]" /> Journal History Logs
          </h2>
          <p className="text-xs text-gray-500 mb-6">
            Review your most recent trades directly from your settings before
            exporting.
          </p>

          <div className="w-full overflow-x-auto">
            {loadingHistory ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 text-[#2f8df4] animate-spin" />
              </div>
            ) : historyTrades.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-10 border border-dashed border-gray-200 dark:border-white/10 rounded-[2px]">
                No trades logged yet.
              </p>
            ) : (
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-white/5">
                    <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Date
                    </th>
                    <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Asset
                    </th>
                    <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Direction
                    </th>
                    <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Setup
                    </th>
                    <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">
                      Result
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {historyTrades.map((trade) => (
                    <tr
                      key={trade.id}
                      className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-4 text-sm text-gray-900 dark:text-white font-medium flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />{" "}
                        {trade.date}
                      </td>
                      <td className="py-4 text-sm text-gray-900 dark:text-white font-bold">
                        {trade.asset}
                      </td>
                      <td className="py-4 text-sm font-bold">
                        <span
                          className={`flex items-center gap-1 ${trade.direction === "LONG" ? "text-emerald-500" : "text-red-500"}`}
                        >
                          {trade.direction === "LONG" ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}{" "}
                          {trade.direction}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-gray-500">
                        {trade.setup || "N/A"}
                      </td>
                      <td className="py-4 text-sm font-black text-right">
                        <span
                          className={
                            trade.r_multiple >= 0
                              ? "text-emerald-500"
                              : "text-red-500"
                          }
                        >
                          {trade.r_multiple > 0 ? "+" : ""}
                          {trade.r_multiple}R
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Export Data (Moved to bottom) */}
        <div className="bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-6 md:p-8 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">
            Export Journal Data
          </h2>
          <p className="text-xs text-gray-500 mb-6">
            Download a complete copy of your trading journal logs, analyses, and
            metrics.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {["csv", "excel", "doc", "pdf"].map((fmt) => (
              <button
                key={fmt}
                onClick={() => handleExport(fmt)}
                disabled={exporting === fmt}
                className="p-4 border border-gray-200 dark:border-white/5 rounded-[2px] hover:border-[#2f8df4] transition-all flex flex-col items-center justify-center text-center gap-2 bg-gray-50 dark:bg-white/[0.02]"
              >
                {exporting === fmt ? (
                  <Loader2 className="w-5 h-5 text-[#2f8df4] animate-spin" />
                ) : (
                  <Download className="w-5 h-5 text-[#2f8df4]" />
                )}
                <span className="text-xs font-bold text-gray-900 dark:text-white uppercase">
                  Export to {fmt}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
