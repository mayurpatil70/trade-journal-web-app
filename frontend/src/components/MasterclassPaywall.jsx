// frontend/src/components/MasterclassPaywall.jsx
// Modern macOS / iOS Apple HIG Bento Redesign for Prop Firm Masterclass

import { useState, useEffect } from "react";
import {
  Lock,
  ArrowRight,
  CheckCircle,
  Copy,
  Loader2,
  ShieldCheck,
  Sparkles,
  Award,
  Upload,
  FileCheck,
  AlertCircle,
  Clock,
  Coins,
} from "lucide-react";
import api from "../api/axios";

export default function MasterclassPaywall() {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState(null);
  const [chain, setChain] = useState("BEP20");
  const [txHash, setTxHash] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const PRICE = 7.0;

  useEffect(() => {
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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleVerify = async () => {
    if (txHash.length < 10) {
      alert("Please enter a valid Transaction Hash (TXID).");
      return;
    }
    setIsProcessing(true);

    const userId =
      localStorage.getItem("userId") || localStorage.getItem("userEmail");

    try {
      const submitData = new FormData();
      submitData.append("userId", userId);
      submitData.append("txHash", txHash.trim());
      submitData.append("chain", chain);

      const fileInput = document.getElementById("masterclass-payment-screenshot");
      if (fileInput && fileInput.files[0]) {
        submitData.append("screenshot", fileInput.files[0]);
      } else {
        alert("Please upload a payment screenshot.");
        setIsProcessing(false);
        return;
      }

      await api.post("/api/subscriptions/masterclass/verify", submitData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setStep(3); // Success / Pending Screen
    } catch (error) {
      alert(error.response?.data?.error || "Payment verification failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!config) {
    return (
      <div className="p-12 flex flex-col items-center justify-center rounded-3xl bg-white/70 dark:bg-[#12151e]/70 border border-black/[0.06] dark:border-white/[0.08] backdrop-blur-xl">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-2" />
        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
          Loading checkout configuration...
        </span>
      </div>
    );
  }

  const PAY_ADDRESS = config.wallets?.[chain] || "";

  return (
    <div className="rounded-3xl bg-white/90 dark:bg-[#12151e]/85 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] overflow-hidden mb-8 relative group transition-all duration-300">
      {/* Subtle macOS Ambient Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent rounded-full blur-3xl pointer-events-none group-hover:from-amber-500/15 transition-all duration-500" />

      {/* ── STEP 1: Hero Banner Card ── */}
      <div className="p-6 sm:p-8 border-b border-black/[0.05] dark:border-white/[0.06] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 shadow-sm">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>VIP Masterclass Pass</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>Industry Certified</span>
            </span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              Prop Firm Pass Masterclass
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 font-medium leading-relaxed max-w-2xl mt-1.5">
              How to pass propfirm challenges: detailed guidance from our industry experts.
              Start-to-end framework for traders until real payouts arrive in your wallet.
            </p>
          </div>

          {/* Feature Highlights Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="px-3 py-1 rounded-xl bg-neutral-100 dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
              🛡️ 100% Rule Compliance
            </span>
            <span className="px-3 py-1 rounded-xl bg-neutral-100 dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
              📉 Drawdown Protection Matrix
            </span>
            <span className="px-3 py-1 rounded-xl bg-neutral-100 dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
              💰 Payout Roadmap
            </span>
          </div>
        </div>

        {step === 1 && (
          <div className="w-full lg:w-auto shrink-0 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer group/btn"
            >
              <span>Get Access — ${PRICE.toFixed(0)}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
            </button>
          </div>
        )}
      </div>

      {/* ── STEP 2: Modern Apple HIG Checkout Flow ── */}
      {step === 2 && (
        <div className="p-6 sm:p-8 space-y-6 animate-in slide-in-from-top-4 duration-200 relative z-10 max-w-2xl mx-auto">
          {/* Header & Step progress */}
          <div className="text-center space-y-1 mb-2">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              Complete USDT Checkout
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Send payment via Binance Smart Chain (BEP20) and upload verification
            </p>
          </div>

          {/* Amount Card */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400 block mb-1">
              Send Exactly
            </span>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-extrabold font-mono text-neutral-900 dark:text-white tracking-tight">
                {PRICE.toFixed(2)} USDT
              </span>
              <button
                type="button"
                onClick={() => handleCopy(PRICE.toString(), "amt")}
                className="p-2 rounded-xl bg-white dark:bg-white/10 text-amber-600 dark:text-amber-300 hover:text-neutral-900 dark:hover:text-white border border-amber-500/30 transition-colors shadow-sm cursor-pointer"
                title="Copy amount"
              >
                {copied === "amt" ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Destination Address Container */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
              <span className="text-neutral-600 dark:text-neutral-400">Deposit Address (BEP20)</span>
              <span className="text-rose-600 dark:text-rose-400 font-extrabold px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20">
                BSC Network only
              </span>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-2xl bg-neutral-100/80 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] shadow-inner">
              <span
                className="text-xs sm:text-sm font-mono font-semibold text-neutral-900 dark:text-amber-300 truncate flex-1 select-all"
                title={PAY_ADDRESS}
              >
                {PAY_ADDRESS}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(PAY_ADDRESS, "addr")}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                {copied === "addr" ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Payment Screenshot File Upload */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 block">
              Payment Screenshot
            </label>
            <div className="relative">
              <input
                id="masterclass-payment-screenshot"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="masterclass-payment-screenshot"
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-neutral-100/80 dark:bg-white/[0.04] border border-dashed border-neutral-300 dark:border-white/15 hover:border-amber-500 dark:hover:border-amber-400/50 transition-all cursor-pointer group/upload"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    {selectedFile ? (
                      <FileCheck className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate max-w-[240px]">
                      {selectedFile ? selectedFile.name : "Upload transaction screenshot"}
                    </p>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                      {selectedFile
                        ? `${(selectedFile.size / 1024).toFixed(0)} KB attached`
                        : "PNG, JPG or JPEG from your wallet"}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 group-hover/upload:underline">
                  {selectedFile ? "Change file" : "Browse"}
                </span>
              </label>
            </div>
          </div>

          {/* TXID Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 block">
              Transaction Hash (TXID)
            </label>
            <input
              type="text"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="Paste 0x... transaction hash"
              className="w-full px-4 py-3 rounded-2xl bg-neutral-100/80 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] text-sm font-mono text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-5 py-3 rounded-2xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-neutral-700 dark:text-neutral-300 font-semibold text-xs sm:text-sm transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleVerify}
              disabled={isProcessing || txHash.trim().length < 10}
              className="flex-1 py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Transaction...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Submit for Verification</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Pending Verification State ── */}
      {step === 3 && (
        <div className="p-8 sm:p-12 flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-200 relative z-10 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow-sm">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
              Payment Under Review
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed mt-1">
              Your transaction has been submitted. Our compliance team verifies blockchain deposits promptly.
              You will receive full access once confirmed.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 pt-2">
            <Clock className="w-4 h-4 animate-pulse text-amber-500" />
            <span>Average confirmation time: 10–30 minutes</span>
          </div>

          <button
            type="button"
            onClick={() => setStep(1)}
            className="mt-4 px-6 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-neutral-700 dark:text-neutral-300 font-bold text-xs transition-colors cursor-pointer"
          >
            Back to Overview
          </button>
        </div>
      )}
    </div>
  );
}
