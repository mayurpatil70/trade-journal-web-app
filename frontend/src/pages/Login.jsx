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
      await api.post("/api/auth/login", { email });
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error.response?.data?.error || "Failed to send login link.",
      );
    }
  };

  // Standardized UI input styling matching the rest of the application
  const inputClass =
    "appearance-none box-border w-full min-h-[52px] block bg-gray-50 dark:bg-[#0b131d] border border-gray-300 dark:border-[#1f2c3b] rounded-[2px] px-4 py-3 !text-gray-900 dark:!text-white font-bold focus:border-[#2f8df4] focus:ring-1 focus:ring-[#2f8df4] outline-none text-sm text-center [text-align-last:center] shadow-sm transition-all";

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-200 flex items-center justify-center p-4 sm:p-6 transition-colors duration-200"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Centered Card Container */}
      <div className="w-full max-w-md bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-8 sm:p-10 shadow-xl flex flex-col items-center text-center">
        {/* Logo & Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-[#2f8df4] rounded-[2px] flex items-center justify-center mb-5 shadow-lg">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
            Forex Notes
          </h1>
          <p className="text-[10px] font-bold tracking-[0.25em] text-[#2f8df4] uppercase">
            Discipline Today.
            <br />
            Freedom Tomorrow.
          </p>
        </div>

        {status === "success" ? (
          <div className="w-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-[2px] p-6 text-center animate-in fade-in duration-300">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Check your inbox
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              We sent a secure link to <br />
              <span className="text-gray-900 dark:text-white font-bold mt-1 inline-block">
                {email}
              </span>
            </p>
          </div>
        ) : (
          <div className="w-full animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Sign in or register
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 px-2 leading-relaxed">
              Enter your email to receive a secure, passwordless verification
              link. No password required.
            </p>

            <form
              onSubmit={handleLogin}
              className="space-y-5 w-full flex flex-col items-center"
            >
              <div className="w-full text-left">
                <label className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest block mb-2 text-center">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="you@example.com"
                  required
                  disabled={status === "loading"}
                />
              </div>

              {status === "error" && (
                <div className="w-full flex items-center justify-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-[2px] text-red-600 dark:text-red-400 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full py-4 px-6 bg-[#2f8df4] hover:bg-[#2376e8] text-white font-bold rounded-[2px] shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50 text-sm mt-2"
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
