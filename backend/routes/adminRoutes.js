import express from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import { supabase } from "../config/supabase.js";

const router = express.Router();

router.use(requireAuth, requireAdmin);

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

    // 4. Get Withdrawals
    const { data: withdrawals, error: withErr } = await supabase
      .from("withdrawals")
      .select("*, users:user_id(email)")
      .order("created_at", { ascending: false });

    // 5. Get Affiliate balances
    const { data: affiliates, error: affErr } = await supabase
      .from("profiles")
      .select("id, email, wallet_balance, referral_code")
      .gt("wallet_balance", 0)
      .order("wallet_balance", { ascending: false });

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
      accounts: accounts || [],
      withdrawals: withdrawals || [],
      affiliates: affiliates || []
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
    
    // 1. Delete from journal_subscriptions (logs them out of $11 model / paywall)
    const { error: subError } = await supabase
      .from("journal_subscriptions")
      .delete()
      .eq("user_id", userId);
    if (subError) console.error(subError);

    // 2. Delete all their trades
    const { error: tradesError } = await supabase
      .from("trades")
      .delete()
      .eq("user_id", userId);
    if (tradesError) console.error(tradesError);

    // 3. Delete from users table
    const { error: userError } = await supabase
      .from("users")
      .delete()
      .eq("id", userId);
    if (userError) console.error(userError);

    res.json({ success: true, message: "User data and subscription deleted successfully." });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ success: false, error: "Failed to delete user." });
  }
});

export default router;
// Update withdrawal status
router.put("/withdrawal/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { error } = await supabase
      .from("withdrawals")
      .update({ status })
      .eq("id", id);
      
    if (error) throw error;
    res.json({ success: true, message: "Withdrawal updated successfully." });
  } catch (error) {
    console.error("Withdrawal update error:", error);
    res.status(500).json({ success: false, error: "Failed to update withdrawal." });
  }
});
