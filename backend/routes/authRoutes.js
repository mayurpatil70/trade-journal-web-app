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
  logoutUser,
  getActiveSessions,
  revokeSessionById,
  revokeOtherSessions,
  revokeAllSessionsForUser,
} from "../controllers/authController.js";
import { rateLimit } from "../middlewares/rateLimit.js";
import { requireAuth } from "../middlewares/requireAuth.js";

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

// Session & Device Management Endpoints
router.post("/logout", requireAuth, logoutUser);
router.get("/sessions", requireAuth, getActiveSessions);
router.delete("/sessions/:sessionId", requireAuth, revokeSessionById);
router.post("/sessions/revoke-others", requireAuth, revokeOtherSessions);
router.post("/sessions/revoke-all", requireAuth, revokeAllSessionsForUser);

export default router;
