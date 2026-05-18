'use strict';

const crypto = require('crypto');
const supabase = require('../config/supabase');

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Invalidates any existing unused reset tokens for the email, generates a new
 * plain token, persists its hash, and returns the plain token (only exposure).
 */
async function createResetToken(email) {
  // Invalidate stale tokens for this email so there is never more than one live token
  await supabase
    .from('password_resets')
    .update({ used: true })
    .eq('email', email)
    .eq('used', false);

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + RESET_TTL_MS).toISOString();

  const { error } = await supabase.from('password_resets').insert({
    email,
    token_hash: hashToken(token),
    expires_at: expiresAt,
  });

  if (error) throw new Error(error.message);
  return token;
}

/**
 * Looks up an unexpired, unused reset record by token.
 * Returns the record { id, email } or null if invalid/expired/used.
 */
async function findResetRecord(token) {
  const { data, error } = await supabase
    .from('password_resets')
    .select('id, email, expires_at, used')
    .eq('token_hash', hashToken(token))
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  if (data.used) return null;
  if (new Date(data.expires_at) < new Date()) return null;

  return { id: data.id, email: data.email };
}

/**
 * Marks a reset record as consumed so it cannot be reused.
 */
async function consumeResetToken(id) {
  const { error } = await supabase
    .from('password_resets')
    .update({ used: true })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

module.exports = { createResetToken, findResetRecord, consumeResetToken };
