// frontend/src/pages/PropAccounts.jsx
import { useState } from "react";
import {
  Users,
  Plus,
  ShieldCheck,
  TrendingUp,
  Trash2,
  X,
  ChevronDown,
  Activity,
} from "lucide-react";

export default function PropAccounts() {
  const [accounts, setAccounts] = useState([
    {
      id: 1,
      name: "FTMO $50k Challenge",
      firm: "FTMO",
      balance: "$48,500",
      target: "$52,500",
      drawdown: "$45,000",
      status: "Active",
    },
    {
      id: 2,
      name: "Funding Pips $100k Funded",
      firm: "Funding Pips",
      balance: "$104,200",
      target: "N/A",
      drawdown: "$92,000",
      status: "Passed",
    },
  ]);

  const [isOpen, setIsOpen] = useState(false);
  const [newAcc, setNewAcc] = useState({
    name: "",
    firm: "FTMO",
    balance: "$50,000",
    target: "$53,000",
    drawdown: "$47,000",
  });

  const handleAddAccount = (e) => {
    e.preventDefault();
    if (!newAcc.name) return;
    setAccounts([...accounts, { ...newAcc, id: Date.now(), status: "Active" }]);
    setNewAcc({ name: "", firm: "FTMO", balance: "$50,000", target: "$53,000", drawdown: "$47,000" });
    setIsOpen(false);
  };

  const handleDelete = (id) => {
    setAccounts(accounts.filter((a) => a.id !== id));
  };

  const inputClass =
    "appearance-none w-full bg-white/40 dark:bg-white/[0.04] border border-gray-300/80 dark:border-white/10 rounded-xl px-4 py-3 text-blue-600 dark:text-blue-400 font-bold focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm text-center [text-align-last:center] backdrop-blur-sm transition-all";
  const labelClass = "text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest block mb-2";

  const firmColors = {
    FTMO: { gradient: "from-blue-500/20 to-cyan-500/20", border: "border-blue-500/20", text: "text-blue-400" },
    "Funding Pips": { gradient: "from-emerald-500/20 to-green-500/20", border: "border-emerald-500/20", text: "text-emerald-400" },
    "The Funded Trader": { gradient: "from-violet-500/20 to-purple-500/20", border: "border-violet-500/20", text: "text-violet-400" },
    Apex: { gradient: "from-orange-500/20 to-amber-500/20", border: "border-orange-500/20", text: "text-orange-400" },
    Other: { gradient: "from-gray-500/20 to-slate-500/20", border: "border-gray-500/20", text: "text-gray-400" },
  };

  return (
    <div
      className="w-full max-w-7xl mx-auto font-sans pb-16 px-4 md:px-8 mt-6 md:mt-8 box-border"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header */}
      <div className="mb-8 md:mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-500/20 flex items-center justify-center shrink-0 shadow-lg shadow-pink-500/10">
            <Users className="w-6 h-6 text-pink-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                Prop Firm Accounts
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-pink-400 border border-pink-500/30">
                {accounts.length} Accounts
              </span>
            </div>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
              Manage your evaluation challenges, funded accounts, and risk limits.
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-pink-500/25 text-sm flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Account
        </button>
      </div>

      {/* Account Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((acc) => {
          const colors = firmColors[acc.firm] || firmColors.Other;
          return (
            <div
              key={acc.id}
              className={`relative bg-white/60 dark:bg-white/[0.03] border ${colors.border} rounded-2xl p-6 shadow-xl backdrop-blur-xl overflow-hidden hover:scale-[1.02] transition-transform group`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-50 rounded-2xl`} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs font-black uppercase tracking-widest ${colors.text} px-2.5 py-1 rounded-lg bg-white/20 dark:bg-white/5 border ${colors.border}`}>
                    {acc.firm}
                  </span>
                  <span
                    className={`px-2.5 py-1 text-[9px] font-bold uppercase rounded-full border ${
                      acc.status === "Active"
                        ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                        : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    }`}
                  >
                    {acc.status === "Active" ? "● Active" : "✓ Passed"}
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-5">
                  {acc.name}
                </h3>

                <div className="space-y-3 mb-6">
                  {[
                    { label: "Current Balance", value: acc.balance, color: "text-gray-900 dark:text-white" },
                    { label: "Profit Target", value: acc.target, color: "text-emerald-400" },
                    { label: "Max Drawdown", value: acc.drawdown, color: "text-red-400" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                        {label}
                      </span>
                      <span className={`text-sm font-bold ${color}`}>{value}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-200/80 dark:border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className={`w-3.5 h-3.5 ${colors.text}`} />
                    <span className="text-xs text-gray-400 font-medium">Linked to Journal</span>
                  </div>
                  <button
                    onClick={() => handleDelete(acc.id)}
                    className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Card Placeholder */}
        <button
          onClick={() => setIsOpen(true)}
          className="bg-white/30 dark:bg-white/[0.02] border-2 border-dashed border-gray-300/80 dark:border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:border-pink-400/50 hover:bg-pink-500/5 transition-all group min-h-[200px]"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6 text-pink-400" />
          </div>
          <span className="text-sm font-bold text-gray-500 dark:text-gray-400 group-hover:text-pink-400 transition-colors">
            Add New Account
          </span>
        </button>
      </div>

      {/* Add Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative w-full max-w-md bg-white/95 dark:bg-[#121418]/95 border border-gray-200/80 dark:border-white/10 rounded-3xl shadow-2xl p-6 md:p-8 backdrop-blur-2xl">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-gray-100/80 dark:bg-white/[0.04] text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-500/20 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-pink-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add Prop Account</h3>
            </div>

            <form onSubmit={handleAddAccount} className="space-y-4">
              {[
                { label: "Account Name", key: "name", placeholder: "e.g. FTMO $50k Challenge", type: "text" },
                { label: "Current Balance", key: "balance", placeholder: "$50,000", type: "text" },
                { label: "Profit Target", key: "target", placeholder: "$53,000", type: "text" },
                { label: "Max Drawdown Limit", key: "drawdown", placeholder: "$47,000", type: "text" },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label className={labelClass}>{label}</label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={newAcc[key]}
                    onChange={(e) => setNewAcc({ ...newAcc, [key]: e.target.value })}
                    className={inputClass}
                    required={key === "name"}
                  />
                </div>
              ))}
              <div>
                <label className={labelClass}>Prop Firm</label>
                <div className="relative">
                  <select
                    value={newAcc.firm}
                    onChange={(e) => setNewAcc({ ...newAcc, firm: e.target.value })}
                    className={`${inputClass} pr-10`}
                  >
                    {["FTMO", "Funding Pips", "The Funded Trader", "Apex", "Other"].map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-xl hover:bg-gray-100 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold rounded-2xl text-sm shadow-lg shadow-pink-500/25 transition-all"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
