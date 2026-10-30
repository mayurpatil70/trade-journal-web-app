// frontend/src/components/PromoPopup.jsx
// WinProFX IB card opened on demand via the "open-winpro-promo" event.
// The new-user dashboard intro (pages/Dashboard.jsx) shows it in sequence.

import { useState, useEffect } from "react";
import WinProPartnershipCard from "./partnership/WinProPartnershipCard";

export default function PromoPopup() {
  const [isOpen, setIsOpen] = useState(false);

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

  return <WinProPromoModal onClose={handleClose} />;
}

export function WinProPromoModal({ onClose }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <WinProPartnershipCard onClose={onClose} isEmbedded={false} />
      </div>
    </div>
  );
}
