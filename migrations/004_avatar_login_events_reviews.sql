-- 004_avatar_login_events_reviews.sql
-- Photo de profil admin + journal des connexions + avis clients

ALTER TABLE admins
  ADD COLUMN IF NOT EXISTS avatar TEXT NOT NULL DEFAULT '';

-- Journal des connexions (cloche de notification du back-office)
CREATE TABLE IF NOT EXISTS login_events (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT,
  ip TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT '',
  device TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_events_admin ON login_events (admin_id, created_at DESC);

-- Avis clients publiés sur le site
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  author TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews (status, created_at DESC);