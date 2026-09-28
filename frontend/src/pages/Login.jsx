// frontend/src/pages/Login.jsx
import { useState } from "react";
import api from "../api/axios"; // Import the custom client
import { Mail, ArrowRight, Loader2, Sparkles } from "lucide-react";

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
      // Uses the centralized API configuration
      await api.post("/api/auth/login", { email });
      setStatus("success");
    } catch (error) {
      console.error("Login Error Details:", error);
      setStatus("error");
      setErrorMessage(
        error.response?.data?.error ||
          "Failed to send login link. Please ensure your backend is running.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0f11] relative overflow-hidden flex flex-col justify-center items-center p-4">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
      <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-journalEmerald/10 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md bg-white/[0.02] backdrop-blur-2xl border border-white/[0.05] rounded-3xl shadow-2xl p-10 relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.05] mb-6 shadow-inner">
            <Sparkles className="w-8 h-8 text-journalEmerald" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">
            <span className="text-white">Forex Notes</span>
            <span className="bg-gradient-to-r from-journalEmerald to-emerald-300 bg-clip-text text-transparent uppercase ml-1">
              Discipline today <br /> Freedom tomorrow
            </span>
          </h1>
          <p className="text-gray-400 text-sm font-medium">
            Track, review, and master your edge.
          </p>
        </div>

        {status === "success" ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8 text-center transform transition-all animate-in fade-in zoom-in duration-500">
            <Mail className="w-12 h-12 text-emerald-400 mx-auto mb-5 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
            <h3 className="text-xl font-bold text-white mb-2">
              Check your inbox
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              We've sent a secure link to join our discord community and verify
              your <br />
              <span className="font-semibold text-white">{email}</span>
            </p>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="group">
              <label
                htmlFor="email"
                className="block text-xs font-semibold tracking-wider text-gray-500 uppercase mb-2 ml-1"
              >
                Email Address
              </label>
              <div className="relative transition-all duration-300 group-focus-within:drop-shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-journalEmerald transition-colors" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/[0.05] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-journalEmerald/50 focus:bg-white/[0.05] transition-all duration-300"
                  placeholder="trader@example.com"
                  required
                  disabled={status === "loading"}
                />
              </div>
            </div>

            {status === "error" && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl text-center">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full group relative flex justify-center items-center gap-3 py-4 px-4 rounded-xl text-sm font-bold text-white bg-journalEmerald/10 border border-journalEmerald/30 hover:bg-journalEmerald hover:text-journalDark focus:outline-none disabled:opacity-50 transition-all duration-300 hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:-translate-y-0.5"
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  Generating Link...
                </>
              ) : (
                <>
                  Continue with Email
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
