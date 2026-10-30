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
  const userId = localStorage.getItem("userId") || "me";

  const now = Date.now();
  if (!forceRefresh && subscriptionStatusCache && now - subscriptionStatusTimestamp < STATUS_CACHE_TTL) {
    return subscriptionStatusCache;
  }

  try {
    const response = await api.get(`/api/subscriptions/status/${encodeURIComponent(userId)}`);
    subscriptionStatusCache = response.data || {};
    subscriptionStatusTimestamp = now;
    return subscriptionStatusCache;
  } catch (err) {
    if (subscriptionStatusCache) return subscriptionStatusCache;
    throw err;
  }
};
