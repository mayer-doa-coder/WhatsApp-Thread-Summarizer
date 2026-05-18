'use strict';

const crypto = require('crypto');
const supabase = require('../config/supabase');

const OTP_TTL_MS = 15 * 60 * 1000; // 15 minutes

function generateOTP() {
  // 6-digit numeric code
  return String(100000 + (crypto.randomInt(900000)));
}

/**
 * Delete any existing OTPs for the email, generate a new one, persist it, and return it.
 */
async function createOTP(email) {
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  // Clear stale codes for this email first
  await supabase.from('email_verifications').delete().eq('email', email);

  const { error } = await supabase
    .from('email_verifications')
    .insert({ email, otp_code: otp, expires_at: expiresAt });

  if (error) throw new Error(error.message);
  return otp;
}

/**
 * Check whether the supplied OTP is valid and unexpired.
 * Deletes the row on success so codes are single-use.
 * Returns true on success, false otherwise.
 */
async function verifyOTP(email, otp) {
  const { data, error } = await supabase
    .from('email_verifications')
    .select('id, otp_code, expires_at')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return false;

  if (new Date(data.expires_at) < new Date()) return false;
  if (data.otp_code !== String(otp).trim()) return false;

  // Consume the OTP
  await supabase.from('email_verifications').delete().eq('id', data.id);
  return true;
}

module.exports = { createOTP, verifyOTP };
