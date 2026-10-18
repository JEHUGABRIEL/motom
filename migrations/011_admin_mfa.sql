-- 011_admin_mfa.sql — Double authentification TOTP pour les comptes admin
-- Optionnelle par compte : une ligne n'existe que si l'admin a lancé la configuration.
-- secret          : secret TOTP chiffré en AES-256-GCM (jamais en clair, cf. lib/mfa.ts)
-- enabled         : passe à true seulement après vérification d'un premier code
-- failed_attempts : verrouillage anti-brute-force, en base et non en mémoire, pour
--                   résister au recyclage des instances serverless
-- recovery_codes  : hashes sha256 des codes de secours à usage unique

CREATE TABLE IF NOT EXISTS admin_mfa (
  admin_id TEXT PRIMARY KEY REFERENCES admins(id) ON DELETE CASCADE,
  secret TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  failed_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  recovery_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);
