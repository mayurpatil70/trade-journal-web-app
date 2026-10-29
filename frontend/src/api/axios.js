import axios from "axios";

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host && host !== "localhost" && host !== "127.0.0.1") {
      const envUrl = import.meta.env.VITE_API_URL;
      if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
        return envUrl;
      }
      return "https://forexnotes-web-app.onrender.com";
    }
  }
  return import.meta.env.VITE_API_URL || "http://localhost:3000";
};

const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Persistent Device Identifier ─────────────────────────────────────────────
export function getDeviceId() {
  if (typeof window === "undefined") return "browser-device";
  let did = localStorage.getItem("deviceId");
  if (!did) {
    did = "dev_" + Math.random().toString(36).substring(2, 10) + "_" + Date.now().toString(36);
    localStorage.setItem("deviceId", did);
  }
  return did;
}

// ── Session helpers ─────────────────────────────────────────────────────────
export function saveSession({ userId, token, email, sessionId, deviceId }) {
  if (userId) localStorage.setItem("userId", userId);
  if (token) localStorage.setItem("token", token);
  if (email) localStorage.setItem("userEmail", email);
  if (sessionId) localStorage.setItem("sessionId", sessionId);
  if (deviceId) localStorage.setItem("deviceId", deviceId);
  localStorage.setItem("sessionCreatedAt", String(Date.now()));
}

export function clearSession() {
  localStorage.removeItem("userId");
  localStorage.removeItem("token");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("sessionId");
  localStorage.removeItem("sessionCreatedAt");
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("user_in_app");
    sessionStorage.removeItem("prev_path");
  }
}

/**
 * Handles explicit manual logout for this specific device
 */
export async function logoutSession() {
  const sessionId = localStorage.getItem("sessionId");
  try {
    if (sessionId) {
      await api.post("/api/auth/logout", { sessionId });
    }
  } catch (err) {
    console.warn("[Auth] Backend logout notice:", err.message);
  } finally {
    clearSession();
  }
}

/**
 * Checks if a session exists.
 * Persistent caching: Keeps the user logged in across days without arbitrary daily wipes.
 * Revocation & Subscription expiry are enforced server-side.
 */
export function isSessionValid() {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId") || localStorage.getItem("userEmail");
  return Boolean(token && userId);
}

// ── Request interceptor: attach Bearer token and Device ID ───────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const deviceId = getDeviceId();
  if (deviceId) config.headers["x-device-id"] = deviceId;

  return config;
});

// ── Response interceptor: handle 401 auto-logout + timeouts ─────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If server returns 401 (token expired/invalid/subscription expired) → auto-logout
    if (error.response?.status === 401) {
      const url = error.config?.url || "";
      // Don't auto-logout on auth submission endpoints (login/verify)
      if (!url.includes("/api/auth/login") && !url.includes("/api/auth/verify")) {
        const errorType = error.response?.data?.error;
        console.warn("[Auth] Session invalidated or subscription expired:", errorType);
        clearSession();

        if (errorType === "SUBSCRIPTION_EXPIRED") {
          if (
            typeof window !== "undefined" &&
            !window.location.pathname.includes("/paywall") &&
            !window.location.pathname.includes("/pricing")
          ) {
            window.location.replace("/paywall?expired=1");
          }
        } else {
          if (
            typeof window !== "undefined" &&
            !window.location.pathname.includes("/login")
          ) {
            window.location.replace("/login");
          }
        }
      }
    }

    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      console.warn("API request timed out. Please verify backend connection.");
    }

    return Promise.reject(error);
  }
);

export default api;
