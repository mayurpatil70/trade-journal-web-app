// frontend/src/components/landing/SocialProofToast.jsx
import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2 } from 'lucide-react';

export const SAMPLE_PURCHASES = [
  { name: 'Alex P.', city: 'London, UK', product: 'Pro Yearly (50% Off)', timeAgo: '2m ago' },
  { name: 'Ravi K.', city: 'Dubai, UAE', product: 'Pro Yearly ($114)', timeAgo: '5m ago' },
  { name: 'Sarah J.', city: 'Mumbai, India', product: 'Pro Monthly ($14)', timeAgo: '9m ago' },
  { name: 'Mike T.', city: 'Chicago, USA', product: 'Elite VIP Pass', timeAgo: '14m ago' },
  { name: 'Liam W.', city: 'Sydney, Australia', product: 'Pro Yearly ($114)', timeAgo: '18m ago' },
  { name: 'Kenji S.', city: 'Singapore', product: '10-Yr Tick Replay Pro', timeAgo: '23m ago' },
  { name: 'Elena M.', city: 'Frankfurt, Germany', product: 'Pro Yearly (50% Off)', timeAgo: '27m ago' },
  { name: 'David C.', city: 'Toronto, Canada', product: 'Elite VIP Pass', timeAgo: '34m ago' },
  { name: 'Zubair H.', city: 'Abu Dhabi, UAE', product: 'Pro Yearly ($114)', timeAgo: '41m ago' },
  { name: 'Thabo N.', city: 'Johannesburg, SA', product: 'Pro Monthly ($14)', timeAgo: '49m ago' },
];

export default function SocialProofToast() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('fn_social_proof_dismissed') === 'true';
    } catch (e) {
      return false;
    }
  });

  const timerRef = useRef(null);

  useEffect(() => {
    if (isDismissed) return;

    let showTimeout;
    let hideTimeout;

    const scheduleNext = (delay) => {
      showTimeout = setTimeout(() => {
        setIsVisible(true);

        // Stay visible for 4s
        hideTimeout = setTimeout(() => {
          setIsVisible(false);
          setCurrentIdx((prev) => (prev + 1) % SAMPLE_PURCHASES.length);

          // Random 6-9s before next
          const nextDelay = Math.floor(6000 + Math.random() * 3000);
          scheduleNext(nextDelay);
        }, 4000);
      }, delay);
    };

    // Initial toast after 3s on landing page
    scheduleNext(3000);

    return () => {
      clearTimeout(showTimeout);
      clearTimeout(hideTimeout);
    };
  }, [isDismissed]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    try {
      sessionStorage.setItem('fn_social_proof_dismissed', 'true');
    } catch (e) {}
  };

  if (isDismissed) return null;

  const current = SAMPLE_PURCHASES[currentIdx];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        zIndex: 9999,
        maxWidth: 'calc(100vw - 32px)',
        pointerEvents: 'none',
      }}
      role="status"
      aria-live="polite"
    >
      <div
        style={{
          width: 'clamp(280px, 86vw, 350px)',
          background: 'rgba(14, 23, 38, 0.94)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderLeft: '3.5px solid #10b981',
          borderRadius: '16px',
          padding: '13px 15px',
          boxShadow: '0 18px 40px rgba(0, 0, 0, 0.55), 0 0 20px rgba(16, 185, 129, 0.12)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          position: 'relative',
          overflow: 'hidden',
          pointerEvents: 'auto',
          transform: isVisible ? 'translate3d(0, 0, 0) scale(1)' : 'translate3d(-120%, 15px, 0) scale(0.95)',
          opacity: isVisible ? 1 : 0,
          transition: 'transform 0.44s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.36s ease',
          willChange: 'transform, opacity',
        }}
      >
        {/* Avatar Initial */}
        <div
          style={{
            position: 'relative',
            width: '38px',
            height: '38px',
            borderRadius: '11px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(201, 169, 110, 0.2))',
            border: '1.5px solid rgba(16, 185, 129, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '1rem',
            flexShrink: 0,
          }}
        >
          {current.name.charAt(0)}
          <span
            style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981',
              border: '2px solid #0b131f',
              boxShadow: '0 0 6px #10b981',
            }}
          />
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', paddingRight: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', lineHeight: 1.3 }}>
            {current.name} <span style={{ fontWeight: 500, color: '#94a3b8', fontSize: '12px' }}>from {current.city}</span>
          </div>

          <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.9)', lineHeight: 1.35 }}>
            just bought <span style={{ fontWeight: 700, color: '#34d399' }}>{current.product}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", color: '#64748b' }}>
            <span style={{ color: '#c9a96e', fontWeight: 600 }}>{current.timeAgo}</span>
            <span>•</span>
            <span style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <CheckCircle2 size={10} /> Verified Purchase
            </span>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          type="button"
          aria-label="Dismiss notifications"
          style={{
            position: 'absolute',
            top: '9px',
            right: '9px',
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            background: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <X size={13} />
        </button>

        {/* 4s Dwell Indicator */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, height: '2px', width: '100%', background: 'rgba(255, 255, 255, 0.08)' }}>
          <div
            style={{
              height: '100%',
              width: isVisible ? '0%' : '100%',
              background: 'linear-gradient(90deg, #10b981, #34d399)',
              transition: isVisible ? 'width 4000ms linear' : 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
}

