-- 012_login_lockout.sql — Verrouillage du login par mot de passe, en base
-- Le limiteur de lib/rate-limit.ts vit dans la mémoire de l'instance serverless :
-- Vercel en exécute plusieurs en parallèle et les recycle, si bien que la limite
-- « 5 essais / 15 min » repart à zéro en permanence. Ces colonnes déplacent le
-- compteur dans la base, seul état réellement partagé entre les instances.
-- reset_requested_at borne par ailleurs la fréquence d'envoi des emails de reset.

ALTER TABLE admins
  ADD COLUMN IF NOT EXISTS failed_attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reset_requested_at TIMESTAMPTZ;
