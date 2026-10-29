// frontend/src/components/support/SupportFeedbackModal.jsx
// Institutional Help & Feedback Modal (Matches TradeFXBook Help & Feedback Architecture)

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Plus,
  ArrowLeft,
  Send,
  Loader2,
  CheckCircle,
  Paperclip,
  Image as ImageIcon,
  Trash2,
  Inbox,
  AlertCircle,
  Lightbulb,
  CreditCard,
  User,
  HelpCircle,
  Bug,
  ChevronDown,
} from "lucide-react";
import api from "../../api/axios";

const CATEGORIES = [
  { id: "Bug / technical issue", label: "Bug / technical issue", icon: Bug, color: "text-rose-500", bg: "bg-rose-500/10" },
  { id: "Idea / feedback", label: "Idea / feedback", icon: Lightbulb, color: "text-purple-500", bg: "bg-purple-500/10" },
  { id: "Billing", label: "Billing", icon: CreditCard, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { id: "Account", label: "Account", icon: User, color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: "Other", label: "Other", icon: HelpCircle, color: "text-neutral-500", bg: "bg-neutral-500/10" },
];

export default function SupportFeedbackModal({
  isOpen,
  onClose,
  initialMode = "new", // "new" | "list"
}) {
  const [mode, setMode] = useState(initialMode); // "new" | "list" | "detail"
  const [selectedReport, setSelectedReport] = useState(null);

  // Form fields
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Bug / technical issue");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [screenshots, setScreenshots] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successTicket, setSuccessTicket] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const fileInputRef = useRef(null);
  const modalRef = useRef(null);
  const categoryRef = useRef(null);

  // Dismiss category dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setIsCategoryOpen(false);
      }
    };
    if (isCategoryOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCategoryOpen]);

  const userId =
    localStorage.getItem("userId") || localStorage.getItem("userEmail") || "trader";
  const userEmail = localStorage.getItem("userEmail") || userId;
  const storageKey = `fn_support_reports_${userId}`;

  // Load existing user reports from localStorage
  const [reports, setReports] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    if (initialMode) setMode(initialMode);
  }, [initialMode, isOpen]);

  // Handle global paste event for screenshots (Ctrl+V / Cmd+V)
  useEffect(() => {
    if (!isOpen || mode !== "new") return;

    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            addImageFile(file);
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isOpen, mode, screenshots.length]);

  const addImageFile = (file) => {
    if (screenshots.length >= 3) {
      alert("You can attach up to 3 screenshots per report.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      alert("Screenshot exceeds the 3MB size limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setScreenshots((prev) => [...prev, e.target.result]);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => addImageFile(file));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeScreenshot = (index) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim()) {
      setErrorMsg("Please provide a subject for your report.");
      return;
    }
    if (!message.trim()) {
      setErrorMsg("Please provide details of what happened.");
      return;
    }

    setErrorMsg("");
    setIsSubmitting(true);

    try {
      const res = await api.post("/api/support/ticket", {
        subject: subject.trim(),
        category,
        message: message.trim(),
        screenshots,
        userEmail,
      });

      const newTicket = res.data?.ticket || {
        id: `FN-${Date.now().toString(36).toUpperCase()}`,
        subject: subject.trim(),
        category,
        message: message.trim(),
        status: "Open",
        created_at: new Date().toISOString(),
        screenshotsCount: screenshots.length,
      };

      // Save to persisted reports
      const updatedReports = [newTicket, ...reports];
      setReports(updatedReports);
      localStorage.setItem(storageKey, JSON.stringify(updatedReports));

      // Reset form
      setSubject("");
      setMessage("");
      setScreenshots([]);
      setSuccessTicket(newTicket);
      setIsSubmitting(false);

      // Transition to list / detail view after short delay
      setTimeout(() => {
        setSuccessTicket(null);
        setSelectedReport(newTicket);
        setMode("detail");
      }, 1500);
    } catch (err) {
      console.error("Support submission error:", err);
      setIsSubmitting(false);
      setErrorMsg(
        err.response?.data?.error || "Failed to submit report. Please try again."
      );
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/50 dark:bg-black/75 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      {/* Modal Dialog Card */}
      <div
        ref={modalRef}
        className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#121622] rounded-3xl border border-black/[0.08] dark:border-white/[0.12] shadow-[0_24px_64px_rgba(0,0,0,0.18)] dark:shadow-[0_28px_80px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* ── Modal Top Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06] dark:border-white/[0.08]">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">
            Help & feedback
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Modal Body (Split Pane Layout Matching TradeFXBook Screenshot 1) ── */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-[500px]">
          {/* ── LEFT PANE: Your Reports Navigation & List ── */}
          <div className="w-full md:w-[280px] bg-neutral-50/70 dark:bg-white/[0.02] border-b md:border-b-0 md:border-r border-black/[0.06] dark:border-white/[0.08] p-5 flex flex-col justify-between shrink-0">
            <div>
              <div className="mb-4">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Your reports
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                  Report a problem or share an idea. Keep the conversation here.
                </p>
              </div>

              {/* My Reports Tab Button */}
              <button
                onClick={() => {
                  setMode("list");
                  setSelectedReport(null);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all mb-4 ${
                  mode === "list" || mode === "detail"
                    ? "bg-white dark:bg-white/[0.08] text-blue-600 dark:text-blue-400 shadow-sm border border-black/[0.05] dark:border-white/[0.08]"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Inbox className="w-4 h-4" />
                  <span>My reports</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  {reports.length} reports
                </span>
              </button>

              {/* Reports Preview List */}
              <div className="space-y-1.5 overflow-y-auto max-h-[300px] scrollbar-hide">
                {reports.length === 0 ? (
                  <div className="py-8 text-center px-2">
                    <div className="w-10 h-10 rounded-2xl bg-neutral-200/50 dark:bg-white/[0.04] flex items-center justify-center mx-auto mb-2 text-neutral-400">
                      <Inbox className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                      No reports yet.
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Send your first report when you need a hand.
                    </p>
                  </div>
                ) : (
                  reports.map((rep) => (
                    <div
                      key={rep.id}
                      onClick={() => {
                        setSelectedReport(rep);
                        setMode("detail");
                      }}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        selectedReport?.id === rep.id && mode === "detail"
                          ? "bg-white dark:bg-white/[0.08] border-blue-500/30 shadow-sm"
                          : "bg-white/60 dark:bg-white/[0.02] border-black/[0.04] dark:border-white/[0.04] hover:border-black/10 dark:hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-neutral-200/70 dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-300">
                          {rep.category?.split("/")[0]?.trim()}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          {rep.created_at ? new Date(rep.created_at).toLocaleDateString() : "Recent"}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                        {rep.subject}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                        ● {rep.status || "Submitted"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Email helper */}
            <div className="pt-3 border-t border-black/[0.05] dark:border-white/[0.06] text-[11px] text-neutral-400 leading-tight">
              Direct email:{" "}
              <a
                href="mailto:forexnotes26@gmail.com"
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                forexnotes26@gmail.com
              </a>
            </div>
          </div>

          {/* ── RIGHT PANE: New Report Form / Detail View ── */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto flex flex-col justify-between">
            {mode === "new" ? (
              <div>
                {/* Mode Header with Top "+ New report" button */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-black/[0.05] dark:border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    {reports.length > 0 && (
                      <button
                        onClick={() => setMode("list")}
                        className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-neutral-500 transition-colors"
                        title="Back to reports list"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                        New report
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        Tell us what happened, what you expected, and how we can reproduce it.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-default"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New report</span>
                  </button>
                </div>

                {/* Success Notification Banner */}
                {successTicket && (
                  <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2.5 animate-in fade-in">
                    <CheckCircle className="w-5 h-5 shrink-0" />
                    <div>
                      <p className="font-bold">Report successfully submitted!</p>
                      <p className="text-[11px] opacity-90">
                        Reference: {successTicket.id} • Forwarded to the development team.
                      </p>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {errorMsg && (
                  <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Subject Input */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Subject
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. My trades aren't syncing"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-2xl bg-neutral-100/80 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] text-sm text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                    />
                  </div>

                  {/* Category Dropdown (Custom Apple HIG Styled) */}
                  <div ref={categoryRef} className="relative">
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Category
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                      className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-neutral-100/80 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] text-sm text-neutral-900 dark:text-white outline-none focus:border-blue-500 transition-all font-medium text-left"
                    >
                      <span className="flex items-center gap-2">
                        {category}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-neutral-400 transition-transform ${
                          isCategoryOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isCategoryOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white dark:bg-[#1a1e2d] border border-black/[0.08] dark:border-white/[0.12] rounded-2xl shadow-xl overflow-hidden p-1 space-y-0.5 animate-in fade-in duration-150">
                        {CATEGORIES.map((cat) => {
                          const CatIcon = cat.icon;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setCategory(cat.id);
                                setIsCategoryOpen(false);
                              }}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
                                category === cat.id
                                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold"
                                  : "text-neutral-700 dark:text-neutral-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-lg flex items-center justify-center ${cat.bg} ${cat.color}`}
                              >
                                <CatIcon className="w-3 h-3" />
                              </div>
                              <span>{cat.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Message / Details Textarea */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Description
                    </label>
                    <textarea
                      placeholder="Describe the issue, what steps caused it, or any details to reproduce..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      required
                      className="w-full px-4 py-3 rounded-2xl bg-neutral-100/80 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] text-sm text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium resize-none leading-relaxed"
                    />
                  </div>

                  {/* Screenshots Attachment Area (Matches Screenshot 1) */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                        <span>Add screenshots</span>
                      </label>
                      <span className="text-[10px] text-neutral-400">
                        {screenshots.length}/3 attached
                      </span>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    {/* Screenshot Preview Grid */}
                    {screenshots.length > 0 && (
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        {screenshots.map((src, i) => (
                          <div
                            key={i}
                            className="relative w-20 h-20 rounded-xl overflow-hidden border border-black/10 dark:border-white/10 group shadow-sm bg-black/5"
                          >
                            <img
                              src={src}
                              alt={`Screenshot ${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeScreenshot(i)}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600"
                              title="Remove screenshot"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-3 px-4 rounded-2xl border border-dashed border-black/10 dark:border-white/15 bg-neutral-50/50 dark:bg-white/[0.01] hover:bg-neutral-100/60 dark:hover:bg-white/[0.03] transition-all cursor-pointer flex flex-col items-center justify-center text-center"
                    >
                      <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                        Click to upload or drag image files here
                      </p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        Paste images here with Ctrl+V or ⌘V • Up to 3 images • 3 MB each. Don't include passwords or account credentials.
                      </p>
                    </div>
                  </div>

                  {/* Submit Action Button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-xs shadow-md shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      <span>Send report</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : mode === "detail" && selectedReport ? (
              /* Report Detail View */
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-black/[0.05] dark:border-white/[0.06]">
                  <button
                    onClick={() => setMode("list")}
                    className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to reports</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedReport(null);
                      setMode("new");
                    }}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-sm flex items-center gap-1 cursor-pointer hover:bg-blue-700"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New report</span>
                  </button>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      {selectedReport.category}
                    </span>
                    <span className="text-xs text-neutral-400 font-mono">
                      #{selectedReport.id}
                    </span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold ml-auto">
                      ● {selectedReport.status || "Submitted"}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                    {selectedReport.subject}
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Logged on {selectedReport.created_at ? new Date(selectedReport.created_at).toLocaleString() : "Just now"}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.05]">
                  <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                    {selectedReport.message}
                  </p>
                </div>

                {/* Attached screenshots display */}
                {Array.isArray(selectedReport.screenshots) && selectedReport.screenshots.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                      Attached Screenshots ({selectedReport.screenshots.length})
                    </h4>
                    <div className="flex gap-3 flex-wrap">
                      {selectedReport.screenshots.map((img, idx) => (
                        <a
                          key={idx}
                          href={img}
                          target="_blank"
                          rel="noreferrer"
                          className="w-24 h-24 rounded-xl overflow-hidden border border-black/10 dark:border-white/10 hover:opacity-90 transition-opacity"
                        >
                          <img src={img} alt="Attachment" className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-3.5 rounded-xl bg-blue-500/[0.05] border border-blue-500/15 text-xs text-neutral-600 dark:text-neutral-300 flex items-center justify-between">
                  <span>Updates on this report are forwarded to your registered email.</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">forexnotes26@gmail.com</span>
                </div>
              </div>
            ) : (
              /* Reports List View */
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-black/[0.05] dark:border-white/[0.06]">
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                      Your submitted reports ({reports.length})
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Review status and updates on your tickets
                    </p>
                  </div>
                  <button
                    onClick={() => setMode("new")}
                    className="px-3.5 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New report</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {reports.map((rep) => (
                    <div
                      key={rep.id}
                      onClick={() => {
                        setSelectedReport(rep);
                        setMode("detail");
                      }}
                      className="p-4 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.06] hover:border-blue-500/30 transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            {rep.category}
                          </span>
                          <span className="text-xs text-neutral-400 font-mono">
                            #{rep.id}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                          {rep.subject}
                        </h4>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
                          {rep.message}
                        </p>
                      </div>

                      <div className="text-right shrink-0 ml-4">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                          ● {rep.status || "Submitted"}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          {rep.created_at ? new Date(rep.created_at).toLocaleDateString() : "Recent"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
