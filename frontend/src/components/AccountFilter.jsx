// frontend/src/components/AccountFilter.jsx
import { useMemo } from "react";
import { Briefcase, ChevronDown } from "lucide-react";

/**
 * Reusable account filter dropdown.
 * Props:
 *   trades          — full trades array
 *   selectedAccount — currently selected account name ('' = All Accounts)
 *   onChange        — (accountName: string) => void
 *   className       — optional extra classes on wrapper
 */
export default function AccountFilter({ trades = [], selectedAccount = "", onChange, className = "" }) {
  const accounts = useMemo(() => {
    const names = new Set();
    trades.forEach((t) => {
      if (t.account_name && t.account_name.trim()) names.add(t.account_name.trim());
    });
    return Array.from(names).sort();
  }, [trades]);

  if (accounts.length === 0) return null;

  return (
    <div className={`relative flex items-center ${className}`}>
      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-400 pointer-events-none z-10" />
      <select
        value={selectedAccount}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-8 pr-8 py-2 bg-[#101216] border border-white/10 text-white text-[12px] font-medium rounded-lg focus:outline-none focus:border-emerald-500 cursor-pointer hover:border-white/20 transition-colors min-w-[160px]"
      >
        <option value="">All Accounts</option>
        {accounts.map((acc) => (
          <option key={acc} value={acc}>
            {acc}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
    </div>
  );
}
