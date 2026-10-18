-- 003_reset_tokens.sql — Réinitialisation de mot de passe des admins
-- Le superadmin déclenche un reset : un jeton à durée limitée est généré
-- et envoyé par email à l'admin concerné.

ALTER TABLE admins
  ADD COLUMN IF NOT EXISTS reset_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_admins_reset_token ON admins (reset_token);