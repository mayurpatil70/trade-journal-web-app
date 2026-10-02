// backend/routes/tradeRoutes.js
import express from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { upload } from "../middlewares/upload.js";
import {
  createTrade,
  getTrades,
  deleteAllTrades,
  exportTrades,
} from "../controllers/tradeController.js";

const router = express.Router();

router.use(requireAuth);

// Accepts up to 3 trade chart screenshots
router.post("/", upload.array("images", 3), createTrade);

// Dashboard & history trade listing
router.get("/", getTrades);

// Danger Zone: wipe all user trades
router.delete("/all", deleteAllTrades);

// Export to CSV, Excel, DOC, or PDF
router.get("/export", exportTrades);

export default router;
