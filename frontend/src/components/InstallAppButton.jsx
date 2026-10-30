import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Capacitor } from "@capacitor/core";
import { Download, Share, SquarePlus, EllipsisVertical, X, Monitor } from "lucide-react";
import { isStandalone, onInstallAvailable, promptInstall } from "../lib/pwa";

function detectPlatform() {
  const ua = navigator.userAgent;
  const iOS = /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  if (iOS) return "ios";
  if (/android/i.test(ua)) return /samsungbrowser/i.test(ua) ? "samsung" : "android";
  if (/firefox/i.test(ua)) return "firefox";
  if (/safari/i.test(ua) && !/chrome|chromium|edg/i.test(ua)) return "mac-safari";
  return "desktop";
}

const STEPS = {
  ios: {
    title: "Install on iPhone or iPad",
    steps: [
      { icon: Share, text: "Tap the Share button in Safari's toolbar (in Chrome, it's in the address bar)." },
      { icon: SquarePlus, text: "Scroll down and tap Add to Home Screen." },
      { text: "Tap Add. Forex Notes opens full screen from your Home Screen, like a native app." },
    ],
  },
  android: {
    title: "Install on Android",
    steps: [
      { icon: EllipsisVertical, text: "Tap the ⋮ menu in the top right of Chrome." },
      { icon: Download, text: "Tap Install app (or Add to Home screen)." },
      { text: "Confirm Install. The app appears in your app drawer." },
    ],
  },
  samsung: {
    title: "Install on Samsung Internet",
    steps: [
      { icon: EllipsisVertical, text: "Tap the ☰ menu at the bottom." },
      { icon: SquarePlus, text: "Tap Add page to, then Home screen." },
      { text: "Confirm. The app appears on your Home screen." },
    ],
  },
  "mac-safari": {
    title: "Install on Mac (Safari)",
    steps: [
      { icon: Share, text: "Click File in the menu bar (or the Share button)." },
      { icon: SquarePlus, text: "Choose Add to Dock." },
      { text: "Click Add. Forex Notes opens in its own window from the Dock." },
    ],
  },
  firefox: {
    title: "Install the app",
    steps: [
      { icon: Monitor, text: "Firefox on desktop can't install web apps." },
      { text: "Open this page in Chrome, Edge or Brave, then click the install icon at the right of the address bar." },
    ],
  },
  desktop: {
    title: "Install on your computer",
    steps: [
      { icon: Download, text: "Click the install icon at the right end of the address bar." },
      { icon: EllipsisVertical, text: "Or open the browser menu and choose Install Forex Notes (Edge: Apps, Install this site as an app)." },
      { text: "The app opens in its own window and shows in your Start menu, Dock or launcher." },
    ],
  },
};

function InstallGuide({ platform, onClose }) {
  const guide = STEPS[platform] || STEPS.desktop;
  return createPortal(
    <div className="fixed inset-0 z-[9700] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#161a24] border border-black/[0.06] dark:border-white/[0.08] shadow-2xl p-5 pb-8 sm:pb-5 animate-in slide-in-from-bottom-4 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/brand/fn-mark-256.webp" alt="" className="w-11 h-11 rounded-[12px]" />
            <div>
              <p className="text-base font-bold text-neutral-900 dark:text-white">{guide.title}</p>
              <p className="text-xs text-neutral-500">Free, no app store needed</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/[0.05] dark:hover:bg-white/[0.08]" aria-label="Close">
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>
        <ol className="mt-5 space-y-3">
          {guide.steps.map(({ icon: Icon, text }, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-7 h-7 shrink-0 rounded-full bg-[#0066FF]/10 text-[#0066FF] dark:text-sky-400 flex items-center justify-center text-xs font-bold">
                {Icon ? <Icon className="w-3.5 h-3.5" /> : i + 1}
              </span>
              <span className="text-sm text-neutral-700 dark:text-neutral-200 pt-1">{text}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>,
    document.body,
  );
}

export default function InstallAppButton({ variant = "sidebar", className = "" }) {
  const [canPrompt, setCanPrompt] = useState(false);
  const [installed, setInstalled] = useState(() => isStandalone());
  const [guide, setGuide] = useState(false);

  useEffect(() => onInstallAvailable(setCanPrompt), []);
  useEffect(() => {
    const mq = window.matchMedia?.("(display-mode: standalone)");
    const onChange = () => setInstalled(isStandalone());
    mq?.addEventListener?.("change", onChange);
    window.addEventListener("appinstalled", onChange);
    return () => {
      mq?.removeEventListener?.("change", onChange);
      window.removeEventListener("appinstalled", onChange);
    };
  }, []);

  if (installed || Capacitor.isNativePlatform()) return null;

  const install = async () => {
    if (canPrompt) {
      await promptInstall();
      return;
    }
    setGuide(true);
  };

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={install}
          title="Install app"
          aria-label="Install app"
          className={`w-9 h-9 rounded-full flex items-center justify-center text-[#0066FF] dark:text-sky-400 hover:bg-blue-500/10 ${className}`}
        >
          <Download className="w-4 h-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={install}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[13px] font-semibold text-[#0066FF] dark:text-sky-400 bg-blue-500/[0.07] hover:bg-blue-500/[0.12] border border-blue-500/15 transition-colors ${className}`}
        >
          <Download className="w-[18px] h-[18px]" strokeWidth={2.2} />
          <span className="flex-1 text-left">Install app</span>
          <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">Free</span>
        </button>
      )}
      {guide && <InstallGuide platform={detectPlatform()} onClose={() => setGuide(false)} />}
    </>
  );
}
