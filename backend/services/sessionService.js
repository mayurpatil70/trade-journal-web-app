// backend/services/sessionService.js
import crypto from "crypto";
import { supabase } from "../config/supabase.js";

// In-memory hot cache for session validation (<1ms latency)
const sessionCache = new Map();
const CACHE_TTL_MS = 30 * 1000; // 30 seconds hot-cache window

const ADMIN_EMAILS = [
  ...(process.env.ADMIN_EMAIL || "").split(","),
  "noballondesk@gmail.com",
  "noballondesk@gamil.com",
  "akpatil51340@gmail.com",
]
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/**
 * Checks if a user is an admin by userId or email
 */
export async function isUserAdmin(userId, userEmail = null) {
  if (userEmail && ADMIN_EMAILS.includes(String(userEmail).toLowerCase().trim())) {
    return true;
  }
  if (!userId) return false;
  try {
    const { data: user } = await supabase
      .from("users")
      .select("email")
      .eq("id", userId)
      .maybeSingle();

    if (user?.email && ADMIN_EMAILS.includes(String(user.email).toLowerCase().trim())) {
      return true;
    }
  } catch (err) {
    console.warn("[Session] Admin check error:", err.message);
  }
  return false;
}

/**
 * Creates or refreshes a persistent session for a specific device
 */
export async function createSession({
  userId,
  deviceId,
  deviceName = "Unknown Device",
  ipAddress = "127.0.0.1",
  ttlDays = 30,
}) {
  if (!userId || !deviceId) {
    throw new Error("userId and deviceId are required to create a session.");
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000).toISOString();

  try {
    // Check if an existing session for this user and device already exists
    const { data: existing, error: checkErr } = await supabase
      .from("user_sessions")
      .select("id")
      .eq("user_id", userId)
      .eq("device_id", deviceId)
      .maybeSingle();

    if (checkErr && checkErr.code === "42P01") {
      // Table doesn't exist yet in Supabase
      console.warn("[Session] user_sessions table not found. Please run Migration 010.");
      const fallbackId = `fb_${crypto.randomUUID()}`;
      return { id: fallbackId, device_id: deviceId, device_name: deviceName };
    }

    let sessionData = null;

    if (existing?.id) {
      // Update existing device session (refresh expiry & last active)
      const { data, error: updateErr } = await supabase
        .from("user_sessions")
        .update({
          device_name: deviceName,
          ip_address: ipAddress,
          last_active_at: now.toISOString(),
          expires_at: expiresAt,
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (updateErr) throw updateErr;
      sessionData = data;
    } else {
      // Create new session row
      const { data, error: insertErr } = await supabase
        .from("user_sessions")
        .insert({
          user_id: userId,
          device_id: deviceId,
          device_name: deviceName,
          ip_address: ipAddress,
          last_active_at: now.toISOString(),
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (insertErr) throw insertErr;
      sessionData = data;
    }

    if (sessionData?.id) {
      sessionCache.set(sessionData.id, {
        ...sessionData,
        cachedAt: Date.now(),
      });
    }

    return sessionData;
  } catch (error) {
    console.error("[Session] Error creating session:", error.message);
    // Graceful fallback to ensure login never fails even if DB is temporarily unreachable
    return {
      id: `fb_${crypto.randomUUID()}`,
      user_id: userId,
      device_id: deviceId,
      device_name: deviceName,
    };
  }
}

/**
 * Validates a session by ID and verifies active subscription / trial status
 */
export async function validateSession(sessionId, userId) {
  if (!sessionId) {
    return { valid: false, reason: "MISSING_SESSION_ID" };
  }

  // Allow fallback sessions if DB table was missing during creation
  if (typeof sessionId === "string" && sessionId.startsWith("fb_")) {
    return { valid: true, session: { id: sessionId, user_id: userId } };
  }

  const nowMs = Date.now();
  const cached = sessionCache.get(sessionId);

  // 1. Check in-memory hot cache
  if (cached && (nowMs - cached.cachedAt < CACHE_TTL_MS)) {
    return { valid: true, session: cached };
  }

  try {
    // 2. Fetch session from Supabase
    const { data: session, error } = await supabase
      .from("user_sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle();

    if (error) {
      if (error.code === "42P01") {
        // Table not created yet - fail open gracefully
        return { valid: true };
      }
      throw error;
    }

    if (!session) {
      sessionCache.delete(sessionId);
      return { valid: false, reason: "SESSION_NOT_FOUND" };
    }

    // Check expiration timestamp
    if (new Date(session.expires_at).getTime() <= nowMs) {
      await supabase.from("user_sessions").delete().eq("id", sessionId);
      sessionCache.delete(sessionId);
      return { valid: false, reason: "SESSION_EXPIRED" };
    }

    // 3. Verify Subscription / Trial Status
    const uid = userId || session.user_id;
    const isAdmin = await isUserAdmin(uid);

    if (!isAdmin) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("trial_ends_at, subscription_ends_at, account_status")
        .eq("id", uid)
        .maybeSingle();

      const { data: subData } = await supabase
        .from("journal_subscriptions")
        .select("status")
        .eq("user_id", uid)
        .eq("status", "paid")
        .maybeSingle();

      const nowDate = new Date();
      const subEnds = profile?.subscription_ends_at ? new Date(profile.subscription_ends_at) : null;
      const trialEnds = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null;
      const isActiveStatus = profile?.account_status === "active";
      const hasActiveSub = Boolean(subData);

      const hasAccess =
        (subEnds && subEnds > nowDate) ||
        (trialEnds && trialEnds > nowDate) ||
        isActiveStatus ||
        hasActiveSub;

      if (!hasAccess) {
        // Auto-logout: Subscription or trial has expired
        console.warn(`[Session] User ${uid} trial/subscription expired. Invalidating session ${sessionId}.`);
        await supabase.from("user_sessions").delete().eq("id", sessionId);
        sessionCache.delete(sessionId);
        return { valid: false, reason: "SUBSCRIPTION_EXPIRED" };
      }
    }

    // 4. Throttled update of last_active_at (at most once every 5 minutes)
    const lastActiveMs = new Date(session.last_active_at || 0).getTime();
    if (nowMs - lastActiveMs > 5 * 60 * 1000) {
      supabase
        .from("user_sessions")
        .update({ last_active_at: new Date().toISOString() })
        .eq("id", sessionId)
        .then(() => {})
        .catch(() => {});
    }

    // Cache valid session
    sessionCache.set(sessionId, {
      ...session,
      cachedAt: nowMs,
    });

    return { valid: true, session };
  } catch (error) {
    console.error("[Session] Error validating session:", error.message);
    // On unexpected DB failure, fallback to allowing valid signed token so users aren't locked out
    return { valid: true };
  }
}

/**
 * Revokes/logs out a single session (e.g. current device or targeted device)
 */
export async function revokeSession(sessionId, userId) {
  if (!sessionId) return false;
  sessionCache.delete(sessionId);

  try {
    let query = supabase.from("user_sessions").delete().eq("id", sessionId);
    if (userId) {
      query = query.eq("user_id", userId);
    }
    const { error } = await query;
    if (error && error.code !== "42P01") {
      console.warn("[Session] Error revoking session:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[Session] Revoke exception:", err.message);
    return false;
  }
}

/**
 * Revokes all sessions for a user EXCEPT the current session
 */
export async function revokeAllOtherSessions(userId, currentSessionId) {
  if (!userId) return false;

  try {
    let query = supabase.from("user_sessions").delete().eq("user_id", userId);
    if (currentSessionId) {
      query = query.neq("id", currentSessionId);
    }
    const { error } = await query;

    // Invalidate non-current sessions from in-memory cache
    for (const [sid, data] of sessionCache.entries()) {
      if (data.user_id === userId && sid !== currentSessionId) {
        sessionCache.delete(sid);
      }
    }

    if (error && error.code !== "42P01") {
      console.warn("[Session] Error revoking other sessions:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[Session] Revoke all others exception:", err.message);
    return false;
  }
}

/**
 * Retrieves all active sessions for a user (formatted for Settings UI)
 */
export async function getUserSessions(userId, currentSessionId) {
  if (!userId) return [];

  try {
    const { data: sessions, error } = await supabase
      .from("user_sessions")
      .select("id, device_id, device_name, ip_address, last_active_at, created_at, expires_at")
      .eq("user_id", userId)
      .gte("expires_at", new Date().toISOString())
      .order("last_active_at", { ascending: false });

    if (error) {
      if (error.code === "42P01") return [];
      throw error;
    }

    return (sessions || []).map((s) => ({
      id: s.id,
      deviceId: s.device_id,
      deviceName: s.device_name || "Unknown Device",
      ipAddress: s.ip_address || "Unknown IP",
      lastActiveAt: s.last_active_at,
      createdAt: s.created_at,
      isCurrent: Boolean(currentSessionId && s.id === currentSessionId),
    }));
  } catch (err) {
    console.warn("[Session] Error fetching user sessions:", err.message);
    return [];
  }
}

