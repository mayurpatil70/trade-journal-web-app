// frontend/src/pages/DiscordGate.jsx
import { useSearchParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  MessageSquare,
  AlertCircle,
  ArrowRight,
  LogOut,
  CheckCircle,
} from "lucide-react";

export default function DiscordGate() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const errorParam = searchParams.get("error");
  const [justJoined, setJustJoined] = useState(false);
  const userId = localStorage.getItem("userId");

  const handleConnect = () => {
    if (!userId) {
      alert("Missing User ID. Please sign out and log in again.");
      return;
    }
    const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID;
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const redirectUri = encodeURIComponent(`${apiUrl}/api/discord/callback`);
    window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify%20guilds&state=${userId}`;
  };

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
    <div
      className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Centered Card Container */}
      <div className="w-full max-w-md bg-[#121418] border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col items-center justify-center text-center">
        {/* Floating Discord Icon */}
        <div className="w-16 h-16 bg-[#5865F2]/10 border border-[#5865F2]/30 rounded-2xl flex items-center justify-center mb-6 shadow-inner animate-[bounce_3s_infinite]">
          <MessageSquare
            className="w-8 h-8 text-[#5865F2]"
            fill="currentColor"
          />
        </div>

        <h2 className="text-2xl font-bold text-white mb-3">Community Access</h2>
        <p className="text-gray-400 text-sm mb-8 px-2">
          Forex Notes requires all members to be part of our private server.
          Link your Discord account to verify membership.
        </p>

        {errorParam && !justJoined && (
          <div className="mb-6 w-full bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3 text-left">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300 font-medium">
              {getErrorMessage()}
            </p>
          </div>
        )}

        {justJoined && (
          <div className="mb-6 w-full bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3 text-left">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-300 font-medium">
              Awesome! Now click Verify below to sync your account.
            </p>
          </div>
        )}

        <button
          onClick={handleConnect}
          className={`w-full py-4 px-6 font-bold rounded-2xl transition-all duration-300 flex justify-center items-center gap-3 mb-4 ${
            justJoined
              ? "bg-emerald-500 text-white hover:bg-emerald-600 scale-105 shadow-lg"
              : "bg-[#5865F2] hover:bg-[#4752C4] text-white hover:shadow-lg"
          }`}
        >
          Verify Discord Membership
          <ArrowRight className="w-5 h-5" />
        </button>

        <button
          onClick={handleSignOut}
          className="w-full py-3 px-6 bg-transparent text-gray-400 hover:text-white font-medium rounded-2xl transition-all flex justify-center items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Start Over with different email
        </button>

        <div className="mt-8 pt-6 border-t border-white/5 w-full">
          <p className="text-sm text-gray-500">
            Not in the server yet?{" "}
            <a
              href="https://discord.gg/Ajaw3AjfWE"
              target="_blank"
              rel="noreferrer"
              onClick={() => setJustJoined(true)}
              className="text-[#5865F2] hover:text-[#7289DA] font-semibold ml-1"
            >
              Join the community
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
