// frontend/src/pages/Verify.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { Loader2, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";

export default function Verify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("authenticating");
  const [errorMsg, setErrorMsg] = useState("");
  const isVerifying = useRef(false);

  useEffect(() => {
    // 1. Extract BOTH token and email from the URL
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      setStatus("error");
      setErrorMsg("Invalid verification link. Missing token or email.");
      return;
    }

    if (isVerifying.current) return;
    isVerifying.current = true;

    const verifyToken = async () => {
      try {
        // 2. Send BOTH parameters to your backend to fix the 401 Unauthorized error
        const response = await api.post("/api/auth/verify", { token, email });

        const userId =
          response.data.userId || response.data.user?.id || response.data.id;
        const authToken = response.data.authToken;
        const discordVerified = response.data.discordVerified;
        const hasPaid = response.data.hasPaid; // Extracted from backend response

        if (userId) localStorage.setItem("userId", userId);
        if (authToken) localStorage.setItem("token", authToken);
        localStorage.setItem("userEmail", email);

        setStatus("success");

        // 3. Smart Redirect: Discord -> Paywall -> Dashboard
        setTimeout(() => {
          if (!discordVerified) {
            navigate("/link-discord");
          } else if (!hasPaid) {
            navigate("/paywall");
          } else {
            navigate("/dashboard");
          }
        }, 1500);
      } catch (error) {
        setStatus("error");
        setErrorMsg(
          error.response?.data?.error || "Invalid or expired login link.",
        );
        isVerifying.current = false;
      }
    };

    verifyToken();
  }, [searchParams, navigate]);

  return (
    <div
      className="min-h-screen bg-[#020202] text-white flex items-center justify-center p-6"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="w-full max-w-md bg-[#121418] border border-white/5 rounded-2xl p-8 sm:p-10 shadow-2xl flex flex-col items-center text-center">
        {status === "authenticating" && (
          <div className="flex flex-col items-center animate-in fade-in duration-300">
            <Loader2 className="w-12 h-12 text-[#6366f1] animate-spin mb-6" />
            <h2 className="text-xl font-bold text-white mb-2">
              Authenticating...
            </h2>
            <p className="text-sm text-gray-400">
              Verifying your secure magic link.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
            <CheckCircle className="w-12 h-12 text-emerald-500 mb-6" />
            <h2 className="text-xl font-bold text-white mb-2">
              Login Successful!
            </h2>
            <p className="text-sm text-gray-400">
              Redirecting you to the next step...
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center w-full animate-in fade-in zoom-in-95 duration-300">
            <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-6">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Authentication Failed
            </h2>
            <p className="text-sm text-gray-400 mb-8 leading-relaxed">
              {errorMsg}
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-4 px-6 bg-[#2f8df4] hover:bg-[#2376e8] text-white font-bold rounded-[2px] shadow-lg transition-all flex justify-center items-center gap-2 text-sm"
            >
              Back to Login <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
