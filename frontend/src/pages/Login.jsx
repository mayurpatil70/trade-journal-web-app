// frontend/src/pages/Login.jsx
import { useState } from "react";
import axios from "axios";
import api from "../api/axios";
import { Mail, ArrowRight, Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email) {
      setErrorMessage("Please enter your email address.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      // Connects to your Node.js backend
      await api.post("/api/auth/login", { email });
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error.response?.data?.error ||
          "Failed to send login link. Please try again.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-journalDark flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-[#121418] border border-gray-800 rounded-xl shadow-2xl p-8">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-white">F</span>
            <span className="text-journalEmerald uppercase">Journal</span>
          </h1>
          <p className="text-gray-400 text-sm">
            Sign in to track, review, and improve your edge.
          </p>
        </div>

        {/* Success State */}
        {status === "success" ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-6 text-center text-emerald-400">
            <Mail className="w-12 h-12 mx-auto mb-4 opacity-80" />
            <h3 className="text-lg font-medium text-white mb-2">
              Check your email
            </h3>
            <p className="text-sm">
              We sent a magic link to{" "}
              <span className="font-semibold text-white">{email}</span>. Click
              it to log in securely.
            </p>
          </div>
        ) : (
          /* Login Form */
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-700 rounded-lg bg-journalDark text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-journalEmerald focus:border-transparent transition-all"
                  placeholder="trader@example.com"
                  disabled={status === "loading"}
                />
              </div>
            </div>

            {/* Error Message */}
            {status === "error" && (
              <p className="text-red-400 text-sm text-center bg-red-400/10 py-2 rounded-md">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-journalDark bg-journalEmerald hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-journalEmerald focus:ring-offset-journalDark disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  Sending Link...
                </>
              ) : (
                <>
                  Continue with Email
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
