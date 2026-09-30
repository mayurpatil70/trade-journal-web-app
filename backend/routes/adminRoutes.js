import express from "express";
import { supabase } from "../config/supabase.js";

const router = express.Router();

// Fetch total revenue
router.get("/revenue", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("journal_subscriptions")
      .select("amount_usdt")
      .eq("status", "paid");
    
    if (error) throw error;
    
    const totalRevenue = data.reduce((acc, curr) => acc + (Number(curr.amount_usdt) || 0), 0);
    res.json({ success: true, totalRevenue });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch revenue." });
  }
});

// Fetch recent pending/completed payments
router.get("/payments", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("journal_subscriptions")
      .select("*")
      .order("paid_at", { ascending: false })
      .limit(100);
      
    if (error) throw error;
    res.json({ success: true, payments: data });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch payments." });
  }
});

// Delete/revoke a user's subscription
router.delete("/subscription/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from("journal_subscriptions")
      .delete()
      .eq("id", id);
      
    if (error) throw error;
    res.json({ success: true, message: "Subscription revoked successfully." });
  } catch (error) {
    res.status(500).json({ error: "Failed to revoke subscription." });
  }
});

export default router;
