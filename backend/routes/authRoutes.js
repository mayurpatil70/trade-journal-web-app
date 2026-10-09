// backend/routes/authRoutes.js
import express from "express";
import { requestLogin, verifyLogin } from "../controllers/authController.js";
import { rateLimit } from "../middlewares/rateLimit.js";

const router = express.Router();

router.post("/login", rateLimit({ windowMs: 15 * 60_000, max: 5 }), requestLogin);
router.post("/verify", rateLimit({ windowMs: 15 * 60_000, max: 20 }), verifyLogin);

export default router;
