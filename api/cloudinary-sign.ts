import { createHash } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../lib/auth.js";
import { respondInternalError } from "../lib/http.js";

const FOLDER = "motom";


export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  
  if (!await requireAdmin(req, res)) return;

  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  if (!apiSecret || !apiKey) {
    return res
      .status(500)
      .json({ error: "CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET non définis" });
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    
    const paramsToSign: Record<string, string> = {
      timestamp: String(timestamp),
      source: "uw",
      folder: FOLDER,
    };

    const toSign = Object.keys(paramsToSign)
      .sort()
      .map((k) => `${k}=${paramsToSign[k]}`)
      .join("&");
    const signature = createHash("sha1")
      .update(toSign + apiSecret)
      .digest("hex");

    return res.status(200).json({
      signature,
      timestamp,
      apiKey,
      folder: FOLDER,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME,
    });
  } catch (error: unknown) {
    respondInternalError(res, error, "API /api/cloudinary-sign");
  }
}
