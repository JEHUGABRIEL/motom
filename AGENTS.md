# AGENTS.md — MOTOM

French-first site and back-office for Agence Immobilière MOTOM (Bangui): React 19 + Vite 8 + Tailwind CSS v4 SPA, Vercel serverless API, Neon Postgres.

## Commands

- `npm install`
- `npm run dev` — Vite only. There is no API server/proxy, so `/api/*` is unavailable and API-backed pages show their empty/fallback states.
- `npx vercel dev` — full app: SPA + `api/` + `vercel.json` rewrites. Use it to test the DB, auth, uploads, or anything under `/api`.
- `npm run lint` — oxlint. There is no ESLint, Prettier, or CI config in the repo.
- `npm test` — Vitest (unit tests for `lib/` and `src/lib/`, node environment). `npm run test:watch` for watch mode.
- `npm run build` — `tsc -b && vite build`. It typechecks `src/`, `vite.config.ts`, and (via `tsconfig.api.json`) `api/` and `lib/`. `scripts/` is not typechecked.
- `npm run db:migrate` — applies new `migrations/*.sql`, tracked by filename in `schema_migrations`. Add a new numbered file and never edit an applied one. The runner executes statements without a transaction and does not handle dollar-quoted blocks, so keep migrations idempotent plain SQL.
- `npm run db:seed` — migrations + six services + FAQs + superadmin. Re-running it also rewrites an existing superadmin password from `ADMIN_PASSWORD`.
- `npm run db:demo` / `npm run db:demo -- --remove` — add/remove fake `demo-*` listings and reviews. Use only against dev/staging data.
- `db:*` scripts load `.env` if present (not `.env.local`). `ADMIN_PASSWORD` is only used by seed, never at login.

Baseline: `npm run lint` reports one pre-existing warning in `scripts/set-promo-ends.mjs`. `npm run build` should stay warning-free (vendor/icons chunks + lazy routes keep it under the size limit).

## Structure

- `src/` is the SPA. `src/App.tsx` defines two layouts: `/admin*` omits Navbar/Footer; public routes use the shell. Routes are French.
- `api/` contains Vercel functions, `lib/` shared server-only code, `migrations/` SQL, and `scripts/` one-off DB tools.
- `src/pages/Admin.tsx` is the back-office shell (login, nav, section routing). The sections live in `src/admin/*` (`dashboard`, `properties`, `vehicles`, `messages`, `content`, `accounts`, `reviews`, `security`) with shared `types.ts`, `shared.tsx` and `format.ts`. Data goes through React Query hooks in `src/lib/api.ts`; only imperative auth flows (login, MFA challenge, invitation/reset acceptance, profile update) use raw `fetch`.
- Routes are lazy-loaded in `src/App.tsx` (`React.lazy` + `Suspense`); `vite.config.ts` groups `node_modules` into `vendor`/`icons` chunks via `build.rolldownOptions.output.codeSplitting`.
- `Vente.tsx`/`Location.tsx` and `VehiculesVente.tsx`/`VehiculesLocation.tsx` are 5-line wrappers. Edit `Properties.tsx`/`Vehicles.tsx` for catalog changes.
- Construction, transport, déménagement, and décoration all render `PolePage.tsx`; their copy is `poles.<slug>` in i18n. `/services` reads the DB `services` table (fallback: `services.items`), so service-copy changes may need both places.
- `src/data/poles.ts` is the single source for pole route/icon/image. Most public copy lives in `src/i18n/locales/fr.ts` and `en.ts`; add keys to both (French is the fallback). Admin labels are hardcoded French.
- `src/data/site.ts` is the single source for agency identity; empty fields are intentionally hidden (see `CONTENU-A-VALIDER.md`).
- `src/data/properties.ts` and `src/data/vehicles.ts` are empty static fallbacks; real catalogs come from the API via React Query hooks in `src/lib/api.ts`.

## Conventions and gotchas

- Server code imports TypeScript files with a `.js` specifier (`../lib/db.js`); frontend imports omit extensions. Match this.
- Domain values are French strings: `type` is `Vente`/`Location`; property units are `FCFA`, `FCFA/mois`, `FCFA/nuit`; vehicle units are `FCFA`, `FCFA/jour`. Do not translate or normalize them.
- Catalog/service IDs are caller-supplied ASCII text (`admin-<timestamp>`, `demo-*`) validated by `isValidId`; there are no serial/UUID columns. Messages and reviews generate IDs server-side.
- `gallery`, `features`, and `points` are JSONB; write them as `JSON.stringify(array)` like existing handlers. Image fields must be absolute `https://` URLs, not `/public` paths.
- Adding a listing/vehicle field means touching the migration, INSERT handler, the `*_FIELDS` allowlist in the `[id].ts` handler, `serialize*` in `lib/db.ts`, the TS types, and the admin form.
- API routing differs by resource: `properties`/`vehicles` use real `[id].ts` files; `messages`/`reviews`/`services`/`faqs` use `?id=` handlers plus rewrites in `vercel.json`; `/api/admins/[id].ts` multiplexes stats, me, login-events, the audit log (`/api/audit` rewrite) and the invite/reset flows. Follow the pattern of the resource you touch.
- The Vercel **Hobby plan allows 12 serverless functions per deployment**. `api/` is at that limit: add new endpoints to an existing multiplexer file (plus a `vercel.json` rewrite) rather than creating a new `.ts` file.
- Admin mutations call `requireAdmin`; admin-account management calls `requireSuperAdmin` (public invite/reset actions excepted). Keep checks on new handlers.
- `SESSION_SECRET` signs sessions and derives the MFA encryption key: rotating it invalidates sessions and existing TOTP enrollments. `createRateLimiter` is in-memory per serverless instance; security lockouts live in Postgres.
- Invite/reset links use `siteOrigin()`, which trusts only `PUBLIC_SITE_HOST` or `motom*.vercel.app`; set `PUBLIC_SITE_HOST` when testing those flows locally.
- Tailwind v4 has no `tailwind.config.*`; design tokens live in `src/index.css` `@theme`. The README color table is stale; use the CSS values.
- `vercel.json` defines a strict CSP. Any new external script, font, frame, or browser API domain must be added to the matching directive, or it will fail only in production.
- Keep server secrets server-only (`DATABASE_URL`, `SESSION_SECRET`, `CLOUDINARY_*`, `RESEND_*`). Only `VITE_*` values are public; add new variables to `.env.example` and Vercel.
