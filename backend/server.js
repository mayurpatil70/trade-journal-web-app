// backend/server.js
import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";

// Import Keep-Alive Cron
import { startKeepAliveCron } from "./utils/keepAlive.js";

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
import socialRoutes from "./routes/socialRoutes.js";
import pushRoutes from "./routes/pushRoutes.js";
import { initSocket } from "./socket/index.js";

const app = express();

// Trust reverse proxies (Render, Cloudflare, Vercel) for accurate client IP in rate limiting
app.set("trust proxy", 1);

// Enforce HTTPS redirection in production (behind Cloudflare, Render, Vercel reverse proxies)
app.use((req, res, next) => {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const isHttp = forwardedProto === "http";
  const isLocalhost =
    req.hostname === "localhost" ||
    req.hostname === "127.0.0.1" ||
    req.hostname.startsWith("192.168.");

  if (isHttp && !isLocalhost && req.headers.host) {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
});

// Hardened Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

// Middleware
const allowedOrigins = [
  "http://localhost:5173",
  "https://forexnotes.vercel.app",
  "https://www.forexnotes.in",
  "https://forexnotes.in",
  "capacitor://localhost",
  "http://localhost",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dedicated Health Check & Keep-Alive Endpoints
app.get(["/", "/api/health"], (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "Forex Notes Backend API",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

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
app.use("/api/social", socialRoutes);
app.use("/api/push", pushRoutes);

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err.type === "entity.too.large") return res.status(413).json({ error: "Request is too large." });
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Invalid request body." });
  console.error("[Server] Unhandled error:", err.message);
  res.status(err.status || 500).json({ error: "Something went wrong." });
});

// Start Server
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
initSocket(server, { allowedOrigins });
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  // Launch keep-alive cron job to prevent inactivity spin-downs on Render/cloud hosting
  startKeepAliveCron({ intervalMs: 10 * 60 * 1000, port: PORT });
});


