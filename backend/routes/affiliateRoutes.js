import express from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { supabase } from "../config/supabase.js";

const router = express.Router();

router.get("/profile", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      // If table/row doesn't exist, handle it gracefully
      if (error.code === 'PGRST116') {
         return res.json({ profile: { wallet_balance: 0, referral_code: 'NEW_USER' } });
      }
      throw error;
    }
    res.json({ profile: data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

router.post("/withdraw", requireAuth, async (req, res) => {
  const { withdrawAddress } = req.body || {};
  const userId = req.userId;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  if (!withdrawAddress || typeof withdrawAddress !== "string" || withdrawAddress.trim().length < 20) {
    return res.status(400).json({ error: "A valid BEP20 USDT withdrawal wallet address is required." });
  }

  const cleanAddress = withdrawAddress.trim();

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("wallet_balance")
      .eq("id", userId)
      .single();

    const currentBalance = Number(profile?.wallet_balance || 0);
    if (!profile || currentBalance < 25) {
      return res.status(400).json({ error: "Minimum withdrawal amount is $25 USDT." });
    }

    // Atomic deduction: only deducts if wallet_balance matches to prevent concurrent double-spend race conditions
    const { data: updatedProfile, error: updateErr } = await supabase
      .from("profiles")
      .update({ wallet_balance: 0 })
      .eq("id", userId)
      .gte("wallet_balance", 25)
      .select()
      .maybeSingle();

    if (updateErr || !updatedProfile) {
      return res.status(409).json({ error: "Withdrawal conflict or balance already processed." });
    }

    const { error: insertErr } = await supabase.from("withdrawals").insert([{
      user_id: userId,
      amount: currentBalance,
      wallet_address: cleanAddress,
      status: "pending",
      created_at: new Date().toISOString(),
    }]);

    if (insertErr) {
      // Revert balance if record insertion failed
      await supabase.from("profiles").update({ wallet_balance: currentBalance }).eq("id", userId);
      throw insertErr;
    }

    res.json({ success: true, message: `Withdrawal request for $${currentBalance} USDT submitted.` });
  } catch (error) {
    console.error("Withdrawal processing error:", error);
    res.status(500).json({ error: "Failed to process withdrawal request." });
  }
});

export default router;
