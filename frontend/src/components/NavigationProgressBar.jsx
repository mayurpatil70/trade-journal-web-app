// frontend/src/components/NavigationProgressBar.jsx
import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";

let globalStartNav = null;
let globalFinishNav = null;

export const triggerNavProgressStart = () => {
  if (typeof globalStartNav === "function") {
    globalStartNav();
  }
};

export const triggerNavProgressFinish = () => {
  if (typeof globalFinishNav === "function") {
    globalFinishNav();
  }
};

export default function NavigationProgressBar() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const location = useLocation();
  const currentPathRef = useRef(location.pathname);
  const timerRef = useRef(null);
  const hideTimerRef = useRef(null);

  const startProgress = () => {
    clearTimeout(timerRef.current);
    clearTimeout(hideTimerRef.current);
    setVisible(true);
    setProgress(25);

    // Increment gradually to simulate loading
    timerRef.current = setTimeout(() => {
      setProgress((prev) => (prev < 80 ? prev + 35 : prev));
    }, 120);
  };

  const finishProgress = () => {
    clearTimeout(timerRef.current);
    setProgress(100);

    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 280);
  };

  useEffect(() => {
    globalStartNav = startProgress;
    globalFinishNav = finishProgress;
    return () => {
      globalStartNav = null;
      globalFinishNav = null;
    };
  }, []);

  // When location actually commits in React DOM, finish progress bar
  useEffect(() => {
    if (location.pathname !== currentPathRef.current) {
      currentPathRef.current = location.pathname;
      finishProgress();
    }
  }, [location.pathname, location.search]);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[999999] h-[2.5px] pointer-events-none transition-opacity duration-200"
      style={{ opacity: visible ? 1 : 0 }}
      aria-hidden="true"
    >
      <div
        className="h-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-300 shadow-[0_0_12px_rgba(0,122,255,0.85)] transition-all ease-out"
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? "150ms" : "250ms",
        }}
      />
    </div>
  );
}

