'use strict';

const OVERLAP_TOKENS = 200;

// Lightweight token estimator: ~4 chars per token (GPT-family rule of thumb).
function estimateTokens(msg) {
  return Math.ceil(JSON.stringify(msg).length / 4);
}

/**
 * Split a parsed messages array into overlapping chunks suitable for LLM calls.
 *
 * Each chunk is an array of whole message objects — messages are never split
 * mid-object. Consecutive chunks share a ~200-token tail from the previous
 * chunk so the LLM retains conversational context across boundaries.
 *
 * @param {{ date: string, time: string, timestamp: string, sender: string|null, content: string, type: string }[]} messages
 * @param {number} maxTokens - Token ceiling per chunk (default 7500).
 * @returns {Array<typeof messages>} Array of chunks.
 */
function chunkMessages(messages, maxTokens = 7500) {
  if (!messages || messages.length === 0) return [];

  // Pre-compute per-message token estimates once.
  const tokens = messages.map(estimateTokens);

  const chunks = [];
  let start = 0;

  while (start < messages.length) {
    let total = 0;
    let end = start;

    // Greedily fill the chunk up to maxTokens.
    while (end < messages.length) {
      const t = tokens[end];
      // Always admit at least one message even if it alone exceeds maxTokens.
      if (end > start && total + t > maxTokens) break;
      total += t;
      end++;
    }

    chunks.push(messages.slice(start, end));

    // All messages consumed — done.
    if (end >= messages.length) break;

    // Walk backwards from `end` until we have accumulated ~OVERLAP_TOKENS.
    // The next chunk starts at that position, sharing those messages with this chunk.
    let overlapAccum = 0;
    let nextStart = end;
    while (nextStart > start && overlapAccum < OVERLAP_TOKENS) {
      nextStart--;
      overlapAccum += tokens[nextStart];
    }

    // Safety: always advance start to guarantee termination.
    start = nextStart < end ? nextStart : end;
  }

  return chunks;
}

module.exports = { chunkMessages, estimateTokens };
