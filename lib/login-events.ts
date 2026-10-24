import type { VercelRequest } from "@vercel/node";
import { query } from "./db.js";
import { parseDevice } from "./device.js";
import { clientIp } from "./http.js";
import { recordAudit } from "./audit.js";


export async function recordLogin(
  req: VercelRequest,
  admin: { id: string; email: string; username: string | null; role?: string | null }
): Promise<void> {
  const ip = clientIp(req);
  const userAgent = req.headers["user-agent"];
  const device = parseDevice(userAgent);

  await query(
    `INSERT INTO login_events (id, admin_id, email, username, ip, user_agent, device)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    `login-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    admin.id,
    admin.email,
    admin.username ?? null,
    ip || "",
    userAgent || "",
    device
  ).catch(() => {});

  await recordAudit({
    action: "auth.login.success",
    entityType: "auth",
    entityId: admin.id,
    actor: {
      id: admin.id,
      email: admin.email,
      username: admin.username,
      role: admin.role ?? "admin",
    },
    req,
    metadata: { device },
  });
}
