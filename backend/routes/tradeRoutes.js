// backend/routes/tradeRoutes.js
import express from "express";
import multer from "multer";
import { createTrade, getTrades } from "../controllers/tradeController.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/", upload.array("images", 3), createTrade);
router.get("/", getTrades); // <-- NEW GET ROUTE

export default router;
