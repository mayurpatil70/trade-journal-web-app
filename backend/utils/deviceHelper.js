// backend/utils/deviceHelper.js

/**
 * Parses user-agent header into a clean, human-readable device name
 * e.g. "Windows · Chrome", "iPhone · Safari", "macOS · Edge"
 */
export function parseDeviceName(userAgent = "") {
  if (!userAgent || typeof userAgent !== "string") {
    return "Unknown Device";
  }

  let os = "Desktop";
  let browser = "Web";

  // Operating System / Device Detection
  if (/iPad/.test(userAgent)) {
    os = "iPad";
  } else if (/iPhone|iPod/.test(userAgent)) {
    os = "iPhone";
  } else if (/Android/.test(userAgent)) {
    os = /Mobile/.test(userAgent) ? "Android Phone" : "Android Tablet";
  } else if (/Windows NT 10.0|Windows NT 11.0|Windows/.test(userAgent)) {
    os = "Windows";
  } else if (/Macintosh|Mac OS X/.test(userAgent)) {
    os = "macOS";
  } else if (/Linux/.test(userAgent)) {
    os = "Linux";
  }

  // Browser Detection (order matters because Edge/Chrome UA contains Safari/Chrome)
  if (/Edg\//i.test(userAgent)) {
    browser = "Edge";
  } else if (/OPR\/|Opera/i.test(userAgent)) {
    browser = "Opera";
  } else if (/Chrome\//i.test(userAgent)) {
    browser = "Chrome";
  } else if (/Safari\//i.test(userAgent)) {
    browser = "Safari";
  } else if (/Firefox\//i.test(userAgent)) {
    browser = "Firefox";
  }

  return `${os} · ${browser}`;
}

/**
 * Extracts the real client IP address from request headers or socket
 */
export function getClientIp(req) {
  if (!req) return "127.0.0.1";
  const forwarded = req.headers?.["x-forwarded-for"];
  if (forwarded && typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return (
    req.headers?.["x-real-ip"] ||
    req.socket?.remoteAddress ||
    req.ip ||
    "127.0.0.1"
  );
}
