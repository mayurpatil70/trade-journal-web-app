// frontend/src/pages/DiscordGate.jsx
import { useNavigate } from "react-router-dom";
import { MessageSquare, ArrowRight, CheckCircle, Shield } from "lucide-react";

export default function DiscordGate() {
  const navigate = useNavigate();

  // REPLACE THIS WITH YOUR ACTUAL DISCORD INVITE LINK
  const DISCORD_INVITE_LINK = "https://discord.gg/Ajaw3AjfWE";

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-200 flex items-center justify-center p-4 sm:p-6 transition-colors duration-200"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="w-full max-w-lg bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-8 md:p-10 shadow-xl text-center">
        <div className="w-16 h-16 bg-[#5865F2]/10 border border-[#5865F2]/20 rounded-[2px] flex items-center justify-center mx-auto mb-6 shadow-sm">
          <MessageSquare className="w-8 h-8 text-[#5865F2]" />
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-3">
          Join the Community
        </h1>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed px-4">
          Trade Journey is better together. Join our official Discord server to
          get support, share setups, and talk directly with other traders.
        </p>

        <div className="space-y-4 w-full flex flex-col items-center">
          {/* Step 1: Join Discord Button (Opens in new tab) */}
          <a
            href={DISCORD_INVITE_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 px-6 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold rounded-[2px] shadow-lg transition-all flex justify-center items-center gap-2 text-sm"
          >
            Join Discord Server
          </a>

          {/* Step 2: Continue to App */}
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full py-4 px-6 bg-gray-100 dark:bg-[#1a1d24] hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white border border-gray-200 dark:border-white/5 font-bold rounded-[2px] transition-all flex justify-center items-center gap-2 text-sm shadow-sm"
          >
            I've joined, take me to Dashboard <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/5 flex items-center justify-center gap-2 text-xs text-gray-400 font-medium">
          <Shield className="w-4 h-4 text-[#21d4a3]" />
          <span>Your data is completely private and secure.</span>
        </div>
      </div>
    </div>
  );
}
