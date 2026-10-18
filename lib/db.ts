import { neon } from "@neondatabase/serverless";
import { Agent } from "undici";

let sql: ReturnType<typeof neon> | null = null;

export function getDb() {
  if (!sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    sql = neon(url, {
      fetchOptions: { dispatcher: new Agent({ connect: { family: 4 } }) },
    });
  }
  return sql;
}

export type QueryResult<T> = T[];


export async function query<T = Record<string, unknown>>(
  text: string,
  ...values: unknown[]
): Promise<T[]> {
  const db = getDb();
  return db.query(text, values) as Promise<T[]>;
}


function promoState(row: Record<string, unknown>): { promo: boolean; promoEndsAt: string | null } {
  const endsAt = (row.promo_ends_at as string) || null;
  
  
  const expired = endsAt !== null && new Date(endsAt).getTime() <= Date.now();
  if (expired) return { promo: false, promoEndsAt: null };
  return { promo: Boolean(row.promo), promoEndsAt: endsAt };
}

export function serializeProperty(row: Record<string, unknown>) {
  const promo = promoState(row);
  return {
    id: row.id as string,
    title: row.title as string,
    type: row.type as string,
    category: row.category as string,
    city: row.city as string,
    neighborhood: row.neighborhood as string,
    price: Number(row.price ?? 0),
    priceUnit: (row.price_unit as string) || "FCFA",
    bedrooms: Number(row.bedrooms ?? 0),
    bathrooms: Number(row.bathrooms ?? 0),
    area: Number(row.area ?? 0),
    featured: Boolean(row.featured),
    promo: promo.promo,
    promoPaused: Boolean(row.promo_paused),
    promoEndsAt: promo.promoEndsAt,
    image: (row.image as string) || "",
    gallery: Array.isArray(row.gallery) ? row.gallery : [],
    description: (row.description as string) || "",
    features: Array.isArray(row.features) ? row.features : [],
    created_at: (row.created_at as string) || "",
  };
}


export function serializeVehicle(row: Record<string, unknown>) {
  const promo = promoState(row);
  return {
    id: row.id as string,
    name: row.name as string,
    brand: (row.brand as string) || "",
    type: row.type as string,
    category: (row.category as string) || "",
    year: Number(row.year ?? 0),
    seats: Number(row.seats ?? 0),
    transmission: (row.transmission as string) || "",
    fuel: (row.fuel as string) || "",
    mileage: row.mileage == null ? undefined : Number(row.mileage),
    price: Number(row.price ?? 0),
    priceUnit: (row.price_unit as string) || "FCFA",
    city: (row.city as string) || "",
    featured: Boolean(row.featured),
    promo: promo.promo,
    promoPaused: Boolean(row.promo_paused),
    promoEndsAt: promo.promoEndsAt,
    available: row.available !== false,
    withDriver: Boolean(row.with_driver),
    image: (row.image as string) || "",
    gallery: Array.isArray(row.gallery) ? row.gallery : [],
    description: (row.description as string) || "",
    features: Array.isArray(row.features) ? row.features : [],
    created_at: (row.created_at as string) || "",
  };
}
