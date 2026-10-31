import { useEffect } from "react";
import { Bot, MessageSquare } from "lucide-react";

const openCoach = () => window.dispatchEvent(new Event("fn:open-coach"));

export default function AICoach() {
  useEffect(() => {
    const id = setTimeout(openCoach, 150);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="rounded-3xl bg-white dark:bg-[#12151e]/85 border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-8 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-500/10 text-[#0066FF] dark:text-[#38bdf8] border border-blue-500/20 flex items-center justify-center">
          <Bot className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">AI Trading Coach</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-md mx-auto">
          Check your emotional state and setup before you take a trade. Share a chart screenshot for a second opinion.
        </p>
        <button
          type="button"
          onClick={openCoach}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-sm font-semibold transition-colors"
        >
          <MessageSquare className="w-4 h-4" /> Open AI Coach
        </button>
      </div>
    </div>
  );
}
