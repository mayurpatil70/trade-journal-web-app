// backend/routes/subscriptionRoutes.js
import express from "express";
import { supabase } from "../config/supabase.js";
import { sendRevenueAlert } from "../utils/discordWebhook.js";

// FIX: Point to the new chain verifier utility
import { verifyPayment } from "../utils/chainVerifier.js";

const router = express.Router();
const JOURNAL_PRICE = 11.0;

// 1. Send Wallet Config to Frontend
router.get("/config", (req, res) => {
  res.json({
    success: true,
    price: JOURNAL_PRICE,
    wallets: {
      BEP20: process.env.BEP20_ADDRESS,
    },
  });
});

// 2. Check User Subscription Status (Used by PaywallGuard)
router.get("/status/:userId", async (req, res) => {
  try {
    const { data: user } = await supabase
      .from("users")
      .select("email")
      .eq("id", req.params.userId)
      .maybeSingle();

    if (user && user.email === process.env.ADMIN_EMAIL) {
      return res.json({ success: true, hasPaid: true });
    }

    const { data, error } = await supabase
      .from("journal_subscriptions")
      .select("status")
      .eq("user_id", req.params.userId)
      .eq("status", "paid")
      .maybeSingle();

    if (error && error.code !== "PGRST116") throw error;

    res.json({ success: true, hasPaid: !!data });
  } catch (error) {
    console.error("Status check error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to verify access status." });
  }
});

// 3. Verify Payment & Unlock App
router.post("/verify", async (req, res) => {
  try {
    const { userId, txHash, chain, paymentScreenshot } = req.body;

    if (!txHash || !chain || !userId) {
      return res
        .status(400)
        .json({ error: "Missing required payment details." });
    }

    const { data: used } = await supabase
      .from("journal_subscriptions")
      .select("id")
      .eq("tx_hash", txHash)
      .maybeSingle();

    if (used)
      return res.status(409).json({ error: "Transaction hash already used." });

    const since = Date.now() - 24 * 60 * 60 * 1000;
    const check = await verifyPayment({
      chain,
      txHash,
      amount: JOURNAL_PRICE,
      since,
    });

    if (!check.ok)
      return res
        .status(422)
        .json({ error: check.reason || "Payment verification failed." });

    const status = check.status || "paid";

    const { error: insertErr } = await supabase
      .from("journal_subscriptions")
      .insert({
        user_id: userId,
        status: status,
        amount_usdt: JOURNAL_PRICE,
        chain,
        tx_hash: txHash,
        payment_screenshot: paymentScreenshot,
        paid_at: new Date().toISOString(),
      });

    if (insertErr) throw insertErr;

    await sendRevenueAlert({
      type: "Journal Access",
      userId,
      amount: JOURNAL_PRICE,
      chain,
      txHash,
      screenshot: paymentScreenshot,
    });

    if (status === "pending") {
      res.json({ success: true, message: "Payment submitted! Awaiting admin approval." });
    } else {
      res.json({ success: true, message: "Payment verified! App unlocked." });
    }
  } catch (error) {
    console.error("Paywall verification failed:", error);
    res.status(500).json({ error: "Verification failed. Please try again." });
  }
});

// 4. Admin route to fetch pending payments
router.get("/admin/pending", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("journal_subscriptions")
      .select("*")
      .eq("status", "pending");

    if (error) throw error;
    res.json({ success: true, pendingPayments: data });
  } catch (error) {
    console.error("Failed to fetch pending payments:", error);
    res.status(500).json({ error: "Failed to fetch pending payments." });
  }
});

export default router;
