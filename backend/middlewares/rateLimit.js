export function rateLimit({ windowMs, max }) {
  const hits = new Map();

  setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [key, times] of hits) {
      if (times[times.length - 1] <= cutoff) hits.delete(key);
    }
  }, windowMs).unref();

  return (req, res, next) => {
    const key = req.userId || req.ip;
    const now = Date.now();
    const times = (hits.get(key) ?? []).filter((t) => t > now - windowMs);

    if (times.length >= max) {
      const retryAfter = Math.ceil((times[0] + windowMs - now) / 1000);
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({ error: `Too many requests. Try again in ${retryAfter}s.` });
    }
    times.push(now);
    hits.set(key, times);
    next();
  };
}
