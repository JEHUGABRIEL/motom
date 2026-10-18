-- 010_hash_tokens.sql — Jetons d'invitation et de réinitialisation hachés au repos
-- Les colonnes invite_token / reset_token stockent désormais sha256(jeton) ; seul
-- le lien envoyé par email porte le jeton en clair. Un accès en lecture à la base
-- ne permet donc plus d'activer un compte invité ni de consommer un reset en cours.
-- Les jetons déjà stockés sont en clair et ne correspondront plus : on les annule
-- plutôt que de laisser des liens qui échoueraient sans explication.

UPDATE admins SET invite_token = NULL, invite_token_expires = NULL WHERE invite_token IS NOT NULL;
UPDATE admins SET reset_token = NULL, reset_token_expires = NULL WHERE reset_token IS NOT NULL;
