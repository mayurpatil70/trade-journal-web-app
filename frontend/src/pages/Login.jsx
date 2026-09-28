// frontend/src/pages/Login.jsx
import { useState } from "react";
import api from "../api/axios";
import { ArrowRight, Activity } from "lucide-react"; // Using Activity as a placeholder HD logo

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
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col justify-center items-center p-4 font-sans text-white">
      <div className="w-full max-w-[400px]">
        {/* Logo & Branding */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 bg-[#6366f1] rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(99,102,241,0.4)]">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Forex Notes
          </h1>
          <p className="text-xs font-semibold tracking-[0.2em] text-gray-400 uppercase text-center">
            Discipline Today.
            <br />
            Freedom Tomorrow.
          </p>
        </div>

        {status === "success" ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center animate-in fade-in">
            <h3 className="text-lg font-semibold mb-2">Check your inbox</h3>
            <p className="text-gray-400 text-sm">
              We sent a secure link to{" "}
              <span className="text-white font-medium">{email}</span>
            </p>
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-semibold mb-2">Sign in or register</h2>
            <p className="text-gray-400 text-sm mb-6">
              Enter your email to receive a secure, passwordless verification
              code.
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 ml-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 bg-[#171717] border border-[#262626] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6366f1] transition-colors"
                  placeholder="you@example.com"
                  required
                  disabled={status === "loading"}
                />
              </div>

              {status === "error" && (
                <p className="text-red-400 text-sm text-center">
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full py-3.5 px-4 bg-[#6366f1] hover:bg-[#4f46e5] text-white font-medium rounded-xl transition-all flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {status === "loading" ? "Sending..." : "Send Verification Code"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
