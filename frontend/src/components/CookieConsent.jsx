import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'cookie_consent_accepted';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    // Check if the user has already consented
    try {
      const consentGiven = localStorage.getItem(STORAGE_KEY);
      if (!consentGiven) {
        // Small delay so it transitions in gracefully without jarring page load
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // LocalStorage access might be blocked in strict private browsing
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
      localStorage.setItem('cookie_consent_timestamp', new Date().toISOString());

      // Update Google Analytics Consent Mode if gtag is available
      if (typeof window.gtag === 'function') {
        window.gtag('consent', 'update', {
          analytics_storage: 'granted',
          ad_storage: 'granted',
          ad_user_data: 'granted',
          ad_personalization: 'granted',
        });
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }

    // Trigger smooth fade-out animation before unmounting
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 250);
  };

  if (!isVisible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie Consent Banner"
      className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] max-w-[420px] w-[calc(100%-2rem)] transition-all duration-300 ease-out ${
        isAnimatingOut
          ? 'opacity-0 translate-y-3 pointer-events-none'
          : 'opacity-100 translate-y-0'
      }`}
    >
      <div
        className="relative overflow-hidden rounded-2xl p-5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.85),0_0_1px_1px_rgba(255,255,255,0.08)] backdrop-blur-xl transition-all"
        style={{
          background: 'linear-gradient(135deg, rgba(14, 18, 27, 0.98) 0%, rgba(9, 12, 18, 0.98) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Subtle Ambient Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl"
        />

        {/* Consent Text */}
        <p className="text-[13.5px] sm:text-[14px] leading-[1.6] text-neutral-300 font-normal m-0 tracking-tight">
          By clicking <strong className="text-white font-semibold">"Ok, got it"</strong>, you
          agree to the storing of cookies on your device to enhance site navigation, analyze site
          usage, and assist in our marketing efforts. View our{' '}
          <Link
            to="/privacy"
            className="text-[#3b82f6] hover:text-[#60a5fa] underline underline-offset-2 transition-colors font-medium inline"
          >
            Privacy Policy
          </Link>{' '}
          for more information.
        </p>

        {/* Action Button */}
        <div className="mt-4 flex items-center justify-end">
          <button
            type="button"
            onClick={handleAccept}
            className="inline-flex items-center justify-center px-5 py-2 rounded-full text-[13px] sm:text-[14px] font-semibold text-white bg-[#0066FF] hover:bg-[#0052cc] active:scale-[0.97] shadow-[0_4px_16px_rgba(0,102,255,0.35)] transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0066FF]/60 focus:ring-offset-2 focus:ring-offset-[#0b0e14]"
          >
            Ok, got it
          </button>
        </div>
      </div>
    </div>
  );
}
