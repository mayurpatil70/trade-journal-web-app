// frontend/src/utils/planBadge.js

/**
 * Resolves the user's subscription or trial plan from database fields into
 * a standardized, design-engineered badge representation.
 * 
 * Supports:
 * - 24 Hour Trial
 * - 7 Days Trial
 * - 1 Month Pro Plan
 * - 1 Year Pro Plan
 * - Trial Expired / Free Plan
 *
 * @param {Object} profile - User profile object from Supabase / localStorage
 * @returns {Object} badge configuration object
 */
export function getPlanBadge(profile) {
  if (!profile) {
    return {
      label: "Free Plan",
      rawType: "free",
      badgeClass: "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border border-neutral-500/20",
      dotClass: "bg-neutral-400",
      isTrial: false,
      isPaid: false,
      isActive: false,
      expiresAt: null,
    };
  }

  const now = new Date();
  const subEnds = profile.subscription_ends_at ? new Date(profile.subscription_ends_at) : null;
  const trialEnds = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null;
  const createdAt = profile.createdAt || profile.created_at ? new Date(profile.createdAt || profile.created_at) : null;
  const currentPlan = (profile.current_plan || profile.plan || "").toLowerCase();
  const accountStatus = (profile.account_status || "").toLowerCase();

  const isSubActive = subEnds ? subEnds > now : false;
  const isTrialActive = trialEnds ? trialEnds > now : false;

  // Admin email detection
  const adminEmails = [
    "noballondesk@gmail.com",
    "akpatil51340@gmail.com",
    "noballondesk@gamil.com",
  ];
  const userEmail = (profile.email || localStorage.getItem("userEmail") || "").toLowerCase().trim();
  const isAdmin = profile.isAdmin || adminEmails.includes(userEmail);

  // 1. 1 YEAR PRO PLAN
  if (
    currentPlan === "yearly" ||
    (isSubActive && subEnds && createdAt && (subEnds.getTime() - createdAt.getTime() > 60 * 24 * 60 * 60 * 1000)) ||
    (isSubActive && currentPlan !== "monthly") ||
    (isAdmin && currentPlan === "yearly") ||
    (isAdmin && isSubActive)
  ) {
    return {
      label: "1 Year Pro Plan",
      shortLabel: "1Y Pro",
      rawType: "1_year_pro",
      badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shadow-xs shadow-emerald-500/10",
      dotClass: "bg-emerald-500 animate-pulse",
      isTrial: false,
      isPaid: true,
      isActive: true,
      expiresAt: subEnds,
    };
  }

  // 2. 1 MONTH PRO PLAN
  if (
    currentPlan === "monthly" ||
    isSubActive ||
    accountStatus === "active"
  ) {
    return {
      label: "1 Month Pro Plan",
      shortLabel: "1M Pro",
      rawType: "1_month_pro",
      badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs",
      dotClass: "bg-emerald-500",
      isTrial: false,
      isPaid: true,
      isActive: true,
      expiresAt: subEnds,
    };
  }

  // 3 & 4. TRIAL LOGIC (7 Days Trial vs 24 Hour Trial)
  if (isTrialActive || accountStatus === "trial") {
    if (trialEnds) {
      const remainingMs = trialEnds.getTime() - now.getTime();
      const totalTrialDurationMs = createdAt ? (trialEnds.getTime() - createdAt.getTime()) : remainingMs;
      // If duration is greater than 36 hours or remaining time is greater than 24h, it's a 7 Days Trial
      const is7Days = remainingMs > 24 * 60 * 60 * 1000 || totalTrialDurationMs > 36 * 60 * 60 * 1000;

      if (is7Days) {
        return {
          label: "7 Days Trial",
          shortLabel: "7D Trial",
          rawType: "7_days_trial",
          badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25 shadow-xs shadow-blue-500/10",
          dotClass: "bg-blue-500 animate-pulse",
          isTrial: true,
          isPaid: false,
          isActive: true,
          expiresAt: trialEnds,
        };
      }

      return {
        label: "24 Hour Trial",
        shortLabel: "24H Trial",
        rawType: "24_hour_trial",
        badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 shadow-xs shadow-amber-500/10",
        dotClass: "bg-amber-500 animate-pulse",
        isTrial: true,
        isPaid: false,
        isActive: true,
        expiresAt: trialEnds,
      };
    }

    // Trial active without explicit end date
    return {
      label: "24 Hour Trial",
      shortLabel: "24H Trial",
      rawType: "24_hour_trial",
      badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 shadow-xs",
      dotClass: "bg-amber-500",
      isTrial: true,
      isPaid: false,
      isActive: true,
      expiresAt: null,
    };
  }

  // 5. EXPIRED TRIAL
  if (accountStatus === "expired" || (trialEnds && trialEnds <= now)) {
    return {
      label: "Trial Expired",
      shortLabel: "Expired",
      rawType: "expired",
      badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
      dotClass: "bg-rose-500",
      isTrial: true,
      isPaid: false,
      isActive: false,
      expiresAt: null,
    };
  }

  // 6. DEFAULT FREE PLAN
  return {
    label: "Free Plan",
    shortLabel: "Free",
    rawType: "free",
    badgeClass: "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border border-neutral-500/20",
    dotClass: "bg-neutral-400",
    isTrial: false,
    isPaid: false,
    isActive: false,
    expiresAt: null,
  };
}
