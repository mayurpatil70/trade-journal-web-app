import express from "express";
import multer from "multer";
import { uploadKycDocuments } from "../controllers/kycController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/auth/kyc
router.post("/kyc", upload.array("documents", 2), uploadKycDocuments);

// THIS IS THE LINE THAT FIXES YOUR ERROR
export default router;
