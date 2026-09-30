// frontend/src/pages/Settings.jsx
import { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Trash2,
  Download,
  AlertTriangle,
  Loader2,
  BookOpen,
  Calendar,
  TrendingUp,
  TrendingDown,
  FileText,
  Table,
  FileType,
} from "lucide-react";
import api from "../api/axios";

export default function Settings() {
  const [exporting, setExporting] = useState("");
  const [deleting, setDeleting] = useState(false);
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

  const handleExport = async (format) => {
    const userId =
      localStorage.getItem("userId") || localStorage.getItem("userEmail");
    if (!userId) return alert("User session not found.");

    setExporting(format);
    try {
      const response = await api.get(
        `/api/trades/export?userId=${userId}&format=${format}`,
        { responseType: "blob" }
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
        "Are you sure you want to permanently delete all your trades? This cannot be undone."
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

  const exportFormats = [
    { fmt: "csv", label: "CSV", icon: <Table className="w-5 h-5" />, color: "from-emerald-500/20 to-green-500/20", border: "border-emerald-500/20", text: "text-emerald-400" },
    { fmt: "excel", label: "Excel", icon: <Table className="w-5 h-5" />, color: "from-blue-500/20 to-cyan-500/20", border: "border-blue-500/20", text: "text-blue-400" },
    { fmt: "doc", label: "Word", icon: <FileText className="w-5 h-5" />, color: "from-violet-500/20 to-purple-500/20", border: "border-violet-500/20", text: "text-violet-400" },
    { fmt: "pdf", label: "PDF", icon: <FileType className="w-5 h-5" />, color: "from-red-500/20 to-rose-500/20", border: "border-red-500/20", text: "text-red-400" },
  ];

  return (
    <div
      className="w-full max-w-5xl mx-auto font-sans pb-16 px-4 md:px-8 mt-6 md:mt-8"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header */}
      <div className="mb-8 md:mb-10 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-500/20 to-slate-500/20 border border-gray-400/20 flex items-center justify-center shrink-0 shadow-lg shadow-gray-500/10">
          <SettingsIcon className="w-6 h-6 text-gray-400" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              Settings & History
            </h1>
          </div>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
            Manage data exports and review your journal logs.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Export Data */}
        <div className="bg-white/60 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-xl backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-2 pb-4 border-b border-gray-200/80 dark:border-white/10">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center">
              <Download className="w-4 h-4 text-blue-400" />
            </div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Export Journal Data
            </h2>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
            Download a complete copy of your trading journal logs, analyses, and metrics.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {exportFormats.map(({ fmt, label, icon, color, border, text }) => (
              <button
                key={fmt}
                onClick={() => handleExport(fmt)}
                disabled={exporting === fmt}
                className={`relative p-5 border ${border} rounded-2xl hover:scale-[1.03] transition-all flex flex-col items-center justify-center text-center gap-3 bg-gradient-to-br ${color} backdrop-blur-xl shadow-sm disabled:opacity-60 group`}
              >
                <div className={`${text} group-hover:scale-110 transition-transform`}>
                  {exporting === fmt ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    icon
                  )}
                </div>
                <span className={`text-xs font-bold ${text} uppercase tracking-widest`}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Journal History Logs */}
        <div className="bg-white/60 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-xl backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-2 pb-4 border-b border-gray-200/80 dark:border-white/10">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-blue-400" />
            </div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Journal History Logs
            </h2>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
            Review your most recent trades directly from your settings before exporting.
          </p>

          <div className="w-full overflow-x-auto">
            {loadingHistory ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
              </div>
            ) : historyTrades.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-10 border border-dashed border-gray-200/80 dark:border-white/10 rounded-2xl">
                No trades logged yet.
              </p>
            ) : (
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-200/80 dark:border-white/10">
                    {["Date", "Asset", "Direction", "Setup", "Net R"].map((h, i) => (
                      <th
                        key={h}
                        className={`pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest ${i === 4 ? "text-right" : ""}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {historyTrades.map((trade) => (
                    <tr
                      key={trade.id}
                      className="border-b border-gray-100/80 dark:border-white/5 hover:bg-white/40 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-4 text-sm text-gray-900 dark:text-white font-medium flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" /> {trade.date}
                      </td>
                      <td className="py-4 text-sm text-gray-900 dark:text-white font-bold">
                        {trade.asset}
                      </td>
                      <td className="py-4 text-sm font-bold">
                        <span
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] border w-fit ${
                            trade.direction === "LONG"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}
                        >
                          {trade.direction === "LONG" ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {trade.direction}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-gray-500 dark:text-gray-400">
                        {trade.setup || "N/A"}
                      </td>
                      <td className="py-4 text-sm font-black text-right">
                        <span
                          className={trade.r_multiple >= 0 ? "text-emerald-400" : "text-red-400"}
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

        {/* Danger Zone */}
        <div className="bg-red-500/5 dark:bg-red-500/5 border border-red-500/20 rounded-2xl p-6 md:p-8 shadow-sm backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <h2 className="text-base font-bold text-red-400">Danger Zone</h2>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
            Permanently wipe all your trade logs from the database. This cannot be reversed.
          </p>
          <button
            onClick={handleDeleteAllTrades}
            disabled={deleting}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-red-500/20 flex items-center gap-2"
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Delete All Trades
          </button>
        </div>
      </div>
    </div>
  );
}
