import express from "express";
import { supabase } from "../config/supabase.js";

const router = express.Router();

// Fetch admin metrics for the dashboard
router.get("/metrics", async (req, res) => {
  try {
    // 1. Get recent payments
    const { data: payments, error: paymentsError } = await supabase
      .from("journal_subscriptions")
      .select("*")
      .order("paid_at", { ascending: false })
      .limit(50);
      
    if (paymentsError) throw paymentsError;

    // 2. Calculate revenue
    const paidOrders = payments.filter(p => p.status === "paid");
    const totalRevenue = paidOrders.reduce((acc, curr) => acc + (Number(curr.amount_usdt) || 0), 0);

    // 3. (Mock) Account logic since there is no accounts table mentioned
    // If you have a prop_accounts table, you would query it here.
    const { data: accounts, error: accError } = await supabase
      .from("users")
      .select("*")
      .limit(10);

    const metrics = {
      totalAccounts: accounts ? accounts.length : 0,
      activeAccounts: accounts ? accounts.length : 0,
      passedAccounts: 0,
      failedAccounts: 0,
      totalRevenue: totalRevenue,
      paidOrdersCount: paidOrders.length,
    };

    res.json({ 
      success: true, 
      metrics: metrics,
      recentOrders: payments || [],
      accounts: accounts || [] // Mocking with users for now
    });
  } catch (error) {
    console.error("Admin metrics error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch admin metrics." });
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
    res.status(500).json({ success: false, error: "Failed to revoke subscription." });
  }
});

// Delete all subscriptions for a specific user (ban/remove user access)
router.delete("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { error } = await supabase
      .from("journal_subscriptions")
      .delete()
      .eq("user_id", userId);

    if (error) throw error;
    res.json({ success: true, message: "User subscriptions deleted successfully." });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ success: false, error: "Failed to delete user." });
  }
});

export default router;
