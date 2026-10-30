// frontend/src/pages/AffiliateDashboard.jsx
// macOS / iOS Apple HIG Bento Redesign for Affiliate Partner Hub

import { useEffect, useState } from "react";
import {
  Wallet,
  Link2,
  Copy,
  Check,
  Coins,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  CheckCircle,
  Share2,
  Users,
  Sparkles,
  Loader2,
  AlertCircle,
} from "lucide-react";
import api from "../api/axios";
import WinProPartnershipCard from "../components/partnership/WinProPartnershipCard";

export default function AffiliateDashboard() {
  const [profile, setProfile] = useState(null);
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get("/api/affiliate/profile");
      setProfile(response.data.profile);
    } catch (error) {
      console.error("Failed to load affiliate profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (text, type = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopyLink = () => {
    const link = `https://forexnotes.in/?ref=${profile?.referral_code || ""}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    showToast("Referral link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleWithdraw = async () => {
    const balance = Number(profile?.wallet_balance || 0);
    if (balance < 25) {
      showToast("Minimum $25.00 balance required to withdraw.", "error");
      return;
    }
    if (!withdrawAddress.trim() || withdrawAddress.trim().length < 20) {
      showToast("Please enter a valid BEP20 USDT wallet address.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/api/affiliate/withdraw", { withdrawAddress: withdrawAddress.trim() });
      showToast("Withdrawal requested! Processing takes 3-5 business days.");
      fetchProfile();
      setWithdrawAddress("");
    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.error || "Error requesting withdrawal. Try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
          Loading affiliate partner hub...
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <AlertCircle className="w-10 h-10 text-neutral-400 mb-3" />
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
          Session Required
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm">
          Please log in to access your institutional affiliate dashboard and commission balances.
        </p>
      </div>
    );
  }

  const balance = Number(profile.wallet_balance || 0);
  const minThreshold = 25.0;
  const progressPercent = Math.min(100, Math.max(0, (balance / minThreshold) * 100));
  const referralUrl = `https://forexnotes.in/?ref=${profile.referral_code}`;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[9999] animate-in slide-in-from-top-3 fade-in duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl backdrop-blur-xl border flex items-center gap-2.5 text-xs font-semibold ${
              toastMessage.type === "error"
                ? "bg-rose-500/95 text-white border-rose-400/30 shadow-rose-500/20"
                : "bg-emerald-600/95 text-white border-emerald-400/30 shadow-emerald-500/20"
            }`}
          >
            {toastMessage.type === "error" ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* ── TOP HERO HEADER (Matches macOS / iOS Apple HIG Bento) ── */}
      <div className="rounded-3xl bg-white dark:bg-[#12151e]/85 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shadow-sm shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
                  Affiliate Partner Hub
                </h1>
                <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                  10% Recurring Share
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                Earn 10% on every Monthly ($1.40) and Yearly ($11.40) sale generated through your referral link.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── TWO BENTO ACTION CARDS (Referral Link & Available Earnings) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── CARD 1: Your Referral Link ── */}
        <div className="rounded-3xl bg-white dark:bg-[#12151e]/85 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] p-6 sm:p-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.05] dark:border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Link2 className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Your Referral Link
                </h2>
              </div>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                Active Link
              </span>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Earn <span className="font-bold text-neutral-900 dark:text-white">10% recurring commission</span> on every Monthly ($1.40) and Yearly ($11.40) sale. Share your unique invite URL across trading communities, YouTube, Twitter/X, or Discord.
            </p>

            {/* Apple Styled Link Container */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-neutral-100/90 dark:bg-black/30 border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between gap-3 shadow-inner">
              <span className="font-mono text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-400 truncate select-all flex-1">
                {referralUrl}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Commission Stats Grid */}
          <div className="grid grid-cols-3 gap-2.5 pt-2">
            <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-0.5">
                Commission
              </span>
              <span className="text-sm font-extrabold text-neutral-900 dark:text-white">
                10%
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-0.5">
                Monthly
              </span>
              <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">
                $1.40
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-0.5">
                Yearly
              </span>
              <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">
                $11.40
              </span>
            </div>
          </div>
        </div>

        {/* ── CARD 2: Available Earnings & Withdrawal ── */}
        <div className="rounded-3xl bg-white dark:bg-[#12151e]/85 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] p-6 sm:p-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.05] dark:border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Available Earnings
                </h2>
              </div>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20">
                USDT (BEP20)
              </span>
            </div>

            {/* Giant Apple Mono Balance */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block mb-1">
                Withdrawable Balance
              </span>
              <div className="text-4xl sm:text-5xl font-mono font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">
                ${balance.toFixed(2)}
              </div>
            </div>

            {/* Progress to Minimum Threshold Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                <span>Threshold: $25.00 min</span>
                <span>{progressPercent.toFixed(0)}% reached</span>
              </div>
              <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Wallet Address Input */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 block">
                Your BEP20 USDT Address
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-neutral-100/80 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] text-sm font-mono text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
              />
            </div>
          </div>

          {/* Withdraw Button & Footnote */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleWithdraw}
              disabled={balance < minThreshold || isSubmitting}
              className={`w-full py-3 px-6 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                balance >= minThreshold && !isSubmitting
                  ? "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/25 active:scale-[0.98] cursor-pointer"
                  : "bg-neutral-100 dark:bg-white/[0.04] text-neutral-400 dark:text-neutral-500 border border-black/[0.05] dark:border-white/[0.06] cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Request...</span>
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-4 h-4" />
                  <span>
                    {balance >= minThreshold
                      ? "Withdraw to Wallet"
                      : `Withdraw to Wallet (Min $${minThreshold.toFixed(0)})`}
                  </span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
              <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span>Withdrawals take 3-5 business days to be manually verified and paid.</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── STRATEGIC BROKER PARTNERSHIP SECTION (WinProFX × Rayan FX) ── */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 px-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
            Official Broker Partnership
          </span>
        </div>
        <WinProPartnershipCard isEmbedded={true} />
      </div>

      {/* ── 3-STEP BENTO EXPLANATION ROW ── */}
      <div className="rounded-3xl bg-white dark:bg-[#12151e]/85 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] p-6 sm:p-7">
        <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-4">
          How the ForexNotes Partner Program Works
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05] space-y-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
              1
            </div>
            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
              Share Your Referral Link
            </h4>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Distribute your personal link to other traders, community discords, or trading channels.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05] space-y-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
              2
            </div>
            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
              Traders Upgrade to Pro
            </h4>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
              When someone registers using your link and subscribes, your wallet balance immediately credits 10%.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05] space-y-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
              3
            </div>
            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
              Collect USDT Payouts
            </h4>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Once your balance reaches $25.00, submit your BEP20 USDT address for manual settlement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
