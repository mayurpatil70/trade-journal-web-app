// backend/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";

// Import ALL Routes
import aiRoutes from "./routes/aiRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import discordRoutes from "./routes/discordRoutes.js";
import exportRoutes from "./routes/exportRoutes.js";
import kycRoutes from "./routes/kycRoutes.js";
import newsRoutes from "./routes/newsRoutes.js";
import tradeRoutes from "./routes/tradeRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

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

// Mount ALL Routes
app.use("/api/ai", aiRoutes);
app.use("/api/auth", authRoutes); // <-- This handles your /api/auth/login
app.use("/api/auth", kycRoutes); // <-- This handles your /api/auth/kyc
app.use("/api/discord", discordRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/trades", tradeRoutes);
app.use("/api/trades", exportRoutes); // <-- This handles your exports
app.use("/api/support", supportRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/admin", adminRoutes);

// Health Check Endpoint
app.get("/", (req, res) => {
  res
    .status(200)
    .json({ status: "Forex Notes Backend is running successfully!" });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
