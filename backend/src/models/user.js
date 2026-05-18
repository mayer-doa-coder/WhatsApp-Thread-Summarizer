'use strict';

const supabase = require('../config/supabase');

/**
 * Insert a new user row. Returns the created user object.
 * @param {string} email
 * @param {string} passwordHash  bcrypt hash
 */
async function createUser(email, passwordHash) {
  const { data, error } = await supabase
    .from('users')
    .insert({ email, password_hash: passwordHash, is_verified: false })
    .select('id, email, created_at')
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Look up a user by email. Returns the row or null if not found.
 * @param {string} email
 */
async function findUserByEmail(email) {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, password_hash, created_at, is_verified')
    .eq('email', email)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ?? null;
}

/**
 * Look up a user by primary key. Returns the row or null if not found.
 * @param {string} id
 */
async function findUserById(id) {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, created_at')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ?? null;
}

async function markUserVerified(email) {
  const { error } = await supabase
    .from('users')
    .update({ is_verified: true })
    .eq('email', email);

  if (error) throw new Error(error.message);
}

module.exports = { createUser, findUserByEmail, findUserById, markUserVerified };
