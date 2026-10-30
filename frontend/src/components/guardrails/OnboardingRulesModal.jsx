// frontend/src/components/guardrails/OnboardingRulesModal.jsx
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Scale, ShieldCheck, Plus, Minus, ArrowRight } from "lucide-react";
import api from "../../api/axios";
import ApplePresetDropdown from "../ui/ApplePresetDropdown";

const RISK_PRESETS = [
  { value: "0.25%", label: "0.25% (Micro)" },
  { value: "0.5%", label: "0.5% (Conservative)" },
  { value: "1%", label: "1.0% (Standard)" },
  { value: "1.5%", label: "1.5% (Moderate)" },
  { value: "2%", label: "2.0% (Aggressive)" },
  { value: "2.5%", label: "2.5%" },
  { value: "3%", label: "3.0% (Ceiling)" },
  { value: "5%", label: "5.0% (Prop Ceiling)" },
];

const TRADES_PRESETS = [
  { value: "1", label: "1 Trade / Day" },
  { value: "2", label: "2 Trades / Day" },
  { value: "3", label: "3 Trades / Day" },
  { value: "4", label: "4 Trades / Day" },
  { value: "5", label: "5 Trades / Day" },
  { value: "8", label: "8 Trades / Day" },
  { value: "10", label: "10 Trades / Day" },
];

const LOSS_CAP_PRESETS = [
  { value: "1%", label: "1.0% (Tight)" },
  { value: "2%", label: "2.0%" },
  { value: "3%", label: "3.0%" },
  { value: "4%", label: "4.0%" },
  { value: "5%", label: "5.0% (Standard Prop)" },
  { value: "6%", label: "6.0%" },
  { value: "8%", label: "8.0%" },
  { value: "10%", label: "10.0% (Max)" },
];

const LOSS_STREAK_PRESETS = [
  { value: "2 in a row", label: "2 in a row" },
  { value: "3 in a row", label: "3 in a row" },
  { value: "4 in a row", label: "4 in a row" },
  { value: "5 in a row", label: "5 in a row" },
  { value: "Disabled", label: "Disabled" },
];

const RR_PRESETS = [
  { value: "1:1", label: "1:1.0 (Even Money)" },
  { value: "1:1.5", label: "1:1.5 (Quick Scalp)" },
  { value: "1:2", label: "1:2.0 (Standard)" },
  { value: "1:2.5", label: "1:2.5 (Trend)" },
  { value: "1:3", label: "1:3.0 (High Asymmetry)" },
  { value: "1:4", label: "1:4.0 (Runner)" },
];

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
      localStorage.setItem("rules_onboarded", "true");
      localStorage.setItem(`onboarding_completed_${activeUserId}`, "true");
      localStorage.setItem("onboarding_completed", "true");

      // Notify listening components like Dashboard
      window.dispatchEvent(
        new CustomEvent("trading-rules-updated", { detail: form })
      );

      // Save to backend Supabase (profiles and users tables)
      await api.put("/api/auth/profile", {
        userId: activeUserId,
        disciplineRules: form,
        rulesOnboarded: true,
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
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#121622] border-2 border-blue-500/30 rounded-3xl shadow-[0_25px_80px_rgba(0,122,255,0.2)] p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        
        {/* Header with High-Impact Badging */}
        <div className="space-y-2 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-black uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-blue-500" />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            
            {/* 1. Max Risk / Trade */}
            <div className="p-3.5 rounded-2xl bg-neutral-50/80 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] hover:border-black/15 dark:hover:border-white/15 transition-all shadow-2xs space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  MAX RISK / TRADE <span className="text-emerald-500">*</span>
                </label>
                <ApplePresetDropdown
                  value={form.maxRiskPerTrade}
                  onChange={(val) => setForm({ ...form, maxRiskPerTrade: val })}
                  options={RISK_PRESETS}
                  placeholder="Preset"
                />
              </div>

              <div className="flex items-center rounded-xl bg-white dark:bg-[#161b26] border border-black/[0.08] dark:border-white/[0.1] p-1 shadow-2xs focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all">
                <button
                  type="button"
                  onClick={() => adjustRisk(-0.25)}
                  className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.15] text-neutral-700 dark:text-neutral-200 flex items-center justify-center cursor-pointer active:scale-90 shadow-2xs transition-all"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="text"
                  required
                  value={form.maxRiskPerTrade}
                  onChange={(e) => setForm({ ...form, maxRiskPerTrade: e.target.value })}
                  className="w-full text-center text-xs font-bold font-mono text-neutral-900 dark:text-white bg-transparent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => adjustRisk(+0.25)}
                  className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.15] text-neutral-700 dark:text-neutral-200 flex items-center justify-center cursor-pointer active:scale-90 shadow-2xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 2. Max Trades / Day */}
            <div className="p-3.5 rounded-2xl bg-neutral-50/80 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] hover:border-black/15 dark:hover:border-white/15 transition-all shadow-2xs space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  MAX TRADES / DAY <span className="text-emerald-500">*</span>
                </label>
                <ApplePresetDropdown
                  value={String(form.maxTradesPerDay)}
                  onChange={(val) => setForm({ ...form, maxTradesPerDay: val })}
                  options={TRADES_PRESETS}
                  placeholder="Preset"
                />
              </div>

              <div className="flex items-center rounded-xl bg-white dark:bg-[#161b26] border border-black/[0.08] dark:border-white/[0.1] p-1 shadow-2xs focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all">
                <button
                  type="button"
                  onClick={() => adjustMaxTrades(-1)}
                  className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.15] text-neutral-700 dark:text-neutral-200 flex items-center justify-center cursor-pointer active:scale-90 shadow-2xs transition-all"
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
                  className="w-full text-center text-xs font-bold font-mono text-neutral-900 dark:text-white bg-transparent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => adjustMaxTrades(+1)}
                  className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.15] text-neutral-700 dark:text-neutral-200 flex items-center justify-center cursor-pointer active:scale-90 shadow-2xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 3. Daily Loss Cap */}
            <div className="p-3.5 rounded-2xl bg-neutral-50/80 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] hover:border-black/15 dark:hover:border-white/15 transition-all shadow-2xs space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  MAX DAILY LOSS <span className="text-emerald-500">*</span>
                </label>
                <ApplePresetDropdown
                  value={form.dailyLossCap}
                  onChange={(val) => setForm({ ...form, dailyLossCap: val })}
                  options={LOSS_CAP_PRESETS}
                  placeholder="Preset"
                />
              </div>

              <div className="flex items-center rounded-xl bg-white dark:bg-[#161b26] border border-black/[0.08] dark:border-white/[0.1] p-1 shadow-2xs focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all">
                <button
                  type="button"
                  onClick={() => adjustLossCap(-0.5)}
                  className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.15] text-neutral-700 dark:text-neutral-200 flex items-center justify-center cursor-pointer active:scale-90 shadow-2xs transition-all"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="text"
                  required
                  value={form.dailyLossCap}
                  onChange={(e) => setForm({ ...form, dailyLossCap: e.target.value })}
                  className="w-full text-center text-xs font-bold font-mono text-neutral-900 dark:text-white bg-transparent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => adjustLossCap(+0.5)}
                  className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.15] text-neutral-700 dark:text-neutral-200 flex items-center justify-center cursor-pointer active:scale-90 shadow-2xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 4. Losing Streak */}
            <div className="p-3.5 rounded-2xl bg-neutral-50/80 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] hover:border-black/15 dark:hover:border-white/15 transition-all shadow-2xs space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  LOSING STREAK <span className="text-emerald-500">*</span>
                </label>
                <ApplePresetDropdown
                  value={form.lossStreakBreak}
                  onChange={(val) => setForm({ ...form, lossStreakBreak: val })}
                  options={LOSS_STREAK_PRESETS}
                  placeholder="Preset"
                />
              </div>

              <div className="flex items-center rounded-xl bg-white dark:bg-[#161b26] border border-black/[0.08] dark:border-white/[0.1] p-1 shadow-2xs focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all">
                <button
                  type="button"
                  onClick={() => adjustLossStreak(-1)}
                  className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.15] text-neutral-700 dark:text-neutral-200 flex items-center justify-center cursor-pointer active:scale-90 shadow-2xs transition-all"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="text"
                  required
                  value={form.lossStreakBreak}
                  onChange={(e) => setForm({ ...form, lossStreakBreak: e.target.value })}
                  className="w-full text-center text-xs font-bold font-mono text-neutral-900 dark:text-white bg-transparent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => adjustLossStreak(+1)}
                  className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.15] text-neutral-700 dark:text-neutral-200 flex items-center justify-center cursor-pointer active:scale-90 shadow-2xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 5. Target Risk / Reward */}
            <div className="col-span-1 sm:col-span-2 p-3.5 rounded-2xl bg-neutral-50/80 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] hover:border-black/15 dark:hover:border-white/15 transition-all shadow-2xs space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  TARGET RISK / REWARD <span className="text-emerald-500">*</span>
                </label>
                <ApplePresetDropdown
                  value={form.targetRR}
                  onChange={(val) => setForm({ ...form, targetRR: val })}
                  options={RR_PRESETS}
                  placeholder="Preset"
                />
              </div>

              <div className="flex items-center rounded-xl bg-white dark:bg-[#161b26] border border-black/[0.08] dark:border-white/[0.1] p-1 shadow-2xs focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all">
                <button
                  type="button"
                  onClick={() => adjustRR(-0.5)}
                  className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.15] text-neutral-700 dark:text-neutral-200 flex items-center justify-center cursor-pointer active:scale-90 shadow-2xs transition-all"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="text"
                  required
                  value={form.targetRR}
                  onChange={(e) => setForm({ ...form, targetRR: e.target.value })}
                  className="w-full text-center text-xs font-bold font-mono text-neutral-900 dark:text-white bg-transparent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => adjustRR(+0.5)}
                  className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.15] text-neutral-700 dark:text-neutral-200 flex items-center justify-center cursor-pointer active:scale-90 shadow-2xs transition-all"
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
              className="w-full py-3.5 px-6 rounded-2xl bg-blue-500 hover:bg-blue-600 active:scale-[0.99] text-white font-extrabold text-sm transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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

