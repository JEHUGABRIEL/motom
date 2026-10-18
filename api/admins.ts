import { randomBytes, randomUUID } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { query } from "../lib/db.js";
import { requireAdmin, requireSuperAdmin } from "../lib/auth.js";
import { respondInternalError, siteOrigin } from "../lib/http.js";
import { sendInvitationEmail } from "../lib/email.js";
import { hashToken } from "../lib/password.js";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; 

function publicAdmin(row: {
  id: string;
  email: string;
  username: string | null;
  role: string;
  status: string;
  created_at?: string;
}) {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    role: row.role,
    status: row.status,
    createdAt: row.created_at ?? null,
  };
}


function inviteUrl(req: VercelRequest, token: string): string {
  return `${siteOrigin(req)}/admin/invite?token=${encodeURIComponent(token)}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    
    if (req.method === "GET") {
      const me = await requireAdmin(req, res);
      if (!me) return;

      if (me.role === "superadmin") {
        const rows = await query<{
          id: string;
          email: string;
          username: string | null;
          role: string;
          status: string;
          created_at: string;
        }>("SELECT id, email, username, role, status, created_at FROM admins ORDER BY created_at ASC");
        return res.status(200).json({ admins: rows.map(publicAdmin) });
      }

      
      const rows = await query<{
        id: string;
        email: string;
        username: string | null;
        role: string;
        status: string;
        created_at: string;
      }>(
        "SELECT id, email, username, role, status, created_at FROM admins WHERE id = $1",
        me.id
      );
      return res.status(200).json({ admins: rows.map(publicAdmin) });
    }

    
    if (req.method === "POST") {
      const me = await requireSuperAdmin(req, res);
      if (!me) return;

      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const email = String(body?.email ?? "").trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "Adresse email invalide" });
      }

      const existing = await query<{ id: string }>(
        "SELECT id FROM admins WHERE LOWER(email) = $1",
        email
      );
      if (existing[0]) {
        return res.status(409).json({ error: "Un admin existe déjà avec cet email" });
      }

      const id = `admin-${randomUUID().slice(0, 8)}`;
      const token = randomBytes(24).toString("hex");
      const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

      await query(
        "INSERT INTO admins (id, email, status, invite_token, invite_token_expires) VALUES ($1, $2, 'invited', $3, $4)",
        id,
        email,
        hashToken(token),
        expiresAt.toISOString()
      );

      const url = inviteUrl(req, token);
      const emailResult = await sendInvitationEmail({ to: email, inviteUrl: url });

      return res.status(201).json({
        success: true,
        admin: { id, email, username: null, role: "admin", status: "invited", createdAt: new Date().toISOString() },
        inviteUrl: url,
        emailSent: emailResult.sent,
        emailError: emailResult.error ?? null,
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: unknown) {
    respondInternalError(res, error, "API /api/admins");
  }
}