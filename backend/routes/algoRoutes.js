// backend/routes/algoRoutes.js
import express from 'express';
import { requireAuth } from '../middlewares/requireAuth.js';
import { requireAdmin } from '../middlewares/requireAdmin.js';
import { requireAlgoAccess } from '../middlewares/requireAlgoAccess.js';
import {
  getAlgoStatus,
  verifyAlgoPayment,
  adminGetAlgoSubscribers,
  adminUpdateAlgoAccess,
  adminTestWhitelist,
  getAlgoSignals,
} from '../controllers/algoController.js';

const router = express.Router();

// 1. User & Admin Algo Status Check
router.get('/status', requireAuth, getAlgoStatus);

// 2. User $169 BEP-20 USDT Payment Verification
router.post('/verify-crypto', requireAuth, verifyAlgoPayment);

// 3. Admin: Subscriber Management & Invite Queue
router.get('/admin/subscribers', requireAuth, requireAdmin, adminGetAlgoSubscribers);
router.patch('/admin/access/:id', requireAuth, requireAdmin, adminUpdateAlgoAccess);

// 4. Admin / Subscribed Architecture B Automated Whitelisting Test
router.post('/admin/test-whitelist', requireAuth, requireAlgoAccess, adminTestWhitelist);

// 5. Architecture C & In-House Server Signal Engine ($0/mo) - Gated by $169 Paywall
router.get('/engine/signals', requireAuth, requireAlgoAccess, getAlgoSignals);

export default router;
