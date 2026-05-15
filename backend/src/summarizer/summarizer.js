'use strict';

const { chunkMessages } = require('../parser/chunkMessages');
const { buildSummarizationPrompt } = require('./promptBuilder');
const { parseSummaryResponse } = require('./responseParsers');
const { callLLM } = require('../config/llm');

// ── Consolidation prompt ───────────────────────────────────────────────────────

const CONSOLIDATION_SYSTEM = `You are an expert conversation analyst. You have been given several partial summaries of segments from a single WhatsApp chat export. Your task is to synthesize them into one coherent master summary.

You always respond with valid JSON matching this exact schema:
{
  "topic": "string — one sentence describing the overall subject of the full conversation",
  "keyDecisions": ["string", ...],
  "actionItems": ["string — starts with an action verb and names the responsible person where identifiable", ...],
  "notableFacts": ["string", ...],
  "participants": ["string — display name as it appears in the chat", ...],
  "summaryText": "string — unified prose summary of the entire conversation"
}

Rules:
- Merge duplicate decisions, action items, and facts into single entries. Do not repeat.
- participants must be the union of all segments (deduplicated).
- summaryText must read as a single coherent narrative, not a list of chunk descriptions.
- Extract only what is explicitly stated. Do not invent content.
- Return valid JSON only. No markdown fences, no commentary outside the JSON object.`;

function buildConsolidationUserPrompt(partialSummaries, summaryLength) {
  const blocks = partialSummaries
    .map((s, i) => {
      const lines = [
        `--- SEGMENT ${i + 1} OF ${partialSummaries.length} ---`,
        `Topic: ${s.topic || '(none)'}`,
        `Participants: ${(s.participants || []).join(', ') || '(none)'}`,
        `Key Decisions: ${(s.keyDecisions || []).join(' | ') || '(none)'}`,
        `Action Items: ${(s.actionItems || []).join(' | ') || '(none)'}`,
        `Notable Facts: ${(s.notableFacts || []).join(' | ') || '(none)'}`,
        `Summary: ${s.summaryText || '(empty)'}`,
        `--- END SEGMENT ${i + 1} ---`,
      ];
      return lines.join('\n');
    })
    .join('\n\n');

  return `Synthesize the following ${partialSummaries.length} partial summaries into one master summary.

Target length: ${summaryLength}

${blocks}

Respond with valid JSON only. No markdown fences, no commentary outside the JSON object.`;
}

// ── Per-chunk worker ───────────────────────────────────────────────────────────

async function summarizeChunk(chunk, summaryLength, chunkIndex, totalChunks) {
  const isChunk = totalChunks > 1;
  const { systemPrompt, userPrompt } = buildSummarizationPrompt(
    chunk,
    summaryLength,
    isChunk ? { isChunk, chunkIndex, totalChunks } : undefined,
  );

  const llmMessages = [
    { role: 'system', content: systemPrompt },
    { role: 'user',   content: userPrompt },
  ];

  const raw = await callLLM(llmMessages);
  return parseSummaryResponse(raw);
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Full map-reduce summarization pipeline.
 *
 * 1. Splits messages into overlapping chunks (chunkMessages).
 * 2. Summarizes all chunks concurrently (Promise.all).
 * 3. If > 1 chunk, runs a consolidation LLM call to merge partial summaries.
 *
 * @param {Array<{timestamp:string, sender:string|null, content:string, type:string}>} messages
 * @param {'short'|'medium'|'detailed'} [summaryLength='medium']
 * @returns {Promise<{ topic:string, keyDecisions:string[], actionItems:string[],
 *                     notableFacts:string[], participants:string[], summaryText:string }>}
 */
async function processSummarization(messages, summaryLength = 'medium') {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('messages must be a non-empty array.');
  }

  const chunks = chunkMessages(messages);

  // Concurrent chunk summarization — all chunks in-flight simultaneously.
  const partials = await Promise.all(
    chunks.map((chunk, i) => summarizeChunk(chunk, summaryLength, i + 1, chunks.length)),
  );

  if (partials.length === 1) {
    return partials[0];
  }

  // Consolidation call: merge all partial summaries into one master summary.
  const consolidationMessages = [
    { role: 'system', content: CONSOLIDATION_SYSTEM },
    { role: 'user',   content: buildConsolidationUserPrompt(partials, summaryLength) },
  ];

  const consolidatedRaw = await callLLM(consolidationMessages);
  return parseSummaryResponse(consolidatedRaw);
}

module.exports = { processSummarization };
