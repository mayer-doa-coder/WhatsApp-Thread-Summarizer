'use strict';

const { callLLM } = require('../config/llm');

// ── Prompt ────────────────────────────────────────────────────────────────────

const BRIEF_SYSTEM = `You are a chief-of-staff assistant producing a concise daily intelligence brief from multiple WhatsApp chat summaries. Your task is to synthesize them into a single structured daily brief.

You always respond with valid JSON matching this exact schema:
{
  "overviewParagraph": "string — 3–5 sentence executive overview across all chats",
  "chatCards": [
    {
      "index": "number — 1-based position matching the input chat order",
      "oneLiner": "string — single-sentence tldr for this chat",
      "actionRequired": "boolean — true if any action item has an imminent or same-day deadline"
    }
  ],
  "crossChatInsights": ["string — observations spanning two or more chats", ...],
  "keyPeople": [
    {
      "name": "string",
      "context": "string — inferred role or relationship, e.g. 'project manager' or 'appears in work and family chats'"
    }
  ]
}

Rules:
- chatCards must contain exactly one entry per input chat, using the 1-based index to identify each chat.
- crossChatInsights should be [] if no meaningful cross-chat connections exist — do not fabricate.
- keyPeople includes only people appearing in 2 or more chats.
- Return only the JSON object — no markdown, no preamble.`;

function buildBriefUserPrompt(summaries) {
  const today = new Date().toISOString().slice(0, 10);
  const chatCount = summaries.length;

  const blocks = summaries.map((s, i) => [
    `--- CHAT ${i + 1} OF ${chatCount}: ${s.chatName} ---`,
    `Topic: ${s.topic || '(none)'}`,
    `Key decisions: ${(s.keyDecisions || []).join(' | ') || '(none)'}`,
    `Action items: ${(s.actionItems || []).join(' | ') || '(none)'}`,
    `Notable facts: ${(s.notableFacts || []).join(' | ') || '(none)'}`,
    `Participants: ${(s.participants || []).join(', ') || '(none)'}`,
    `Summary: ${s.summaryText || '(empty)'}`,
    `--- END CHAT ${i + 1} ---`,
  ].join('\n'));

  return `Produce a daily brief from the following ${chatCount} chat summaries.

Date: ${today}

${blocks.join('\n\n')}

Respond with valid JSON only. No markdown fences, no commentary outside the JSON object.`;
}

// ── Response parser ───────────────────────────────────────────────────────────

function parseBriefResponse(llmOutput) {
  const raw = typeof llmOutput === 'string' ? llmOutput : String(llmOutput ?? '');
  const cleaned = raw
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/\s*```\s*$/im, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      overviewParagraph: typeof parsed.overviewParagraph === 'string' ? parsed.overviewParagraph : raw,
      chatCards:         Array.isArray(parsed.chatCards)         ? parsed.chatCards         : [],
      crossChatInsights: Array.isArray(parsed.crossChatInsights) ? parsed.crossChatInsights.filter((s) => typeof s === 'string') : [],
      keyPeople:         Array.isArray(parsed.keyPeople)         ? parsed.keyPeople         : [],
    };
  } catch {
    return { overviewParagraph: raw, chatCards: [], crossChatInsights: [], keyPeople: [] };
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Synthesizes per-file summaries into a single structured daily brief via LLM.
 *
 * @param {Array<{
 *   filename: string,
 *   topic: string,
 *   participants: string[],
 *   messageCount: number,
 *   dateRange: { from: string|null, to: string|null },
 *   keyDecisions: string[],
 *   actionItems: string[],
 *   notableFacts: string[],
 *   summaryText: string,
 * }>} enrichedSummaries
 *
 * @returns {Promise<{
 *   overviewParagraph: string,
 *   chatCards: Array<{
 *     filename: string, topic: string, participants: string[],
 *     messageCount: number, dateRange: object,
 *     actionItems: string[], keyDecisions: string[], summaryText: string,
 *     oneLiner: string, actionRequired: boolean,
 *   }>,
 *   crossChatInsights: string[],
 *   keyPeople: string[],
 * }>}
 */
async function composeDailyBrief(enrichedSummaries) {
  if (!Array.isArray(enrichedSummaries) || enrichedSummaries.length === 0) {
    throw new Error('Input must be a non-empty array of summaries.');
  }

  const summariesWithName = enrichedSummaries.map((s, i) => ({
    ...s,
    chatName: s.filename ? s.filename.replace(/\.txt$/i, '') : `Chat ${i + 1}`,
  }));

  const llmMessages = [
    { role: 'system', content: BRIEF_SYSTEM },
    { role: 'user',   content: buildBriefUserPrompt(summariesWithName) },
  ];

  const raw = await callLLM(llmMessages);
  const llmResult = parseBriefResponse(raw);

  // Build an index map from the LLM's 1-based card indices for O(1) lookup.
  const llmCardByIndex = new Map();
  for (const card of llmResult.chatCards) {
    const idx = typeof card.index === 'number' ? card.index : NaN;
    if (!isNaN(idx) && !llmCardByIndex.has(idx)) {
      llmCardByIndex.set(idx, card);
    }
  }

  // Positional merge: one output card per input summary, regardless of LLM output length.
  const chatCards = enrichedSummaries.map((input, i) => {
    const llmCard = llmCardByIndex.get(i + 1) || {};
    return {
      filename:       input.filename,
      topic:          input.topic,
      participants:   input.participants,
      messageCount:   input.messageCount,
      dateRange:      input.dateRange,
      actionItems:    input.actionItems,
      keyDecisions:   input.keyDecisions,
      summaryText:    input.summaryText,
      oneLiner:       typeof llmCard.oneLiner === 'string' ? llmCard.oneLiner : '',
      actionRequired: typeof llmCard.actionRequired === 'boolean' ? llmCard.actionRequired : false,
    };
  });

  // Flatten keyPeople objects to "Name: context" display strings.
  const keyPeople = llmResult.keyPeople
    .filter((p) => p && typeof p.name === 'string' && p.name)
    .map((p) => {
      const context = typeof p.context === 'string' && p.context ? p.context : '';
      return context ? `${p.name}: ${context}` : p.name;
    });

  return {
    overviewParagraph: llmResult.overviewParagraph,
    chatCards,
    crossChatInsights: llmResult.crossChatInsights,
    keyPeople,
  };
}

module.exports = { composeDailyBrief };
