'use strict';

// ── Module mocks (must be before any require) ─────────────────────────────────

jest.mock('../src/config/supabase.js', () => ({ from: jest.fn() }));

jest.mock('../src/config/llm.js', () => ({
  callLLM: jest.fn(),
  TIERS: [],
  RETRY_DELAY_MS: 0,
}));

jest.mock('../src/models/user.js', () => ({
  createUser: jest.fn(),
  findUserByEmail: jest.fn(),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// ── Imports ───────────────────────────────────────────────────────────────────

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { createUser, findUserByEmail } = require('../src/models/user.js');
const app = require('../src/app.js');
const authenticate = require('../src/middleware/authenticate.js');

process.env.JWT_SECRET = 'test-jwt-secret-for-auth-tests';

beforeEach(() => jest.clearAllMocks());

// ── Test 1: POST /api/auth/register — success path ───────────────────────────

test('POST /api/auth/register: valid email + password → 201 with token, password was hashed', async () => {
  findUserByEmail.mockResolvedValue(null);
  bcrypt.hash.mockResolvedValue('$2b$12$hashedpassword');
  createUser.mockResolvedValue({
    id: 'user-uuid-001',
    email: 'alice@example.com',
    created_at: '2026-05-16T10:00:00.000Z',
  });

  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: 'alice@example.com', password: 'securepass123' });

  expect(res.status).toBe(201);
  expect(res.body.token).toBeDefined();
  expect(typeof res.body.token).toBe('string');
  expect(res.body.user.id).toBe('user-uuid-001');
  expect(res.body.user.email).toBe('alice@example.com');
  expect(bcrypt.hash).toHaveBeenCalledWith('securepass123', 12);
  expect(createUser).toHaveBeenCalledWith('alice@example.com', '$2b$12$hashedpassword');
});

// ── Test 2: POST /api/auth/register — duplicate email → 409 ──────────────────

test('POST /api/auth/register: duplicate email → 409 Conflict with descriptive message', async () => {
  findUserByEmail.mockResolvedValue({
    id: 'existing-user',
    email: 'alice@example.com',
    password_hash: '$2b$12$existing',
    created_at: '2026-01-01T00:00:00.000Z',
  });

  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: 'alice@example.com', password: 'securepass123' });

  expect(res.status).toBe(409);
  expect(res.body.message).toMatch(/already in use/i);
  expect(createUser).not.toHaveBeenCalled();
});

// ── Test 3: POST /api/auth/register — validation interception → 422 ───────────

test('POST /api/auth/register: invalid email + short password → 422 with errors array', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: 'not-an-email', password: 'short' });

  expect(res.status).toBe(422);
  expect(Array.isArray(res.body.errors)).toBe(true);
  expect(res.body.errors.length).toBeGreaterThan(0);
  expect(findUserByEmail).not.toHaveBeenCalled();
  expect(createUser).not.toHaveBeenCalled();
});

// ── Test 4: POST /api/auth/login — wrong password → 401 ──────────────────────

test('POST /api/auth/login: correct email but wrong password → 401 Unauthorized', async () => {
  findUserByEmail.mockResolvedValue({
    id: 'user-uuid-001',
    email: 'alice@example.com',
    password_hash: '$2b$12$correcthash',
    created_at: '2026-05-16T10:00:00.000Z',
  });
  bcrypt.compare.mockResolvedValue(false);

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'alice@example.com', password: 'wrongpassword' });

  expect(res.status).toBe(401);
  expect(res.body.message).toBe('Invalid email or password.');
  expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', '$2b$12$correcthash');
});

// ── Test 5: authenticate middleware — expired token → 403 ─────────────────────

test('authenticate middleware: expired token → 403 Forbidden (TokenExpiredError)', async () => {
  const miniApp = express();
  miniApp.use(express.json());
  miniApp.get('/protected', authenticate, (req, res) => res.json({ ok: true }));

  const expiredToken = jwt.sign(
    {
      sub: 'user-uuid-001',
      email: 'alice@example.com',
      exp: Math.floor(Date.now() / 1000) - 60,
    },
    process.env.JWT_SECRET,
  );

  const res = await request(miniApp)
    .get('/protected')
    .set('Authorization', `Bearer ${expiredToken}`);

  expect(res.status).toBe(403);
  expect(res.body.message).toBe('Token has expired.');
  expect(res.body.error).toBe('Forbidden');
});
