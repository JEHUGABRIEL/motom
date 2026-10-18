// One-off : pose une date de fin sur les promos immobilières actives via l'API du
// back-office (même chemin que l'interface /admin), en local via `vercel dev`.
// Usage : node scripts/set-promo-ends.mjs [durée_heures]
// Aucun secret n'est imprimé ; durée par défaut : 168 h (7 jours).
import { readFileSync } from "node:fs";
import { spawn, execSync } from "node:child_process";

const DURATION_HOURS = (() => {
  const raw = process.argv[2] ? Number(process.argv[2]) : 168; // 7 jours par défaut
  return Number.isFinite(raw) && raw > 0 ? raw : 168;
})();

// --- Chargement manuel du .env (valeurs gardées dans le processus uniquement) ---
const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i), line.slice(i + 1).replace(/^["']|["']$/g, "")];
    })
);

if (!env.ADMIN_PASSWORD || !env.DATABASE_URL) {
  console.error("❌ ADMIN_PASSWORD / DATABASE_URL manquants dans .env");
  process.exit(1);
}

// --- Port libre pour vercel dev ---
function freePort() {
  const candidates = [4321, 4322, 4323, 4324, 4325];
  for (const port of candidates) {
    try {
      execSync(`lsof -iTCP:${port} -sTCP:LISTEN -t`, { stdio: "ignore" });
    } catch {
      return port; // lsof échoue => port libre
    }
  }
  throw new Error("Aucun port libre trouvé (4321-4325)");
}

const PORT = freePort();
console.log(`🚀 Démarrage de vercel dev sur le port ${PORT}…`);

const proc = spawn("npx", ["-y", "vercel", "dev", "--listen", `127.0.0.1:${PORT}`, "--yes"], {
  stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env, ...env },
  cwd: new URL("..", import.meta.url).pathname,
  detached: true, // groupe de processus : permet de tuer npx + vite d'un coup
});

let bootLog = "";
let apiReady = false;
proc.stdout.on("data", (d) => {
  bootLog += d.toString();
});
proc.stderr.on("data", (d) => {
  bootLog += d.toString();
});

async function waitReady(timeoutMs = 120_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/api/auth`);
      if (res.status === 200) {
        apiReady = true;
        return true;
      }
    } catch {
      /* pas encore prêt */
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return false;
}

if (!(await waitReady())) {
  console.error("❌ vercel dev n'a pas démarré à temps. Log :");
  console.error(bootLog.slice(-2000));
  proc.kill("SIGTERM");
  process.exit(1);
}
console.log("✅ Serveur local prêt (API /api/auth répond).");

const BASE = `http://127.0.0.1:${PORT}`;
const JSON_HEADERS = { "Content-Type": "application/json" };

// --- 1. Login back-office (cookie de session) ---
const login = await fetch(`${BASE}/api/auth`, {
  method: "POST",
  headers: JSON_HEADERS,
  body: JSON.stringify({
    identifier: env.SUPERADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
  }),
});
if (!login.ok) {
  console.error(`❌ Login back-office échoué (${login.status}).`);
  proc.kill("SIGTERM");
  process.exit(1);
}
const cookie = (login.headers.get("set-cookie") || "").split(";")[0];
if (!cookie) {
  console.error("❌ Cookie de session manquant");
  proc.kill("SIGTERM");
  process.exit(1);
}
console.log("✅ Login back-office OK (cookie de session obtenu).");

// --- 2. Les promos immobilières actives ---
const props = await fetch(`${BASE}/api/properties`).then((r) => r.json());
const promos = props.filter((p) => p.promo && !p.promoPaused);
console.log(
  `ℹ️  ${promos.length} promo(s) immobilière(s) active(s) : ${promos
    .map((p) => p.title)
    .join(" | ")}`
);

if (promos.length !== 2) {
  console.log("⚠️  Attendu 2 promos actives — on continue quand même.");
}

// --- 3. PUT promoEndsAt sur chaque promo (chemin identique au BO) ---
const endsAt = new Date(Date.now() + DURATION_HOURS * 3600_000);
console.log(`ℹ️  Date de fin posée : ${endsAt.toISOString()} (+${DURATION_HOURS} h)`);

for (const p of promos) {
  const res = await fetch(`${BASE}/api/properties/${encodeURIComponent(p.id)}`, {
    method: "PUT",
    headers: { ...JSON_HEADERS, Cookie: cookie },
    body: JSON.stringify({ promo: true, promoEndsAt: endsAt.toISOString() }),
  });
  const body = await res.json().catch(() => ({}));
  console.log(`${res.ok ? "✅" : "❌"} ${p.title} → ${res.status} ${body.error ?? ""}`);
}

// --- 4. Vérification finale via GET public ---
const after = await fetch(`${BASE}/api/properties`).then((r) => r.json());
for (const p of after.filter((x) => x.promo)) {
  const hoursLeft = p.promoEndsAt
    ? Math.round((new Date(p.promoEndsAt).getTime() - Date.now()) / 3600_000)
    : null;
  console.log(
    `${p.promoEndsAt ? "✅" : "⚠️ "} ${p.title} — fin: ${p.promoEndsAt ?? "—"}${
      hoursLeft != null ? ` (~${hoursLeft} h restantes)` : ""
    }`
  );
}

proc.kill("SIGTERM");
try {
  process.kill(-proc.pid, "SIGTERM"); // tue tout le groupe (npx, vercel, vite)
} catch {
  /* déjà mort */
}
console.log("🎉 Terminé — serveur local arrêté.");
process.exit(0); // force la sortie : les pipes hérités ne doivent pas bloquer
