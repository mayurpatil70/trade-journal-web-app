// backend/controllers/authController.js
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import crypto from "crypto";
import { signAuthToken } from "../utils/authToken.js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);
const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const requestLogin = async (req, res) => {
  const email = String(req.body?.email || "").trim();
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Please enter a valid email address." });
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

    const { error: emailError } = await resend.emails.send({
      from: "ForexNotes <auth@forexnotes.in>",
      to: email,
      subject: "ForexNotes - Secure Login",
      text: `Sign in to ForexNotes: ${magicLink}\n\nThis link expires in 15 minutes. If you didn't request it, ignore this email.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px">
        <h2 style="margin:0 0 12px">Sign in to ForexNotes</h2>
        <p>Click the button below to access your trading journal. This link expires in 15 minutes.</p>
        <p><a href="${magicLink}" style="display:inline-block;background:#10b981;color:#000;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Sign in</a></p>
        <p style="color:#666;font-size:12px">If you didn't request this email, you can safely ignore it.</p>
      </div>`,
    });

    if (emailError) throw new Error(emailError.message);

    res.json({ message: "Login link sent successfully." });
  } catch (error) {
    console.error("Auth Error:", error.message);
    res.status(500).json({ error: "Could not send the login link. Please try again." });
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

    // 1. Check if user is the Admin
    const isAdmin = user.email === process.env.ADMIN_EMAIL;

    // 2. Check if they have a paid subscription
    const { data: subData } = await supabase
      .from("journal_subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .eq("status", "paid")
      .maybeSingle();

    // 3. ADMIN BYPASS: If they are admin OR have paid, grant access
    const hasPaid = isAdmin || !!subData;

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
    res.status(500).json({ error: error.message });
  }
};
