import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Download } from "lucide-react";
import { isStandalone, onInstallAvailable, promptInstall } from "../lib/pwa";

// Shown only where the browser supports one-tap install (Chrome, Edge, Brave, Samsung Internet on Android, Windows, macOS, Linux).
export default function InstallAppButton({ variant = "sidebar", className = "" }) {
  const [canPrompt, setCanPrompt] = useState(false);
  const [installed, setInstalled] = useState(() => isStandalone());

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

  if (installed || !canPrompt || Capacitor.isNativePlatform()) return null;

  return variant === "icon" ? (
    <button
      type="button"
      onClick={promptInstall}
      title="Install app"
      aria-label="Install app"
      className={`w-9 h-9 rounded-full flex items-center justify-center text-[#0066FF] dark:text-sky-400 hover:bg-blue-500/10 ${className}`}
    >
      <Download className="w-4 h-4" />
    </button>
  ) : (
    <button
      type="button"
      onClick={promptInstall}
      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[13px] font-semibold text-[#0066FF] dark:text-sky-400 bg-blue-500/[0.07] hover:bg-blue-500/[0.12] border border-blue-500/15 transition-colors ${className}`}
    >
      <Download className="w-[18px] h-[18px]" strokeWidth={2.2} />
      <span className="flex-1 text-left">Install app</span>
      <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">Free</span>
    </button>
  );
}
