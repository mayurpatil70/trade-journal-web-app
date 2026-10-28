// backend/routes/authRoutes.js
import express from "express";
import multer from "multer";
import {
  requestLogin,
  verifyLogin,
  uploadAvatar,
  saveOnboardingProfile,
  getProfile,
  updateProfile,
  updateChecklist,
} from "../controllers/authController.js";
import { rateLimit } from "../middlewares/rateLimit.js";

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  storage: multer.memoryStorage(),
});

const router = express.Router();

router.post("/login", rateLimit({ windowMs: 15 * 60_000, max: 5 }), requestLogin);
router.post("/verify", rateLimit({ windowMs: 15 * 60_000, max: 20 }), verifyLogin);
router.post("/avatar", upload.single("avatar"), uploadAvatar);
router.post("/onboarding-profile", saveOnboardingProfile);
router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.post("/checklist", updateChecklist);

export default router;
