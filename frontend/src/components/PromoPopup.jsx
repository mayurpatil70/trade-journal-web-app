// frontend/src/components/PromoPopup.jsx
// WinProFX × Trade with Rayan Official IB Partnership Modal
// Strictly restricted: ONLY pops up ONCE for brand NEW users entering /dashboard.
// NEVER pops up for returning / existing users signing in via magic link or login.
// NEVER pops up when navigating to /calendar, /news, /add-trade, /trades, etc.

import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import WinProPartnershipCard from "./partnership/WinProPartnershipCard";

export default function PromoPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // 1. STRICT ROUTE CHECK: ONLY eligible on /dashboard, NEVER on any other page
    if (location.pathname !== "/dashboard") {
      setIsOpen(false);
      return;
    }

    const userId =
      localStorage.getItem("userId") ||
      localStorage.getItem("userEmail") ||
      "trader_user";

    const userDismissedKey = `fn_ib_popup_dismissed_${userId}`;
    const isGloballyDismissed = localStorage.getItem("winpro_ib_dismissed") === "true";
    const isUserDismissed = localStorage.getItem(userDismissedKey) === "true";
    const hasVisitedDashboardBefore = localStorage.getItem(`fn_dashboard_visited_${userId}`) === "true";
    const isNewSignup = localStorage.getItem("fn_new_signup") === "true";

    // 2. If already shown/dismissed, visited before, or NOT a fresh signup: NEVER show!
    if (isGloballyDismissed || isUserDismissed || hasVisitedDashboardBefore || !isNewSignup) {
      localStorage.setItem(userDismissedKey, "true");
      localStorage.setItem("winpro_ib_dismissed", "true");
      localStorage.removeItem("fn_new_signup");
      return;
    }

    // 3. Pop up strictly once for brand-new users on their very first dashboard visit
    const timer = setTimeout(() => {
      setIsOpen(true);
      localStorage.setItem(userDismissedKey, "true");
      localStorage.setItem("winpro_ib_dismissed", "true");
      localStorage.setItem(`fn_dashboard_visited_${userId}`, "true");
      localStorage.removeItem("fn_new_signup");
    }, 1200);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Programmatic trigger (e.g. from affiliate dashboard or user click)
  useEffect(() => {
    const handleOpenPromo = () => setIsOpen(true);
    window.addEventListener("open-winpro-promo", handleOpenPromo);
    return () => window.removeEventListener("open-winpro-promo", handleOpenPromo);
  }, []);

  const handleClose = () => {
    const userId =
      localStorage.getItem("userId") ||
      localStorage.getItem("userEmail") ||
      "trader_user";
    localStorage.setItem(`fn_ib_popup_dismissed_${userId}`, "true");
    localStorage.setItem("winpro_ib_dismissed", "true");
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <WinProPartnershipCard onClose={handleClose} isEmbedded={false} />
      </div>
    </div>
  );
}
