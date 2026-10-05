import express from "express";
import { upload } from "../middlewares/upload.js"; import { saveJournal, getJournal } from "../controllers/journalController.js";

const router = express.Router();

router.post("/", upload.fields([{ name: "pre_market_image", maxCount: 1 }, { name: "post_market_image", maxCount: 1 }]), saveJournal);
router.get("/", getJournal);

export default router;
