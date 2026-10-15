// backend/utils/keepAlive.js
import axios from "axios";

/**
 * Keep-Alive Cron Engine
 * Render, Koyeb, and free hosting tiers spin down applications after 15 minutes of inactivity.
 * This cron job pings the service every 10 minutes to maintain persistent active status.
 */
export function startKeepAliveCron({ intervalMs = 10 * 60 * 1000, port = process.env.PORT || 3000 } = {}) {
  // Determine external URL: Render automatically populates RENDER_EXTERNAL_URL
  const externalUrl =
    process.env.RENDER_EXTERNAL_URL ||
    process.env.SERVER_URL ||
    process.env.BACKEND_URL ||
    `https://forexnotes-web-app.onrender.com`;

  const fallbackLocalUrl = `http://localhost:${port}/api/health`;

  console.log(`[KeepAlive] Service keep-alive cron registered.`);
  console.log(`[KeepAlive] Target URL: ${externalUrl} (fallback: ${fallbackLocalUrl})`);
  console.log(`[KeepAlive] Interval: Every ${Math.round(intervalMs / 60000)} minutes.`);

  const ping = async () => {
    const targetUrl = externalUrl.startsWith("http") ? `${externalUrl.replace(/\/$/, "")}/api/health` : fallbackLocalUrl;
    try {
      const start = Date.now();
      const res = await axios.get(targetUrl, {
        timeout: 15000,
        headers: { "User-Agent": "ForexNotes-KeepAlive-Cron/1.0" },
      });
      const latency = Date.now() - start;
      console.log(`[KeepAlive] Heartbeat ping OK (${res.status}) - ${latency}ms at ${new Date().toISOString()}`);
    } catch (err) {
      // If external URL failed (e.g. during initial spinup or local dev), try local fallback
      try {
        await axios.get(fallbackLocalUrl, { timeout: 5000 });
        console.log(`[KeepAlive] Local fallback heartbeat OK at ${new Date().toISOString()}`);
      } catch (localErr) {
        console.warn(`[KeepAlive] Ping notice: ${err.message}`);
      }
    }
  };

  // Initial ping 1 minute after boot
  setTimeout(ping, 60_000);

  // Recurring cron interval
  const timer = setInterval(ping, intervalMs);
  if (timer.unref) timer.unref();

  return timer;
}
