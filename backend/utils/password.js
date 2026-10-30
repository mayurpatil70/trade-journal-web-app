import crypto from "crypto";
import { promisify } from "util";

const scrypt = promisify(crypto.scrypt);
const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 64;

// Format: scrypt$N$r$p$saltB64$hashB64
export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password, salt, KEYLEN, { N, r: R, p: P });
  return ["scrypt", N, R, P, salt.toString("base64"), key.toString("base64")].join("$");
}

const DUMMY_HASH = await hashPassword(crypto.randomBytes(16).toString("hex"));

// Always runs a full scrypt so unknown accounts take as long as wrong passwords.
export async function verifyPassword(password, stored) {
  const parts = String(stored || DUMMY_HASH).split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, saltB64, hashB64] = parts;
  const expected = Buffer.from(hashB64, "base64");
  const key = await scrypt(password, Buffer.from(saltB64, "base64"), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });
  return Boolean(stored) && crypto.timingSafeEqual(key, expected);
}
