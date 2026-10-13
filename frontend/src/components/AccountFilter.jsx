// frontend/src/components/AccountFilter.jsx
import { useState, useRef, useEffect, useMemo } from "react";
import { Briefcase, ChevronDown, Check } from "lucide-react";

/**
 * Reusable theme-aware account filter dropdown.
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

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (accounts.length === 0) return null;

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center justify-between gap-2.5 px-3 py-2 bg-white dark:bg-[#101216] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-[12px] font-medium rounded-lg hover:border-gray-300 dark:hover:border-white/20 transition-colors min-w-[160px] shadow-sm cursor-pointer"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Briefcase className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
          <span className="truncate">
            {selectedAccount || "All Accounts"}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-full min-w-[180px] bg-white dark:bg-[#101216] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-50 py-1 max-h-60 overflow-y-auto">
          {/* All Accounts Option */}
          <button
            type="button"
            onClick={() => {
              onChange("");
              setIsOpen(false);
            }}
            className={`w-full text-left px-3 py-2 text-[12px] transition-colors flex items-center justify-between ${
              !selectedAccount
                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5"
            }`}
          >
            <span>All Accounts</span>
            {!selectedAccount && (
              <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
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
                className={`w-full text-left px-3 py-2 text-[12px] transition-colors flex items-center justify-between ${
                  isSelected
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5"
                }`}
              >
                <span className="truncate">{acc}</span>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
