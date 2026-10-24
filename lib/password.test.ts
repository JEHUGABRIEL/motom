import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, hashToken } from "./password.js";

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