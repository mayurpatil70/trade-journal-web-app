import { Resend } from "resend";
import crypto from "crypto";
import { signAuthToken } from "../utils/authToken.js";
import { supabase } from "../config/supabase.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

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

    res.json({
      message: "Verified successfully",
      discordVerified: user.discord_verified,
      userId: user.id,
      authToken: signAuthToken(user.id),
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

    if (userId) {
      try {
        await supabase.from("profiles").upsert(
          {
            id: userId,
            display_name: displayName,
            username: username?.replace(/^@/, ""),
            bio: bio || "",
            avatar_url: avatarUrl || null,
            currency: currency || "USD",
            timezone: timezone || "UTC",
            discipline_rules: {
              maxRiskPerTrade,
              dailyLossCap,
              maxTradesPerDay,
              lossStreakBreak,
              targetRR,
              preferredSessions,
              favoritePairs,
            },
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
      } catch (profErr) {
        console.warn("[Auth] Save onboarding profile table notice:", profErr.message);
      }

      try {
        await supabase.from("users").update({
          display_name: displayName,
          avatar_url: avatarUrl || null,
        }).eq("id", userId);
      } catch (userErr) {
        console.warn("[Auth] Save onboarding users table notice:", userErr.message);
      }
    }

    res.json({ success: true, message: "Onboarding profile saved successfully." });
  } catch (error) {
    console.error("[Auth] Save onboarding profile error:", error);
    res.status(500).json({ success: false, error: "Failed to save profile." });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.query?.userId || req.headers["x-user-id"] || req.user?.id;
    const email = req.query?.email;

    if (!userId && !email) {
      return res.status(400).json({ success: false, error: "Missing userId or email" });
    }

    let profileData = null;

    if (userId) {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (!error && data) {
        profileData = data;
      }
    }

    if (!profileData && email) {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (!error && data) {
        profileData = data;
      }
    }

    // Fallback: check users table if not found in profiles
    if (!profileData && userId) {
      const { data: userRow } = await supabase
        .from("users")
        .select("id, email, display_name, avatar_url, created_at")
        .eq("id", userId)
        .maybeSingle();

      if (userRow) {
        profileData = {
          id: userRow.id,
          email: userRow.email,
          display_name: userRow.display_name,
          avatar_url: userRow.avatar_url,
          created_at: userRow.created_at,
        };
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
      preTradeChecklist,
      currentPlan,
    } = req.body;

    const targetId = userId || req.headers["x-user-id"] || req.user?.id;

    if (!targetId && !email) {
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
    if (disciplineRules !== undefined) updatePayload.discipline_rules = disciplineRules;
    if (preTradeChecklist !== undefined) updatePayload.pre_trade_checklist = preTradeChecklist;
    if (currentPlan !== undefined) updatePayload.current_plan = currentPlan;

    if (targetId) {
      updatePayload.id = targetId;
      try {
        await supabase
          .from("profiles")
          .upsert(updatePayload, { onConflict: "id" });
      } catch (profErr) {
        console.warn("[Auth] updateProfile profiles notice:", profErr.message);
      }

      // Sync users table if applicable
      try {
        const userSync = {};
        if (displayName !== undefined) userSync.display_name = displayName;
        if (avatarUrl !== undefined) userSync.avatar_url = avatarUrl;
        if (Object.keys(userSync).length > 0) {
          await supabase.from("users").update(userSync).eq("id", targetId);
        }
      } catch (userErr) {
        console.warn("[Auth] updateProfile users notice:", userErr.message);
      }
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
