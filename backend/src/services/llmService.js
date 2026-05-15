'use strict';

// Provider order: SambaNova (primary) → Cerebras (fallback 1) → Google AI Studio (fallback 2).
// All three expose an OpenAI-compatible /v1/chat/completions endpoint.
const PROVIDERS = [
  {
    name: 'SambaNova',
    url: 'https://api.sambanova.ai/v1/chat/completions',
    model: 'Llama-4-Maverick-17B-128E-Instruct',
    apiKey: () => process.env.SAMBANOVA_API_KEY,
  },
  {
    name: 'Cerebras',
    url: 'https://api.cerebras.ai/v1/chat/completions',
    model: 'llama3.1-8b',
    apiKey: () => process.env.CEREBRAS_API_KEY,
  },
  {
    name: 'Google',
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    model: 'gemini-2.5-flash',
    apiKey: () => process.env.GOOGLE_API_KEY,
  },
];

function isRetryableStatus(status) {
  // 404 = model not found (config mismatch) — try next provider instead of hard-failing
  return status === 404 || status === 429 || status >= 500;
}

function isPlaceholderKey(key) {
  return !key || key.startsWith('your_') || key.startsWith('sk-placeholder');
}

/**
 * Send an OpenAI-style messages array to the first available provider.
 * Falls through to the next provider on 429 / 5xx or missing key.
 * @param {Array<{role: string, content: string}>} messages
 * @returns {Promise<string>} Raw text content from the model
 */
async function callLLM(messages) {
  let lastError;

  for (const provider of PROVIDERS) {
    const apiKey = provider.apiKey();
    if (isPlaceholderKey(apiKey)) continue;

    let res;
    try {
      res = await fetch(provider.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model: provider.model, messages }),
      });
    } catch (networkErr) {
      lastError = new Error(`${provider.name} network error: ${networkErr.message}`);
      continue;
    }

    if (isRetryableStatus(res.status)) {
      lastError = new Error(`${provider.name} returned ${res.status}`);
      continue;
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`${provider.name} error ${res.status}: ${body}`);
    }

    const data = await res.json();
    return data.choices[0].message.content;
  }

  throw lastError || new Error('No LLM providers are configured. Set SAMBANOVA_API_KEY, CEREBRAS_API_KEY, or GOOGLE_API_KEY in .env.');
}

module.exports = { callLLM };
