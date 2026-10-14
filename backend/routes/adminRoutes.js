import express from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import { supabase } from "../config/supabase.js";

const router = express.Router();

router.use(requireAuth, requireAdmin);

// Fetch admin metrics for the dashboard
router.get("/metrics", async (req, res) => {
  try {
    const [
      { data: payments, error: paymentsError },
      { data: accounts, error: accError },
      { data: trades, error: tradesError },
      { data: withdrawals, error: withErr },
      { data: affiliates, error: affErr },
      { data: subscriptions, error: subscriptionError },
    ] = await Promise.all([
      supabase
        .from("journal_subscriptions")
        .select("*")
        .order("paid_at", { ascending: false })
        .limit(200),
      supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("trades")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("withdrawals")
        .select("*, users:user_id(email)")
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("journal_subscriptions")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    if (paymentsError) throw paymentsError;
    if (accError) throw accError;
    if (tradesError) throw tradesError;
    if (withErr) throw withErr;
    if (affErr) throw affErr;
    if (subscriptionError) throw subscriptionError;

    const paidOrders = (payments || []).filter((p) => p.status === "paid");
    const totalRevenue = paidOrders.reduce(
      (acc, curr) => acc + (Number(curr.amount_usdt) || 0),
      0,
    );
    const paidUserIds = new Set(
      paidOrders.map((p) => p.user_id).filter(Boolean),
    );

    const metrics = {
      totalAccounts: accounts ? accounts.length : 0,
      activeAccounts: accounts ? accounts.filter((u) => u.email).length : 0,
      paidMembers: Array.from(paidUserIds).length,
      totalRevenue,
      paidOrdersCount: paidOrders.length,
      totalTrades: trades ? trades.length : 0,
      totalWithdrawals: withdrawals ? withdrawals.length : 0,
      totalAffiliateBalance: (affiliates || []).reduce(
        (sum, row) => sum + (Number(row.wallet_balance) || 0),
        0,
      ),
      pendingSubscriptionReview: (payments || []).filter(
        (row) => row.status === "pending",
      ).length,
    };

    res.json({
      success: true,
      metrics,
      recentOrders: payments || [],
      accounts: accounts || [],
      trades: trades || [],
      withdrawals: withdrawals || [],
      affiliates: affiliates || [],
      subscriptions: subscriptions || [],
    });
  } catch (error) {
    console.error("Admin metrics error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch admin metrics." });
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
    res
      .status(500)
      .json({ success: false, error: "Failed to revoke subscription." });
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

    res.json({
      success: true,
      message: "User data and subscription deleted successfully.",
    });
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
    res
      .status(500)
      .json({ success: false, error: "Failed to update withdrawal." });
  }
});
