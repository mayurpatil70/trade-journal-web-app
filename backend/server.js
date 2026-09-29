// backend/server.js
import "dotenv/config"; // <--- MUST BE LINE 1 before any route or controller imports
import express from "express";
import cors from "cors";

// Import Routes
import discordRoutes from "./routes/discordRoutes.js";
import kycRoutes from "./routes/kycRoutes.js";
import exportRoutes from "./routes/exportRoutes.js";

const app = express();

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
app.use("/api/auth", kycRoutes);
app.use("/api/trades", exportRoutes);

app.get("/", (req, res) => {
  res
    .status(200)
    .json({ status: "Forex Notes Backend is running successfully!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
