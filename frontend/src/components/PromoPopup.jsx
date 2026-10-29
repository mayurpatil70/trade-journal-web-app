// frontend/src/components/PromoPopup.jsx
// WinProFX × Trade with Rayan Official IB Partnership Modal

import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import WinProPartnershipCard from "./partnership/WinProPartnershipCard";

export default function PromoPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // 1. DO NOT show popup on Prop Firm route (/accounts)
    if (location.pathname === "/accounts") {
      return;
    }

    // 2. Track page reloads / refreshes (fallback trigger if user refreshes 2 times in session)
    const refreshCount =
      parseInt(sessionStorage.getItem("fn_app_refresh_count") || "0", 10) + 1;
    sessionStorage.setItem("fn_app_refresh_count", String(refreshCount));

    const refreshPopupShown =
      sessionStorage.getItem("winpro_refresh_popup_shown") === "true";
    if (refreshCount >= 2 && !refreshPopupShown) {
      setIsOpen(true);
      sessionStorage.setItem("winpro_refresh_popup_shown", "true");
      return;
    }

    // 3. IB Card Popup rules for /dashboard:
    // A) Pop up when new user signs up and enters /dashboard
    // B) Pop up when ANY user hits /dashboard for the first time in a 24-hour trading day
    // C) Automatically reset when a new 24h trading day begins
    if (location.pathname === "/dashboard") {
      const isNewSignup = localStorage.getItem("fn_new_signup") === "true";
      const lastShownDay = localStorage.getItem("winpro_ib_popup_shown_day");
      const lastShownAt = parseInt(
        localStorage.getItem("winpro_ib_popup_shown_at") || "0",
        10
      );

      const now = Date.now();
      const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
      const todayStr = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

      // Is it a new trading day? Either calendar date changed OR >= 24h elapsed
      const isNewTradingDay =
        !lastShownDay ||
        lastShownDay !== todayStr ||
        now - lastShownAt >= TWENTY_FOUR_HOURS;

      if (isNewSignup || isNewTradingDay) {
        const timer = setTimeout(() => {
          setIsOpen(true);
          localStorage.setItem("winpro_ib_popup_shown_day", todayStr);
          localStorage.setItem("winpro_ib_popup_shown_at", now.toString());
          if (isNewSignup) {
            localStorage.removeItem("fn_new_signup");
          }
        }, 900);
        return () => clearTimeout(timer);
      }
    }

    // Custom event listener if triggered programmatically
    const handleOpenPromo = () => setIsOpen(true);
    window.addEventListener("open-winpro-promo", handleOpenPromo);
    return () => window.removeEventListener("open-winpro-promo", handleOpenPromo);
  }, [location.pathname]);

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <WinProPartnershipCard onClose={handleClose} isEmbedded={false} />
      </div>
    </div>
  );
}
