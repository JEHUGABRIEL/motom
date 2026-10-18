import type { VercelResponse } from "@vercel/node";
import { query } from "./db.js";
import { sanitizeGallery } from "./validate.js";


export function textField(max = 5000): (v: unknown) => string | null {
  return (v) => {
    if (typeof v !== "string" || v.length === 0 || v.length > max) {
      return `Champ invalide (max ${max} caractères)`;
    }
    return null;
  };
}


export function numberField(): (v: unknown) => string | null {
  return (v) => {
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0) {
      return "Valeur numérique invalide";
    }
    return null;
  };
}


export function oneOfField(allowed: readonly string[]): (v: unknown) => string | null {
  return (v) => {
    if (typeof v !== "string" || !allowed.includes(v)) {
      return `Valeur invalide (attendue : ${allowed.join(" / ")})`;
    }
    return null;
  };
}


export function booleanField(): (v: unknown) => string | null {
  return (v) => (typeof v === "boolean" ? null : "Valeur booléenne invalide");
}


export function dateOrNullField(): (v: unknown) => string | null {
  return (v) => {
    if (v === null || v === undefined || v === "") return null;
    if (typeof v !== "string" || Number.isNaN(Date.parse(v))) {
      return "Date invalide";
    }
    return null;
  };
}

export type FieldDef = {
  key: string; 
  column: string; 
  
  validate?: (value: unknown) => string | null;
};


export async function partialUpdate(
  res: VercelResponse,
  table: string,
  id: string,
  fields: FieldDef[],
  body: Record<string, unknown>
): Promise<boolean> {
  const sets: string[] = [];
  const values: unknown[] = [];

  for (const { key, column, validate } of fields) {
    if (!(key in body)) continue;

    let value = body[key];

    if (key === "gallery") {
      const gallery = sanitizeGallery(value);
      if (gallery === null) {
        res.status(400).json({ error: "gallery : URLs https requises (max 30)" });
        return false;
      }
      value = JSON.stringify(gallery);
    }
    if (key === "image" && value !== undefined && value !== "") {
      if (typeof value !== "string" || !/^https:\/\//i.test(value.trim())) {
        res.status(400).json({ error: "image : URL https requise" });
        return false;
      }
      value = value.trim();
    }
    if ((key === "features" || key === "points") && value !== undefined) {
      if (!Array.isArray(value)) {
        res.status(400).json({ error: `${key} invalide` });
        return false;
      }
      value = JSON.stringify(value);
    }
    if (validate) {
      const error = validate(value);
      if (error) {
        res.status(400).json({ error });
        return false;
      }
    }

    sets.push(`${column} = $${sets.length + 1}`);
    values.push(value);
  }

  if (sets.length === 0) {
    res.status(400).json({ error: "Aucun champ à mettre à jour" });
    return false;
  }

  values.push(id);
  const queryText = `UPDATE ${table} SET ${sets.join(", ")}, updated_at = NOW() WHERE id = $${values.length}`;
  await query(queryText, ...values);
  return true;
}
