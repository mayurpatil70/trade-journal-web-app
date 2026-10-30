// frontend/src/components/dashboard/SocialFollowCard.jsx
import React, { useState, useEffect } from "react";
import { X, Sparkles, ExternalLink } from "lucide-react";
import BrandLogo from "../BrandLogo";

export default function SocialFollowCard({ className = "" }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const isPermanentlyDismissed = localStorage.getItem("fn_hide_social_card") === "true";
      const isSessionDismissed = sessionStorage.getItem("fn_session_hide_social_card") === "true";

      if (!isPermanentlyDismissed && !isSessionDismissed) {
        setIsVisible(true);
      }
    } catch (e) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    try {
      sessionStorage.setItem("fn_session_hide_social_card", "true");
    } catch (e) {}
    setIsVisible(false);
  };

  const handleDoNotShowAgain = () => {
    try {
      localStorage.setItem("fn_hide_social_card", "true");
    } catch (e) {}
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      aria-label="Follow ForexNotes Socials"
      className={`fixed bottom-24 sm:bottom-28 right-4 sm:right-6 z-40 w-[300px] rounded-2xl bg-white dark:bg-[#121622] border border-black/[0.08] dark:border-white/[0.1] shadow-[0_16px_40px_rgba(0,0,0,0.14)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-4 overflow-hidden select-none animate-in fade-in slide-in-from-bottom-4 duration-300 ${className}`}
    >
      {/* Background Grid Pattern & Stylized Upward Diagonal Arrow */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.035] dark:opacity-[0.06] bg-[radial-gradient(#0066FF_1px,transparent_1px)] [background-size:12px_12px]" />

      <svg
        className="absolute right-2 top-8 w-28 h-28 pointer-events-none opacity-20 dark:opacity-25"
        viewBox="0 0 100 100"
        fill="none"
      >
        <path
          d="M20 80 L75 25 M75 25 L45 25 M75 25 L75 55"
          stroke="url(#social-arrow-grad)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="social-arrow-grad" x1="20" y1="80" x2="75" y2="25" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0066FF" stopOpacity="0.2" />
            <stop stopColor="#38BDF8" stopOpacity="1" />
          </linearGradient>
        </defs>
      </svg>

      {/* Card Header: Brand Logo & Close Button */}
      <div className="relative z-10 flex items-center justify-between pb-2">
        <BrandLogo size="sm" />
        <button
          type="button"
          onClick={handleClose}
          className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/15 flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Headline & Community Tag */}
      <div className="relative z-10 my-2">
        <h4 className="text-[17px] font-black tracking-tight text-neutral-900 dark:text-white leading-[1.2]">
          Follow us <br />
          on our Socials
        </h4>
      </div>

      {/* Action Buttons: Instagram, Twitter / X, and Discord Server */}
      <div className="relative z-10 space-y-2 mt-3">
        {/* Row 1: Instagram & Twitter / X */}
        <div className="grid grid-cols-2 gap-2">
          {/* Instagram Gradient Button */}
          <a
            href="https://www.instagram.com/forexnotes.in"
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 px-3 rounded-xl bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
            style={{ color: "#FFFFFF" }}
          >
            <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            <span style={{ color: "#FFFFFF" }}>Instagram</span>
          </a>

          {/* Twitter / X Dark Button with locked solid background in both light & dark mode */}
          <a
            href="https://x.com/forexnotes"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-dark-social h-9 px-3 rounded-xl hover:opacity-90 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all border border-neutral-700/30 cursor-pointer"
            style={{ backgroundColor: "#0F172A", color: "#FFFFFF" }}
          >
            <svg className="w-3 h-3 fill-white" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span style={{ color: "#FFFFFF" }}>Twitter / X</span>
          </a>
        </div>

        {/* Row 2: Discord Server Community Button & Badge */}
        <a
          href="https://discord.gg/Ajaw3AjfWE"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-10 px-3 rounded-xl hover:opacity-95 font-bold text-xs flex items-center justify-between shadow-sm active:scale-98 transition-all border border-[#5865F2]/30 cursor-pointer"
          style={{ backgroundColor: "#5865F2", color: "#FFFFFF" }}
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            <span style={{ color: "#FFFFFF" }}>Discord Community</span>
          </div>

          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/25">
            VIP Server
          </span>
        </a>
      </div>

      {/* Do Not Show Again Link */}
      <div className="relative z-10 text-center mt-3 pt-1 border-t border-black/[0.04] dark:border-white/[0.04]">
        <button
          type="button"
          onClick={handleDoNotShowAgain}
          className="text-[11px] font-semibold text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
        >
          Do not show again
        </button>
      </div>
    </div>
  );
}
