import { useEffect, useState } from "react";
import { BellRing, Download, CheckCircle2, Loader2 } from "lucide-react";
import {
  isPushSupported,
  isStandalone,
  getPushSubscription,
  enablePush,
  disablePush,
  sendTestPush,
  onInstallAvailable,
  promptInstall,
} from "../lib/pwa";

const btn =
  "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

export default function AppNotificationsCard() {
  const supported = isPushSupported();
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [canInstall, setCanInstall] = useState(false);
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  useEffect(() => {
    getPushSubscription().then((sub) => setSubscribed(Boolean(sub))).catch(() => {});
    return onInstallAvailable(setCanInstall);
  }, []);

  const run = async (action, success) => {
    setBusy(true);
    setNotice(null);
    try {
      await action();
      if (success) setNotice({ ok: true, text: success });
    } catch (err) {
      setNotice({ ok: false, text: err.response?.data?.error || err.message || "Something went wrong." });
    } finally {
      setBusy(false);
    }
  };

  const toggle = () =>
    subscribed
      ? run(async () => {
          await disablePush();
          setSubscribed(false);
        }, "Notifications turned off on this device.")
      : run(async () => {
          await enablePush();
          setSubscribed(true);
        }, "Notifications are on for this device.");

  const permissionDenied = supported && Notification.permission === "denied";

  return (
    <div className="rounded-3xl p-6 bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] space-y-4">
      <div className="flex items-center gap-3 pb-4 border-b border-black/[0.05] dark:border-white/10">
        <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 flex items-center justify-center">
          <BellRing className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">App & Notifications</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Install Forex Notes on this device and get alerts for new messages and announcements
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-neutral-900 dark:text-white">Push notifications</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {!supported
              ? isIOS && !isStandalone()
                ? "On iPhone and iPad, add Forex Notes to your Home Screen first, then enable notifications there."
                : "This browser does not support push notifications."
              : permissionDenied
                ? "Notifications are blocked. Allow them in your browser's site settings."
                : subscribed
                  ? "Enabled on this device."
                  : "Off on this device."}
          </p>
        </div>
        {supported && (
          <div className="flex items-center gap-2">
            {subscribed && (
              <button
                type="button"
                disabled={busy}
                onClick={() => run(sendTestPush, "Test notification sent.")}
                className={`${btn} border border-black/[0.08] dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/5`}
              >
                Send test
              </button>
            )}
            <button
              type="button"
              disabled={busy || (permissionDenied && !subscribed)}
              onClick={toggle}
              className={`${btn} ${
                subscribed
                  ? "border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              } inline-flex items-center gap-1.5`}
            >
              {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {subscribed ? "Turn off" : "Enable"}
            </button>
          </div>
        )}
      </div>

      {(canInstall || isStandalone()) && (
        <div className="flex items-center justify-between gap-4 flex-wrap pt-4 border-t border-black/[0.05] dark:border-white/10">
          <div>
            <p className="text-sm font-semibold text-neutral-900 dark:text-white">Install app</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {isStandalone() ? "You're using the installed app." : "Open Forex Notes in its own window, like a native app."}
            </p>
          </div>
          {!isStandalone() && (
            <button
              type="button"
              onClick={promptInstall}
              className={`${btn} bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center gap-1.5`}
            >
              <Download className="w-3.5 h-3.5" />
              Install
            </button>
          )}
        </div>
      )}

      {notice && (
        <p
          className={`flex items-center gap-1.5 text-xs font-semibold ${
            notice.ok ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"
          }`}
        >
          {notice.ok && <CheckCircle2 className="w-3.5 h-3.5" />}
          {notice.text}
        </p>
      )}
    </div>
  );
}
