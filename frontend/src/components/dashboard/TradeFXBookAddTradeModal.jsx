import { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  ChevronDown,
  Loader2,
  Check,
} from "lucide-react";
import DateTimePickerPopover from "../ui/DateTimePickerPopover";
import api from "../../api/axios";

export default function TradeFXBookAddTradeModal({ isOpen, onClose, onTradeAdded }) {
  const [direction, setDirection] = useState("LONG");
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [exitPrice, setExitPrice] = useState("");
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

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const userId = localStorage.getItem("userId") || localStorage.getItem("userEmail");
      const eDate = entryDateTime || new Date();
      const dateStr = eDate.toISOString().slice(0, 10);
      const timeStr = eDate.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });

      let exDateStr = null;
      let exTimeStr = null;
      if (exitDateTime) {
        exDateStr = exitDateTime.toISOString().slice(0, 10);
        exTimeStr = exitDateTime.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });
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

      const payload = {
        userId,
        asset: symbol.trim().toUpperCase(),
        direction,
        entry: numEntry,
        exitPrice: numExit,
        exit_price: numExit,
        lotSize: quantity ? Number(quantity) : 1.0,
        lot_size: quantity ? Number(quantity) : 1.0,
        date: dateStr,
        time: timeStr,
        entry_date: dateStr,
        entry_time: timeStr,
        exit_date: exDateStr,
        exit_time: exTimeStr,
        result: result === "open" ? "win" : result, // default to win/loss calculation
        reason: notes,
        lesson: Object.values(checklist).filter(Boolean).length > 0 ? "Checklist items satisfied" : "",
        setup: "Manual Trade",
        session: "New York",
        risk: 1.0,
      };

      const res = await api.post("/api/trades", payload);
      if (res.data?.success || res.status === 201) {
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
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] bg-white dark:bg-[#121622] border border-black/[0.08] dark:border-white/[0.12] rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.2)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.8)] backdrop-blur-2xl p-6 relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 scrollbar-hide"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header (Screenshots 4 & 5) */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Add Trade</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Direction Pill Selector (Screenshots 4 & 5) */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 dark:bg-white/[0.05] rounded-2xl border border-black/[0.04] dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => setDirection("LONG")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                direction === "LONG"
                  ? "bg-white dark:bg-[#1c2233] text-blue-600 dark:text-blue-400 shadow-sm border border-black/[0.05] dark:border-white/[0.1]"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <ArrowUpRight className="w-4 h-4 text-blue-500" />
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
                className="w-full h-11 px-3.5 rounded-xl border border-black/[0.08] dark:border-white/[0.12] bg-white/70 dark:bg-white/[0.04] text-neutral-900 dark:text-white text-sm font-medium placeholder-neutral-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all uppercase"
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
                className="w-full h-11 px-3.5 rounded-xl border border-black/[0.08] dark:border-white/[0.12] bg-white/70 dark:bg-white/[0.04] text-neutral-900 dark:text-white text-sm font-medium placeholder-neutral-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                className="w-full h-11 px-3.5 rounded-xl border border-black/[0.08] dark:border-white/[0.12] bg-white/70 dark:bg-white/[0.04] text-neutral-900 dark:text-white text-sm font-medium placeholder-neutral-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
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
                className="w-full h-11 px-3.5 rounded-xl border border-black/[0.08] dark:border-white/[0.12] bg-white/70 dark:bg-white/[0.04] text-neutral-900 dark:text-white text-sm font-medium placeholder-neutral-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
              />
            </div>
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
                    isChecklistOpen ? "rotate-90 text-blue-500" : ""
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
                      className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            )}
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
              className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.12] bg-white/70 dark:bg-white/[0.04] text-neutral-900 dark:text-white text-sm placeholder-neutral-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
            />
          </div>

          {/* Action Buttons (Screenshots 4 & 5) */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/25 active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
