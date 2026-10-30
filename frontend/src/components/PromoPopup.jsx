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
      return;
    }

    const userId =
      localStorage.getItem("userId") ||
      localStorage.getItem("userEmail") ||
      "trader_user";

    const userDismissedKey = `fn_ib_popup_dismissed_${userId}`;
    const isGloballyDismissed = localStorage.getItem("winpro_ib_dismissed") === "true";
    const isUserDismissed = localStorage.getItem(userDismissedKey) === "true";

    // 2. If already shown / dismissed for this user, NEVER show it again
    if (isGloballyDismissed || isUserDismissed) {
      return;
    }

    // 3. New User Verification:
    // Only show if the user is a fresh signup ("fn_new_signup" === "true")
    // Returning users signing in through magic link or login will NOT have "fn_new_signup" === "true"
    const isNewSignup = localStorage.getItem("fn_new_signup") === "true";
    const hasVisitedDashboardBefore = localStorage.getItem(`fn_dashboard_visited_${userId}`) === "true";

    if (!isNewSignup || hasVisitedDashboardBefore) {
      // Mark as dismissed for returning user so it never activates
      localStorage.setItem(userDismissedKey, "true");
      return;
    }

    // 4. Pop up once for new user on first dashboard entry
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
