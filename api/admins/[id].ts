import { randomBytes, randomUUID } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { query } from "../../lib/db.js";
import {
  requireAdmin,
  requireSuperAdmin,
  sessionCookie,
  createSessionToken,
  sessionIssuedAt,
} from "../../lib/auth.js";
import { adminOrigin, respondInternalError } from "../../lib/http.js";
import { createDbRateLimiter } from "../../lib/rate-limit.js";
import { hashPassword, hashToken } from "../../lib/password.js";
import { sendPasswordResetEmail } from "../../lib/email.js";
import { recordAudit } from "../../lib/audit.js";

const SESSION_MS = 1000 * 60 * 60 * 12; 
const RESET_TTL_MS = 60 * 60 * 1000; 
const RESET_COOLDOWN_MS = 5 * 60 * 1000;

// ---- Journal d'audit (/api/audit, réécrit vers /api/admins/audit) ----

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
  "audit",
]);

const AUDIT_IMPORT_LIMIT = 5000;
const AUDIT_METADATA_MAX_BYTES = 8000;

const auditImportLimiter = createDbRateLimiter({
  windowMs: 1000 * 60 * 60,
  max: 10,
  label: "audit-import",
});

const auditPurgeLimiter = createDbRateLimiter({
  windowMs: 1000 * 60 * 60,
  max: 5,
  label: "audit-purge",
});

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
      
    }
  }
  return {};
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    
    // Journal d'audit : servi ici (et non dans une fonction dédiée) car le plan
    // Hobby Vercel limite un déploiement à 12 fonctions serverless.
    // L'URL publique /api/audit est réécrite vers /api/admins/audit (vercel.json).
    if (req.method === "GET" && String(req.query.id ?? "") === "audit") {
      return await handleAuditLog(req, res);
    }

    // Purge du journal : réservée au super administrateur.
    if (req.method === "DELETE" && String(req.query.id ?? "") === "audit") {
      return await handleAuditPurge(req, res);
    }

    if (req.method === "GET" && String(req.query.id ?? "") === "login-events") {
      return await handleLoginEvents(req, res);
    }

    
    if (req.method === "GET" && String(req.query.id ?? "") === "stats") {
      return await handleStats(req, res);
    }

    
    if (req.method === "PATCH" && String(req.query.id ?? "") === "me") {
      return await handleUpdateMe(req, res);
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const route = String(req.query.id ?? "");

      
      if (route === "accept") {
        return await handleAcceptInvite(req, res, body);
      }

      
      if (route === "reset-accept") {
        return await handleResetAccept(req, res, body);
      }

      
      if (route === "reset") {
        return await handleResetTrigger(req, res, body);
      }

      
      if (route === "forgot-password") {
        return await handleForgotPassword(req, res, body);
      }

      // Import d'un journal exporté (sauvegarde / transfert d'environnement).
      if (route === "audit") {
        return await handleAuditImport(req, res, body);
      }

      return res.status(404).json({ error: "Adresse inconnue." });
    }

    
    const admin = await requireSuperAdmin(req, res);
    if (!admin) return;

    const targetId = String(req.query.id ?? "");

    
    if (req.method === "PATCH") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

      if (targetId === admin.id) {
        return res.status(400).json({ error: "Vous ne pouvez pas vous bloquer vous-même" });
      }

      const target = await query<{ id: string; role: string; email: string }>(
        "SELECT id, role, email FROM admins WHERE id = $1",
        targetId
      );
      if (!target[0]) return res.status(404).json({ error: "Admin introuvable" });
      if (target[0].role === "superadmin") {
        return res.status(403).json({ error: "Impossible de bloquer le superadmin" });
      }

      if (body.status === "blocked" || body.status === "active") {
        await query(
          "UPDATE admins SET status = $1, updated_at = NOW() WHERE id = $2",
          body.status,
          targetId
        );
        await recordAudit({
          action: body.status === "blocked" ? "admin.block" : "admin.unblock",
          entityType: "admin",
          entityId: targetId,
          actor: admin,
          req,
          metadata: { email: target[0].email, status: body.status },
        });
        return res.status(200).json({ success: true, status: body.status });
      }
      return res.status(400).json({ error: "Action non reconnue." });
    }

    
    if (req.method === "DELETE") {
      if (targetId === admin.id) {
        return res.status(400).json({ error: "Vous ne pouvez pas supprimer votre propre compte" });
      }

      const target = await query<{ id: string; role: string; email: string }>(
        "SELECT id, role, email FROM admins WHERE id = $1",
        targetId
      );
      if (!target[0]) return res.status(404).json({ error: "Admin introuvable" });
      if (target[0].role === "superadmin") {
        return res.status(403).json({ error: "Impossible de supprimer le superadmin" });
      }

      await query("DELETE FROM admins WHERE id = $1", targetId);
      await recordAudit({
        action: "admin.delete",
        entityType: "admin",
        entityId: targetId,
        actor: admin,
        req,
        metadata: { email: target[0].email },
      });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Méthode non autorisée" });
  } catch (error: unknown) {
    respondInternalError(res, error, "API /api/admins/[id]");
  }
}




async function handleLoginEvents(req: VercelRequest, res: VercelResponse) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const rows = await query<{
    id: string;
    email: string;
    username: string | null;
    ip: string;
    device: string;
    created_at: string;
  }>(
    "SELECT id, email, username, ip, device, created_at FROM login_events WHERE admin_id = $1 AND created_at >= $2 ORDER BY created_at DESC LIMIT 30",
    admin.id,
    since
  );

  return res.status(200).json({
    events: rows.map((r) => ({
      id: r.id,
      email: r.email,
      username: r.username,
      ip: r.ip,
      device: r.device,
      createdAt: r.created_at,
    })),
  });
}


async function handleUpdateMe(
  req: VercelRequest,
  res: VercelResponse,
  body?: Record<string, unknown>
) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const payload =
    body ??
    (typeof req.body === "string" ? JSON.parse(req.body) : req.body ?? {});

  const sets: string[] = [];
  const values: unknown[] = [];

  if (payload.username !== undefined) {
    const username = String(payload.username).trim().toLowerCase();
    if (!/^[a-z0-9_.-]{3,30}$/.test(username)) {
      return res.status(400).json({
        error: "Nom d'utilisateur invalide (3-30 caractères : lettres, chiffres, _ . -)",
      });
    }
    const taken = await query<{ id: string }>(
      "SELECT id FROM admins WHERE LOWER(username) = $1 AND id <> $2",
      username,
      admin.id
    );
    if (taken[0]) {
      return res.status(409).json({ error: "Ce nom d'utilisateur est déjà pris" });
    }
    sets.push("username = $" + (sets.length + 1));
    values.push(username);
  }

  if (payload.avatar !== undefined) {
    const avatar = String(payload.avatar).trim();
    if (avatar !== "" && !/^https:\/\//i.test(avatar)) {
      return res.status(400).json({ error: "L'adresse de la photo n'est pas valide." });
    }
    sets.push("avatar = $" + (sets.length + 1));
    values.push(avatar);
  }

  if (sets.length === 0) {
    return res.status(400).json({ error: "Aucun champ à mettre à jour" });
  }

  values.push(admin.id);
  await query(
    `UPDATE admins SET ${sets.join(", ")}, updated_at = NOW() WHERE id = $${values.length}`,
    ...values
  );

  const fresh = await query<{
    id: string;
    email: string;
    username: string | null;
    role: string;
    avatar: string;
  }>("SELECT id, email, username, role, avatar FROM admins WHERE id = $1", admin.id);
  const a = fresh[0];

  await recordAudit({
    action: "admin.update",
    entityType: "admin",
    entityId: admin.id,
    actor: admin,
    req,
    metadata: { fields: Object.keys(payload) },
  });

  return res.status(200).json({
    success: true,
    admin: {
      id: a.id,
      email: a.email,
      username: a.username,
      role: a.role,
      avatar: a.avatar,
    },
  });
}



async function handleAcceptInvite(
  req: VercelRequest,
  res: VercelResponse,
  body: Record<string, unknown>
) {
  const token = String(body?.token ?? "").trim();
  const username = String(body?.username ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");

  if (!token) return res.status(400).json({ error: "Jeton d'invitation manquant" });
  if (!/^[a-z0-9_.-]{3,30}$/.test(username)) {
    return res.status(400).json({
      error: "Nom d'utilisateur invalide (3-30 caractères : lettres, chiffres, _ . -)",
    });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Le mot de passe doit contenir au moins 8 caractères" });
  }

  const rows = await query<{
    id: string;
    email: string;
    username: string | null;
    role: string;
    status: string;
    invite_token_expires: string;
  }>(
    "SELECT id, email, username, role, status, invite_token_expires FROM admins WHERE invite_token = $1",
    hashToken(token)
  );
  const admin = rows[0];

  if (!admin) {
    return res.status(400).json({ error: "Jeton d'invitation invalide" });
  }
  if (admin.status !== "invited") {
    return res.status(400).json({ error: "Ce lien a déjà été utilisé" });
  }
  if (new Date(admin.invite_token_expires).getTime() < Date.now()) {
    return res.status(400).json({ error: "Ce lien d'invitation a expiré. Demandez-en un nouveau." });
  }

  const taken = await query<{ id: string }>(
    "SELECT id FROM admins WHERE LOWER(username) = $1 AND id <> $2",
    username,
    admin.id
  );
  if (taken[0]) {
    return res.status(409).json({ error: "Ce nom d'utilisateur est déjà pris" });
  }

  const updated = await query<{ password_changed_at: string | null }>(
    "UPDATE admins SET username = $1, password_hash = $2, status = 'active', invite_token = NULL, invite_token_expires = NULL, password_changed_at = NOW(), updated_at = NOW() WHERE id = $3 RETURNING password_changed_at",
    username,
    hashPassword(password),
    admin.id
  );

  
  
  const tokenSession = createSessionToken(
    SESSION_MS,
    admin.id,
    sessionIssuedAt(updated[0]?.password_changed_at)
  );
  res.setHeader("Set-Cookie", sessionCookie(req, tokenSession, Math.floor(SESSION_MS / 1000)));

  await recordAudit({
    action: "admin.accept",
    entityType: "admin",
    entityId: admin.id,
    actor: { id: admin.id, email: admin.email, username, role: admin.role },
    req,
    metadata: { email: admin.email },
  });

  return res.status(200).json({
    success: true,
    admin: { id: admin.id, email: admin.email, username, role: admin.role },
  });
}


const forgotLimiter = createDbRateLimiter({
  windowMs: 1000 * 60 * 15,
  max: 3,
  label: "forgot-password",
});




async function handleForgotPassword(
  req: VercelRequest,
  res: VercelResponse,
  body: Record<string, unknown>
) {
  if (!(await forgotLimiter(req, res))) return;

  const email = String(body?.email ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Adresse email invalide" });
  }

  const rows = await query<{ id: string; status: string; reset_requested_at: string | null }>(
    "SELECT id, status, reset_requested_at FROM admins WHERE LOWER(email) = $1",
    email
  );
  const admin = rows[0];

  
  if (!admin || admin.status !== "active") {
    await recordAudit({
      action: "admin.forgot.request",
      entityType: "admin",
      entityId: admin?.id ?? null,
      status: "failure",
      req,
      metadata: {
        reason: admin ? "inactive_account" : "unknown_email",
        ...(admin ? { email } : {}),
      },
    });
    // Réponse volontairement identique pour un compte existant ou inconnu :
    // cela évite de transformer cet endpoint en oracle d'énumération de comptes.
    return res.status(200).json({ success: true });
  }

  
  
  
  if (
    admin.reset_requested_at &&
    Date.now() - new Date(admin.reset_requested_at).getTime() < RESET_COOLDOWN_MS
  ) {
    await recordAudit({
      action: "admin.forgot.request",
      entityType: "admin",
      entityId: admin.id,
      status: "failure",
      req,
      metadata: { reason: "cooldown", email },
    });
    return res.status(200).json({ success: true });
  }

  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + RESET_TTL_MS);

  await query(
    "UPDATE admins SET reset_token = $1, reset_token_expires = $2, reset_requested_at = NOW(), updated_at = NOW() WHERE id = $3",
    hashToken(token),
    expiresAt.toISOString(),
    admin.id
  );

  const url = resetUrl(token);
  const emailResult = await sendPasswordResetEmail({ to: email, resetUrl: url });

  await recordAudit({
    action: "admin.forgot.request",
    entityType: "admin",
    entityId: admin.id,
    req,
    metadata: { email, emailSent: emailResult.sent },
  });

  return res.status(200).json({ success: true });
}


function resetUrl(token: string): string {
  return `${adminOrigin()}/reset?token=${encodeURIComponent(token)}`;
}


async function handleResetTrigger(
  req: VercelRequest,
  res: VercelResponse,
  body: Record<string, unknown>
) {
  const me = await requireSuperAdmin(req, res);
  if (!me) return;

  const adminId = String(body?.adminId ?? "").trim();
  if (!adminId) return res.status(400).json({ error: "Compte manquant." });

  if (adminId === me.id) {
    return res.status(400).json({ error: "Vous ne pouvez pas réinitialiser votre propre mot de passe ici" });
  }

  const target = await query<{
    id: string;
    role: string;
    email: string;
    status: string;
    reset_requested_at: string | null;
  }>(
    "SELECT id, role, email, status, reset_requested_at FROM admins WHERE id = $1",
    adminId
  );
  if (!target[0]) return res.status(404).json({ error: "Admin introuvable" });
  if (target[0].role === "superadmin") {
    return res.status(403).json({ error: "Impossible de réinitialiser le mot de passe du superadmin" });
  }

  
  const last = target[0].reset_requested_at;
  if (last && Date.now() - new Date(last).getTime() < RESET_COOLDOWN_MS) {
    const min = Math.ceil((RESET_COOLDOWN_MS - (Date.now() - new Date(last).getTime())) / 60000);
    await recordAudit({
      action: "admin.reset.request",
      entityType: "admin",
      entityId: adminId,
      status: "failure",
      actor: me,
      req,
      metadata: { reason: "cooldown", email: target[0].email },
    });
    return res
      .status(429)
      .json({ error: `Un lien vient d'être envoyé. Réessayez dans ${min} min.` });
  }

  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + RESET_TTL_MS);

  await query(
    "UPDATE admins SET reset_token = $1, reset_token_expires = $2, reset_requested_at = NOW(), updated_at = NOW() WHERE id = $3",
    hashToken(token),
    expiresAt.toISOString(),
    adminId
  );

  const url = resetUrl(token);
  const emailResult = await sendPasswordResetEmail({ to: target[0].email, resetUrl: url });

  await recordAudit({
    action: "admin.reset.request",
    entityType: "admin",
    entityId: adminId,
    actor: me,
    req,
    metadata: { email: target[0].email, emailSent: emailResult.sent },
  });

  return res.status(200).json({
    success: true,
    resetUrl: url,
    emailSent: emailResult.sent,
    emailError: emailResult.error ?? null,
    targetEmail: target[0].email,
  });
}


async function handleResetAccept(
  req: VercelRequest,
  res: VercelResponse,
  body: Record<string, unknown>
) {
  const token = String(body?.token ?? "").trim();
  const password = String(body?.password ?? "");

  if (!token) return res.status(400).json({ error: "Jeton de réinitialisation manquant" });
  if (password.length < 8) {
    return res.status(400).json({ error: "Le mot de passe doit contenir au moins 8 caractères" });
  }

  const rows = await query<{
    id: string;
    email: string;
    username: string | null;
    role: string;
    status: string;
    reset_token_expires: string;
  }>(
    "SELECT id, email, username, role, status, reset_token_expires FROM admins WHERE reset_token = $1",
    hashToken(token)
  );
  const admin = rows[0];

  if (!admin) {
    return res.status(400).json({ error: "Jeton de réinitialisation invalide" });
  }
  if (admin.status !== "active") {
    return res.status(400).json({ error: "Compte non actif" });
  }
  if (new Date(admin.reset_token_expires).getTime() < Date.now()) {
    return res.status(400).json({ error: "Ce lien a expiré. Demandez une nouvelle réinitialisation." });
  }

  const updated = await query<{ password_changed_at: string | null }>(
    "UPDATE admins SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL, password_changed_at = NOW(), updated_at = NOW() WHERE id = $2 RETURNING password_changed_at",
    hashPassword(password),
    admin.id
  );

  
  
  const tokenSession = createSessionToken(
    SESSION_MS,
    admin.id,
    sessionIssuedAt(updated[0]?.password_changed_at)
  );
  res.setHeader("Set-Cookie", sessionCookie(req, tokenSession, Math.floor(SESSION_MS / 1000)));

  await recordAudit({
    action: "admin.reset.accept",
    entityType: "admin",
    entityId: admin.id,
    actor: {
      id: admin.id,
      email: admin.email,
      username: admin.username,
      role: admin.role,
    },
    req,
    metadata: { email: admin.email },
  });

  return res.status(200).json({
    success: true,
    admin: { id: admin.id, email: admin.email, username: admin.username, role: admin.role },
  });
}
async function handleAuditLog(req: VercelRequest, res: VercelResponse) {
  const admin = await requireSuperAdmin(req, res);
  if (!admin) return;

  const page = positiveInt(req.query.page, 1, 100000);
  const pageSize = positiveInt(req.query.pageSize, 25, 100);

  const action = firstString(req.query.action).trim().slice(0, 100);
  const entityType = firstString(req.query.entityType).trim();
  const status = firstString(req.query.status).trim();
  const term = firstString(req.query.q).trim().slice(0, 120);

  const daysRaw = firstString(req.query.days);
  const parsedDays = daysRaw === "" ? 7 : Number.parseInt(daysRaw, 10);
  const days =
    Number.isFinite(parsedDays) && parsedDays > 0 ? Math.min(parsedDays, 3650) : 0;

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
}

type ImportedAuditEvent = {
  id: string;
  createdAt: string;
  actorId: string | null;
  actorEmail: string;
  actorUsername: string | null;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  status: "success" | "failure";
  ip: string;
  userAgent: string;
  metadata: string;
};

function importString(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function normalizeImportedEvent(raw: unknown): ImportedAuditEvent | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const source = raw as Record<string, unknown>;

  const action = importString(source.action, 100);
  const entityType = importString(source.entityType ?? source.entity_type, 50);
  if (!action || !entityType) return null;

  const createdAtRaw = importString(source.createdAt ?? source.created_at, 40);
  const createdAt = createdAtRaw ? new Date(createdAtRaw) : new Date();
  if (Number.isNaN(createdAt.getTime())) return null;

  const statusRaw = importString(source.status, 10).toLowerCase();
  const status = statusRaw === "failure" ? "failure" : "success";

  let metadata = "{}";
  const metadataSource = source.metadata;
  if (typeof metadataSource === "string" && metadataSource.trim()) {
    try {
      const parsed: unknown = JSON.parse(metadataSource);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
      metadata = JSON.stringify(parsed);
    } catch {
      return null;
    }
  } else if (metadataSource && typeof metadataSource === "object" && !Array.isArray(metadataSource)) {
    metadata = JSON.stringify(metadataSource);
  } else if (metadataSource !== undefined && metadataSource !== null) {
    return null;
  }
  if (metadata.length > AUDIT_METADATA_MAX_BYTES) return null;

  const actorRaw =
    source.actor && typeof source.actor === "object" && !Array.isArray(source.actor)
      ? (source.actor as Record<string, unknown>)
      : null;

  return {
    id: importString(source.id, 120) || `audit-${randomUUID()}`,
    createdAt: createdAt.toISOString(),
    actorId: importString(actorRaw?.id, 120) || null,
    actorEmail: importString(actorRaw?.email, 200),
    actorUsername: importString(actorRaw?.username, 120) || null,
    actorRole: importString(actorRaw?.role, 40) || null,
    action,
    entityType,
    entityId: importString(source.entityId ?? source.entity_id, 120) || null,
    status,
    ip: importString(source.ip, 64),
    userAgent: importString(source.userAgent ?? source.user_agent, 512),
    metadata,
  };
}

async function handleAuditPurge(req: VercelRequest, res: VercelResponse) {
  const admin = await requireSuperAdmin(req, res);
  if (!admin) return;
  if (!(await auditPurgeLimiter(req, res))) return;

  const daysRaw = firstString(req.query.beforeDays).trim();
  const parsed = daysRaw === "" ? 0 : Number.parseInt(daysRaw, 10);
  const olderThanDays = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 36500) : 0;

  const rows =
    olderThanDays > 0
      ? await query<{ id: string }>(
          `DELETE FROM audit_log
            WHERE created_at < NOW() - make_interval(days => $1)
            RETURNING id`,
          olderThanDays
        )
      : await query<{ id: string }>("DELETE FROM audit_log RETURNING id");

  // L'événement de purge est écrit après la suppression : il reste donc consultable,
  // même si l'historique complet vient d'être effacé.
  await recordAudit({
    action: "audit.purge",
    entityType: "audit",
    actor: admin,
    req,
    metadata: {
      deleted: rows.length,
      scope: olderThanDays > 0 ? `plus de ${olderThanDays} jours` : "tout l'historique",
    },
  });

  return res.status(200).json({ success: true, deleted: rows.length, olderThanDays });
}

async function handleAuditImport(
  req: VercelRequest,
  res: VercelResponse,
  body: unknown
) {
  const admin = await requireSuperAdmin(req, res);
  if (!admin) return;
  if (!(await auditImportLimiter(req, res))) return;

  const source =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as { events?: unknown }).events
      : undefined;

  if (!Array.isArray(source)) {
    return res.status(400).json({ error: "Format attendu : { \"events\": [ ... ] }" });
  }
  if (source.length === 0) {
    return res.status(400).json({ error: "Aucun événement à importer." });
  }
  if (source.length > AUDIT_IMPORT_LIMIT) {
    return res.status(413).json({
      error: `Import limité à ${AUDIT_IMPORT_LIMIT} événements par requête.`,
    });
  }

  const counts = { imported: 0, skipped: 0, invalid: 0 };

  for (const raw of source) {
    const event = normalizeImportedEvent(raw);
    if (!event) {
      counts.invalid += 1;
      continue;
    }

    const rows = await query<{ id: string }>(
      `INSERT INTO audit_log
        (id, created_at, actor_id, actor_email, actor_username, actor_role,
         action, entity_type, entity_id, status, ip, user_agent, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (id) DO NOTHING
       RETURNING id`,
      event.id,
      event.createdAt,
      event.actorId,
      event.actorEmail,
      event.actorUsername,
      event.actorRole,
      event.action,
      event.entityType,
      event.entityId,
      event.status,
      event.ip,
      event.userAgent,
      event.metadata
    );

    if (rows.length > 0) counts.imported += 1;
    else counts.skipped += 1;
  }

  await recordAudit({
    action: "audit.import",
    entityType: "audit",
    actor: admin,
    req,
    metadata: counts,
  });

  return res.status(200).json({ success: true, ...counts });
}

async function handleStats(req: VercelRequest, res: VercelResponse) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const [[props], [vehs], [revs], [msgs]] = await Promise.all([
    query("SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE type = 'Vente')::int AS sale, COUNT(*) FILTER (WHERE type = 'Location')::int AS rental, COALESCE(SUM(price), 0)::bigint AS value FROM properties"),
    query("SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE type = 'Vente')::int AS sale, COUNT(*) FILTER (WHERE type = 'Location')::int AS rental, COUNT(*) FILTER (WHERE featured = true)::int AS featured FROM vehicles"),
    query("SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status = 'approved')::int AS approved, COUNT(*) FILTER (WHERE status = 'pending')::int AS pending FROM reviews"),
    query("SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE read = false)::int AS unread FROM messages"),
  ]);

  return res.status(200).json({
    properties: {
      total: Number(props.total),
      sale: Number(props.sale),
      rental: Number(props.rental),
      value: Number(props.value),
    },
    vehicles: {
      total: Number(vehs.total),
      sale: Number(vehs.sale),
      rental: Number(vehs.rental),
      featured: Number(vehs.featured),
    },
    reviews: {
      total: Number(revs.total),
      approved: Number(revs.approved),
      pending: Number(revs.pending),
    },
    messages: {
      total: Number(msgs.total),
      unread: Number(msgs.unread),
    },
  });
}
