// Web Push (RFC 8291 payload encryption + RFC 8292 VAPID) using node:crypto only.
import crypto from "node:crypto";
import { supabase } from "../config/supabase.js";

const b64url = (buf) => Buffer.from(buf).toString("base64url");
const fromB64url = (str) => Buffer.from(str, "base64url");

let cachedKeys;
function getVapidKeys() {
  if (cachedKeys !== undefined) return cachedKeys;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  cachedKeys = null;
  if (!publicKey || !privateKey) return cachedKeys;
  try {
    const pub = fromB64url(publicKey);
    const key = crypto.createPrivateKey({
      key: { kty: "EC", crv: "P-256", d: privateKey, x: b64url(pub.subarray(1, 33)), y: b64url(pub.subarray(33, 65)) },
      format: "jwk",
    });
    cachedKeys = { publicKey, key };
  } catch (err) {
    console.error("[Push] Invalid VAPID keys:", err.message);
  }
  return cachedKeys;
}

export const getPublicKey = () => getVapidKeys()?.publicKey || null;

function vapidHeader(endpoint, keys) {
  const header = b64url(JSON.stringify({ typ: "JWT", alg: "ES256" }));
  const claims = b64url(
    JSON.stringify({
      aud: new URL(endpoint).origin,
      exp: Math.floor(Date.now() / 1000) + 12 * 3600,
      sub: process.env.VAPID_SUBJECT || "mailto:support@forexnotes.in",
    }),
  );
  const unsigned = `${header}.${claims}`;
  const signature = crypto.sign("sha256", Buffer.from(unsigned), { key: keys.key, dsaEncoding: "ieee-p1363" });
  return `vapid t=${unsigned}.${b64url(signature)}, k=${keys.publicKey}`;
}

export function encryptPayload(payload, p256dh, auth) {
  const uaPublic = fromB64url(p256dh);
  const ecdh = crypto.createECDH("prime256v1");
  const asPublic = ecdh.generateKeys();
  const sharedSecret = ecdh.computeSecret(uaPublic);
  const salt = crypto.randomBytes(16);

  const keyInfo = Buffer.concat([Buffer.from("WebPush: info\0"), uaPublic, asPublic]);
  const ikm = Buffer.from(crypto.hkdfSync("sha256", sharedSecret, fromB64url(auth), keyInfo, 32));
  const cek = Buffer.from(crypto.hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: aes128gcm\0"), 16));
  const nonce = Buffer.from(crypto.hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: nonce\0"), 12));

  const cipher = crypto.createCipheriv("aes-128-gcm", cek, nonce);
  const record = Buffer.concat([
    cipher.update(Buffer.concat([Buffer.from(payload), Buffer.from([2])])),
    cipher.final(),
    cipher.getAuthTag(),
  ]);

  const header = Buffer.alloc(21);
  salt.copy(header, 0);
  header.writeUInt32BE(4096, 16);
  header[20] = asPublic.length;
  return Buffer.concat([header, asPublic, record]);
}

async function sendToSubscription(sub, payload, keys) {
  const res = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      Authorization: vapidHeader(sub.endpoint, keys),
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: "86400",
      Urgency: "normal",
    },
    body: encryptPayload(JSON.stringify(payload), sub.p256dh, sub.auth),
  });
  if (res.status === 404 || res.status === 410) {
    await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
  } else if (!res.ok) {
    console.warn(`[Push] ${res.status} from push service:`, (await res.text()).slice(0, 200));
  }
  return res.ok;
}

async function sendToRows(rows, payload) {
  const keys = getVapidKeys();
  if (!keys || !rows?.length) return 0;
  const results = await Promise.allSettled(rows.map((sub) => sendToSubscription(sub, payload, keys)));
  return results.filter((r) => r.status === "fulfilled" && r.value).length;
}

export async function saveSubscription(userId, { endpoint, keys } = {}, userAgent) {
  if (!endpoint || !keys?.p256dh || !keys?.auth) throw new Error("INVALID_SUBSCRIPTION");
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: String(userId),
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      user_agent: userAgent ? String(userAgent).slice(0, 300) : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" },
  );
  if (error) throw error;
}

export async function removeSubscription(userId, endpoint) {
  await supabase.from("push_subscriptions").delete().eq("user_id", String(userId)).eq("endpoint", endpoint);
}

export async function sendPushToUser(userId, payload) {
  if (!getVapidKeys()) return 0;
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", String(userId));
  if (error) throw error;
  return sendToRows(data, payload);
}

export async function sendPushToAll(payload) {
  if (!getVapidKeys()) return 0;
  let sent = 0;
  const pageSize = 500;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .range(from, from + pageSize - 1);
    if (error) throw error;
    sent += await sendToRows(data, payload);
    if (!data || data.length < pageSize) break;
  }
  return sent;
}
