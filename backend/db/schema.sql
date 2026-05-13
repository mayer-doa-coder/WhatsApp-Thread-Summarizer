-- =============================================================
-- WhatsApp Thread Summarizer — Supabase Database Schema
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Safe to re-run: all statements use IF NOT EXISTS / OR REPLACE guards
-- =============================================================

-- Enable pgcrypto for gen_random_uuid() (already available in Supabase by default)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- TABLE: users
-- Stores registered accounts. Supabase Auth is NOT used here;
-- authentication is handled by the Express backend with bcrypt + JWT.
-- =============================================================
CREATE TABLE IF NOT EXISTS users (
    id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT          NOT NULL UNIQUE,
    password_hash TEXT          NOT NULL,
    display_name  TEXT,
    plan          TEXT          NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Keep updated_at current on every row update
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Index for login lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- =============================================================
-- TABLE: sessions
-- Stores refresh tokens issued at login / register.
-- Access tokens (JWT, 30 min) are stateless; only refresh tokens
-- (7-day) are persisted here so they can be revoked.
-- =============================================================
CREATE TABLE IF NOT EXISTS sessions (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    refresh_token   TEXT        NOT NULL UNIQUE,
    user_agent      TEXT,
    ip_address      TEXT,
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at      TIMESTAMPTZ             -- NULL = active; set to revoke
);

-- Fast lookup by token value (used on every /api/auth/refresh call)
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions (refresh_token);

-- Fast lookup of all active sessions for a user (used on logout-all)
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);

-- =============================================================
-- TABLE: summaries
-- Stores summaries saved by a user via POST /api/history.
-- =============================================================
CREATE TABLE IF NOT EXISTS summaries (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    filename        TEXT        NOT NULL CHECK (char_length(filename) <= 255),
    type            TEXT        NOT NULL CHECK (type IN ('thread', 'brief')),
    summary_text    TEXT        NOT NULL CHECK (char_length(summary_text) <= 10000),
    message_count   INTEGER     CHECK (message_count >= 0),
    participants    TEXT[]      DEFAULT '{}',
    date_from       TIMESTAMPTZ,
    date_to         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- All history queries are scoped to a user; this index is critical
CREATE INDEX IF NOT EXISTS idx_summaries_user_id ON summaries (user_id);

-- Support sortBy=createdAt (default) efficiently
CREATE INDEX IF NOT EXISTS idx_summaries_user_created ON summaries (user_id, created_at DESC);

-- Support sortBy=filename
CREATE INDEX IF NOT EXISTS idx_summaries_user_filename ON summaries (user_id, filename);

-- Support type filter
CREATE INDEX IF NOT EXISTS idx_summaries_type ON summaries (type);

-- Full-text search index over filename + summary_text (used by GET /api/history?search=)
CREATE INDEX IF NOT EXISTS idx_summaries_fts ON summaries
    USING GIN (to_tsvector('english', filename || ' ' || summary_text));

-- =============================================================
-- ROW LEVEL SECURITY (RLS)
-- The Express backend connects with the service role key, which
-- bypasses RLS by default. These policies are a defence-in-depth
-- layer in case a future feature uses the anon/user key directly.
-- =============================================================
ALTER TABLE users     ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;

-- Service role bypasses all policies automatically.
-- The policies below apply only to the anon / authenticated roles.

-- users: no direct client access
DROP POLICY IF EXISTS users_no_access ON users;
CREATE POLICY users_no_access ON users FOR ALL TO anon, authenticated USING (false);

-- sessions: owner only
DROP POLICY IF EXISTS sessions_owner ON sessions;
CREATE POLICY sessions_owner ON sessions
    FOR ALL TO authenticated
    USING (user_id = auth.uid());

-- summaries: owner only
DROP POLICY IF EXISTS summaries_owner ON summaries;
CREATE POLICY summaries_owner ON summaries
    FOR ALL TO authenticated
    USING (user_id = auth.uid());

-- =============================================================
-- VERIFICATION QUERIES (commented out — run manually to confirm)
-- =============================================================
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT conname, contype, conrelid::regclass, confrelid::regclass FROM pg_constraint WHERE contype = 'f';
