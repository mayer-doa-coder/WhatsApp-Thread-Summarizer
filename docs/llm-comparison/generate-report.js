/**
 * LLM Comparison — Visual Report Generator
 *
 * Usage:  node generate-report.js
 * Output: results/report.html  (open in any browser)
 *
 * Requires results/comparison-results.json — run test-runner.js first.
 */

const fs = require('fs');
const path = require('path');

const resultsPath = path.join(__dirname, 'results', 'comparison-results.json');
const outputPath = path.join(__dirname, 'results', 'report.html');

if (!fs.existsSync(resultsPath)) {
  console.error('No results found. Run test-runner.js first.');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

// ─── Aggregate stats per model ─────────────────────────────────────────────

function aggregate(data) {
  const byModel = {};

  for (const model of data.models) {
    byModel[model.id] = {
      ...model,
      runs: [],
      avgLatency: 0,
      avgScore: 0,
      jsonAdherence: 0,
      avgFieldsPresent: 0,
      avgSummaryWords: 0,
      totalErrors: 0,
    };
  }

  for (const row of data.raw) {
    if (byModel[row.modelId]) {
      byModel[row.modelId].runs.push(row);
    }
  }

  for (const m of Object.values(byModel)) {
    const valid = m.runs.filter((r) => !r.error);
    const total = m.runs.length;

    m.totalErrors = m.runs.filter((r) => r.error).length;
    m.avgLatency = valid.length
      ? Math.round(valid.reduce((s, r) => s + r.latency, 0) / valid.length)
      : 0;
    m.avgScore = valid.length
      ? +(valid.reduce((s, r) => s + r.score, 0) / valid.length).toFixed(2)
      : 0;
    m.jsonAdherence = total
      ? Math.round((m.runs.filter((r) => r.jsonValid).length / total) * 100)
      : 0;
    m.avgFieldsPresent = valid.length
      ? +(valid.reduce((s, r) => s + r.fieldsPresent, 0) / valid.length).toFixed(1)
      : 0;
    m.avgSummaryWords = valid.length
      ? Math.round(valid.reduce((s, r) => s + r.summaryWordCount, 0) / valid.length)
      : 0;
  }

  return Object.values(byModel);
}

const models = aggregate(data);
const labels = models.map((m) => m.name);
const colors = models.map((m) => m.color);
const colorsFaded = models.map((m) => m.color + '33');

// Per-fixture score breakdown (grouped bar)
const fixtureScores = data.fixtures.map((fixture) => ({
  fixture,
  scores: models.map((m) => {
    const run = data.raw.find((r) => r.fixture === fixture && r.modelId === m.id);
    return run ? run.score : 0;
  }),
}));

// ─── HTML Template ─────────────────────────────────────────────────────────

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LLM Free Model Comparison Report</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js"></script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      padding: 2rem;
      min-height: 100vh;
    }

    h1 {
      font-size: 1.8rem;
      font-weight: 700;
      color: #f8fafc;
      margin-bottom: 0.25rem;
    }

    .subtitle {
      color: #94a3b8;
      font-size: 0.9rem;
      margin-bottom: 2rem;
    }

    .badge {
      display: inline-block;
      background: #1e3a5f;
      color: #60a5fa;
      border: 1px solid #2563eb44;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      margin-right: 0.5rem;
    }

    /* ── Stat Cards ── */
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 1rem;
      margin-bottom: 2.5rem;
    }

    .stat-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 1.2rem 1.4rem;
    }

    .stat-card .label {
      font-size: 0.75rem;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.4rem;
    }

    .stat-card .value {
      font-size: 1.6rem;
      font-weight: 700;
      color: #f1f5f9;
    }

    .stat-card .sub {
      font-size: 0.75rem;
      color: #64748b;
      margin-top: 0.2rem;
    }

    /* ── Chart Grid ── */
    .section-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #cbd5e1;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #1e293b;
    }

    .chart-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2.5rem;
    }

    .chart-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 1.4rem;
    }

    .chart-card h3 {
      font-size: 0.9rem;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 1rem;
    }

    .chart-card canvas {
      max-height: 280px;
    }

    .chart-full {
      grid-column: 1 / -1;
    }

    .chart-full canvas {
      max-height: 320px;
    }

    /* ── Rankings ── */
    .rankings {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
      margin-bottom: 2.5rem;
    }

    .rank-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 1.2rem;
    }

    .rank-card h3 {
      font-size: 0.78rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 0.8rem;
    }

    .rank-item {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      padding: 0.45rem 0;
      border-bottom: 1px solid #0f172a;
    }

    .rank-item:last-child { border-bottom: none; }

    .rank-pos {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      font-size: 0.72rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .rank-pos.gold   { background: #78350f; color: #fbbf24; }
    .rank-pos.silver { background: #1e293b; color: #94a3b8; border: 1px solid #475569; }
    .rank-pos.bronze { background: #1c1008; color: #f97316; }
    .rank-pos.other  { background: #1e293b; color: #64748b; border: 1px solid #334155; }

    .rank-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .rank-name { font-size: 0.85rem; color: #e2e8f0; flex: 1; }

    .rank-val {
      font-size: 0.82rem;
      font-weight: 600;
      color: #94a3b8;
      white-space: nowrap;
    }

    /* ── Table ── */
    .table-wrap {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 2.5rem;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.82rem;
    }

    thead tr {
      background: #0f172a;
    }

    th {
      padding: 0.75rem 1rem;
      text-align: left;
      color: #64748b;
      text-transform: uppercase;
      font-size: 0.7rem;
      letter-spacing: 0.06em;
      font-weight: 600;
      white-space: nowrap;
    }

    tbody tr {
      border-top: 1px solid #0f172a;
      transition: background 0.15s;
    }

    tbody tr:hover { background: #243044; }

    td {
      padding: 0.65rem 1rem;
      color: #cbd5e1;
      white-space: nowrap;
    }

    .tag {
      display: inline-block;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-size: 0.72rem;
      font-weight: 600;
    }

    .tag-ok  { background: #052e16; color: #4ade80; }
    .tag-err { background: #450a0a; color: #f87171; }

    .bar-inline {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .bar-bg {
      flex: 1;
      max-width: 80px;
      height: 6px;
      background: #334155;
      border-radius: 3px;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      border-radius: 3px;
    }

    .footer {
      text-align: center;
      color: #334155;
      font-size: 0.75rem;
      padding-top: 1rem;
    }
  </style>
</head>
<body>

<h1>LLM Free Model Comparison</h1>
<p class="subtitle">
  <span class="badge">WhatsApp Summarizer Project</span>
  Run at ${new Date(data.runAt).toLocaleString()} &nbsp;·&nbsp;
  ${data.fixtures.length} fixture${data.fixtures.length !== 1 ? 's' : ''} &nbsp;·&nbsp;
  ${models.length} models &nbsp;·&nbsp;
  ${data.raw.length} total calls
</p>

<!-- ── Stat Cards ── -->
<div class="stat-grid">
  ${models
    .map(
      (m) => `
  <div class="stat-card">
    <div class="label">${m.name}</div>
    <div class="value" style="color:${m.color}">${m.avgScore}<span style="font-size:1rem;color:#475569">/10</span></div>
    <div class="sub">${m.avgLatency}ms &nbsp;·&nbsp; ${m.jsonAdherence}% JSON &nbsp;·&nbsp; ${m.provider}</div>
  </div>`
    )
    .join('')}
</div>

<!-- ── Charts ── -->
<p class="section-title">Performance Charts</p>
<div class="chart-grid">

  <div class="chart-card">
    <h3>Avg Quality Score (0–10) — higher is better</h3>
    <canvas id="chartScore"></canvas>
  </div>

  <div class="chart-card">
    <h3>Avg Latency (ms) — lower is better</h3>
    <canvas id="chartLatency"></canvas>
  </div>

  <div class="chart-card">
    <h3>JSON Adherence (%) — higher is better</h3>
    <canvas id="chartJson"></canvas>
  </div>

  <div class="chart-card">
    <h3>Avg Summary Word Count</h3>
    <canvas id="chartWords"></canvas>
  </div>

  <div class="chart-card chart-full">
    <h3>Multi-Dimensional Radar — overall comparison</h3>
    <canvas id="chartRadar"></canvas>
  </div>

  <div class="chart-card chart-full">
    <h3>Quality Score per Fixture (grouped)</h3>
    <canvas id="chartFixture"></canvas>
  </div>

</div>

<!-- ── Rankings ── -->
<p class="section-title">Rankings</p>
<div class="rankings">
  <div class="rank-card">
    <h3>Best Quality Score</h3>
    ${[...models]
      .sort((a, b) => b.avgScore - a.avgScore)
      .map((m, i) => rankRow(m, i, `${m.avgScore}/10`))
      .join('')}
  </div>
  <div class="rank-card">
    <h3>Fastest Response</h3>
    ${[...models]
      .sort((a, b) => a.avgLatency - b.avgLatency)
      .map((m, i) => rankRow(m, i, `${m.avgLatency}ms`))
      .join('')}
  </div>
  <div class="rank-card">
    <h3>Best JSON Adherence</h3>
    ${[...models]
      .sort((a, b) => b.jsonAdherence - a.jsonAdherence)
      .map((m, i) => rankRow(m, i, `${m.jsonAdherence}%`))
      .join('')}
  </div>
  <div class="rank-card">
    <h3>Most Fields Populated</h3>
    ${[...models]
      .sort((a, b) => b.avgFieldsPresent - a.avgFieldsPresent)
      .map((m, i) => rankRow(m, i, `${m.avgFieldsPresent}/6 fields`))
      .join('')}
  </div>
</div>

<!-- ── Raw Results Table ── -->
<p class="section-title">Raw Results</p>
<div class="table-wrap">
  <table>
    <thead>
      <tr>
        <th>Model</th>
        <th>Provider</th>
        <th>Fixture</th>
        <th>Latency</th>
        <th>Score</th>
        <th>Fields</th>
        <th>Summary Words</th>
        <th>JSON</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${data.raw
        .map((row) => {
          const model = models.find((m) => m.id === row.modelId);
          const color = model?.color || '#94a3b8';
          const scoreBar = `
            <div class="bar-inline">
              ${row.score}
              <div class="bar-bg"><div class="bar-fill" style="width:${(row.score / 10) * 100}%;background:${color}"></div></div>
            </div>`;
          return `
      <tr>
        <td><span class="rank-dot" style="background:${color};display:inline-block;vertical-align:middle;margin-right:6px"></span>${row.modelName}</td>
        <td style="color:#64748b">${row.provider}</td>
        <td style="color:#64748b">${row.fixture}</td>
        <td>${row.error ? '—' : row.latency + 'ms'}</td>
        <td>${row.error ? '—' : scoreBar}</td>
        <td>${row.error ? '—' : row.fieldsPresent + '/6'}</td>
        <td>${row.error ? '—' : row.summaryWordCount}</td>
        <td>${row.error ? '—' : `<span class="tag ${row.jsonValid ? 'tag-ok' : 'tag-err'}">${row.jsonValid ? 'valid' : 'invalid'}</span>`}</td>
        <td>${row.error ? `<span class="tag tag-err">error</span>` : `<span class="tag tag-ok">ok</span>`}</td>
      </tr>`;
        })
        .join('')}
    </tbody>
  </table>
</div>

<p class="footer">Generated by WhatsApp Thread Summarizer — LLM Comparison Tool</p>

<!-- ── Chart.js ── -->
<script>
const LABELS  = ${JSON.stringify(labels)};
const COLORS  = ${JSON.stringify(colors)};
const FADED   = ${JSON.stringify(colorsFaded)};

const SCORES   = ${JSON.stringify(models.map((m) => m.avgScore))};
const LATENCY  = ${JSON.stringify(models.map((m) => m.avgLatency))};
const JSON_ADH = ${JSON.stringify(models.map((m) => m.jsonAdherence))};
const WORDS    = ${JSON.stringify(models.map((m) => m.avgSummaryWords))};
const FIELDS   = ${JSON.stringify(models.map((m) => m.avgFieldsPresent))};

const FIXTURE_LABELS = ${JSON.stringify(data.fixtures)};
const FIXTURE_DATA   = ${JSON.stringify(fixtureScores)};

Chart.defaults.color = '#64748b';
Chart.defaults.borderColor = '#1e293b';
Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const barDefaults = (label, data, indexAxis = 'x') => ({
  type: 'bar',
  data: {
    labels: LABELS,
    datasets: [{
      label,
      data,
      backgroundColor: COLORS,
      borderColor: COLORS,
      borderWidth: 1,
      borderRadius: 6,
    }]
  },
  options: {
    indexAxis,
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: '#1e293b' } },
      y: { grid: { color: '#1e293b' } }
    }
  }
});

// Quality Score
new Chart(document.getElementById('chartScore'), barDefaults('Quality Score', SCORES));

// Latency
new Chart(document.getElementById('chartLatency'), {
  ...barDefaults('Latency (ms)', LATENCY),
  options: {
    ...barDefaults('Latency (ms)', LATENCY).options,
    scales: {
      x: { grid: { color: '#1e293b' } },
      y: { grid: { color: '#1e293b' }, reverse: false }
    }
  }
});

// JSON Adherence
new Chart(document.getElementById('chartJson'), barDefaults('JSON Adherence (%)', JSON_ADH));

// Summary Word Count
new Chart(document.getElementById('chartWords'), barDefaults('Avg Summary Words', WORDS));

// Radar
const normalize = (arr, max) => arr.map(v => Math.round((v / max) * 100));
const latencyNorm = LATENCY.map(v => {
  const maxL = Math.max(...LATENCY);
  return maxL === 0 ? 0 : Math.round((1 - v / maxL) * 100); // invert — lower latency = higher score
});

new Chart(document.getElementById('chartRadar'), {
  type: 'radar',
  data: {
    labels: ['Quality Score', 'Speed (inv.)', 'JSON Adherence', 'Fields Present', 'Summary Length'],
    datasets: LABELS.map((label, i) => ({
      label,
      data: [
        normalize(SCORES, 10)[i],
        latencyNorm[i],
        JSON_ADH[i],
        normalize(FIELDS, 6)[i],
        normalize(WORDS, Math.max(...WORDS) || 1)[i],
      ],
      backgroundColor: FADED[i],
      borderColor: COLORS[i],
      borderWidth: 2,
      pointBackgroundColor: COLORS[i],
      pointRadius: 4,
    }))
  },
  options: {
    responsive: true,
    scales: {
      r: {
        min: 0,
        max: 100,
        grid: { color: '#1e293b' },
        ticks: { display: false },
        pointLabels: { color: '#94a3b8', font: { size: 12 } }
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#94a3b8', padding: 16, boxWidth: 12 }
      }
    }
  }
});

// Per-fixture grouped bar
new Chart(document.getElementById('chartFixture'), {
  type: 'bar',
  data: {
    labels: FIXTURE_LABELS,
    datasets: LABELS.map((label, i) => ({
      label,
      data: FIXTURE_DATA.map(f => f.scores[i]),
      backgroundColor: FADED[i],
      borderColor: COLORS[i],
      borderWidth: 2,
      borderRadius: 4,
    }))
  },
  options: {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#94a3b8', padding: 16, boxWidth: 12 }
      }
    },
    scales: {
      x: { grid: { color: '#1e293b' } },
      y: { grid: { color: '#1e293b' }, min: 0, max: 10 }
    }
  }
});
</script>
</body>
</html>`;

// ─── Helper for rank rows ──────────────────────────────────────────────────

function rankRow(m, i, val) {
  const posClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'other';
  return `
    <div class="rank-item">
      <div class="rank-pos ${posClass}">${i + 1}</div>
      <div class="rank-dot" style="background:${m.color}"></div>
      <div class="rank-name">${m.name}</div>
      <div class="rank-val">${val}</div>
    </div>`;
}

// ─── Write ─────────────────────────────────────────────────────────────────

fs.writeFileSync(outputPath, html);
console.log(`\nReport generated → results/report.html\nOpen it in any browser.\n`);
