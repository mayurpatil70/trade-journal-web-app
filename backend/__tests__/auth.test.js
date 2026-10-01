import { jest } from "@jest/globals";
import { signAuthToken, verifyAuthToken } from "../utils/authToken.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { rateLimit } from "../middlewares/rateLimit.js";

const secret = "test-secret";
const makeRes = () => {
  const res = { set: jest.fn(), status: jest.fn(() => res), json: jest.fn(() => res) };
  return res;
};

describe("auth tokens", () => {
  it("round-trips a user id", () => {
    expect(verifyAuthToken(signAuthToken("u1", { secret }), { secret })).toBe("u1");
  });

  it("rejects tampered, expired, wrong-secret and malformed tokens", () => {
    const token = signAuthToken("u1", { secret, now: 1000 });
    const [payload, sig] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ sub: "u2", exp: 9e15 })).toString("base64url");
    expect(verifyAuthToken(`${forged}.${sig}`, { secret, now: 1000 })).toBeNull();
    expect(verifyAuthToken(token, { secret, now: 1000 + 31 * 24 * 3600 * 1000 })).toBeNull();
    expect(verifyAuthToken(token, { secret: "other", now: 1000 })).toBeNull();
    expect(verifyAuthToken(payload, { secret })).toBeNull();
    expect(verifyAuthToken(undefined, { secret })).toBeNull();
  });

  it("issues nothing without a secret", () => {
    expect(signAuthToken("u1", { secret: "" })).toBeNull();
  });
});

describe("requireAuth", () => {
  const original = process.env.AUTH_SECRET;
  beforeEach(() => { process.env.AUTH_SECRET = secret; });
  afterAll(() => { process.env.AUTH_SECRET = original; });

  it("rejects missing or bad tokens", () => {
    const res = makeRes();
    const next = jest.fn();
    requireAuth({ headers: {} }, res, next);
    requireAuth({ headers: { authorization: "Bearer nope" } }, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("fails closed when AUTH_SECRET is unset", () => {
    delete process.env.AUTH_SECRET;
    const res = makeRes();
    requireAuth({ headers: {} }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(503);
  });

  it("overrides a client-supplied userId with the token's", () => {
    const req = { headers: { authorization: `Bearer ${signAuthToken("real")}` }, body: { userId: "victim" } };
    const next = jest.fn();
    requireAuth(req, makeRes(), next);
    expect(req.userId).toBe("real");
    expect(req.body.userId).toBe("real");
    expect(next).toHaveBeenCalled();
  });
});

describe("rateLimit", () => {
  it("blocks after max hits per user and sets Retry-After", () => {
    const limit = rateLimit({ windowMs: 60_000, max: 2 });
    const next = jest.fn();
    const res = makeRes();
    limit({ userId: "a" }, res, next);
    limit({ userId: "a" }, res, next);
    limit({ userId: "a" }, res, next);
    limit({ userId: "b" }, res, next);
    expect(next).toHaveBeenCalledTimes(3);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.set).toHaveBeenCalledWith("Retry-After", expect.any(String));
  });
});
