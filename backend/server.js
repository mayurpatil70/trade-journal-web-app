// backend/server.js
import express from "express";
import cors from "cors";
import "dotenv/config";

// Import your route files
import authRoutes from "./routes/authRoutes.js";
import discordRoutes from "./routes/discordRoutes.js";
import newsRoutes from "./routes/newsRoutes.js"; // <-- NEW

const app = express();
const PORT = process.env.PORT || 3000;

// Allow local frontend AND your Vercel frontend URL
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

// Mount the API routes
app.use("/api/auth", authRoutes);
app.use("/api/discord", discordRoutes);
app.use("/api/news", newsRoutes); // <-- NEW

// Health check route
app.get("/", (req, res) => {
  res.json({ message: "Forex Notes API is running!" });
});

// Keep the server alive and listening
app.listen(PORT, () => {
  console.log(`Backend API actively running on http://localhost:${PORT}`);
});
