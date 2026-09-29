// frontend/src/pages/Profile.jsx
import {
  User,
  Lock,
  UploadCloud,
  CheckCircle,
  MessageSquare,
  Instagram,
  ShieldCheck,
} from "lucide-react";

export default function Profile() {
  const inputClass =
    "appearance-none box-border w-full min-h-[52px] block bg-gray-50 dark:bg-[#0b131d] border border-gray-300 dark:border-[#1f2c3b] rounded-[2px] px-4 py-3 !text-[#2f8df4] [-webkit-text-fill-color:#2f8df4] font-bold focus:border-[#2f8df4] outline-none text-sm text-center [text-align-last:center]";

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
        {/* Personal Info */}
        <div className="bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-6 md:p-8 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-6 pb-4 border-b border-gray-100 dark:border-white/5">
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                Full Name
              </label>
              <input
                type="text"
                defaultValue="Mayur Patil"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                Username
              </label>
              <input
                type="text"
                defaultValue="mayurtrades"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                Email Address
              </label>
              <input
                type="email"
                defaultValue="mayur@example.com"
                className={inputClass}
                disabled
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                placeholder="+91 9876543210"
                className={inputClass}
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button className="px-8 py-3 bg-[#2f8df4] hover:bg-[#2376e8] text-white font-bold rounded-[2px] text-sm">
              Save Profile
            </button>
          </div>
        </div>

        {/* Security / Password Reset */}
        <div className="bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-6 md:p-8 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 pb-4 border-b border-gray-100 dark:border-white/5">
            <Lock className="w-5 h-5 text-[#f59e0b]" /> Password Reset
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                Current Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                New Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className={inputClass}
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button className="px-8 py-3 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white font-bold border border-gray-200 dark:border-white/10 rounded-[2px] text-sm hover:bg-gray-200 dark:hover:bg-white/10">
              Update Password
            </button>
          </div>
        </div>

        {/* KYC Verification (Aadhaar) */}
        <div className="bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-white/5">
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#21d4a3]" /> Identity
              Verification (KYC)
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-widest bg-red-500/10 text-red-500 px-2 py-1 rounded-[2px] border border-red-500/20">
              Pending
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Please upload a clear copy of your Aadhaar Card (Front and Back) for
            account verification.
          </p>

          <label className="w-full border-2 border-dashed border-gray-300 dark:border-[#1f2c3b] rounded-[2px] p-10 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-white/[0.02] hover:border-[#2f8df4] dark:hover:border-[#2f8df4] transition-all cursor-pointer">
            <UploadCloud className="w-10 h-10 text-[#2f8df4] opacity-80 mb-4" />
            <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
              Click to upload Aadhaar document
            </p>
            <p className="text-xs text-gray-500">
              Supports PDF, JPG, PNG (Max 5MB)
            </p>
            <input type="file" className="hidden" accept="image/*,.pdf" />
          </label>
        </div>

        {/* Community & Socials */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <a
            href="https://discord.gg/Ajaw3AjfWE"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#5865F2] hover:bg-[#4752C4] p-6 rounded-[2px] shadow-sm flex items-center justify-between transition-colors group"
          >
            <div>
              <h3 className="text-sm font-bold text-white mb-1">
                Forex Notes Discord
              </h3>
              <p className="text-xs text-white/80">
                Join our trading community
              </p>
            </div>
            <MessageSquare className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
          </a>

          <a
            href="https://www.instagram.com/forexnotes.in?stkn=MTMxdWpkOWl3bTY3&utm_source=qr"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] hover:opacity-90 p-6 rounded-[2px] shadow-sm flex items-center justify-between transition-opacity group"
          >
            <div>
              <h3 className="text-sm font-bold text-white mb-1">
                Follow on Instagram
              </h3>
              <p className="text-xs text-white/80">@forexnotes.in</p>
            </div>
            <Instagram className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
          </a>
        </div>
      </div>
    </div>
  );
}
