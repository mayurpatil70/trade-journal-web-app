// frontend/src/components/AccountFilter.jsx
// Apple iOS / macOS Frosted Glass Account Filter
import { useState, useRef, useEffect, useMemo } from "react";
import { Briefcase, ChevronDown, Check } from "lucide-react";

/**
 * Reusable theme-aware Apple frosted glass account filter dropdown.
 * Props:
 *   trades          — full trades array
 *   selectedAccount — currently selected account name ('' = All Accounts)
 *   onChange        — (accountName: string) => void
 *   className       — optional extra classes on wrapper
 */
export default function AccountFilter({
  trades = [],
  selectedAccount = "",
  onChange,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const accounts = useMemo(() => {
    const names = new Set();
    trades.forEach((t) => {
      if (t.account_name && t.account_name.trim()) names.add(t.account_name.trim());
    });
    return Array.from(names).sort();
  }, [trades]);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (accounts.length === 0) return null;

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center justify-between gap-2.5 px-4 py-2.5 bg-white/70 dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-neutral-900 dark:text-white text-[13px] font-medium rounded-2xl hover:bg-white/90 dark:hover:bg-white/[0.08] hover:border-black/20 dark:hover:border-white/20 transition-all duration-200 min-w-[165px] backdrop-blur-xl shadow-sm cursor-pointer"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Briefcase className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span className="truncate">
            {selectedAccount || "All Accounts"}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-emerald-500" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-full min-w-[190px] bg-white/95 dark:bg-[#121622]/95 border border-black/[0.08] dark:border-white/[0.12] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl z-50 p-1.5 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 space-y-0.5">
          {/* All Accounts Option */}
          <button
            type="button"
            onClick={() => {
              onChange("");
              setIsOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-xl text-[12px] transition-colors flex items-center justify-between cursor-pointer ${
              !selectedAccount
                ? "bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20"
                : "text-neutral-700 dark:text-neutral-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.08]"
            }`}
          >
            <span>All Accounts</span>
            {!selectedAccount && (
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            )}
          </button>

          {/* Accounts List */}
          {accounts.map((acc) => {
            const isSelected = selectedAccount === acc;
            return (
              <button
                key={acc}
                type="button"
                onClick={() => {
                  onChange(acc);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-[12px] transition-colors flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? "bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20"
                    : "text-neutral-700 dark:text-neutral-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.08]"
                }`}
              >
                <span className="truncate">{acc}</span>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
