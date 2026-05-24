'use strict';

const express = require('express');
const { chunkMessages } = require('../parser/chunkMessages');
const { callLLM } = require('../config/llm');

const router = express.Router();

// ---------------------------------------------------------------------------
// Prompt builders (v1 templates from docs/prompt-templates.md)
// ---------------------------------------------------------------------------

function buildSystemPrompt(summaryLength, focusOn) {
  const focus = typeof focusOn === 'string' ? focusOn.trim() : '';
  const focusBlock = focus
    ? `\nFocus directive: The user wants special emphasis on the following aspects: ${focus}.
- Treat these as topics or keywords to search for (including close variants).
- Promote matches in summaryText, keyDecisions, actionItems, and notableFacts.
- Do not invent details if the focus terms are not present in the transcript.`
    : '';

  return `You are an expert conversation analyst specializing in WhatsApp chat summarization. Your task is to analyze exported WhatsApp chat transcripts and produce structured, actionable summaries.

You always respond with valid JSON matching this exact schema:
{
  "topic": "string — one sentence describing the main subject of the conversation",
  "keyDecisions": ["string", ...],
  "actionItems": ["string — starts with an action verb and names the responsible person where identifiable", ...],
  "notableFacts": ["string", ...],
  "participants": ["string — display name as it appears in the chat", ...],
  "summaryText": "string — ${summaryLength} prose summary in plain English"
}

Rules:
- Extract only what is explicitly stated or clearly implied. Do not invent content.
- If a field has no applicable content, return an empty array [] or empty string "".
- For actionItems, prefer the format: "[Person] will/should [action] by [deadline if mentioned]".
- summaryText length guide: short = outcome-only and minimal, medium = balanced detail, detailed = most complete with context and rationale.
- Length should scale with the transcript: short is the briefest, detailed is the most expansive.
- Never include PII beyond what is already present in the chat (names, numbers stay as-is).
- If the input is a partial chunk, treat it as a segment — do not fabricate a conclusion.${focusBlock}`;
}

function buildUserPrompt({ summaryLength, isChunk, chunkIndex, totalChunks, transcript, focusOn }) {
  const chunkNote = isChunk
    ? `\nNote: This is chunk ${chunkIndex} of ${totalChunks}. Summarize only what is present in this segment.`
    : '';
  const focusNote = focusOn ? `\nFocus: ${focusOn}` : '';

  return `Summarize the following WhatsApp chat export.

Summary length: ${summaryLength}${focusNote}${chunkNote}

--- CHAT TRANSCRIPT BEGIN ---
${transcript}
--- CHAT TRANSCRIPT END ---

Respond with valid JSON only. No markdown fences, no commentary outside the JSON object.`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function messagesToTranscript(messages) {
  return messages
    .map((m) => {
      const ts = m.timestamp ? `[${m.timestamp}]` : '';
      const sender = m.sender || 'System';
      return `${ts} ${sender}: ${m.content}`.trim();
    })
    .join('\n');
}

function parseJsonResponse(text) {
  // Strip accidental markdown code fences some models add despite instructions.
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  return JSON.parse(cleaned);
}

function mergeSummaries(summaries) {
  if (summaries.length === 1) return summaries[0];
  return {
    topic: summaries[0].topic,
    keyDecisions: [...new Set(summaries.flatMap((s) => s.keyDecisions || []))],
    actionItems: summaries.flatMap((s) => s.actionItems || []),
    notableFacts: summaries.flatMap((s) => s.notableFacts || []),
    participants: [...new Set(summaries.flatMap((s) => s.participants || []))],
    summaryText: summaries
      .map((s) => s.summaryText || '')
      .filter(Boolean)
      .join('\n\n'),
  };
}

// ---------------------------------------------------------------------------
// POST /api/summarize
// ---------------------------------------------------------------------------

router.post('/', async (req, res) => {
  const { messages, summaryType, focusOn } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'messages must be a non-empty array.',
      code: 400,
    });
  }

  const validTypes = ['short', 'medium', 'detailed'];
  const summaryLength = validTypes.includes(summaryType) ? summaryType : 'medium';

  const chunks = chunkMessages(messages);
  const totalChunks = chunks.length;
  const isChunk = totalChunks > 1;
  const summaries = [];
  const startMs = Date.now();
  let modelUsed = null;

  try {
    for (let i = 0; i < chunks.length; i++) {
      const transcript = messagesToTranscript(chunks[i]);
      const llmMessages = [
        { role: 'system', content: buildSystemPrompt(summaryLength, focusOn) },
        {
          role: 'user',
          content: buildUserPrompt({
            summaryLength,
            isChunk,
            chunkIndex: i + 1,
            totalChunks,
            transcript,
            focusOn,
          }),
        },
      ];

      const responseText = await callLLM(llmMessages);
      if (!modelUsed) modelUsed = responseText._model ?? null;
      summaries.push(parseJsonResponse(responseText));
    }
  } catch (err) {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
      code: 500,
    });
  }

  return res.status(200).json({
    summary: mergeSummaries(summaries),
    model: modelUsed ?? 'unknown',
    processingMs: Date.now() - startMs,
    inputMessages: messages.length,
    truncated: false,
  });
});

module.exports = router;
