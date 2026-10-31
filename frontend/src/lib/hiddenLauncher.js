const DAY_MS = 24 * 60 * 60 * 1000;

export function isLauncherHidden(key) {
  try {
    const until = Number(localStorage.getItem(key));
    return until > Date.now();
  } catch {
    return false;
  }
}

export function hideLauncher(key) {
  try { localStorage.setItem(key, String(Date.now() + DAY_MS)); } catch { /* storage unavailable */ }
}
