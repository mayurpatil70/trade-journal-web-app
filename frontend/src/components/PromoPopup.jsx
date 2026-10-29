// frontend/src/components/PromoPopup.jsx
// WinProFX × Trade with Rayan Official IB Partnership Modal
// Apple macOS / iOS Frosted Glass Aesthetic with Volt Green Accents

import { useState, useEffect } from "react";
import { X, ArrowUpRight, ShieldAlert, Send } from "lucide-react";
import { useLocation } from "react-router-dom";

export default function PromoPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const WINPRO_IB_URL =
    "https://rayan-khanfx.winprofxpartner.com/register?code=P2-F8GTBFIIID";
  const INSTAGRAM_URL = "https://www.instagram.com/rayan_.fx/";
  const TELEGRAM_URL = "https://t.me/TradeWithRayan"; // fallback or official handle

  useEffect(() => {
    const isDismissed = sessionStorage.getItem("winproPromoDismissed") === "true";
    const accountsShown = sessionStorage.getItem("winproAccountsShown") === "true";

    if (location.pathname === "/accounts") {
      if (!accountsShown) {
        setIsOpen(true);
        sessionStorage.setItem("winproAccountsShown", "true");
      }
    } else if (!isDismissed) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }

    const handleOpenPromo = () => setIsOpen(true);
    window.addEventListener("open-winpro-promo", handleOpenPromo);
    return () => window.removeEventListener("open-winpro-promo", handleOpenPromo);
  }, [location.pathname]);

  const handleClose = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsOpen(false);
    sessionStorage.setItem("winproPromoDismissed", "true");
  };

  const handleRedirect = () => {
    window.open(WINPRO_IB_URL, "_blank", "noopener,noreferrer");
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={handleClose}
    >
      {/* Modal Dialog Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[420px] rounded-3xl overflow-hidden bg-gradient-to-b from-[#0b1c3e] via-[#08152f] to-[#050e20] text-white border border-white/15 shadow-[0_30px_90px_rgba(0,0,0,0.7),0_0_40px_rgba(212,255,0,0.08)] backdrop-blur-2xl p-6 sm:p-7 animate-in zoom-in-95 duration-200 flex flex-col justify-between font-sans select-none"
      >
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-[#d4ff00]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* ── TOP HEADER: Badges & Close Button ── */}
        <div className="relative flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#d4ff00]">
              TRADE WITH RAYAN
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-[9.5px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-white/20 text-white/80 bg-white/5">
              IB PARTNER
            </span>

            <button
              type="button"
              onClick={handleClose}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── MAIN HERO TITLE ── */}
        <div className="relative mb-4 text-left">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-[1.05]">
            <span className="text-white block">Trade</span>
            <span className="text-white block">with</span>
            <span className="text-[#d4ff00] block drop-shadow-[0_0_24px_rgba(212,255,0,0.35)]">
              WinProFX.
            </span>
          </h2>

          <p className="text-xs sm:text-[13px] text-white/80 leading-relaxed font-medium mt-3.5">
            Open your account through my IB link and trade alongside a community
            built on daily analysis and honest trade reviews.
          </p>
        </div>

        {/* ── NUMBERED PERKS LIST ── */}
        <div className="relative border-y border-white/10 py-3 my-2 space-y-2.5 text-left">
          <div className="flex items-center gap-3">
            <span className="text-[#d4ff00] font-mono font-bold text-xs sm:text-sm">
              01
            </span>
            <span className="text-xs sm:text-[13px] font-semibold text-white/95">
              Daily market analysis
            </span>
          </div>
          <div className="border-t border-white/5" />
          <div className="flex items-center gap-3">
            <span className="text-[#d4ff00] font-mono font-bold text-xs sm:text-sm">
              02
            </span>
            <span className="text-xs sm:text-[13px] font-semibold text-white/95">
              Setups, observations & trade reviews
            </span>
          </div>
        </div>

        {/* ── VOLT / LIME CALLOUT BOX: JOIN THE CHANNEL ── */}
        <div className="relative rounded-2xl bg-[#d4ff00] p-4 my-3.5 text-left text-[#071530] shadow-md transition-transform hover:scale-[1.01]">
          <span className="text-[10px] font-extrabold uppercase tracking-wider block opacity-75 mb-0.5">
            JOIN THE CHANNEL
          </span>

          <div className="flex items-center justify-between">
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-black text-sm sm:text-base text-[#071530] hover:underline flex items-center gap-1.5"
            >
              <span>Telegram: Trade With Rayan</span>
              <Send className="w-3.5 h-3.5 shrink-0" />
            </a>
          </div>

          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-[#071530]/85 hover:underline flex items-center gap-1.5 mt-1"
          >
            <svg className="w-3 h-3 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.13-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            <span>Instagram: @rayan_.fx</span>
          </a>
        </div>

        {/* ── PRIMARY ACTION BUTTON ── */}
        <div className="relative space-y-2 mt-2">
          <button
            type="button"
            onClick={handleRedirect}
            className="w-full py-3.5 px-5 rounded-2xl bg-[#d4ff00] hover:bg-[#c2eb00] text-[#071530] font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-[#d4ff00]/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Open WinProFX Account (IB Link)</span>
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* User Warning Under Button (As Requested) */}
          <div className="flex items-center justify-center gap-1.5 px-1 text-center">
            <ShieldAlert className="w-3.5 h-3.5 text-[#d4ff00] shrink-0" />
            <p className="text-[10px] font-semibold text-white/70">
              Notice: You will be redirected to the official WinProFX account opening portal in a new browser tab.
            </p>
          </div>
        </div>

        {/* ── RISK DISCLAIMER FOOTNOTE (From Uploaded Card) ── */}
        <div className="relative mt-4 pt-3 border-t border-white/10 text-left">
          <p className="text-[9px] text-white/50 leading-relaxed">
            Risk warning: Trading forex and CFDs carries a high level of risk and may not be suitable for all investors; you can lose more than you deposit. Past performance is not a guide to future results. Independent Introducing Broker; not investment advice.
          </p>
        </div>
      </div>
    </div>
  );
}
