import { useState, useEffect } from "react";
import {
  Lock,
  ArrowRight,
  CheckCircle,
  Copy,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import api from "../api/axios";

export default function MasterclassPaywall() {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState(null);
  const [chain, setChain] = useState("BEP20");
  const [txHash, setTxHash] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState("");

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

  const handleVerify = async () => {
    if (txHash.length < 10)
      return alert("Please enter a valid Transaction Hash.");
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
        return alert("Please upload a payment screenshot.");
      }

      await api.post("/api/subscriptions/masterclass/verify", submitData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setStep(3); // Success/Pending Screen
      // Only redirect if they want to discord automatically, but we want pending state.
      // So let's just let it be pending.
    } catch (error) {
      alert(
        error.response?.data?.error ||
          "Payment verification failed."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (!config)
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-6 h-6 text-yellow-500 animate-spin" />
      </div>
    );

  const PAY_ADDRESS = config.wallets[chain];

  return (
    <div className="bg-gradient-to-br from-[#161412] via-[#0f1115] to-[#0a0c0f] border border-amber-500/35 rounded-2xl shadow-[0_0_40px_rgba(245,158,11,0.12),0_1px_0_rgba(255,255,255,0.08)_inset] overflow-hidden mb-8 relative group">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-transparent rounded-full blur-3xl pointer-events-none group-hover:from-amber-500/30 transition-all duration-500" />

      <div className="p-6 md:p-8 bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-transparent border-b border-amber-500/20 flex flex-col md:flex-row items-center gap-6 text-center md:text-left relative z-10">
        <div className="flex-1">
          <h2
            className="text-xl md:text-2xl font-black mb-1.5 tracking-tight drop-shadow-sm"
            style={{ color: '#ffffff' }}
          >
            Prop Firm Pass Masterclass
          </h2>
          <p
            className="text-sm font-medium leading-relaxed max-w-2xl"
            style={{ color: 'rgba(254, 243, 199, 0.92)' }}
          >
            How to pass propfirm challenges: detailed guidance from our industry
            experts. Start to end help for traders until payout arrives.
          </p>
        </div>
        {step === 1 && (
          <button
            onClick={() => setStep(2)}
            className="w-full md:w-auto px-7 py-3.5 font-black text-sm rounded-xl transition-all duration-300 flex items-center justify-center gap-2 tracking-wide cursor-pointer group/btn"
            style={{
              background: 'linear-gradient(180deg, #fef08a 0%, #facc15 35%, #eab308 70%, #ca8a04 100%)',
              color: '#422006',
              border: '1px solid rgba(254, 240, 138, 0.9)',
              boxShadow: '0 0 28px rgba(234, 179, 8, 0.55), 0 4px 14px rgba(202, 138, 4, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.9), inset 0 -2px 3px rgba(113, 63, 18, 0.35)',
              textShadow: '0 1px 0 rgba(255, 255, 255, 0.5)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 0 38px rgba(234, 179, 8, 0.8), 0 6px 20px rgba(202, 138, 4, 0.5), inset 0 1px 2px rgba(255, 255, 255, 1), inset 0 -2px 3px rgba(113, 63, 18, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 0 28px rgba(234, 179, 8, 0.55), 0 4px 14px rgba(202, 138, 4, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.9), inset 0 -2px 3px rgba(113, 63, 18, 0.35)';
            }}
          >
            <span>Get Access - ${PRICE}</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
          </button>
        )}
      </div>

      {step === 2 && (
        <div className="p-6 md:p-8 space-y-6 animate-in slide-in-from-top-4 relative z-10">
          <div className="bg-black/40 border border-white/5 rounded-xl p-4 text-center max-w-sm mx-auto">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
              Send Exactly
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-black" style={{ color: '#ffffff' }}>
                {PRICE.toFixed(2)} USDT
              </span>
              <button
                onClick={() => handleCopy(PRICE.toString(), "amt")}
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

          <div className="max-w-sm mx-auto space-y-2">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex justify-between">
              To Address (BEP20){" "}
              <span className="text-red-400">BSC Network only</span>
            </p>
            <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-xl p-1.5 pl-4">
              <span className="text-xs font-mono text-white truncate flex-1" style={{ color: '#ffffff' }}>
                {PAY_ADDRESS}
              </span>
              <button
                onClick={() => handleCopy(PAY_ADDRESS, "addr")}
                className="px-4 py-2 bg-yellow-500/20 text-yellow-500 font-bold text-xs rounded-lg hover:bg-yellow-500/30 transition-colors"
              >
                {copied === "addr" ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div className="max-w-sm mx-auto pt-4 border-t border-white/5 space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Payment Screenshot
            </label>
            <input
              id="masterclass-payment-screenshot"
              type="file"
              accept="image/*"
              className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-yellow-500/20 file:text-yellow-500 hover:file:bg-yellow-500/30 transition-all cursor-pointer"
            />
          </div>

          <div className="max-w-sm mx-auto pt-4 border-t border-white/5 space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Transaction Hash (TXID)
            </label>
            <input
              type="text"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="Paste TXID..."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-mono text-white focus:border-yellow-500 outline-none transition-colors"
            />
          </div>

          <div className="max-w-sm mx-auto flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-4 font-bold text-gray-400 hover:text-white transition-colors text-sm rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleVerify}
              disabled={isProcessing || txHash.trim().length < 10}
              className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                </>
              ) : (
                "Verify Payment"
              )}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="p-8 flex flex-col items-center text-center space-y-4 animate-in zoom-in-95">
          <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center border border-yellow-500/20 mb-2">
            <ShieldCheck className="w-8 h-8 text-yellow-500" />
          </div>
          <h3 className="text-2xl font-black text-white" style={{ color: '#ffffff' }}>Payment Pending Verification</h3>
          <p className="text-sm text-gray-400">
            Your payment has been submitted. Our admin team will verify it shortly.
          </p>
          <Loader2 className="w-6 h-6 text-yellow-500 animate-spin mt-4" />
        </div>
      )}
    </div>
  );
}
