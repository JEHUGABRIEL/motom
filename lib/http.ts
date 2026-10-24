import type { VercelRequest, VercelResponse } from "@vercel/node";


export function respondInternalError(
  res: VercelResponse,
  error: unknown,
  context: string
): void {
  console.error(`${context} error:`, error);
  const isDev = process.env.NODE_ENV !== "production";
  const message =
    isDev && error instanceof Error ? error.message : "Erreur interne du serveur";
  res.status(500).json({ error: message });
}


const HOST_ALLOWLIST = /^motom[a-z0-9-]*\.vercel\.app$/i;


export function siteOrigin(req: VercelRequest): string {
  const configured = process.env.PUBLIC_SITE_HOST;
  const raw = req.headers["x-forwarded-host"] || req.headers.host;
  const host = (Array.isArray(raw) ? raw[0] : raw)?.split(",")[0].trim();

  
  
  if (host && (host === configured || HOST_ALLOWLIST.test(host))) {
    const proto = host.startsWith("localhost") ? "http" : "https";
    return `${proto}://${host}`;
  }
  return `https://${configured || "motom-rca.vercel.app"}`;
}


const DEFAULT_ADMIN_URL = "https://motom-admin.vercel.app";

/**
 * URL publique du back-office (dépôt motom-admin). Les e-mails d'invitation et de
 * réinitialisation pointent vers cette origine, distincte de celle du site.
 */
export function adminOrigin(): string {
  const configured = process.env.ADMIN_URL?.trim();
  return (configured || DEFAULT_ADMIN_URL).replace(/\/+$/, "");
}


export function clientIp(req: VercelRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return value?.split(",")[0].trim() || "";
}
