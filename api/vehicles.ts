import type { VercelRequest, VercelResponse } from "@vercel/node";
import { query, serializeVehicle } from "../lib/db.js";
import { requireAdmin } from "../lib/auth.js";
import { respondInternalError } from "../lib/http.js";
import {
  sanitizeGallery,
  isHttpsUrl,
  isNonEmptyString,
  isFiniteNumber,
  isOneOf,
  isValidId,
} from "../lib/validate.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  

  try {
    if (req.method === "GET") {
      const { type } = req.query;
      let rows;
      if (type && (type === "Vente" || type === "Location")) {
        rows = await query(
          "SELECT * FROM vehicles WHERE type = $1 ORDER BY featured DESC, id ASC",
          type
        );
      } else {
        rows = await query("SELECT * FROM vehicles ORDER BY featured DESC, id ASC");
      }
      return res.status(200).json(rows.map(serializeVehicle));
    }

    if (req.method === "POST") {
      if (!await requireAdmin(req, res)) return;
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const {
        id, name, brand, type, category, year, seats, transmission, fuel,
        mileage, price, priceUnit, city, featured, promo, promoEndsAt, available, withDriver,
        image, gallery, description, features
      } = body;

      
      if (!isValidId(id)) {
        return res.status(400).json({ error: "Identifiant invalide." });
      }
      if (!isNonEmptyString(name, 120)) {
        return res.status(400).json({ error: "Le nom est obligatoire." });
      }
      if (image !== undefined && image !== "" && !isHttpsUrl(image)) {
        return res.status(400).json({ error: "L'image doit être une adresse https valide." });
      }
      if (!isOneOf(["Vente", "Location"] as const)(type)) {
        return res.status(400).json({ error: "Le type doit être Vente ou Location." });
      }
      if (!isFiniteNumber(price) || price < 0) {
        return res.status(400).json({ error: "Le prix est invalide." });
      }
      if (gallery === undefined || gallery === null || !Array.isArray(gallery) || gallery.length === 0) {
        return res.status(400).json({ error: "Au moins une photo est obligatoire pour publier ce véhicule." });
      }
      if (sanitizeGallery(gallery) === null) {
        return res.status(400).json({ error: "Les images doivent être des adresses (liens) valides." });
      }
      let promoEndsAtValue: string | null = null;
      if (promoEndsAt !== undefined && promoEndsAt !== null && promoEndsAt !== "") {
        const d = new Date(String(promoEndsAt));
        if (Number.isNaN(d.getTime())) {
          return res.status(400).json({ error: "Date de fin de promo invalide." });
        }
        promoEndsAtValue = d.toISOString();
      }

      await query(
        `INSERT INTO vehicles (id, name, brand, type, category, year, seats,
          transmission, fuel, mileage, price, price_unit, city, featured, promo,
          promo_ends_at, available, with_driver, image, gallery, description, features, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22, NOW())`,
        id, name, brand || "", type, category || "", year || 0, seats || 0,
        transmission || "", fuel || "", mileage ?? null, price || 0,
        priceUnit || "FCFA", city || "", featured || false, promo || false,
        promoEndsAtValue, available !== false, withDriver || false, image || "",
        JSON.stringify(sanitizeGallery(gallery) ?? []), description || "",
        JSON.stringify(features || [])
      );

      return res.status(201).json({ success: true, id });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: unknown) {
    respondInternalError(res, error, "API /api/vehicles");
  }
}