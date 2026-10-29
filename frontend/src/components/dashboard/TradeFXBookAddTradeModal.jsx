import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  X,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Loader2,
  Briefcase,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import DateTimePickerPopover from "../ui/DateTimePickerPopover";
import AppleSelect from "../ui/AppleSelect";
import { validateTradeAgainstRules } from "../../utils/guardrailValidator";
import RuleBreachAlert from "../guardrails/RuleBreachAlert";
import { invalidateTradeCache } from "../../utils/tradeCache";
import api from "../../api/axios";

export default function TradeFXBookAddTradeModal({ isOpen, onClose, onTradeAdded, trades = [], activeAccount = "" }) {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId") || localStorage.getItem("userEmail") || "trader";

  const disciplineRules = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(`trader_discipline_${userId}`) || "{}");
    } catch (e) {
      return {};
    }
  }, [userId]);

  const availableAccounts = useMemo(() => {
    const set = new Set();
    trades.forEach((t) => {
      const a = (t.account_name || t.accountName || "").trim();
      if (a && a !== "All Accounts") set.add(a);
    });
    if (activeAccount && activeAccount !== "All Accounts") set.add(activeAccount.trim());
    if (set.size === 0) set.add("Default Account");
    return Array.from(set).sort();
  }, [trades, activeAccount]);

  const [accountName, setAccountName] = useState(() => {
    return activeAccount && activeAccount !== "All Accounts"
      ? activeAccount
      : (availableAccounts[0] || "Default Account");
  });

  useEffect(() => {
    if (activeAccount && activeAccount !== "All Accounts") {
      setAccountName(activeAccount);
    }
  }, [activeAccount, isOpen]);

  const [direction, setDirection] = useState("LONG");
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [exitPrice, setExitPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [profitUsd, setProfitUsd] = useState("");
  const [riskPercent, setRiskPercent] = useState(() => {
    const raw = disciplineRules?.maxRiskPerTrade || "1.0";
    return String(raw).replace("%", "");
  });
  const [entryDateTime, setEntryDateTime] = useState(() => new Date());
  const [exitDateTime, setExitDateTime] = useState(null);
  const [notes, setNotes] = useState("");
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [checklist, setChecklist] = useState({
    trend: false,
    news: false,
    risk: false,
    invalidation: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [beforeImage, setBeforeImage] = useState(null);
  const [beforePreview, setBeforePreview] = useState(null);
  const [afterImage, setAfterImage] = useState(null);
  const [afterPreview, setAfterPreview] = useState(null);

  const handleBeforeFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setBeforeImage(file);
      setBeforePreview(URL.createObjectURL(file));
      setErrorMsg("");
    }
  };

  const handleAfterFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAfterImage(file);
      setAfterPreview(URL.createObjectURL(file));
      setErrorMsg("");
    }
  };

  const handleClose = () => {
    if (beforePreview && beforePreview.startsWith("blob:")) URL.revokeObjectURL(beforePreview);
    if (afterPreview && afterPreview.startsWith("blob:")) URL.revokeObjectURL(afterPreview);
    setBeforeImage(null);
    setBeforePreview(null);
    setAfterImage(null);
    setAfterPreview(null);
    setErrorMsg("");
    onClose();
  };

  // Real-time Guardrails Validation ACCOUNT-WISE
  const guardrailValidation = useMemo(() => {
    return validateTradeAgainstRules({
      trade: {
        risk: riskPercent,
        riskPercent,
        entry: entryPrice,
        sl: stopLoss,
        tp: exitPrice,
        accountName,
      },
      rules: disciplineRules,
      allTrades: trades,
      accountName,
    });
  }, [riskPercent, entryPrice, stopLoss, exitPrice, disciplineRules, trades, accountName]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!symbol.trim()) {
      setErrorMsg("Please enter a trading symbol (e.g. XAUUSD).");
      return;
    }
    if (!entryPrice || isNaN(Number(entryPrice))) {
      setErrorMsg("Please enter a valid entry price.");
      return;
    }
    if (!beforeImage || !afterImage) {
      setErrorMsg("Please upload both Before Entry and After Exit screenshots (*).");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const userId = localStorage.getItem("userId") || localStorage.getItem("userEmail");
      const eDate = entryDateTime || new Date();
      const formatLocalDate = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      };
      const formatLocalTime = (d) => {
        const h = String(d.getHours()).padStart(2, "0");
        const min = String(d.getMinutes()).padStart(2, "0");
        return `${h}:${min}`;
      };

      const dateStr = formatLocalDate(eDate);
      const timeStr = formatLocalTime(eDate);

      let exDateStr = null;
      let exTimeStr = null;
      if (exitDateTime) {
        exDateStr = formatLocalDate(exitDateTime);
        exTimeStr = formatLocalTime(exitDateTime);
      }

      // Compute result if exit price is provided
      let result = "open";
      let rMultiple = 0;
      const numEntry = Number(entryPrice);
      const numExit = exitPrice ? Number(exitPrice) : null;
      
      if (numExit !== null && !isNaN(numExit)) {
        if (direction === "LONG") {
          result = numExit > numEntry ? "win" : numExit < numEntry ? "loss" : "be";
        } else {
          result = numExit < numEntry ? "win" : numExit > numEntry ? "loss" : "be";
        }
      }

      const numRisk = riskPercent ? Number(riskPercent) : 1.0;
      const numSl = stopLoss ? Number(stopLoss) : null;
      const numPnl = profitUsd !== "" && !isNaN(Number(profitUsd)) ? Number(profitUsd) : undefined;

      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("account_name", accountName || "Default Account");
      formData.append("accountName", accountName || "Default Account");
      formData.append("asset", symbol.trim().toUpperCase());
      formData.append("direction", direction);
      formData.append("entry", numEntry);
      if (numExit !== null && !isNaN(numExit)) {
        formData.append("exit_price", numExit);
        formData.append("exitPrice", numExit);
      }
      if (numSl !== null && !isNaN(numSl)) {
        formData.append("sl", numSl);
        formData.append("stop_loss", numSl);
      }
      if (quantity && !isNaN(Number(quantity))) {
        formData.append("lot_size", Number(quantity));
        formData.append("lotSize", Number(quantity));
      }
      formData.append("date", dateStr);
      formData.append("time", timeStr);
      formData.append("entry_date", dateStr);
      formData.append("entry_time", timeStr);
      if (exDateStr) {
        formData.append("exit_date", exDateStr);
        formData.append("exit_time", exTimeStr);
      }
      formData.append("result", result);
      if (notes.trim()) formData.append("reason", notes.trim());
      if (numPnl !== undefined) {
        formData.append("pnl", numPnl);
        formData.append("profit", numPnl);
      }
      formData.append("risk", numRisk);
      formData.append("risk_percent", numRisk);
      formData.append("source", "Manual");
      formData.append("images", beforeImage, beforeImage.name || `before_entry_${Date.now()}.png`);
      formData.append("images", afterImage, afterImage.name || `after_exit_${Date.now()}.png`);

      const res = await api.post("/api/trades", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.success || res.status === 201) {
        invalidateTradeCache();
        if (onTradeAdded) onTradeAdded(res.data.data);
        onClose();
      } else {
        setErrorMsg(res.data?.error || "Failed to save trade.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || "Error saving trade. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/45 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-[480px] bg-white dark:bg-[#121622] border border-black/[0.08] dark:border-white/[0.12] rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.2)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.8)] backdrop-blur-2xl p-6 relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 scrollbar-hide"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header (Screenshots 4 & 5) */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Add Trade</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Red Rule Breach Alert Card */}
        {guardrailValidation.isBreached && (
          <div className="mb-4">
            <RuleBreachAlert
              breach={guardrailValidation.primaryBreach}
              onNavigateToRules={() => {
                onClose();
                navigate("/profile?tab=profile&highlight=rules#trading-rules");
              }}
            />
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Selector (Account-Wise Boundaries) */}
          <div className="p-3 rounded-2xl bg-neutral-50/80 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
                <span>Trading Account</span>
              </label>
              <span className="text-[10px] text-neutral-400 font-mono">Boundaries tracked per account</span>
            </div>
            <AppleSelect
              value={accountName}
              onChange={(e) => setAccountName(typeof e === "object" && e !== null ? (e.target?.value ?? e.value) : e)}
              options={availableAccounts}
              placeholder="Select Trading Account"
              compact
            />
          </div>

          {/* Direction Pill Selector (Screenshots 4 & 5) */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 dark:bg-white/[0.05] rounded-2xl border border-black/[0.04] dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => setDirection("LONG")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                direction === "LONG"
                  ? "bg-white dark:bg-[#1c2233] text-emerald-600 dark:text-emerald-400 shadow-sm border border-black/[0.05] dark:border-white/[0.1]"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <ArrowUpRight className="w-4 h-4 text-emerald-500" />
              <span>Long</span>
            </button>
            <button
              type="button"
              onClick={() => setDirection("SHORT")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                direction === "SHORT"
                  ? "bg-white dark:bg-[#1c2233] text-rose-500 dark:text-rose-400 shadow-sm border border-black/[0.05] dark:border-white/[0.1]"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <ArrowDownRight className="w-4 h-4 text-rose-500" />
              <span>Short</span>
            </button>
          </div>

          {/* Symbol & Quantity Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                Symbol
              </label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="E.G. XAUUSD"
                className="w-full h-11 px-3.5 rounded-xl border border-black/[0.08] dark:border-white/[0.12] bg-white/70 dark:bg-white/[0.04] text-neutral-900 dark:text-white text-sm font-medium placeholder-neutral-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all uppercase"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                Quantity
              </label>
              <input
                type="number"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Lots"
                className="w-full h-11 px-3.5 rounded-xl border border-black/[0.08] dark:border-white/[0.12] bg-white/70 dark:bg-white/[0.04] text-neutral-900 dark:text-white text-sm font-medium placeholder-neutral-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
          </div>

          {/* Entry Price & Exit Price Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                Entry Price
              </label>
              <input
                type="number"
                step="any"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="0.00"
                className="w-full h-11 px-3.5 rounded-xl border border-black/[0.08] dark:border-white/[0.12] bg-white/70 dark:bg-white/[0.04] text-neutral-900 dark:text-white text-sm font-medium placeholder-neutral-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                Exit Price
              </label>
              <input
                type="number"
                step="any"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                placeholder="Optional"
                className="w-full h-11 px-3.5 rounded-xl border border-black/[0.08] dark:border-white/[0.12] bg-white/70 dark:bg-white/[0.04] text-neutral-900 dark:text-white text-sm font-medium placeholder-neutral-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono"
              />
            </div>
          </div>

          {/* Risk / Trade (%) & Stop Loss (Invalidation) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Risk / Trade (%)
                </label>
                <span className="text-[10px] font-bold text-neutral-400 font-mono">
                  Ceiling: {disciplineRules.maxRiskPerTrade || "2%"}
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(e.target.value)}
                  placeholder="1.0"
                  className={`w-full h-11 px-3.5 pr-8 rounded-xl border bg-white/70 dark:bg-white/[0.04] text-neutral-900 dark:text-white text-sm font-medium outline-none transition-all font-mono ${
                    guardrailValidation.breaches.some((b) => b.ruleKey === "maxRiskPerTrade")
                      ? "border-rose-500 ring-2 ring-rose-500/20 text-rose-500 font-bold"
                      : "border-black/[0.08] dark:border-white/[0.12] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  }`}
                  required
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400 pointer-events-none font-mono">
                  %
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                Stop Loss Price
              </label>
              <input
                type="number"
                step="any"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="Optional"
                className="w-full h-11 px-3.5 rounded-xl border border-black/[0.08] dark:border-white/[0.12] bg-white/70 dark:bg-white/[0.04] text-neutral-900 dark:text-white text-sm font-medium placeholder-neutral-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono"
              />
            </div>
          </div>

          {/* Profit Made in USD ($) */}
          <div className="space-y-1.5 p-3 rounded-2xl bg-neutral-50 dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08]">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                Profit / Loss Made ($ USD)
              </label>
              <span className="text-[10px] font-mono text-neutral-400">
                {Number(profitUsd) > 0 ? "Win (+)" : Number(profitUsd) < 0 ? "Loss (-)" : "Optional / $0.00"}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-neutral-400 font-mono pointer-events-none">
                $
              </span>
              <input
                type="number"
                step="any"
                value={profitUsd}
                onChange={(e) => setProfitUsd(e.target.value)}
                placeholder={direction === "SHORT" ? "-150.00 or +250.00" : "+250.00 or -150.00"}
                className={`w-full h-11 pl-8 pr-3.5 rounded-xl border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-white/[0.04] text-sm font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono ${
                  Number(profitUsd) > 0
                    ? "text-emerald-500 dark:text-emerald-400 font-bold"
                    : Number(profitUsd) < 0
                    ? "text-rose-500 dark:text-rose-400 font-bold"
                    : "text-neutral-900 dark:text-white"
                }`}
              />
            </div>
            <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400/90 leading-tight flex items-start gap-1 pt-0.5">
              <span>⚠️</span>
              <span>&ldquo;dear trader please enter exact profit made in current trade dont fool yourself by entering big profits for flex&rdquo;</span>
            </p>
          </div>

          {/* Entry Date & Exit Date Popover Selectors (Screenshots 4 & 5) */}
          <div className="grid grid-cols-2 gap-3">
            <DateTimePickerPopover
              label="Entry Date (GMT+0:00)"
              value={entryDateTime}
              onChange={setEntryDateTime}
              placeholder="Select Entry"
            />
            <DateTimePickerPopover
              label="Exit Date (GMT+0:00)"
              value={exitDateTime}
              onChange={setExitDateTime}
              placeholder="Optional"
            />
          </div>

          {/* Pre-Trade Checklist (Optional) Collapsible (Screenshot 4 & 5) */}
          <div className="border border-black/[0.06] dark:border-white/[0.08] rounded-2xl overflow-hidden bg-neutral-50/50 dark:bg-white/[0.02]">
            <button
              type="button"
              onClick={() => setIsChecklistOpen(!isChecklistOpen)}
              className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ChevronRight
                  className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${
                    isChecklistOpen ? "rotate-90 text-emerald-500" : ""
                  }`}
                />
                <span>Pre-Trade Checklist (Optional)</span>
              </div>
              <span className="text-[10px] text-neutral-400">
                {Object.values(checklist).filter(Boolean).length}/4 Done
              </span>
            </button>

            {isChecklistOpen && (
              <div className="px-4 pb-3 pt-1 space-y-2 border-t border-black/[0.04] dark:border-white/[0.06] text-xs">
                {[
                  { key: "trend", label: "Confirmed higher timeframe market trend / bias" },
                  { key: "news", label: "Checked economic news feed (no red folder events imminent)" },
                  { key: "risk", label: "Risk strictly managed within 1-2% max parameters" },
                  { key: "invalidation", label: "Clear structural invalidation / stop loss identified" },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center gap-2.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={checklist[item.key]}
                      onChange={(e) =>
                        setChecklist((prev) => ({ ...prev, [item.key]: e.target.checked }))
                      }
                      className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Mandatory Before & After Screenshots Section */}
          <div className="space-y-2.5 p-3.5 rounded-2xl bg-neutral-50/80 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08]">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
                <span>Execution Screenshots <span className="text-rose-500">*</span></span>
              </label>
              <span className="text-[10px] text-neutral-400 font-medium">Both mandatory for analysis</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Before Entry Screenshot Box */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                    Before Entry <span className="text-rose-500">*</span>
                  </span>
                  {beforePreview && (
                    <button
                      type="button"
                      onClick={() => {
                        if (beforePreview.startsWith("blob:")) URL.revokeObjectURL(beforePreview);
                        setBeforeImage(null);
                        setBeforePreview(null);
                      }}
                      className="text-[10px] text-rose-500 hover:text-rose-600 font-semibold cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {beforePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-emerald-500/30 bg-black/5 aspect-[4/3] group">
                    <img src={beforePreview} alt="Before Entry Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[11px] font-bold text-white bg-black/60 px-2 py-1 rounded-md">
                        Change Image
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBeforeFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-dashed border-neutral-300 dark:border-white/10 hover:border-emerald-500 dark:hover:border-emerald-400/50 bg-white dark:bg-white/[0.02] cursor-pointer transition-colors text-center aspect-[4/3] group">
                    <Upload className="w-5 h-5 text-neutral-400 group-hover:text-emerald-500 transition-colors mb-1" />
                    <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">Upload Entry</span>
                    <span className="text-[9px] text-neutral-400 mt-0.5">PNG, JPG</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBeforeFileChange}
                      className="hidden"
                      required
                    />
                  </label>
                )}
              </div>

              {/* After Exit Screenshot Box */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                    After Exit <span className="text-rose-500">*</span>
                  </span>
                  {afterPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        if (afterPreview.startsWith("blob:")) URL.revokeObjectURL(afterPreview);
                        setAfterImage(null);
                        setAfterPreview(null);
                      }}
                      className="text-[10px] text-rose-500 hover:text-rose-600 font-semibold cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {afterPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-emerald-500/30 bg-black/5 aspect-[4/3] group">
                    <img src={afterPreview} alt="After Exit Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[11px] font-bold text-white bg-black/60 px-2 py-1 rounded-md">
                        Change Image
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAfterFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-dashed border-neutral-300 dark:border-white/10 hover:border-emerald-500 dark:hover:border-emerald-400/50 bg-white dark:bg-white/[0.02] cursor-pointer transition-colors text-center aspect-[4/3] group">
                    <Upload className="w-5 h-5 text-neutral-400 group-hover:text-emerald-500 transition-colors mb-1" />
                    <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">Upload Exit</span>
                    <span className="text-[9px] text-neutral-400 mt-0.5">PNG, JPG</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAfterFileChange}
                      className="hidden"
                      required
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Notes (Screenshot 4 & 5) */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
              Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Trade rationale, entry/exit notes..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.12] bg-white/70 dark:bg-white/[0.04] text-neutral-900 dark:text-white text-sm placeholder-neutral-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
            />
          </div>

          {/* Action Buttons (Screenshots 4 & 5) */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-500/25 active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Trade</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
