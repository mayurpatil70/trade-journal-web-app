import crypto from "crypto";

const ALGO = "aes-256-gcm";

export function getEncryptionKey(raw = process.env.ENCRYPTION_KEY) {
  if (!raw) throw new Error("ENCRYPTION_KEY is not configured.");
  const key = /^[0-9a-fA-F]{64}$/.test(raw) ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("ENCRYPTION_KEY must be 32 bytes (64 hex chars or base64).");
  return key;
}

export const encryptionReady = () => {
  try {
    getEncryptionKey();
    return true;
  } catch {
    return false;
  }
};

export function encryptSecret(plain, key = getEncryptionKey()) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  return { enc: enc.toString("base64"), iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64") };
}

export function decryptSecret({ enc, iv, tag }, key = getEncryptionKey()) {
  const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(enc, "base64")), decipher.final()]).toString("utf8");
}

export function maskKey(key = "") {
  const s = String(key);
  return s.length <= 8 ? "****" : `${s.slice(0, 4)}…${s.slice(-4)}`;
}

export const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
export const generateBridgeToken = () => `tjb_${crypto.randomBytes(24).toString("hex")}`;
