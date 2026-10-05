import express from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { supabase } from "../config/supabase.js";

const router = express.Router();

router.get("/profile", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", req.user.id)
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
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("wallet_balance")
      .eq("id", req.user.id)
      .single();

    if (!profile || profile.wallet_balance < 25) {
      return res.status(400).json({ error: "Minimum $25 required" });
    }

    const { error: insertErr } = await supabase.from('withdrawals').insert([{
      user_id: req.user.id,
      amount: profile.wallet_balance,
      wallet_address: withdrawAddress
    }]);

    if (insertErr) throw insertErr;

    await supabase.from('profiles').update({ wallet_balance: 0 }).eq('id', req.user.id);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to process withdrawal" });
  }
});

export default router;
