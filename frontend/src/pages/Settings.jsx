// frontend/src/pages/Settings.jsx
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
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
  ArrowUp,
  ArrowDown,
  FileText,
  Table,
  FileType,
  X,
  Pencil,
  Eye,
  Brain,
  Target,
  ArrowRight,
  Image as ImageIcon,
} from "lucide-react";
import api from "../api/axios";

const normalizeTradeR = (t) => {
  if (!t) return 0;
  const isLoss = (t.result || "").toLowerCase() === "loss";
  const isBe = (t.result || "").toLowerCase() === "be";
  const num = Number(t.r_multiple ?? t.rMultiple ?? 0);
  if (isLoss) {
    if (num > 0) return -num;
    if (num === 0) return -1;
    return num;
  }
  if (isBe) return 0;
  return num;
};

export default function Settings() {
  const navigate = useNavigate();
  const [exporting, setExporting] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [historyTrades, setHistoryTrades] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedTrade, setSelectedTrade] = useState(null);

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

  const handleExport = async (format, tradeId = null) => {
    const userId =
      localStorage.getItem("userId") || localStorage.getItem("userEmail");
    if (!userId) return alert("User session not found.");

    const exportKey = tradeId ? `${format}-${tradeId}` : format;
    setExporting(exportKey);
    try {
      const urlQuery = tradeId
        ? `/api/trades/export?userId=${userId}&format=${format}&tradeId=${tradeId}`
        : `/api/trades/export?userId=${userId}&format=${format}`;

      const response = await api.get(urlQuery, {
        responseType: "blob",
        timeout: 120000,
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const ext = { excel: "xlsx", doc: "docx" }[format] || format;
      const downloadName = tradeId && selectedTrade
        ? `trade_${selectedTrade.asset || "detail"}_${selectedTrade.date || "export"}.${ext}`
        : `trade_journal.${ext}`;
      link.setAttribute("download", downloadName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(error);
      alert(`Failed to export as ${format.toUpperCase()}.`);
    } finally {
      setExporting("");
    }
  };

  const handleDeleteTrade = async (tradeId) => {
    if (!window.confirm("Are you sure you want to delete this trade?")) return;
    try {
      await api.delete(`/api/trades/${tradeId}`);
      setHistoryTrades((prev) => prev.filter((t) => t.id !== tradeId));
      if (selectedTrade?.id === tradeId) setSelectedTrade(null);
    } catch (error) {
      console.error("Delete Trade Error:", error);
      alert("Failed to delete trade.");
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
      setSelectedTrade(null);
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
    { fmt: "excel", label: "Excel", icon: <Table className="w-5 h-5" />, color: "from-emerald-500/20 to-emerald-500/20", border: "border-emerald-500/20", text: "text-emerald-400" },
    { fmt: "doc", label: "Word (1 Trade / Page)", icon: <FileText className="w-5 h-5" />, color: "from-black/5 to-black/10 dark:from-white/10 dark:to-white/5", border: "border-black/10 dark:border-white/10", text: "text-neutral-700 dark:text-neutral-300" },
    { fmt: "pdf", label: "PDF (1 Trade / Page)", icon: <FileType className="w-5 h-5" />, color: "from-red-500/20 to-rose-500/20", border: "border-red-500/20", text: "text-red-400" },
  ];

  return (
    <div
      className="w-full max-w-5xl mx-auto font-sans pb-16 px-4 md:px-8 mt-6 md:mt-8"
      style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* Header */}
      <div className="mb-8 md:mb-10 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-neutral-500/10 to-slate-500/10 dark:from-neutral-500/20 dark:to-slate-500/20 border border-black/[0.06] dark:border-white/10 flex items-center justify-center shrink-0 shadow-sm">
          <SettingsIcon className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              Settings & History
            </h1>
          </div>
          <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400">
            Manage data exports and review your trade execution logs.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Export Data (Apple Bento Card) */}
        <div className="mac-bento-card rounded-3xl p-6 md:p-8 backdrop-blur-2xl">
          <div className="flex items-center gap-3 mb-2 pb-4 border-b border-black/[0.05] dark:border-white/10">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center">
              <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              Export Journal Data
            </h2>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6">
            Download a clean copy of your trading journal. PDF and Word exports format each trade on its own dedicated page with execution parameters, notes, and chart screenshots.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {exportFormats.map(({ fmt, label, icon, color, border, text }) => (
              <button
                key={fmt}
                onClick={() => handleExport(fmt)}
                disabled={exporting === fmt}
                className={`relative p-5 border ${border} rounded-2xl hover:scale-[1.03] transition-all duration-300 flex flex-col items-center justify-center text-center gap-3 bg-gradient-to-br ${color} backdrop-blur-xl shadow-sm hover:shadow-md disabled:opacity-60 active:scale-95 cursor-pointer group`}
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

        {/* Journal History Logs (Apple Bento Card) */}
        <div className="mac-bento-card rounded-3xl p-6 md:p-8 backdrop-blur-2xl">
          <div className="flex items-center justify-between mb-2 pb-4 border-b border-black/[0.05] dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                  Journal History Logs
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Click any trade row below to inspect its full trade architecture, psychology, and screenshots.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 bg-black/[0.04] dark:bg-white/5 px-2.5 py-1 rounded-full border border-black/[0.05] dark:border-white/10">
              {historyTrades.length} {historyTrades.length === 1 ? "Trade" : "Trades"}
            </span>
          </div>

          <div className="w-full overflow-x-auto">
            {loadingHistory ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 text-emerald-500 dark:text-emerald-400 animate-spin" />
              </div>
            ) : historyTrades.length === 0 ? (
              <p className="text-sm text-neutral-400 dark:text-neutral-500 text-center py-10 border border-dashed border-black/[0.08] dark:border-white/10 rounded-2xl">
                No trades logged yet.
              </p>
            ) : (
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-black/[0.05] dark:border-white/10">
                    {["Date", "Asset", "Direction", "Setup", "Net R", ""].map((h, i) => (
                      <th
                        key={i}
                        className={`pb-3 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest ${i === 4 ? "text-right" : i === 5 ? "text-right w-24" : ""}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {historyTrades.map((trade) => {
                    const normR = normalizeTradeR(trade);
                    const isLoss = (trade.result || "").toLowerCase() === "loss" || normR < 0;
                    return (
                      <tr
                        key={trade.id}
                        onClick={() => setSelectedTrade(trade)}
                        className="border-b border-black/[0.03] dark:border-white/5 hover:bg-emerald-500/[0.04] dark:hover:bg-white/[0.03] transition-colors cursor-pointer group"
                      >
                        <td className="py-4 text-sm text-neutral-900 dark:text-white font-medium flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-neutral-400" /> {trade.date}
                        </td>
                        <td className="py-4 text-sm text-neutral-900 dark:text-white font-bold">
                          {trade.asset}
                        </td>
                        <td className="py-4 text-sm font-bold">
                          <span
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border w-fit ${
                              trade.direction === "LONG"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                            }`}
                          >
                            {trade.direction === "LONG" ? (
                              <ArrowUp className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-red-500" />
                            )}
                            {trade.direction}
                          </span>
                        </td>
                        <td className="py-4 text-sm text-neutral-600 dark:text-neutral-400">
                          {trade.setup || "N/A"}
                        </td>
                        <td className="py-4 text-sm font-black text-right">
                          <span className={isLoss ? "text-rose-500 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>
                            {normR >= 0 ? "+" : ""}
                            {normR.toFixed(2)}R
                          </span>
                        </td>
                        <td className="py-4 text-sm text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTrade(trade);
                            }}
                            className="p-1.5 rounded-xl bg-black/[0.04] dark:bg-white/5 hover:bg-emerald-500/15 text-neutral-700 dark:text-neutral-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1 text-xs font-semibold px-2.5"
                            title="View Trade Detail"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Danger Zone (Apple Bento Card) */}
        <div className="mac-bento-card rounded-3xl p-6 md:p-8 backdrop-blur-2xl border-rose-500/20 bg-rose-500/[0.03] dark:bg-rose-500/[0.05]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <h2 className="text-base font-bold text-rose-600 dark:text-rose-400">Danger Zone</h2>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6">
            Permanently wipe all your trade logs from the database. This cannot be reversed.
          </p>
          <button
            onClick={handleDeleteAllTrades}
            disabled={deleting}
            className="px-6 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-rose-500/25 flex items-center gap-2 active:scale-95 cursor-pointer"
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

      {/* TRADE DETAIL MODAL (React Portal - Crash-free & Theme-adaptive) */}
      {selectedTrade &&
        createPortal(
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
            <div
              className="absolute inset-0"
              onClick={() => setSelectedTrade(null)}
            />

            <div className="relative w-full max-w-4xl max-h-[90vh] bg-white/95 dark:bg-[#121622]/95 border border-black/[0.08] dark:border-white/[0.12] rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.2)] dark:shadow-[0_30px_80px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden backdrop-blur-2xl animate-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="px-6 py-5 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                      selectedTrade.direction === "LONG"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                    }`}
                  >
                    {selectedTrade.direction === "LONG" ? (
                      <ArrowUp className="w-2.5 h-2.5 text-emerald-500" />
                    ) : (
                      <ArrowDown className="w-2.5 h-2.5 text-red-500" />
                    )}
                    {selectedTrade.direction}
                  </span>
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                    {selectedTrade.asset}
                  </h2>
                  <span className="text-neutral-500 dark:text-neutral-400 text-sm">
                    • {selectedTrade.date}{selectedTrade.time ? ` • ${selectedTrade.time}` : ""}
                  </span>
                  {selectedTrade.account_name && (
                    <span className="text-xs text-neutral-600 dark:text-neutral-300 bg-black/[0.04] dark:bg-white/5 px-2.5 py-0.5 rounded-full border border-black/[0.05] dark:border-white/10 font-semibold">
                      {selectedTrade.account_name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Single Trade Export Buttons */}
                  <button
                    type="button"
                    onClick={() => handleExport("pdf", selectedTrade.id)}
                    disabled={exporting === `pdf-${selectedTrade.id}`}
                    className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-rose-500/20"
                    title="Export this trade as PDF"
                  >
                    {exporting === `pdf-${selectedTrade.id}` ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileType className="w-3.5 h-3.5" />
                    )}
                    PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport("doc", selectedTrade.id)}
                    disabled={exporting === `doc-${selectedTrade.id}`}
                    className="px-2.5 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-violet-500/20"
                    title="Export this trade as Word Document"
                  >
                    {exporting === `doc-${selectedTrade.id}` ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileText className="w-3.5 h-3.5" />
                    )}
                    Word
                  </button>
                  <button
                    onClick={() =>
                      navigate(`/add-trade?edit=${selectedTrade.id}`)
                    }
                    className="p-2 bg-black/[0.04] dark:bg-white/5 hover:bg-emerald-500/15 rounded-xl text-emerald-600 dark:text-emerald-400 transition-colors"
                    title="Edit Trade"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTrade(selectedTrade.id)}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500 rounded-xl text-rose-500 hover:text-white transition-all"
                    title="Delete Trade"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedTrade(null)}
                    className="p-2 bg-black/[0.04] dark:bg-white/5 hover:bg-black/[0.08] dark:hover:bg-white/10 rounded-xl text-neutral-500 dark:text-neutral-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Top Stats */}
                {(() => {
                  const selR = normalizeTradeR(selectedTrade);
                  const selIsLoss =
                    (selectedTrade.result || "").toLowerCase() === "loss" ||
                    selR < 0;
                  const selLot =
                    selectedTrade.lot_size ??
                    selectedTrade.executions?.[0]?.lot_size;
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        {
                          label: "Net R",
                          value: `${selR >= 0 ? "+" : ""}${selR.toFixed(2)}R`,
                          isNet: true,
                          isLoss: selIsLoss,
                        },
                        {
                          label: "Result",
                          value: selectedTrade.result?.toUpperCase(),
                          isResult: true,
                          isLoss: selIsLoss,
                        },
                        { label: "Setup", value: selectedTrade.setup || "—" },
                        { label: "Session", value: selectedTrade.session || "—" },
                        { label: "Entry", value: selectedTrade.entry ?? "—" },
                        { label: "Stop Loss", value: selectedTrade.sl ?? "—" },
                        { label: "Take Profit", value: selectedTrade.tp ?? "—" },
                        {
                          label: selLot ? `Risk % (${selLot}L)` : "Risk %",
                          value: selectedTrade.risk
                            ? `${Number(selectedTrade.risk).toFixed(2)}%`
                            : selLot
                            ? `${selLot} Lots`
                            : "—",
                        },
                      ].map((s, i) => (
                        <div
                          key={i}
                          className="bg-black/[0.025] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.08] p-4 rounded-2xl"
                        >
                          <p className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-1">
                            {s.label}
                          </p>
                          <p
                            className={`text-[15px] font-bold ${
                              s.isNet || s.isResult
                                ? s.isLoss
                                  ? "text-rose-500 dark:text-rose-400"
                                  : "text-emerald-600 dark:text-emerald-400"
                                : "text-neutral-900 dark:text-white"
                            }`}
                          >
                            {s.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* Notes & Psychology */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Target className="w-3.5 h-3.5" /> Analysis
                      </h3>
                      <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed bg-black/[0.025] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.08] p-4 rounded-2xl min-h-[100px] whitespace-pre-wrap font-medium">
                        {selectedTrade.reason || "No analysis recorded."}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5" /> Lesson
                      </h3>
                      <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed bg-black/[0.025] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.08] p-4 rounded-2xl min-h-[100px] whitespace-pre-wrap font-medium">
                        {selectedTrade.lesson || "No lesson recorded."}
                      </p>
                    </div>
                  </div>

                  <div className="bg-black/[0.025] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.08] p-5 rounded-2xl flex flex-col">
                    <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Brain className="w-3.5 h-3.5" /> Psychology
                    </h3>
                    <div className="flex items-center gap-4 mb-4 pb-4 border-b border-black/[0.05] dark:border-white/[0.06]">
                      <div className="flex-1">
                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase mb-1">
                          Emotion Before
                        </p>
                        <p className="text-sm font-bold text-neutral-900 dark:text-white">
                          {selectedTrade.emotion_before || "—"}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-neutral-400 dark:text-neutral-600" />
                      <div className="flex-1">
                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase mb-1">
                          Emotion After
                        </p>
                        <p className="text-sm font-bold text-neutral-900 dark:text-white">
                          {selectedTrade.emotion_after || "—"}
                        </p>
                      </div>
                    </div>
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase mb-2">
                      Psychological Notes
                    </p>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed flex-1 whitespace-pre-wrap font-medium">
                      {selectedTrade.psych_note || "No notes recorded."}
                    </p>
                  </div>
                </div>

                {/* Execution Evidence Screenshots */}
                {selectedTrade.images && selectedTrade.images.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <ImageIcon className="w-3.5 h-3.5" /> Execution Evidence
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedTrade.images.map((img, i) => (
                        <div
                          key={i}
                          onClick={() => window.open(img, "_blank")}
                          className="relative aspect-video rounded-2xl overflow-hidden border border-black/[0.08] dark:border-white/10 group cursor-pointer shadow-sm hover:shadow"
                        >
                          <img
                            src={img}
                            alt="Trade Chart"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="bg-black/80 text-white text-xs px-3 py-1.5 rounded-xl border border-white/20">
                              View Full Size
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
