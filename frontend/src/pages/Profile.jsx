// frontend/src/pages/Profile.jsx
import { useState } from "react";
import { User, Loader2, Mail, Phone, AtSign, Shield } from "lucide-react";

export default function Profile() {
  const [profileData, setProfileData] = useState({
    fullName: "",
    username: "",
    email: localStorage.getItem("userEmail") || "",
    mobile: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 1000);
  };

  const inputClass =
    "w-full bg-white/40 dark:bg-white/[0.04] border border-gray-300/80 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white font-medium focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500 backdrop-blur-sm";
  const labelClass =
    "text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest block mb-2";

  const emailInitial = profileData.email
    ? profileData.email.charAt(0).toUpperCase()
    : "U";

  return (
    <div
      className="w-full max-w-5xl mx-auto font-sans pb-16 px-4 md:px-8 mt-6 md:mt-8 box-border"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header */}
      <div className="mb-8 md:mb-10 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/10">
          <User className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              Profile Settings
            </h1>
          </div>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
            Manage your personal information and credentials.
          </p>
        </div>
      </div>

      {/* Avatar Card */}
      <div className="bg-white/60 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-xl backdrop-blur-xl mb-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center font-black text-3xl shadow-xl shadow-blue-500/30">
              {emailInitial}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-emerald-500 border-2 border-white dark:border-[#0a0a0a] flex items-center justify-center">
              <Shield className="w-3 h-3 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {profileData.fullName || profileData.email || "Trader"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {profileData.email}
            </p>
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-400 border border-emerald-500/30">
              Active Account
            </span>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white/60 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200/80 dark:border-white/10">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center">
            <User className="w-4 h-4 text-blue-400" />
          </div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Basic Information
          </h2>
        </div>

        {saved && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-sm font-bold flex items-center gap-2">
            ✓ Profile updated successfully!
          </div>
        )}

        <form onSubmit={saveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                name="fullName"
                value={profileData.fullName}
                onChange={handleProfileChange}
                placeholder="Enter full name"
                className={`${inputClass} pl-11`}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Username</label>
            <div className="relative">
              <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                name="username"
                value={profileData.username}
                onChange={handleProfileChange}
                placeholder="Choose a username"
                className={`${inputClass} pl-11`}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                name="email"
                value={profileData.email}
                onChange={handleProfileChange}
                placeholder="name@example.com"
                className={`${inputClass} pl-11 opacity-70`}
                readOnly
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Mobile Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                name="mobile"
                value={profileData.mobile}
                onChange={handleProfileChange}
                placeholder="+91"
                className={`${inputClass} pl-11`}
              />
            </div>
          </div>
          <div className="md:col-span-2 flex justify-end mt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-sm rounded-2xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                "Save Profile"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
