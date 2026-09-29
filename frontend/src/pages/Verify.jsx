// frontend/src/pages/Verify.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { Loader2, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";

export default function Verify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("authenticating"); // 'authenticating' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState("");

  // This ref prevents React Strict Mode from firing the one-time-use token twice
  const hasAttemptedVerification = useRef(false);

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setErrorMsg(
        "No verification token found in the URL. Please request a new login link.",
      );
      return;
    }

    if (hasAttemptedVerification.current) return;
    hasAttemptedVerification.current = true;

    const verifyToken = async () => {
      try {
        // Adjust this endpoint if your backend uses a different route (e.g., /api/auth/verify-magic-link)
        const response = await api.post("/api/auth/verify", { token });

        // Ensure your backend returns the user ID and token
        const userId =
          response.data.userId || response.data.user?.id || response.data.id;
        const authToken = response.data.token;

        if (userId) localStorage.setItem("userId", userId);
        if (authToken) localStorage.setItem("token", authToken);

        setStatus("success");

        // Redirect to Discord gate after a brief success message
        setTimeout(() => {
          navigate("/link-discord");
        }, 1500);
      } catch (error) {
        setStatus("error");
        setErrorMsg(
          error.response?.data?.error ||
            "Verification link is invalid or has expired.",
        );
      }
    };

    verifyToken();
  }, [searchParams, navigate]);

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-200 flex items-center justify-center p-4 sm:p-6 transition-colors duration-200"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="w-full max-w-md bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-8 sm:p-10 shadow-xl flex flex-col items-center text-center">
        {status === "authenticating" && (
          <div className="flex flex-col items-center animate-in fade-in duration-300">
            <Loader2 className="w-12 h-12 text-[#2f8df4] animate-spin mb-6" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Authenticating...
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Verifying your secure magic link.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
            <CheckCircle className="w-12 h-12 text-emerald-500 mb-6" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Login Successful!
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Redirecting you to the next step...
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center w-full animate-in fade-in zoom-in-95 duration-300">
            <div className="w-14 h-14 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-[2px] flex items-center justify-center mb-6">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Authentication Failed
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
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
