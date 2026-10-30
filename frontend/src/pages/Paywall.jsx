// frontend/src/pages/Paywall.jsx
import React from 'react';
import PaywallPricingGrid from '../components/paywall/PaywallPricingGrid';

export default function PaywallPage() {

  return (
    <div className="paywall-container min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-white flex flex-col items-center pt-8 pb-24 px-4 sm:px-6 relative overflow-x-hidden">
      <PaywallPricingGrid isEmbedded={false} showTopBar={true} />
    </div>
  );
}
