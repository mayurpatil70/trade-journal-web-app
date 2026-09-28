// frontend/src/pages/Login.jsx
import { useState } from "react";
import api from "../api/axios";
import { ArrowRight, Activity } from "lucide-react";

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

  return (
    <div
      className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Centered Card Container */}
      <div className="w-full max-w-md bg-[#121418] border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col items-center justify-center text-center">
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
          <div className="w-full bg-[#1a1d24] border border-white/5 rounded-2xl p-6 text-center animate-in fade-in">
            <h3 className="text-lg font-semibold text-white mb-2">
              Check your inbox
            </h3>
            <p className="text-gray-400 text-sm">
              We sent a secure link to{" "}
              <span className="text-white font-medium">{email}</span>
            </p>
          </div>
        ) : (
          <div className="w-full animate-in fade-in duration-300">
            <h2 className="text-xl font-semibold text-white mb-2">
              Sign in or register
            </h2>
            <p className="text-gray-400 text-sm mb-8 px-4">
              Enter your email to receive a secure, passwordless verification
              code.
            </p>

            <form
              onSubmit={handleLogin}
              className="space-y-5 w-full flex flex-col items-center"
            >
              <div className="w-full text-left">
                <label className="block text-xs font-medium text-gray-400 mb-2 ml-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-4 bg-[#1a1d24] border border-white/10 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-[#6366f1] transition-colors"
                  placeholder="you@example.com"
                  required
                  disabled={status === "loading"}
                />
              </div>

              {status === "error" && (
                <p className="text-red-400 text-sm">{errorMessage}</p>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full py-4 px-6 bg-[#6366f1] hover:bg-[#4f46e5] text-white font-semibold rounded-2xl transition-all flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {status === "loading" ? "Sending..." : "Send Verification Code"}
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
