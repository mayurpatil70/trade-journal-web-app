// frontend/src/utils/navigationState.js

// Record the path when this browser runtime session was initially loaded
export const initialEntryPath = typeof window !== 'undefined' ? window.location.pathname : '';

// Check if this initial page boot was a physical browser reload/refresh (F5, Cmd+R, reload button)
export const isPageRefresh = () => {
  try {
    const navEntries = performance.getEntriesByType?.("navigation");
    if (navEntries && navEntries.length > 0) {
      return navEntries[0].type === "reload";
    }
    if (window.performance?.navigation?.type === 1) return true;
  } catch (_) {}
  return false;
};

// Track whether any in-app SPA client navigation has occurred
let hasNavigatedInApp = false;
let hasShown3DLoaderOnce = false;

export const markInAppNavigation = () => {
  hasNavigatedInApp = true;
};

export const hasUserNavigatedInApp = () => {
  return hasNavigatedInApp;
};

export const mark3DLoaderShown = () => {
  hasShown3DLoaderOnce = true;
};

export const shouldShow3DLoaderForDashboard = () => {
  // If the user already navigated within the app (e.g. from Paywall, Login, Sidebar, etc.), NEVER show 3D logo
  if (hasNavigatedInApp) return false;

  // If the initial entry path when page loaded wasn't /dashboard (e.g. loaded on /paywall or /login), NEVER show 3D logo
  if (initialEntryPath !== '/dashboard') return false;

  // If already shown once during this page load, don't show again
  if (hasShown3DLoaderOnce) return false;

  // Only show on page refresh on /dashboard (or initial direct landing on /dashboard)
  return isPageRefresh() || initialEntryPath === '/dashboard';
};
