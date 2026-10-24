-- 014_rate_limits.sql — Limites de débit partagées entre instances serverless
-- Compteurs à fenêtre fixe : une ligne par clé (label + IP), remise à 1 quand
-- la fenêtre est expirée. Les lignes périmées sont purgées opportunément.

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  reset_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at ON rate_limits (reset_at);
