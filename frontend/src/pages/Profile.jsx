// frontend/src/pages/Profile.jsx
import { useState } from "react";
import { User, Loader2 } from "lucide-react";

export default function Profile() {
  const [profileData, setProfileData] = useState({
    fullName: "",
    username: "",
    email: localStorage.getItem("userEmail") || "",
    mobile: "",
  });
  const [saving, setSaving] = useState(false);

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert("Profile updated successfully!");
    }, 1000);
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
            Profile Settings
          </h1>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
            Manage your personal information and credentials.
          </p>
        </div>
      </div>

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
    </div>
  );
}
