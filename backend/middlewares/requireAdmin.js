import { supabase } from "../config/supabase.js";

export async function requireAdmin(req, res, next) {
  try {
    const { data: user } = await supabase
      .from("users")
      .select("email")
      .eq("id", req.userId)
      .maybeSingle();
    if (!user || !process.env.ADMIN_EMAIL || user.email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({ error: "Admin access required." });
    }
    next();
  } catch (error) {
    console.error("Admin check error:", error);
    res.status(500).json({ error: "Failed to verify admin access." });
  }
}
