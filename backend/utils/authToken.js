import crypto from "crypto";

const TTL_MS = 30 * 24 * 60 * 60 * 1000;

const b64 = (buf) => Buffer.from(buf).toString("base64url");
const sign = (data, secret) => crypto.createHmac("sha256", secret).update(data).digest("base64url");

export function signAuthToken(userId, { secret = process.env.AUTH_SECRET, now = Date.now() } = {}) {
  if (!secret) return null;
  const payload = b64(JSON.stringify({ sub: String(userId), exp: now + TTL_MS }));
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyAuthToken(token, { secret = process.env.AUTH_SECRET, now = Date.now() } = {}) {
  if (!secret || typeof token !== "string") return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = Buffer.from(sign(payload, secret));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return null;

  try {
    const { sub, exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    return sub && exp > now ? sub : null;
  } catch {
    return null;
  }
}
