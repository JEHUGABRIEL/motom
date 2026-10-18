import type { VercelRequest, VercelResponse } from "@vercel/node";
import { query } from "../lib/db.js";
import { requireAdmin } from "../lib/auth.js";
import { respondInternalError } from "../lib/http.js";
import { partialUpdate, textField, booleanField } from "../lib/update.js";
import { isValidId } from "../lib/validate.js";

const SERVICE_FIELDS = [
  { key: "title", column: "title", validate: textField(120) },
  { key: "text", column: "text", validate: textField(5000) },
  { key: "points", column: "points" },
  { key: "active", column: "active", validate: booleanField() },
] as const;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "PUT" || req.method === "DELETE") {
      if (!await requireAdmin(req, res)) return;
      const { id } = req.query;
      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Missing service id" });
      }
      if (req.method === "PUT") {
        const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
        const ok = await partialUpdate(
          res,
          "services",
          id,
          SERVICE_FIELDS as unknown as Parameters<typeof partialUpdate>[3],
          body ?? {}
        );
        if (!ok) return;
        return res.status(200).json({ success: true });
      }
      await query("DELETE FROM services WHERE id = $1", id);
      return res.status(200).json({ success: true });
    }

    if (req.method === "GET") {
      const { all } = req.query;
      let rows;
      if (all === "1") {
        if (!await requireAdmin(req, res)) return;
        rows = await query("SELECT * FROM services ORDER BY id ASC");
      } else {
        rows = await query(
          "SELECT * FROM services WHERE active = true ORDER BY id ASC"
        );
      }
      return res.status(200).json(rows);
    }

    if (req.method === "POST") {
      if (!await requireAdmin(req, res)) return;
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { id, title, text, points, active } = body;

      if (!isValidId(id)) {
        return res.status(400).json({ error: "Identifiant invalide." });
      }
      if (!title || typeof title !== "string" || title.length > 120) {
        return res.status(400).json({ error: "Le titre est obligatoire." });
      }
      if (points !== undefined && (!Array.isArray(points) || points.some((p: unknown) => typeof p !== "string" || (p as string).length > 300))) {
        return res.status(400).json({ error: "La liste des points est invalide." });
      }
      if (text !== undefined && (typeof text !== "string" || text.length > 5000)) {
        return res.status(400).json({ error: "La description est trop longue." });
      }

      await query(
        `INSERT INTO services (id, title, text, points, active, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())`,
        id, title, text || "", JSON.stringify(points || []),
        active !== false
      );

      return res.status(201).json({ success: true, id });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: unknown) {
    respondInternalError(res, error, "API /api/services");
  }
}