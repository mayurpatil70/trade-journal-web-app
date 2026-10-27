// frontend/src/components/Logo3DLoader.jsx
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function Logo3DLoader({
  title = "FOREX NOTES",
  subtitle = "Preparing Your Trading Journal & Performance Analytics...",
  duration = 2000,
  onComplete,
  className = "",
}) {
  const [fading, setFading] = useState(false);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    // Start smooth fade-out at (duration - 400ms) so cross-dissolve finishes cleanly at duration
    const fadeDelay = Math.max(600, duration - 400);
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, fadeDelay);

    const completeTimer = setTimeout(() => {
      setMounted(false);
      if (onComplete) onComplete();
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete]);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={`fn-loader-overlay ${fading ? "fn-loader-hidden" : ""} ${className}`}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        height: "100dvh",
        zIndex: 99999999,
        backgroundColor: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        transition: "opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? "none" : "auto",
      }}
    >
      {/* Glowing backdrop pulse */}
      <div className="fn-loader-backdrop" />

      <div className="fn-loader-card">
        {/* Circular Animation Ring Container */}
        <div className="fn-spinner-wrap">
          <div className="fn-orbit-outer" />
          <svg className="fn-svg-ring" viewBox="0 0 160 160">
            <defs>
              <linearGradient id="fnGradReact" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="50%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <filter id="fnRingGlowReact" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#10b981" floodOpacity="0.65" />
              </filter>
            </defs>
            <circle className="fn-ring-bg" cx="80" cy="80" r="70" />
            <circle
              className="fn-ring-active"
              cx="80"
              cy="80"
              r="70"
              stroke="url(#fnGradReact)"
              filter="url(#fnRingGlowReact)"
            />
            <circle className="fn-ring-inner" cx="80" cy="80" r="62" />
          </svg>

          {/* Centered 3D Logo */}
          <div className="fn-3dlogo-box">
            <img src="/logo3d.png" alt="Forex Notes" className="fn-3dlogo-img" />
          </div>
        </div>

        {/* Brand & Progress Bar */}
        <div className="fn-loader-text-group">
          <div className="fn-loader-brand">{title}</div>
          <div className="fn-loader-progress-track">
            <div className="fn-loader-progress-bar" />
          </div>
          <div className="fn-loader-subtext">{subtitle}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}
