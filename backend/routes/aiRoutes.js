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

const imageUpload = (req, res, next) =>
  upload.single("image")(req, res, (err) => {
    if (!err) return next();
    const tooBig = err.code === "LIMIT_FILE_SIZE";
    res.status(tooBig ? 413 : 400).json({
      error: tooBig ? "Image is too large (max 5 MB)." : err.message || "Invalid upload.",
    });
  });
const llmLimit = rateLimit({ windowMs: 60_000, max: 12 });

router.use(requireAuth);

router.post("/news-insight", llmLimit, generateNewsInsight);
router.post("/chat", llmLimit, imageUpload, chatWithCoach);
router.post("/chat/stream", llmLimit, imageUpload, streamCoachChat);
router.get("/chat/history", getChatHistory);
router.delete("/chat/history", clearChatHistory);
router.post("/import", llmLimit, upload.single("image"), analyzeChart);
router.post("/analyze-chart", llmLimit, upload.single("image"), analyzeChart);

router.get("/edge", getEdgeInsights);

export default router;
