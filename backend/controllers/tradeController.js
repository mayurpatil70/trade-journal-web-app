// backend/controllers/tradeController.js
import { v2 as cloudinary } from "cloudinary";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to upload image buffer to Cloudinary
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "forex_notes_trades" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      },
    );
    stream.end(buffer);
  });
};

export const createTrade = async (req, res) => {
  try {
    const { userId, ...tradeData } = req.body;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "Unauthorized: Missing User ID" });
    }

    // Process Images if they exist
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadToCloudinary(file.buffer);
        imageUrls.push(url);
      }
    }

    // Prepare data for Supabase
    const insertData = {
      user_id: userId,
      date: tradeData.date,
      time: tradeData.time,
      asset: tradeData.asset,
      direction: tradeData.direction,
      session: tradeData.session,
      setup: tradeData.setup,
      entry: tradeData.entry ? parseFloat(tradeData.entry) : null,
      sl: tradeData.sl ? parseFloat(tradeData.sl) : null,
      tp: tradeData.tp ? parseFloat(tradeData.tp) : null,
      risk: tradeData.risk ? parseFloat(tradeData.risk) : null,
      result: tradeData.result,
      r_multiple: tradeData.rMultiple ? parseFloat(tradeData.rMultiple) : null,
      rule_break: tradeData.ruleBreak,
      reason: tradeData.reason,
      lesson: tradeData.lesson,
      emotion_before: tradeData.emotionBefore,
      emotion_after: tradeData.emotionAfter,
      psych_note: tradeData.psychNote,
      images: imageUrls,
    };

    const { data, error } = await supabase
      .from("trades")
      .insert([insertData])
      .select();

    if (error) throw error;

    res.status(201).json({ success: true, data: data[0] });
  } catch (error) {
    console.error("Trade Creation Error:", error);
    res.status(500).json({ success: false, error: "Failed to save trade." });
  }
};

// Add this below your existing createTrade function in backend/controllers/tradeController.js

export const getTrades = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "Unauthorized: Missing User ID" });
    }

    // Fetch trades from Supabase, newest first
    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .order("time", { ascending: false });

    if (error) throw error;

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Fetch Trades Error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch trades." });
  }
};
