// frontend/src/pages/Settings.jsx
import { useState, useEffect } from "react";
import {
  Download,
  Trash2,
  FileText,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import api from "../api/axios";

export default function Settings() {
  const [themeMode, setThemeMode] = useState("dark");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [exporting, setExporting] = useState(null); // Tracks which format is downloading

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setThemeMode(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = (mode) => {
    setThemeMode(mode);
    if (mode === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // 1. DELETE ALL TRADES LOGIC
  const handleDeleteAll = async () => {
    const confirmDelete = window.confirm(
      "WARNING: Are you absolutely sure you want to delete all your trades? This action cannot be undone.",
    );
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      const userId = localStorage.getItem("userId");
      // Pass userId to the backend to ensure ONLY this user's trades are deleted
      await api.delete(`/api/trades/all?userId=${userId}`);

      setDeleteSuccess(true);
      setTimeout(() => setDeleteSuccess(false), 4000);
    } catch (error) {
      console.error("Failed to delete trades:", error);
      alert(
        "An error occurred while trying to delete your trades. Please try again.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // 2. EXPORT LOGIC
  const handleExport = async (format) => {
    setExporting(format);
    try {
      const userId = localStorage.getItem("userId");
      // Request file buffer from backend
      const response = await api.get(
        `/api/trades/export?userId=${userId}&format=${format}`,
        {
          responseType: "blob",
        },
      );

      // Create a temporary link to force file download in browser
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Map extensions properly based on the format
      let extension = format;
      if (format === "excel") extension = "xlsx";
      if (format === "doc") extension = "docx";

      link.setAttribute("download", `Trade_Journey_Export.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(`Failed to export ${format}:`, error);
      alert(
        `Failed to export your journal as ${format.toUpperCase()}. Make sure your backend export route is configured.`,
      );
    } finally {
      setExporting(null);
    }
  };

  const themeOptionClass = (mode) =>
    `w-full p-4 rounded-[2px] border cursor-pointer text-left transition-all mb-3 ${themeMode === mode ? "border-[#2f8df4] bg-[#2f8df4]/5 shadow-sm" : "border-gray-200 dark:border-[#1f2c3b] bg-gray-50 dark:bg-[#0b131d] hover:border-gray-300 dark:hover:border-white/20"}`;

  return (
    <div
      className="w-full max-w-4xl mx-auto font-sans pb-16 px-4 md:px-8 mt-6 md:mt-8 box-border"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
            Trading Journal
          </p>
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            Settings
          </h1>
        </div>
      </div>

      <div className="space-y-6">
        {/* Panel 1: Appearance */}
        <div className="bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            Appearance
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
            Choose how Trade Journey looks. Your preference is saved locally.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => toggleTheme("dark")}
              className={themeOptionClass("dark")}
            >
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Dark Mode
              </h3>
              <p className="text-xs text-gray-500">Classic dark workspace</p>
            </button>
            <button
              onClick={() => toggleTheme("light")}
              className={themeOptionClass("light")}
            >
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Light Mode
              </h3>
              <p className="text-xs text-gray-500">Clean light workspace</p>
            </button>
          </div>
        </div>

        {/* Panel 2: Danger Zone */}
        <div className="bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-6 shadow-sm relative overflow-hidden">
          <h2 className="text-lg font-bold text-red-500 mb-1 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Danger Zone
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
            Permanently wipe all your trade logs from the database. This cannot
            be reversed.
          </p>

          {deleteSuccess ? (
            <div className="flex items-center gap-2 text-emerald-500 text-sm font-bold bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-[2px] border border-emerald-200 dark:border-emerald-500/20">
              <CheckCircle className="w-5 h-5" /> All trades have been
              successfully deleted.
            </div>
          ) : (
            <button
              onClick={handleDeleteAll}
              disabled={isDeleting}
              className="px-6 py-3 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-500 border border-red-200 dark:border-red-500/20 font-bold rounded-[2px] text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Deleting Data...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" /> Delete All Trades
                </>
              )}
            </button>
          )}
        </div>

        {/* Panel 3: Export Journal */}
        <div className="bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <Download className="w-5 h-5 text-[#2f8df4]" /> Export Journal Data
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
            Download a complete copy of your trading journal logs, analyses, and
            metrics for your personal records or tax purposes.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => handleExport("csv")}
              disabled={exporting !== null}
              className="p-4 bg-gray-50 dark:bg-[#1a1d24] text-gray-900 dark:text-white border border-gray-200 dark:border-white/5 font-bold rounded-[2px] text-xs flex flex-col items-center justify-center gap-3 hover:border-[#2f8df4] transition-colors disabled:opacity-50"
            >
              {exporting === "csv" ? (
                <Loader2 className="w-6 h-6 animate-spin text-[#2f8df4]" />
              ) : (
                <FileText className="w-6 h-6 text-[#21d4a3]" />
              )}
              Export to CSV
            </button>

            <button
              onClick={() => handleExport("excel")}
              disabled={exporting !== null}
              className="p-4 bg-gray-50 dark:bg-[#1a1d24] text-gray-900 dark:text-white border border-gray-200 dark:border-white/5 font-bold rounded-[2px] text-xs flex flex-col items-center justify-center gap-3 hover:border-[#2f8df4] transition-colors disabled:opacity-50"
            >
              {exporting === "excel" ? (
                <Loader2 className="w-6 h-6 animate-spin text-[#2f8df4]" />
              ) : (
                <FileText className="w-6 h-6 text-[#10b981]" />
              )}
              Export to Excel
            </button>

            <button
              onClick={() => handleExport("doc")}
              disabled={exporting !== null}
              className="p-4 bg-gray-50 dark:bg-[#1a1d24] text-gray-900 dark:text-white border border-gray-200 dark:border-white/5 font-bold rounded-[2px] text-xs flex flex-col items-center justify-center gap-3 hover:border-[#2f8df4] transition-colors disabled:opacity-50"
            >
              {exporting === "doc" ? (
                <Loader2 className="w-6 h-6 animate-spin text-[#2f8df4]" />
              ) : (
                <FileText className="w-6 h-6 text-[#6366f1]" />
              )}
              Export to DOC
            </button>

            <button
              onClick={() => handleExport("pdf")}
              disabled={exporting !== null}
              className="p-4 bg-gray-50 dark:bg-[#1a1d24] text-gray-900 dark:text-white border border-gray-200 dark:border-white/5 font-bold rounded-[2px] text-xs flex flex-col items-center justify-center gap-3 hover:border-[#2f8df4] transition-colors disabled:opacity-50"
            >
              {exporting === "pdf" ? (
                <Loader2 className="w-6 h-6 animate-spin text-[#2f8df4]" />
              ) : (
                <FileText className="w-6 h-6 text-[#ef4444]" />
              )}
              Export to PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
