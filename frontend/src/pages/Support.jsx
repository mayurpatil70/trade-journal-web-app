// frontend/src/pages/Support.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Headphones,
  MessageSquare,
  HelpCircle,
  Send,
  Loader2,
  CheckCircle,
  Camera,
  Zap,
} from "lucide-react";
import api from "../api/axios";

export default function Support() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const userId =
      localStorage.getItem("userId") || localStorage.getItem("userEmail");
    if (!userId) navigate("/login");
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    const userId =
      localStorage.getItem("userEmail") ||
      localStorage.getItem("userId") ||
      "Unknown User";

    try {
      await api.post("/api/support/ticket", {
        userId,
        subject: "General Support",
        category: "Helpdesk",
        message: message,
      });

      setIsSubmitting(false);
      setSent(true);
      setMessage("");
      setTimeout(() => setSent(false), 4000);
    } catch (error) {
      console.error("Support submission error:", error);
      alert("Failed to submit support ticket. Please try again.");
      setIsSubmitting(false);
    }
  };

  const faqs = [
    {
      q: "How do I upload custom chart images?",
      a: "When logging a trade, use the upload boxes under the Chart Screenshots section.",
    },
    {
      q: "Is my trading data secure?",
      a: "Yes, all records are safely encrypted and linked exclusively to your private user ID.",
    },
    {
      q: "Can I access Forex Notes on mobile?",
      a: "Absolutely! The entire layout is responsive with a mobile drawer navigation bar.",
    },
  ];

  return (
    <div
      className="w-full max-w-5xl mx-auto font-sans pb-16 px-4 md:px-8 mt-6 md:mt-8 box-border"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header */}
      <div className="mb-8 md:mb-10 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/10">
          <Headphones className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              Support Helpdesk
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30">
              24/7
            </span>
          </div>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
            Get assistance, submit support tickets, or check our FAQs.
          </p>
        </div>
      </div>

      {/* Success Banner */}
      {sent && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-sm font-bold flex items-center justify-center gap-2 backdrop-blur-xl">
          <CheckCircle className="w-5 h-5" /> Support ticket submitted
          successfully! Our team will respond shortly.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Ticket Form */}
        <div className="lg:col-span-2 bg-white/60 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-xl backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200/80 dark:border-white/10">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/20 border border-emerald-500/20 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
            </div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Open a Support Ticket
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
                How can we help you?
              </label>
              <textarea
                placeholder="Describe your issue or question in detail..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="appearance-none w-full min-h-[160px] bg-white/40 dark:bg-white/[0.04] border border-gray-300/80 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-medium focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm text-left resize-y backdrop-blur-sm transition-all"
                required
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-600 hover:from-emerald-500 hover:to-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 text-sm disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Send Message
              </button>
            </div>
          </form>
        </div>

        {/* FAQs */}
        <div className="bg-white/60 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200/80 dark:border-white/10">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center">
                <HelpCircle className="w-4 h-4 text-amber-400" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Quick FAQs
              </h3>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i} className="p-4 bg-gray-50/80 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 rounded-xl">
                  <p className="font-bold text-gray-900 dark:text-white text-xs mb-1.5">
                    {faq.q}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 p-4 bg-gradient-to-br from-emerald-500/10 to-violet-500/10 border border-emerald-500/20 rounded-2xl text-center">
            <Zap className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">
              Community Discord
            </p>
            <a
              href="https://discord.gg/Ajaw3AjfWE"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-emerald-400 transition-colors underline block"
            >
              Join our official trader community chat.
            </a>
          </div>
        </div>
      </div>

      {/* Social Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <a
          href="https://discord.gg/Ajaw3AjfWE"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative bg-gradient-to-br from-[#5865F2] to-[#7289DA] rounded-2xl p-6 flex flex-col justify-center shadow-xl shadow-indigo-500/20 cursor-pointer overflow-hidden hover:scale-[1.02] transition-transform"
        >
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Forex Notes Discord
            </h3>
            <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-xs text-white/80 font-medium">
            Join our trading community for live support & peer learning
          </p>
        </a>

        <a
          href="https://instagram.com/forexnotes.in"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative bg-gradient-to-tr from-[#fd5949] via-[#d6249f] to-[#285AEB] rounded-2xl p-6 flex flex-col justify-center shadow-xl shadow-pink-500/20 cursor-pointer overflow-hidden hover:scale-[1.02] transition-transform"
        >
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Follow on Instagram
            </h3>
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-xs text-white/80 font-medium">
            @forexnotes.in • Tips, setups & trader insights
          </p>
        </a>
      </div>
    </div>
  );
}
