// backend/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";

// Import ALL Routes
import aiRoutes from "./routes/aiRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import discordRoutes from "./routes/discordRoutes.js";
import kycRoutes from "./routes/kycRoutes.js";
import newsRoutes from "./routes/newsRoutes.js";
import tradeRoutes from "./routes/tradeRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import journalRoutes from "./routes/journalRoutes.js";
import affiliateRoutes from "./routes/affiliateRoutes.js";
import botRoutes from "./trading-bot/routes.js";
import botHubRoutes from "./bot-hub/routes.js";
import marketRoutes from "./market/routes.js";

const app = express();

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://forexnotes.vercel.app",
      "https://www.forexnotes.in",
      "https://forexnotes.in",
      "capacitor://localhost",
      "http://localhost",
      "",
    ],
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
app.use("/api/support", supportRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/journals", journalRoutes);
app.use("/api/affiliate", affiliateRoutes);
app.use("/api/bot", botRoutes);
app.use("/api/bot-hub", botHubRoutes);
app.use("/api/market", marketRoutes);

// Health Check Endpoint
app.get("/", (req, res) => {
  res
    .status(200)
    .json({ status: "Forex Notes Backend is running successfully!" });
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err.type === "entity.too.large") return res.status(413).json({ error: "Request is too large." });
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Invalid request body." });
  console.error("[Server] Unhandled error:", err.message);
  res.status(err.status || 500).json({ error: "Something went wrong." });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

