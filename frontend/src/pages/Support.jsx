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
        subject: "General Support", // Automatically sent to webhook
        category: "Helpdesk", // Automatically sent to webhook
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

  const textareaClass =
    "appearance-none box-border w-full min-h-[120px] block bg-gray-50 dark:bg-[#0b131d] border border-gray-300 dark:border-[#1f2c3b] rounded-[2px] px-4 py-3 !text-[#2f8df4] [-webkit-text-fill-color:#2f8df4] font-bold focus:border-[#2f8df4] outline-none text-sm text-left resize-y";

  return (
    <div
      className="w-full max-w-5xl mx-auto font-sans pb-16 px-4 md:px-8 mt-6 md:mt-8 box-border"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="mb-8 md:mb-10 flex items-center gap-4">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-[2px] bg-[#f59e0b]/10 flex items-center justify-center border border-[#f59e0b]/20 shrink-0">
          <Headphones className="w-5 h-5 md:w-6 md:h-6 text-[#f59e0b]" />
        </div>
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-1">
            Support Helpdesk
          </h1>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
            Get assistance, submit support tickets, or check our FAQs.
          </p>
        </div>
      </div>

      {sent && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-[2px] text-emerald-500 text-sm font-bold flex items-center justify-center gap-2">
          <CheckCircle className="w-5 h-5" /> Support ticket submitted
          successfully! Our team will respond shortly.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-6 md:p-8 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 pb-4 border-b border-gray-100 dark:border-white/5">
            <MessageSquare className="w-5 h-5 text-[#2f8df4]" /> Open a Support
            Ticket
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
                How can we help you?
              </label>
              <textarea
                placeholder="Describe your issue or question in detail..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={`${textareaClass} min-h-[160px]`}
                required
              ></textarea>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3.5 bg-[#2f8df4] hover:bg-[#2376e8] text-white font-bold rounded-[2px] shadow-md transition-all flex items-center gap-2 text-sm disabled:opacity-50"
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

        <div className="bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-6 pb-4 border-b border-gray-100 dark:border-white/5 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#f59e0b]" /> Quick FAQs
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <p className="font-bold text-gray-900 dark:text-white mb-1">
                  How do I upload custom chart images?
                </p>
                <p className="text-gray-500 leading-relaxed">
                  When logging a trade, use the Cloudinary upload boxes under
                  the Chart Screenshots section.
                </p>
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white mb-1">
                  Is my trading data secure?
                </p>
                <p className="text-gray-500 leading-relaxed">
                  Yes, all records are safely encrypted and linked exclusively
                  to your private Supabase user ID.
                </p>
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white mb-1">
                  Can I access Trade Journey on mobile?
                </p>
                <p className="text-gray-500 leading-relaxed">
                  Absolutely! The entire layout is responsive with a mobile
                  drawer navigation bar.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-gray-50 dark:bg-[#0b131d] border border-gray-200 dark:border-[#1f2c3b] rounded-[2px] text-center">
            <p className="text-[10px] font-bold text-[#2f8df4] uppercase tracking-widest mb-1">
              Community Discord
            </p>
            <a
              href="https://discord.gg/Ajaw3AjfWE"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:text-[#2f8df4] transition-colors underline block"
            >
              Need immediate peer help? Join our official trader community chat.
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <a
          href="https://discord.gg/Ajaw3AjfWE"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#5865F2] hover:bg-[#4752C4] transition-colors rounded-[2px] p-6 flex flex-col justify-center shadow-sm cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Forex Notes Discord
            </h3>
            <div className="w-8 h-8 bg-white/10 rounded-[2px] flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
          </div>
          <p className="text-xs text-white/80 font-medium">
            Join our trading community
          </p>
        </a>

        <a
          href="https://instagram.com/forexnotes.in"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gradient-to-tr from-[#fd5949] to-[#d6249f] hover:opacity-90 transition-opacity rounded-[2px] p-6 flex flex-col justify-center shadow-sm cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Follow on Instagram
            </h3>
            <div className="w-8 h-8 bg-white/20 rounded-[2px] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Camera className="w-4 h-4 text-white" />
            </div>
          </div>
          <p className="text-xs text-white/80 font-medium">@forexnotes.in</p>
        </a>
      </div>
    </div>
  );
}
