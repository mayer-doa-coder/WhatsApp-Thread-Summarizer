-- Run this in the Supabase SQL editor: https://supabase.com/dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS password_resets (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT        NOT NULL,
  token_hash TEXT        NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_resets_email
  ON password_resets (email);

CREATE INDEX IF NOT EXISTS idx_password_resets_token_hash
  ON password_resets (token_hash);
