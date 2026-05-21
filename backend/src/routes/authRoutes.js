'use strict';

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { createUser, findUserByEmail, findUserById, markUserVerified, updateUserProfile } = require('../models/user');
const authenticate = require('../middleware/authenticate');
const { createOTP, verifyOTP } = require('../models/otp');
const { createResetToken, findResetRecord, consumeResetToken } = require('../models/passwordReset');
const { sendOTPEmail, sendPasswordResetEmail } = require('../services/emailService');

const router = express.Router();

const BCRYPT_ROUNDS = 12;
const JWT_EXPIRY = '30d';

// Normalise email: lowercase + trim. We intentionally skip express-validator's
// normalizeEmail() because it strips dots from Gmail addresses, causing a
// mismatch between the stored email and what the user types at login.
function normaliseEmail(raw) {
  return (raw ?? '').trim().toLowerCase();
}

const registerValidators = [
  body('email').isEmail().withMessage('A valid email address is required.'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
];

// POST /api/auth/register
router.post('/register', registerValidators, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const email = normaliseEmail(req.body.email);
  const { password } = req.body;

  try {
    const existing = await findUserByEmail(email);
    if (existing && existing.is_verified) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'An account with this email already exists.',
        code: 409,
      });
    }

    if (!existing) {
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      await createUser(email, passwordHash);
    } else {
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      const supabase = require('../config/supabase');
      await supabase.from('users').update({ password_hash: passwordHash }).eq('email', email);
    }

    const otp = await createOTP(email);
    await sendOTPEmail(email, otp);

    return res.status(200).json({
      message: `Verification code sent to ${email}. Check your inbox.`,
      email,
    });
  } catch (err) {
    return next(err);
  }
});

// POST /api/auth/verify-otp
// Validates the OTP, marks the account as verified, and returns a JWT for
// immediate auto-login so the user does not need a separate /login round-trip.
router.post('/verify-otp', async (req, res, next) => {
  const email = normaliseEmail(req.body.email);
  const { otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Bad Request', message: 'email and otp are required.', code: 400 });
  }

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'Not Found', message: 'No account found for this email.', code: 404 });
    }

    const valid = await verifyOTP(email, otp);
    if (!valid) {
      return res.status(400).json({ error: 'Bad Request', message: 'Invalid or expired verification code.', code: 400 });
    }

    await markUserVerified(email);

    const token = jwt.sign(
      { sub: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRY },
    );

    return res.status(200).json({
      message: 'Email verified successfully.',
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    return next(err);
  }
});

// POST /api/auth/resend-otp
router.post('/resend-otp', async (req, res, next) => {
  const email = normaliseEmail(req.body.email);

  if (!email) {
    return res.status(400).json({ error: 'Bad Request', message: 'email is required.', code: 400 });
  }

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(200).json({ message: 'If that email is registered, a new code has been sent.' });
    }
    if (user.is_verified) {
      return res.status(400).json({ error: 'Bad Request', message: 'This account is already verified.', code: 400 });
    }

    const otp = await createOTP(email);
    await sendOTPEmail(email, otp);

    return res.status(200).json({ message: 'A new verification code has been sent to your email.' });
  } catch (err) {
    return next(err);
  }
});

const LOGIN_GENERIC_ERROR = 'Invalid email or password.';

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  const email = normaliseEmail(req.body.email);
  const { password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Bad Request', message: 'email and password are required.', code: 400 });
  }

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized', message: LOGIN_GENERIC_ERROR, code: 401 });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Unauthorized', message: LOGIN_GENERIC_ERROR, code: 401 });
    }

    if (!user.is_verified) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Please verify your email before logging in.',
        code: 403,
        unverified: true,
        email: user.email,
      });
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRY },
    );

    return res.status(200).json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    return next(err);
  }
});

// POST /api/auth/forgot-password
// Sends a password-reset link to the email if it belongs to a verified account.
// Always returns 200 to avoid leaking whether an email is registered.
router.post('/forgot-password', async (req, res, next) => {
  const email = normaliseEmail(req.body.email);

  if (!email) {
    return res.status(400).json({ error: 'Bad Request', message: 'email is required.', code: 400 });
  }

  try {
    const user = await findUserByEmail(email);

    // Only send a reset link if the account exists AND is verified.
    // Unverified accounts should complete signup instead of resetting a password.
    if (user && user.is_verified) {
      const token = await createResetToken(email);
      await sendPasswordResetEmail(email, token);
    }

    return res.status(200).json({
      message: 'If that email is registered, a password reset link has been sent.',
    });
  } catch (err) {
    return next(err);
  }
});

// POST /api/auth/reset-password
// Validates the reset token and updates the user's password.
router.post('/reset-password', async (req, res, next) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: 'Bad Request', message: 'token and password are required.', code: 400 });
  }

  if (password.length < 8) {
    return res.status(422).json({
      error: 'Unprocessable Entity',
      message: 'Password must be at least 8 characters.',
      code: 422,
    });
  }

  try {
    const record = await findResetRecord(token);
    if (!record) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'This reset link is invalid or has expired. Please request a new one.',
        code: 400,
      });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const supabase = require('../config/supabase');
    await supabase.from('users').update({ password_hash: passwordHash }).eq('email', record.email);

    await consumeResetToken(record.id);

    return res.status(200).json({ message: 'Password updated successfully. You can now log in.' });
  } catch (err) {
    return next(err);
  }
});

// GET /api/auth/me — returns the authenticated user's full profile
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await findUserById(req.user.sub);
    if (!user) {
      return res.status(404).json({ error: 'Not Found', message: 'User not found.', code: 404 });
    }
    return res.status(200).json({
      id: user.id,
      email: user.email,
      displayName: user.display_name ?? null,
      plan: user.plan ?? 'free',
      createdAt: user.created_at,
    });
  } catch (err) {
    return next(err);
  }
});

// PATCH /api/auth/profile — update display name and/or password
router.patch('/profile', authenticate, async (req, res, next) => {
  const userId = req.user.sub;
  const { displayName, currentPassword, newPassword } = req.body;

  if (displayName === undefined && newPassword === undefined) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'At least one of displayName or newPassword must be provided.',
      code: 400,
    });
  }

  try {
    const updates = {};

    if (displayName !== undefined) {
      if (typeof displayName !== 'string' || displayName.trim().length === 0) {
        return res.status(422).json({ error: 'Unprocessable Entity', message: 'displayName must be a non-empty string.', code: 422 });
      }
      updates.displayName = displayName.trim();
    }

    if (newPassword !== undefined) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Bad Request', message: 'currentPassword is required to change your password.', code: 400 });
      }
      if (newPassword.length < 8) {
        return res.status(422).json({ error: 'Unprocessable Entity', message: 'New password must be at least 8 characters.', code: 422 });
      }

      const supabase = require('../config/supabase');
      const { data: userRow } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', userId)
        .single();

      const match = await bcrypt.compare(currentPassword, userRow.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Unauthorized', message: 'Current password is incorrect.', code: 401 });
      }

      updates.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    }

    await updateUserProfile(userId, updates);
    return res.status(200).json({ message: 'Profile updated successfully.' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
