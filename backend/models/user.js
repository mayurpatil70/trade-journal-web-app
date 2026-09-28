// backend/models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    loginToken: String,
    tokenExpires: Date,
    discordVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
