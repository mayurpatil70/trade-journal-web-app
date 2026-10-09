const MAX_BYTES = 5 * 1024 * 1024;
const CONCURRENCY = 6;

const detectType = (buf) => {
  if (buf[0] === 0x89 && buf[1] === 0x50) return "png";
  if (buf[0] === 0xff && buf[1] === 0xd8) return "jpeg";
  if (buf[0] === 0x47 && buf[1] === 0x49) return "gif";
  return null;
};

export const tradeImageUrls = (t) => {
  const urls = Array.isArray(t.images) ? [...t.images] : [];
  for (const u of [t.before_image, t.after_image]) if (u && !urls.includes(u)) urls.push(u);
  return urls.filter((u) => typeof u === "string" && /^https?:\/\//.test(u));
};

const fetchImage = async (url) => {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_BYTES) return null;
    const type = detectType(buf);
    return type ? { buffer: buf, type } : null;
  } catch {
    return null;
  }
};

export const loadTradeImages = async (trades) => {
  const urls = [...new Set(trades.flatMap(tradeImageUrls))];
  const cache = new Map();
  let next = 0;
  const worker = async () => {
    while (next < urls.length) {
      const url = urls[next++];
      cache.set(url, await fetchImage(url));
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, urls.length) }, worker));
  return (t) => tradeImageUrls(t).map((u) => cache.get(u)).filter(Boolean);
};
