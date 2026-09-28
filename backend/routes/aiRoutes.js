// backend/routes/aiRoutes.js
import express from 'express';
import { generateNewsInsight } from '../controllers/aiController.js';

const router = express.Router();

router.post('/news-insight', generateNewsInsight);

export default router;