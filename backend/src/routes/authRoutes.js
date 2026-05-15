'use strict';

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { createUser, findUserByEmail } = require('../models/user');

const router = express.Router();

const BCRYPT_ROUNDS = 12;
const JWT_EXPIRY = '7d';

const registerValidators = [
  body('email').isEmail().withMessage('A valid email address is required.').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters.'),
];

// POST /api/auth/register
router.post('/register', registerValidators, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Email already in use.',
        code: 409,
      });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await createUser(email, passwordHash);

    const token = jwt.sign(
      { sub: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRY },
    );

    return res.status(201).json({
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    return next(err);
  }
});

const LOGIN_GENERIC_ERROR = 'Invalid email or password.';

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  const { email, password } = req.body;
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
    const token = jwt.sign(
      { sub: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30m' },
    );
    return res.status(200).json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
