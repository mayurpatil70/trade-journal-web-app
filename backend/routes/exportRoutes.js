import express from "express";
import { exportUserData } from "../controllers/exportController.js";

const router = express.Router();

// GET /api/trades/export
router.get("/export", exportUserData);

// ENSURE THIS LINE EXISTS
export default router;
