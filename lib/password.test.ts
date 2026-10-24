import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  hashToken,
  passwordIssues,
  generateTempPassword,
  generateOtpCode,
} from "./password.js";

describe("hashPassword", () => {
  it("produit un hash au format scrypt$sel$empreinte", () => {
    const stored = hashPassword("mon-mot-de-passe");
    const [algo, salt, hash] = stored.split("$");
    expect(algo).toBe("scrypt");
    expect(salt).toMatch(/^[0-9a-f]{32}$/);
    expect(hash).toMatch(/^[0-9a-f]{128}$/);
  });

  it("génère un sel différent à chaque appel (mots de passe identiques, hashes différents)", () => {
    expect(hashPassword("identique")).not.toBe(hashPassword("identique"));
  });
});

describe("verifyPassword", () => {
  it("accepte le bon mot de passe", () => {
    expect(verifyPassword("781227Xy*", hashPassword("781227Xy*"))).toBe(true);
  });

  it("refuse un mot de passe faux", () => {
    expect(verifyPassword("faux", hashPassword("bon"))).toBe(false);
    expect(verifyPassword("", hashPassword("bon"))).toBe(false);
  });

  it("refuse les valeurs hash malformées sans lever d'exception", () => {
    expect(verifyPassword("x", "")).toBe(false);
    expect(verifyPassword("x", "nimporte-quoi")).toBe(false);
    expect(verifyPassword("x", "scrypt$sans-deuxieme-partie")).toBe(false);
    expect(verifyPassword("x", "bcrypt$aa$bb")).toBe(false);
    expect(verifyPassword("x", "scrypt$zz$zz")).toBe(false);
    expect(verifyPassword("x", "scrypt$a$b")).toBe(false);
  });

  it("refuse un hash corrompu même si le format semble valide", () => {
    const stored = hashPassword("bon");
    const [algo, salt] = stored.split("$");
    expect(verifyPassword("bon", `${algo}$${salt}$${"0".repeat(128)}`)).toBe(false);
  });
});

describe("passwordIssues", () => {
  it("accepte un mot de passe conforme", () => {
    expect(passwordIssues("Motdepasse1!*")).toEqual([]);
  });

  it("signale chaque critère manquant", () => {
    expect(passwordIssues("")).toEqual([
      "8 caractères minimum",
      "une majuscule",
      "un chiffre",
      "un caractère spécial",
    ]);
    expect(passwordIssues("motdepasse")).toEqual([
      "une majuscule",
      "un chiffre",
      "un caractère spécial",
    ]);
    expect(passwordIssues("Motdepasse1")).toEqual(["un caractère spécial"]);
    expect(passwordIssues("Motdepasse!")).toEqual(["un chiffre"]);
    expect(passwordIssues("motdepasse1!")).toEqual(["une majuscule"]);
    expect(passwordIssues("Mot1!")).toEqual(["8 caractères minimum"]);
  });
});

describe("generateTempPassword", () => {
  it("respecte la longueur et les règles de complexité", () => {
    for (let i = 0; i < 50; i += 1) {
      const temp = generateTempPassword();
      expect(temp).toHaveLength(12);
      expect(passwordIssues(temp)).toEqual([]);
    }
  });

  it("ne se répète pas", () => {
    const generated = new Set(Array.from({ length: 50 }, () => generateTempPassword()));
    expect(generated.size).toBe(50);
  });
});

describe("generateOtpCode", () => {
  it("produit toujours 6 chiffres", () => {
    for (let i = 0; i < 100; i += 1) {
      expect(generateOtpCode()).toMatch(/^\d{6}$/);
    }
  });
});

describe("hashToken", () => {
  it("retourne un sha256 hexadécimal de 64 caractères, stable", () => {
    const h = hashToken("jeton-de-test");
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken("jeton-de-test")).toBe(h);
  });

  it("différents jetons → différentes empreintes", () => {
    expect(hashToken("a")).not.toBe(hashToken("b"));
  });
});