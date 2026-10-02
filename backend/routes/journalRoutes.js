import express from "express";
import { saveJournal, getJournal } from "../controllers/journalController.js";

const router = express.Router();

router.post("/", saveJournal);
router.get("/", getJournal);

export default router;
