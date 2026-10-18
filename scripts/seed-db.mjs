#!/usr/bin/env node



import { randomBytes, scryptSync } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { Agent } from "undici";
import { runMigrations } from "./run-migrations.mjs";


function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set");
  console.error("   export DATABASE_URL=\"postgresql://...\"");
  process.exit(1);
}

const sql = neon(DATABASE_URL, {
  fetchOptions: { dispatcher: new Agent({ connect: { family: 4 } }) },
});

async function main() {
  console.log("🚀 Connecting to Neon...");

  
  console.log("📦 Applying schema migrations...");
  await runMigrations();

  
  // Aucune annonce de démonstration : les biens et les voitures MOTOM se publient
  // depuis le back-office (/admin), avec leurs vraies photos.

  console.log("🛠️  Seeding services...");

  // Les six pôles de l'affiche officielle, dans le même ordre que src/data/poles.ts
  const services = [
    { id: "immobilier", title: "Immobilier", text: "Achat, vente, location et gestion immobilière : maisons, terrains et location saisonnière.", points: ["Vente de maisons et de terrains", "Location des maisons et location saisonnière", "Gestion immobilière", "Conseils et accompagnement personnalisé"] },
    { id: "construction", title: "Construction des maisons", text: "Des maisons modernes et solides, construites selon vos besoins et votre budget.", points: ["Étude de votre projet", "Construction moderne et solide", "Suivi jusqu'à la remise des clés"] },
    { id: "transport", title: "Transport", text: "Vos marchandises en toute sécurité, à temps et partout.", points: ["Rapidité", "Sécurité", "Fiabilité"] },
    { id: "location-voitures", title: "Location des voitures", text: "Des véhicules confortables et bien entretenus pour tous vos déplacements.", points: ["À la journée", "À la semaine", "Au mois"] },
    { id: "demenagement", title: "Déménagement", text: "Un déménagement en toute sérénité, avec une équipe professionnelle et dynamique.", points: ["Rapidité", "Soin", "Sécurité"] },
    { id: "decoration", title: "Décoration intérieure", text: "Transformez vos espaces en lieux de vie élégants, modernes et à votre image.", points: ["Conseil", "Design", "Aménagement"] },
  ];

  const existingServices = await sql`SELECT COUNT(*)::int as count FROM services`;
  if (existingServices[0].count > 0) {
    console.log(`⚠️  ${existingServices[0].count} services already exist, skipping seed`);
  } else {
    for (const s of services) {
      await sql`
        INSERT INTO services (id, title, text, points, active, created_at)
        VALUES (${s.id}, ${s.title}, ${s.text}, ${JSON.stringify(s.points)}, true, NOW())
      `;
    }
    console.log(`✅ ${services.length} services seeded`);
  }

  
  // Pas de messages ni d'avis fictifs : seuls les vrais clients en publient.

  const sampleFaqs = [
    { id: "faq-services", question: "Quels services propose MOTOM ?", answer: "MOTOM est une agence immobilière basée à Bangui : achat, vente, location et gestion immobilière. Nous proposons aussi la construction de maisons, le transport de marchandises, la location de voitures, le déménagement et la décoration intérieure." },
    { id: "faq-agence", question: "Où se trouve l'agence ?", answer: "Notre agence se trouve au PK11, près de la station Sassou, à Bangui. Vous pouvez aussi nous joindre par téléphone ou sur WhatsApp." },
    { id: "faq-saisonniere", question: "Proposez-vous de la location saisonnière ?", answer: "Oui. En plus de la location au mois, nous proposons des logements en location saisonnière, pour quelques nuits ou quelques semaines." },
    { id: "faq-voitures", question: "Pour quelle durée peut-on louer une voiture ?", answer: "Nos véhicules se louent à la journée, à la semaine ou au mois, selon vos besoins." },
    { id: "faq-devis", question: "Comment obtenir un devis pour une construction, un transport ou un déménagement ?", answer: "Contactez-nous par téléphone, sur WhatsApp ou via le formulaire de contact en décrivant votre projet : nous l'étudions et vous faisons une proposition adaptée." },
  ];

  console.log("❓ Seeding faqs...");
  const existingFaqs = await sql`SELECT COUNT(*)::int as count FROM faqs`;
  if (existingFaqs[0].count > 0) {
    console.log(`⚠️  ${existingFaqs[0].count} faqs already exist, skipping seed`);
  } else {
    for (const [i, f] of sampleFaqs.entries()) {
      await sql`
        INSERT INTO faqs (id, question, answer, position, active, created_at)
        VALUES (${f.id}, ${f.question}, ${f.answer}, ${i}, true, NOW())
      `;
    }
    console.log(`✅ ${sampleFaqs.length} sample faqs seeded`);
  }

  console.log("👑 Seeding superadmin...");
  const superAdminPassword = process.env.ADMIN_PASSWORD;
  const superAdminEmail = (process.env.SUPERADMIN_EMAIL || "").trim().toLowerCase();
  const superAdminUsername = (process.env.SUPERADMIN_USERNAME || "").trim().toLowerCase();
  const existingSuper = await sql`SELECT id FROM admins WHERE role = 'superadmin' LIMIT 1`;
  if (existingSuper.length > 0) {
    console.log("ℹ️  Superadmin déjà présent, mise à jour du mot de passe...");
    if (superAdminPassword) {
      await sql`
        UPDATE admins
        SET password_hash = ${hashPassword(superAdminPassword)},
            status = 'active',
            invite_token = NULL,
            invite_token_expires = NULL,
            password_changed_at = NOW(),
            updated_at = NOW()
        WHERE id = ${existingSuper[0].id}
      `;
      console.log(`✅ Superadmin ${existingSuper[0].id} mot de passe synchronisé avec ADMIN_PASSWORD`);
    } else {
      console.log("⚠️  ADMIN_PASSWORD non défini, superadmin inchangé");
    }
  } else {
    if (!superAdminPassword || !superAdminEmail || !superAdminUsername) {
      console.warn("⚠️  ADMIN_PASSWORD, SUPERADMIN_EMAIL et SUPERADMIN_USERNAME requis pour créer le superadmin : étape ignorée");
      console.log("🎉 Seed complete (sans superadmin)");
      return;
    }
    const superAdminId = "superadmin";
    await sql`
      INSERT INTO admins (id, email, username, password_hash, role, status, password_changed_at)
      VALUES (${superAdminId}, ${superAdminEmail}, ${superAdminUsername}, ${hashPassword(superAdminPassword)}, 'superadmin', 'active', NOW())
    `;
    console.log(`✅ Superadmin créé (${superAdminEmail})`);
  }

  console.log("🎉 Seed complete!");
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
