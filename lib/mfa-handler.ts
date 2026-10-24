import type { VercelRequest, VercelResponse } from "@vercel/node";
import QRCode from "qrcode";
import { query } from "./db.js";
import {
  requireAdmin,
  createSessionToken,
  sessionCookie,
  sessionIssuedAt,
  readMfaPending,
  mfaPendingCookie,
} from "./auth.js";
import { respondInternalError } from "./http.js";
import { verifyPassword } from "./password.js";
import { recordLogin } from "./login-events.js";
import { recordAudit } from "./audit.js";
import {
  createTotpSecret,
  totpUri,
  verifyTotp,
  encryptSecret,
  decryptSecret,
  generateRecoveryCodes,
  hashRecoveryCode,
  consumeRecoveryCode,
  MAX_MFA_ATTEMPTS,
  MFA_LOCKOUT_MS,
} from "./mfa.js";

const SESSION_MS = 1000 * 60 * 60 * 12;

type MfaRow = {
  admin_id: string;
  secret: string;
  enabled: boolean;
  failed_attempts: number;
  locked_until: string | null;
  recovery_codes: string[];
};

async function getMfa(adminId: string): Promise<MfaRow | null> {
  const rows = await query<MfaRow>(
    "SELECT admin_id, secret, enabled, failed_attempts, locked_until, recovery_codes FROM admin_mfa WHERE admin_id = $1",
    adminId
  );
  return rows[0] ?? null;
}

async function getAdminIdentity(adminId: string): Promise<{
  id: string;
  email: string;
  username: string | null;
  role: string;
} | null> {
  const rows = await query<{
    id: string;
    email: string;
    username: string | null;
    role: string;
  }>("SELECT id, email, username, role FROM admins WHERE id = $1", adminId);
  return rows[0] ?? null;
}


function lockoutRemaining(row: MfaRow): number {
  if (!row.locked_until) return 0;
  const ms = new Date(row.locked_until).getTime() - Date.now();
  return ms > 0 ? Math.ceil(ms / 60000) : 0;
}


async function registerFailure(row: MfaRow): Promise<void> {
  const attempts = (row.failed_attempts ?? 0) + 1;
  const lock = attempts >= MAX_MFA_ATTEMPTS;
  await query(
    "UPDATE admin_mfa SET failed_attempts = $1, locked_until = $2, updated_at = NOW() WHERE admin_id = $3",
    lock ? 0 : attempts,
    lock ? new Date(Date.now() + MFA_LOCKOUT_MS).toISOString() : null,
    row.admin_id
  );
}

async function clearFailures(adminId: string): Promise<void> {
  await query(
    "UPDATE admin_mfa SET failed_attempts = 0, locked_until = NULL, updated_at = NOW() WHERE admin_id = $1",
    adminId
  );
}


async function openSession(
  req: VercelRequest,
  res: VercelResponse,
  adminId: string
) {
  const rows = await query<{
    id: string;
    email: string;
    username: string | null;
    role: string;
    status: string;
    avatar: string | null;
    password_changed_at: string | null;
  }>(
    "SELECT id, email, username, role, status, avatar, password_changed_at FROM admins WHERE id = $1",
    adminId
  );
  const admin = rows[0];
  if (!admin || admin.status !== "active") {
    return res.status(403).json({ error: "Compte indisponible" });
  }

  await recordLogin(req, admin);

  const token = createSessionToken(
    SESSION_MS,
    admin.id,
    sessionIssuedAt(admin.password_changed_at)
  );
  res.setHeader("Set-Cookie", [
    sessionCookie(req, token, Math.floor(SESSION_MS / 1000)),
    mfaPendingCookie(req, "", 0),
  ]);
  return res.status(200).json({
    success: true,
    admin: {
      id: admin.id,
      email: admin.email,
      username: admin.username,
      role: admin.role,
      avatar: admin.avatar ?? "",
    },
  });
}

export async function handleMfa(req: VercelRequest, res: VercelResponse) {
  try {
    
    if (req.method === "GET") {
      const admin = await requireAdmin(req, res);
      if (!admin) return;
      const row = await getMfa(admin.id);
      return res.status(200).json({
        configured: !!row,
        enabled: !!row?.enabled,
        recoveryCodesLeft: row?.recovery_codes?.length ?? 0,
      });
    }

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body ?? {};
    const action = String(body?.action ?? "");

    
    
    if (action === "verify" || action === "recovery") {
      const mfaAction = action === "verify" ? "auth.mfa.verify" : "auth.mfa.recovery";
      const adminId = readMfaPending(req);
      if (!adminId) {
        await recordAudit({
          action: `${mfaAction}.failure`,
          entityType: "auth",
          status: "failure",
          req,
          metadata: { reason: "missing_pending_session" },
        });
        return res.status(401).json({ error: "Session de vérification expirée. Reconnectez-vous." });
      }
      const row = await getMfa(adminId);
      if (!row || !row.enabled) {
        return res.status(400).json({ error: "Double authentification non active" });
      }

      const remaining = lockoutRemaining(row);
      if (remaining > 0) {
        await recordAudit({
          action: `${mfaAction}.failure`,
          entityType: "auth",
          entityId: adminId,
          status: "failure",
          actor: await getAdminIdentity(adminId),
          req,
          metadata: { reason: "locked", minutesRemaining: remaining },
        });
        return res
          .status(429)
          .json({ error: `Trop de tentatives. Réessayez dans ${remaining} min.` });
      }

      if (action === "verify") {
        const secret = decryptSecret(row.secret);
        if (!secret) {
          return res.status(500).json({ error: "Secret illisible. Contactez le superadmin." });
        }
        if (!verifyTotp(secret, String(body?.code ?? ""))) {
          await registerFailure(row);
          await recordAudit({
            action: `${mfaAction}.failure`,
            entityType: "auth",
            entityId: adminId,
            status: "failure",
            actor: await getAdminIdentity(adminId),
            req,
            metadata: { reason: "invalid_code" },
          });
          return res.status(401).json({ error: "Code incorrect ou expiré" });
        }
      } else {
        const result = consumeRecoveryCode(
          String(body?.code ?? ""),
          Array.isArray(row.recovery_codes) ? row.recovery_codes : []
        );
        if (!result.ok) {
          await registerFailure(row);
          await recordAudit({
            action: `${mfaAction}.failure`,
            entityType: "auth",
            entityId: adminId,
            status: "failure",
            actor: await getAdminIdentity(adminId),
            req,
            metadata: { reason: "invalid_recovery_code" },
          });
          return res.status(401).json({ error: "Code de secours invalide" });
        }
        await query(
          "UPDATE admin_mfa SET recovery_codes = $1, updated_at = NOW() WHERE admin_id = $2",
          JSON.stringify(result.remaining),
          adminId
        );
      }

      await recordAudit({
        action: `${mfaAction}.success`,
        entityType: "auth",
        entityId: adminId,
        actor: await getAdminIdentity(adminId),
        req,
        metadata: { method: action === "verify" ? "totp" : "recovery_code" },
      });
      await clearFailures(adminId);
      return await openSession(req, res, adminId);
    }

    
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    
    if (action === "setup") {
      const existing = await getMfa(admin.id);
      if (existing?.enabled) {
        return res.status(409).json({ error: "La double authentification est déjà active" });
      }
      const secret = createTotpSecret();
      const label = admin.email || admin.username || admin.id;
      await query(
        `INSERT INTO admin_mfa (admin_id, secret, enabled, recovery_codes)
         VALUES ($1, $2, FALSE, '[]'::jsonb)
         ON CONFLICT (admin_id) DO UPDATE
         SET secret = EXCLUDED.secret, enabled = FALSE, failed_attempts = 0,
             locked_until = NULL, recovery_codes = '[]'::jsonb, updated_at = NOW()`,
        admin.id,
        encryptSecret(secret)
      );
      const uri = totpUri(secret, label);
      
      
      const qrCode = await QRCode.toDataURL(uri, { margin: 1, width: 220 });
      await recordAudit({
        action: "auth.mfa.setup",
        entityType: "auth",
        entityId: admin.id,
        actor: admin,
        req,
        metadata: { method: "totp" },
      });
      return res.status(200).json({ uri, secret, qrCode });
    }

    
    if (action === "activate") {
      const row = await getMfa(admin.id);
      if (!row) return res.status(400).json({ error: "Lancez d'abord la configuration" });
      if (row.enabled) return res.status(409).json({ error: "Déjà active" });

      const secret = decryptSecret(row.secret);
      if (!secret) return res.status(500).json({ error: "Secret illisible. Relancez la configuration." });
      if (!verifyTotp(secret, String(body?.code ?? ""))) {
        await recordAudit({
          action: "auth.mfa.activate",
          entityType: "auth",
          entityId: admin.id,
          status: "failure",
          actor: admin,
          req,
          metadata: { reason: "invalid_code" },
        });
        return res.status(401).json({ error: "Code incorrect ou expiré" });
      }

      const codes = generateRecoveryCodes();
      await query(
        "UPDATE admin_mfa SET enabled = TRUE, failed_attempts = 0, locked_until = NULL, recovery_codes = $1, updated_at = NOW() WHERE admin_id = $2",
        JSON.stringify(codes.map(hashRecoveryCode)),
        admin.id
      );
      await recordAudit({
        action: "auth.mfa.activate",
        entityType: "auth",
        entityId: admin.id,
        actor: admin,
        req,
      });
      
      return res.status(200).json({ success: true, recoveryCodes: codes });
    }

    
    
    if (action === "disable") {
      const rows = await query<{ password_hash: string | null }>(
        "SELECT password_hash FROM admins WHERE id = $1",
        admin.id
      );
      const hash = rows[0]?.password_hash;
      if (!hash || !verifyPassword(String(body?.password ?? ""), hash)) {
        await recordAudit({
          action: "auth.mfa.disable",
          entityType: "auth",
          entityId: admin.id,
          status: "failure",
          actor: admin,
          req,
          metadata: { reason: "bad_password" },
        });
        return res.status(401).json({ error: "Mot de passe incorrect" });
      }
      await query("DELETE FROM admin_mfa WHERE admin_id = $1", admin.id);
      await recordAudit({
        action: "auth.mfa.disable",
        entityType: "auth",
        entityId: admin.id,
        actor: admin,
        req,
      });
      return res.status(200).json({ success: true });
    }

    
    if (action === "recovery-codes") {
      const row = await getMfa(admin.id);
      if (!row?.enabled) {
        return res.status(400).json({ error: "Double authentification non active" });
      }
      const rows = await query<{ password_hash: string | null }>(
        "SELECT password_hash FROM admins WHERE id = $1",
        admin.id
      );
      const hash = rows[0]?.password_hash;
      if (!hash || !verifyPassword(String(body?.password ?? ""), hash)) {
        await recordAudit({
          action: "auth.mfa.recovery-codes",
          entityType: "auth",
          entityId: admin.id,
          status: "failure",
          actor: admin,
          req,
          metadata: { reason: "bad_password" },
        });
        return res.status(401).json({ error: "Mot de passe incorrect" });
      }
      const codes = generateRecoveryCodes();
      await query(
        "UPDATE admin_mfa SET recovery_codes = $1, updated_at = NOW() WHERE admin_id = $2",
        JSON.stringify(codes.map(hashRecoveryCode)),
        admin.id
      );
      await recordAudit({
        action: "auth.mfa.recovery-codes",
        entityType: "auth",
        entityId: admin.id,
        actor: admin,
        req,
      });
      return res.status(200).json({ success: true, recoveryCodes: codes });
    }

    return res.status(400).json({ error: "Action inconnue" });
  } catch (error: unknown) {
    respondInternalError(res, error, "API /api/mfa");
  }
}

