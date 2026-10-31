// frontend/src/components/AccountFilter.jsx
// Apple macOS / iOS Frosted Glass Account Filter Dropdown
import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, ChevronDown, Check, Plus } from "lucide-react";

export default function AccountFilter({
  trades = [],
  selectedAccount = "",
  onChange,
  onAddAccount,
  className = "",
}) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const accounts = useMemo(() => {
    const names = new Set();
    trades.forEach((t) => {
      const acc = (t.account_name || t.account || "").trim();
      if (acc && acc.toLowerCase() !== "default account") {
        names.add(acc);
      }
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

  const currentDisplay =
    selectedAccount && selectedAccount !== "All Accounts"
      ? selectedAccount
      : "All Accounts";

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="h-10 flex items-center justify-between gap-2.5 px-3.5 bg-white dark:bg-[#121622] border border-black/[0.08] dark:border-white/10 text-neutral-800 dark:text-neutral-200 text-xs font-bold rounded-xl hover:bg-neutral-50 dark:hover:bg-white/[0.06] hover:border-black/20 dark:hover:border-white/20 transition-all min-w-[170px] sm:min-w-[190px] shadow-xs cursor-pointer select-none"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Briefcase className="w-3.5 h-3.5 text-[#0066FF] shrink-0" />
          <span className="truncate">{currentDisplay}</span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#0066FF]" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-full min-w-[210px] bg-white/95 dark:bg-[#121622]/95 border border-black/[0.08] dark:border-white/[0.12] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl z-50 p-1.5 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 space-y-0.5 select-none">
          {/* All Accounts Option */}
          <button
            type="button"
            onClick={() => {
              onChange("");
              setIsOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
              !selectedAccount || selectedAccount === "All Accounts"
                ? "bg-blue-500/10 dark:bg-blue-500/15 text-[#0066FF] dark:text-blue-400 font-bold border border-blue-500/20"
                : "text-neutral-700 dark:text-neutral-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.08]"
            }`}
          >
            <span>All Accounts</span>
            {(!selectedAccount || selectedAccount === "All Accounts") && (
              <Check className="w-3.5 h-3.5 text-[#0066FF] dark:text-blue-400 stroke-[2.5]" />
            )}
          </button>

          {/* Individual Accounts */}
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
                className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? "bg-blue-500/10 dark:bg-blue-500/15 text-[#0066FF] dark:text-blue-400 font-bold border border-blue-500/20"
                    : "text-neutral-700 dark:text-neutral-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.08]"
                }`}
              >
                <span className="truncate">{acc}</span>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-[#0066FF] dark:text-blue-400 stroke-[2.5]" />
                )}
              </button>
            );
          })}

          {/* Add Account Option -> Redirect to /add-trade */}
          <div className="pt-1 mt-1 border-t border-black/[0.06] dark:border-white/[0.08]">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (onAddAccount) onAddAccount();
                else navigate("/add-trade");
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center gap-2 text-[#0066FF] dark:text-blue-400 hover:bg-blue-500/10 dark:hover:bg-blue-500/15 font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Account</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
