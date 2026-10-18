import type { VercelRequest, VercelResponse } from "@vercel/node";
import { clientIp } from "./http.js";

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
