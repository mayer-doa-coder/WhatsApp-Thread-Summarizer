'use strict';

// ── Length-specific modifier blocks ──────────────────────────────────────────
// Each block replaces the {{summary_length}} placeholder in both prompts AND
// adds an extra instruction paragraph so the LLM receives unambiguously
// different directives for each variant.

const LENGTH_CONFIG = {
  short: {
    label: 'short',
    systemModifier: `summaryText format for SHORT:
 - Provide a compact, outcome-only summary. No explanation, no analysis, no insights.
 - Keep keyDecisions, actionItems, and notableFacts to only the most critical items if present.
 - SHORT must be noticeably briefer than MEDIUM for the same transcript.`,
  },

  medium: {
    label: 'medium',
    systemModifier: `summaryText format for MEDIUM:
 - Provide a balanced summary with key context and rationale.
 - Populate all fields with the most important items without going deep.
 - MEDIUM should add more explanation than SHORT, but remain concise.`,
  },

  detailed: {
    label: 'detailed',
    systemModifier: `summaryText format for DETAILED:
 - Provide the most comprehensive summary with context, reasoning, risks, and outcomes.
 - Include all meaningful decisions, action items, and notable facts (do not truncate).
 - DETAILED should be the most expansive, while still scaling to the transcript length.`,
  },
};

const VALID_LENGTHS = Object.keys(LENGTH_CONFIG);

// ── Template builders ─────────────────────────────────────────────────────────

function buildSystemPrompt(config) {
  return `You are an expert conversation analyst specializing in WhatsApp chat summarization. Your task is to analyze exported WhatsApp chat transcripts and produce structured, actionable summaries.

You always respond with valid JSON matching this exact schema:
{
  "topic": "string — one sentence describing the main subject of the conversation",
  "keyDecisions": ["string", ...],
  "actionItems": ["string — starts with an action verb and names the responsible person where identifiable", ...],
  "notableFacts": ["string", ...],
  "participants": ["string — display name as it appears in the chat", ...],
  "summaryText": "string — ${config.label} summary in plain English"
}

${config.systemModifier}

General rules:
- Extract only what is explicitly stated or clearly implied. Do not invent content.
- If a field has no applicable content, return an empty array [] or empty string "".
- For actionItems, prefer the format: "[Person] will/should [action] by [deadline if mentioned]".
- Never include PII beyond what is already present in the chat (names, numbers stay as-is).
- If the input is a partial chunk, treat it as a segment — do not fabricate a conclusion.
- Length should scale with the transcript: short is the briefest, detailed is the most complete.
- Respond with valid JSON only. No markdown fences, no commentary outside the JSON object.`;
}

function buildUserPrompt(config, transcript, chunkMeta) {
  const chunkNote =
    chunkMeta && chunkMeta.isChunk
      ? `\nNote: This is chunk ${chunkMeta.chunkIndex} of ${chunkMeta.totalChunks}. Summarize only what is present in this segment.`
      : '';

  return `Summarize the following WhatsApp chat export.

Summary length: ${config.label}${chunkNote}

--- CHAT TRANSCRIPT BEGIN ---
${transcript}
--- CHAT TRANSCRIPT END ---

Respond with valid JSON only. No markdown fences, no commentary outside the JSON object.`;
}

// ── Transcript formatter ───────────────────────────────────────────────────────

function messagesToTranscript(messages) {
  return messages
    .map((m) => {
      const ts = m.timestamp ? `[${m.timestamp}]` : '';
      const sender = m.sender || 'System';
      return `${ts} ${sender}: ${m.content}`.trim();
    })
    .join('\n');
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Build a system + user prompt pair for the summarization pipeline.
 *
 * @param {Array<{timestamp:string, sender:string|null, content:string, type:string}>} messages
 * @param {'short'|'medium'|'detailed'} summaryLength  Defaults to 'medium'.
 * @param {{ isChunk?: boolean, chunkIndex?: number, totalChunks?: number }} [chunkMeta]
 * @returns {{ systemPrompt: string, userPrompt: string, summaryLength: string }}
 */
function buildSummarizationPrompt(messages, summaryLength, chunkMeta) {
  const length = VALID_LENGTHS.includes(summaryLength) ? summaryLength : 'medium';
  const config = LENGTH_CONFIG[length];
  const transcript = messagesToTranscript(Array.isArray(messages) ? messages : []);

  return {
    systemPrompt: buildSystemPrompt(config),
    userPrompt: buildUserPrompt(config, transcript, chunkMeta),
    summaryLength: length,
  };
}

module.exports = { buildSummarizationPrompt, messagesToTranscript, VALID_LENGTHS };
