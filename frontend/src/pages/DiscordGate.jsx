// frontend/src/pages/DiscordGate.jsx
import { useSearchParams, useNavigate } from "react-router-dom";
import { MessageSquare, AlertCircle, ArrowRight, LogOut } from "lucide-react";

export default function DiscordGate() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const errorParam = searchParams.get("error");

  const userId = localStorage.getItem("userId");

  const handleConnect = () => {
    if (!userId) {
      alert("Missing User ID. Please sign out and log in again.");
      return;
    }
    const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID;
    if (!clientId) {
      alert(
        "Error: VITE_DISCORD_CLIENT_ID is missing from your frontend/.env file!",
      );
      return;
    }
    const redirectUri = encodeURIComponent(
      "http://localhost:3000/api/discord/callback",
    );
    window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify%20guilds&state=${userId}`;
  };

  // The Escape Hatch: Clears local storage and sends you back to login
  const handleSignOut = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("discordVerified");
    navigate("/login");
  };

  const getErrorMessage = () => {
    if (errorParam === "not_in_server")
      return "You must join our official Discord server to access the dashboard.";
    if (errorParam === "auth_failed")
      return "Discord authorization was cancelled or failed.";
    if (errorParam === "server_error")
      return "An error occurred while communicating with Discord.";
    return null;
  };

  return (
    <div className="min-h-screen bg-[#0d0f11] relative overflow-hidden flex flex-col justify-center items-center p-4">
      {/* Animated Blurple Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#5865F2]/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-1000"></div>

      <div className="w-full max-w-md bg-white/[0.02] backdrop-blur-2xl border border-white/[0.05] rounded-3xl shadow-2xl p-10 text-center relative z-10 transition-all hover:border-white/[0.1]">
        {/* Floating Discord Icon */}
        <div className="relative inline-block mb-8 animate-[bounce_3s_infinite]">
          <div className="absolute inset-0 bg-[#5865F2] blur-xl opacity-20 rounded-full"></div>
          <div className="bg-[#5865F2]/10 border border-[#5865F2]/30 w-24 h-24 rounded-2xl flex items-center justify-center relative z-10 shadow-inner">
            <MessageSquare
              className="w-12 h-12 text-[#5865F2]"
              fill="currentColor"
            />
          </div>
        </div>

        <h2 className="text-3xl font-extrabold text-white mb-3 tracking-tight">
          Community Access
        </h2>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed px-2">
          F Journal requires all members to be part of our private server. Link
          your Discord account to verify your membership.
        </p>

        {errorParam && (
          <div className="mb-8 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 text-left">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300 font-medium">
              {getErrorMessage()}
            </p>
          </div>
        )}

        {/* Primary Action Button */}
        <button
          onClick={handleConnect}
          className="w-full group py-4 px-4 bg-gradient-to-r from-[#5865F2] to-[#4752C4] text-white font-bold rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(88,101,242,0.4)] hover:-translate-y-1 flex justify-center items-center gap-3 mb-4"
        >
          Verify Discord Membership
          <ArrowRight className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </button>

        {/* Sign Out / Escape Button */}
        <button
          onClick={handleSignOut}
          className="w-full py-3 px-4 bg-transparent border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 font-semibold rounded-xl transition-all duration-300 flex justify-center items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Start Over with different email
        </button>

        <div className="mt-8 pt-8 border-t border-white/[0.05]">
          <p className="text-sm text-gray-500 font-medium">
            Not in the server yet?{" "}
            <a
              href="https://discord.gg/Ajaw3AjfWE"
              target="_blank"
              rel="noreferrer"
              className="text-[#5865F2] hover:text-[#7289DA] hover:drop-shadow-[0_0_10px_rgba(88,101,242,0.4)] transition-all ml-1"
            >
              Join the community
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
