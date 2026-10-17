import { useState, useEffect, useRef, memo } from "react";
import { X } from "lucide-react";

const SystemAnnouncementBanner = memo(function SystemAnnouncementBanner({
  announcement,
  isDark,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const cardRef = useRef(null);

  // Close on Escape key press
  useEffect(() => {
    if (!isExpanded) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setIsExpanded(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isExpanded]);

  // Click outside to collapse
  useEffect(() => {
    if (!isExpanded) return;
    const onClickOutside = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [isExpanded]);

  if (!announcement || isDismissed) return null;

  const isWarning = announcement.type === "warning";
  const isSuccess = announcement.type === "success";

  const badgeText = isWarning
    ? "Maintenance & Alert"
    : isSuccess
    ? "Special Announcement"
    : "System Notification";

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 max-w-[94vw] sm:max-w-xl pointer-events-auto transform-gpu will-change-transform">
      {!isExpanded ? (
        /* ── COLLAPSED NOTCH PILL ── */
        <div
          onClick={() => setIsExpanded(true)}
          className={`relative overflow-hidden flex items-center justify-between gap-2.5 px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-full border cursor-pointer select-none transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98] transform-gpu will-change-transform ${
            isDark
              ? isWarning
                ? "bg-gradient-to-r from-red-600 to-rose-600 shadow-[0_4px_20px_rgba(239,68,68,0.35)] border-red-400/30 text-white ring-1 ring-white/20"
                : isSuccess
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 shadow-[0_4px_20px_rgba(16,185,129,0.35)] border-emerald-400/30 text-white ring-1 ring-white/20"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_4px_20px_rgba(59,130,246,0.35)] border-blue-400/30 text-white ring-1 ring-white/20"
              : isWarning
              ? "bg-white text-rose-950 shadow-[0_6px_25px_rgba(239,68,68,0.14)] border-red-200 ring-1 ring-red-500/20"
              : isSuccess
              ? "bg-white text-emerald-950 shadow-[0_6px_25px_rgba(16,185,129,0.14)] border-emerald-200 ring-1 ring-emerald-500/20"
              : "bg-white text-blue-950 shadow-[0_6px_25px_rgba(59,130,246,0.14)] border-blue-200 ring-1 ring-blue-500/20"
          }`}
          title="Tap to expand and read full announcement"
        >
          <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
            <img
              src="/logo3d.png"
              alt="ForexNotes"
              className="w-5 h-5 object-contain shrink-0 drop-shadow-sm"
              loading="eager"
            />
            <span
              className={`font-semibold text-xs sm:text-[13px] tracking-wide truncate ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              {announcement.message}
            </span>
            <span
              className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full shrink-0 hidden sm:inline-block ${
                isDark
                  ? "bg-white/20 text-white"
                  : isWarning
                  ? "bg-red-500/10 text-red-700 border border-red-500/20"
                  : isSuccess
                  ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                  : "bg-blue-500/10 text-blue-700 border border-blue-500/20"
              }`}
            >
              Tap to view
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsDismissed(true);
            }}
            className={`ml-1 p-1 rounded-full transition-colors cursor-pointer shrink-0 ${
              isDark
                ? "text-white/80 hover:text-white hover:bg-white/20"
                : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            }`}
            title="Dismiss announcement"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* ── EXPANDED FULL MESSAGE MODAL CARD ── */
        <div
          ref={cardRef}
          className={`relative overflow-hidden w-full max-w-lg rounded-2xl p-5 shadow-2xl border transform-gpu will-change-transform animate-in fade-in zoom-in-95 duration-150 ${
            isDark
              ? isWarning
                ? "bg-[#180808] border-red-500/35 shadow-[0_16px_50px_rgba(0,0,0,0.6)] text-white ring-1 ring-red-500/20"
                : isSuccess
                ? "bg-[#061810] border-emerald-500/35 shadow-[0_16px_50px_rgba(0,0,0,0.6)] text-white ring-1 ring-emerald-500/20"
                : "bg-[#091122] border-blue-500/35 shadow-[0_16px_50px_rgba(0,0,0,0.6)] text-white ring-1 ring-blue-500/20"
              : isWarning
              ? "bg-white border-red-200 shadow-[0_16px_45px_rgba(239,68,68,0.15)] text-gray-900 ring-1 ring-red-500/20"
              : isSuccess
              ? "bg-white border-emerald-200 shadow-[0_16px_45px_rgba(16,185,129,0.15)] text-gray-900 ring-1 ring-emerald-500/20"
              : "bg-white border-blue-200 shadow-[0_16px_45px_rgba(59,130,246,0.15)] text-gray-900 ring-1 ring-blue-500/20"
          }`}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between gap-3 mb-3 pb-2.5 border-b ${
              isDark ? "border-white/10" : "border-gray-100"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <img
                src="/logo3d.png"
                alt="ForexNotes"
                className="w-6 h-6 object-contain shrink-0 drop-shadow-sm"
              />
              <span
                className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  isDark
                    ? isWarning
                      ? "bg-red-500/20 text-red-300 border-red-500/30"
                      : isSuccess
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                    : isWarning
                    ? "bg-red-50 text-red-700 border-red-200"
                    : isSuccess
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                }`}
              >
                {badgeText}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsDismissed(true);
                setIsExpanded(false);
              }}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                isDark
                  ? "text-white/70 hover:text-white hover:bg-white/10"
                  : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              }`}
              title="Dismiss and close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Message */}
          <div
            className={`max-h-[50vh] overflow-y-auto pr-1 text-xs sm:text-sm font-normal leading-relaxed whitespace-pre-line select-text ${
              isDark ? "text-gray-200" : "text-gray-800"
            }`}
          >
            {announcement.message}
          </div>

          {/* Footer Controls */}
          <div
            className={`mt-4 pt-3 flex items-center justify-between text-xs border-t ${
              isDark ? "border-white/10 text-gray-400" : "border-gray-100 text-gray-500"
            }`}
          >
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className={`text-[11px] font-semibold cursor-pointer transition-colors ${
                isDark
                  ? "text-gray-400 hover:text-white"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Collapse
            </button>
            <button
              type="button"
              onClick={() => {
                setIsDismissed(true);
                setIsExpanded(false);
              }}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs shadow-sm ${
                isDark
                  ? "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                  : isWarning
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : isSuccess
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              <X className="w-3.5 h-3.5" /> Dismiss & Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default SystemAnnouncementBanner;
