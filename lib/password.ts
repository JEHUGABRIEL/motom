import { createHash, randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";


export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}


export function verifyPassword(password: string, stored: string): boolean {
  try {
    const parts = stored.split("$");
    if (parts.length !== 3 || parts[0] !== "scrypt") return false;
    const [, salt, hash] = parts;
    const candidate = scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
  } catch {
    return false;
  }
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}


/**
 * Règles de complexité d'un mot de passe définitif : 8 caractères minimum,
 * une majuscule, un chiffre et un caractère spécial. Retourne la liste des
 * critères manquants (vide = mot de passe valide).
 */
export function passwordIssues(password: string): string[] {
  const issues: string[] = [];
  if (password.length < 8) issues.push("8 caractères minimum");
  if (!/[A-Z]/.test(password)) issues.push("une majuscule");
  if (!/[0-9]/.test(password)) issues.push("un chiffre");
  if (!/[^A-Za-z0-9]/.test(password)) issues.push("un caractère spécial");
  return issues;
}

const TEMP_PASSWORD_ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%*?+";


/**
 * Mot de passe temporaire aléatoire (crypto.randomInt), garanti conforme aux
 * règles de complexité pour ne jamais produire un secret refusé au changement.
 */
export function generateTempPassword(length = 12): string {
  const pick = (alphabet: string) => alphabet[randomInt(0, alphabet.length)];
  const chars = [
    pick("ABCDEFGHJKLMNPQRSTUVWXYZ"),
    pick("abcdefghijkmnopqrstuvwxyz"),
    pick("23456789"),
    pick("!@#$%*?+"),
  ];
  while (chars.length < length) chars.push(pick(TEMP_PASSWORD_ALPHABET));
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}


/** Code à 6 chiffres, tiré au hasard cryptographique. */
export function generateOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}
