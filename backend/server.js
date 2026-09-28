// backend/server.js
import express from "express";
import cors from "cors";
import "dotenv/config";

import authRoutes from "./routes/authRoutes.js";
import discordRoutes from "./routes/discordRoutes.js";
import newsRoutes from "./routes/newsRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import tradeRoutes from "./routes/tradeRoutes.js"; // <-- NEW

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  "http://localhost:5173",
  "https://forexnotes.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        return callback(
          new Error("CORS policy violation: This origin is not allowed."),
          false,
        );
      }
      return callback(null, true);
    },
    credentials: true,
  }),
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/discord", discordRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/trades", tradeRoutes); // <-- NEW

app.get("/", (req, res) =>
  res.json({ message: "Forex Notes API is running!" }),
);
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
