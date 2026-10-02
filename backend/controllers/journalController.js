import { supabase } from "../config/supabase.js";

export const saveJournal = async (req, res) => {
  try {
    const { userId, date, pre_market_note, post_market_note } = req.body;

    if (!userId || !date) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const { data, error } = await supabase
      .from("daily_journals")
      .upsert(
        { user_id: userId, date, pre_market_note, post_market_note },
        { onConflict: 'user_id, date' }
      )
      .select();

    if (error) throw error;
    res.status(200).json({ success: true, data: data[0] });
  } catch (error) {
    console.error("Save Journal Error:", error);
    res.status(500).json({ success: false, error: "Failed to save journal." });
  }
};

export const getJournal = async (req, res) => {
  try {
    const { userId, date } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, error: "Missing userId" });
    }

    let query = supabase.from("daily_journals").select("*").eq("user_id", userId);
    if (date) {
      query = query.eq("date", date);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Get Journal Error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch journal." });
  }
};
