import { supabase } from "../config/supabase.js";
import { uploadToCloudinary } from "../utils/cloudinary.js"; // Assume this is available like in tradeController

export const saveJournal = async (req, res) => {
  try {
    const { userId, date, pre_market_note, post_market_note } = req.body;

    if (!userId || !date) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    let pre_market_image = req.body.pre_market_image || null;
    let post_market_image = req.body.post_market_image || null;

    if (req.files) {
      if (req.files.pre_market_image) {
        pre_market_image = await uploadToCloudinary(req.files.pre_market_image[0].buffer);
      }
      if (req.files.post_market_image) {
        post_market_image = await uploadToCloudinary(req.files.post_market_image[0].buffer);
      }
    }

    // Build the payload dynamically to avoid overriding with nulls during upsert
    const payload = { user_id: userId, date };
    if (pre_market_note !== undefined) payload.pre_market_note = pre_market_note;
    if (post_market_note !== undefined) payload.post_market_note = post_market_note;
    if (pre_market_image) payload.pre_market_image = pre_market_image;
    if (post_market_image) payload.post_market_image = post_market_image;

    const { data, error } = await supabase
      .from("daily_journals")
      .upsert(payload, { onConflict: 'user_id, date' })
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
