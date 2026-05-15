'use strict';

// Mock callLLM before any module under test imports it.
jest.mock('../src/config/llm.js', () => ({
  callLLM: jest.fn(),
  TIERS: [],
  RETRY_DELAY_MS: 0,
}));

const { callLLM } = require('../src/config/llm.js');
const { draftReplies } = require('../src/summarizer/replyDrafter');

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeMsg(overrides = {}) {
  return {
    timestamp: '2026-05-16T10:00:00.000Z',
    sender: 'Alice',
    content: 'Hey, can we meet tomorrow?',
    type: 'text',
    ...overrides,
  };
}

const MESSAGES = [
  makeMsg({ sender: 'Bob', content: 'Are you free tomorrow for the project review?' }),
  makeMsg({ content: 'Yes, let me know the time.' }),
  makeMsg({ sender: 'Bob', content: 'How about 2pm?' }),
];

const THREE_OPTIONS = JSON.stringify([
  'I would be happy to meet at 2pm tomorrow.',
  'Tomorrow at 2pm works well for me.',
  'Let us confirm 2pm for the project review.',
]);

// ── 1. Formal tone: injects no-contractions constraint, returns 3 strings ─────

test('draftReplies (formal): injects MUST NOT contractions constraint and returns 3 non-empty strings', async () => {
  callLLM.mockResolvedValue(THREE_OPTIONS);

  const result = await draftReplies(MESSAGES, 'Confirm 2pm works.', 'formal');

  expect(callLLM).toHaveBeenCalledTimes(1);
  const [[llmMessages]] = callLLM.mock.calls;
  const systemContent = llmMessages.find((m) => m.role === 'system')?.content ?? '';

  expect(systemContent).toContain('FORMAL');
  expect(systemContent).toContain('MUST NOT');
  expect(systemContent).toContain('do not');

  expect(Array.isArray(result)).toBe(true);
  expect(result).toHaveLength(3);
  result.forEach((opt) => {
    expect(typeof opt).toBe('string');
    expect(opt.trim().length).toBeGreaterThan(0);
  });
});

// ── 2. Concise tone: injects strict word-count constraint, returns 3 strings ──

test('draftReplies (concise): injects strict under-40-words constraint and returns 3 non-empty strings', async () => {
  callLLM.mockResolvedValue(
    JSON.stringify(['Confirmed for 2pm.', 'Works for me, see you at 2.', '2pm is perfect.'])
  );

  const result = await draftReplies(MESSAGES, 'Confirm 2pm works.', 'concise');

  expect(callLLM).toHaveBeenCalledTimes(1);
  const [[llmMessages]] = callLLM.mock.calls;
  const systemContent = llmMessages.find((m) => m.role === 'system')?.content ?? '';

  expect(systemContent).toContain('CONCISE');
  expect(systemContent).toContain('40 words');
  expect(systemContent).toContain('Count words carefully');

  expect(Array.isArray(result)).toBe(true);
  expect(result).toHaveLength(3);
  result.forEach((opt) => expect(typeof opt).toBe('string'));
});

// ── 3. Casual tone: executes correctly and returns 3 non-empty string options ─

test('draftReplies (casual): uses CASUAL constraint and returns 3 non-empty string options', async () => {
  callLLM.mockResolvedValue(
    JSON.stringify(["Yeah, 2pm works great!", "I'm in — see you at 2!", "Sure, let's do 2pm."])
  );

  const result = await draftReplies(MESSAGES, 'Accept the meeting invite.', 'casual');

  expect(callLLM).toHaveBeenCalledTimes(1);
  const [[llmMessages]] = callLLM.mock.calls;
  const systemContent = llmMessages.find((m) => m.role === 'system')?.content ?? '';

  expect(systemContent).toContain('CASUAL');

  expect(Array.isArray(result)).toBe(true);
  expect(result).toHaveLength(3);
  result.forEach((opt) => {
    expect(typeof opt).toBe('string');
    expect(opt.trim()).not.toBe('');
  });
});

// ── 4. Input validation: empty messages rejects before any LLM call ───────────

test('draftReplies: rejects with a descriptive error when messages is an empty array', async () => {
  await expect(draftReplies([], 'Some intent', 'casual')).rejects.toThrow(
    'messages must be a non-empty array.'
  );
  expect(callLLM).not.toHaveBeenCalled();
});

// ── 5. User intent shaping: userIntent forwarded verbatim into the user prompt ─

test('draftReplies: passes the userIntent string verbatim into the user prompt sent to callLLM', async () => {
  callLLM.mockResolvedValue(THREE_OPTIONS);

  const userIntent = 'agree to the meeting and suggest bringing the Q1 report';
  await draftReplies(MESSAGES, userIntent, 'casual');

  expect(callLLM).toHaveBeenCalledTimes(1);
  const [[llmMessages]] = callLLM.mock.calls;
  const userContent = llmMessages.find((m) => m.role === 'user')?.content ?? '';

  expect(userContent).toContain(userIntent);
});
