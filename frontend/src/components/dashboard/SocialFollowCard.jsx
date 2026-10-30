// frontend/src/components/dashboard/SocialFollowCard.jsx
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
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
      className={`fixed bottom-12 right-4 sm:right-6 z-40 w-[290px] rounded-2xl bg-white dark:bg-[#121622] border border-black/[0.08] dark:border-white/[0.1] shadow-[0_16px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-4 overflow-hidden select-none animate-in fade-in slide-in-from-bottom-4 duration-300 ${className}`}
    >
      {/* Background Grid Pattern & Stylized Upward Diagonal Arrow */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.035] dark:opacity-[0.06] bg-[radial-gradient(#0066FF_1px,transparent_1px)] [background-size:12px_12px]" />

      <svg
        className="absolute right-2 top-10 w-28 h-28 pointer-events-none opacity-20 dark:opacity-25"
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
      <div className="relative z-10 flex items-center justify-between pb-3">
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

      {/* Headline */}
      <div className="relative z-10 my-2">
        <h4 className="text-[17px] font-black tracking-tight text-neutral-900 dark:text-white leading-[1.2]">
          Follow us <br />
          on our Socials
        </h4>
      </div>

      {/* Action Buttons: Instagram & Twitter / X */}
      <div className="relative z-10 grid grid-cols-2 gap-2 mt-4">
        {/* Instagram Gradient Button */}
        <a
          href="https://www.instagram.com/forexnotes.in"
          target="_blank"
          rel="noopener noreferrer"
          className="h-10 px-3 rounded-xl bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
        >
          <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
          <span className="text-white">Instagram</span>
        </a>

        {/* Twitter / X Dark Button */}
        <a
          href="https://x.com/forexnotes"
          target="_blank"
          rel="noopener noreferrer"
          className="h-10 px-3 rounded-xl bg-black dark:bg-[#1a1f2c] hover:bg-neutral-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all border border-neutral-700/30"
        >
          <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span className="text-white">Twitter / X</span>
        </a>
      </div>

      {/* Do Not Show Again Link */}
      <div className="relative z-10 text-center mt-3 pt-2">
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

