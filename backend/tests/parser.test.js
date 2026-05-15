'use strict';

const { parseWhatsAppExport } = require('../src/parser/whatsappParser');
const { chunkMessages, estimateTokens } = require('../src/parser/chunkMessages');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMsg(overrides = {}) {
  return {
    date: '15/03/2025',
    time: '09:00',
    timestamp: '2025-03-15T03:00:00.000Z',
    sender: 'Alice',
    content: 'Hello',
    type: 'text',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 1. iOS 12h format (M/D/YY, H:MM AM/PM - Sender: content)
// ---------------------------------------------------------------------------
test('iOS 12h format: parses sender, content, and type correctly', () => {
  const raw = '3/15/25, 10:00 AM - Alice: Good morning team.';
  const [msg] = parseWhatsAppExport(raw);

  expect(msg.sender).toBe('Alice');
  expect(msg.content).toBe('Good morning team.');
  expect(msg.type).toBe('text');
  expect(msg.date).toBe('15/03/2025');
  expect(msg.time).toBe('10:00');
});

// ---------------------------------------------------------------------------
// 2. Android 24h format (DD/MM/YYYY, HH:MM - Sender: content)
// ---------------------------------------------------------------------------
test('Android 24h format: parses sender, content, and type correctly', () => {
  const raw = '15/03/2025, 08:30 - Bob: Ready when you are.';
  const [msg] = parseWhatsAppExport(raw);

  expect(msg.sender).toBe('Bob');
  expect(msg.content).toBe('Ready when you are.');
  expect(msg.type).toBe('text');
  expect(msg.date).toBe('15/03/2025');
  expect(msg.time).toBe('08:30');
});

// ---------------------------------------------------------------------------
// 3. Timestamp normalization — ISO 8601 for all variants
// ---------------------------------------------------------------------------
test('Timestamp normalization: iOS 12h, Android 24h, and single-digit dates all yield valid ISO 8601', () => {
  const raw = [
    '3/15/25, 10:00 AM - Alice: iOS AM',
    '3/15/25, 11:00 PM - Alice: iOS PM',
    '15/03/2025, 08:30 - Bob: Android 24h',
    '1/5/24, 9:03 AM - Carol: single-digit month and day',
  ].join('\n');

  const msgs = parseWhatsAppExport(raw);

  expect(msgs).toHaveLength(4);
  msgs.forEach((m) => {
    const d = new Date(m.timestamp);
    expect(isNaN(d.getTime())).toBe(false);      // no Invalid Date
    expect(m.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  // Spot-check PM conversion: 11:00 PM → time field must be 23:00
  expect(msgs[1].time).toBe('23:00');

  // Spot-check Android 24h: 08:30 → time field must be 08:30
  expect(msgs[2].time).toBe('08:30');
});

// ---------------------------------------------------------------------------
// 4. Multi-line continuation
// ---------------------------------------------------------------------------
test('Multi-line continuation: non-timestamp lines are appended to previous message with \\n', () => {
  const raw = [
    '15/03/2025, 09:00 - Alice: Here is the plan:',
    '- Step 1: set up repo',
    '- Step 2: write parser',
    '15/03/2025, 09:05 - Bob: Sounds good.',
  ].join('\n');

  const msgs = parseWhatsAppExport(raw);

  expect(msgs).toHaveLength(2);
  expect(msgs[0].content).toBe('Here is the plan:\n- Step 1: set up repo\n- Step 2: write parser');
  expect(msgs[0].content.split('\n')).toHaveLength(3);
  expect(msgs[1].content).toBe('Sounds good.');
});

// ---------------------------------------------------------------------------
// 5. Type tagging — all four types
// ---------------------------------------------------------------------------
test('Type tagging: text, media, system, and deleted are each assigned correctly', () => {
  const raw = [
    '15/03/2025, 09:00 - Alice: Normal message.',
    '15/03/2025, 09:01 - Alice: <Media omitted>',
    '15/03/2025, 09:02 - Alice: This message was deleted',
    '15/03/2025, 09:03 - Messages and calls are end-to-end encrypted. Only people in this chat can read, listen to, or share them. Learn more.',
  ].join('\n');

  const msgs = parseWhatsAppExport(raw);

  expect(msgs).toHaveLength(4);
  expect(msgs[0].type).toBe('text');
  expect(msgs[1].type).toBe('media');
  expect(msgs[2].type).toBe('deleted');
  expect(msgs[3].type).toBe('system');
  expect(msgs[3].sender).toBeNull();
});

// ---------------------------------------------------------------------------
// 6. Chunker limits — no chunk exceeds maxTokens
// ---------------------------------------------------------------------------
test('Chunker limits: no chunk exceeds maxTokens', () => {
  const MAX = 500;
  // Build messages that are each ~50 tokens, total >>500 tokens.
  const messages = Array.from({ length: 50 }, (_, i) =>
    makeMsg({ content: 'Message ' + i + ' ' + 'x'.repeat(140) }) // ~50 tokens each
  );

  const chunks = chunkMessages(messages, MAX);

  expect(chunks.length).toBeGreaterThan(1);
  chunks.forEach((chunk) => {
    const tokens = chunk.reduce((sum, m) => sum + estimateTokens(m), 0);
    expect(tokens).toBeLessThanOrEqual(MAX);
  });
});

// ---------------------------------------------------------------------------
// 7. Chunker overlap — consecutive chunks share ~200 tokens of messages
// ---------------------------------------------------------------------------
test('Chunker overlap: consecutive chunks share approximately 200 tokens of messages', () => {
  // Large messages (~100 tokens each) so overlap is measurable.
  const messages = Array.from({ length: 150 }, (_, i) =>
    makeMsg({ content: 'Msg ' + i + ' ' + 'x'.repeat(350) })
  );

  const chunks = chunkMessages(messages, 7500);

  expect(chunks.length).toBeGreaterThanOrEqual(2);

  for (let i = 1; i < chunks.length; i++) {
    const overlap = chunks[i - 1].filter((m) => chunks[i].includes(m));
    const overlapTokens = overlap.reduce((sum, m) => sum + estimateTokens(m), 0);
    // Overlap should be at least 100 tokens and no more than 400 tokens.
    expect(overlapTokens).toBeGreaterThanOrEqual(100);
    expect(overlapTokens).toBeLessThanOrEqual(400);
  }
});

// ---------------------------------------------------------------------------
// 8. Chunker volume — ~15,000-token input produces exactly 3 chunks
//    and no individual message object is split across chunks.
// ---------------------------------------------------------------------------
test('Chunker volume: ~15,000-token input with maxTokens=7500 produces exactly 3 chunks without splitting messages', () => {
  const messages = Array.from({ length: 150 }, (_, i) =>
    makeMsg({ content: 'Message ' + i + ' ' + 'x'.repeat(350) }) // ~100 tokens each → 150*100 = ~15,000 tokens
  );

  const chunks = chunkMessages(messages, 7500);

  // Must produce exactly 3 chunks.
  expect(chunks.length).toBe(3);

  // Every chunk must stay within the token limit.
  chunks.forEach((chunk) => {
    const tokens = chunk.reduce((sum, m) => sum + estimateTokens(m), 0);
    expect(tokens).toBeLessThanOrEqual(7500);
  });

  // Message objects must never be fractured — every message in every chunk
  // must be an object that also exists in the original array (same reference).
  const messageSet = new Set(messages);
  chunks.forEach((chunk) => {
    chunk.forEach((m) => expect(messageSet.has(m)).toBe(true));
  });

  // All original messages must appear in at least one chunk.
  const seen = new Set(chunks.flat());
  messages.forEach((m) => expect(seen.has(m)).toBe(true));
});
