// backend/middlewares/requireAlgoAccess.js
import { supabase } from '../config/supabase.js';
import { isAdminEmail } from '../config/admin.js';

export async function requireAlgoAccess(req, res, next) {
  try {
    const userId = req.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Please log in to access the VIP Algo.' });
    }

    // 1. Fetch user email
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .maybeSingle();

    if (userErr) throw userErr;

    // 2. ADMIN BYPASS: noballondesk@gmail.com bypasses all paywalls
    if (isAdminEmail(user?.email)) {
      req.isAdmin = true;
      req.hasAlgoAccess = true;
      return next();
    }

    // 3. Check profile for active subscription
    const { data: profile } = await supabase
      .from('profiles')
      .select('algo_active, algo_expires_at')
      .eq('id', userId)
      .maybeSingle();

    const now = new Date();
    const isProfileActive =
      profile?.algo_active === true &&
      profile?.algo_expires_at &&
      new Date(profile.algo_expires_at) > now;

    if (isProfileActive) {
      req.hasAlgoAccess = true;
      return next();
    }

    // 4. Check active paid record in algo_subscriptions
    const { data: sub } = await supabase
      .from('algo_subscriptions')
      .select('id, expires_at, status')
      .eq('user_id', userId)
      .eq('status', 'paid')
      .gt('expires_at', now.toISOString())
      .limit(1)
      .maybeSingle();

    if (sub) {
      req.hasAlgoAccess = true;
      return next();
    }

    // Unpaid user - gate access
    return res.status(403).json({
      error: 'VIP Algo Subscription required ($169/month).',
      requiresPaywall: true,
      price: 169,
    });
  } catch (error) {
    console.error('[requireAlgoAccess] error:', error);
    res.status(500).json({ error: 'Failed to verify VIP Algo access.' });
  }
}
