// frontend/src/pages/Paywall.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Lock,
  ArrowRight,
  CheckCircle,
  Copy,
  Loader2,
  ShieldCheck,
  Activity,
} from "lucide-react";
import api from "../api/axios";

export default function Paywall() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState(null);
  const [chain, setChain] = useState("TRC20");
  const [txHash, setTxHash] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    // Fetch wallet addresses and price from backend
    const fetchConfig = async () => {
      try {
        const res = await api.get("/api/subscriptions/config");
        setConfig(res.data);
      } catch (err) {
        console.error("Failed to load payment config", err);
      }
    };
    fetchConfig();
  }, []);

  const handleCopy = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied(""), 2000);
    } catch (err) {
      console.error("Copy failed");
    }
  };

  const handleVerify = async () => {
    if (txHash.length < 10)
      return alert("Please enter a valid Transaction Hash.");
    setIsProcessing(true);
    const userId =
      localStorage.getItem("userId") || localStorage.getItem("userEmail");

    try {
      await api.post("/api/subscriptions/verify", {
        userId,
        txHash: txHash.trim(),
        chain,
      });

      setStep(3); // Success Screen
      setTimeout(() => {
        // Hard refresh to clear the PaywallGuard cache and load the app
        window.location.href = "/dashboard";
      }, 2500);
    } catch (error) {
      alert(
        error.response?.data?.error ||
          "Payment verification failed. If you just sent it, wait 60 seconds for block confirmations.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 text-[#2f8df4] animate-spin" />
      </div>
    );
  }

  const PAY_ADDRESS = config.wallets[chain];

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4 font-sans"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Forex Notes
          </h1>
          <p className="text-sm text-gray-400 font-medium">
            The Ultimate Trade Journal
          </p>
        </div>

        <div className="bg-[#121418] border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative">
          <div className="p-6 bg-gradient-to-b from-white/5 to-transparent border-b border-white/5 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-3">
              <Lock className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">
              Lifetime Access
            </h2>
            <p className="text-xs text-gray-400">
              Unlock the journal, AI coach, and analytics.
            </p>
          </div>

          <div className="p-6 space-y-6">
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="text-center">
                  <span className="text-4xl font-black text-white">
                    ${config.price.toFixed(2)}
                  </span>
                  <span className="text-gray-500 text-sm ml-1">USDT</span>
                  <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-2">
                    One-time payment
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    Select Payment Network
                  </label>
                  {[
                    {
                      id: "BEP20",
                      label: "USDT (BNB Chain)",
                      hint: "Standard BSC network",
                    },
                  ].map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setChain(c.id)}
                      className={`w-full flex items-center justify-between p-4 border rounded-xl transition-all ${
                        chain === c.id
                          ? "border-blue-500 bg-blue-500/10 ring-1 ring-blue-500"
                          : "border-white/10 hover:border-white/20 bg-black/20"
                      }`}
                    >
                      <span className="text-sm font-bold text-white">
                        {c.label}
                      </span>
                      <span className="text-xs text-gray-500">{c.hint}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                >
                  Continue to Payment <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in slide-in-from-right-4">
                <div className="bg-black/40 border border-white/5 rounded-xl p-4 text-center">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                    Send Exactly
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-3xl font-black text-white">
                      {config.price.toFixed(2)} USDT
                    </span>
                    <button
                      onClick={() => handleCopy(config.price.toString(), "amt")}
                      className="p-1.5 text-gray-400 hover:text-white bg-white/5 rounded-md transition-colors"
                    >
                      {copied === "amt" ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex justify-between">
                    To Address ({chain}){" "}
                    <span className="text-red-400">
                      Do not send via other networks
                    </span>
                  </p>
                  <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-xl p-1.5 pl-4">
                    <span className="text-xs font-mono text-white truncate flex-1">
                      {PAY_ADDRESS}
                    </span>
                    <button
                      onClick={() => handleCopy(PAY_ADDRESS, "addr")}
                      className="px-4 py-2 bg-blue-500/20 text-blue-400 font-bold text-xs rounded-lg hover:bg-blue-500/30 transition-colors"
                    >
                      {copied === "addr" ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl mb-4">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">Payment Guidelines</p>
                  <p className="text-xs text-white">Binance -{'>'} Send/Withdraw -{'>'} USDT(TetherUS) -{'>'} Paste BEP20 Address -{'>'} Select BNB Smart Chain (BEP20) -{'>'} CONFIRM -{'>'} COPY TXID &amp; SCREENSHOT</p>
                </div>

                <div className="pt-4 border-t border-white/5 space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    Payment Screenshot
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30 transition-all cursor-pointer"
                  />
                </div>

                <div className="pt-4 border-t border-white/5 space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    Transaction Hash (TXID)
                  </label>
                  <input
                    type="text"
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    placeholder="Paste TXID..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-mono text-white focus:border-blue-500 outline-none transition-colors"
                  />
                </div>

                <button
                  onClick={handleVerify}
                  disabled={isProcessing || txHash.trim().length < 10}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Verifying
                      On-Chain...
                    </>
                  ) : (
                    "Verify Payment"
                  )}
                </button>

                <button
                  onClick={() => setStep(1)}
                  className="w-full text-xs font-bold text-gray-500 hover:text-white transition-colors"
                >
                  ← Back to Network Selection
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="py-8 flex flex-col items-center text-center space-y-4 animate-in zoom-in-95">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 mb-2">
                  <ShieldCheck className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-black text-white">
                  Access Granted!
                </h3>
                <p className="text-sm text-gray-400">
                  Your payment was verified. Loading your dashboard...
                </p>
                <Loader2 className="w-6 h-6 text-[#2f8df4] animate-spin mt-4" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
