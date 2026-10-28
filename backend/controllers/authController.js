import { Resend } from "resend";
import crypto from "crypto";
import { signAuthToken } from "../utils/authToken.js";
import { supabase } from "../config/supabase.js";

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
