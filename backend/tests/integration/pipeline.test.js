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

jest.mock('../../src/summarizer/replyDrafter.js', () => ({
  draftReplies: jest.fn(),
}));

jest.mock('../../src/summarizer/summarizer.js', () => ({
  processSummarization: jest.fn(),
}));

jest.mock('../../src/summarizer/briefComposer.js', () => ({
  composeDailyBrief: jest.fn(),
}));

// ── Env vars ──────────────────────────────────────────────────────────────────

process.env.JWT_SECRET = 'test-pipeline-secret';
process.env.SUPABASE_URL = 'https://mock.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'mock-service-key';

// ── Imports ───────────────────────────────────────────────────────────────────

const request = require('supertest');
const { callLLM } = require('../../src/config/llm.js');
const { draftReplies } = require('../../src/summarizer/replyDrafter.js');
const { processSummarization } = require('../../src/summarizer/summarizer.js');
const { composeDailyBrief } = require('../../src/summarizer/briefComposer.js');
const app = require('../../src/app.js');

// ── Fixtures ──────────────────────────────────────────────────────────────────

// Minimal valid WhatsApp export text in Android format (DD/MM/YYYY, HH:MM - Sender: Message).
const VALID_WHATSAPP_TXT = [
  '16/05/2026, 10:00 - Alice: Hello there!',
  '16/05/2026, 10:01 - Bob: Hi Alice, how are you?',
  '16/05/2026, 10:02 - Alice: Let\'s meet tomorrow at 2 PM.',
  '16/05/2026, 10:03 - Bob: Sure, I\'ll be there.',
  '16/05/2026, 10:04 - Alice: Great, see you then!',
].join('\n');

const VALID_SUMMARY = {
  topic: 'Meeting planning',
  keyDecisions: ['Meet tomorrow at 2 PM'],
  actionItems: [],
  notableFacts: [],
  participants: ['Alice', 'Bob'],
  summaryText: 'Alice and Bob arranged to meet the next day at 2 PM.',
};

const VALID_BRIEF_CORE = {
  overviewParagraph: 'A productive day of planning.',
  chatCards: [
    {
      filename: 'chat.txt',
      topic: 'Meeting planning',
      oneLiner: 'Alice and Bob planned a meeting.',
      actionRequired: false,
      actionItems: [],
      participants: ['Alice', 'Bob'],
    },
  ],
  crossChatInsights: ['Teams are aligning on schedules.'],
  keyPeople: ['Alice', 'Bob'],
};

beforeEach(() => jest.clearAllMocks());

// ── POST /api/reply ───────────────────────────────────────────────────────────

describe('POST /api/reply', () => {
  const validMessages = [{ sender: 'Alice', content: 'Hello', timestamp: '2026-05-16T10:00:00Z', type: 'text' }];

  test('empty messages array → 400', async () => {
    const res = await request(app).post('/api/reply').send({ messages: [], userIntent: 'greet', tone: 'casual' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/non-empty array/);
    expect(draftReplies).not.toHaveBeenCalled();
  });

  test('non-array messages → 400', async () => {
    const res = await request(app).post('/api/reply').send({ messages: 'not an array', userIntent: 'greet' });
    expect(res.status).toBe(400);
    expect(draftReplies).not.toHaveBeenCalled();
  });

  test('50+ messages → 400', async () => {
    const bigMessages = Array.from({ length: 50 }, (_, i) => ({
      sender: 'Alice', content: `Message ${i}`, type: 'text',
    }));
    const res = await request(app).post('/api/reply').send({ messages: bigMessages, tone: 'casual' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/fewer than 50/);
    expect(draftReplies).not.toHaveBeenCalled();
  });

  test('valid messages → 200 with 3 reply options', async () => {
    draftReplies.mockResolvedValue(['Reply A', 'Reply B', 'Reply C']);
    const res = await request(app)
      .post('/api/reply')
      .send({ messages: validMessages, userIntent: 'confirm meeting', tone: 'formal' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('options');
    expect(res.body.options).toEqual(['Reply A', 'Reply B', 'Reply C']);
    expect(draftReplies).toHaveBeenCalledWith(validMessages, 'confirm meeting', 'formal');
  });
});

// ── POST /api/summarize ───────────────────────────────────────────────────────

describe('POST /api/summarize', () => {
  const validMessages = [
    { sender: 'Alice', content: 'Hello!', timestamp: '2026-05-16T10:00:00Z', type: 'text' },
    { sender: 'Bob', content: 'Hi there!', timestamp: '2026-05-16T10:01:00Z', type: 'text' },
  ];

  test('empty messages array → 400', async () => {
    const res = await request(app).post('/api/summarize').send({ messages: [], summaryType: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/non-empty array/);
    expect(callLLM).not.toHaveBeenCalled();
  });

  test('missing messages → 400', async () => {
    const res = await request(app).post('/api/summarize').send({ summaryType: 'medium' });
    expect(res.status).toBe(400);
    expect(callLLM).not.toHaveBeenCalled();
  });

  test('valid messages with summaryType → 200 with summary JSON', async () => {
    callLLM.mockResolvedValue(JSON.stringify(VALID_SUMMARY));
    const res = await request(app)
      .post('/api/summarize')
      .send({ messages: validMessages, summaryType: 'short' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('topic', 'Meeting planning');
    expect(res.body).toHaveProperty('summaryText');
    expect(Array.isArray(res.body.keyDecisions)).toBe(true);
    expect(callLLM).toHaveBeenCalledTimes(1);
  });

  test('unknown summaryType defaults to medium (still 200)', async () => {
    callLLM.mockResolvedValue(JSON.stringify(VALID_SUMMARY));
    const res = await request(app)
      .post('/api/summarize')
      .send({ messages: validMessages, summaryType: 'invalid-type' });
    expect(res.status).toBe(200);
    expect(callLLM).toHaveBeenCalledTimes(1);
  });

  test('LLM failure → 500', async () => {
    callLLM.mockRejectedValue(new Error('LLM service unavailable'));
    const res = await request(app)
      .post('/api/summarize')
      .send({ messages: validMessages, summaryType: 'medium' });
    expect(res.status).toBe(500);
    expect(res.body.message).toMatch(/LLM service unavailable/);
  });
});

// ── POST /api/upload ──────────────────────────────────────────────────────────

describe('POST /api/upload', () => {
  test('no files attached → 400', async () => {
    const res = await request(app).post('/api/upload');
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/No files provided/);
  });

  test('valid .txt file → 200 with parsed results', async () => {
    const res = await request(app)
      .post('/api/upload')
      .attach('files', Buffer.from(VALID_WHATSAPP_TXT), 'chat.txt');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('files');
    expect(Array.isArray(res.body.files)).toBe(true);
    expect(res.body.files[0].filename).toBe('chat.txt');
    expect(res.body.files[0].messageCount).toBeGreaterThan(0);
    expect(Array.isArray(res.body.files[0].participants)).toBe(true);
  });

  test('multiple valid .txt files → 200 with multiple results', async () => {
    const res = await request(app)
      .post('/api/upload')
      .attach('files', Buffer.from(VALID_WHATSAPP_TXT), 'chat1.txt')
      .attach('files', Buffer.from(VALID_WHATSAPP_TXT), 'chat2.txt');
    expect(res.status).toBe(200);
    expect(res.body.files).toHaveLength(2);
    expect(res.body.files[0].filename).toBe('chat1.txt');
    expect(res.body.files[1].filename).toBe('chat2.txt');
  });

  test('binary (PNG) file disguised as .txt → 415', async () => {
    // PNG magic bytes: 0x89 0x50 0x4E 0x47
    const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
    const res = await request(app)
      .post('/api/upload')
      .attach('files', pngBytes, { filename: 'image.txt', contentType: 'text/plain' });
    expect(res.status).toBe(415);
    expect(res.body.message).toMatch(/Binary files/);
  });

  test('.txt with no WhatsApp messages → 400', async () => {
    const plainText = 'This is just plain text with no WhatsApp format at all.\n';
    const res = await request(app)
      .post('/api/upload')
      .attach('files', Buffer.from(plainText), 'notwhatsapp.txt');
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/no recognis/i);
  });

  test('oversized file → 413', async () => {
    // Create a buffer just over 5 MB
    const oversized = Buffer.alloc(5 * 1024 * 1024 + 1, 'a');
    const res = await request(app)
      .post('/api/upload')
      .attach('files', oversized, { filename: 'big.txt', contentType: 'text/plain' });
    expect(res.status).toBe(413);
    expect(res.body.message).toMatch(/size limit/);
  });
});

// ── POST /api/brief ───────────────────────────────────────────────────────────

describe('POST /api/brief', () => {
  test('no files attached → 400', async () => {
    const res = await request(app).post('/api/brief');
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/No files provided/);
  });

  test('binary file in batch → 415', async () => {
    const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
    const res = await request(app)
      .post('/api/brief')
      .attach('files', pngBytes, { filename: 'image.txt', contentType: 'text/plain' });
    expect(res.status).toBe(415);
    expect(res.body.message).toMatch(/Binary files/);
  });

  test('.txt with no WhatsApp messages → 400', async () => {
    const plainText = 'This file has no WhatsApp content whatsoever.\n';
    const res = await request(app)
      .post('/api/brief')
      .attach('files', Buffer.from(plainText), 'empty.txt');
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/no recognis/i);
  });

  test('valid .txt file → 200 with brief JSON', async () => {
    processSummarization.mockResolvedValue(VALID_SUMMARY);
    composeDailyBrief.mockResolvedValue(VALID_BRIEF_CORE);

    const res = await request(app)
      .post('/api/brief')
      .attach('files', Buffer.from(VALID_WHATSAPP_TXT), 'chat.txt');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('brief');
    expect(res.body).toHaveProperty('processingMs');
    expect(res.body.brief).toHaveProperty('overviewParagraph', 'A productive day of planning.');
    expect(res.body.brief).toHaveProperty('chatCards');
    expect(res.body.brief.filesProcessed).toBe(1);
    expect(processSummarization).toHaveBeenCalledTimes(1);
    expect(composeDailyBrief).toHaveBeenCalledTimes(1);
  });

  test('multiple valid files → 200 with filesProcessed count', async () => {
    processSummarization.mockResolvedValue(VALID_SUMMARY);
    composeDailyBrief.mockResolvedValue({
      ...VALID_BRIEF_CORE,
      chatCards: [VALID_BRIEF_CORE.chatCards[0], { ...VALID_BRIEF_CORE.chatCards[0], filename: 'chat2.txt' }],
    });

    const res = await request(app)
      .post('/api/brief')
      .attach('files', Buffer.from(VALID_WHATSAPP_TXT), 'chat1.txt')
      .attach('files', Buffer.from(VALID_WHATSAPP_TXT), 'chat2.txt');

    expect(res.status).toBe(200);
    expect(res.body.brief.filesProcessed).toBe(2);
    expect(processSummarization).toHaveBeenCalledTimes(2);
  });

  test('pipeline 504 error → 504 Gateway Timeout response', async () => {
    processSummarization.mockRejectedValue(
      Object.assign(new Error('Request timed out — brief generation exceeded 60 seconds.'), { status: 504 }),
    );

    const res = await request(app)
      .post('/api/brief')
      .attach('files', Buffer.from(VALID_WHATSAPP_TXT), 'chat.txt');

    expect(res.status).toBe(504);
    expect(res.body.error).toBe('Gateway Timeout');
  });
});
