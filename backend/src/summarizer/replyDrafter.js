'use strict';

const { callLLM } = require('../config/llm');
const { messagesToTranscript } = require('./promptBuilder');

// ── Tone configuration ─────────────────────────────────────────────────────────

const TONE_CONFIG = {
  formal: {
    label: 'Formal',
    constraint: `Tone: FORMAL
- Use professional, polished language with full sentences.
- CRITICAL: You MUST NOT use any contractions. Write "do not" not "don't", "I will" not "I'll", "it is" not "it's", "we are" not "we're", etc.
- No slang, abbreviations, or informal expressions.
- Keep each reply under 80 words.`,
  },
  casual: {
    label: 'Casual',
    constraint: `Tone: CASUAL
- Write in a friendly, natural conversational style.
- Contractions and light informality are encouraged.
- Keep each reply under 60 words.`,
  },
  concise: {
    label: 'Concise',
    constraint: `Tone: CONCISE
- CRITICAL: Every reply option MUST be strictly under 40 words. Count words carefully.
- Be direct. Get to the point in 1–2 sentences maximum.
- No preamble, no filler phrases.`,
  },
  empathetic: {
    label: 'Empathetic',
    constraint: `Tone: EMPATHETIC
- Acknowledge the other person's feelings or situation before stating your own position.
- Warm and supportive language. Use "I understand", "I appreciate", "That makes sense".
- Keep each reply under 70 words.`,
  },
  apologetic: {
    label: 'Apologetic',
    constraint: `Tone: APOLOGETIC
- Open with a clear, sincere apology. Own the situation without over-explaining.
- Avoid defensive language.
- Keep each reply under 70 words.`,
  },
  assertive: {
    label: 'Assertive',
    constraint: `Tone: ASSERTIVE
- State your position clearly and confidently. No hedging, no qualifiers.
- Direct language. First-person statements of intent ("I will", "I need", "I expect").
- Keep each reply under 60 words.`,
  },
};

const DEFAULT_TONE = 'casual';
const FALLBACK_REPLY = 'Thank you for your message. I will get back to you shortly.';

// ── Prompt builders ───────────────────────────────────────────────────────────

function buildSystemPrompt(toneConfig) {
  return `You are a skilled communication assistant helping a user craft WhatsApp replies.

Your task: generate exactly 3 distinct reply options for a single specified tone. The 3 options must vary in phrasing, structure, or emphasis — not just word choice. Each option must fully address the user's stated intent.

${toneConfig.constraint}

Output format — respond with ONLY a valid JSON array of exactly 3 strings:
["option 1 text", "option 2 text", "option 3 text"]

Hard rules:
- The array must contain exactly 3 elements.
- Every element must be a non-empty string.
- No markdown fences, no commentary outside the JSON array.
- Do not number or label the options — plain text strings only.
- Never fabricate commitments the user did not specify.
- Preserve any factual details (dates, names, numbers) the user mentions.`;
}

function buildUserPrompt(messages, userIntent, toneConfig) {
  const recent = messages.slice(-20);
  const transcript = messagesToTranscript(recent);
  const last = recent[recent.length - 1];
  const lastSender = last?.sender || 'Unknown';
  const lastMessage = last?.content || '(no message)';

  return `Generate 3 reply drafts in ${toneConfig.label} tone for the following situation.

--- RECENT CONVERSATION (last ${recent.length} messages) ---
${transcript}
--- END CONVERSATION ---

Last message from: ${lastSender}
Last message: "${lastMessage}"

User's intent: ${userIntent || 'Respond appropriately to the conversation.'}

Respond with a valid JSON array of exactly 3 strings only. No markdown, no extra keys.`;
}

// ── Response parser ────────────────────────────────────────────────────────────

function stripFences(text) {
  return text
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/\s*```\s*$/im, '')
    .trim();
}

function parseOptions(raw) {
  const cleaned = stripFences(raw);
  const parsed = JSON.parse(cleaned);

  if (!Array.isArray(parsed)) {
    throw new TypeError('LLM response is not a JSON array.');
  }

  // Coerce elements to non-empty strings.
  const options = parsed
    .map((item) => (typeof item === 'string' ? item.trim() : String(item ?? '').trim()))
    .filter(Boolean);

  // Guarantee exactly 3: pad with duplicates or static fallback if needed.
  while (options.length < 3) {
    options.push(options[options.length - 1] ?? FALLBACK_REPLY);
  }

  return options.slice(0, 3);
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Generate exactly 3 reply draft options for a given tone.
 *
 * @param {Array<{timestamp:string, sender:string|null, content:string, type:string}>} messages
 * @param {string} [userIntent]  What the user wants to communicate.
 * @param {string} [tone]        One of: formal, casual, concise, empathetic, apologetic, assertive.
 * @returns {Promise<string[]>}  Exactly 3 non-empty reply strings.
 */
async function draftReplies(messages, userIntent, tone) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('messages must be a non-empty array.');
  }

  const normalizedTone = (typeof tone === 'string' ? tone.toLowerCase() : '').trim();
  const toneConfig = TONE_CONFIG[normalizedTone] ?? TONE_CONFIG[DEFAULT_TONE];

  const llmMessages = [
    { role: 'system', content: buildSystemPrompt(toneConfig) },
    { role: 'user',   content: buildUserPrompt(messages, userIntent, toneConfig) },
  ];

  const raw = await callLLM(llmMessages);

  try {
    return parseOptions(raw);
  } catch {
    // LLM returned unparseable output — return 3 safe fallbacks so the caller
    // never receives fewer than 3 options.
    console.warn('[replyDrafter] Failed to parse LLM response — using fallback options');
    return [FALLBACK_REPLY, FALLBACK_REPLY, FALLBACK_REPLY];
  }
}

module.exports = { draftReplies };
