// frontend/src/pages/Support.jsx
// Institutional Help & Support Page (Matches TradeFXBook Help & Support Architecture)

import { useState } from "react";
import {
  HelpCircle,
  Mail,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  Clock,
  Lock,
  ChevronDown,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import SupportFeedbackModal from "../components/support/SupportFeedbackModal";

export default function Support() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("new"); // "new" | "list"
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const SUPPORT_EMAIL = "forexnotes26@gmail.com";
  const INSTAGRAM_URL =
    "https://www.instagram.com/forexnotes.in?obrf=MXIxa2szOWNqNjYzag==";
  const DISCORD_URL = "https://discord.gg/Ajaw3AjfWE";

  const handleCopyEmail = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(SUPPORT_EMAIL);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const openNewReportModal = () => {
    setModalMode("new");
    setIsModalOpen(true);
  };

  const openReportsListModal = () => {
    setModalMode("list");
    setIsModalOpen(true);
  };

  const faqs = [
    {
      category: "GETTING STARTED",
      q: "How do I connect my MT5 account?",
      a: "Navigate to Tools > MT5 AI Bot or connect via your account settings. Enter your MT5 Account ID, Server name, and Investor/Trading password to securely sync your live and demo tickets.",
    },
    {
      category: "TROUBLESHOOTING",
      q: "Why are my trades not syncing?",
      a: "Check that your MT5 terminal has WebRequest enabled for our domain, or verify that your exchange API keys have read permissions enabled and haven't expired.",
    },
    {
      category: "SECURITY",
      q: "How is my data protected?",
      a: "All trade records, account balances, and journals are AES-256 encrypted at rest, transmitted over TLS 1.3, and isolated strictly to your authenticated session.",
    },
    {
      category: "FEATURES",
      q: "Can I export my journal entries?",
      a: "Yes! In Past Trades and Performance Analytics, click Export to download your complete history formatted in CSV, Excel, or PDF report formats.",
    },
    {
      category: "FEATURES",
      q: "How do I choose, move or resize columns in the trades table?",
      a: "From the Past Trades table view, click 'Columns' at the top right to toggle visibility, or drag column headers to reorder them to your preferred layout.",
    },
    {
      category: "FEATURES",
      q: "Can I see totals for a group of trades?",
      a: "Yes! Use the multi-filter bar by Symbol, Outcome, Strategy, or Session in Trade Analysis and Dashboard to see instant group sums and expectancy.",
    },
    {
      category: "FEATURES",
      q: "How do I arrange journal and trade analysis sections?",
      a: "In Trade Analysis, you can switch between Overview, Playbook, Risk Analytics, and Mistake Hub tabs to customize your diagnostic workflow.",
    },
    {
      category: "BILLING",
      q: "What's included in the Pro plan?",
      a: "Pro Workspace unlocks unlimited accounts, AI Performance Labs, Automated Rule Guardrails, MT5 Auto-Sync, and priority Discord support.",
    },
    {
      category: "BILLING",
      q: "How do I cancel my subscription?",
      a: "Go to Profile > Subscription Plan, or visit the Paywall tab to manage your recurring billing or disconnect your crypto wallet at any time.",
    },
    {
      category: "GETTING STARTED",
      q: "What brokers are supported?",
      a: "ForexNotes is broker-agnostic and supports all major Forex, Indices, and Crypto brokers including FTMO, FundingPips, IC Markets, Exness, Binance, and Bybit.",
    },
    {
      category: "ACCOUNT",
      q: "How do I reset my password?",
      a: "If using magic link or email authentication, request a fresh login link from the Login screen. You can also update your security credentials in Profile Settings.",
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24 font-sans">
      {/* ── TOP HERO HEADER (Matches Screenshot 4) ── */}
      <div className="rounded-3xl bg-white dark:bg-[#12151e]/85 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] p-6">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shadow-sm">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
              Help & Support
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
              We're here to help you succeed
            </p>
          </div>
        </div>
      </div>

      {/* ── TWO COLUMN MAIN SECTION (Contact Us & Support Expectations) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── LEFT CARD: Contact Us ── */}
        <div className="rounded-3xl bg-white dark:bg-[#12151e]/85 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-black/[0.05] dark:border-white/[0.06]">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                Contact Us
              </h2>
            </div>

            {/* Row 1: Your reports & feedback row */}
            <div
              onClick={openReportsListModal}
              className="p-3.5 rounded-2xl bg-neutral-50/80 dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05] hover:border-blue-500/30 transition-all cursor-pointer flex items-center justify-between group mb-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white dark:bg-white/[0.06] border border-black/[0.05] dark:border-white/[0.08] flex items-center justify-center text-neutral-600 dark:text-neutral-300">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Your reports & feedback
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Track status of your tickets or send a new request
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
            </div>

            {/* Row 2: Email Support Card */}
            <div className="p-4 rounded-2xl bg-neutral-50/80 dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05] flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                    Email Support
                  </span>
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="text-sm font-bold text-neutral-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {SUPPORT_EMAIL}
                  </a>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    We typically respond within 24 hours
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="p-2 rounded-xl bg-white dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] hover:bg-neutral-100 dark:hover:bg-white/[0.1] text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
                  title="Copy email to clipboard"
                >
                  {copiedEmail ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors"
                  title="Open mail client"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Row 3: Two Social Channels Side-by-Side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {/* Instagram Card */}
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-2xl bg-neutral-50/80 dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05] hover:border-pink-500/30 transition-all flex items-center gap-3 group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.13-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>
                <div>
                  <span className="text-xs font-bold text-neutral-900 dark:text-white block group-hover:text-pink-600 transition-colors">
                    Instagram
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    @forexnotes.in
                  </span>
                </div>
              </a>

              {/* Discord Card */}
              <a
                href={DISCORD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-2xl bg-neutral-50/80 dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05] hover:border-indigo-500/30 transition-all flex items-center gap-3 group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-[#5865F2] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <svg
                    className="w-4 h-4 fill-current"
                    viewBox="0 0 127.14 96.36"
                  >
                    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.86,53,48.81,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
                  </svg>
                </div>
                <div>
                  <span className="text-xs font-bold text-neutral-900 dark:text-white block group-hover:text-indigo-600 transition-colors">
                    Discord
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    Join Community
                  </span>
                </div>
              </a>
            </div>
          </div>

          {/* Row 4: Status footer bar */}
          <div className="pt-3 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span className="flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                All Systems Operational
              </span>
            </span>
            <span className="text-[11px] text-neutral-400">
              Updated just now
            </span>
          </div>
        </div>

        {/* ── RIGHT CARD: Support Expectations ── */}
        <div className="rounded-3xl bg-white dark:bg-[#12151e]/85 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-black/[0.05] dark:border-white/[0.06]">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                Support Expectations
              </h2>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4 leading-relaxed">
              Need a hand with your account, billing, or data sync? Reach out to
              the support team and we'll guide you through the next steps.
            </p>

            <div className="space-y-3">
              {/* Item 1: Email Support */}
              <div className="p-3 rounded-2xl bg-neutral-50/80 dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05] flex items-start gap-3">
                <Mail className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    Email Support
                  </h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Contact{" "}
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                      forexnotes26@gmail.com
                    </span>{" "}
                    for account and billing help
                  </p>
                </div>
              </div>

              {/* Item 2: Response Times */}
              <div className="p-3 rounded-2xl bg-neutral-50/80 dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05] flex items-start gap-3">
                <Clock className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    Response Times
                  </h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Most support emails receive a reply within 24 hours
                  </p>
                </div>
              </div>

              {/* Item 3: Secure Assistance */}
              <div className="p-3 rounded-2xl bg-neutral-50/80 dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05] flex items-start gap-3">
                <Lock className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    Secure Assistance
                  </h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    We only use secure, account-linked support channels
                  </p>
                </div>
              </div>

              {/* Item 4: FAQ First */}
              <div className="p-3 rounded-2xl bg-neutral-50/80 dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05] flex items-start gap-3">
                <HelpCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    FAQ First
                  </h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Common onboarding and troubleshooting answers are below
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Support Main Button (Opens Modal) */}
          <div className="pt-3 border-t border-black/[0.05] dark:border-white/[0.06]">
            <button
              onClick={openNewReportModal}
              className="w-full py-3 px-4 rounded-2xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-neutral-900 dark:text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <Mail className="w-4 h-4 text-blue-500" />
              <span>Contact Support</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── FREQUENTLY ASKED QUESTIONS SECTION (Matches Screenshot Exactly) ── */}
      <div>
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-[#0066FF] dark:text-[#38bdf8] border border-blue-500/20 flex items-center justify-center shadow-xs shrink-0 font-bold">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
              Quick answers to common questions
            </p>
          </div>
        </div>

        {/* 2-Column Accordion Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {faqs.map((faq, i) => {
            const isOpen = openFaqIndex === i;
            return (
              <div
                key={i}
                className="p-5 rounded-2xl bg-white dark:bg-[#12151e]/85 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition-all hover:border-black/[0.1] dark:hover:border-white/[0.15]"
              >
                <div
                  onClick={() => setOpenFaqIndex(isOpen ? null : i)}
                  className="flex items-start justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex-1">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-[#0066FF] dark:text-blue-400 border border-blue-500/15 mb-2">
                      {faq.category}
                    </span>
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-snug">
                      {faq.q}
                    </h3>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-400 transition-transform duration-200 shrink-0 mt-1 ${
                      isOpen ? "rotate-180 text-blue-500" : ""
                    }`}
                  />
                </div>

                {isOpen && (
                  <p className="text-xs sm:text-[13px] text-neutral-600 dark:text-neutral-300 leading-relaxed mt-3 pt-3 border-t border-black/[0.05] dark:border-white/[0.06] animate-in fade-in duration-150">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Help & Feedback Modal Mount ── */}
      <SupportFeedbackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialMode={modalMode}
      />
    </div>
  );
}
