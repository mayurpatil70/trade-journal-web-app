// frontend/src/components/support/SocialFollowPopup.jsx
// Daily 24-Hour Social Follow Modal Pop-up (Matches TradeFXBook Screenshot 5)

import { useState, useEffect } from "react";
import { X, ArrowUpRight } from "lucide-react";
import BrandLogo from "../BrandLogo";

export default function SocialFollowPopup() {
  const [isVisible, setIsVisible] = useState(false);

  const INSTAGRAM_URL =
    "https://www.instagram.com/forexnotes.in?obrf=MXIxa2szOWNqNjYzag==";
  const DISCORD_URL = "https://discord.gg/Ajaw3AjfWE";

  useEffect(() => {
    try {
      const doNotShow = localStorage.getItem("social_popup_do_not_show") === "true";
      if (doNotShow) return;

      const lastShown = parseInt(
        localStorage.getItem("social_popup_last_shown") || "0",
        10
      );
      const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
      const now = Date.now();

      // If user hasn't seen the popup in the last 24-hour trading cycle
      if (!lastShown || now - lastShown >= TWENTY_FOUR_HOURS) {
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 2000); // Gentle 2s delay after page hydration

        return () => clearTimeout(timer);
      }
    } catch (e) {
      // Graceful fallback
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem("social_popup_last_shown", String(Date.now()));
  };

  const handleDoNotShowAgain = () => {
    setIsVisible(false);
    localStorage.setItem("social_popup_do_not_show", "true");
    localStorage.setItem("social_popup_last_shown", String(Date.now()));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9950] w-full max-w-[340px] animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="relative rounded-3xl overflow-hidden bg-[#0c101c]/95 dark:bg-[#0c101c]/95 text-white border border-white/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl p-5">
        {/* Subtle decorative grid background matching TradeFXBook Screenshot 5 */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        {/* Top Header: Brand Logo & Close Button */}
        <div className="relative flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BrandLogo className="h-6 w-auto object-contain" />
          </div>

          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close social popup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hero Title & Blue Arrow Illustration */}
        <div className="relative mb-5 flex items-center justify-between pr-2">
          <div>
            <h3 className="text-xl font-extrabold tracking-tight text-white leading-tight">
              Follow us
              <br />
              <span className="text-white/90">on our Socials</span>
            </h3>
          </div>

          {/* Glowing Apple Blue Diagonal Arrow */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <ArrowUpRight className="w-7 h-7 text-white stroke-[2.5]" />
          </div>
        </div>

        {/* Social Action Buttons */}
        <div className="relative grid grid-cols-2 gap-2.5 mb-3.5">
          {/* Instagram Button */}
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClose}
            className="group flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] hover:opacity-95 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            {/* Instagram Camera SVG Icon */}
            <svg
              className="w-4 h-4 fill-current shrink-0"
              viewBox="0 0 24 24"
            >
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.13-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            <span>Instagram</span>
          </a>

          {/* Discord Button */}
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClose}
            className="group flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            {/* Discord SVG Icon */}
            <svg
              className="w-4 h-4 fill-current shrink-0"
              viewBox="0 0 127.14 96.36"
            >
              <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.86,53,48.81,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
            </svg>
            <span>Discord</span>
          </a>
        </div>

        {/* Do not show again link */}
        <div className="relative text-center">
          <button
            onClick={handleDoNotShowAgain}
            className="text-[11px] font-medium text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            Do not show again
          </button>
        </div>
      </div>
    </div>
  );
}
