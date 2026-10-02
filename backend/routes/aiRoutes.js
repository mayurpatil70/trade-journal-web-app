// backend/routes/aiRoutes.js
import express from "express";
import { upload } from "../middlewares/upload.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { rateLimit } from "../middlewares/rateLimit.js";
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
const llmLimit = rateLimit({ windowMs: 60_000, max: 12 });

router.use(requireAuth);

router.post("/news-insight", llmLimit, generateNewsInsight);
router.post("/chat", llmLimit, upload.single("image"), chatWithCoach);
router.post("/chat/stream", llmLimit, upload.single("image"), streamCoachChat);
router.get("/chat/history", getChatHistory);
router.delete("/chat/history", clearChatHistory);
router.post("/import", llmLimit, upload.single("image"), analyzeChart);
router.post("/analyze-chart", llmLimit, upload.single("image"), analyzeChart);

router.get("/edge", getEdgeInsights);

export default router;
