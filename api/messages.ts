import type { VercelRequest, VercelResponse } from "@vercel/node";
import { query } from "../lib/db.js";
import { requireAdmin } from "../lib/auth.js";
import { respondInternalError } from "../lib/http.js";
import { createDbRateLimiter } from "../lib/rate-limit.js";
import { recordAudit } from "../lib/audit.js";


const messageLimiter = createDbRateLimiter({
  windowMs: 1000 * 60 * 10,
  max: 10,
  label: "contact",
});


const MAX = { name: 120, email: 200, phone: 40, subject: 300, message: 5000 };

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    
    const { id } = req.query;
    if (id && typeof id === "string") {
      if (req.method === "PUT") {
        const admin = await requireAdmin(req, res);
        if (!admin) return;
        const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
        if (body.read !== undefined) {
          await query("UPDATE messages SET read = $1 WHERE id = $2", body.read, id);
          await recordAudit({
            action: "message.read",
            entityType: "message",
            entityId: id,
            actor: admin,
            req,
            metadata: { read: Boolean(body.read) },
          });
        }
        return res.status(200).json({ success: true });
      }
      if (req.method === "DELETE") {
        const admin = await requireAdmin(req, res);
        if (!admin) return;
        await query("DELETE FROM messages WHERE id = $1", id);
        await recordAudit({
          action: "message.delete",
          entityType: "message",
          entityId: id,
          actor: admin,
          req,
        });
        return res.status(200).json({ success: true });
      }
      return res.status(405).json({ error: "Method not allowed" });
    }

    if (req.method === "GET") {
      if (!await requireAdmin(req, res)) return;
      const { filter } = req.query;
      let rows;
      if (filter === "unread") {
        rows = await query(
          "SELECT * FROM messages WHERE read = false ORDER BY created_at DESC"
        );
      } else {
        rows = await query("SELECT * FROM messages ORDER BY created_at DESC");
      }
      return res.status(200).json(rows);
    }

    if (req.method === "POST") {
      if (!(await messageLimiter(req, res))) return;

      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const name = String(body?.name || "").trim();
      const email = String(body?.email || "").trim();
      const phone = String(body?.phone || "").trim();
      const subject = String(body?.subject || "").trim();
      const message = String(body?.message || "").trim();

      if (!name || !subject || !message) {
        return res.status(400).json({ error: "Merci de remplir tous les champs obligatoires." });
      }
      if (name.length > MAX.name || subject.length > MAX.subject || message.length > MAX.message) {
        return res.status(400).json({ error: "Texte trop long." });
      }
      if (email && !isEmail(email)) {
        return res.status(400).json({ error: "Veuillez saisir une adresse email valide." });
      }
      if (email.length > MAX.email || phone.length > MAX.phone) {
        return res.status(400).json({ error: "Champ trop long." });
      }

      const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await query(
        `INSERT INTO messages (id, name, email, phone, subject, message, read, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        id, name, email, phone, subject, message, false
      );

      await recordAudit({
        action: "message.create",
        entityType: "message",
        entityId: id,
        req,
        metadata: { subject },
      });

      return res.status(201).json({ success: true, id });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: unknown) {
    respondInternalError(res, error, "API /api/messages");
  }
}