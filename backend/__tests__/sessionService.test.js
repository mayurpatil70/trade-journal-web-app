import { jest } from "@jest/globals";
import { parseDeviceName, getClientIp } from "../utils/deviceHelper.js";
import { signAuthToken, verifyAuthTokenFull, verifyAuthToken } from "../utils/authToken.js";
import {
  createSession,
  validateSession,
  revokeSession,
  revokeAllOtherSessions,
  getUserSessions,
} from "../services/sessionService.js";

const secret = "test-session-secret-key-123";

describe("deviceHelper", () => {
  it("correctly identifies Windows and Chrome", () => {
    const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    expect(parseDeviceName(ua)).toBe("Windows · Chrome");
  });

  it("correctly identifies iPhone and Safari", () => {
    const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
    expect(parseDeviceName(ua)).toBe("iPhone · Safari");
  });

  it("correctly identifies Android and Chrome", () => {
    const ua = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.43 Mobile Safari/537.36";
    expect(parseDeviceName(ua)).toBe("Android Phone · Chrome");
  });

  it("handles missing or empty userAgent", () => {
    expect(parseDeviceName("")).toBe("Unknown Device");
    expect(parseDeviceName(null)).toBe("Unknown Device");
  });

  it("extracts real client IP", () => {
    expect(getClientIp({ headers: { "x-forwarded-for": "203.0.113.195, 70.41.3.18" } })).toBe("203.0.113.195");
    expect(getClientIp({ headers: { "x-real-ip": "198.51.100.1" } })).toBe("198.51.100.1");
    expect(getClientIp({ socket: { remoteAddress: "192.168.1.1" } })).toBe("192.168.1.1");
  });
});

describe("authToken multi-device extension", () => {
  it("encodes and verifies sessionId and deviceId", () => {
    const token = signAuthToken("user_abc", {
      secret,
      sessionId: "sess_123",
      deviceId: "dev_laptop",
    });

    const decoded = verifyAuthTokenFull(token, { secret });
    expect(decoded).toMatchObject({
      userId: "user_abc",
      sessionId: "sess_123",
      deviceId: "dev_laptop",
    });

    // Backward compatibility: verifyAuthToken returns the userId string
    expect(verifyAuthToken(token, { secret })).toBe("user_abc");
  });
});

describe("sessionService", () => {
  it("creates a session and handles fallback safely", async () => {
    const session = await createSession({
      userId: "00000000-0000-0000-0000-000000000001",
      deviceId: "dev_test_1",
      deviceName: "Windows · Chrome",
    });

    expect(session).toBeDefined();
    expect(session.id).toBeDefined();
  });

  it("validates a session correctly and allows fallback sessions", async () => {
    const fallbackId = "fb_12345678-1234-1234-1234-123456789abc";
    const status = await validateSession(fallbackId, "00000000-0000-0000-0000-000000000001");
    expect(status.valid).toBe(true);
  });

  it("rejects empty or missing sessionId", async () => {
    const status = await validateSession("", "u1");
    expect(status.valid).toBe(false);
    expect(status.reason).toBe("MISSING_SESSION_ID");
  });

  it("revokes session without throwing", async () => {
    const res = await revokeSession("sess_abc", "u1");
    expect(typeof res).toBe("boolean");
  });

  it("revokes all other sessions without throwing", async () => {
    const res = await revokeAllOtherSessions("u1", "sess_current");
    expect(typeof res).toBe("boolean");
  });

  it("fetches user sessions list safely", async () => {
    const list = await getUserSessions("00000000-0000-0000-0000-000000000001", "curr_1");
    expect(Array.isArray(list)).toBe(true);
  });
});

