import { createClient } from "@supabase/supabase-js";
import { v2 as cloudinary } from "cloudinary";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export const uploadKycDocuments = async (req, res) => {
  try {
    const { userId } = req.body;
    const files = req.files; // Expected array from multer (Front & Back)

    if (!userId || !files || files.length < 2) {
      return res.status(400).json({ error: "User ID and both document sides (Front and Back) are required." });
    }

    // Helper to upload buffer to Cloudinary
    const uploadToCloudinary = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "forex_notes_kyc" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );
        stream.end(fileBuffer);
      });
    };

    const frontUrl = await uploadToCloudinary(files[0].buffer);
    const backUrl = await uploadToCloudinary(files[1].buffer);

    // Update Supabase user record with KYC documents and pending status
    const { error: dbError } = await supabase
      .from("users")
      .update({
        kyc_front_url: frontUrl,
        kyc_back_url: backUrl,
        kyc_status: "pending"
      })
      .eq("id", userId);

    if (dbError) throw dbError;

    return.status(200).json({
      success: true,
      message: "KYC documents uploaded successfully.",
      frontUrl,
      backUrl
    });
  } catch (error) {
    console.error("KYC Upload Error:", error);
    return.status(500).json({ error: "Failed to process KYC upload." });
  }
};