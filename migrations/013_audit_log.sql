-- 013_audit_log.sql — Journal d'audit du back-office et des événements de sécurité
-- Table volontairement sans clé étrangère vers admins : un compte supprimé ne doit
-- pas effacer son historique. Les métadonnées ne doivent jamais contenir de secret
-- (mot de passe, jeton, code MFA, cookie de session).

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_id TEXT,
  actor_email TEXT NOT NULL DEFAULT '',
  actor_username TEXT,
  actor_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failure')),
  ip TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at
  ON audit_log (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_action
  ON audit_log (action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity
  ON audit_log (entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_actor
  ON audit_log (actor_id, created_at DESC);
