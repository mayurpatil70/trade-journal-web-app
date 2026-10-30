import { supabase } from "../config/supabase.js";
import { isAdminEmail } from "../config/admin.js";

export async function requireAdmin(req, res, next) {
  try {
    if (!req.userId) return res.status(401).json({ error: "Please log in again." });
    const { data: user, error } = await supabase
      .from("users")
      .select("email")
      .eq("id", req.userId)
      .maybeSingle();
    if (error) throw error;
    if (!isAdminEmail(user?.email)) {
      return res.status(403).json({ error: "Admin access required." });
    }
    next();
  } catch (error) {
    console.error("Admin check error:", error);
    res.status(500).json({ error: "Failed to verify admin access." });
  }
}
