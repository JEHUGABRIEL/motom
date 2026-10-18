import type { VercelRequest, VercelResponse } from "@vercel/node";
import { query } from "../lib/db.js";
import { requireAdmin } from "../lib/auth.js";
import { respondInternalError } from "../lib/http.js";
import { isValidId } from "../lib/validate.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "PUT" || req.method === "DELETE") {
      if (!await requireAdmin(req, res)) return;
      const { id } = req.query;
      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Identifiant manquant." });
      }
      if (req.method === "PUT") {
        const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
        const { question, answer, active, position } = body;
        if (question !== undefined && (typeof question !== "string" || question.trim() === "" || question.length > 300)) {
          return res.status(400).json({ error: "La question est obligatoire." });
        }
        if (answer !== undefined && (typeof answer !== "string" || answer.trim() === "" || answer.length > 5000)) {
          return res.status(400).json({ error: "La réponse est obligatoire." });
        }
        const sets: string[] = [];
        const values: unknown[] = [];
        if (question !== undefined) {
          sets.push(`question = $${sets.length + 1}`);
          values.push(String(question).trim());
        }
        if (answer !== undefined) {
          sets.push(`answer = $${sets.length + 1}`);
          values.push(String(answer).trim());
        }
        if (active !== undefined) {
          sets.push(`active = $${sets.length + 1}`);
          values.push(Boolean(active));
        }
        if (position !== undefined) {
          sets.push(`position = $${sets.length + 1}`);
          values.push(Number(position));
        }
        if (sets.length === 0) {
          return res.status(400).json({ error: "Aucune modification fournie." });
        }
        values.push(id);
        await query(
          `UPDATE faqs SET ${sets.join(", ")} WHERE id = $${values.length}`,
          ...values
        );
        return res.status(200).json({ success: true });
      }
      await query("DELETE FROM faqs WHERE id = $1", id);
      return res.status(200).json({ success: true });
    }

    if (req.method === "GET") {
      const { all } = req.query;
      let rows;
      if (all === "1") {
        if (!await requireAdmin(req, res)) return;
        rows = await query("SELECT * FROM faqs ORDER BY position ASC, created_at ASC");
      } else {
        rows = await query(
          "SELECT * FROM faqs WHERE active = true ORDER BY position ASC, created_at ASC"
        );
      }
      return res.status(200).json(rows);
    }

    if (req.method === "POST") {
      if (!await requireAdmin(req, res)) return;
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { id, question, answer, active, position } = body;

      if (!isValidId(id)) {
        return res.status(400).json({ error: "Identifiant invalide." });
      }
      if (!question || typeof question !== "string" || question.trim() === "" || question.length > 300) {
        return res.status(400).json({ error: "La question est obligatoire." });
      }
      if (!answer || typeof answer !== "string" || answer.trim() === "" || answer.length > 5000) {
        return res.status(400).json({ error: "La réponse est obligatoire." });
      }

      await query(
        `INSERT INTO faqs (id, question, answer, position, active, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())`,
        id, String(question).trim(), String(answer).trim(),
        Number(position ?? 0), active !== false
      );

      return res.status(201).json({ success: true, id });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: unknown) {
    respondInternalError(res, error, "API /api/faqs");
  }
}