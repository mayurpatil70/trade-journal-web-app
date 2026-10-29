// backend/middlewares/requireAuth.js
import { verifyAuthTokenFull } from "../utils/authToken.js";
import { validateSession } from "../services/sessionService.js";

export function requireAuth(req, res, next) {
  if (!process.env.AUTH_SECRET) {
    console.error("[Auth] AUTH_SECRET is not set");
    return res.status(503).json({ error: "Authentication is not configured." });
  }

  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const decoded = verifyAuthTokenFull(token);

  if (!decoded || !decoded.userId) {
    return res.status(401).json({ error: "Please log in again." });
  }

  const { userId, sessionId, deviceId } = decoded;
  req.userId = userId;
  req.sessionId = sessionId || null;
  req.deviceId = deviceId || req.headers["x-device-id"] || null;
  if (req.body && typeof req.body === "object") req.body.userId = userId;

  // If token includes a sessionId, validate session persistence & subscription in DB/Cache
  if (sessionId) {
    return Promise.resolve(validateSession(sessionId, userId))
      .then((status) => {
        if (!status || !status.valid) {
          if (status?.reason === "SUBSCRIPTION_EXPIRED") {
            return res.status(401).json({
              error: "SUBSCRIPTION_EXPIRED",
              message: "Your subscription or trial has expired. Please renew your plan.",
            });
          }
          return res.status(401).json({
            error: "SESSION_EXPIRED",
            message: "Session expired or logged out from this device. Please log in again.",
          });
        }
        next();
      })
      .catch((err) => {
        console.warn("[Auth] Session validation error, failing open to signed token:", err.message);
        next();
      });
  }

  // Tokens without sessionId (legacy or direct tests) are verified by signature
  return next();
}
