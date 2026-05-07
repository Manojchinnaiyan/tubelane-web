-- ── Tubelane beta signup schema (D1 / SQLite) ────────────────────────────
-- Apply once on database creation:
--   npx wrangler d1 execute tubelane-beta --remote --file=./schema.sql
--
-- Subsequent edits require a migration (D1 doesn't auto-track migrations).
-- For a beta signup table this is unlikely to change much.

CREATE TABLE IF NOT EXISTS signups (
  -- Lowercased email — UNIQUE so duplicate submissions silently no-op
  -- thanks to INSERT OR IGNORE in the Worker.
  email      TEXT PRIMARY KEY NOT NULL,

  -- User-Agent at signup time. Helps spot scraper / bot patterns.
  ua         TEXT NOT NULL DEFAULT '',

  -- SHA-256 hex of the source IP. Hashed (not raw) so we have a
  -- diagnostic / spam fingerprint without storing personally-identifying
  -- data. Same IP submitting many emails → easy to detect.
  ip_hash    TEXT NOT NULL DEFAULT '',

  -- Referer header — useful for attribution if we ever run a campaign.
  referer    TEXT NOT NULL DEFAULT '',

  -- ISO timestamp set server-side via SQLite's datetime('now').
  created_at TEXT NOT NULL
);

-- Index on created_at so admin CSV exports can sort newest-first
-- without scanning the whole table.
CREATE INDEX IF NOT EXISTS idx_signups_created_at ON signups (created_at DESC);
