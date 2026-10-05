// backend/routes/subscriptionRoutes.js
import express from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import { supabase } from "../config/supabase.js";
import { sendRevenueAlert } from "../utils/discordWebhook.js";

// FIX: Point to the new chain verifier utility
import { verifyPayment } from "../utils/chainVerifier.js";

import { v2 as cloudinary } from "cloudinary";
import { upload } from "../middlewares/upload.js";

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "forex_notes_payments" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      },
    );
    stream.end(buffer);
  });
};

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

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("trial_ends_at, subscription_ends_at")
      .eq("id", req.params.userId)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    let hasPaid = false;
    const now = new Date();
    
    if (profile) {
      const trialEnds = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null;
      const subEnds = profile.subscription_ends_at ? new Date(profile.subscription_ends_at) : null;
      
      if ((subEnds && subEnds > now) || (trialEnds && trialEnds > now)) {
        hasPaid = true;
      }
    }

    res.json({ success: true, hasPaid });
  } catch (error) {
    console.error("Status check error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to verify access status." });
  }
});

// 3. Verify Payment & Unlock App
router.post("/verify", requireAuth, upload.single("screenshot"), async (req, res) => {
  try {
    const { userId, txHash, chain } = req.body;
    let paymentScreenshot = null;

    if (req.file) {
      paymentScreenshot = await uploadToCloudinary(req.file.buffer);
    }

    if (!txHash || !chain || !userId) {
      return res
        .status(400)
        .json({ error: "Missing required payment details." });
    }

    if (!/^0x([A-Fa-f0-9]{64})$/.test(txHash)) {
      return res
        .status(400)
        .json({ error: "Invalid transaction hash format. Must be a valid 66-character hex string starting with 0x." });
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

// 4. Verify Masterclass Payment
router.post("/masterclass/verify", requireAuth, upload.single("screenshot"), async (req, res) => {
  try {
    const { userId, txHash, chain } = req.body;
    let paymentScreenshot = null;

    if (req.file) {
      paymentScreenshot = await uploadToCloudinary(req.file.buffer);
    }

    if (!txHash || !chain || !userId) {
      return res.status(400).json({ error: "Missing required payment details." });
    }

    if (!/^0x([A-Fa-f0-9]{64})$/.test(txHash)) {
      return res.status(400).json({ error: "Invalid transaction hash format." });
    }

    const { data: used } = await supabase
      .from("journal_subscriptions")
      .select("id")
      .eq("tx_hash", txHash)
      .maybeSingle();

    if (used) return res.status(409).json({ error: "Transaction hash already used." });

    const MASTERCLASS_PRICE = 7.0;
    const since = Date.now() - 24 * 60 * 60 * 1000;
    const check = await verifyPayment({ chain, txHash, amount: MASTERCLASS_PRICE, since });

    if (!check.ok) return res.status(422).json({ error: check.reason || "Payment verification failed." });

    const status = check.status || "pending";

    const { error: insertErr } = await supabase
      .from("journal_subscriptions")
      .insert({
        user_id: userId,
        status: status,
        amount_usdt: MASTERCLASS_PRICE,
        chain,
        tx_hash: txHash,
        payment_screenshot: paymentScreenshot,
        paid_at: new Date().toISOString(),
      });

    if (insertErr) throw insertErr;

    await sendRevenueAlert({
      type: "Masterclass Access",
      userId,
      amount: MASTERCLASS_PRICE,
      chain,
      txHash,
      screenshot: paymentScreenshot,
    });

    if (status === "pending") {
      res.json({ success: true, message: "Payment submitted! Awaiting admin approval." });
    } else {
      res.json({ success: true, message: "Payment verified!" });
    }
  } catch (error) {
    console.error("Masterclass verification failed:", error);
    res.status(500).json({ error: "Verification failed. Please try again." });
  }
});

// 5. Admin route to fetch pending payments
router.get("/admin/pending", requireAuth, requireAdmin, async (req, res) => {
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

// 6. Start Trial
router.post("/start-trial", requireAuth, async (req, res) => {
  const userId = req.user?.id || req.body?.userId || req.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("account_status, trial_ends_at")
      .eq("id", userId)
      .single();

    if (error || !profile) {
       return res.status(404).json({ error: "Profile not found." });
    }

    if (profile.account_status === "expired") {
      return res.status(403).json({ error: "Your free trial has already expired." });
    }

    if (profile.trial_ends_at) {
      const endsAt = new Date(profile.trial_ends_at).getTime();
      if (endsAt < Date.now()) {
         // Auto expire it if not already expired
         await supabase.from("profiles").update({ account_status: "expired" }).eq("id", userId);
         return res.status(403).json({ error: "Your free trial has expired." });
      }
    }

    // Trial is valid and active, just return success so they can enter!
    res.json({ success: true, message: "Trial active" });
  } catch (error) {
    console.error("Start trial error:", error);
    res.status(500).json({ error: "Failed to start trial" });
  }
});

import { verifyCryptoPayment } from "../controllers/paymentController.js";
router.post("/verify-crypto", requireAuth, verifyCryptoPayment);
export default router;
