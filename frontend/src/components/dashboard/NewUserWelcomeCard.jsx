import { createPortal } from "react-dom";
import { X, PlusCircle, ShieldCheck, FlaskConical, ArrowRight } from "lucide-react";

const STEPS = [
  { icon: PlusCircle, title: "Log your first trade", text: "Add a trade to start your journal and stats." },
  { icon: ShieldCheck, title: "Set your risk rules", text: "Guardrails warn you before you break your plan." },
  { icon: FlaskConical, title: "Try backtesting", text: "Test a setup on past data before trading it live." },
];

export default function NewUserWelcomeCard({ onClose }) {
  const name = (localStorage.getItem("userName") || localStorage.getItem("userDisplayName") || "").split(" ")[0];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to ForexNotes"
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 select-none animate-in fade-in duration-200"
    >
      <div className="absolute inset-0 bg-neutral-950/60 dark:bg-black/75 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-[440px] rounded-[28px] bg-white dark:bg-[#111622] border border-black/[0.08] dark:border-white/[0.12] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35)] dark:shadow-[0_25px_80px_-15px_rgba(0,0,0,0.8)] p-6 sm:p-8 animate-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-[#0066FF]/10 flex items-center justify-center text-2xl mb-4">👋</div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Welcome{name ? `, ${name}` : ""}!
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1.5 mb-6">
          Your trading journal is ready. Here's how to get started.
        </p>

        <div className="space-y-2.5 mb-6">
          {STEPS.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06]"
            >
              <div className="w-8 h-8 rounded-xl bg-[#0066FF]/10 text-[#0066FF] dark:text-blue-400 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-neutral-900 dark:text-white">{title}</p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">{text}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full h-11 rounded-2xl bg-[#0066FF] hover:bg-[#0055D6] active:scale-[0.98] text-white font-semibold text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <span className="text-white">Get started</span>
          <ArrowRight className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>,
    document.body
  );
}
