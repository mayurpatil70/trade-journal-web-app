import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import { supabase } from "../config/supabase.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ANNOUNCEMENT_FILE = path.join(__dirname, "../data/announcement.json");

let globalAnnouncement = {
  active: false,
  message: "",
  type: "info",
  updatedAt: new Date().toISOString(),
};

// Attempt to load previously saved announcement from disk
try {
  if (fs.existsSync(ANNOUNCEMENT_FILE)) {
    const raw = fs.readFileSync(ANNOUNCEMENT_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      globalAnnouncement = { ...globalAnnouncement, ...parsed };
    }
  }
} catch (loadErr) {
  console.warn("Could not load persisted announcement:", loadErr.message);
}

// Public announcement check (no auth required)
router.get("/public/announcement", (req, res) => {
  res.json({ success: true, announcement: globalAnnouncement });
});

router.use(requireAuth, requireAdmin);

// Fetch admin metrics for the dashboard
router.get("/metrics", async (req, res) => {
  try {
    const [
      paymentsRes,
      accountsRes,
      tradesRes,
      withdrawalsRes,
      profilesRes,
      subscriptionsRes,
    ] = await Promise.allSettled([
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
        .select("id, user_id, date, created_at, asset, result, r_multiple, pnl, direction")
        .order("created_at", { ascending: false })
        .limit(1000),
      supabase
        .from("withdrawals")
        .select("*, users:user_id(email)")
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("*"),
      supabase
        .from("journal_subscriptions")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    const payments = (paymentsRes.status === "fulfilled" && !paymentsRes.value.error) ? (paymentsRes.value.data || []) : [];
    const accounts = (accountsRes.status === "fulfilled" && !accountsRes.value.error) ? (accountsRes.value.data || []) : [];
    const trades = (tradesRes.status === "fulfilled" && !tradesRes.value.error) ? (tradesRes.value.data || []) : [];
    const withdrawals = (withdrawalsRes.status === "fulfilled" && !withdrawalsRes.value.error) ? (withdrawalsRes.value.data || []) : [];
    const profiles = (profilesRes.status === "fulfilled" && !profilesRes.value.error) ? (profilesRes.value.data || []) : [];
    const subscriptions = (subscriptionsRes.status === "fulfilled" && !subscriptionsRes.value.error) ? (subscriptionsRes.value.data || []) : [];

    // Log any soft query failures for diagnostics
    if (paymentsRes.status === "rejected" || paymentsRes.value?.error) console.warn("Admin payments error:", paymentsRes.reason || paymentsRes.value?.error);
    if (accountsRes.status === "rejected" || accountsRes.value?.error) console.warn("Admin accounts error:", accountsRes.reason || accountsRes.value?.error);
    if (tradesRes.status === "rejected" || tradesRes.value?.error) console.warn("Admin trades error:", tradesRes.reason || tradesRes.value?.error);
    if (withdrawalsRes.status === "rejected" || withdrawalsRes.value?.error) console.warn("Admin withdrawals error:", withdrawalsRes.reason || withdrawalsRes.value?.error);
    if (profilesRes.status === "rejected" || profilesRes.value?.error) console.warn("Admin profiles error:", profilesRes.reason || profilesRes.value?.error);

    // Compute trade counts per user
    const tradeCountsByUser = {};
    trades.forEach((t) => {
      if (t.user_id) {
        tradeCountsByUser[t.user_id] = (tradeCountsByUser[t.user_id] || 0) + 1;
      }
    });

    // Index profiles by ID and by email
    const profileById = new Map();
    const profileByEmail = new Map();
    profiles.forEach((p) => {
      if (p.id) profileById.set(p.id, p);
      if (p.email) profileByEmail.set(String(p.email).toLowerCase().trim(), p);
    });

    // Index paid / pending subscription users
    const paidUserIds = new Set();
    const pendingUserIds = new Set();
    payments.forEach((p) => {
      if (p.user_id) {
        if (p.status === "paid") paidUserIds.add(p.user_id);
        else if (p.status === "pending") pendingUserIds.add(p.user_id);
      }
    });

    const now = Date.now();
    const enrichedAccounts = accounts.map((acc) => {
      const emailKey = String(acc.email || "").toLowerCase().trim();
      const profile = profileById.get(acc.id) || profileByEmail.get(emailKey) || {};
      const tradeCount = tradeCountsByUser[acc.id] || 0;

      const hasPaidOrder = paidUserIds.has(acc.id);
      const subEnds = profile.subscription_ends_at ? new Date(profile.subscription_ends_at).getTime() : 0;
      const trialEnds = profile.trial_ends_at ? new Date(profile.trial_ends_at).getTime() : 0;

      let computedStatus = "not_subscribed";
      if (hasPaidOrder || (subEnds && subEnds > now) || profile.account_status === "active") {
        computedStatus = "paid";
      } else if (trialEnds && trialEnds > now) {
        computedStatus = "trial";
      } else if (pendingUserIds.has(acc.id)) {
        computedStatus = "pending";
      } else if ((trialEnds && trialEnds <= now) || profile.account_status === "expired") {
        computedStatus = "expired";
      }

      return {
        ...acc,
        ...profile,
        id: acc.id,
        email: acc.email || profile.email || "Unknown",
        created_at: acc.created_at,
        discord_verified: acc.discord_verified || false,
        trade_count: tradeCount,
        subscription_status: computedStatus,
        current_plan: profile.current_plan || (computedStatus === "paid" ? "active" : computedStatus === "trial" ? "trial" : "none"),
        wallet_balance: Number(profile.wallet_balance || 0),
        referral_code: profile.referral_code || "N/A",
        trial_ends_at: profile.trial_ends_at || null,
        subscription_ends_at: profile.subscription_ends_at || null,
      };
    });

    const paidOrders = payments.filter((p) => p.status === "paid");
    const totalRevenue = paidOrders.reduce(
      (acc, curr) => acc + (Number(curr.amount_usdt) || 0),
      0,
    );

    const paidMembersCount = enrichedAccounts.filter((u) => u.subscription_status === "paid").length;
    const trialMembersCount = enrichedAccounts.filter((u) => u.subscription_status === "trial").length;

    const metrics = {
      totalAccounts: enrichedAccounts.length,
      activeAccounts: enrichedAccounts.filter((u) => u.email).length,
      paidMembers: paidMembersCount,
      trialMembers: trialMembersCount,
      totalRevenue,
      paidOrdersCount: paidOrders.length,
      totalTrades: trades.length,
      totalWithdrawals: withdrawals.length,
      totalAffiliateBalance: profiles.reduce(
        (sum, row) => sum + (Number(row.wallet_balance) || 0),
        0,
      ),
      pendingSubscriptionReview: payments.filter(
        (row) => row.status === "pending",
      ).length,
    };

    res.json({
      success: true,
      metrics,
      recentOrders: payments,
      accounts: enrichedAccounts,
      trades,
      withdrawals,
      affiliates: profiles.filter((p) => p.referral_code || Number(p.wallet_balance) > 0),
      subscriptions,
    });
  } catch (error) {
    console.error("Admin metrics error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch admin metrics." });
  }
});

// Verify or update a user's subscription order
router.put("/subscription/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status = "paid" } = req.body;

    const { data: updatedSub, error: subError } = await supabase
      .from("journal_subscriptions")
      .update({ status })
      .eq("id", id)
      .select()
      .maybeSingle();

    if (subError) throw subError;

    // If marked paid, also activate profile subscription
    if (status === "paid" && updatedSub?.user_id) {
      const endsAt = new Date();
      endsAt.setDate(endsAt.getDate() + 30);
      await supabase.from("profiles").upsert(
        {
          id: updatedSub.user_id,
          account_status: "active",
          subscription_ends_at: endsAt.toISOString(),
        },
        { onConflict: "id" }
      );
    }

    res.json({ success: true, message: "Subscription updated successfully.", order: updatedSub });
  } catch (error) {
    console.error("Update subscription error:", error);
    res.status(500).json({ success: false, error: "Failed to update subscription." });
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

// Grant or modify user access directly from Admin
router.post("/user/:userId/grant-access", async (req, res) => {
  try {
    const { userId } = req.params;
    const { type = "paid", days = 30 } = req.body; // 'paid' | 'trial' | 'revoke'

    const { data: user } = await supabase.from("users").select("email").eq("id", userId).maybeSingle();
    const email = user?.email || `user-${userId}@forexnotes.in`;

    if (type === "revoke") {
      await supabase.from("profiles").upsert(
        {
          id: userId,
          email,
          account_status: "expired",
          subscription_ends_at: new Date(0).toISOString(),
          trial_ends_at: new Date(0).toISOString(),
        },
        { onConflict: "id" }
      );

      await supabase.from("journal_subscriptions").update({ status: "revoked" }).eq("user_id", userId);
      return res.json({ success: true, message: "User access revoked." });
    }

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + Number(days));

    const updatePayload = {
      id: userId,
      email,
      account_status: type === "paid" ? "active" : "trial",
      ...(type === "paid"
        ? { subscription_ends_at: futureDate.toISOString(), current_plan: Number(days) >= 365 ? "yearly" : "monthly" }
        : { trial_ends_at: futureDate.toISOString(), account_status: "trial" }
      ),
    };

    const { error } = await supabase.from("profiles").upsert(updatePayload, { onConflict: "id" });
    if (error) throw error;

    res.json({ success: true, message: `Successfully granted ${days} days ${type} access.` });
  } catch (error) {
    console.error("Grant access error:", error);
    res.status(500).json({ success: false, error: "Failed to grant access." });
  }
});

// Delete all subscriptions for a specific user (ban/remove user access)
router.delete("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // 1. Delete from journal_subscriptions
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

    // 3. Delete profile
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);
    if (profileError) console.error(profileError);

    // 4. Delete from users table
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

// Admin: Provision / Create user directly
router.post("/user/create", async (req, res) => {
  try {
    const { email, type = "paid", days = 30 } = req.body;
    if (!email || !email.includes("@")) {
      return res.status(400).json({ success: false, error: "A valid email address is required." });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Upsert into users table
    const { data: user, error: userError } = await supabase
      .from("users")
      .upsert({ email: cleanEmail }, { onConflict: "email" })
      .select()
      .single();

    if (userError) throw userError;

    const userId = user.id;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + Number(days));

    // 2. Provision profile access
    const updatePayload = {
      id: userId,
      email: cleanEmail,
      account_status: type === "paid" ? "active" : "trial",
      ...(type === "paid"
        ? { subscription_ends_at: futureDate.toISOString(), current_plan: Number(days) >= 365 ? "yearly" : "monthly" }
        : { trial_ends_at: futureDate.toISOString(), account_status: "trial" }
      ),
    };

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(updatePayload, { onConflict: "id" });

    if (profileError) throw profileError;

    res.json({
      success: true,
      message: `User ${cleanEmail} successfully provisioned with ${days} days ${type} access.`,
      user: { ...user, ...updatePayload },
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to provision user." });
  }
});

// Admin: Get system broadcast announcement
router.get("/announcement", (req, res) => {
  res.json({ success: true, announcement: globalAnnouncement });
});

// Admin: Update system broadcast announcement
router.post("/announcement", (req, res) => {
  try {
    const { active, message, type = "info" } = req.body;
    globalAnnouncement = {
      active: Boolean(active),
      message: String(message || ""),
      type: type || "info",
      updatedAt: new Date().toISOString(),
    };

    try {
      const dataDir = path.dirname(ANNOUNCEMENT_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(ANNOUNCEMENT_FILE, JSON.stringify(globalAnnouncement, null, 2), "utf-8");
    } catch (fsErr) {
      console.warn("Failed to write announcement file to disk:", fsErr.message);
    }

    res.json({ success: true, message: "Broadcast updated successfully.", announcement: globalAnnouncement });
  } catch (error) {
    console.error("Announcement update error:", error);
    res.status(500).json({ success: false, error: "Failed to update announcement." });
  }
});

// Admin: Toggle Discord verified status for user
router.post("/user/:userId/toggle-discord", async (req, res) => {
  try {
    const { userId } = req.params;
    const { verified } = req.body;
    const isVerified = Boolean(verified);

    const { data: updatedUser, error } = await supabase
      .from("users")
      .update({ discord_verified: isVerified })
      .eq("id", userId)
      .select()
      .maybeSingle();

    if (error) throw error;

    res.json({
      success: true,
      message: `User Discord verification ${isVerified ? "enabled" : "disabled"}.`,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Toggle discord error:", error);
    res.status(500).json({ success: false, error: "Failed to update user Discord status." });
  }
});

export default router;
