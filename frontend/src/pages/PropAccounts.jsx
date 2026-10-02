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
import MasterclassPaywall from "../components/MasterclassPaywall.jsx";

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
            <TrendingUp className="w-6 h-6 text-pink-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                Prop Firm Challenge Guidance - For serious traders only
              </h1>
            </div>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
              Get the exact strategy and rules to pass your prop firm challenges.
            </p>
          </div>
        </div>
      </div>

      <MasterclassPaywall />
    </div>
  );
}
