'use strict';

// Mock callLLM before any module under test imports it.
jest.mock('../src/config/llm.js', () => ({
  callLLM: jest.fn(),
  TIERS: [],
  RETRY_DELAY_MS: 0,
}));

const { callLLM } = require('../src/config/llm.js');
const { buildSummarizationPrompt } = require('../src/summarizer/promptBuilder');
const { parseSummaryResponse } = require('../src/summarizer/responseParsers');
const { processSummarization } = require('../src/summarizer/summarizer');


// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeMsg(overrides = {}) {
  return {
    timestamp: '2025-03-15T09:00:00.000Z',
    sender: 'Alice',
    content: 'Hello world',
    type: 'text',
    ...overrides,
  };
}

const VALID_SUMMARY_JSON = JSON.stringify({
  topic: 'Release planning',
  keyDecisions: ['Ship on Friday'],
  actionItems: ['Alice will tag the release by EOD'],
  notableFacts: ['QA signed off'],
  participants: ['Alice', 'Bob'],
  summaryText: 'The team agreed to ship Friday pending QA sign-off.',
});

const VALID_SUMMARY_FENCED = '```json\n' + VALID_SUMMARY_JSON + '\n```';

const CONSOLIDATED_JSON = JSON.stringify({
  topic: 'Consolidated: Release planning',
  keyDecisions: ['Ship on Friday'],
  actionItems: ['Alice will tag the release'],
  notableFacts: ['QA signed off'],
  participants: ['Alice', 'Bob'],
  summaryText: 'Consolidated summary of the full conversation.',
});

// ── 1. Prompt format: short vs detailed produce distinct systemPrompts ─────────

test('buildSummarizationPrompt: "short" and "detailed" produce noticeably different systemPrompts', () => {
  const msgs = [makeMsg()];

  const { systemPrompt: shortPrompt, summaryLength: shortLen } =
    buildSummarizationPrompt(msgs, 'short');
  const { systemPrompt: detailedPrompt, summaryLength: detailedLen } =
    buildSummarizationPrompt(msgs, 'detailed');

  expect(shortLen).toBe('short');
  expect(detailedLen).toBe('detailed');

  // Each variant embeds its own modifier block.
  expect(shortPrompt).toContain('summaryText format for SHORT');
  expect(detailedPrompt).toContain('summaryText format for DETAILED');

  // The two prompts must not be equal.
  expect(shortPrompt).not.toBe(detailedPrompt);

  // Short forbids long output; detailed requires paragraphs.
  expect(shortPrompt).toContain('2–3 sentences');
  expect(detailedPrompt).toContain('2–3 full paragraphs');
});

// ── 2. Valid parsing: extracts all 6 fields from a fenced JSON string ─────────

test('parseSummaryResponse: extracts all 6 fields from a markdown-fenced JSON response', () => {
  const result = parseSummaryResponse(VALID_SUMMARY_FENCED);

  expect(result.topic).toBe('Release planning');
  expect(result.keyDecisions).toEqual(['Ship on Friday']);
  expect(result.actionItems).toEqual(['Alice will tag the release by EOD']);
  expect(result.notableFacts).toEqual(['QA signed off']);
  expect(result.participants).toEqual(['Alice', 'Bob']);
  expect(result.summaryText).toBe('The team agreed to ship Friday pending QA sign-off.');
});

// ── 3. Malformed parsing: returns fallback with raw string in summaryText ──────

test('parseSummaryResponse: non-JSON response returns fallback with raw string in summaryText', () => {
  const rawProse = 'The team discussed the project timeline and agreed on next steps.';
  const result = parseSummaryResponse(rawProse);

  // Must not throw; must return the 6-field schema.
  expect(result.topic).toBe('');
  expect(result.keyDecisions).toEqual([]);
  expect(result.actionItems).toEqual([]);
  expect(result.notableFacts).toEqual([]);
  expect(result.participants).toEqual([]);
  expect(result.summaryText).toBe(rawProse);
});

// ── 4. Pipeline (single chunk): callLLM called exactly once ───────────────────

test('processSummarization (single chunk): calls callLLM exactly once and returns parsed summary', async () => {
  callLLM.mockResolvedValue(VALID_SUMMARY_JSON);

  // Two messages fit comfortably in one chunk.
  const messages = [makeMsg({ content: 'Ship Friday?' }), makeMsg({ sender: 'Bob', content: 'Yes.' })];
  const result = await processSummarization(messages, 'medium');

  expect(callLLM).toHaveBeenCalledTimes(1);
  expect(result.topic).toBe('Release planning');
  expect(result.summaryText).toBeTruthy();
  // All array fields must be arrays.
  expect(Array.isArray(result.keyDecisions)).toBe(true);
  expect(Array.isArray(result.actionItems)).toBe(true);
  expect(Array.isArray(result.participants)).toBe(true);
});

// ── 5. Pipeline (multi-chunk map-reduce): callLLM called N_chunks + 1 times ───

test('processSummarization (3-chunk map-reduce): calls callLLM exactly 4 times (3 chunks + 1 consolidation)', async () => {
  // 150 messages at ~90 tokens each produces exactly 3 chunks at the 7500-token default.
  const messages = Array.from({ length: 150 }, (_, i) =>
    makeMsg({ content: 'word '.repeat(70).trim(), sender: i % 2 === 0 ? 'Alice' : 'Bob' }),
  );

  // The first 3 calls (chunk workers) return partial summaries.
  // The 4th call (consolidation) returns the merged summary.
  callLLM
    .mockResolvedValueOnce(VALID_SUMMARY_JSON)  // chunk 1
    .mockResolvedValueOnce(VALID_SUMMARY_JSON)  // chunk 2
    .mockResolvedValueOnce(VALID_SUMMARY_JSON)  // chunk 3
    .mockResolvedValueOnce(CONSOLIDATED_JSON);  // consolidation

  const result = await processSummarization(messages, 'medium');

  expect(callLLM).toHaveBeenCalledTimes(4);
  expect(result.topic).toBe('Consolidated: Release planning');
  expect(result.summaryText).toBe('Consolidated summary of the full conversation.');
});

// ── 6. summaryLength passthrough: correct modifier appears in callLLM args ────

test('processSummarization: passes summaryLength into the system prompt sent to callLLM', async () => {
  callLLM.mockResolvedValue(VALID_SUMMARY_JSON);

  const messages = [makeMsg()];
  await processSummarization(messages, 'detailed');

  expect(callLLM).toHaveBeenCalledTimes(1);
  const [[llmMessages]] = callLLM.mock.calls;
  const systemContent = llmMessages.find((m) => m.role === 'system')?.content ?? '';

  expect(systemContent).toContain('summaryText format for DETAILED');
  expect(systemContent).not.toContain('summaryText format for SHORT');
  expect(systemContent).not.toContain('summaryText format for MEDIUM');
});

// ── 7. Empty input rejects with a descriptive error ───────────────────────────

test('processSummarization: rejects with descriptive error for empty message array', async () => {
  await expect(processSummarization([])).rejects.toThrow('messages must be a non-empty array.');
  await expect(processSummarization(null)).rejects.toThrow('messages must be a non-empty array.');
});
