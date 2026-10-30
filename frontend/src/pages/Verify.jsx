// frontend/src/pages/Verify.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api, { getDeviceId } from "../api/axios";
import { completeSignIn } from "../lib/authFlow";
import { CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";
import Logo3DLoader from "../components/Logo3DLoader";

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
        const deviceId = getDeviceId();
        // 2. Send token, email, and device identifier to backend
        const response = await api.post("/api/auth/verify", { token, email, deviceId });

        const next = completeSignIn(response.data, { email, deviceId });
        setStatus("success");
        setTimeout(() => navigate(next), 1500);
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

  if (status === "authenticating") {
    return <Logo3DLoader title="FOREX NOTES" subtitle="Authenticating your secure login link..." />;
  }

  return (
    <div
      className="min-h-screen bg-[#f2f2f7] dark:bg-[#020202] text-neutral-900 dark:text-white flex items-center justify-center p-6"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <div className="w-full max-w-md bg-white/80 dark:bg-[#121418] backdrop-blur-xl border border-black/[0.08] dark:border-white/5 rounded-2xl p-8 sm:p-10 shadow-2xl flex flex-col items-center text-center">

        {status === "success" && (
          <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
            <CheckCircle className="w-12 h-12 text-emerald-500 mb-6" />
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
              Login Successful!
            </h2>
            <p className="text-sm text-neutral-600 dark:text-gray-400">
              Redirecting you to the next step...
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center w-full animate-in fade-in zoom-in-95 duration-300">
            <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-6">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
              Authentication Failed
            </h2>
            <p className="text-sm text-neutral-600 dark:text-gray-400 mb-8 leading-relaxed">
              {errorMsg}
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-[2px] shadow-lg transition-all flex justify-center items-center gap-2 text-sm"
            >
              Back to Login <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
