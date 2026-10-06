// frontend/src/pages/Login.jsx
import { useState } from "react";
import api from "../api/axios";
import {
  ArrowRight,
  Activity,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    setErrorMessage("");

    try {
      // First attempt
      try {
        await api.post("/api/auth/login", { email });
      } catch (firstError) {
        console.warn("First login attempt failed, retrying...", firstError);
        // Second attempt (retry)
        await new Promise(resolve => setTimeout(resolve, 1000)); // wait 1s before retry
        await api.post("/api/auth/login", { email });
      }
      setStatus("success");
    } catch (error) {
      console.error("Login completely failed:", error);
      setStatus("error");
      
      // Provide a more user-friendly error message
      const serverError = error.response?.data?.error;
      if (serverError) {
         setErrorMessage(serverError);
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
         setErrorMessage("The server took too long to respond. Please try again.");
      } else {
         setErrorMessage("Network issue. Please check your connection and try again.");
      }
    }
  };

  return (
    <div
      className="min-h-screen bg-[#020202] text-white flex items-center justify-center p-6"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="w-full max-w-md bg-[#121418] border border-white/5 rounded-2xl p-8 sm:p-10 shadow-2xl flex flex-col items-center text-center">
        {/* Logo & Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-[#6366f1] rounded-full flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            Forex Notes
          </h1>
          <p className="text-[10px] font-bold tracking-[0.25em] text-gray-500 uppercase">
            Discipline Today.
            <br />
            Freedom Tomorrow.
          </p>
        </div>

        {status === "success" ? (
          <div className="w-full bg-[#1a1d24] border border-white/5 rounded-2xl p-6 text-center animate-in fade-in duration-300">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">
              Check your inbox
            </h3>
            <p className="text-sm text-gray-400">
              We sent a secure link to <br />
              <span className="text-white font-bold mt-1 inline-block">
                {email}
              </span>
            </p>
          </div>
        ) : (
          <div className="w-full animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-white mb-2">
              Sign in or register
            </h2>
            <p className="text-sm text-gray-400 mb-8 px-2 leading-relaxed">
              We respect your privacy and will never share your email with third
              parties. By signing in, you agree to our{" "}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Privacy Policy
              </a>
            </p>

            <form
              onSubmit={handleLogin}
              className="space-y-5 w-full flex flex-col items-center"
            >
              <div className="w-full text-left">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 ml-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-4 bg-[#1a1b20] border border-white/10 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] transition-all"
                  placeholder="you@example.com"
                  required
                  disabled={status === "loading"}
                />
              </div>

              {status === "error" && (
                <div className="w-full flex items-center justify-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full py-4 px-6 bg-[#6366f1] hover:bg-[#4f46e5] active:bg-[#4338ca] text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all flex justify-center items-center gap-2 disabled:opacity-50 text-sm mt-2"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    Send Verification Code <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
