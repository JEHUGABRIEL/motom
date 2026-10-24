-- 015_admin_temp_password.sql — Mot de passe temporaire et OTP de connexion
-- Le superadmin génère hors application un mot de passe aléatoire à usage unique
-- (temp_password_hash, jamais en clair). L'admin se connecte avec, doit
-- immédiatement le remplacer (must_change_password) puis valider un code à 6
-- chiffres envoyé par email (admin_login_otp). Le temporaire expire à la
-- première connexion réussie : les colonnes sont alors vidées.

ALTER TABLE admins
  ADD COLUMN IF NOT EXISTS temp_password_hash TEXT,
  ADD COLUMN IF NOT EXISTS temp_password_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS admin_login_otp (
  admin_id TEXT PRIMARY KEY REFERENCES admins(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
