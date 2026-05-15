'use strict';

jest.mock('../src/config/llm.js', () => ({
  callLLM: jest.fn(),
  TIERS: [],
  RETRY_DELAY_MS: 0,
}));

const { callLLM } = require('../src/config/llm.js');
const { composeDailyBrief } = require('../src/summarizer/briefComposer');

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeSummary(overrides = {}) {
  return {
    filename: 'chat.txt',
    topic: 'Project update',
    participants: ['Alice', 'Bob'],
    messageCount: 20,
    dateRange: { from: '2026-05-01T09:00:00.000Z', to: '2026-05-01T17:00:00.000Z' },
    keyDecisions: ['Ship Friday'],
    actionItems: ['Alice will tag the release'],
    notableFacts: ['QA signed off'],
    summaryText: 'The team agreed to ship Friday.',
    ...overrides,
  };
}

function makeBriefJson(overrides = {}) {
  return JSON.stringify({
    overviewParagraph: 'Busy day across all chats.',
    chatCards: [],
    crossChatInsights: ['Everyone is busy'],
    keyPeople: [],
    ...overrides,
  });
}

beforeEach(() => jest.clearAllMocks());

// ── 1. Ideal path: 3 input summaries → 3 chatCards, overviewParagraph extracted ─

test('composeDailyBrief: 3 summaries → 3 chatCards with correct overviewParagraph', async () => {
  const summaries = [
    makeSummary({ filename: 'work.txt' }),
    makeSummary({ filename: 'family.txt' }),
    makeSummary({ filename: 'friends.txt' }),
  ];

  callLLM.mockResolvedValue(makeBriefJson({
    chatCards: [
      { index: 1, oneLiner: 'Work update', actionRequired: true },
      { index: 2, oneLiner: 'Family chat', actionRequired: false },
      { index: 3, oneLiner: 'Friends plan', actionRequired: false },
    ],
  }));

  const result = await composeDailyBrief(summaries);

  expect(callLLM).toHaveBeenCalledTimes(1);
  expect(result.chatCards.length).toBe(3);
  expect(result.overviewParagraph).toBe('Busy day across all chats.');
  expect(result.chatCards[0].filename).toBe('work.txt');
  expect(result.chatCards[0].oneLiner).toBe('Work update');
  expect(result.chatCards[0].actionRequired).toBe(true);
  expect(result.chatCards[2].filename).toBe('friends.txt');
});

// ── 2. Positional merge resilience: LLM returns 2 cards for 3 inputs → still 3 ─

test('composeDailyBrief: LLM returns 2 chatCards for 3 inputs → output still has 3 (positional pad)', async () => {
  const summaries = [
    makeSummary({ filename: 'a.txt' }),
    makeSummary({ filename: 'b.txt' }),
    makeSummary({ filename: 'c.txt' }),
  ];

  callLLM.mockResolvedValue(makeBriefJson({
    chatCards: [
      { index: 1, oneLiner: 'First chat',  actionRequired: false },
      { index: 2, oneLiner: 'Second chat', actionRequired: true },
      // index 3 intentionally omitted — simulates LLM hallucination/dropped entry
    ],
  }));

  const result = await composeDailyBrief(summaries);

  expect(result.chatCards.length).toBe(3);
  // Third card is padded from the input summary with empty LLM fields.
  expect(result.chatCards[2].filename).toBe('c.txt');
  expect(result.chatCards[2].oneLiner).toBe('');
  expect(result.chatCards[2].actionRequired).toBe(false);
});

// ── 3. keyPeople flattening: objects → "Name: context" strings ────────────────

test('composeDailyBrief: keyPeople objects are flattened to "Name: context" strings', async () => {
  const summaries = [makeSummary(), makeSummary({ filename: 'b.txt' })];

  callLLM.mockResolvedValue(makeBriefJson({
    chatCards: [
      { index: 1, oneLiner: 'Chat one', actionRequired: false },
      { index: 2, oneLiner: 'Chat two', actionRequired: false },
    ],
    keyPeople: [
      { name: 'John', context: 'Dev lead' },
      { name: 'Sara', context: 'appears in work and family chats' },
      { name: 'Ghost', context: '' },   // empty context — should produce just the name
    ],
  }));

  const result = await composeDailyBrief(summaries);

  expect(result.keyPeople).toEqual([
    'John: Dev lead',
    'Sara: appears in work and family chats',
    'Ghost',
  ]);
});

// ── 4. Input validation: undefined / null / [] all throw, callLLM never called ─

test('composeDailyBrief: undefined, null, and [] all throw "Input must be a non-empty array of summaries."', async () => {
  await expect(composeDailyBrief(undefined)).rejects.toThrow(
    'Input must be a non-empty array of summaries.',
  );
  await expect(composeDailyBrief(null)).rejects.toThrow(
    'Input must be a non-empty array of summaries.',
  );
  await expect(composeDailyBrief([])).rejects.toThrow(
    'Input must be a non-empty array of summaries.',
  );

  expect(callLLM).toHaveBeenCalledTimes(0);
});
