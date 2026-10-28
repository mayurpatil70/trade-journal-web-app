// frontend/src/pages/Paywall.jsx
import React, { useEffect } from 'react';
import PaywallPricingGrid from '../components/paywall/PaywallPricingGrid';

export default function PaywallPage() {
  useEffect(() => {
    document.body.classList.add('terminal');
    return () => {
      document.body.classList.remove('terminal');
    };
  }, []);

  return (
    <div className="paywall-container min-h-screen bg-[#060b11] text-white flex flex-col items-center pt-8 pb-24 px-4 sm:px-6 relative overflow-x-hidden">
      {/* Background Ambient Glow */}
      <div
        className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.14) 0%, transparent 70%)',
          filter: 'blur(90px)',
          zIndex: 0,
        }}
      />
      <PaywallPricingGrid isEmbedded={false} showTopBar={true} />
    </div>
  );
}
