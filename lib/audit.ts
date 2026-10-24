import { randomUUID } from "node:crypto";
import type { VercelRequest } from "@vercel/node";
import { query } from "./db.js";
import { clientIp } from "./http.js";

export type AuditActor = {
  id: string;
  email: string;
  username?: string | null;
  role?: string | null;
};

export type AuditStatus = "success" | "failure";

export type AuditEventInput = {
  action: string;
  entityType: string;
  entityId?: string | null;
  status?: AuditStatus;
  actor?: AuditActor | null;
  req?: VercelRequest;
  metadata?: Record<string, unknown>;
};

/**
 * Écrit un événement dans le journal d'audit.
 *
 * Cette fonction ne jette jamais : une panne du journal ne doit pas faire échouer
 * l'action métier qui vient d'être réalisée. Ne jamais transmettre de mot de passe,
 * de jeton, de cookie ou de secret MFA dans `metadata`.
 */
export async function recordAudit(event: AuditEventInput): Promise<void> {
  try {
    const actor = event.actor ?? null;
    const rawAgent = event.req?.headers["user-agent"];
    const userAgent = (Array.isArray(rawAgent) ? rawAgent[0] : rawAgent) || "";

    await query(
      `INSERT INTO audit_log
        (id, actor_id, actor_email, actor_username, actor_role,
         action, entity_type, entity_id, status, ip, user_agent, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      `audit-${randomUUID()}`,
      actor?.id ?? null,
      actor?.email ?? "",
      actor?.username ?? null,
      actor?.role ?? null,
      event.action,
      event.entityType,
      event.entityId ?? null,
      event.status ?? "success",
      event.req ? clientIp(event.req).slice(0, 64) : "",
      userAgent.slice(0, 512),
      JSON.stringify(event.metadata ?? {})
    );
  } catch (error) {
    // Le journal est un outil d'observation : il ne doit jamais casser l'application.
    console.error("audit log insert failed:", error);
  }
}
