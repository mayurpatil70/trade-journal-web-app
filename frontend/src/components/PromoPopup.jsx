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

    // 2. Track page reloads / refreshes (Show popup when user refreshes 2 times)
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

    // 3. Show when user signs up / enters /dashboard for the first time
    if (location.pathname === "/dashboard") {
      const dashboardPopupShown =
        localStorage.getItem("winpro_dashboard_popup_seen") === "true";
      if (!dashboardPopupShown) {
        const timer = setTimeout(() => {
          setIsOpen(true);
          localStorage.setItem("winpro_dashboard_popup_seen", "true");
        }, 1200);
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
