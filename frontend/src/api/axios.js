import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: true,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Session helpers ─────────────────────────────────────────────────────────
// Save session with a timestamp so AuthGuard can expire it client-side.
export function saveSession({ userId, token, email }) {
  if (userId) localStorage.setItem("userId", userId);
  if (token) localStorage.setItem("token", token);
  if (email) localStorage.setItem("userEmail", email);
  // Store the login timestamp (ms) — used to compute local 24-hour expiry
  localStorage.setItem("sessionCreatedAt", String(Date.now()));
}

export function clearSession() {
  localStorage.removeItem("userId");
  localStorage.removeItem("token");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("sessionCreatedAt");
}

// Returns true if a valid session exists and hasn't exceeded the daily reset window.
// Session is valid for 24 hours, then auto-expires at the next 2:30 AM IST.
export function isSessionValid() {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId") || localStorage.getItem("userEmail");
  if (!token || !userId) return false;

  const createdAt = parseInt(localStorage.getItem("sessionCreatedAt") || "0", 10);
  if (!createdAt) return true; // Legacy sessions without timestamp — stay logged in

  // Check if we've passed the next 2:30 AM IST after 24 hours from login
  const now = Date.now();
  const elapsed = now - createdAt;
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  if (elapsed < TWENTY_FOUR_HOURS) return true; // Within 24h — always valid

  // Beyond 24h — check if current time is past 2:30 AM IST today
  // IST = UTC+5:30, so 2:30 AM IST = 21:00 UTC previous day
  const nowDate = new Date(now);
  // Get today's 2:30 AM in local time
  const todayReset = new Date(nowDate);
  todayReset.setHours(2, 30, 0, 0);

  // If it's before 2:30 AM today, the reset is from yesterday's 2:30 AM
  if (nowDate < todayReset) {
    todayReset.setDate(todayReset.getDate() - 1);
  }

  // If session was created before the most recent 2:30 AM reset → expired
  if (createdAt < todayReset.getTime()) {
    return false;
  }

  return true;
}

// ── Request interceptor: attach Bearer token ────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor: handle 401 auto-logout + timeouts ─────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If server returns 401 (token expired/invalid) → auto-logout
    if (error.response?.status === 401) {
      const url = error.config?.url || "";
      // Don't auto-logout on auth endpoints (login/verify) — those have their own error handling
      if (!url.includes("/api/auth/")) {
        console.warn("[Auth] Session expired — logging out");
        clearSession();
        // Only redirect if not already on login page
        if (!window.location.pathname.includes("/login")) {
          window.location.replace("/login");
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
