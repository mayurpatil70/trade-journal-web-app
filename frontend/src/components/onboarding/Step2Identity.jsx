import { useRef, useState } from "react";
import { Check, Camera, Loader2 } from "lucide-react";
import LiveTraderCard from "./LiveTraderCard";
import api from "../../api/axios";

export default function Step2Identity({
  displayName,
  setDisplayName,
  username,
  setUsername,
  bio,
  setBio,
  avatarUrl,
  setAvatarUrl,
  targetRR,
}) {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const userId = localStorage.getItem("userId") || "";

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be under 5MB.");
      return;
    }

    // 1. INSTANT LOCAL PREVIEW in both cards with 0ms visual latency
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUrl(reader.result);
    };
    reader.readAsDataURL(file);

    // 2. Upload to Cloudinary & persist in database
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("avatar", file);
      const { data } = await api.post("/api/auth/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data.success && data.avatarUrl) {
        // Replace with permanent Cloudinary URL
        setAvatarUrl(data.avatarUrl);
        localStorage.setItem(`user_avatar_${userId}`, data.avatarUrl);
        localStorage.setItem("userAvatar", data.avatarUrl);
      }
    } catch (uploadErr) {
      console.warn("[Onboarding] Cloudinary avatar upload notice:", uploadErr);
    } finally {
      setIsUploading(false);
    }
  };

  const isUsernameValid = username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username.replace(/^@/, ""));

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center py-4 lg:py-8">
      {/* ── LEFT COLUMN: Interactive Live Preview Card (Instant render) ── */}
      <div className="lg:col-span-5 flex flex-col items-center justify-center animate-in fade-in duration-300">
        <LiveTraderCard
          displayName={displayName}
          username={username}
          bio={bio}
          avatarUrl={avatarUrl}
          targetRR={targetRR}
        />
      </div>

      {/* ── RIGHT COLUMN: Form Controls ── */}
      <div className="lg:col-span-7 space-y-6 max-w-xl animate-in fade-in duration-300">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/25 text-xs font-mono font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-3 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>Step 02 • Identity</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white tracking-tight">
            Stake your handle.
          </h2>

          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300 font-medium leading-relaxed">
            Your name is how the trading world finds you. Username locks once you've used both changes — pick one you can live with.
          </p>
        </div>

        {/* Profile Photo Upload Row - macOS / iOS Frosted Glass UI */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white/95 dark:bg-[#121622]/95 border border-black/[0.08] dark:border-white/[0.1] shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-tr from-blue-600 to-blue-500 border border-black/10 dark:border-white/10 flex items-center justify-center text-white font-bold shrink-0 shadow-md shadow-blue-500/20">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-black">{displayName ? displayName.charAt(0).toUpperCase() : "T"}</span>
              )}
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-neutral-900 dark:text-white">Profile photo</h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mt-0.5">Images up to 5MB. 400×400 recommended.</p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* macOS / iOS Refined Change Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5 border bg-white dark:bg-white/[0.08] hover:bg-neutral-50 dark:hover:bg-white/[0.14] text-neutral-800 dark:text-neutral-100 border-black/[0.12] dark:border-white/[0.15] hover:border-emerald-500/50 dark:hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5" />
                <span>Change</span>
              </>
            )}
          </button>
        </div>

        {/* Form Inputs */}
        <div className="space-y-4">
          {/* Display Name */}
          <div>
            <label className="block text-xs font-extrabold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider mb-2">
              Display name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Mayur Patil"
              className="w-full h-12 px-4 rounded-2xl border border-black/[0.1] dark:border-white/[0.12] bg-white dark:bg-[#121622] text-neutral-900 dark:text-white text-sm font-semibold placeholder-neutral-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-extrabold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider mb-2">
              Username
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-sm font-mono font-bold text-neutral-400 pointer-events-none select-none">
                @
              </span>
              <input
                type="text"
                value={username.replace(/^@/, "")}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="mayurpatil"
                className="w-full h-12 pl-9 pr-10 rounded-2xl border border-black/[0.1] dark:border-white/[0.12] bg-white dark:bg-[#121622] text-neutral-900 dark:text-white text-sm font-mono font-semibold placeholder-neutral-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all"
              />
              {isUsernameValid && (
                <Check className="absolute right-3.5 w-4 h-4 text-blue-500 pointer-events-none stroke-[2.5]" />
              )}
            </div>
            <p className="mt-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 font-mono font-medium">
              3 - 20 lowercase letters, numbers and underscores.
            </p>
          </div>

          {/* Bio */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-extrabold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                Bio
              </label>
              <span className="text-[11px] font-mono font-semibold text-neutral-400">
                {bio.length}/180
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={180}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A few words on your trading style, edge, or story..."
              className="w-full p-4 rounded-2xl border border-black/[0.1] dark:border-white/[0.12] bg-white dark:bg-[#121622] text-neutral-900 dark:text-white text-sm font-medium placeholder-neutral-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all resize-none leading-relaxed"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
