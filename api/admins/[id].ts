import { randomBytes } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { query } from "../../lib/db.js";
import {
  requireAdmin,
  requireSuperAdmin,
  sessionCookie,
  createSessionToken,
  sessionIssuedAt,
} from "../../lib/auth.js";
import { respondInternalError, siteOrigin } from "../../lib/http.js";
import { createRateLimiter } from "../../lib/rate-limit.js";
import { hashPassword, hashToken } from "../../lib/password.js";
import { sendPasswordResetEmail } from "../../lib/email.js";
import { recordAudit } from "../../lib/audit.js";

const SESSION_MS = 1000 * 60 * 60 * 12; 
const RESET_TTL_MS = 60 * 60 * 1000; 
const RESET_COOLDOWN_MS = 5 * 60 * 1000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    
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


const forgotLimiter = createRateLimiter({
  windowMs: 1000 * 60 * 15,
  max: 3,
  label: "forgot-password",
});




async function handleForgotPassword(
  req: VercelRequest,
  res: VercelResponse,
  body: Record<string, unknown>
) {
  if (!forgotLimiter(req, res)) return;

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

  const url = resetUrl(req, token);
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


function resetUrl(req: VercelRequest, token: string): string {
  return `${siteOrigin(req)}/admin/reset?token=${encodeURIComponent(token)}`;
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

  const url = resetUrl(req, token);
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
