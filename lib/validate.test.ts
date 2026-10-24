import { describe, it, expect } from "vitest";
import {
  isHttpsUrl,
  sanitizeGallery,
  isValidId,
  isNonEmptyString,
  isNonNegativeInt,
  isOneOf,
  isFiniteNumber,
  validateProperty,
  validateVehicle,
  validateService,
} from "./validate.js";

describe("isHttpsUrl", () => {
  it("accepte les liens https", () => {
    expect(isHttpsUrl("https://example.com/photo.jpg")).toBe(true);
    expect(isHttpsUrl("  https://example.com  ")).toBe(true);
  });

  it("refuse tout ce qui n'est pas https://", () => {
    expect(isHttpsUrl("http://example.com")).toBe(false);
    expect(isHttpsUrl("javascript:alert(1)")).toBe(false);
    expect(isHttpsUrl("ftp://example.com")).toBe(false);
    expect(isHttpsUrl("https://")).toBe(false);
    expect(isHttpsUrl(42)).toBe(false);
    expect(isHttpsUrl(undefined)).toBe(false);
  });
});

describe("sanitizeGallery", () => {
  it("accepte une liste d'images https valides", () => {
    expect(
      sanitizeGallery(["https://a.com/1.jpg", "https://b.com/2.jpg"]),
    ).toEqual(["https://a.com/1.jpg", "https://b.com/2.jpg"]);
  });

  it("déduplique les doublons", () => {
    expect(sanitizeGallery(["https://a.com/1.jpg", "https://a.com/1.jpg"])).toEqual([
      "https://a.com/1.jpg",
    ]);
  });

  it("refuse un tableau vide d'éléments invalides ou non-tableau", () => {
    expect(sanitizeGallery(null)).toBeNull();
    expect(sanitizeGallery("https://a.com")).toBeNull();
    expect(sanitizeGallery(["http://insecure.com"])).toBeNull();
    expect(sanitizeGallery(["javascript:alert(1)"])).toBeNull();
    expect(sanitizeGallery([42 as unknown as string])).toBeNull();
  });

  it("refuse plus de 30 images", () => {
    const many = Array.from({ length: 31 }, (_, i) => `https://a.com/${i}.jpg`);
    expect(sanitizeGallery(many)).toBeNull();
    expect(sanitizeGallery(many.slice(0, 30))).toHaveLength(30);
  });
});

describe("isValidId", () => {
  it("accepte les identifiants alphanumériques avec - et _", () => {
    expect(isValidId("demo-villa-1")).toBe(true);
    expect(isValidId("a_b")).toBe(true);
    expect(isValidId("1abc")).toBe(true);
  });

  it("refuse espaces, slashes, commence par tiret ou vide", () => {
    expect(isValidId("")).toBe(false);
    expect(isValidId("a b")).toBe(false);
    expect(isValidId("a/b")).toBe(false);
    expect(isValidId("../etc/passwd")).toBe(false);
    expect(isValidId("-abc")).toBe(false);
    expect(isValidId("sql; drop table")).toBe(false);
  });
});

describe("petits prédicats", () => {
  it("isNonEmptyString respecte la longueur maximale", () => {
    expect(isNonEmptyString("titre", 10)).toBe(true);
    expect(isNonEmptyString("", 10)).toBe(false);
    expect(isNonEmptyString("   ", 10)).toBe(false);
    expect(isNonEmptyString("0123456789A", 10)).toBe(false);
    expect(isNonEmptyString(12, 10)).toBe(false);
  });

  it("isNonNegativeInt n'accepte que les entiers ≥ 0", () => {
    expect(isNonNegativeInt(0)).toBe(true);
    expect(isNonNegativeInt(7)).toBe(true);
    expect(isNonNegativeInt(-1)).toBe(false);
    expect(isNonNegativeInt(1.5)).toBe(false);
    expect(isNonNegativeInt(NaN)).toBe(false);
    expect(isNonNegativeInt("3")).toBe(false);
  });

  it("isOneOf et isFiniteNumber", () => {
    const type = isOneOf(["Vente", "Location"] as const);
    expect(type("Vente")).toBe(true);
    expect(type("Location")).toBe(true);
    expect(type("Échange")).toBe(false);
    expect(isFiniteNumber(10)).toBe(true);
    expect(isFiniteNumber(Infinity)).toBe(false);
    expect(isFiniteNumber("10")).toBe(false);
  });
});

describe("validateProperty", () => {
  const valid = {
    id: "demo-villa",
    title: "Villa moderne",
    type: "Vente",
    category: "Villa",
    city: "Bangui",
    neighborhood: "PK11",
    price: 25000000,
  };

  it("accepte un bien minimal valide", () => {
    expect(validateProperty(valid)).toBeNull();
  });

  it("accepte un bien complet avec images et équipements", () => {
    expect(
      validateProperty({
        ...valid,
        bedrooms: 4,
        bathrooms: 2,
        area: 300,
        image: "https://img.com/1.jpg",
        gallery: ["https://img.com/1.jpg", "https://img.com/2.jpg"],
        description: "Belle villa",
        features: ["Piscine", "Garage"],
      }),
    ).toBeNull();
  });

  it("refuse les champs obligatoires manquants ou invalides", () => {
    expect(validateProperty({ ...valid, title: "" })).toBeTruthy();
    expect(validateProperty({ ...valid, type: "Échange" })).toBeTruthy();
    expect(validateProperty({ ...valid, price: -1 })).toBeTruthy();
    expect(validateProperty({ ...valid, price: "1000" })).toBeTruthy();
    expect(validateProperty({ ...valid, city: "" })).toBeTruthy();
    expect(validateProperty({ ...valid, id: "mauvais id" })).toBeTruthy();
  });

  it("refuse images et galeries non https ou invalides", () => {
    expect(validateProperty({ ...valid, image: "http://x.com/1.jpg" })).toBeTruthy();
    expect(
      validateProperty({ ...valid, gallery: ["javascript:alert(1)"] }),
    ).toBeTruthy();
    expect(validateProperty({ ...valid, gallery: "https://x.com" })).toBeTruthy();
  });

  it("contraint les compteurs, la description et les équipements", () => {
    expect(validateProperty({ ...valid, bedrooms: -2 })).toBeTruthy();
    expect(validateProperty({ ...valid, bedrooms: 1.5 })).toBeTruthy();
    expect(validateProperty({ ...valid, description: "x".repeat(5001) })).toBeTruthy();
    expect(validateProperty({ ...valid, features: [42] })).toBeTruthy();
    expect(
      validateProperty({ ...valid, features: Array.from({ length: 61 }, () => "f") }),
    ).toBeTruthy();
  });

  it("accepte image vide (absence d'image)", () => {
    expect(validateProperty({ ...valid, image: "" })).toBeNull();
  });
});

describe("validateVehicle", () => {
  const valid = {
    id: "demo-voiture",
    name: "Toyota Corolla",
    brand: "Toyota",
    type: "Location",
    category: "Berline",
    price: 25000,
    city: "Bangui",
  };

  it("accepte un véhicule valide", () => {
    expect(validateVehicle(valid)).toBeNull();
    expect(
      validateVehicle({ ...valid, year: 2020, seats: 5, gallery: ["https://a.com/1.jpg"] }),
    ).toBeNull();
  });

  it("refuse les champs obligatoires manquants ou invalides", () => {
    expect(validateVehicle({ ...valid, name: "" })).toBeTruthy();
    expect(validateVehicle({ ...valid, brand: "" })).toBeTruthy();
    expect(validateVehicle({ ...valid, type: "Location saisonnière" })).toBeTruthy();
    expect(validateVehicle({ ...valid, price: -5 })).toBeTruthy();
    expect(validateVehicle({ ...valid, year: -2020 })).toBeTruthy();
    expect(validateVehicle({ ...valid, seats: 2.5 })).toBeTruthy();
    expect(validateVehicle({ ...valid, image: "http://x.com/car.jpg" })).toBeTruthy();
  });
});

describe("validateService", () => {
  it("accepte un service minimal", () => {
    expect(validateService({ id: "transport", title: "Transport" })).toBeNull();
  });

  it("refuse titre vide ou points invalides", () => {
    expect(validateService({ title: "" })).toBeTruthy();
    expect(validateService({ title: "T", points: ["ok", 12] })).toBeTruthy();
    expect(
      validateService({ title: "T", points: Array.from({ length: 31 }, () => "p") }),
    ).toBeTruthy();
    expect(validateService({ title: "T", id: "mauvais id" })).toBeTruthy();
  });
});