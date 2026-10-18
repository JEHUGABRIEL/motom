# MOTOM — Site web de l'Agence Immobilière

Site vitrine et back-office de l'**Agence Immobilière MOTOM** (PK11, près de la station
Sassou, Bangui – RCA) — *« Votre projet immobilier, notre priorité ! »*.
React + Vite + TypeScript + Tailwind CSS v4, API serverless Vercel + Neon Postgres.

Le contenu reprend l'affiche officielle de l'agence (`docs/affiche-motom.jpg`).
Les informations encore à confirmer sont listées dans `CONTENU-A-VALIDER.md`.

## Les six pôles

| Pôle | Page | Contenu |
| --- | --- | --- |
| Immobilier (achat, vente, location, gestion) | `/biens-a-vendre`, `/biens-a-louer` | Catalogue géré au back-office |
| Construction des maisons | `/construction` | Page de service + devis |
| Transport | `/transport` | Page de service + devis |
| Location des voitures | `/vehicules-a-louer` | Catalogue géré au back-office |
| Déménagement | `/demenagement` | Page de service + devis |
| Décoration intérieure | `/decoration-interieure` | Page de service + devis |

- `src/data/poles.ts` — route, icône et visuel de chaque pôle (source unique pour la
  navigation, l'accueil, le pied de page et les pages de service).
- Les textes des pôles sont dans `src/i18n/locales/{fr,en}.ts` (`poles.<slug>`).
- Les pages de service sont rendues par `src/pages/PolePage.tsx`. Le bouton « Demander un
  devis » ouvre `/contact?sujet=<slug>` avec l'objet présélectionné.
- **Location saisonnière** : au back-office, choisir « Location saisonnière (à la nuit) »
  comme type de transaction. Ces biens sont listés sur `/biens-a-louer?saison=1`.

## Charte graphique

| Rôle | Jeton | Hex |
| --- | --- | --- |
| Noir (primaire) | `navy` | `#141414` |
| Jaune (accent) | `gold` | `#FFC20E` |
| Jaune foncé (texte sur fond clair) | `gold-dark` | `#8F6B00` |
| Vert (WhatsApp) | `green` | `#1E8449` |
| Fond clair | `cream` | `#FFF8E1` |

Les jetons sont définis dans `src/index.css` (`@theme`). Leurs noms historiques
(`navy`, `gold`) sont conservés pour ne pas réécrire toutes les classes.

## Données

- `src/data/site.ts` — **identité de l'agence** (nom, slogans, téléphones, WhatsApp,
  adresse, e-mail, réseaux sociaux, NIU/RCCM). Un champ laissé vide n'est pas affiché.
- `src/data/properties.ts`, `src/data/vehicles.ts` — types et formats de prix. Les
  catalogues statiques sont vides : biens et voitures se publient depuis `/admin`.

## Démarrer le projet

```bash
npm install
npm run dev          # site seul (sans API)
npx vercel dev       # site + fonctions api/
```

## Base de données (Neon)

`DATABASE_URL` vit uniquement dans `.env` (ignoré par git) et dans les variables
d'environnement Vercel. Elle n'est lue que par `api/` et `scripts/` : jamais de préfixe
`VITE_`, sinon elle partirait dans le bundle client.

```bash
npm run db:migrate   # applique migrations/*.sql (suivi dans schema_migrations)
npm run db:seed      # migrations + services MOTOM + FAQ + superadmin
```

Le seed n'insère ni annonces, ni messages, ni avis fictifs. Le superadmin n'est créé
que si `ADMIN_PASSWORD`, `SUPERADMIN_EMAIL` et `SUPERADMIN_USERNAME` sont définis.

## Variables d'environnement (Vercel)

Voir `.env.example` : `DATABASE_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET`,
`SUPERADMIN_EMAIL`, `SUPERADMIN_USERNAME`, `CLOUDINARY_*` / `VITE_CLOUDINARY_CLOUD_NAME`
(compte Cloudinary de MOTOM, dossier `motom/`), `RESEND_API_KEY` / `RESEND_FROM`,
`PUBLIC_SITE_HOST` (domaine de production ; les hôtes `motom*.vercel.app` sont acceptés
par défaut pour les liens d'invitation et de réinitialisation).
