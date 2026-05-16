'use strict';

// ── Module mocks (hoisted before any require) ─────────────────────────────────

jest.mock('../../src/config/supabase.js', () => ({ from: jest.fn() }));

jest.mock('../../src/config/llm.js', () => ({
  callLLM: jest.fn(),
  TIERS: [],
  RETRY_DELAY_MS: 0,
}));

jest.mock('../../src/models/user.js', () => ({
  createUser: jest.fn(),
  findUserByEmail: jest.fn(),
  findUserById: jest.fn(),
}));

jest.mock('../../src/models/summary.js', () => ({
  saveSummary: jest.fn(),
  getUserSummaries: jest.fn(),
  deleteSummary: jest.fn(),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('../../src/export/pdfExporter.js', () => ({
  exportBriefToPDF: jest.fn().mockResolvedValue(Buffer.from('mock-pdf')),
}));

// ── Env vars (must be set before app is required) ─────────────────────────────

process.env.JWT_SECRET = 'test-integration-secret';
process.env.SUPABASE_URL = 'https://mock.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'mock-service-key';

// ── Imports ───────────────────────────────────────────────────────────────────

const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { createUser, findUserByEmail } = require('../../src/models/user.js');
const { saveSummary, getUserSummaries, deleteSummary } = require('../../src/models/summary.js');
const { exportBriefToPDF } = require('../../src/export/pdfExporter.js');
const app = require('../../src/app.js');

// ── Helpers ───────────────────────────────────────────────────────────────────

const JWT_SECRET = 'test-integration-secret';
const MOCK_USER_ID = 'user-uuid-abc123';

function makeToken(userId = MOCK_USER_ID, email = 'alice@example.com') {
  return jwt.sign({ sub: userId, email }, JWT_SECRET, { expiresIn: '1h' });
}

beforeEach(() => jest.clearAllMocks());

// ── Auth: POST /api/auth/register ─────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  test('valid credentials → 201 with token', async () => {
    findUserByEmail.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashed-password');
    createUser.mockResolvedValue({ id: MOCK_USER_ID, email: 'alice@example.com' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'alice@example.com', password: 'SecurePass1!' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
  });

  test('duplicate email → 409', async () => {
    findUserByEmail.mockResolvedValue({ id: MOCK_USER_ID, email: 'alice@example.com' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'alice@example.com', password: 'SecurePass1!' });

    expect(res.status).toBe(409);
  });

  test('missing password → 422', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'alice@example.com' });

    expect(res.status).toBe(422);
  });
});

// ── Auth: POST /api/auth/login ────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  test('valid credentials → 200 with token and user', async () => {
    findUserByEmail.mockResolvedValue({ id: MOCK_USER_ID, email: 'alice@example.com', passwordHash: 'hashed' });
    bcrypt.compare.mockResolvedValue(true);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'SecurePass1!' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe('alice@example.com');
  });

  test('wrong password → 401', async () => {
    findUserByEmail.mockResolvedValue({ id: MOCK_USER_ID, email: 'alice@example.com', passwordHash: 'hashed' });
    bcrypt.compare.mockResolvedValue(false);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'WrongPass!' });

    expect(res.status).toBe(401);
  });
});

// ── History: GET /api/history ─────────────────────────────────────────────────

describe('GET /api/history', () => {
  test('no token → 401', async () => {
    const res = await request(app).get('/api/history');
    expect(res.status).toBe(401);
  });

  test('valid token → 200 with summaries array', async () => {
    const mockSummaries = [
      { id: 'sum-1', filename: 'chat.txt', type: 'thread', summaryText: 'A brief summary.', messageCount: 42, createdAt: new Date().toISOString() },
    ];
    getUserSummaries.mockResolvedValue(mockSummaries);

    const res = await request(app)
      .get('/api/history')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('summaries');
    expect(Array.isArray(res.body.summaries)).toBe(true);
    expect(res.body.summaries).toHaveLength(1);
    expect(res.body.summaries[0].id).toBe('sum-1');
  });
});

// ── History: POST /api/history ────────────────────────────────────────────────

describe('POST /api/history', () => {
  test('valid payload + token → 201 with saved summary', async () => {
    const saved = { id: 'sum-new', filename: 'group.txt', type: 'thread', summaryText: 'Key points.' };
    saveSummary.mockResolvedValue(saved);

    const res = await request(app)
      .post('/api/history')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ filename: 'group.txt', type: 'thread', summaryText: 'Key points.' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('summary');
    expect(res.body.summary.id).toBe('sum-new');
  });

  test('missing summaryText → 400', async () => {
    const res = await request(app)
      .post('/api/history')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ filename: 'group.txt', type: 'thread' });

    expect(res.status).toBe(400);
  });
});

// ── History: DELETE /api/history/:id ─────────────────────────────────────────

describe('DELETE /api/history/:id', () => {
  test('valid token + own summary → 204', async () => {
    deleteSummary.mockResolvedValue(undefined);

    const res = await request(app)
      .delete('/api/history/sum-1')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(204);
  });

  test("another user's summary (IDOR) → 403", async () => {
    deleteSummary.mockRejectedValue(new Error('Summary not found or does not belong to the requesting user.'));

    const res = await request(app)
      .delete('/api/history/sum-other')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(403);
  });
});

// ── Export: POST /api/export/pdf ──────────────────────────────────────────────

describe('POST /api/export/pdf', () => {
  const briefPayload = {
    date: '2026-05-16',
    participants: ['Alice', 'Bob'],
    summaries: [{ filename: 'chat.txt', summaryText: 'Discussed launch date.' }],
  };

  test('valid token → 200 with PDF binary response', async () => {
    const res = await request(app)
      .post('/api/export/pdf')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send(briefPayload);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
    expect(res.headers['content-disposition']).toMatch(/attachment/);
    expect(exportBriefToPDF).toHaveBeenCalledTimes(1);
  });

  test('no token → 401', async () => {
    const res = await request(app)
      .post('/api/export/pdf')
      .send(briefPayload);

    expect(res.status).toBe(401);
    expect(exportBriefToPDF).not.toHaveBeenCalled();
  });
});
