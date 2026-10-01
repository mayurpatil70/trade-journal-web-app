// backend/routes/aiRoutes.js
import express from "express";
import { upload } from "../middlewares/upload.js";
import {
  generateNewsInsight,
  analyzeChart,
  chatWithCoach,
  streamCoachChat,
  getChatHistory,
  clearChatHistory,
  getEdgeInsights,
} from "../controllers/aiController.js";

const router = express.Router();

router.post("/news-insight", generateNewsInsight);
router.post("/chat", chatWithCoach);
router.post("/chat/stream", streamCoachChat);
router.get("/chat/history", getChatHistory);
router.delete("/chat/history", clearChatHistory);
router.post("/import", upload.single("image"), analyzeChart);
router.post("/analyze-chart", upload.single("image"), analyzeChart);

router.get("/edge", getEdgeInsights);

export default router;
