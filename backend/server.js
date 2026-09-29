// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import Routes
import discordRoutes from "./routes/discordRoutes.js";
import kycRoutes from "./routes/kycRoutes.js";
import exportRoutes from "./routes/exportRoutes.js";
// (Assuming you have other route imports like authRoutes, tradeRoutes, etc. here)

const app = express();

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "https://forexnotes.vercel.app"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount Routes
app.use("/api/discord", discordRoutes);
app.use("/api/auth", kycRoutes); // Mounts KYC upload route -> /api/auth/kyc
app.use("/api/trades", exportRoutes); // Mounts Export trade data route -> /api/trades/export

// Health Check Endpoint
app.get("/", (req, res) => {
  res
    .status(200)
    .json({ status: "Forex Notes Backend is running successfully!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
