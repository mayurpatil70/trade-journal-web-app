import { Resend } from "resend";
import crypto from "crypto";
import { signAuthToken } from "../utils/authToken.js";
import { isAdminEmail } from "../config/admin.js";
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
import { hashPassword, verifyPassword } from "../utils/password.js";

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function respondWithSession(req, res, user, message) {
  const userEmail = String(user.email || "").trim().toLowerCase();
  const isAdmin = isAdminEmail(userEmail);

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

  const { data: subData } = await supabase
    .from("journal_subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .eq("status", "paid")
    .maybeSingle();

  const hasPaid = isAdmin || hasActiveProfile || Boolean(subData);

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
    message,
    discordVerified: user.discord_verified,
    userId: user.id,
    email: user.email,
    username: user.username || null,
    sessionId: session?.id || null,
    deviceId,
    authToken,
    hasPaid,
    isAdmin,
    onboarded: Boolean(user.rules_onboarded || user.onboarding_completed),
  });
}

const USERNAME_RE = /^[a-z0-9_.]{3,20}$/;
const escapeLike = (v) => v.replace(/[\\%_]/g, (c) => `\\${c}`);
const cleanText = (v, max) => String(v || "").trim().replace(/\s+/g, " ").slice(0, max);

function normalizePhone(dialCode, number) {
  const dial = String(dialCode || "").replace(/\D/g, "");
  const national = String(number || "").replace(/\D/g, "").replace(/^0+/, "");
  if (!/^[1-9]\d{0,3}$/.test(dial) || national.length < 4) return null;
  const full = dial + national;
  return full.length >= 8 && full.length <= 15 ? `+${full}` : null;
}

function passwordProblem(password) {
  if (typeof password !== "string" || password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > 128) return "Password must be at most 128 characters.";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "Password must contain at least one letter and one number.";
  return null;
}

const EMAIL_FONT = "-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',Helvetica,Arial,sans-serif";

// Table layout keeps the iOS-style card intact in Gmail and Outlook.
function magicLinkEmailHtml(magicLink, clientUrl) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f2f2f7">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f2f7;padding:40px 16px;font-family:${EMAIL_FONT}">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px">
    <tr><td align="center" style="padding-bottom:20px">
      <img src="${clientUrl}/logo-192.png" width="44" height="44" alt="" style="display:inline-block;vertical-align:middle;border:0;border-radius:10px">
      <span style="display:inline-block;vertical-align:middle;margin-left:8px;font-size:20px;font-weight:700;letter-spacing:-0.02em;color:#1c1c1e">Forex<span style="color:#007aff">Notes</span></span>
    </td></tr>
    <tr><td style="background:#ffffff;border-radius:20px;padding:32px 28px;border:1px solid rgba(0,0,0,0.06)">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;letter-spacing:-0.02em;color:#1c1c1e;text-align:center">Sign in to ForexNotes</h1>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.5;color:#6e6e73;text-align:center">Tap the button below to open your journal. This link expires in 15 minutes.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
        <a href="${magicLink}" style="display:inline-block;background:#007aff;color:#ffffff;padding:14px 36px;border-radius:999px;text-decoration:none;font-size:16px;font-weight:600">Sign in</a>
      </td></tr></table>
      <p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#8e8e93;text-align:center">Button not working? Copy this link into your browser:<br><a href="${magicLink}" style="color:#007aff;word-break:break-all">${magicLink}</a></p>
    </td></tr>
    <tr><td style="padding:20px 8px 0;font-size:12px;line-height:1.5;color:#8e8e93;text-align:center">If you didn't request this email, you can safely ignore it.<br>&copy; ForexNotes &middot; forexnotes.in</td></tr>
  </table>
</td></tr>
</table>
</body></html>`;
}

async function findUserByEmail(email) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .ilike("email", escapeLike(email))
    .limit(5);
  if (error) throw new Error(error.message);
  const matches = (data || []).filter((u) => String(u.email).toLowerCase() === email);
  return matches.find((u) => u.email === email) || matches[0] || null;
}

export const registerUser = async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const username = String(req.body?.username || "").trim().replace(/^@/, "").toLowerCase();
  const password = req.body?.password;
  const country = cleanText(req.body?.country, 60);
  const city = cleanText(req.body?.city, 80);
  const phone = normalizePhone(req.body?.dialCode, req.body?.phone);

  if (!EMAIL_RE.test(email) || email.length > 254) return res.status(400).json({ error: "Please enter a valid email address." });
  if (!USERNAME_RE.test(username)) {
    return res.status(400).json({ error: "Username must be 3-20 characters: letters, numbers, dot or underscore." });
  }
  const pwError = passwordProblem(password);
  if (pwError) return res.status(400).json({ error: pwError });
  if (!country) return res.status(400).json({ error: "Please select your country." });
  if (city.length < 2) return res.status(400).json({ error: "Please enter your city." });
  if (!phone) return res.status(400).json({ error: "Please enter a valid phone number." });

  try {
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({
        field: "email",
        error: existing.password_hash
          ? "An account with this email already exists. Please sign in."
          : "This email is already registered with email link sign-in. Use \"Email me a sign-in link\" on the Sign In card.",
      });
    }

    const [{ data: takenUser }, { data: takenProfile }, { data: takenPhone }] = await Promise.all([
      supabase.from("users").select("id").ilike("username", escapeLike(username)).limit(1),
      supabase.from("profiles").select("id").ilike("username", escapeLike(username)).limit(1),
      supabase.from("users").select("id").eq("phone", phone).limit(1),
    ]);
    if (takenUser?.length || takenProfile?.length) {
      return res.status(409).json({ field: "username", error: "This username is already taken." });
    }
    if (takenPhone?.length) {
      return res.status(409).json({ field: "phone", error: "This phone number is already registered." });
    }

    const { data: user, error } = await supabase
      .from("users")
      .insert({
        email,
        username,
        password_hash: await hashPassword(password),
        country,
        city,
        phone,
        password_updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        const field = /phone/i.test(error.message) ? "phone" : /username/i.test(error.message) ? "username" : "email";
        return res.status(409).json({ field, error: `This ${field} is already registered.` });
      }
      throw new Error(error.message);
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({ id: user.id, email, username, updated_at: new Date().toISOString() }, { onConflict: "id" });
    if (profileError) console.warn("[Auth] Register profile notice:", profileError.message);

    await respondWithSession(req, res, user, "Account created successfully");
  } catch (error) {
    console.error("Register Error:", error.message);
    if (!res.headersSent) res.status(500).json({ error: "Could not create your account. Please try again." });
  }
};

export const loginWithPassword = async (req, res) => {
  const method = req.body?.method === "phone" ? "phone" : "email";
  const password = req.body?.password;
  if (typeof password !== "string" || !password || password.length > 128) {
    return res.status(400).json({ error: "Please enter your password." });
  }

  try {
    let user = null;
    if (method === "email") {
      const email = String(req.body?.email || "").trim().toLowerCase();
      if (!EMAIL_RE.test(email)) return res.status(400).json({ error: "Please enter a valid email address." });
      user = await findUserByEmail(email);
    } else {
      const phone = normalizePhone(req.body?.dialCode, req.body?.phone);
      if (!phone) return res.status(400).json({ error: "Please enter a valid phone number." });
      const { data, error } = await supabase.from("users").select("*").eq("phone", phone).limit(1);
      if (error) throw new Error(error.message);
      user = data?.[0] || null;
    }

    const ok = await verifyPassword(password, user?.password_hash);
    if (!user || !ok) {
      return res.status(401).json({ error: `Incorrect ${method === "phone" ? "phone number" : "email"} or password.` });
    }

    await respondWithSession(req, res, user, "Signed in successfully");
  } catch (error) {
    console.error("Password Login Error:", error.message);
    if (!res.headersSent) res.status(500).json({ error: "Could not sign you in. Please try again." });
  }
};

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
        html: magicLinkEmailHtml(magicLink, clientUrl),
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

    await respondWithSession(req, res, user, "Verified successfully");
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
    const userId = req.userId;

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

    const targetUuid = req.userId;
    let targetEmail = null;
    try {
      const { data: u } = await supabase.from("users").select("email").eq("id", targetUuid).maybeSingle();
      targetEmail = u?.email || null;
    } catch (e) {
      console.warn("[Auth] Lookup user for onboarding notice:", e.message);
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
            ...(targetEmail ? { email: targetEmail } : {}),
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
      await supabase.from("users").update(userUpdate).eq("id", targetUuid);
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
    const rawUserId = req.userId;
    const email = null;

    if (!rawUserId && !email) {
      return res.status(400).json({ success: false, error: "Missing userId or email" });
    }

    let targetUuid = rawUserId;
    let targetEmail = email;

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
      if (isAdminEmail(userRowData?.email || profileData.email)) {
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
      displayName,
      username,
      bio,
      avatarUrl,
      currency,
      timezone,
      disciplineRules,
      rulesOnboarded,
      preTradeChecklist,
    } = req.body;

    const targetUuid = req.userId;
    const targetEmail = null;

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
    const { checklist } = req.body;
    const targetId = req.userId;

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

