import type { VercelRequest, VercelResponse } from "@vercel/node";
import { query } from "../lib/db.js";
import { requireAdmin, getSessionAdmin } from "../lib/auth.js";
import { respondInternalError } from "../lib/http.js";
import { createRateLimiter } from "../lib/rate-limit.js";
import { recordAudit } from "../lib/audit.js";


const reviewLimiter = createRateLimiter({
  windowMs: 1000 * 60 * 10,
  max: 3,
  label: "review",
});

const MAX_COMMENT = 1000;
const MAX_AUTHOR = 80;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { id } = req.query;

    
    if (id && typeof id === "string") {
      const admin = await requireAdmin(req, res);
      if (!admin) return;

      if (req.method === "PATCH") {
        const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
        const status = body?.status;
        if (status !== "approved" && status !== "rejected") {
          return res.status(400).json({ error: "Statut non reconnu." });
        }
        await query("UPDATE reviews SET status = $1 WHERE id = $2", status, id);
        await recordAudit({
          action: status === "approved" ? "review.approve" : "review.reject",
          entityType: "review",
          entityId: id,
          actor: admin,
          req,
          metadata: { status },
        });
        return res.status(200).json({ success: true, status });
      }

      if (req.method === "DELETE") {
        await query("DELETE FROM reviews WHERE id = $1", id);
        await recordAudit({
          action: "review.delete",
          entityType: "review",
          entityId: id,
          actor: admin,
          req,
        });
        return res.status(200).json({ success: true });
      }

      return res.status(405).json({ error: "Method not allowed" });
    }

    
    if (req.method === "GET") {
      const admin = await getSessionAdmin(req);
      if (admin) {
        const { status } = req.query;
        let rows;
        if (status === "pending" || status === "approved" || status === "rejected") {
          rows = await query(
            "SELECT * FROM reviews WHERE status = $1 ORDER BY created_at DESC",
            status
          );
        } else {
          rows = await query("SELECT * FROM reviews ORDER BY created_at DESC");
        }
        return res.status(200).json(rows);
      }

      const rows = await query(
        "SELECT id, author, avatar, rating, comment, created_at FROM reviews WHERE status = 'approved' ORDER BY created_at DESC LIMIT 50"
      );
      return res.status(200).json(rows);
    }

    
    if (req.method === "POST") {
      if (!reviewLimiter(req, res)) return;

      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const author = String(body?.author || "").trim();
      const avatar = String(body?.avatar || "").trim();
      const rating = Number(body?.rating);
      const comment = String(body?.comment || "").trim();

      if (!author || author.length > MAX_AUTHOR) {
        return res.status(400).json({ error: "Veuillez saisir votre nom." });
      }
      
      if (avatar && !/^https:\/\/\S+$/i.test(avatar)) {
        return res.status(400).json({ error: "La photo doit être une adresse (lien) valide." });
      }
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Veuillez choisir une note entre 1 et 5 étoiles." });
      }
      if (!comment || comment.length > MAX_COMMENT) {
        return res.status(400).json({ error: "Veuillez écrire un commentaire (1000 caractères max)." });
      }

      const id = `rev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await query(
        "INSERT INTO reviews (id, author, avatar, rating, comment, status, created_at) VALUES ($1, $2, $3, $4, $5, 'pending', NOW())",
        id, author, avatar, rating, comment
      );

      await recordAudit({
        action: "review.create",
        entityType: "review",
        entityId: id,
        req,
        metadata: { rating },
      });

      return res.status(201).json({ success: true, id });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: unknown) {
    respondInternalError(res, error, "API /api/reviews");
  }
}

