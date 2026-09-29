import express from "express";
import { exportUserData } from "../controllers/exportController.js";

const router = express.Router();

// GET /api/trades/export?userId=...&format=csv
router.get("/export", exportUserData);

export default router;
