// frontend/src/pages/Verify.jsx
import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/axios"; // <-- Updated: Now uses your live Render URL
import { Loader2, XCircle, CheckCircle } from "lucide-react";

export default function Verify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const hasAttempted = useRef(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (hasAttempted.current) return;
      hasAttempted.current = true;

      const email = searchParams.get("email");
      const token = searchParams.get("token");

      if (!email || !token) {
        setError("Missing verification credentials in the URL.");
        return;
      }

      try {
        // <-- Updated: Uses dynamic API route instead of hardcoded localhost
        const response = await api.post("/api/auth/verify", { email, token });

        localStorage.setItem("userId", response.data.userId);
        setSuccess(true);

        setTimeout(() => {
          if (response.data.discordVerified) {
            localStorage.setItem("discordVerified", "true");
            navigate("/dashboard");
          } else {
            localStorage.setItem("discordVerified", "false");
            navigate("/link-discord");
          }
        }, 1500);
      } catch (err) {
        console.error("Full Verification Error:", err);
        setError(
          err.response?.data?.error ||
            err.message ||
            "Verification failed. The server may be unreachable.",
        );
      }
    };

    verifyToken();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-[#0d0f11] relative overflow-hidden flex flex-col justify-center items-center p-4">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-journalEmerald/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-2xl shadow-2xl p-10 text-center relative z-10 transition-all duration-500">
        {error ? (
          <div className="animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Link Invalid</h2>
            <p className="text-gray-400 text-sm mb-8">{error}</p>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl transition-all duration-300 hover:shadow-lg"
            >
              Request New Link
            </button>
          </div>
        ) : success ? (
          <div className="animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <CheckCircle className="w-10 h-10 text-journalEmerald" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Verified!</h2>
            <p className="text-gray-400 text-sm">
              Redirecting to your journal...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
              <div className="absolute inset-0 border-t-2 border-journalEmerald rounded-full animate-spin"></div>
              <Loader2 className="w-8 h-8 text-journalEmerald animate-pulse" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2 tracking-wide">
              Authenticating
            </h2>
            <p className="text-gray-500 text-sm">Securing your connection...</p>
          </div>
        )}
      </div>
    </div>
  );
}
