import { Capacitor } from "@capacitor/core";
import api from "../api/axios";

let deferredInstallPrompt = null;
const installListeners = new Set();
const notifyInstall = () => installListeners.forEach((fn) => fn(Boolean(deferredInstallPrompt)));

const isNative = () => Capacitor.isNativePlatform();

export const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;

export const isPushSupported = () =>
  !isNative() && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

export function registerServiceWorker() {
  if (typeof window === "undefined" || isNative()) return;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    notifyInstall();
  });
  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    notifyInstall();
  });

  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => console.warn("[PWA] SW registration failed:", err.message));
  });
}

export function onInstallAvailable(listener) {
  installListeners.add(listener);
  listener(Boolean(deferredInstallPrompt));
  return () => installListeners.delete(listener);
}

export async function promptInstall() {
  if (!deferredInstallPrompt) return false;
  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  notifyInstall();
  return outcome === "accepted";
}

const urlBase64ToUint8Array = (base64) => {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
};

async function getRegistration() {
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) throw new Error("Notifications are available in the installed or production app only.");
  return navigator.serviceWorker.ready;
}

export async function getPushSubscription() {
  if (!isPushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return reg ? reg.pushManager.getSubscription() : null;
}

export async function enablePush() {
  if (!isPushSupported()) throw new Error("This browser does not support push notifications.");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Notification permission was not granted.");

  const reg = await getRegistration();
  const { data } = await api.get("/api/push/public-key");
  const subscription =
    (await reg.pushManager.getSubscription()) ||
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.publicKey),
    }));
  await api.post("/api/push/subscribe", { subscription: subscription.toJSON() });
  return subscription;
}

export async function disablePush() {
  const subscription = await getPushSubscription();
  if (!subscription) return;
  await api.post("/api/push/unsubscribe", { endpoint: subscription.endpoint }).catch(() => {});
  await subscription.unsubscribe();
}

export const sendTestPush = () => api.post("/api/push/test");
