#!/usr/bin/env node



import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";
import { Agent } from "undici";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, "..", "migrations");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set");
  console.error('   export DATABASE_URL="postgresql://..."');
  process.exit(1);
}

const sql = neon(DATABASE_URL, {
  fetchOptions: { dispatcher: new Agent({ connect: { family: 4 } }) },
});


function splitStatements(source) {
  const statements = [];
  let current = "";
  let inString = false;
  const lines = source.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("--")) continue; 
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === "'" && line[i - 1] !== "\\") {
        inString = !inString;
      }
      if (ch === ";" && !inString) {
        if (current.trim()) statements.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    current += "\n";
  }
  if (current.trim()) statements.push(current.trim());
  return statements;
}

export async function runMigrations() {
  console.log("🚀 Running migrations...");

  
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  const appliedRows = await sql`SELECT name FROM schema_migrations`;
  const applied = new Set(appliedRows.map((r) => r.name));

  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  let ran = 0;
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`  ⏭  ${file} (déjà appliquée)`);
      continue;
    }
    const content = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");
    const statements = splitStatements(content);
    console.log(`  ▶  ${file} (${statements.length} instruction(s))`);
    for (const stmt of statements) {
      await sql.query(stmt);
    }
    await sql`INSERT INTO schema_migrations (name) VALUES (${file})`;
    ran += 1;
  }

  console.log(ran === 0 ? "✅ Aucune nouvelle migration." : `✅ ${ran} migration(s) appliquée(s).`);
  return ran;
}


if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Migration failed:", err);
      process.exit(1);
    });
}
