// frontend/src/components/guardrails/RuleBreachAlert.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, ShieldAlert, X } from "lucide-react";

export default function RuleBreachAlert({ breach, onDismiss, onNavigateToRules }) {
  const navigate = useNavigate();

  if (!breach) return null;

  const handleClick = (e) => {
    e.preventDefault();
    if (onNavigateToRules) {
      onNavigateToRules();
    } else {
      navigate("/profile?tab=profile&highlight=rules#trading-rules");
    }
  };

  return (
    <div
      onClick={handleClick}
      className="group relative w-full mb-4 p-4 rounded-2xl bg-gradient-to-r from-rose-500/15 via-rose-500/20 to-red-500/15 border-2 border-rose-500/40 hover:border-rose-500/70 dark:border-rose-500/50 dark:hover:border-rose-400 shadow-[0_8px_30px_rgba(244,63,94,0.25)] backdrop-blur-xl transition-all duration-200 cursor-pointer animate-in slide-in-from-top-2"
      role="alert"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {/* Animated Warning Icon */}
          <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/30 animate-pulse mt-0.5">
            <ShieldAlert className="w-4 h-4" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
                RULE BREACH DETECTED: {breach.ruleTitle || "GUARDRAIL VIOLATION"}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 font-mono">
                Limit: {breach.limitValue}
              </span>
            </div>

            <p className="text-xs font-semibold text-rose-950 dark:text-rose-100 leading-snug">
              {breach.message}
            </p>

            <div className="pt-1 flex items-center gap-1.5 text-[11px] font-black text-rose-600 dark:text-rose-400 group-hover:underline">
              <span>Click to view & update your locked Guardrails in Profile</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className="p-1 rounded-lg text-rose-400 hover:text-rose-700 dark:hover:text-rose-200 hover:bg-rose-500/10 transition-colors"
            title="Dismiss warning"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

