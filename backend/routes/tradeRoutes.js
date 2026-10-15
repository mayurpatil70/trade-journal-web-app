// backend/routes/tradeRoutes.js
import express from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { upload } from "../middlewares/upload.js";
import {
  createTrade,
  getTrades,
  getTradeAnalytics,
  deleteAllTrades,
  deleteTrade,
  updateTrade,
  exportTrades,
} from "../controllers/tradeController.js";

const router = express.Router();

router.use(requireAuth);

// Accepts up to 3 trade chart screenshots
router.post("/", upload.array("images", 3), createTrade);

// Aggregated Trade Analytics Pipeline
router.get("/analytics", getTradeAnalytics);

// Dashboard & history trade listing
router.get("/", getTrades);

// Update single trade
router.put("/:id", upload.array("images", 3), updateTrade);

// Danger Zone: wipe all user trades
router.delete("/all", deleteAllTrades);

// Delete single trade
router.delete("/:id", deleteTrade);

// Export to CSV, Excel, DOC, or PDF
router.get("/export", exportTrades);

export default router;
