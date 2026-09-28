// frontend/src/pages/PropAccounts.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  Trash2,
} from "lucide-react";

export default function PropAccounts() {
  const navigate = useNavigate();
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
    setNewAcc({
      name: "",
      firm: "FTMO",
      balance: "$50,000",
      target: "$53,000",
      drawdown: "$47,000",
    });
    setIsOpen(false);
  };

  const handleDelete = (id) => {
    setAccounts(accounts.filter((a) => a.id !== id));
  };

  const optionClass =
    "bg-white !text-gray-900 dark:bg-[#0b131d] dark:!text-white font-medium text-center";
  const inputClass =
    "appearance-none box-border w-full min-h-[48px] block bg-gray-50 dark:bg-[#0b131d] border border-gray-300 dark:border-[#1f2c3b] rounded-[2px] px-4 py-3 !text-[#2f8df4] [-webkit-text-fill-color:#2f8df4] font-bold focus:border-[#2f8df4] outline-none text-sm text-center [text-align-last:center]";

  return (
    <div
      className="w-full max-w-7xl mx-auto font-sans pb-16 px-4 md:px-8 mt-6 md:mt-8 box-border"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header */}
      <div className="mb-8 md:mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-[2px] bg-[#94a3b8]/10 flex items-center justify-center border border-[#94a3b8]/20 shrink-0">
            <Users className="w-5 h-5 md:w-6 md:h-6 text-[#94a3b8]" />
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-1">
              Prop Firm Accounts
            </h1>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
              Manage your evaluation challenges, funded accounts, and risk
              limits.
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="px-6 py-3 bg-[#2f8df4] hover:bg-[#2376e8] text-white font-bold rounded-[2px] transition-all shadow-md text-sm flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Account
        </button>
      </div>

      {/* Account Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-6 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-white/5">
                <span className="text-xs font-bold text-[#2f8df4] uppercase tracking-wider">
                  {acc.firm}
                </span>
                <span
                  className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-[2px] border ${acc.status === "Active" ? "bg-[#2f8df4]/10 text-[#2f8df4] border-[#2f8df4]/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"}`}
                >
                  {acc.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {acc.name}
              </h3>

              <div className="space-y-2 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-400 text-xs uppercase tracking-widest">
                    Current Balance
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {acc.balance}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-xs uppercase tracking-widest">
                    Profit Target
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {acc.target}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-xs uppercase tracking-widest">
                    Max Drawdown
                  </span>
                  <span className="font-bold text-red-500">{acc.drawdown}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">
                Linked to Journal
              </span>
              <button
                onClick={() => handleDelete(acc.id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="relative w-full max-w-md bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/10 rounded-[2px] shadow-2xl p-6 md:p-8">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
              Add Prop Account
            </h3>

            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. FTMO $50k Challenge"
                  value={newAcc.name}
                  onChange={(e) =>
                    setNewAcc({ ...newAcc, name: e.target.value })
                  }
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                  Prop Firm
                </label>
                <select
                  value={newAcc.firm}
                  onChange={(e) =>
                    setNewAcc({ ...newAcc, firm: e.target.value })
                  }
                  className={inputClass}
                >
                  <option value="FTMO" className={optionClass}>
                    FTMO
                  </option>
                  <option value="Funding Pips" className={optionClass}>
                    Funding Pips
                  </option>
                  <option value="The Funded Trader" className={optionClass}>
                    The Funded Trader
                  </option>
                  <option value="Apex" className={optionClass}>
                    Apex
                  </option>
                  <option value="Other" className={optionClass}>
                    Other
                  </option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                  Current Balance
                </label>
                <input
                  type="text"
                  value={newAcc.balance}
                  onChange={(e) =>
                    setNewAcc({ ...newAcc, balance: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                  Profit Target
                </label>
                <input
                  type="text"
                  value={newAcc.target}
                  onChange={(e) =>
                    setNewAcc({ ...newAcc, target: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                  Max Drawdown Limit
                </label>
                <input
                  type="text"
                  value={newAcc.drawdown}
                  onChange={(e) =>
                    setNewAcc({ ...newAcc, drawdown: e.target.value })
                  }
                  className={inputClass}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold text-gray-500 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#2f8df4] hover:bg-[#2376e8] text-white font-bold rounded-[2px] text-xs"
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
