import {
  createCipheriv,
  createDecipheriv,
  createHash,
  hkdfSync,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import * as OTPAuth from "otpauth";

export const APP_NAME = "MOTOM";
export const MAX_MFA_ATTEMPTS = 5;
export const MFA_LOCKOUT_MS = 15 * 60 * 1000;
export const RECOVERY_CODE_COUNT = 8;


function encryptionKey(): Buffer {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  
  
  return Buffer.from(hkdfSync("sha256", secret, "motom-mfa-v1", "mfa-secret-encryption", 32));
}


export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return `v1.${iv.toString("base64url")}.${enc.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}`;
}


export function decryptSecret(stored: string): string | null {
  try {
    const [version, iv, data, tag] = stored.split(".");
    if (version !== "v1" || !iv || !data || !tag) return null;
    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey(),
      Buffer.from(iv, "base64url")
    );
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(data, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}


export function createTotpSecret(): string {
  return new OTPAuth.Secret({ size: 20 }).base32;
}


export function totpUri(secret: string, label: string): string {
  return new OTPAuth.TOTP({
    issuer: APP_NAME,
    label,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  }).toString();
}


export function verifyTotp(secret: string, token: string): boolean {
  if (!/^\d{6}$/.test(token)) return false;
  const totp = new OTPAuth.TOTP({
    issuer: APP_NAME,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  return totp.validate({ token, window: 1 }) !== null;
}


export function generateRecoveryCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < RECOVERY_CODE_COUNT; i += 1) {
    const raw = randomBytes(5).toString("hex").toUpperCase();
    codes.push(`${raw.slice(0, 5)}-${raw.slice(5, 10)}`);
  }
  return codes;
}

export function normalizeRecoveryCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-F0-9]/g, "");
}

export function hashRecoveryCode(code: string): string {
  return createHash("sha256").update(normalizeRecoveryCode(code)).digest("hex");
}


export function consumeRecoveryCode(
  code: string,
  hashes: string[]
): { ok: boolean; remaining: string[] } {
  const candidate = hashRecoveryCode(code);
  const candidateBuf = Buffer.from(candidate, "hex");
  let matched = -1;
  
  
  for (let i = 0; i < hashes.length; i += 1) {
    const stored = Buffer.from(hashes[i], "hex");
    if (
      stored.length === candidateBuf.length &&
      timingSafeEqual(stored, candidateBuf) &&
      matched === -1
    ) {
      matched = i;
    }
  }
  if (matched === -1) return { ok: false, remaining: hashes };
  return { ok: true, remaining: hashes.filter((_, i) => i !== matched) };
}
