// frontend/src/pages/Settings.jsx
import { useState } from "react";
import {
  Settings as SettingsIcon,
  Trash2,
  Download,
  Moon,
  Sun,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import api from "../api/axios";

export default function Settings() {
  const [exporting, setExporting] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleExport = async (format) => {
    const userId = localStorage.getItem("userId");
    if (!userId) return alert("User session not found.");

    setExporting(format);
    try {
      const response = await api.get(
        `/api/trades/export?userId=${userId}&format=${format}`,
        {
          responseType: format === "csv" ? "blob" : "json",
        },
      );

      if (format === "csv") {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "trade_journal.csv");
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        alert(`${format.toUpperCase()} export data retrieved successfully.`);
      }
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

    const userId = localStorage.getItem("userId");
    setDeleting(true);
    try {
      await api.delete(`/api/trades/all?userId=${userId}`);
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
            Settings
          </h1>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
            Manage workspace appearance, data exports, and account actions.
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
            <div className="p-4 border border-[#2f8df4] bg-[#2f8df4]/5 rounded-[2px] cursor-pointer flex items-center justify-between">
              <span className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Moon className="w-4 h-4 text-[#2f8df4]" /> Dark Mode
              </span>
              <span className="text-xs text-[#2f8df4] font-bold">Active</span>
            </div>
            <div className="p-4 border border-gray-200 dark:border-white/5 rounded-[2px] cursor-pointer flex items-center justify-between opacity-60">
              <span className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sun className="w-4 h-4" /> Light Mode
              </span>
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

        {/* Export Data */}
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
