// backend/routes/aiRoutes.js
import express from "express";
import { upload } from "../middlewares/upload.js";
import {
  generateNewsInsight,
  analyzeChart,
} from "../controllers/aiController.js";

const router = express.Router();

router.post("/news-insight", generateNewsInsight);
router.post("/analyze-chart", upload.single("image"), analyzeChart);

export default router;
