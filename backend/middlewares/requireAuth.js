import { verifyAuthToken } from "../utils/authToken.js";

export function requireAuth(req, res, next) {
  if (!process.env.AUTH_SECRET) {
    console.error("[Auth] AUTH_SECRET is not set");
    return res.status(503).json({ error: "Authentication is not configured." });
  }
  const header = req.headers.authorization || "";
  const userId = verifyAuthToken(header.startsWith("Bearer ") ? header.slice(7) : "");
  if (!userId) return res.status(401).json({ error: "Please log in again." });

  req.userId = userId;
  if (req.body && typeof req.body === "object") req.body.userId = userId;
  next();
}
