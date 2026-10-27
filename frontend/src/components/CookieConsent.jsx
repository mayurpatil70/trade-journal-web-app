import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'cookie_consent_accepted';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    try {
      const consentGiven = localStorage.getItem(STORAGE_KEY);
      if (!consentGiven) {
        // Appears smoothly shortly after page load
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // Handle private browsing or restricted storage
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
      localStorage.setItem('cookie_consent_timestamp', new Date().toISOString());

      // Unlock Google Analytics Consent Mode if gtag is available
      if (typeof window.gtag === 'function') {
        window.gtag('consent', 'update', {
          analytics_storage: 'granted',
          ad_storage: 'granted',
          ad_user_data: 'granted',
          ad_personalization: 'granted',
        });
        window.gtag('event', 'cookie_consent_accepted', {
          event_category: 'privacy',
          event_label: 'accepted',
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
      className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] max-w-[440px] w-[calc(100%-2rem)] transition-all duration-300 ease-out ${
        isAnimatingOut
          ? 'opacity-0 translate-y-3 pointer-events-none'
          : 'opacity-100 translate-y-0'
      }`}
    >
      <div
        className="relative overflow-hidden rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-xl"
        style={{
          backgroundColor: '#0e131d',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#cbd5e1',
        }}
      >
        {/* Consent Text */}
        <p
          className="text-[13.5px] sm:text-[14px] leading-[1.65] m-0 tracking-tight"
          style={{ color: '#d1d5db' }}
        >
          By clicking{' '}
          <span
            style={{
              color: '#ffffff',
              fontWeight: 700,
              display: 'inline',
            }}
          >
            &quot;Ok, got it&quot;
          </span>
          , you agree to the storing of cookies on your device to enhance site
          navigation, analyze site usage, and assist in our marketing efforts.
          View our{' '}
          <Link
            to="/privacy"
            style={{
              color: '#38bdf8',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
              fontWeight: 500,
            }}
            className="hover:brightness-125 transition-all"
          >
            Privacy Policy
          </Link>{' '}
          for more information.
        </p>

        {/* Action Button: White pill button matching screenshot */}
        <div className="mt-4 flex items-center justify-end">
          <button
            type="button"
            onClick={handleAccept}
            style={{
              backgroundColor: '#ffffff',
              color: '#090d16',
            }}
            className="inline-flex items-center justify-center px-6 py-2 rounded-full text-[13.5px] font-semibold hover:bg-neutral-100 active:scale-95 shadow-md transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/40"
          >
            Ok, got it
          </button>
        </div>
      </div>
    </div>
  );
}
