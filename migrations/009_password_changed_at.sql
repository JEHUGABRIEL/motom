-- 009_password_changed_at.sql — Invalidation des sessions au changement de mot de passe
-- Chaque token de session embarque sa date d'émission (iat). Une session émise
-- avant password_changed_at est rejetée par getSessionAdmin() : un reset de mot
-- de passe coupe donc immédiatement les sessions ouvertes par un tiers.
-- Colonne nullable : NULL = aucune contrainte (comptes antérieurs à cette migration).

ALTER TABLE admins ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;
