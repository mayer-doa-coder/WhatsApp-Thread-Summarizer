'use strict';

// ── Length-specific modifier blocks ──────────────────────────────────────────
// Each block replaces the {{summary_length}} placeholder in both prompts AND
// adds an extra instruction paragraph so the LLM receives unambiguously
// different directives for each variant.

const LENGTH_CONFIG = {
  short: {
    label: 'short',
    systemModifier: `summaryText format for SHORT:
- Write exactly 1 brief paragraph (2–3 sentences maximum) OR 3 bullet points.
- Every other JSON field (keyDecisions, actionItems, notableFacts, participants) must still be populated but kept to 1–2 items maximum.
- Total response must be under 150 words.`,
  },

  medium: {
    label: 'medium',
    systemModifier: `summaryText format for MEDIUM:
- Write 1 coherent paragraph of approximately 100 words.
- Populate all 6 JSON fields with the most important items (up to 5 items per array field).
- Balance completeness and conciseness — this is the default output.`,
  },

  detailed: {
    label: 'detailed',
    systemModifier: `summaryText format for DETAILED:
- Write 2–3 full paragraphs (~300 words) covering: (1) conversation arc and context, (2) key decisions and their rationale, (3) outcomes and next steps.
- actionItems must include every identified task, each specifying the responsible person and deadline if mentioned.
- keyDecisions and notableFacts must be exhaustive — do not truncate.
- Where relevant, include verbatim short quotes (≤ 20 words) from the transcript to support key points.
- notableFacts should capture granular timeline events (who said what and when) if they are consequential.`,
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
  "summaryText": "string — ${config.label} prose summary in plain English"
}

${config.systemModifier}

General rules:
- Extract only what is explicitly stated or clearly implied. Do not invent content.
- If a field has no applicable content, return an empty array [] or empty string "".
- For actionItems, prefer the format: "[Person] will/should [action] by [deadline if mentioned]".
- Never include PII beyond what is already present in the chat (names, numbers stay as-is).
- If the input is a partial chunk, treat it as a segment — do not fabricate a conclusion.
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
