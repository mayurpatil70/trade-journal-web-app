// frontend/src/components/guardrails/OnboardingRulesModal.jsx
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Scale, ShieldCheck, Plus, Minus, ArrowRight } from "lucide-react";
import api from "../../api/axios";

export default function OnboardingRulesModal({ isOpen, onComplete, userId }) {
  const [form, setForm] = useState({
    maxRiskPerTrade: "2%",
    maxTradesPerDay: "3",
    dailyLossCap: "5%",
    lossStreakBreak: "3 in a row",
    targetRR: "1:2",
  });
  const [errorMsg, setErrorMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  // Stepper adjustments
  const adjustRisk = (delta) => {
    const current = parseFloat(String(form.maxRiskPerTrade || "2").replace("%", "")) || 2;
    const next = Math.max(0.1, Math.min(20, +(current + delta).toFixed(2)));
    setForm({ ...form, maxRiskPerTrade: `${next}%` });
  };

  const adjustMaxTrades = (delta) => {
    const current = parseInt(String(form.maxTradesPerDay || "3").replace(/\D/g, ""), 10) || 3;
    const next = Math.max(1, Math.min(50, current + delta));
    setForm({ ...form, maxTradesPerDay: String(next) });
  };

  const adjustLossCap = (delta) => {
    const current = parseFloat(String(form.dailyLossCap || "5").replace("%", "")) || 5;
    const next = Math.max(0.5, Math.min(50, +(current + delta).toFixed(1)));
    setForm({ ...form, dailyLossCap: `${next}%` });
  };

  const adjustLossStreak = (delta) => {
    const current = parseInt(String(form.lossStreakBreak || "3").replace(/\D/g, ""), 10) || 3;
    const next = Math.max(1, Math.min(10, current + delta));
    setForm({ ...form, lossStreakBreak: `${next} in a row` });
  };

  const adjustRR = (delta) => {
    const match = String(form.targetRR || "1:2").match(/1:([\d.]+)/);
    const current = match ? parseFloat(match[1]) : 2;
    const next = Math.max(1, Math.min(20, +(current + delta).toFixed(1)));
    setForm({ ...form, targetRR: `1:${next}` });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate all 5 required fields
    if (!form.maxRiskPerTrade?.trim()) {
      setErrorMsg("Please specify your Max Risk / Trade.");
      return;
    }
    if (!form.maxTradesPerDay?.trim()) {
      setErrorMsg("Please specify your Max Trades / Day.");
      return;
    }
    if (!form.dailyLossCap?.trim()) {
      setErrorMsg("Please specify your Daily Loss Cap.");
      return;
    }
    if (!form.lossStreakBreak?.trim()) {
      setErrorMsg("Please specify your Losing Streak Break limit.");
      return;
    }
    if (!form.targetRR?.trim()) {
      setErrorMsg("Please specify your Target Risk / Reward ratio.");
      return;
    }

    setIsSaving(true);
    setErrorMsg("");

    try {
      const activeUserId = userId || localStorage.getItem("userId") || localStorage.getItem("userEmail");
      
      // Save to localStorage
      localStorage.setItem(`trader_discipline_${activeUserId}`, JSON.stringify(form));
      localStorage.setItem(`rules_onboarded_${activeUserId}`, "true");

      // Save to backend Supabase
      await api.put("/api/auth/profile", {
        userId: activeUserId,
        disciplineRules: form,
      });

      if (onComplete) onComplete(form);
    } catch (err) {
      console.error("Failed to save onboarding rules:", err);
      // Still allow entering dashboard if network hiccups, as localStorage is set
      if (onComplete) onComplete(form);
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 dark:bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#121622] border-2 border-emerald-500/30 rounded-3xl shadow-[0_25px_80px_rgba(16,185,129,0.2)] p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        
        {/* Header with High-Impact Badging */}
        <div className="space-y-2 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-black uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Mandatory Trader Onboarding</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
            Lock Your Personal Risk Guardrails
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Every successful trader respects hard risk ceilings. Configure your 5 core rules before accessing your dashboard.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* 1. Max Risk / Trade */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  MAX RISK / TRADE <span className="text-emerald-500">*</span>
                </label>
                <select
                  value={["0.25%", "0.5%", "1%", "1.5%", "2%", "2.5%", "3%", "5%"].includes(form.maxRiskPerTrade) ? form.maxRiskPerTrade : "custom"}
                  onChange={(e) => {
                    if (e.target.value !== "custom") {
                      setForm({ ...form, maxRiskPerTrade: e.target.value });
                    }
                  }}
                  className="text-[10px] font-semibold bg-neutral-200 dark:bg-white/[0.08] border border-black/[0.08] dark:border-white/[0.1] rounded-lg px-2 py-0.5 text-neutral-800 dark:text-neutral-200 cursor-pointer"
                >
                  <option value="0.5%">0.5% (Conservative)</option>
                  <option value="1%">1.0% (Standard)</option>
                  <option value="1.5%">1.5% (Moderate)</option>
                  <option value="2%">2.0% (Aggressive)</option>
                  <option value="3%">3.0% (Ceiling)</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div className="flex items-center rounded-xl bg-white dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.1] p-1">
                <button
                  type="button"
                  onClick={() => adjustRisk(-0.25)}
                  className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.15] text-neutral-700 dark:text-neutral-200 flex items-center justify-center cursor-pointer shadow-xs"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="text"
                  required
                  value={form.maxRiskPerTrade}
                  onChange={(e) => setForm({ ...form, maxRiskPerTrade: e.target.value })}
                  className="w-full text-center text-xs font-black font-mono text-neutral-900 dark:text-white bg-transparent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => adjustRisk(+0.25)}
                  className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.15] text-neutral-700 dark:text-neutral-200 flex items-center justify-center cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 2. Max Trades / Day */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  MAX TRADES / DAY <span className="text-emerald-500">*</span>
                </label>
                <select
                  value={["1", "2", "3", "4", "5", "8", "10"].includes(String(form.maxTradesPerDay)) ? String(form.maxTradesPerDay) : "custom"}
                  onChange={(e) => {
                    if (e.target.value !== "custom") {
                      setForm({ ...form, maxTradesPerDay: e.target.value });
                    }
                  }}
                  className="text-[10px] font-semibold bg-neutral-200 dark:bg-white/[0.08] border border-black/[0.08] dark:border-white/[0.1] rounded-lg px-2 py-0.5 text-neutral-800 dark:text-neutral-200 cursor-pointer"
                >
                  <option value="1">1 Trade</option>
                  <option value="2">2 Trades</option>
                  <option value="3">3 Trades</option>
                  <option value="5">5 Trades</option>
                  <option value="8">8 Trades</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div className="flex items-center rounded-xl bg-white dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.1] p-1">
                <button
                  type="button"
                  onClick={() => adjustMaxTrades(-1)}
                  className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.15] text-neutral-700 dark:text-neutral-200 flex items-center justify-center cursor-pointer shadow-xs"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={form.maxTradesPerDay}
                  onChange={(e) => setForm({ ...form, maxTradesPerDay: e.target.value })}
                  className="w-full text-center text-xs font-black font-mono text-neutral-900 dark:text-white bg-transparent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => adjustMaxTrades(+1)}
                  className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.15] text-neutral-700 dark:text-neutral-200 flex items-center justify-center cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 3. Daily Loss Cap */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  MAX DAILY LOSS <span className="text-emerald-500">*</span>
                </label>
                <select
                  value={["1%", "2%", "3%", "4%", "5%", "6%", "8%", "10%"].includes(form.dailyLossCap) ? form.dailyLossCap : "custom"}
                  onChange={(e) => {
                    if (e.target.value !== "custom") {
                      setForm({ ...form, dailyLossCap: e.target.value });
                    }
                  }}
                  className="text-[10px] font-semibold bg-neutral-200 dark:bg-white/[0.08] border border-black/[0.08] dark:border-white/[0.1] rounded-lg px-2 py-0.5 text-neutral-800 dark:text-neutral-200 cursor-pointer"
                >
                  <option value="2%">2.0%</option>
                  <option value="3%">3.0%</option>
                  <option value="4%">4.0%</option>
                  <option value="5%">5.0% (Standard Prop)</option>
                  <option value="8%">8.0%</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div className="flex items-center rounded-xl bg-white dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.1] p-1">
                <button
                  type="button"
                  onClick={() => adjustLossCap(-0.5)}
                  className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.15] text-neutral-700 dark:text-neutral-200 flex items-center justify-center cursor-pointer shadow-xs"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="text"
                  required
                  value={form.dailyLossCap}
                  onChange={(e) => setForm({ ...form, dailyLossCap: e.target.value })}
                  className="w-full text-center text-xs font-black font-mono text-neutral-900 dark:text-white bg-transparent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => adjustLossCap(+0.5)}
                  className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.15] text-neutral-700 dark:text-neutral-200 flex items-center justify-center cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 4. Losing Streak */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  LOSING STREAK <span className="text-emerald-500">*</span>
                </label>
                <select
                  value={["2 in a row", "3 in a row", "4 in a row", "5 in a row"].includes(form.lossStreakBreak) ? form.lossStreakBreak : "custom"}
                  onChange={(e) => {
                    if (e.target.value !== "custom") {
                      setForm({ ...form, lossStreakBreak: e.target.value });
                    }
                  }}
                  className="text-[10px] font-semibold bg-neutral-200 dark:bg-white/[0.08] border border-black/[0.08] dark:border-white/[0.1] rounded-lg px-2 py-0.5 text-neutral-800 dark:text-neutral-200 cursor-pointer"
                >
                  <option value="2 in a row">2 in a row</option>
                  <option value="3 in a row">3 in a row</option>
                  <option value="4 in a row">4 in a row</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div className="flex items-center rounded-xl bg-white dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.1] p-1">
                <button
                  type="button"
                  onClick={() => adjustLossStreak(-1)}
                  className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.15] text-neutral-700 dark:text-neutral-200 flex items-center justify-center cursor-pointer shadow-xs"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="text"
                  required
                  value={form.lossStreakBreak}
                  onChange={(e) => setForm({ ...form, lossStreakBreak: e.target.value })}
                  className="w-full text-center text-xs font-black font-mono text-neutral-900 dark:text-white bg-transparent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => adjustLossStreak(+1)}
                  className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.15] text-neutral-700 dark:text-neutral-200 flex items-center justify-center cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 5. Target Risk / Reward */}
            <div className="col-span-1 sm:col-span-2 space-y-1.5 p-3.5 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  TARGET RISK / REWARD <span className="text-emerald-500">*</span>
                </label>
                <select
                  value={["1:1", "1:1.5", "1:2", "1:2.5", "1:3", "1:4"].includes(form.targetRR) ? form.targetRR : "custom"}
                  onChange={(e) => {
                    if (e.target.value !== "custom") {
                      setForm({ ...form, targetRR: e.target.value });
                    }
                  }}
                  className="text-[10px] font-semibold bg-neutral-200 dark:bg-white/[0.08] border border-black/[0.08] dark:border-white/[0.1] rounded-lg px-2 py-0.5 text-neutral-800 dark:text-neutral-200 cursor-pointer"
                >
                  <option value="1:1.5">1:1.5 (Scalp)</option>
                  <option value="1:2">1:2.0 (Standard)</option>
                  <option value="1:2.5">1:2.5 (Trend)</option>
                  <option value="1:3">1:3.0 (High Asymmetry)</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div className="flex items-center rounded-xl bg-white dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.1] p-1">
                <button
                  type="button"
                  onClick={() => adjustRR(-0.5)}
                  className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.15] text-neutral-700 dark:text-neutral-200 flex items-center justify-center cursor-pointer shadow-xs"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="text"
                  required
                  value={form.targetRR}
                  onChange={(e) => setForm({ ...form, targetRR: e.target.value })}
                  className="w-full text-center text-xs font-black font-mono text-neutral-900 dark:text-white bg-transparent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => adjustRR(+0.5)}
                  className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.15] text-neutral-700 dark:text-neutral-200 flex items-center justify-center cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

          {/* Action button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-white font-extrabold text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>Lock Guardrails & Enter Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

      </div>
    </div>,
    document.body
  );
}

