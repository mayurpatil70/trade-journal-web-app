// frontend/src/utils/subscriptionCache.js
import api from "../api/axios";

// In-memory subscription & Discord verification cache to prevent redundant blocking requests on route changes
let subscriptionStatusCache = null;
let subscriptionStatusTimestamp = 0;
const STATUS_CACHE_TTL = 60_000; // 60 seconds TTL

export const invalidateSubscriptionCache = () => {
  subscriptionStatusCache = null;
  subscriptionStatusTimestamp = 0;
};

export const getImmediateCachedStatus = () => {
  return subscriptionStatusCache;
};

export const getCachedAccessStatus = async (forceRefresh = false) => {
  const userId = localStorage.getItem("userId") || "";
  const userEmail = (localStorage.getItem("userEmail") || "").toLowerCase().trim();
  const adminEmails = ["noballondesk@gmail.com", "noballondesk@gamil.com", "akpatil51340@gmail.com"];

  // Instant admin bypass
  if (adminEmails.includes(userEmail) || adminEmails.includes(userId.toLowerCase().trim())) {
    return { isAdmin: true, discordVerified: true, hasPaid: true };
  }

  const now = Date.now();
  if (!forceRefresh && subscriptionStatusCache && now - subscriptionStatusTimestamp < STATUS_CACHE_TTL) {
    return subscriptionStatusCache;
  }

  try {
    const response = await api.get(`/api/subscriptions/status/${userId || userEmail}`);
    subscriptionStatusCache = response.data || {};
    subscriptionStatusTimestamp = now;
    return subscriptionStatusCache;
  } catch (err) {
    if (subscriptionStatusCache) return subscriptionStatusCache;
    throw err;
  }
};
