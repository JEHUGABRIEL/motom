import type { VercelRequest, VercelResponse } from "@vercel/node";
import { clientIp } from "./http.js";
import { query } from "./db.js";

type Entry = { count: number; resetAt: number };


export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  label: string;
}) {
  const { windowMs, max, label } = options;
  const hits = new Map<string, Entry>();

  
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }, windowMs);
  timer.unref?.();

  return function rateLimit(req: VercelRequest, res: VercelResponse): boolean {
    const key = `${label}:${clientIp(req) || "unknown"}`;

    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }

    entry.count += 1;
    if (entry.count > max) {
      res.status(429).json({ error: "Trop de requêtes. Réessayez plus tard." });
      return false;
    }
    return true;
  };
}


export function createDbRateLimiter(options: {
  windowMs: number;
  max: number;
  label: string;
}) {
  const { windowMs, max, label } = options;

  return async function rateLimit(
    req: VercelRequest,
    res: VercelResponse
  ): Promise<boolean> {
    const key = `${label}:${clientIp(req) || "unknown"}`;
    const resetAt = new Date(Date.now() + windowMs).toISOString();

    try {
      const rows = await query<{ count: number; reset_at: string }>(
        `INSERT INTO rate_limits AS rl (key, count, reset_at)
         VALUES ($1, 1, $2)
         ON CONFLICT (key) DO UPDATE SET
           count = CASE WHEN rl.reset_at <= NOW() THEN 1 ELSE rl.count + 1 END,
           reset_at = CASE WHEN rl.reset_at <= NOW() THEN EXCLUDED.reset_at ELSE rl.reset_at END
         RETURNING rl.count, rl.reset_at`,
        key,
        resetAt
      );

      
      
      if (Math.random() < 0.02) {
        void query("DELETE FROM rate_limits WHERE reset_at < NOW()").catch(() => {});
      }

      const row = rows[0];
      if (!row) return true;

      if (Number(row.count) > max) {
        const retryAfter = Math.max(
          1,
          Math.ceil((new Date(row.reset_at).getTime() - Date.now()) / 1000)
        );
        res.setHeader("Retry-After", String(retryAfter));
        res.status(429).json({
          error: `Trop de tentatives. Réessayez dans ${Math.ceil(retryAfter / 60)} min.`,
        });
        return false;
      }

      return true;
    } catch (error) {
      
      
      console.error(`rate-limit ${label} unavailable:`, error);
      return true;
    }
  };
}
