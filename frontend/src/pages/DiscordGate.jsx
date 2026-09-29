// frontend/src/pages/DiscordGate.jsx
import { useNavigate } from "react-router-dom";
import { MessageSquare, ArrowRight, Shield } from "lucide-react";

export default function DiscordGate() {
  const navigate = useNavigate();

  const DISCORD_INVITE_LINK = "https://discord.gg/Ajaw3AjfWE";

  return (
    <div
      className="min-h-screen bg-[#020202] text-white flex items-center justify-center p-6"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="w-full max-w-lg bg-[#121418] border border-white/5 rounded-2xl p-8 md:p-10 shadow-2xl text-center">
        <div className="w-16 h-16 bg-[#5865F2]/10 border border-[#5865F2]/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
          <MessageSquare className="w-8 h-8 text-[#5865F2]" />
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-3">
          Join the Community
        </h1>

        <p className="text-sm text-gray-400 mb-8 leading-relaxed px-4">
          Trade Journey is better together. Join our official Discord server to
          get support, share setups, and talk directly with other traders.
        </p>

        <div className="space-y-4 w-full flex flex-col items-center">
          <a
            href={DISCORD_INVITE_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 px-6 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold rounded-2xl shadow-lg transition-all flex justify-center items-center gap-2 text-sm"
          >
            Join Discord Server
          </a>

          <button
            onClick={() => navigate("/dashboard")}
            className="w-full py-4 px-6 bg-[#1a1b20] hover:bg-[#23252b] text-white border border-white/10 font-bold rounded-2xl transition-all flex justify-center items-center gap-2 text-sm shadow-sm"
          >
            I've joined, take me to Dashboard <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-2 text-xs text-gray-500 font-medium">
          <Shield className="w-4 h-4 text-[#21d4a3]" />
          <span>Your data is completely private and secure.</span>
        </div>
      </div>
    </div>
  );
}
