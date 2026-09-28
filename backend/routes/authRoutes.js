// backend/routes/authRoutes.js
import express from "express";
import { requestLogin, verifyLogin } from "../controllers/authController.js";

const router = express.Router();

router.post("/login", requestLogin);
router.post("/verify", verifyLogin);

export default router;
