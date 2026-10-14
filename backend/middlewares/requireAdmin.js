import { supabase } from "../config/supabase.js";

export async function requireAdmin(req, res, next) {
  try {
    const { data: user } = await supabase
      .from("users")
      .select("email")
      .eq("id", req.userId)
      .maybeSingle();
    const adminEmails = [
      ...(process.env.ADMIN_EMAIL || "").split(","),
      "noballondesk@gmail.com",
      "noballondesk@gamil.com",
      "akpatil51340@gmail.com",
    ]
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const userEmail = (user?.email || "").trim().toLowerCase();
    if (!user || !userEmail || !adminEmails.includes(userEmail)) {
      return res.status(403).json({ error: "Admin access required." });
    }
    next();
  } catch (error) {
    console.error("Admin check error:", error);
    res.status(500).json({ error: "Failed to verify admin access." });
  }
}
