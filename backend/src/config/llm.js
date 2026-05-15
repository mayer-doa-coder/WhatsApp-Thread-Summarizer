'use strict';

const OpenAI = require('openai');

// Each provider is an OpenAI-compatible endpoint — one SDK, three base URLs.
// SDK v6+ throws at construction if apiKey is ''. Use a placeholder so the
// module can be imported in test environments that mock the clients before
// any real API call is made. dotenv must be loaded before this module in prod.
const sambanova = new OpenAI({
  apiKey: process.env.SAMBANOVA_API_KEY || 'placeholder',
  baseURL: 'https://api.sambanova.ai/v1',
});

const cerebras = new OpenAI({
  apiKey: process.env.CEREBRAS_API_KEY || 'placeholder',
  baseURL: 'https://api.cerebras.ai/v1',
});

const google = new OpenAI({
  apiKey: process.env.GOOGLE_API_KEY || 'placeholder',
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
});

// Ordered tier list — primary first, fallbacks in sequence.
const TIERS = [
  { client: sambanova, model: 'Llama-4-Maverick-17B-128E-Instruct', name: 'SambaNova' },
  { client: cerebras,  model: 'llama3.1-8b',                        name: 'Cerebras'  },
  { client: google,    model: 'gemini-2.5-flash',                    name: 'Google'    },
];

const RETRY_DELAY_MS = 2000;

function isRetryable(err) {
  const status = err.status ?? err.statusCode;
  return status === 429 || (Number.isInteger(status) && status >= 500 && status < 600);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function statusLabel(err) {
  return err.status ?? err.statusCode ?? err.message ?? 'unknown error';
}

/**
 * Call the LLM tier cascade with intra-tier retry.
 *
 * For each tier:
 *   - Attempt 1: call the provider.
 *   - On a retryable error (429 / 5xx): wait RETRY_DELAY_MS, then attempt 2.
 *   - On a second retryable failure: log and cascade to the next tier.
 *   - On a non-retryable error: throw immediately (no retry, no cascade).
 *
 * @param {Array<{role: string, content: string}>} messages
 * @param {string} [initialModel]  Model ID to start from (optional override).
 * @returns {Promise<string>} Raw text content from the responding model.
 */
async function callLLM(messages, initialModel) {
  let startIndex = 0;
  if (initialModel) {
    const idx = TIERS.findIndex((t) => t.model === initialModel);
    if (idx !== -1) startIndex = idx;
  }

  let lastError;

  for (let i = startIndex; i < TIERS.length; i++) {
    const { client, model, name } = TIERS[i];

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const completion = await client.chat.completions.create({ model, messages });
        return completion.choices[0].message.content;
      } catch (err) {
        if (!isRetryable(err)) {
          // Non-retryable (e.g. 400, 401, 403) — fail fast, no cascade.
          console.error(
            `[llm] ${name} attempt ${attempt}: non-retryable error ${statusLabel(err)} — aborting`
          );
          throw err;
        }

        console.warn(`[llm] ${name} attempt ${attempt}: retryable error ${statusLabel(err)}`);
        lastError = err;

        if (attempt === 1) {
          // Wait before the same-tier retry.
          await sleep(RETRY_DELAY_MS);
        }
        // attempt === 2: break inner loop, cascade to next tier.
      }
    }

    console.warn(`[llm] ${name}: both attempts failed — cascading to next tier`);
  }

  throw lastError || new Error('All LLM tiers exhausted with no successful response.');
}

module.exports = { callLLM, TIERS, RETRY_DELAY_MS };
