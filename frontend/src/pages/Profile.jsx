// frontend/src/pages/Profile.jsx
import { useState } from "react";
import {
  User,
  MessageSquare,
  Send,
  CheckCircle,
  Loader2,
  Instagram,
} from "lucide-react";
import api from "../api/axios";

export default function Profile() {
  const [profileData, setProfileData] = useState({
    fullName: "",
    username: "",
    email: localStorage.getItem("userEmail") || "",
    mobile: "",
  });
  const [saving, setSaving] = useState(false);

  // Support Form State
  const [supportMessage, setSupportMessage] = useState("");
  const [sendingSupport, setSendingSupport] = useState(false);
  const [supportSent, setSupportSent] = useState(false);

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    // Simulate save or call real API
    setTimeout(() => {
      setSaving(false);
      alert("Profile updated successfully!");
    }, 1000);
  };

  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;

    setSendingSupport(true);
    const userId =
      localStorage.getItem("userEmail") ||
      localStorage.getItem("userId") ||
      "Unknown User";

    try {
      await api.post("/api/support/ticket", {
        userId,
        message: supportMessage,
      });
      setSupportSent(true);
      setSupportMessage("");
      setTimeout(() => setSupportSent(false), 5000);
    } catch (error) {
      alert("Failed to send support message. Please try again.");
    } finally {
      setSendingSupport(false);
    }
  };

  const inputClass =
    "w-full bg-gray-50 dark:bg-[#0b131d] border border-gray-300 dark:border-[#1f2c3b] rounded-[2px] px-4 py-3 text-sm text-gray-900 dark:text-white font-bold focus:border-[#2f8df4] focus:ring-1 focus:ring-[#2f8df4] outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500";
  const labelClass =
    "text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest block mb-2";

  return (
    <div
      className="w-full max-w-5xl mx-auto font-sans pb-16 px-4 md:px-8 mt-6 md:mt-8 box-border"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="mb-8 md:mb-10 flex items-center gap-4">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-[2px] bg-[#2f8df4]/10 flex items-center justify-center border border-[#2f8df4]/20 shrink-0">
          <User className="w-5 h-5 md:w-6 md:h-6 text-[#2f8df4]" />
        </div>
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-1">
            Account Settings
          </h1>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
            Manage your personal information, security, and verification.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-6 md:p-8 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-6">
            Basic Information
          </h2>
          <form
            onSubmit={saveProfile}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div>
              <label className={labelClass}>Full Name</label>
              <input
                type="text"
                name="fullName"
                value={profileData.fullName}
                onChange={handleProfileChange}
                placeholder="Enter full name"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Username</label>
              <input
                type="text"
                name="username"
                value={profileData.username}
                onChange={handleProfileChange}
                placeholder="Choose a username"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Email Address</label>
              <input
                type="email"
                name="email"
                value={profileData.email}
                onChange={handleProfileChange}
                placeholder="name@example.com"
                className={inputClass}
                readOnly
              />
            </div>
            <div>
              <label className={labelClass}>Mobile Number</label>
              <input
                type="tel"
                name="mobile"
                value={profileData.mobile}
                onChange={handleProfileChange}
                placeholder="+1"
                className={inputClass}
              />
            </div>
            <div className="md:col-span-2 flex justify-end mt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-[#2f8df4] hover:bg-[#2376e8] text-white font-bold text-sm rounded-[2px] transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Save Profile"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Social Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <a
            href="https://discord.gg/your-discord-link"
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
                <Instagram className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-xs text-white/80 font-medium">@forexnotes.in</p>
          </a>
        </div>

        {/* Support Section */}
        <div className="bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-emerald-500/10 rounded-[2px] flex items-center justify-center border border-emerald-500/20">
              <MessageSquare className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Customer Support
              </h2>
              <p className="text-xs text-gray-500">
                Need help? Send a message directly to our private Discord
                support channel.
              </p>
            </div>
          </div>

          <form onSubmit={handleSupportSubmit} className="space-y-4">
            <div>
              <label className={labelClass}>Your Message</label>
              <textarea
                rows="4"
                required
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                placeholder="Describe your issue or ask a question..."
                className={`${inputClass} resize-y min-h-[100px]`}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={sendingSupport || supportSent}
                className={`px-8 py-3 font-bold text-sm rounded-[2px] transition-all shadow-sm flex items-center justify-center gap-2 ${
                  supportSent
                    ? "bg-emerald-500 text-white"
                    : "bg-[#2f8df4] hover:bg-[#2376e8] text-white disabled:opacity-50"
                }`}
              >
                {sendingSupport ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : supportSent ? (
                  <>
                    <CheckCircle className="w-4 h-4" /> Message Sent
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Send Message
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
