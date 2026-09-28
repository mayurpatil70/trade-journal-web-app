// frontend/src/pages/Settings.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings as SettingsIcon,
  User,
  Lock,
  Bell,
  Shield,
  Save,
  Loader2,
} from "lucide-react";

export default function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [profile, setProfile] = useState({
    name: "Mayur Patil",
    email: "mayur@example.com",
    timezone: "UTC +5:30 (India Standard Time)",
    defaultCurrency: "USD ($)",
  });

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      navigate("/login");
    }
  }, [navigate]);

  const handleSave = (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    setTimeout(() => {
      setLoading(false);
      setSuccessMsg("Settings updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    }, 600);
  };

  const inputClass =
    "appearance-none box-border w-full min-h-[52px] block bg-gray-50 dark:bg-[#0b131d] border border-gray-300 dark:border-[#1f2c3b] rounded-[2px] px-4 py-3 !text-[#2f8df4] [-webkit-text-fill-color:#2f8df4] font-bold focus:border-[#2f8df4] outline-none text-sm text-center [text-align-last:center]";
  const optionClass =
    "bg-white !text-[#2f8df4] [-webkit-text-fill-color:#2f8df4] dark:bg-[#0b131d] font-bold text-center";

  return (
    <div
      className="w-full max-w-5xl mx-auto font-sans pb-16 px-4 md:px-8 mt-6 md:mt-8 box-border"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header */}
      <div className="mb-8 md:mb-10 flex items-center gap-4">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-[2px] bg-[#6366f1]/10 flex items-center justify-center border border-[#6366f1]/20 shrink-0">
          <SettingsIcon className="w-5 h-5 md:w-6 md:h-6 text-[#6366f1]" />
        </div>
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-1">
            Profile & Settings
          </h1>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
            Manage your personal details, application preferences, and security
            settings.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-[2px] text-emerald-500 text-sm font-bold text-center">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Personal Details */}
        <div className="bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-6 md:p-8 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 pb-4 border-b border-gray-100 dark:border-white/5">
            <User className="w-5 h-5 text-[#2f8df4]" /> Personal Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) =>
                  setProfile({ ...profile, name: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) =>
                  setProfile({ ...profile, email: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                Timezone
              </label>
              <select
                value={profile.timezone}
                onChange={(e) =>
                  setProfile({ ...profile, timezone: e.target.value })
                }
                className={inputClass}
              >
                <option
                  value="UTC +5:30 (India Standard Time)"
                  className={optionClass}
                >
                  UTC +5:30 (India Standard Time)
                </option>
                <option value="UTC +0:00 (London)" className={optionClass}>
                  UTC +0:00 (London)
                </option>
                <option value="UTC -5:00 (New York)" className={optionClass}>
                  UTC -5:00 (New York)
                </option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                Default Currency
              </label>
              <select
                value={profile.defaultCurrency}
                onChange={(e) =>
                  setProfile({ ...profile, defaultCurrency: e.target.value })
                }
                className={inputClass}
              >
                <option value="USD ($)" className={optionClass}>
                  USD ($)
                </option>
                <option value="EUR (€)" className={optionClass}>
                  EUR (€)
                </option>
                <option value="GBP (£)" className={optionClass}>
                  GBP (£)
                </option>
                <option value="INR (₹)" className={optionClass}>
                  INR (₹)
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Security & Password */}
        <div className="bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-6 md:p-8 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 pb-4 border-b border-gray-100 dark:border-white/5">
            <Lock className="w-5 h-5 text-[#21d4a3]" /> Security Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-10 py-4 bg-[#2f8df4] hover:bg-[#2376e8] text-white font-bold rounded-[2px] shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 text-sm"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
