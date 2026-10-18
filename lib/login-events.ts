import type { VercelRequest } from "@vercel/node";
import { query } from "./db.js";
import { parseDevice } from "./device.js";
import { clientIp } from "./http.js";


export async function recordLogin(
  req: VercelRequest,
  admin: { id: string; email: string; username: string | null }
): Promise<void> {
  const ip = clientIp(req);
  const userAgent = req.headers["user-agent"];
  await query(
    `INSERT INTO login_events (id, admin_id, email, username, ip, user_agent, device)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    `login-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    admin.id,
    admin.email,
    admin.username ?? null,
    ip || "",
    userAgent || "",
    parseDevice(userAgent)
  ).catch(() => {});
}
