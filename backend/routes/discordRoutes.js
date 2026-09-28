// backend/routes/discordRoutes.js
import express from "express";
import { handleDiscordCallback } from "../controllers/discordController.js";

const router = express.Router();

router.get("/callback", handleDiscordCallback);

export default router;
