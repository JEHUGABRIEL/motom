#!/usr/bin/env node

/**
 * Contenu de démonstration : biens et avis clients fictifs.
 *
 * Les enregistrements sont identifiables (ids `demo-…`) et peuvent être
 * supprimés à tout moment avec :
 *
 *   npm run db:demo -- --remove
 */

import { neon } from "@neondatabase/serverless";
import { Agent } from "undici";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(DATABASE_URL, {
  fetchOptions: { dispatcher: new Agent({ connect: { family: 4 } }) },
});

const remove = process.argv.includes("--remove");

const photo = (id, w = 1400) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const properties = [
  {
    id: "demo-villa-pk11",
    title: "Villa 5 chambres avec piscine",
    type: "Vente",
    category: "Villa",
    city: "Bangui",
    neighborhood: "PK11",
    price: 85000000,
    priceUnit: "FCFA",
    bedrooms: 5,
    bathrooms: 4,
    area: 320,
    featured: true,
    promo: false,
    image: photo("1600596542815-ffad4c1539a9"),
    gallery: [
      photo("1600596542815-ffad4c1539a9"),
      photo("1600607687939-ce8a6c25118c"),
      photo("1600585154340-be6161a56a0c"),
    ],
    description:
      "Villa contemporaine sur un terrain clos de 900 m², à quelques minutes de la station Sassou. Grand séjour lumineux, cuisine équipée, cinq chambres dont une suite parentale, piscine et dépendance pour le personnel.",
    features: [
      "Terrain clos de 900 m²",
      "Piscine",
      "Suite parentale",
      "Groupe électrogène",
      "Parking 3 voitures",
    ],
    createdAt: "2026-10-21T09:00:00Z",
  },
  {
    id: "demo-terrain-bimbo",
    title: "Terrain 600 m² viabilisé",
    type: "Vente",
    category: "Terrain",
    city: "Bimbo",
    neighborhood: "Kokoro",
    price: 18000000,
    priceUnit: "FCFA",
    bedrooms: 0,
    bathrooms: 0,
    area: 600,
    featured: true,
    promo: false,
    image: photo("1500382017468-9049fed747ef"),
    gallery: [
      photo("1500382017468-9049fed747ef"),
      photo("1500382017468-9049fed747ef", 1200),
      photo("1500382017468-9049fed747ef", 1000),
    ],
    description:
      "Terrain plat et viabilisé, avec un accès direct à la route principale et l'eau et l'électricité à proximité. Idéal pour construire une maison familiale ou un petit immeuble locatif.",
    features: ["Titre vérifié", "Accès route goudronnée", "Eau et électricité à proximité"],
    createdAt: "2026-10-19T10:30:00Z",
  },
  {
    id: "demo-appartement-centre",
    title: "Appartement 3 pièces meublé",
    type: "Vente",
    category: "Appartement",
    city: "Bangui",
    neighborhood: "Centre-ville",
    price: 42000000,
    priceUnit: "FCFA",
    bedrooms: 2,
    bathrooms: 2,
    area: 110,
    featured: false,
    promo: true,
    image: photo("1522708323590-d24dbb6b0267"),
    gallery: [
      photo("1522708323590-d24dbb6b0267"),
      photo("1502672260266-1c1ef2d93688"),
      photo("1493809842364-78817add7ffb"),
    ],
    description:
      "Appartement entièrement meublé au troisième étage, avec balcon, cuisine américaine et parking sécurisé. Vendu avec l'ensemble du mobilier et des équipements.",
    features: ["Meublé", "Balcon", "Parking sécurisé", "Ascenseur"],
    createdAt: "2026-10-17T14:15:00Z",
  },
  {
    id: "demo-maison-pk12",
    title: "Maison familiale 4 chambres",
    type: "Location",
    category: "Maison",
    city: "Bangui",
    neighborhood: "PK12",
    price: 450000,
    priceUnit: "FCFA/mois",
    bedrooms: 4,
    bathrooms: 2,
    area: 180,
    featured: true,
    promo: false,
    image: photo("1568605114967-8130f3a36994"),
    gallery: [
      photo("1568605114967-8130f3a36994"),
      photo("1600585154340-be6161a56a0c"),
      photo("1616594039964-ae9021a400a0"),
    ],
    description:
      "Maison récente dans une rue calme, avec un séjour spacieux, quatre chambres, une cour arborée et un forage. Disponible immédiatement, loyer mensuel hors charges.",
    features: ["Forage", "Cour arborée", "Cuisine équipée", "Deux salles de bain"],
    createdAt: "2026-10-16T08:45:00Z",
  },
  {
    id: "demo-studio-miskine",
    title: "Studio meublé en location saisonnière",
    type: "Location",
    category: "Studio",
    city: "Bangui",
    neighborhood: "Miskine",
    price: 25000,
    priceUnit: "FCFA/nuit",
    bedrooms: 1,
    bathrooms: 1,
    area: 45,
    featured: true,
    promo: true,
    image: photo("1502672260266-1c1ef2d93688"),
    gallery: [
      photo("1502672260266-1c1ef2d93688"),
      photo("1493809842364-78817add7ffb"),
      photo("1522708323590-d24dbb6b0267"),
    ],
    description:
      "Studio confortable et sécurisé, entièrement équipé pour un séjour de quelques nuits ou de quelques semaines : climatisation, wifi, cuisine et ménage inclus.",
    features: ["Climatisation", "Wifi", "Ménage inclus", "Sécurité 24 h/24"],
    createdAt: "2026-10-22T07:20:00Z",
  },
  {
    id: "demo-bureau-pk11",
    title: "Bureau aménagé de 120 m²",
    type: "Location",
    category: "Bureau",
    city: "Bangui",
    neighborhood: "PK11",
    price: 600000,
    priceUnit: "FCFA/mois",
    bedrooms: 0,
    bathrooms: 1,
    area: 120,
    featured: false,
    promo: false,
    image: photo("1497366754035-f200968a6e72"),
    gallery: [
      photo("1497366754035-f200968a6e72"),
      photo("1497366811353-6870744d04b2"),
      photo("1497215728101-856f4ea42174"),
    ],
    description:
      "Plateau de bureaux cloisons amovibles, climatisé, avec réception, salle de réunion et sanitaires. Situé au premier étage d'un immeuble sécurisé, avec parking.",
    features: ["Climatisé", "Salle de réunion", "Parking", "Immeuble sécurisé"],
    createdAt: "2026-10-14T11:00:00Z",
  },
];

const reviews = [
  {
    id: "demo-review-1",
    author: "Nadège K.",
    avatar: photo("1494790108377-be9c29b29330", 200),
    rating: 5,
    comment:
      "Nous avons trouvé notre maison en moins de trois semaines. L'équipe MOTOM a écouté notre budget et nous a proposé des biens réellement adaptés. Un accompagnement très humain.",
    createdAt: "2026-10-20T09:00:00Z",
  },
  {
    id: "demo-review-2",
    author: "Jean-Marc D.",
    avatar: photo("1507003211169-0a1dd7228f2d", 200),
    rating: 5,
    comment:
      "Location d'une voiture pour une mission en province : véhicule impeccable, rendez-vous à l'heure, prix annoncé sans surprise. Je recommande sans hésiter.",
    createdAt: "2026-10-12T16:30:00Z",
  },
  {
    id: "demo-review-3",
    author: "Clarisse M.",
    avatar: photo("1534528741775-53994a69daeb", 200),
    rating: 4,
    comment:
      "Très bons conseils pour l'achat de notre terrain à Bimbo. Les démarches ont été bien expliquées et suivies. Le rendez-vous à l'agence du PK11 est simple et clair.",
    createdAt: "2026-09-28T11:15:00Z",
  },
  {
    id: "demo-review-4",
    author: "Patrick O.",
    avatar: photo("1500648767791-00dcc994a43e", 200),
    rating: 5,
    comment:
      "MOTOM a géré le déménagement de nos bureaux de bout en bout. Équipe ponctuelle et soigneuse, aucun matériel abîmé. Nous ferons de nouveau appel à eux.",
    createdAt: "2026-09-15T08:00:00Z",
  },
  {
    id: "demo-review-5",
    author: "Awa S.",
    avatar: photo("1544005313-94ddf0286df2", 200),
    rating: 4,
    comment:
      "Le studio que nous avons loué pour une semaine correspondait exactement aux photos. Bon accueil, logement propre et quartier tranquille.",
    createdAt: "2026-08-30T18:45:00Z",
  },
];

async function main() {
  if (remove) {
    const removedReviews = await sql`DELETE FROM reviews WHERE id LIKE 'demo-%' RETURNING id`;
    const removedProperties = await sql`DELETE FROM properties WHERE id LIKE 'demo-%' RETURNING id`;
    console.log(
      `🧹 ${removedProperties.length} biens et ${removedReviews.length} avis de démonstration supprimés.`,
    );
    return;
  }

  console.log("🏠 Insertion des biens de démonstration…");
  for (const p of properties) {
    await sql`
      INSERT INTO properties (
        id, title, type, category, city, neighborhood, price, price_unit,
        bedrooms, bathrooms, area, featured, promo, image, gallery,
        description, features, created_at
      ) VALUES (
        ${p.id}, ${p.title}, ${p.type}, ${p.category}, ${p.city}, ${p.neighborhood},
        ${p.price}, ${p.priceUnit}, ${p.bedrooms}, ${p.bathrooms}, ${p.area},
        ${p.featured}, ${p.promo}, ${p.image}, ${JSON.stringify(p.gallery)},
        ${p.description}, ${JSON.stringify(p.features)}, ${p.createdAt}::timestamptz
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        type = EXCLUDED.type,
        category = EXCLUDED.category,
        city = EXCLUDED.city,
        neighborhood = EXCLUDED.neighborhood,
        price = EXCLUDED.price,
        price_unit = EXCLUDED.price_unit,
        bedrooms = EXCLUDED.bedrooms,
        bathrooms = EXCLUDED.bathrooms,
        area = EXCLUDED.area,
        featured = EXCLUDED.featured,
        promo = EXCLUDED.promo,
        image = EXCLUDED.image,
        gallery = EXCLUDED.gallery,
        description = EXCLUDED.description,
        features = EXCLUDED.features,
        created_at = EXCLUDED.created_at,
        updated_at = NOW()
    `;
  }
  console.log(`✅ ${properties.length} biens de démonstration enregistrés.`);

  console.log("⭐ Insertion des avis de démonstration…");
  for (const r of reviews) {
    await sql`
      INSERT INTO reviews (id, author, avatar, rating, comment, status, created_at)
      VALUES (
        ${r.id}, ${r.author}, ${r.avatar}, ${r.rating}, ${r.comment},
        'approved', ${r.createdAt}::timestamptz
      )
      ON CONFLICT (id) DO UPDATE SET
        author = EXCLUDED.author,
        avatar = EXCLUDED.avatar,
        rating = EXCLUDED.rating,
        comment = EXCLUDED.comment,
        status = 'approved',
        created_at = EXCLUDED.created_at
    `;
  }
  console.log(`✅ ${reviews.length} avis de démonstration publiés.`);
  console.log("🎉 Contenu de démonstration prêt. Suppression : npm run db:demo -- --remove");
}

main().catch((err) => {
  console.error("❌ Seed démo échoué :", err);
  process.exit(1);
});
