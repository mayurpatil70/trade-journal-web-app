// frontend/src/pages/DiscordCallback.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { Loader2, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";

export default function DiscordCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying");
  const [errorMsg, setErrorMsg] = useState("");
  const hasRun = useRef(false);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setStatus("error");
      setErrorMsg("No authorization code found from Discord.");
      return;
    }

    if (hasRun.current) return;
    hasRun.current = true;

    const verifyDiscord = async () => {
      try {
        const userId = localStorage.getItem("userId");
        // Sends code to backend to verify server membership
        const res = await api.post("/api/discord/verify", { code, userId });

        if (res.data.success) {
          localStorage.setItem("discord_verified", "true");
          setStatus("success");
          setTimeout(() => {
            navigate("/dashboard");
          }, 1500);
        } else {
          setStatus("error");
          setErrorMsg("You are not a member of our Discord server yet!");
        }
      } catch (err) {
        setStatus("error");
        setErrorMsg(
          err.response?.data?.error || "Failed to verify Discord membership.",
        );
      }
    };

    verifyDiscord();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-[#020202] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#121418] border border-white/5 rounded-2xl p-8 text-center shadow-2xl">
        {status === "verifying" && (
          <>
            <Loader2 className="w-12 h-12 text-[#5865F2] animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">
              Checking Discord Server...
            </h2>
            <p className="text-sm text-gray-400">
              Verifying your community membership.
            </p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Verification Successful!</h2>
            <p className="text-sm text-gray-400">
              Redirecting to your dashboard...
            </p>
          </>
        )}
        {status === "error" && (
          <>
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-sm text-gray-400 mb-6">{errorMsg}</p>
            <button
              onClick={() => navigate("/link-discord")}
              className="w-full py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold rounded-xl transition-all"
            >
              Try Again <ArrowRight className="w-4 h-4 inline ml-1" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
