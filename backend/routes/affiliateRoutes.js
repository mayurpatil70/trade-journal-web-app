import express from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { supabase } from "../config/supabase.js";

const router = express.Router();

router.get("/profile", requireAuth, async (req, res) => {
  try {
    const userId = req.userId || req.body?.userId;
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
  const { withdrawAddress } = req.body;
  const userId = req.userId || req.body?.userId;
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("wallet_balance")
      .eq("id", userId)
      .single();

    if (!profile || profile.wallet_balance < 25) {
      return res.status(400).json({ error: "Minimum $25 required" });
    }

    const { error: insertErr } = await supabase.from('withdrawals').insert([{
      user_id: userId,
      amount: profile.wallet_balance,
      wallet_address: withdrawAddress
    }]);

    if (insertErr) throw insertErr;

    await supabase.from('profiles').update({ wallet_balance: 0 }).eq('id', userId);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to process withdrawal" });
  }
});

export default router;
