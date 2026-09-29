// frontend/src/pages/DiscordGate.jsx
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { MessageSquare, ArrowRight, Shield, AlertTriangle } from "lucide-react";

export default function DiscordGate() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");

  const DISCORD_INVITE_LINK = "https://discord.gg/Ajaw3AjfWE";

  // Check for error parameters redirected from your backend controller
  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "not_in_server") {
      setErrorMessage(
        "Access Denied: You are not a member of our Discord server yet!",
      );
    } else if (error === "auth_failed" || error === "server_error") {
      setErrorMessage("Discord authentication failed. Please try again.");
    }
  }, [searchParams]);

  const handleDiscordLogin = () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      alert("Session missing. Please login again.");
      navigate("/login");
      return;
    }

    // Replace with your actual Discord App Client ID from Discord Developer Portal
    const CLIENT_ID = "1554059949422940201";

    // Must match the Redirect URI registered in your Discord Developer Portal & Backend .env
    const BACKEND_URL = "https://your-backend-api-name.onrender.com";
    const REDIRECT_URI = encodeURIComponent(
      `${BACKEND_URL}/api/discord/callback`,
    );

    // Passing userId inside 'state' so backend knows which user to update in Supabase
    const discordOAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=identify%20guilds&state=${userId}`;

    window.location.href = discordOAuthUrl;
  };

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

        <p className="text-sm text-gray-400 mb-6 leading-relaxed px-4">
          Trade Journey is better together. Join our official Discord server to
          get support, share setups, and talk directly with other traders.
        </p>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-4 w-full flex flex-col items-center">
          <a
            href={DISCORD_INVITE_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 px-6 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold rounded-2xl shadow-lg transition-all flex justify-center items-center gap-2 text-sm"
          >
            1. Join Discord Server
          </a>

          <button
            onClick={handleDiscordLogin}
            className="w-full py-4 px-6 bg-[#1a1b20] hover:bg-[#23252b] text-white border border-white/10 font-bold rounded-2xl transition-all flex justify-center items-center gap-2 text-sm shadow-sm"
          >
            2. I've joined, Verify & Take me to Dashboard{" "}
            <ArrowRight className="w-4 h-4" />
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
