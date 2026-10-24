import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  sessionCookie,
  createSessionToken,
  getSessionAdmin,
  sessionIssuedAt,
  createMfaPendingToken,
  mfaPendingCookie,
  MFA_PENDING_SECONDS,
  createPendingToken,
  pendingCookie,
} from "../lib/auth.js";
import { createDbRateLimiter } from "../lib/rate-limit.js";
import { respondInternalError } from "../lib/http.js";
import { query } from "../lib/db.js";
import { verifyPassword } from "../lib/password.js";
import { recordLogin } from "../lib/login-events.js";
import { recordAudit } from "../lib/audit.js";
import { handleMfa } from "../lib/mfa-handler.js";
import { handlePasswordChange, handleVerifyOtp } from "../lib/password-flow.js";

const SESSION_MS = 1000 * 60 * 60 * 12; 
const MAX_LOGIN_ATTEMPTS = 8;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000;


const loginLimiter = createDbRateLimiter({
  windowMs: 1000 * 60 * 15,
  max: 5,
  label: "login",
});

function publicAdmin(row: {
  id: string;
  email: string;
  username: string | null;
  role: string;
  status: string;
  avatar?: string | null;
}) {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    role: row.role,
    avatar: row.avatar ?? "",
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    
    
    if (req.query.mfa === "1") {
      return await handleMfa(req, res);
    }

    // Étapes du parcours « mot de passe temporaire » : changement forcé puis
    // validation d'un code reçu par email. Aucune session n'existe encore ici.
    if (req.method === "POST" && req.query.step === "change-password") {
      return await handlePasswordChange(req, res);
    }
    if (req.method === "POST" && req.query.step === "verify-otp") {
      return await handleVerifyOtp(req, res);
    }

    
    if (req.method === "POST") {
      if (!(await loginLimiter(req, res))) return;

      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const identifier = String(body?.identifier ?? "").trim().toLowerCase();
      const password = body?.password;

      if (!identifier || !password) {
        await recordAudit({
          action: "auth.login.failure",
          entityType: "auth",
          status: "failure",
          req,
          metadata: { reason: "missing_credentials" },
        });
        return res.status(400).json({ error: "Identifiant et mot de passe requis" });
      }

      const rows = await query<{
        id: string;
        email: string;
        username: string | null;
        role: string;
        status: string;
        password_hash: string | null;
        avatar?: string | null;
        password_changed_at: string | null;
        failed_attempts: number;
        locked_until: string | null;
        temp_password_hash: string | null;
        temp_password_expires_at: string | null;
        must_change_password: boolean;
      }>(
        "SELECT id, email, username, role, status, password_hash, avatar, password_changed_at, failed_attempts, locked_until, temp_password_hash, temp_password_expires_at, must_change_password FROM admins WHERE LOWER(email) = $1 OR LOWER(username) = $1",
        identifier
      );
      const admin = rows[0];

      
      
      const fakeHash = "scrypt$00000000000000000000000000000000$0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
      const okPassword = admin?.password_hash
        ? verifyPassword(password, admin.password_hash)
        : verifyPassword(password, fakeHash);

      
      
      
      if (admin?.locked_until && new Date(admin.locked_until).getTime() > Date.now()) {
        const min = Math.ceil((new Date(admin.locked_until).getTime() - Date.now()) / 60000);
        await recordAudit({
          action: "auth.login.locked",
          entityType: "auth",
          entityId: admin.id,
          status: "failure",
          actor: admin,
          req,
          metadata: { reason: "locked", minutesRemaining: min },
        });
        return res
          .status(429)
          .json({ error: `Trop de tentatives. Réessayez dans ${min} min.` });
      }

      // Mot de passe temporaire émis par le super administrateur : il ouvre le
      // parcours de changement obligatoire, jamais une session.
      const tempValid =
        admin?.must_change_password && admin.temp_password_hash
          ? (!admin.temp_password_expires_at ||
              new Date(admin.temp_password_expires_at).getTime() > Date.now()) &&
            verifyPassword(password, admin.temp_password_hash)
          : false;

      if (admin && tempValid) {
        await query(
          "UPDATE admins SET failed_attempts = 0, locked_until = NULL WHERE id = $1",
          admin.id
        ).catch(() => {});
        await recordAudit({
          action: "auth.login.temp",
          entityType: "auth",
          entityId: admin.id,
          actor: admin,
          req,
          metadata: { reason: "temporary_password" },
        });
        res.setHeader(
          "Set-Cookie",
          pendingCookie(req, "password", createPendingToken("password", admin.id))
        );
        return res.status(200).json({ passwordChangeRequired: true });
      }

      // Un compte en attente de changement ne doit pas pouvoir se connecter avec
      // son ancien mot de passe : seul le temporaire est accepté.
      if (admin?.must_change_password) {
        await recordAudit({
          action: "auth.login.failure",
          entityType: "auth",
          entityId: admin.id,
          status: "failure",
          actor: admin,
          req,
          metadata: { reason: "temp_password_required" },
        });
        return res.status(403).json({
          error:
            "Utilisez le mot de passe temporaire fourni par le super administrateur, ou demandez-en un nouveau.",
        });
      }

      if (!admin || !okPassword) {
        
        
        let lock = false;
        if (admin) {
          const attempts = (admin.failed_attempts ?? 0) + 1;
          lock = attempts >= MAX_LOGIN_ATTEMPTS;
          await query(
            "UPDATE admins SET failed_attempts = $1, locked_until = $2 WHERE id = $3",
            lock ? 0 : attempts,
            lock ? new Date(Date.now() + LOGIN_LOCKOUT_MS).toISOString() : null,
            admin.id
          ).catch(() => {});
        }
        await recordAudit({
          action: "auth.login.failure",
          entityType: "auth",
          entityId: admin?.id ?? null,
          status: "failure",
          actor: admin
            ? {
                id: admin.id,
                email: admin.email,
                username: admin.username,
                role: admin.role,
              }
            : null,
          req,
          metadata: {
            reason: admin ? "bad_password" : "unknown_identifier",
            identifier: identifier.slice(0, 200),
            ...(lock ? { accountLocked: true } : {}),
          },
        });
        return res.status(401).json({ error: "Identifiant ou mot de passe incorrect" });
      }

      
      if (admin.failed_attempts > 0 || admin.locked_until) {
        await query(
          "UPDATE admins SET failed_attempts = 0, locked_until = NULL WHERE id = $1",
          admin.id
        ).catch(() => {});
      }
      if (admin.status === "invited") {
        await recordAudit({
          action: "auth.login.blocked",
          entityType: "auth",
          entityId: admin.id,
          status: "failure",
          actor: admin,
          req,
          metadata: { reason: "invited" },
        });
        return res.status(403).json({
          error: "Compte non activé : utilisez le lien d'invitation reçu par email",
        });
      }
      if (admin.status === "blocked") {
        await recordAudit({
          action: "auth.login.blocked",
          entityType: "auth",
          entityId: admin.id,
          status: "failure",
          actor: admin,
          req,
          metadata: { reason: "blocked" },
        });
        return res.status(403).json({ error: "Compte bloqué. Contactez le superadmin." });
      }

      
      
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
          metadata: { method: "totp" },
        });
        res.setHeader(
          "Set-Cookie",
          mfaPendingCookie(req, createMfaPendingToken(admin.id), MFA_PENDING_SECONDS)
        );
        return res.status(200).json({ mfaRequired: true });
      }

      
      await recordLogin(req, admin);

      
      
      const token = createSessionToken(
        SESSION_MS,
        admin.id,
        sessionIssuedAt(admin.password_changed_at)
      );
      res.setHeader("Set-Cookie", sessionCookie(req, token, Math.floor(SESSION_MS / 1000)));
      return res.status(200).json({ success: true, admin: publicAdmin(admin) });
    }

    
    if (req.method === "GET") {
      const admin = await getSessionAdmin(req);
      return res
        .status(200)
        .json({ authenticated: !!admin, admin: admin ? publicAdmin(admin) : null });
    }

    
    if (req.method === "DELETE") {
      const admin = await getSessionAdmin(req);
      if (admin) {
        await recordAudit({
          action: "auth.logout",
          entityType: "auth",
          entityId: admin.id,
          actor: admin,
          req,
        });
      }
      res.setHeader("Set-Cookie", sessionCookie(req, "", 0));
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: unknown) {
    respondInternalError(res, error, "API /api/auth");
  }
}