import type { VercelRequest, VercelResponse } from "@vercel/node";
import { query, serializeProperty } from "../../lib/db.js";
import { requireAdmin } from "../../lib/auth.js";
import { respondInternalError } from "../../lib/http.js";
import { partialUpdate, textField, numberField, oneOfField, booleanField, dateOrNullField } from "../../lib/update.js";

const PROPERTY_FIELDS = [
  { key: "title", column: "title", validate: textField(200) },
  { key: "type", column: "type", validate: oneOfField(["Vente", "Location"]) },
  { key: "category", column: "category", validate: textField(60) },
  { key: "city", column: "city", validate: textField(80) },
  { key: "neighborhood", column: "neighborhood", validate: textField(80) },
  { key: "price", column: "price", validate: numberField() },
  { key: "priceUnit", column: "price_unit", validate: oneOfField(["FCFA", "FCFA/mois", "FCFA/nuit"]) },
  { key: "bedrooms", column: "bedrooms", validate: numberField() },
  { key: "bathrooms", column: "bathrooms", validate: numberField() },
  { key: "area", column: "area", validate: numberField() },
  { key: "featured", column: "featured", validate: booleanField() },
  { key: "promo", column: "promo", validate: booleanField() },
  { key: "promoPaused", column: "promo_paused", validate: booleanField() },
  { key: "promoEndsAt", column: "promo_ends_at", validate: dateOrNullField() },
  { key: "image", column: "image" },
  { key: "gallery", column: "gallery" },
  { key: "description", column: "description", validate: textField(5000) },
  { key: "features", column: "features" },
] as const;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Missing property id" });
  }

  try {
    if (req.method === "GET") {
      const rows = await query("SELECT * FROM properties WHERE id = $1", id);
      if (rows.length === 0) {
        return res.status(404).json({ error: "Property not found" });
      }
      return res.status(200).json(serializeProperty(rows[0]));
    }

    if (req.method === "PUT") {
      if (!await requireAdmin(req, res)) return;
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const ok = await partialUpdate(
        res,
        "properties",
        id,
        PROPERTY_FIELDS as unknown as Parameters<typeof partialUpdate>[3],
        body ?? {}
      );
      if (!ok) return;
      return res.status(200).json({ success: true });
    }

    if (req.method === "DELETE") {
      if (!await requireAdmin(req, res)) return;
      await query("DELETE FROM properties WHERE id = $1", id);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: unknown) {
    respondInternalError(res, error, `API /api/properties/${id}`);
  }
}
