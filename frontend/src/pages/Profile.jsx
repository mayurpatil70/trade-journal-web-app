// frontend/src/pages/Profile.jsx
import { useState } from "react";
import {
  User,
  Lock,
  UploadCloud,
  MessageSquare,
  ShieldCheck,
  CheckCircle,
  Loader2,
} from "lucide-react";
import api from "../api/axios";

const InstagramIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
  </svg>
);

export default function Profile() {
  const [aadhaarFront, setAadhaarFront] = useState(null);
  const [aadhaarBack, setAadhaarBack] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleKycUpload = async () => {
    if (!aadhaarFront || !aadhaarBack) {
      return alert("Please upload both the Front and Back of your document.");
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("userId", localStorage.getItem("userId"));
      formData.append("documents", aadhaarFront);
      formData.append("documents", aadhaarBack);

      // You will need to create this route in your backend later to save to Cloudinary
      await api.post("/api/auth/kyc", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("KYC Documents submitted successfully for verification.");
    } catch (error) {
      console.error(error);
      alert("Upload failed. Ensure backend /api/auth/kyc route is configured.");
    } finally {
      setIsUploading(false);
    }
  };

  const inputClass =
    "appearance-none box-border w-full min-h-[52px] block bg-gray-50 dark:bg-[#0b131d] border border-gray-300 dark:border-[#1f2c3b] rounded-[2px] px-4 py-3 !text-[#2f8df4] [-webkit-text-fill-color:#2f8df4] font-bold focus:border-[#2f8df4] outline-none text-sm text-center [text-align-last:center] placeholder-gray-400";

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
                placeholder="Enter full name"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                Username
              </label>
              <input
                type="text"
                placeholder="Choose a username"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                Email Address
              </label>
              <input
                type="email"
                defaultValue={localStorage.getItem("userEmail") || ""}
                className={inputClass}
                disabled
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                Mobile Number
              </label>
              <input type="tel" placeholder="+91" className={inputClass} />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button className="px-8 py-3 bg-[#2f8df4] hover:bg-[#2376e8] text-white font-bold rounded-[2px] text-sm shadow-sm transition-colors">
              Save Profile
            </button>
          </div>
        </div>

        {/* KYC Verification (Split Front/Back) */}
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
            Please upload a clear copy of your Document (Front and Back) for
            account verification.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* FRONT UPLOAD */}
            <label
              className={`w-full border-2 border-dashed rounded-[2px] p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${aadhaarFront ? "border-[#21d4a3] bg-[#21d4a3]/5" : "border-gray-300 dark:border-[#1f2c3b] hover:border-[#2f8df4] hover:bg-gray-50 dark:hover:bg-white/[0.02]"}`}
            >
              {aadhaarFront ? (
                <CheckCircle className="w-8 h-8 text-[#21d4a3] mb-3" />
              ) : (
                <UploadCloud className="w-8 h-8 text-[#2f8df4] opacity-80 mb-3" />
              )}
              <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                {aadhaarFront ? aadhaarFront.name : "Upload Front Side"}
              </p>
              <input
                type="file"
                className="hidden"
                accept="image/*,.pdf"
                onChange={(e) => setAadhaarFront(e.target.files[0])}
              />
            </label>

            {/* BACK UPLOAD */}
            <label
              className={`w-full border-2 border-dashed rounded-[2px] p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${aadhaarBack ? "border-[#21d4a3] bg-[#21d4a3]/5" : "border-gray-300 dark:border-[#1f2c3b] hover:border-[#2f8df4] hover:bg-gray-50 dark:hover:bg-white/[0.02]"}`}
            >
              {aadhaarBack ? (
                <CheckCircle className="w-8 h-8 text-[#21d4a3] mb-3" />
              ) : (
                <UploadCloud className="w-8 h-8 text-[#2f8df4] opacity-80 mb-3" />
              )}
              <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                {aadhaarBack ? aadhaarBack.name : "Upload Back Side"}
              </p>
              <input
                type="file"
                className="hidden"
                accept="image/*,.pdf"
                onChange={(e) => setAadhaarBack(e.target.files[0])}
              />
            </label>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleKycUpload}
              disabled={isUploading || !aadhaarFront || !aadhaarBack}
              className="px-8 py-3 bg-[#2f8df4] hover:bg-[#2376e8] text-white font-bold rounded-[2px] text-sm shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                </>
              ) : (
                "Submit Documents"
              )}
            </button>
          </div>
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
            <InstagramIcon className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
          </a>
        </div>
      </div>
    </div>
  );
}
