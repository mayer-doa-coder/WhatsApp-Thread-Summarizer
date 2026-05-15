'use strict';

const EMPTY_SUMMARY = {
  topic: '',
  keyDecisions: [],
  actionItems: [],
  notableFacts: [],
  participants: [],
  summaryText: '',
};

function stripMarkdownFences(text) {
  return text
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/\s*```\s*$/im, '')
    .trim();
}

function coerceArray(value) {
  if (Array.isArray(value)) return value.filter((v) => typeof v === 'string');
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}

function coerceString(value) {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  return String(value);
}

function extractFields(parsed) {
  return {
    topic:        coerceString(parsed.topic),
    keyDecisions: coerceArray(parsed.keyDecisions),
    actionItems:  coerceArray(parsed.actionItems),
    notableFacts: coerceArray(parsed.notableFacts),
    participants: coerceArray(parsed.participants),
    summaryText:  coerceString(parsed.summaryText),
  };
}

/**
 * Parse an LLM response string into the canonical 6-field summary object.
 * Never throws — returns a safe fallback if the output cannot be parsed.
 *
 * @param {string} llmOutput  Raw text returned by the LLM.
 * @returns {{ topic: string, keyDecisions: string[], actionItems: string[],
 *             notableFacts: string[], participants: string[], summaryText: string }}
 */
function parseSummaryResponse(llmOutput) {
  const raw = typeof llmOutput === 'string' ? llmOutput : String(llmOutput ?? '');

  try {
    const cleaned = stripMarkdownFences(raw);
    const parsed = JSON.parse(cleaned);

    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new TypeError('Parsed value is not a plain object.');
    }

    return extractFields(parsed);
  } catch {
    return { ...EMPTY_SUMMARY, summaryText: raw };
  }
}

module.exports = { parseSummaryResponse };
