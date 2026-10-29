// frontend/src/components/partnership/WinProPartnershipCard.jsx
// WinProFX × Trade with Rayan Official IB Partnership Card
// Pixel-perfect replication with guaranteed solid colors in both Light & Dark modes

import { ArrowUpRight, ShieldAlert, Send, X } from "lucide-react";

export default function WinProPartnershipCard({ onClose, isEmbedded = false }) {
  const WINPRO_IB_URL =
    "https://rayan-khanfx.winprofxpartner.com/register?code=P2-F8GTBFIIID";
  const INSTAGRAM_URL = "https://www.instagram.com/rayan_.fx/";
  const TELEGRAM_URL = "https://t.me/TradeWithRayan";

  const handleRedirect = () => {
    window.open(WINPRO_IB_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      style={{
        background: "linear-gradient(145deg, #0b1528 0%, #060a14 100%)",
        borderColor: "rgba(255, 255, 255, 0.12)",
        color: "#ffffff",
      }}
      className={`winpro-partnership-card relative w-full ${
        isEmbedded ? "max-w-2xl mx-auto" : "max-w-[420px]"
      } rounded-3xl overflow-hidden border shadow-[0_25px_60px_-15px_rgba(0,0,0,0.75)] p-6 sm:p-7 flex flex-col justify-between font-sans select-none text-left`}
    >
      {/* Clean iOS Ambient Blue Ambient Accent */}
      <div
        style={{
          position: "absolute",
          top: "-4rem",
          right: "-4rem",
          width: "12rem",
          height: "12rem",
          backgroundColor: "rgba(0, 102, 255, 0.12)",
          borderRadius: "9999px",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-5rem",
          left: "-5rem",
          width: "14rem",
          height: "14rem",
          backgroundColor: "rgba(37, 99, 235, 0.15)",
          borderRadius: "9999px",
          filter: "blur(48px)",
          pointerEvents: "none",
        }}
      />

      {/* ── TOP HEADER: Badges & Optional Close Button ── */}
      <div className="relative flex items-center justify-between mb-5 z-10">
        <div className="flex items-center gap-2">
          <span
            style={{ color: "#d4ff00" }}
            className="text-[11px] font-black uppercase tracking-widest"
          >
            TRADE WITH RAYAN
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            style={{
              borderColor: "rgba(255, 255, 255, 0.18)",
              color: "#ffffff",
              backgroundColor: "rgba(255, 255, 255, 0.08)",
            }}
            className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border backdrop-blur-md select-none"
          >
            IB PARTNER
          </span>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.10)",
                borderColor: "rgba(255, 255, 255, 0.16)",
                color: "#ffffff",
              }}
              className="w-7 h-7 rounded-full border hover:bg-white/20 active:scale-90 flex items-center justify-center transition-all cursor-pointer backdrop-blur-md"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5 text-white/90 stroke-[2.2]" style={{ color: "#ffffff", stroke: "#ffffff" }} />
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN HERO TITLE (Guaranteed Bright Solid Colors in Light/Dark) ── */}
      <div className="relative mb-4 text-left z-10">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-[1.05] m-0 p-0">
          <span
            style={{ color: "#ffffff", display: "block" }}
            className="font-black"
          >
            Trade
          </span>
          <span
            style={{ color: "#ffffff", display: "block" }}
            className="font-black"
          >
            with
          </span>
          <span
            style={{
              color: "#d4ff00",
              display: "block",
              textShadow: "0 0 24px rgba(212, 255, 0, 0.4)",
            }}
            className="font-black"
          >
            WinProFX.
          </span>
        </h2>

        <p
          style={{ color: "rgba(255, 255, 255, 0.85)" }}
          className="text-xs sm:text-[13px] leading-relaxed font-medium mt-3.5"
        >
          Open your account through my IB link and trade alongside a community
          built on daily analysis and honest trade reviews.
        </p>
      </div>

      {/* ── NUMBERED PERKS LIST ── */}
      <div
        style={{ borderColor: "rgba(255, 255, 255, 0.12)" }}
        className="relative border-y py-3 my-2 space-y-2.5 text-left z-10"
      >
        <div className="flex items-center gap-3">
          <span
            style={{ color: "#d4ff00" }}
            className="font-mono font-bold text-xs sm:text-sm"
          >
            01
          </span>
          <span
            style={{ color: "rgba(255, 255, 255, 0.95)" }}
            className="text-xs sm:text-[13px] font-semibold"
          >
            Daily market analysis
          </span>
        </div>
        <div
          style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}
          className="border-t"
        />
        <div className="flex items-center gap-3">
          <span
            style={{ color: "#d4ff00" }}
            className="font-mono font-bold text-xs sm:text-sm"
          >
            02
          </span>
          <span
            style={{ color: "rgba(255, 255, 255, 0.95)" }}
            className="text-xs sm:text-[13px] font-semibold"
          >
            Setups, observations & trade reviews
          </span>
        </div>
      </div>

      {/* ── VOLT / LIME CALLOUT BOX: JOIN THE CHANNEL ── */}
      <div
        style={{
          backgroundColor: "#d4ff00",
          color: "#071530",
        }}
        className="relative rounded-2xl p-4 my-3.5 text-left shadow-md transition-transform hover:scale-[1.01] z-10"
      >
        <span
          style={{ color: "rgba(7, 21, 48, 0.75)" }}
          className="text-[10px] font-extrabold uppercase tracking-wider block mb-0.5"
        >
          JOIN THE CHANNEL
        </span>

        <div className="flex items-center justify-between">
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#071530" }}
            className="font-black text-sm sm:text-base hover:underline flex items-center gap-1.5"
          >
            <span>Telegram: Trade With Rayan</span>
            <Send className="w-3.5 h-3.5 shrink-0" />
          </a>
        </div>

        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "rgba(7, 21, 48, 0.85)" }}
          className="text-xs font-bold hover:underline flex items-center gap-1.5 mt-1"
        >
          <svg className="w-3 h-3 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.13-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
          <span>Instagram: @rayan_.fx</span>
        </a>
      </div>

      {/* ── PRIMARY ACTION BUTTON ── */}
      <div className="relative space-y-2 mt-2 z-10">
        <button
          type="button"
          onClick={handleRedirect}
          style={{
            backgroundColor: "#d4ff00",
            color: "#071530",
          }}
          className="w-full py-3.5 px-5 rounded-2xl font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-[#d4ff00]/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer hover:brightness-95"
        >
          <span>Open WinProFX Account (IB Link)</span>
          <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* User Warning Under Button (As Explicitly Requested) */}
        <div className="flex items-center justify-center gap-1.5 px-1 text-center">
          <ShieldAlert
            style={{ color: "#d4ff00" }}
            className="w-3.5 h-3.5 shrink-0"
          />
          <p
            style={{ color: "rgba(255, 255, 255, 0.75)" }}
            className="text-[10px] font-semibold m-0"
          >
            Notice: You will be redirected to the official WinProFX account opening portal in a new browser tab.
          </p>
        </div>
      </div>

      {/* ── RISK DISCLAIMER FOOTNOTE ── */}
      <div
        style={{ borderColor: "rgba(255, 255, 255, 0.12)" }}
        className="relative mt-4 pt-3 border-t text-left z-10"
      >
        <p
          style={{ color: "rgba(255, 255, 255, 0.5)" }}
          className="text-[9px] leading-relaxed m-0"
        >
          Risk warning: Trading forex and CFDs carries a high level of risk and may not be suitable for all investors; you can lose more than you deposit. Past performance is not a guide to future results. Independent Introducing Broker; not investment advice.
        </p>
      </div>
    </div>
  );
}

