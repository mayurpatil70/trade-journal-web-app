// backend/routes/aiRoutes.js
import express from "express";
import { upload } from "../middlewares/upload.js";
import {
  generateNewsInsight,
  analyzeChart,
  chatWithCoach,
  getEdgeInsights, // <-- 1. Import the new function
} from "../controllers/aiController.js";

const router = express.Router();

router.post("/news-insight", generateNewsInsight);
router.post("/chat", chatWithCoach);
router.post("/import", upload.single("image"), analyzeChart);
router.post("/analyze-chart", upload.single("image"), analyzeChart);

// 2. NEW: Add the edge insights route
router.get("/edge", getEdgeInsights);

export default router;
