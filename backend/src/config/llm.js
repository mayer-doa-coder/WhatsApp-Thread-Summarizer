'use strict';

const OpenAI = require('openai');

// Each provider is an OpenAI-compatible endpoint — one SDK, three base URLs.
const sambanova = new OpenAI({
  apiKey: process.env.SAMBANOVA_API_KEY || '',
  baseURL: 'https://api.sambanova.ai/v1',
});

const cerebras = new OpenAI({
  apiKey: process.env.CEREBRAS_API_KEY || '',
  baseURL: 'https://api.cerebras.ai/v1',
});

const google = new OpenAI({
  apiKey: process.env.GOOGLE_API_KEY || '',
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
});

// Ordered tier list — primary first, fallbacks in sequence.
const TIERS = [
  { client: sambanova, model: 'Llama-4-Maverick-17B-128E-Instruct', name: 'SambaNova' },
  { client: cerebras,  model: 'llama3.1-8b',                        name: 'Cerebras'  },
  { client: google,    model: 'gemini-2.5-flash',                    name: 'Google'    },
];

function isRetryable(err) {
  const status = err.status ?? err.statusCode;
  return status === 429 || (Number.isInteger(status) && status >= 500 && status < 600);
}

/**
 * Call the LLM tier cascade. Starts at the primary model (or the tier
 * matching `initialModel` if provided) and falls through to the next tier
 * on any 429 or 5xx response.
 *
 * @param {Array<{role: string, content: string}>} messages
 * @param {string} [initialModel]  Model ID to start from (optional override)
 * @returns {Promise<string>} Raw text content from the responding model
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
    try {
      const completion = await client.chat.completions.create({ model, messages });
      return completion.choices[0].message.content;
    } catch (err) {
      if (isRetryable(err)) {
        console.warn(`[llm] ${name} returned ${err.status ?? 'error'} — trying next tier`);
        lastError = err;
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('All LLM tiers exhausted with no successful response.');
}

module.exports = { callLLM, TIERS };
