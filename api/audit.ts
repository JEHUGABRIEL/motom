import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireSuperAdmin } from "../lib/auth.js";
import { query } from "../lib/db.js";
import { respondInternalError } from "../lib/http.js";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
const DEFAULT_DAYS = 7;

const ENTITY_TYPES = new Set([
  "auth",
  "admin",
  "property",
  "vehicle",
  "service",
  "faq",
  "message",
  "review",
  "media",
]);

type AuditRow = {
  id: string;
  created_at: string;
  actor_id: string | null;
  actor_email: string;
  actor_username: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  status: "success" | "failure";
  ip: string;
  user_agent: string;
  metadata: unknown;
};

function firstString(value: unknown): string {
  if (Array.isArray(value)) return typeof value[0] === "string" ? value[0] : "";
  return typeof value === "string" ? value : "";
}

function positiveInt(value: unknown, fallback: number, max: number): number {
  const raw = firstString(value);
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

function parseMetadata(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // Métadonnée illisible : on renvoie un objet vide plutôt que de casser la page.
    }
  }
  return {};
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const admin = await requireSuperAdmin(req, res);
  if (!admin) return;

  try {
    const page = positiveInt(req.query.page, 1, 100000);
    const pageSize = positiveInt(req.query.pageSize, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

    const action = firstString(req.query.action).trim().slice(0, 100);
    const entityType = firstString(req.query.entityType).trim();
    const status = firstString(req.query.status).trim();
    const term = firstString(req.query.q).trim().slice(0, 120);

    const daysRaw = firstString(req.query.days);
    const parsedDays = daysRaw === "" ? DEFAULT_DAYS : Number.parseInt(daysRaw, 10);
    const days = Number.isFinite(parsedDays) && parsedDays > 0
      ? Math.min(parsedDays, 3650)
      : 0;

    const where: string[] = [];
    const params: unknown[] = [];

    if (action) {
      params.push(`${action}%`);
      where.push(`action LIKE $${params.length}`);
    }

    if (ENTITY_TYPES.has(entityType)) {
      params.push(entityType);
      where.push(`entity_type = $${params.length}`);
    }

    if (status === "success" || status === "failure") {
      params.push(status);
      where.push(`status = $${params.length}`);
    }

    if (days > 0) {
      params.push(new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());
      where.push(`created_at >= $${params.length}`);
    }

    if (term) {
      params.push(`%${term}%`);
      const p = params.length;
      where.push(
        `(actor_email ILIKE $${p} OR actor_username ILIKE $${p} OR entity_id ILIKE $${p}
          OR action ILIKE $${p} OR ip ILIKE $${p} OR metadata::text ILIKE $${p})`
      );
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
    const offset = (page - 1) * pageSize;

    const countRows = await query<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM audit_log ${whereSql}`,
      ...params
    );
    const total = Number(countRows[0]?.total ?? 0);

    const rows = await query<AuditRow>(
      `SELECT id, created_at, actor_id, actor_email, actor_username, actor_role,
              action, entity_type, entity_id, status, ip, user_agent, metadata
       FROM audit_log
       ${whereSql}
       ORDER BY created_at DESC, id DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      ...params,
      pageSize,
      offset
    );

    return res.status(200).json({
      events: rows.map((row) => ({
        id: row.id,
        createdAt: row.created_at,
        actor:
          row.actor_id || row.actor_email
            ? {
                id: row.actor_id,
                email: row.actor_email,
                username: row.actor_username,
                role: row.actor_role,
              }
            : null,
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id,
        status: row.status,
        ip: row.ip,
        userAgent: row.user_agent,
        metadata: parseMetadata(row.metadata),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (error: unknown) {
    respondInternalError(res, error, "API /api/audit");
  }
}
