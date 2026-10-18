import crypto from "crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { query } from "./db.js";

const COOKIE_NAME = "motom_admin";

export type AdminUser = {
  id: string;
  email: string;
  username: string | null;
  role: "superadmin" | "admin";
  status: "invited" | "active" | "blocked";
  avatar?: string | null;
};


function getSessionSecret(): string {
  
  
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return secret;
}

function sign(payload: string): string {
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("hex");
}


export function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}


export function sessionIssuedAt(passwordChangedAt: string | null | undefined): number {
  const now = Date.now();
  if (!passwordChangedAt) return now;
  const changedAt = new Date(passwordChangedAt).getTime();
  return Number.isFinite(changedAt) ? Math.max(now, changedAt) : now;
}


export function createSessionToken(
  sessionMs: number,
  adminId: string,
  issuedAt: number = Date.now()
): string {
  const iat = String(issuedAt);
  const exp = String(issuedAt + sessionMs);
  return `${exp}.${iat}.${adminId}.${sign(`${exp}.${iat}.${adminId}`)}`;
}

function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    out[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
  }
  return out;
}

export function isSecure(req: VercelRequest): boolean {
  const proto = req.headers["x-forwarded-proto"];
  const first = (Array.isArray(proto) ? proto[0] : proto)?.split(",")[0].trim();
  return first === "https";
}

type SessionPayload = { exp: string; iat: string; adminId: string } | null;

function parseSessionToken(token: string): SessionPayload {
  try {
    const parts = token.split(".");
    if (parts.length !== 4) return null;
    const [exp, iat, adminId, sig] = parts;
    if (!/^\d+$/.test(exp) || !/^\d+$/.test(iat) || !adminId) return null;
    if (Date.now() > Number(exp)) return null;
    const expected = sign(`${exp}.${iat}.${adminId}`);
    const ok =
      Buffer.from(sig).length === Buffer.from(expected).length &&
      crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    if (!ok) return null;
    return { exp, iat, adminId };
  } catch {
    return null;
  }
}

function getSessionToken(req: VercelRequest): string | undefined {
  return parseCookies(req.headers.cookie)[COOKIE_NAME];
}


export async function getSessionAdmin(req: VercelRequest): Promise<AdminUser | null> {
  try {
    const token = getSessionToken(req);
    if (!token) return null;
    const payload = parseSessionToken(token);
    if (!payload) return null;

    const rows = await query<
      AdminUser & { password_hash: string | null; password_changed_at: string | null }
    >(
      "SELECT id, email, username, role, status, password_hash, avatar, password_changed_at FROM admins WHERE id = $1",
      payload.adminId
    );
    const admin = rows[0];
    if (!admin) return null;
    if (admin.status !== "active") return null;

    
    if (admin.password_changed_at) {
      const changedAt = new Date(admin.password_changed_at).getTime();
      if (Number.isFinite(changedAt) && Number(payload.iat) < changedAt) return null;
    }

    return {
      id: admin.id,
      email: admin.email,
      username: admin.username,
      role: admin.role,
      status: admin.status,
      avatar: admin.avatar ?? null,
    };
  } catch {
    return null;
  }
}

const MFA_COOKIE_NAME = "motom_mfa";
const MFA_PENDING_MS = 10 * 60 * 1000;


export function createMfaPendingToken(adminId: string): string {
  const exp = String(Date.now() + MFA_PENDING_MS);
  
  
  return `${exp}.${adminId}.${sign(`mfa.${exp}.${adminId}`)}`;
}


export function readMfaPending(req: VercelRequest): string | null {
  try {
    const token = parseCookies(req.headers.cookie)[MFA_COOKIE_NAME];
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [exp, adminId, sig] = parts;
    if (!/^\d+$/.test(exp) || !adminId) return null;
    if (Date.now() > Number(exp)) return null;
    const expected = sign(`mfa.${exp}.${adminId}`);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    return adminId;
  } catch {
    return null;
  }
}


export function mfaPendingCookie(req: VercelRequest, value: string, maxAge: number): string {
  const parts = [
    `${MFA_COOKIE_NAME}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (isSecure(req)) parts.push("Secure");
  return parts.join("; ");
}

export const MFA_PENDING_SECONDS = Math.floor(MFA_PENDING_MS / 1000);


export function sessionCookie(req: VercelRequest, value: string, maxAge: number): string {
  const parts = [
    `${COOKIE_NAME}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (isSecure(req)) parts.push("Secure");
  return parts.join("; ");
}


export async function requireAdmin(
  req: VercelRequest,
  res: VercelResponse
): Promise<AdminUser | null> {
  const admin = await getSessionAdmin(req);
  if (!admin) {
    res.status(401).json({ error: "Non autorisé" });
    return null;
  }
  return admin;
}


export async function requireSuperAdmin(
  req: VercelRequest,
  res: VercelResponse
): Promise<AdminUser | null> {
  const admin = await requireAdmin(req, res);
  if (!admin) return null;
  if (admin.role !== "superadmin") {
    res.status(403).json({ error: "Accès réservé au superadmin" });
    return null;
  }
  return admin;
}
