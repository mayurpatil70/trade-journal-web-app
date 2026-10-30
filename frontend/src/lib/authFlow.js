import { saveSession } from "../api/axios";

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

  const onboardingCompleted =
    !isNewAccount &&
    (localStorage.getItem(`onboarding_completed_${userId}`) === "true" ||
      localStorage.getItem("onboarding_completed") === "true");

  localStorage.removeItem("fn_new_signup");
  if (onboardingCompleted) {
    localStorage.setItem(`fn_ib_popup_dismissed_${userId}`, "true");
    localStorage.setItem("winpro_ib_dismissed", "true");
    localStorage.setItem(`fn_dashboard_visited_${userId}`, "true");
  }

  const discordSkipped = localStorage.getItem("discord_skipped") === "true";
  if (!data.discordVerified && !discordSkipped) return "/link-discord";
  if (!data.hasPaid) return "/paywall";
  return onboardingCompleted ? "/dashboard" : "/onboarding";
}
