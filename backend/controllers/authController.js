// backend/controllers/authController.js
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import crypto from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);
const resend = new Resend(process.env.RESEND_API_KEY);

export const requestLogin = async (req, res) => {
  const { email } = req.body;
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 15 * 60000).toISOString();

  try {
    const { error: dbError } = await supabase
      .from("users")
      .upsert(
        { email, login_token: token, token_expires: expires },
        { onConflict: "email" },
      );

    // if (dbError) throw new Error(dbError.message);

    // const magicLink = `http://localhost:5173/verify?token=${token}&email=${email}`;

    // // Updated to use your verified domain
    // const { error: emailError } = await resend.emails.send({
    //   from: "forexnotes.in <auth@nationalsteell.com>",
    //   to: email,
    //   subject: "Verify - ForexNotes.in Login and Join our Discord Server",
    //   html: `<p>Click <a href="${magicLink}">here</a> to access your trading journal.</p>`,
    // });

    // backend/controllers/authController.js

    if (dbError) throw new Error(dbError.message);

    // Dynamically choose the URL based on your .env file
    const clientUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const magicLink = `${clientUrl}/verify?token=${token}&email=${email}`;

    const { error: emailError } = await resend.emails.send({
      from: "ForexNotes <auth@nationalsteell.com>",
      to: email,
      subject: "ForexNotes - Secure Login",
      html: `<p>Click <a href="${magicLink}">here</a> to access your trading journal.</p>`,
    });

    if (emailError) throw new Error(emailError.message);

    res.json({ message: "Login link sent successfully." });
  } catch (error) {
    console.error("Auth Error:", error.message);
    res.status(500).json({ error: error.message });
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

    res.json({
      message: "Verified successfully",
      discordVerified: user.discord_verified,
      userId: user.id,
    });
  } catch (error) {
    console.error("Verify Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};
