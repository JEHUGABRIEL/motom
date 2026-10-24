import { describe, it, expect } from "vitest";
import {
  isPromoExpired,
  isPromoActive,
  formatPromoEnd,
  promoCountdown,
  promoEndsAtToIso,
} from "./promo";

const past = new Date(Date.now() - 60_000).toISOString();
const future = new Date(Date.now() + 60 * 60_000).toISOString();

describe("isPromoExpired", () => {
  it("retourne false sans date de fin", () => {
    expect(isPromoExpired(null)).toBe(false);
    expect(isPromoExpired(undefined)).toBe(false);
    expect(isPromoExpired("")).toBe(false);
  });

  it("détecte une date passée, pas une date future", () => {
    expect(isPromoExpired(past)).toBe(true);
    expect(isPromoExpired(future)).toBe(false);
  });

  it("retourne false sur une date illisible", () => {
    expect(isPromoExpired("pas-une-date")).toBe(false);
  });
});

describe("isPromoActive", () => {
  it("promo désactivée → inactive", () => {
    expect(isPromoActive({ promo: false, promoEndsAt: future })).toBe(false);
    expect(isPromoActive({ promo: false })).toBe(false);
  });

  it("promo activée sans échéance ou avec échéance future → active", () => {
    expect(isPromoActive({ promo: true })).toBe(true);
    expect(isPromoActive({ promo: true, promoEndsAt: future })).toBe(true);
  });

  it("promo activée mais échue → inactive", () => {
    expect(isPromoActive({ promo: true, promoEndsAt: past })).toBe(false);
  });
});

describe("formatPromoEnd", () => {
  it("formate en jj/mm/aaaa selon la langue", () => {
    const d = new Date(2026, 8, 15); // 15 septembre 2026 (heure locale)
    expect(formatPromoEnd(d.toISOString(), "fr")).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    expect(formatPromoEnd(d.toISOString(), "en")).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it("retourne la valeur d'origine si la date est illisible", () => {
    expect(formatPromoEnd("nawak", "fr")).toBe("nawak");
  });
});

describe("promoCountdown", () => {
  it("null sans échéance ou déjà échue", () => {
    expect(promoCountdown(null)).toBeNull();
    expect(promoCountdown(undefined)).toBeNull();
    expect(promoCountdown(past)).toBeNull();
  });

  it("calcule jours / heures / minutes restants", () => {
    const in90min = Date.now() + 90 * 60_000 + 30_000;
    expect(promoCountdown(new Date(in90min).toISOString())).toEqual({
      days: 0,
      hours: 1,
      minutes: 30,
    });

    const in2d3h = Date.now() + (2 * 1440 + 180) * 60_000 + 30_000;
    expect(promoCountdown(new Date(in2d3h).toISOString())).toEqual({
      days: 2,
      hours: 3,
      minutes: 0,
    });
  });
});

describe("promoEndsAtToIso", () => {
  it("convertit un datetime-local en ISO valide", () => {
    const iso = promoEndsAtToIso("2026-09-15T14:30");
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(Number.isNaN(new Date(iso as string).getTime())).toBe(false);
  });

  it("retourne null sur valeur absente ou illisible", () => {
    expect(promoEndsAtToIso(null)).toBeNull();
    expect(promoEndsAtToIso("")).toBeNull();
    expect(promoEndsAtToIso("pas-une-date")).toBeNull();
    expect(promoEndsAtToIso("2026-13-45T99:99")).toBeNull();
  });
});