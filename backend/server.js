// backend/server.js
import express from "express";
import cors from "cors";
import "dotenv/config";
import { requestLogin, verifyLogin } from "./controllers/authController.js";
import { handleDiscordCallback } from "./controllers/discordController.js";

const app = express();

// Middleware
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Authentication Routes (Supabase + Resend)
app.post("/api/auth/login", requestLogin);
app.post("/api/auth/verify", verifyLogin);

// Discord OAuth2 Routes
app.get("/api/discord/callback", handleDiscordCallback);

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "Backend is running correctly." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend API running on http://localhost:${PORT}`);
});
