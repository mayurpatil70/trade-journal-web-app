import { saveSession } from "../api/axios";
import { getCachedAccessStatus } from "../utils/subscriptionCache";

export function isOnboardingCompleted(userId = localStorage.getItem("userId")) {
  return (
    localStorage.getItem(`onboarding_completed_${userId}`) === "true" ||
    localStorage.getItem("onboarding_completed") === "true"
  );
}

function markOnboarded(userId) {
  localStorage.setItem(`onboarding_completed_${userId}`, "true");
  localStorage.setItem("onboarding_completed", "true");
  localStorage.setItem(`rules_onboarded_${userId}`, "true");
  localStorage.setItem("rules_onboarded", "true");
}

// Where a signed-in user goes after the Discord step: paywall -> onboarding -> dashboard.
export function nextStepAfterDiscord({ hasPaid, isAdmin } = {}) {
  if (!hasPaid && !isAdmin) return "/paywall";
  return isOnboardingCompleted() ? "/dashboard" : "/onboarding";
}

export async function resolveNextStepAfterDiscord() {
  try {
    return nextStepAfterDiscord(await getCachedAccessStatus(true));
  } catch {
    return "/paywall";
  }
}

// Where a user goes after paying or starting a trial.
export const nextStepAfterPaywall = () =>
  isOnboardingCompleted() ? "/dashboard" : "/onboarding";

// Stores the session from an auth response and returns where the user should go next.
export function completeSignIn(data, { email, deviceId, isNewAccount = false }) {
  const userId = data.userId || data.user?.id || data.id;
  saveSession({
    userId,
    token: data.authToken,
    email: data.email || email,
    sessionId: data.sessionId,
    deviceId: data.deviceId || deviceId,
  });
  if (data.username) localStorage.setItem("fn_username", data.username);
  else localStorage.removeItem("fn_username");

  if (!isNewAccount && data.onboarded) markOnboarded(userId);
  const onboardingCompleted = !isNewAccount && isOnboardingCompleted(userId);

  if (onboardingCompleted) {
    localStorage.removeItem("fn_new_signup");
    localStorage.setItem(`fn_ib_popup_dismissed_${userId}`, "true");
    localStorage.setItem("winpro_ib_dismissed", "true");
    localStorage.setItem(`fn_dashboard_visited_${userId}`, "true");
  } else {
    // New user: the IB card and welcome popups show on their first dashboard visit.
    localStorage.setItem("fn_new_signup", "true");
    localStorage.removeItem("winpro_ib_dismissed");
    localStorage.removeItem(`fn_ib_popup_dismissed_${userId}`);
    localStorage.removeItem(`fn_dashboard_visited_${userId}`);
    if (isNewAccount) {
      localStorage.removeItem("onboarding_completed");
      localStorage.removeItem("rules_onboarded");
      localStorage.removeItem("discord_skipped");
    }
  }

  const discordSkipped = localStorage.getItem("discord_skipped") === "true";
  if (!data.discordVerified && !discordSkipped) return "/link-discord";
  if (!data.hasPaid && !data.isAdmin) return "/paywall";
  return onboardingCompleted ? "/dashboard" : "/onboarding";
}
