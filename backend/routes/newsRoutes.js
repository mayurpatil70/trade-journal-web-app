// backend/routes/newsRoutes.js
import express from "express";
import { getEconomicNews } from "../controllers/newsController.js";

const router = express.Router();

router.get("/", getEconomicNews);

export default router;
