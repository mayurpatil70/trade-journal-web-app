// frontend/src/components/ui/ProfilePhotoModal.jsx
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Camera, Loader2, User, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function ProfilePhotoModal({
  isOpen,
  onClose,
  avatarUrl = "",
  displayName = "Trader",
  subText = "",
  onAvatarUpdated,
  canUpload = true,
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState(avatarUrl);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    setCurrentAvatar(avatarUrl);
  }, [avatarUrl]);

  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please choose a valid image file (PNG, JPG, WEBP).");
      return;
    }

    const userId = localStorage.getItem("userId") || localStorage.getItem("userEmail") || "";
    const userEmail = localStorage.getItem("userEmail") || "";

    const formData = new FormData();
    formData.append("avatar", file);
    if (userId) formData.append("userId", userId);
    if (userEmail) formData.append("email", userEmail);

    setIsUploading(true);
    try {
      const res = await api.post("/api/auth/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success && res.data.avatarUrl) {
        const newUrl = res.data.avatarUrl;
        setCurrentAvatar(newUrl);

        // Update localStorage
        if (userId) localStorage.setItem(`user_avatar_${userId}`, newUrl);
        localStorage.setItem("userAvatar", newUrl);

        // Dispatch sync event for other components
        window.dispatchEvent(
          new CustomEvent("user_profile_updated", {
            detail: { avatarUrl: newUrl },
          })
        );

        if (onAvatarUpdated) {
          onAvatarUpdated(newUrl);
        }
      }
    } catch (err) {
      console.error("[ProfilePhotoModal] Upload failed:", err);
      alert("Failed to upload avatar. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!isOpen) return null;

  const initialLetter = (displayName || "T").charAt(0).toUpperCase();

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 select-none">
      {/* Frosted Transparent Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xl transition-opacity animate-in fade-in duration-200"
      />

      {/* Floating Apple Card */}
      <div className="relative w-full max-w-sm rounded-3xl bg-white/95 dark:bg-[#121622]/95 border border-black/[0.08] dark:border-white/[0.12] shadow-[0_25px_80px_rgba(0,0,0,0.35)] dark:shadow-[0_30px_90px_rgba(0,0,0,0.8)] p-6 space-y-5 backdrop-blur-2xl animate-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Trader Profile
            </span>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white truncate max-w-[220px]">
              {displayName}
            </h3>
            {subText && (
              <span className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-[220px]">
                {subText}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/[0.1] dark:hover:bg-white/[0.15] text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Big Avatar Image Frame */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 mx-auto rounded-3xl overflow-hidden bg-gradient-to-tr from-blue-500/10 via-blue-500/10 to-blue-500/10 border-2 border-blue-500/30 shadow-[0_12px_32px_rgba(0,0,0,0.15)] flex items-center justify-center group">
          {currentAvatar ? (
            <img
              src={currentAvatar}
              alt={displayName}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-inner">
              <span className="text-6xl font-black">{initialLetter}</span>
              <span className="text-xs font-semibold mt-2 opacity-80">No Photo Set</span>
            </div>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {/* Bottom Actions */}
        <div className="flex flex-col gap-2 pt-1">
          {canUpload && (
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-60"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading to Cloud...</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>{currentAvatar ? "Change Photo" : "Upload Photo"}</span>
                </>
              )}
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate("/profile");
              }}
              className="flex-1 py-2 px-3 rounded-xl bg-black/[0.04] dark:bg-white/[0.05] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>View Profile</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-3 rounded-xl bg-black/[0.04] dark:bg-white/[0.05] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center justify-center transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

