import { Resend } from "resend";
import crypto from "crypto";
import { signAuthToken } from "../utils/authToken.js";
import { supabase } from "../config/supabase.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import {
  createSession,
  revokeSession,
  revokeAllOtherSessions,
  revokeAllSessions,
  getUserSessions,
} from "../services/sessionService.js";
import { parseDeviceName, getClientIp } from "../utils/deviceHelper.js";

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ADMIN_EMAILS = [
  ...(process.env.ADMIN_EMAIL || "").split(","),
  "noballondesk@gmail.com",
  "noballondesk@gamil.com",
  "akpatil51340@gmail.com",
]
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const requestLogin = async (req, res) => {
  const email = String(req.body?.email || "").trim();
  if (!EMAIL_RE.test(email)) {
    return res
      .status(400)
      .json({ error: "Please enter a valid email address." });
  }
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 15 * 60000).toISOString();

  try {
    const { error: dbError } = await supabase
      .from("users")
      .upsert(
        { email, login_token: token, token_expires: expires },
        { onConflict: "email" },
      );

    if (dbError) throw new Error(dbError.message);

    const clientUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const magicLink = `${clientUrl}/verify?token=${token}&email=${encodeURIComponent(email)}`;

    // ── SPEED FIX: Respond immediately, send email in background ──
    // The user sees "check inbox" instantly instead of waiting 2-4s for Resend API.
    res.json({ message: "Login link sent successfully." });

    // Fire-and-forget email send (runs after response is sent)
    resend.emails
      .send({
        from: "ForexNotes <auth@forexnotes.in>",
        to: email,
        subject: "ForexNotes - Secure Login",
        text: `Sign in to ForexNotes: ${magicLink}\n\nThis link expires in 15 minutes. If you didn't request it, ignore this email.`,
        html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px">
        <h2 style="margin:0 0 12px">Sign in to ForexNotes</h2>
        <p>Click the button below to access your Setup Backtesting & Digital Trading journal. This link expires in 15 minutes.</p>
        <p><a href="${magicLink}" style="display:inline-block;background:#10b981;color:#000;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Sign in</a></p>
        <p style="color:#666;font-size:12px">If you didn't request this email, you can safely ignore it.</p>
      </div>`,
      })
      .catch((emailError) => {
        // Log email failure but don't crash — the DB already has the token
        console.error("Email send failed (background):", emailError.message);
      });
  } catch (error) {
    console.error("Auth Error:", error.message);
    // Only send error if response hasn't been sent yet
    if (!res.headersSent) {
      res
        .status(500)
        .json({ error: "Could not send the login link. Please try again." });
    }
  }
};

export const verifyLogin = async (req, res) => {
  const { email, token } = req.body;

  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("login_token", token)
      .gte("token_expires", new Date().toISOString())
      .single();

    if (error || !user) {
      return res.status(401).json({ error: "Invalid or expired login link." });
    }

    await supabase
      .from("users")
      .update({ login_token: null, token_expires: null })
      .eq("id", user.id);

    // 1. Check if user is an Admin
    const userEmail = String(user.email || "").trim().toLowerCase();
    const isAdmin = ADMIN_EMAILS.includes(userEmail);

    // 2. Check profiles table for active subscription or trial
    const { data: profile } = await supabase
      .from("profiles")
      .select("trial_ends_at, subscription_ends_at, account_status")
      .eq("id", user.id)
      .maybeSingle();

    const now = new Date();
    let hasActiveProfile = false;
    if (profile) {
      const subEnds = profile.subscription_ends_at ? new Date(profile.subscription_ends_at) : null;
      const trialEnds = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null;
      if (
        (subEnds && subEnds > now) ||
        (trialEnds && trialEnds > now) ||
        profile.account_status === "active"
      ) {
        hasActiveProfile = true;
      }
    }

    // 3. Check journal_subscriptions table
    const { data: subData } = await supabase
      .from("journal_subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .eq("status", "paid")
      .maybeSingle();

    // 4. Combined access check
    const hasPaid = isAdmin || hasActiveProfile || Boolean(subData);

    // 5. Per-Device Persistent Session Initialization
    const deviceId = req.body?.deviceId || req.headers["x-device-id"] || crypto.randomUUID();
    const deviceName = req.body?.deviceName || parseDeviceName(req.headers["user-agent"]);
    const ipAddress = getClientIp(req);

    const session = await createSession({
      userId: user.id,
      deviceId,
      deviceName,
      ipAddress,
    });

    const authToken = signAuthToken(user.id, {
      sessionId: session?.id,
      deviceId,
    });

    res.json({
      message: "Verified successfully",
      discordVerified: user.discord_verified,
      userId: user.id,
      sessionId: session?.id || null,
      deviceId,
      authToken,
      hasPaid: hasPaid,
      isAdmin: isAdmin,
    });
  } catch (error) {
    console.error("Verify Error:", error.message);
    res.status(500).json({ error: "Failed to verify login link. Please try again." });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, error: "No image file provided." });
    }

    const avatarUrl = await uploadToCloudinary(req.file.buffer, "user_avatars");
    const userId = req.body?.userId || req.headers["x-user-id"];
    const email = req.body?.email;

    // Persist avatar URL into profiles & users tables in Supabase
    if (userId) {
      try {
        await supabase
          .from("profiles")
          .upsert({ id: userId, avatar_url: avatarUrl, updated_at: new Date().toISOString() }, { onConflict: "id" });
      } catch (profileErr) {
        console.warn("[Auth] Avatar update profiles table notice:", profileErr.message);
      }

      try {
        await supabase
          .from("users")
          .update({ avatar_url: avatarUrl })
          .eq("id", userId);
      } catch (userErr) {
        console.warn("[Auth] Avatar update users table notice:", userErr.message);
      }
    } else if (email) {
      try {
        await supabase
          .from("users")
          .update({ avatar_url: avatarUrl })
          .eq("email", email);
      } catch (userErr) {
        console.warn("[Auth] Avatar update user by email notice:", userErr.message);
      }
    }

    res.json({ success: true, avatarUrl });
  } catch (error) {
    console.error("[Auth] Avatar upload error:", error);
    res.status(500).json({ success: false, error: "Failed to upload avatar to cloud storage." });
  }
};

export const saveOnboardingProfile = async (req, res) => {
  try {
    const {
      userId,
      email,
      displayName,
      username,
      bio,
      avatarUrl,
      currency,
      timezone,
      maxRiskPerTrade,
      dailyLossCap,
      maxTradesPerDay,
      lossStreakBreak,
      targetRR,
      preferredSessions,
      favoritePairs,
    } = req.body;

    if (!userId && !email) {
      return res.status(400).json({ success: false, error: "userId or email required" });
    }

    const isUuid = (val) =>
      typeof val === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

    let targetUuid = isUuid(userId) ? userId : null;
    let targetEmail = email || (userId && userId.includes("@") ? userId : null);

    // Look up user row in public.users
    if (!targetUuid && targetEmail) {
      try {
        const { data: u } = await supabase
          .from("users")
          .select("id, email")
          .eq("email", targetEmail)
          .maybeSingle();
        if (u) {
          targetUuid = u.id;
          targetEmail = u.email;
        }
      } catch (e) {
        console.warn("[Auth] Lookup user for onboarding notice:", e.message);
      }
    }

    const disciplineRulesPayload = {
      maxRiskPerTrade: maxRiskPerTrade || "2%",
      dailyLossCap: dailyLossCap || "5%",
      maxTradesPerDay: String(maxTradesPerDay || "5"),
      lossStreakBreak: String(lossStreakBreak || "3 in a row"),
      targetRR: targetRR || "1:2",
      preferredSessions: preferredSessions || ["London", "New York"],
      favoritePairs: favoritePairs || ["EUR/USD", "GBP/USD", "XAU/USD"],
    };

    // 1. Persist to profiles table (if targetUuid known)
    if (targetUuid) {
      try {
        await supabase.from("profiles").upsert(
          {
            id: targetUuid,
            email: targetEmail,
            display_name: displayName,
            username: username?.replace(/^@/, ""),
            bio: bio || "",
            avatar_url: avatarUrl || null,
            currency: currency || "USD",
            timezone: timezone || "UTC",
            discipline_rules: disciplineRulesPayload,
            rules_onboarded: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
      } catch (profErr) {
        console.warn("[Auth] Save onboarding profile table notice:", profErr.message);
      }
    }

    // 2. Persist to users table (guaranteed fallback)
    try {
      const userUpdate = {
        display_name: displayName,
        avatar_url: avatarUrl || null,
        discipline_rules: disciplineRulesPayload,
        rules_onboarded: true,
        onboarding_completed: true,
      };
      if (targetUuid) {
        await supabase.from("users").update(userUpdate).eq("id", targetUuid);
      } else if (targetEmail) {
        await supabase.from("users").update(userUpdate).eq("email", targetEmail);
      }
    } catch (userErr) {
      console.warn("[Auth] Save onboarding users table notice:", userErr.message);
    }

    res.json({ success: true, message: "Onboarding profile saved successfully." });
  } catch (error) {
    console.error("[Auth] Save onboarding profile error:", error);
    res.status(500).json({ success: false, error: "Failed to save profile." });
  }
};

export const getProfile = async (req, res) => {
  try {
    const rawUserId = req.query?.userId || req.headers["x-user-id"] || req.user?.id;
    const email = req.query?.email;

    if (!rawUserId && !email) {
      return res.status(400).json({ success: false, error: "Missing userId or email" });
    }

    const isUuid = (val) =>
      typeof val === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

    let targetUuid = isUuid(rawUserId) ? rawUserId : null;
    let targetEmail = email || (rawUserId && rawUserId.includes("@") ? rawUserId : null);

    // Look up user in users table if needed to bridge UUID and email
    let userRowData = null;
    try {
      let query = supabase.from("users").select("id, email, display_name, avatar_url, created_at, discipline_rules, rules_onboarded");
      if (targetUuid) {
        query = query.eq("id", targetUuid);
      } else if (targetEmail) {
        query = query.eq("email", targetEmail);
      }
      const { data: u } = await query.maybeSingle();
      if (u) {
        userRowData = u;
        targetUuid = u.id;
        targetEmail = u.email;
      }
    } catch (uErr) {
      console.warn("[Auth] User row fetch notice:", uErr.message);
    }

    let profileData = null;

    if (targetUuid) {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", targetUuid)
        .maybeSingle();

      if (!error && data) {
        profileData = data;
      }
    }

    if (!profileData && targetEmail) {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", targetEmail)
        .maybeSingle();

      if (!error && data) {
        profileData = data;
      }
    }

    // Fallback: construct profileData from users table if not in profiles
    if (!profileData && userRowData) {
      profileData = {
        id: userRowData.id,
        email: userRowData.email,
        display_name: userRowData.display_name,
        avatar_url: userRowData.avatar_url,
        discipline_rules: userRowData.discipline_rules || null,
        rules_onboarded: Boolean(userRowData.rules_onboarded),
        created_at: userRowData.created_at,
      };
    }

    // If profileData exists but has no discipline_rules, check userRowData
    if (profileData) {
      if (!profileData.discipline_rules && userRowData?.discipline_rules) {
        profileData.discipline_rules = userRowData.discipline_rules;
      }
      if (profileData.rules_onboarded === undefined && userRowData?.rules_onboarded !== undefined) {
        profileData.rules_onboarded = Boolean(userRowData.rules_onboarded);
      }

      // Default fallback if still missing
      if (!profileData.discipline_rules) {
        profileData.discipline_rules = {
          maxRiskPerTrade: "2%",
          maxTradesPerDay: "5",
          dailyLossCap: "5%",
          lossStreakBreak: "3 in a row",
          targetRR: "1:2",
        };
      }

      const targetUserId = profileData.id || targetUuid;
      if (targetUserId) {
        // Query journal_subscriptions for latest paid subscription
        const { data: latestSub } = await supabase
          .from("journal_subscriptions")
          .select("*")
          .eq("user_id", targetUserId)
          .eq("status", "paid")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestSub) {
          const isYearly = Number(latestSub.amount_usdt) >= 100;
          if (!profileData.current_plan || profileData.current_plan === "none" || profileData.current_plan === "free") {
            profileData.current_plan = isYearly ? "yearly" : "monthly";
          }
          if (profileData.account_status !== "active") {
            profileData.account_status = "active";
          }
        }
      }

      // Check admin status
      const adminEmails = [
        ...(process.env.ADMIN_EMAIL || "").split(","),
        "noballondesk@gmail.com",
        "noballondesk@gamil.com",
        "akpatil51340@gmail.com",
      ].map((e) => e.trim().toLowerCase()).filter(Boolean);

      const userEmail = (profileData.email || targetEmail || "").trim().toLowerCase();
      if (userEmail && adminEmails.includes(userEmail)) {
        profileData.isAdmin = true;
      }
    }

    res.json({
      success: true,
      profile: profileData || {},
    });
  } catch (error) {
    console.error("[Auth] getProfile error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch profile." });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const {
      userId,
      email,
      displayName,
      username,
      bio,
      avatarUrl,
      currency,
      timezone,
      disciplineRules,
      rulesOnboarded,
      preTradeChecklist,
      currentPlan,
    } = req.body;

    const rawId = userId || req.headers["x-user-id"] || req.user?.id;
    const isUuid = (val) =>
      typeof val === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

    let targetUuid = isUuid(rawId) ? rawId : null;
    let targetEmail = email || (rawId && rawId.includes("@") ? rawId : null);

    if (!targetUuid && targetEmail) {
      try {
        const { data: u } = await supabase
          .from("users")
          .select("id, email")
          .eq("email", targetEmail)
          .maybeSingle();
        if (u) {
          targetUuid = u.id;
          targetEmail = u.email;
        }
      } catch (e) {
        console.warn("[Auth] updateProfile user lookup notice:", e.message);
      }
    }

    if (!targetUuid && !targetEmail) {
      return res.status(400).json({ success: false, error: "Missing userId or email" });
    }

    const updatePayload = {
      updated_at: new Date().toISOString(),
    };

    if (displayName !== undefined) updatePayload.display_name = displayName;
    if (username !== undefined) updatePayload.username = username?.replace(/^@/, "");
    if (bio !== undefined) updatePayload.bio = bio;
    if (avatarUrl !== undefined) updatePayload.avatar_url = avatarUrl;
    if (currency !== undefined) updatePayload.currency = currency;
    if (timezone !== undefined) updatePayload.timezone = timezone;
    if (disciplineRules !== undefined) {
      updatePayload.discipline_rules = disciplineRules;
      updatePayload.rules_onboarded = true;
    }
    if (rulesOnboarded !== undefined) updatePayload.rules_onboarded = Boolean(rulesOnboarded);
    if (preTradeChecklist !== undefined) updatePayload.pre_trade_checklist = preTradeChecklist;
    if (currentPlan !== undefined) updatePayload.current_plan = currentPlan;

    // 1. Persist to profiles table
    if (targetUuid) {
      updatePayload.id = targetUuid;
      if (targetEmail) updatePayload.email = targetEmail;
      try {
        await supabase
          .from("profiles")
          .upsert(updatePayload, { onConflict: "id" });
      } catch (profErr) {
        console.warn("[Auth] updateProfile profiles notice:", profErr.message);
      }
    }

    // 2. Persist to users table (guaranteed sync)
    try {
      const userSync = {};
      if (displayName !== undefined) userSync.display_name = displayName;
      if (avatarUrl !== undefined) userSync.avatar_url = avatarUrl;
      if (disciplineRules !== undefined) {
        userSync.discipline_rules = disciplineRules;
        userSync.rules_onboarded = true;
        userSync.onboarding_completed = true;
      }
      if (rulesOnboarded !== undefined) userSync.rules_onboarded = Boolean(rulesOnboarded);

      if (Object.keys(userSync).length > 0) {
        if (targetUuid) {
          await supabase.from("users").update(userSync).eq("id", targetUuid);
        } else if (targetEmail) {
          await supabase.from("users").update(userSync).eq("email", targetEmail);
        }
      }
    } catch (userErr) {
      console.warn("[Auth] updateProfile users notice:", userErr.message);
    }

    res.json({
      success: true,
      message: "Profile updated successfully.",
      profile: updatePayload,
    });
  } catch (error) {
    console.error("[Auth] updateProfile error:", error);
    res.status(500).json({ success: false, error: "Failed to update profile." });
  }
};

export const updateChecklist = async (req, res) => {
  try {
    const { userId, checklist } = req.body;
    const targetId = userId || req.headers["x-user-id"] || req.user?.id;

    if (!targetId) {
      return res.status(400).json({ success: false, error: "Missing userId" });
    }

    if (!Array.isArray(checklist)) {
      return res.status(400).json({ success: false, error: "Checklist must be an array" });
    }

    await supabase
      .from("profiles")
      .upsert(
        {
          id: targetId,
          pre_trade_checklist: checklist,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    res.json({ success: true, checklist });
  } catch (error) {
    console.error("[Auth] updateChecklist error:", error);
    res.status(500).json({ success: false, error: "Failed to update checklist." });
  }
};

/**
 * Logout the current device session
 */
export const logoutUser = async (req, res) => {
  try {
    const sessionId = req.sessionId || req.body?.sessionId;
    const userId = req.userId || req.body?.userId;

    if (sessionId) {
      await revokeSession(sessionId, userId);
    }

    res.json({ success: true, message: "Logged out successfully." });
  } catch (error) {
    console.error("[Auth] logout error:", error);
    res.status(500).json({ success: false, error: "Failed to log out." });
  }
};

/**
 * Get all active sessions for current user (Settings/Profile UI)
 */
export const getActiveSessions = async (req, res) => {
  try {
    const userId = req.userId;
    const currentSessionId = req.sessionId;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    let sessions = await getUserSessions(userId, currentSessionId);

    // If no session row exists yet (e.g. user logged in before migration), auto-create one for this device
    if (sessions.length === 0) {
      const deviceId = req.deviceId || req.headers["x-device-id"] || crypto.randomUUID();
      const deviceName = parseDeviceName(req.headers["user-agent"]);
      const ipAddress = getClientIp(req);

      const created = await createSession({
        userId,
        deviceId,
        deviceName,
        ipAddress,
      });

      if (created?.id) {
        sessions = await getUserSessions(userId, created.id);
      }
    }

    res.json({ success: true, sessions });
  } catch (error) {
    console.error("[Auth] getActiveSessions error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch active devices." });
  }
};

/**
 * Revoke a specific device session
 */
export const revokeSessionById = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.userId;

    if (!sessionId || !userId) {
      return res.status(400).json({ success: false, error: "Session ID and User ID required" });
    }

    await revokeSession(sessionId, userId);
    res.json({ success: true, message: "Device session revoked successfully." });
  } catch (error) {
    console.error("[Auth] revokeSessionById error:", error);
    res.status(500).json({ success: false, error: "Failed to revoke device session." });
  }
};

/**
 * Revoke all other sessions except the current one
 */
export const revokeOtherSessions = async (req, res) => {
  try {
    const userId = req.userId;
    const currentSessionId = req.sessionId;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    await revokeAllOtherSessions(userId, currentSessionId);
    res.json({ success: true, message: "All other device sessions logged out." });
  } catch (error) {
    console.error("[Auth] revokeOtherSessions error:", error);
    res.status(500).json({ success: false, error: "Failed to revoke other devices." });
  }
};

/**
 * Revoke ALL sessions for the user across all devices
 */
export const revokeAllSessionsForUser = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    await revokeAllSessions(userId);
    res.json({ success: true, message: "All devices logged out successfully." });
  } catch (error) {
    console.error("[Auth] revokeAllSessionsForUser error:", error);
    res.status(500).json({ success: false, error: "Failed to log out all devices." });
  }
};

