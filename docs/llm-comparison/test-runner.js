/**
 * LLM Free Model Comparison — Test Runner  (8 models, cloud-only)
 *
 * All 8 models are 100% free cloud-based — no local hardware needed.
 * Providers: Cerebras · SambaNova · OpenRouter · Google AI Studio
 *
 * Free tier limits (not unlimited, but generous):
 *   Cerebras      : ~60 RPM
 *   SambaNova     : ~100K tokens/day
 *   OpenRouter    : varies per model
 *   Google AI Studio: ~1500 RPD / 15 RPM
 *
 * Usage:
 *   node test-runner.js          — run all tests
 *   node generate-report.js      — generate results/report.html
 */

const fs = require('fs');
const path = require('path');

// Inline .env loader — no dotenv package required
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq > 0) {
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

// ─── Model Registry ────────────────────────────────────────────────────────
// 8 reliable models across 4 providers — all completely free, cloud-based
// Excluded (consistently failed during evaluation):
//   Qwen 3 235B/Cerebras        — persistent 429 (overloaded free tier)
//   Llama 3.3 70B/OpenRouter    — always 429 (upstream capacity)
//   GPT OSS 20B/OpenRouter      — 429 on 2/3 fixtures
//   MiniMax M2.7/SambaNova      — 422 (service tier not available)
//   Gemini Flash Lite Latest    — 503 on 1/3 fixtures (intermittent)
//
// maxTokens notes:
//   Gemini 2.5 Flash — thinking tokens eat budget internally, needs 8000
//   Others           — 2000 is enough for a clean JSON summary

const MODELS = [
  // ── CEREBRAS ───────────────────────────────────────────────────────────
  // Free signup: https://cloud.cerebras.ai → API Keys
  {
    id: 'llama3.1-8b',
    name: 'Llama 3.1 8B (Cerebras)',
    provider: 'Cerebras',
    apiBase: 'https://api.cerebras.ai/v1',
    envKey: 'CEREBRAS_API_KEY',
    color: '#38BDF8',
    maxTokens: 2000,
  },

  // ── SAMBANOVA ──────────────────────────────────────────────────────────
  // Free signup: https://cloud.sambanova.ai → API Key
  {
    id: 'Llama-4-Maverick-17B-128E-Instruct',
    name: 'Llama 4 Maverick 128E (SambaNova)',
    provider: 'SambaNova',
    apiBase: 'https://api.sambanova.ai/v1',
    envKey: 'SAMBANOVA_API_KEY',
    color: '#F97316',
    maxTokens: 2000,
  },
  {
    id: 'DeepSeek-V3.2',
    name: 'DeepSeek V3.2 (SambaNova)',
    provider: 'SambaNova',
    apiBase: 'https://api.sambanova.ai/v1',
    envKey: 'SAMBANOVA_API_KEY',
    color: '#10B981',
    maxTokens: 2000,
  },
  {
    id: 'Meta-Llama-3.3-70B-Instruct',
    name: 'Llama 3.3 70B (SambaNova)',
    provider: 'SambaNova',
    apiBase: 'https://api.sambanova.ai/v1',
    envKey: 'SAMBANOVA_API_KEY',
    color: '#0EA5E9',
    maxTokens: 2000,
  },
  {
    id: 'gpt-oss-120b',
    name: 'GPT OSS 120B (SambaNova)',
    provider: 'SambaNova',
    apiBase: 'https://api.sambanova.ai/v1',
    envKey: 'SAMBANOVA_API_KEY',
    color: '#F59E0B',
    maxTokens: 2000,
  },

  // ── OPENROUTER ─────────────────────────────────────────────────────────
  // Free signup: https://openrouter.ai → Keys (no credit card)
  {
    id: 'openai/gpt-oss-120b:free',
    name: 'GPT OSS 120B (OpenRouter)',
    provider: 'OpenRouter',
    apiBase: 'https://openrouter.ai/api/v1',
    envKey: 'OPENROUTER_API_KEY',
    color: '#EC4899',
    maxTokens: 2000,
  },

  // ── GOOGLE AI STUDIO ───────────────────────────────────────────────────
  // Free signup: https://aistudio.google.com/app/apikey
  // Uses OpenAI-compatible endpoint: /v1beta/openai/chat/completions
  {
    id: 'models/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash (Google)',
    provider: 'Google',
    apiBase: 'https://generativelanguage.googleapis.com/v1beta/openai',
    envKey: 'GOOGLE_API_KEY',
    color: '#EA4335',
    maxTokens: 8000,
  },
  {
    id: 'models/gemini-flash-latest',
    name: 'Gemini Flash Latest (Google)',
    provider: 'Google',
    apiBase: 'https://generativelanguage.googleapis.com/v1beta/openai',
    envKey: 'GOOGLE_API_KEY',
    color: '#FBBC05',
    maxTokens: 4000,
  },
];

// ─── Prompt ────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a WhatsApp chat summarizer. Analyze the provided chat export and return ONLY a valid JSON object with exactly these six fields:
{
  "topic": "main subject of the conversation",
  "keyDecisions": ["decision 1", "decision 2"],
  "actionItems": ["action 1", "action 2"],
  "notableFacts": ["fact 1", "fact 2"],
  "participants": ["name1", "name2"],
  "summaryText": "2-3 sentence summary of the full conversation"
}
Return ONLY the raw JSON. No markdown fences, no explanation, no extra text.`;

const buildUserPrompt = (chatText) =>
  `Summarize this WhatsApp chat export:\n\n${chatText}`;

// ─── API Call ──────────────────────────────────────────────────────────────

async function callModel(model, chatText) {
  const apiKey = process.env[model.envKey];
  if (!apiKey || apiKey.includes('your_')) {
    return { error: `API key not set: ${model.envKey}`, latency: 0 };
  }

  const start = Date.now();
  try {
    const extraHeaders = model.provider === 'OpenRouter'
      ? { 'HTTP-Referer': 'https://github.com/whatsapp-thread-summarizer', 'X-Title': 'WhatsApp Thread Summarizer' }
      : {};

    const response = await fetch(`${model.apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        ...extraHeaders,
      },
      body: JSON.stringify({
        model: model.id,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(chatText) },
        ],
        temperature: 0.3,
        max_tokens: model.maxTokens,
      }),
    });

    const latency = Date.now() - start;

    if (response.status === 429) {
      process.stdout.write(' [429, retrying in 20s]');
      await new Promise((r) => setTimeout(r, 20000));
      const retry = await fetch(`${model.apiBase}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}`, ...extraHeaders },
        body: JSON.stringify({ model: model.id, messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: buildUserPrompt(chatText) }], temperature: 0.3, max_tokens: model.maxTokens }),
      });
      if (!retry.ok) {
        const errText = await retry.text();
        return { error: `HTTP ${retry.status}: ${errText.slice(0, 180)}`, latency: Date.now() - start };
      }
      const retryData = await retry.json();
      const content = retryData.choices?.[0]?.message?.content?.trim() || '';
      return { content, latency: Date.now() - start, tokensUsed: retryData.usage?.total_tokens || 0 };
    }

    if (!response.ok) {
      const errText = await response.text();
      return { error: `HTTP ${response.status}: ${errText.slice(0, 180)}`, latency };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '';
    const tokensUsed = data.usage?.total_tokens || 0;
    return { content, latency, tokensUsed };
  } catch (err) {
    return { error: err.message, latency: Date.now() - start };
  }
}

// ─── Scoring ───────────────────────────────────────────────────────────────

const REQUIRED_FIELDS = ['topic', 'keyDecisions', 'actionItems', 'notableFacts', 'participants', 'summaryText'];

function scoreResponse(content) {
  const empty = { jsonValid: false, score: 0, fieldsPresent: 0, summaryWordCount: 0, parsed: null };
  if (!content) return empty;

  const stripped = content
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/```(?:json)?\s*/gi, '')
    .replace(/```/g, '')
    .trim();

  let parsed = null;
  const jsonMatch = stripped.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try { parsed = JSON.parse(jsonMatch[0]); }
    catch { return empty; }
  } else { return empty; }

  let score = 0;
  let fieldsPresent = 0;
  for (const field of REQUIRED_FIELDS) {
    const val = parsed[field];
    const present = val !== undefined && val !== null && val !== '' &&
      !(Array.isArray(val) && val.length === 0);
    if (present) { score += 1; fieldsPresent++; }
  }

  const summaryWords = parsed.summaryText
    ? parsed.summaryText.split(/\s+/).filter(Boolean).length : 0;

  if (summaryWords >= 50) score += 2;
  else if (summaryWords >= 25) score += 1;
  if (Array.isArray(parsed.keyDecisions) && parsed.keyDecisions.length >= 1) score += 1;
  if (Array.isArray(parsed.actionItems) && parsed.actionItems.length >= 1) score += 1;

  return { jsonValid: true, score: Math.min(score, 10), fieldsPresent, summaryWordCount: summaryWords, parsed };
}

// ─── Runner ────────────────────────────────────────────────────────────────

async function runTests() {
  const fixturesDir = path.join(__dirname, '../fixtures');
  const resultsDir = path.join(__dirname, 'results');
  if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

  const fixtures = fs.readdirSync(fixturesDir).filter((f) => f.endsWith('.txt'));
  const totalCalls = MODELS.length * fixtures.length;

  const results = {
    runAt: new Date().toISOString(),
    fixtures,
    models: MODELS.map(({ id, name, provider, color }) => ({ id, name, provider, color })),
    raw: [],
  };

  console.log(`\n${'='.repeat(60)}`);
  console.log(` WhatsApp LLM Comparison — 8 Free Cloud Models`);
  console.log(` Cerebras · SambaNova · OpenRouter · Google AI Studio`);
  console.log(`${'='.repeat(60)}`);
  console.log(` Fixtures : ${fixtures.length}  (${fixtures.join(', ')})`);
  console.log(` Total    : ${totalCalls} calls  (~${Math.ceil((totalCalls * 7) / 60)} min)`);
  console.log(`${'='.repeat(60)}\n`);

  for (const fixture of fixtures) {
    const chatText = fs.readFileSync(path.join(fixturesDir, fixture), 'utf8');
    console.log(`\n[ ${fixture} ]`);

    for (const model of MODELS) {
      process.stdout.write(`  ${model.name.padEnd(36)} ...`);

      const result = await callModel(model, chatText);
      const scored = result.error
        ? { jsonValid: false, score: 0, fieldsPresent: 0, summaryWordCount: 0, parsed: null }
        : scoreResponse(result.content);

      results.raw.push({
        fixture,
        modelId: model.id,
        modelName: model.name,
        provider: model.provider,
        latency: result.latency,
        tokensUsed: result.tokensUsed || 0,
        error: result.error || null,
        jsonValid: scored.jsonValid,
        score: scored.score,
        fieldsPresent: scored.fieldsPresent,
        summaryWordCount: scored.summaryWordCount,
        parsedOutput: scored.parsed,
      });

      if (result.error) {
        console.log(` SKIP  ${result.error.slice(0, 100)}`);
      } else {
        console.log(` ${String(result.latency).padStart(6)}ms | score ${scored.score}/10 | fields ${scored.fieldsPresent}/6 | JSON ${scored.jsonValid ? 'valid' : 'INVALID'}`);
      }

      await new Promise((r) => setTimeout(r, 10000));
    }
  }

  const outPath = path.join(resultsDir, 'comparison-results.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));

  console.log(`\n${'='.repeat(60)}`);
  console.log(' FINAL SUMMARY');
  console.log(`${'='.repeat(60)}`);
  const byModel = {};
  for (const row of results.raw) {
    if (!byModel[row.modelName]) byModel[row.modelName] = { scores: [], latencies: [], pass: 0, total: 0, provider: row.provider };
    byModel[row.modelName].total++;
    if (!row.error) { byModel[row.modelName].scores.push(row.score); byModel[row.modelName].latencies.push(row.latency); byModel[row.modelName].pass++; }
  }
  const rows = Object.entries(byModel)
    .map(([name, s]) => ({
      name, provider: s.provider,
      avgScore: s.scores.length ? +(s.scores.reduce((a, b) => a + b, 0) / s.scores.length).toFixed(1) : 0,
      avgMs: s.latencies.length ? Math.round(s.latencies.reduce((a, b) => a + b, 0) / s.latencies.length) : 0,
      pass: `${s.pass}/${s.total}`,
    }))
    .sort((a, b) => b.avgScore - a.avgScore || a.avgMs - b.avgMs);

  console.log(` ${'Model'.padEnd(36)} ${'Score'.padEnd(7)} ${'Latency'.padEnd(10)} Pass`);
  console.log(` ${'-'.repeat(58)}`);
  for (const r of rows) {
    const flag = r.avgScore === Math.max(...rows.map((x) => x.avgScore)) ? ' <<< BEST' : '';
    console.log(` ${r.name.padEnd(36)} ${String(r.avgScore + '/10').padEnd(7)} ${String(r.avgMs + 'ms').padEnd(10)} ${r.pass}${flag}`);
  }
  console.log(`\n Results -> results/comparison-results.json`);
  console.log(` Run: node generate-report.js  then open results/report.html`);
  console.log(`${'='.repeat(60)}\n`);
}

runTests().catch((err) => { console.error('Fatal:', err.message); process.exit(1); });
