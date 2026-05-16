# Backend Test Coverage Report

**Generated:** 2026-05-16
**Command:** `npm run test:coverage`
**Jest config:** `backend/package.json` → `"jest"` block

---

## Coverage Summary

```
---------------------|---------|----------|---------|---------|-------------------
File                 | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
---------------------|---------|----------|---------|---------|-------------------
All files            |   87.92 |    57.53 |   86.51 |   88.65 |
 src                 |   96.29 |   100.00 |    0.00 |   96.29 |
  app.js             |   96.29 |   100.00 |    0.00 |   96.29 | 24
 src/export          |   42.10 |    18.18 |   33.33 |   47.05 |
  briefTemplate.js   |   42.10 |    18.18 |   33.33 |   47.05 | 22-23,64-70,119
 src/middleware      |   63.63 |    26.31 |   50.00 |   63.63 |
  authenticate.js    |   92.85 |    83.33 |  100.00 |   92.85 | 30
  errorHandler.js    |   12.50 |     0.00 |    0.00 |   12.50 | 5-19
 src/parser          |   92.07 |    84.78 |  100.00 |   93.40 |
  chunkMessages.js   |   96.29 |    86.66 |  100.00 |  100.00 | 22,58
  whatsappParser.js  |   90.54 |    83.87 |  100.00 |   91.04 | 55-60
 src/routes          |   89.45 |    63.71 |   84.61 |   89.58 |
  authRoutes.js      |   89.74 |    83.33 |  100.00 |   89.74 | 54,64,69,82
  briefRoutes.js     |   87.50 |    56.25 |   90.90 |   87.93 | 48-62,152,169
  exportRoutes.js    |   92.30 |   100.00 |  100.00 |   92.30 | 21
  historyRoutes.js   |   90.32 |    77.77 |  100.00 |   90.32 | 36,47,68
  replyRoutes.js     |   92.85 |   100.00 |  100.00 |   92.85 | 32
  summarizeRoutes.js |   85.36 |    41.66 |   58.33 |   84.61 | 73-80
  uploadRoutes.js    |   92.59 |    70.00 |  100.00 |   93.47 | 105-112
 src/summarizer      |   90.76 |    59.57 |  100.00 |   91.86 |
  briefComposer.js   |   97.14 |    66.10 |  100.00 |   96.96 | 76
  promptBuilder.js   |  100.00 |    66.66 |  100.00 |  100.00 | 86-106
  replyDrafter.js    |   87.87 |    50.00 |  100.00 |   87.87 | 113,123,159-160
  responseParsers.js |   69.56 |    36.84 |  100.00 |   72.22 | 21-22,27-28,58
  summarizer.js      |  100.00 |    65.51 |  100.00 |  100.00 | 34-39
---------------------|---------|----------|---------|---------|-------------------

Test Suites: 7 passed, 7 total
Tests:       63 passed, 63 total
```

---

## Detailed Metrics

| Metric     | Current | CI Threshold | Status |
|------------|---------|--------------|--------|
| Lines      | 88.65%  | ≥ 70%        | ✓ PASS |
| Statements | 87.92%  | ≥ 70%        | ✓ PASS |
| Functions  | 86.51%  | ≥ 70%        | ✓ PASS |
| Branches   | 57.53%  | ≥ 50%        | ✓ PASS |

**CI Threshold** = enforced in `package.json`; build fails if coverage drops below this.

### Excluded from collection (by design)

| Pattern | Reason |
|---------|--------|
| `src/server.js` | Process bootstrap; not unit-testable |
| `src/config/**` | Infrastructure init (Supabase, LLM providers); requires live services |
| `src/models/**` | Supabase persistence layer; mocked in all test suites by design |
| `src/services/**` | Provider-level LLM service; mocked in all test suites by design |
| `src/export/pdfExporter.js` | Puppeteer wrapper; requires headless Chromium; mocked in integration tests |

---

## Uncovered Lines & Technical Debt

The following files have partial coverage. They are not blocking the CI threshold but represent future improvement opportunities.

### `src/middleware/errorHandler.js` — 12% line coverage

- **Gap:** Error handler is only exercised indirectly. No direct test calls the middleware with a constructed error object.
- **Uncovered:** Lines 5–19 — the status derivation, production message redaction, and stack-trace-strip logic.
- **Action:** Add a `middleware.test.js` calling `errorHandler(err, req, res, next)` directly with `NODE_ENV=production` and `NODE_ENV=development` to cover both branches.

### `src/export/briefTemplate.js` — 47% line coverage

- **Gap:** The HTML escape function (`esc()`) and `actionRequired: true` card rendering are not exercised.
- **Uncovered:** Lines 22–23 (esc edge cases), 64–70 (action-required pill), 119 (footer).
- **Action:** Add unit tests for `renderBriefHTML()` with `actionRequired: true` cards and user content containing HTML special characters (`<`, `>`, `&`, `"`, `'`).

### `src/routes/briefRoutes.js` — 56% branch coverage

- **Gap:** Multer error branches for oversized files and unexpected field names are not exercised.
- **Uncovered:** Lines 48–62 (multer error handlers), 152 and 169 (pipeline error fallback).
- **Action:** Add Supertest tests with `LIMIT_FILE_SIZE` and `LIMIT_UNEXPECTED_FILE` multer error simulation.

### `src/routes/summarizeRoutes.js` — 42% branch coverage

- **Gap:** Multi-chunk summarization path (messages large enough to produce > 1 chunk) is not tested; merge branch not exercised.
- **Uncovered:** Lines 73–80 (multi-chunk merge path).
- **Action:** Send a `messages` array large enough to exceed `chunkMessages` default of 7500 tokens to trigger the multi-chunk + `mergeSummaries` path.

### `src/summarizer/responseParsers.js` — 37% branch coverage

- **Gap:** Fallback parsing paths (non-JSON LLM responses, missing array fields, null input) have partial coverage.
- **Uncovered:** Lines 21–22, 27–28, 58 — malformed/empty/null input handling.
- **Action:** The existing `summarizer.test.js` covers some of these; extend with edge-case inputs for `parseSummaryResponse`.

---

*Paste updated terminal output under "Coverage Summary" after each `npm run test:coverage` run. HTML report available at `backend/coverage/lcov-report/index.html`.*
