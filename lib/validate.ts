const HTTPS_URL = /^https:\/\/[^\s]+$/i;

export function isHttpsUrl(value: unknown): value is string {
  return typeof value === "string" && HTTPS_URL.test(value.trim());
}

export function sanitizeGallery(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const out: string[] = [];
  for (const item of value) {
    if (!isHttpsUrl(item)) return null;
    const url = item.trim();
    if (!out.includes(url)) out.push(url);
    if (out.length > 30) return null;
  }
  return out;
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isOneOf<T extends string>(allowed: readonly T[]) {
  return (value: unknown): value is T =>
    typeof value === "string" && (allowed as readonly string[]).includes(value);
}

export function isNonEmptyString(value: unknown, max: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max;
}

export function isNonNegativeInt(value: unknown): value is number {
  return isFiniteNumber(value) && Number.isInteger(value) && value >= 0;
}

const ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

export function isValidId(value: unknown): value is string {
  return typeof value === "string" && ID_PATTERN.test(value);
}

export type PropertyInput = {
  id?: string;
  title?: unknown;
  type?: unknown;
  category?: unknown;
  city?: unknown;
  neighborhood?: unknown;
  price?: unknown;
  bedrooms?: unknown;
  bathrooms?: unknown;
  area?: unknown;
  image?: unknown;
  gallery?: unknown;
  description?: unknown;
  features?: unknown;
};

export function validateProperty(body: PropertyInput): string | null {
  if (body.id !== undefined && !isValidId(body.id)) return "Identifiant invalide";
  if (!isNonEmptyString(body.title, 200)) return "Le titre est obligatoire (200 caractères maximum)";
  if (!isOneOf(["Vente", "Location"] as const)(body.type)) {
    return "Le type doit être « Vente » ou « Location »";
  }
  if (!isNonEmptyString(body.category, 60)) return "La catégorie est obligatoire";
  if (!isNonEmptyString(body.city, 80)) return "La ville est obligatoire";
  if (!isNonEmptyString(body.neighborhood, 80)) return "Le quartier est obligatoire";
  if (!isFiniteNumber(body.price) || body.price < 0) return "Le prix est invalide";
  for (const [label, val] of [
    ["Nombre de chambres", body.bedrooms],
    ["Nombre de salles de bain", body.bathrooms],
    ["Surface", body.area],
  ] as const) {
    if (val !== undefined && val !== 0 && !isNonNegativeInt(val)) {
      return `${label} invalide`;
    }
  }
  if (body.description !== undefined && !isNonEmptyString(body.description, 5000)) {
    return "La description est trop longue";
  }
  if (body.image !== undefined && body.image !== "" && !isHttpsUrl(body.image)) {
    return "L'image doit être une adresse (lien) valide";
  }
  if (body.gallery !== undefined && sanitizeGallery(body.gallery) === null) {
    return "Les images doivent être des adresses (liens) valides (30 maximum)";
  }
  if (
    body.features !== undefined &&
    (!Array.isArray(body.features) ||
      body.features.length > 60 ||
      body.features.some((f) => !isNonEmptyString(f, 200)))
  ) {
    return "La liste des équipements est invalide";
  }
  return null;
}

export type VehicleInput = {
  id?: string;
  name?: unknown;
  brand?: unknown;
  type?: unknown;
  category?: unknown;
  year?: unknown;
  seats?: unknown;
  price?: unknown;
  city?: unknown;
  image?: unknown;
  gallery?: unknown;
  description?: unknown;
  features?: unknown;
};

export function validateVehicle(body: VehicleInput): string | null {
  if (body.id !== undefined && !isValidId(body.id)) return "Identifiant invalide";
  if (!isNonEmptyString(body.name, 120)) return "Le nom est obligatoire (120 caractères maximum)";
  if (!isNonEmptyString(body.brand, 80)) return "La marque est obligatoire";
  if (!isOneOf(["Vente", "Location"] as const)(body.type)) {
    return "Le type doit être « Vente » ou « Location »";
  }
  if (!isNonEmptyString(body.category, 60)) return "La catégorie est obligatoire";
  if (body.year !== undefined && !isNonNegativeInt(body.year)) return "L'année est invalide";
  if (body.seats !== undefined && !isNonNegativeInt(body.seats)) return "Le nombre de places est invalide";
  if (!isFiniteNumber(body.price) || body.price < 0) return "Le prix est invalide";
  if (!isNonEmptyString(body.city, 80)) return "La ville est obligatoire";
  if (body.image !== undefined && body.image !== "" && !isHttpsUrl(body.image)) {
    return "L'image doit être une adresse (lien) valide";
  }
  if (body.gallery !== undefined && sanitizeGallery(body.gallery) === null) {
    return "Les images doivent être des adresses (liens) valides (30 maximum)";
  }
  if (
    body.features !== undefined &&
    (!Array.isArray(body.features) ||
      body.features.length > 60 ||
      body.features.some((f) => !isNonEmptyString(f, 200)))
  ) {
    return "La liste des équipements est invalide";
  }
  return null;
}

export function validateService(body: {
  id?: string;
  title?: unknown;
  text?: unknown;
  points?: unknown;
}): string | null {
  if (body.id !== undefined && !isValidId(body.id)) return "Identifiant invalide";
  if (!isNonEmptyString(body.title, 120)) return "Le titre est obligatoire (120 caractères maximum)";
  if (body.text !== undefined && body.text !== null && !isNonEmptyString(body.text, 5000)) {
    return "La description est trop longue";
  }
  if (
    body.points !== undefined &&
    (!Array.isArray(body.points) ||
      body.points.length > 30 ||
      body.points.some((p) => !isNonEmptyString(p, 300)))
  ) {
    return "La liste des points est invalide";
  }
  return null;
}