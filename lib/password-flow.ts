import type { VercelRequest, VercelResponse } from "@vercel/node";
import { query } from "./db.js";
import { recordAudit } from "./audit.js";
import { recordLogin } from "./login-events.js";
import { sendLoginOtpEmail } from "./email.js";
import { respondInternalError } from "./http.js";
import { createDbRateLimiter } from "./rate-limit.js";
import {
  hashPassword,
  hashToken,
  generateOtpCode,
  passwordIssues,
  verifyPassword,
} from "./password.js";
import {
  createPendingToken,
  createSessionToken,
  pendingCookie,
  readPendingAdminId,
  sessionCookie,
  sessionIssuedAt,
  SESSION_SECONDS,
  mfaPendingCookie,
  createMfaPendingToken,
  MFA_PENDING_SECONDS,
} from "./auth.js";

const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;

const changeLimiter = createDbRateLimiter({
  windowMs: 1000 * 60 * 15,
  max: 8,
  label: "password-change",
});

const otpLimiter = createDbRateLimiter({
  windowMs: 1000 * 60 * 15,
  max: 12,
  label: "login-otp",
});

export const PASSWORD_RULES_HINT =
  "Le mot de passe doit contenir 8 caractères minimum, une majuscule, un chiffre et un caractère spécial.";

type TargetRow = {
  id: string;
  email: string;
  username: string | null;
  role: "superadmin" | "admin";
  status: "invited" | "active" | "blocked";
  password_changed_at: string | null;
  temp_password_hash: string | null;
  temp_password_expires_at: string | null;
  must_change_password: boolean;
  avatar: string | null;
};

function publicAdmin(row: TargetRow) {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    role: row.role,
    avatar: row.avatar ?? "",
  };
}

function parseBody(req: VercelRequest): Record<string, unknown> {
  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
}

/**
 * Étape 2 du parcours : l'admin, connecté avec son mot de passe temporaire,
 * le remplace par un mot de passe définitif. Le temporaire est consommé, un
 * code à 6 chiffres est envoyé par email et un jeton court autorise l'étape OTP.
 */
export async function handlePasswordChange(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  try {
    const adminId = readPendingAdminId(req, "password");
    if (!adminId) {
      res.status(401).json({
        error: "Session de réinitialisation expirée. Reconnectez-vous.",
      });
      return;
    }
    if (!(await changeLimiter(req, res))) return;

    const body = parseBody(req);
    const currentPassword = String(body.currentPassword ?? "");
    const newPassword = String(body.newPassword ?? "");
    const confirmPassword = String(body.confirmPassword ?? "");

    const rows = await query<TargetRow>(
      `SELECT id, email, username, role, status, password_changed_at, avatar,
              temp_password_hash, temp_password_expires_at, must_change_password
         FROM admins WHERE id = $1`,
      adminId
    );
    const admin = rows[0];

    if (!admin || !admin.must_change_password || !admin.temp_password_hash) {
      res.status(400).json({ error: "Aucun changement de mot de passe en attente." });
      return;
    }
    if (admin.status !== "active") {
      res.status(403).json({ error: "Compte inactif. Contactez le super administrateur." });
      return;
    }
    if (
      admin.temp_password_expires_at &&
      new Date(admin.temp_password_expires_at).getTime() < Date.now()
    ) {
      await query(
        "UPDATE admins SET temp_password_hash = NULL, temp_password_expires_at = NULL, must_change_password = FALSE WHERE id = $1",
        admin.id
      );
      await recordAudit({
        action: "admin.password.change",
        entityType: "admin",
        entityId: admin.id,
        status: "failure",
        actor: admin,
        req,
        metadata: { reason: "temp_password_expired" },
      });
      res.status(400).json({
        error: "Mot de passe temporaire expiré. Demandez-en un nouveau au super administrateur.",
      });
      return;
    }

    if (!verifyPassword(currentPassword, admin.temp_password_hash)) {
      await recordAudit({
        action: "admin.password.change",
        entityType: "admin",
        entityId: admin.id,
        status: "failure",
        actor: admin,
        req,
        metadata: { reason: "bad_temp_password" },
      });
      res.status(401).json({ error: "Mot de passe temporaire incorrect." });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({ error: "Les deux mots de passe ne correspondent pas." });
      return;
    }
    if (newPassword === currentPassword) {
      res.status(400).json({
        error: "Le nouveau mot de passe doit être différent du mot de passe temporaire.",
      });
      return;
    }
    const issues = passwordIssues(newPassword);
    if (issues.length > 0) {
      res.status(400).json({
        error: `Mot de passe trop faible : il manque ${issues.join(", ")}.`,
      });
      return;
    }

    await query(
      `UPDATE admins
          SET password_hash = $1,
              temp_password_hash = NULL,
              temp_password_expires_at = NULL,
              must_change_password = FALSE,
              failed_attempts = 0,
              locked_until = NULL,
              password_changed_at = NOW(),
              updated_at = NOW()
        WHERE id = $2`,
      hashPassword(newPassword),
      admin.id
    );

    const code = generateOtpCode();
    await query(
      `INSERT INTO admin_login_otp (admin_id, code_hash, expires_at, attempts, created_at)
       VALUES ($1, $2, NOW() + ($3 || ' minutes')::interval, 0, NOW())
       ON CONFLICT (admin_id) DO UPDATE
         SET code_hash = EXCLUDED.code_hash,
             expires_at = EXCLUDED.expires_at,
             attempts = 0,
             created_at = NOW()`,
      admin.id,
      hashToken(code),
      String(OTP_TTL_MINUTES)
    );

    const email = await sendLoginOtpEmail({
      to: admin.email,
      code,
      minutes: OTP_TTL_MINUTES,
    });

    await recordAudit({
      action: "admin.password.change",
      entityType: "admin",
      entityId: admin.id,
      actor: admin,
      req,
      metadata: { emailSent: email.sent, otpSent: true },
    });

    res.setHeader(
      "Set-Cookie",
      pendingCookie(req, "otp", createPendingToken("otp", admin.id))
    );
    res.status(200).json({
      success: true,
      otpRequired: true,
      emailSent: email.sent,
      emailError: email.error ?? null,
      otpMinutes: OTP_TTL_MINUTES,
    });
  } catch (error) {
    respondInternalError(res, error, "API /api/auth?step=change-password");
  }
}

/**
 * Étape 3 : vérification du code reçu par email. En cas de succès, la session
 * réelle est ouverte (ou le défi MFA si l'admin l'a activé sur son compte).
 */
export async function handleVerifyOtp(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  try {
    const adminId = readPendingAdminId(req, "otp");
    if (!adminId) {
      res.status(401).json({ error: "Vérification expirée. Reconnectez-vous." });
      return;
    }
    if (!(await otpLimiter(req, res))) return;

    const code = String(parseBody(req).code ?? "").trim();
    if (!/^\d{6}$/.test(code)) {
      res.status(400).json({ error: "Le code contient 6 chiffres." });
      return;
    }

    const rows = await query<
      TargetRow & { code_hash: string | null; expires_at: string | null; attempts: number | null }
    >(
      `SELECT a.id, a.email, a.username, a.role, a.status, a.password_changed_at, a.avatar,
              a.temp_password_hash, a.temp_password_expires_at, a.must_change_password,
              o.code_hash, o.expires_at, o.attempts
         FROM admins a
         LEFT JOIN admin_login_otp o ON o.admin_id = a.id
        WHERE a.id = $1`,
      adminId
    );
    const admin = rows[0];

    if (!admin || admin.status !== "active") {
      res.status(403).json({ error: "Compte inactif. Contactez le super administrateur." });
      return;
    }

    if (!admin.code_hash) {
      res.status(400).json({
        error: "Aucun code en attente. Recommencez la connexion.",
      });
      return;
    }

    if (admin.expires_at && new Date(admin.expires_at).getTime() < Date.now()) {
      await query("DELETE FROM admin_login_otp WHERE admin_id = $1", admin.id);
      await recordAudit({
        action: "auth.otp.failure",
        entityType: "auth",
        entityId: admin.id,
        status: "failure",
        actor: admin,
        req,
        metadata: { reason: "expired" },
      });
      res.status(400).json({
        error: "Code expiré. Reconnectez-vous pour en recevoir un nouveau.",
      });
      return;
    }

    if ((admin.attempts ?? 0) >= OTP_MAX_ATTEMPTS) {
      await query("DELETE FROM admin_login_otp WHERE admin_id = $1", admin.id);
      await recordAudit({
        action: "auth.otp.failure",
        entityType: "auth",
        entityId: admin.id,
        status: "failure",
        actor: admin,
        req,
        metadata: { reason: "too_many_attempts" },
      });
      res.status(429).json({
        error: "Trop de codes erronés. Reconnectez-vous pour recommencer.",
      });
      return;
    }

    if (hashToken(code) !== admin.code_hash) {
      await query(
        "UPDATE admin_login_otp SET attempts = attempts + 1 WHERE admin_id = $1",
        admin.id
      );
      await recordAudit({
        action: "auth.otp.failure",
        entityType: "auth",
        entityId: admin.id,
        status: "failure",
        actor: admin,
        req,
        metadata: { reason: "bad_code", attempt: (admin.attempts ?? 0) + 1 },
      });
      res.status(401).json({
        error: `Code incorrect. Il reste ${OTP_MAX_ATTEMPTS - (admin.attempts ?? 0) - 1} essai(s).`,
      });
      return;
    }

    await query("DELETE FROM admin_login_otp WHERE admin_id = $1", admin.id);

    const mfa = await query<{ enabled: boolean }>(
      "SELECT enabled FROM admin_mfa WHERE admin_id = $1 AND enabled = TRUE",
      admin.id
    );
    if (mfa[0]) {
      await recordAudit({
        action: "auth.mfa.challenge",
        entityType: "auth",
        entityId: admin.id,
        actor: admin,
        req,
        metadata: { method: "totp", after: "otp" },
      });
      res.setHeader(
        "Set-Cookie",
        mfaPendingCookie(req, createMfaPendingToken(admin.id), MFA_PENDING_SECONDS)
      );
      res.status(200).json({ mfaRequired: true });
      return;
    }

    await recordLogin(req, admin);

    const token = createSessionToken(
      SESSION_SECONDS * 1000,
      admin.id,
      sessionIssuedAt(admin.password_changed_at)
    );
    res.setHeader("Set-Cookie", sessionCookie(req, token, SESSION_SECONDS));
    res.status(200).json({ success: true, admin: publicAdmin(admin) });
  } catch (error) {
    respondInternalError(res, error, "API /api/auth?step=verify-otp");
  }
}
