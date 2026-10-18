-- 002_admins.sql — Table des administrateurs (multi-admin)
-- Rôles : superadmin (email configuré via SUPERADMIN_EMAIL) / admin
-- Statuts : invited (lien envoyé, pas encore activé) / active / blocked

CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  username TEXT UNIQUE,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin')),
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'blocked')),
  invite_token TEXT UNIQUE,
  invite_token_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Index pour la recherche par email/username au login
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins (email);
CREATE INDEX IF NOT EXISTS idx_admins_invite_token ON admins (invite_token);